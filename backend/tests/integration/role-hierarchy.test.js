/**
 * B안 — 역할 3단계(admin/manager/staff) 계층 권한 통합 테스트.
 *
 * 검증 포인트:
 *   1) requireMinRole("manager"): admin/manager는 통과, staff는 403.
 *   2) requireRole("admin")(A안): admin만 통과 — manager/staff 모두 403.
 *   3) editor는 manager의 레거시 별칭이므로 manager와 동일하게 동작.
 *   4) 감사 로그 미들웨어가 위험 라우트의 쓰기 작업을 기록한다.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yjlaw-role-hierarchy-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-A";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const invoicesRoute = (await import("../../routes/invoices.js")).default;
const paymentCardsRoute = (await import("../../routes/payment-cards.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers, clients } = await import("../../db/schema.js");

const PASSWORD = "test-password-1234";
const USERS = {
  admin:   "rh-admin",
  manager: "rh-manager",
  staff:   "rh-staff",
  editor:  "rh-editor",
};

let app;
let supertest;
let testClientId;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  for (const [role, username] of Object.entries(USERS)) {
    await db.insert(adminUsers).values({
      username,
      passwordHash: hashPassword(PASSWORD),
      name: `RH ${role}`,
      role,
    });
  }

  const [client] = await db.insert(clients).values({
    name: "역할테스트 고객",
    phone: "010-3333-4444",
    email: "rh@example.com",
    source: "manual",
  }).returning();
  testClientId = client.id;

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/invoices", invoicesRoute);
  app.use("/api/payment-cards", paymentCardsRoute);
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

function getCsrf(res) {
  const setCookie = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/^csrf-token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

async function loginAs(role) {
  const agent = supertest.agent(app);
  const init = await agent.get("/api/admin-users/me");
  const csrf = getCsrf(init);
  await agent.post("/api/admin-users/login").send({ username: USERS[role], password: PASSWORD });
  return { agent, csrf };
}

/** 인보이스 생성을 시도하여 권한 게이트 결과만 검증 */
async function tryCreateInvoice(role) {
  const { agent, csrf } = await loginAs(role);
  return agent
    .post("/api/invoices")
    .set("x-csrf-token", csrf)
    .send({
      type: "simple",
      clientId: testClientId,
      vatRate: 0,
      items: [{ description: "권한 테스트", quantity: 1, unitPrice: 10000 }],
    });
}

describe("B안: requireMinRole(\"manager\") — 인보이스 생성", () => {
  it("staff는 403 — 결제 발행 권한 없음", async () => {
    const res = await tryCreateInvoice("staff");
    expect(res.status).toBe(403);
  });

  it("manager는 통과 — 201 생성", async () => {
    const res = await tryCreateInvoice("manager");
    expect(res.status).toBe(201);
  });

  it("editor(레거시)는 manager와 동등 — 통과", async () => {
    const res = await tryCreateInvoice("editor");
    expect(res.status).toBe(201);
  });

  it("admin은 당연히 통과", async () => {
    const res = await tryCreateInvoice("admin");
    expect(res.status).toBe(201);
  });
});

describe("B안: requireRole(\"admin\") — 카드 삭제(A안 그대로 유지)", () => {
  let cardId;
  beforeAll(async () => {
    // admin으로 카드 1개 생성 (manager가 PASSED인지 확인 겸)
    const { agent, csrf } = await loginAs("admin");
    const r = await agent
      .post("/api/payment-cards")
      .set("x-csrf-token", csrf)
      .send({ last4: "9999", issuer: "테스트", label: "RH 카드" });
    cardId = r.body.data.id;
  });

  it("manager는 카드 삭제 403 — 위험 작업은 admin 전용", async () => {
    const { agent, csrf } = await loginAs("manager");
    const res = await agent
      .delete(`/api/payment-cards/${cardId}`)
      .set("x-csrf-token", csrf);
    expect(res.status).toBe(403);
  });

  it("staff도 당연히 403", async () => {
    const { agent, csrf } = await loginAs("staff");
    const res = await agent
      .delete(`/api/payment-cards/${cardId}`)
      .set("x-csrf-token", csrf);
    expect(res.status).toBe(403);
  });

  it("admin만 통과 (200)", async () => {
    const { agent, csrf } = await loginAs("admin");
    const res = await agent
      .delete(`/api/payment-cards/${cardId}`)
      .set("x-csrf-token", csrf);
    expect(res.status).toBe(200);
  });
});

describe("B안: 감사 로그가 인보이스 라우트의 쓰기 작업을 기록", () => {
  it("manager가 인보이스를 생성하면 audit-*.jsonl 파일에 기록된다", async () => {
    const before = countAuditEntries("invoices");
    const res = await tryCreateInvoice("manager");
    expect(res.status).toBe(201);

    const after = countAuditEntries("invoices");
    expect(after).toBeGreaterThan(before);
  });
});

/** 오늘 날짜의 audit-YYYY-MM-DD.jsonl에서 resource=name인 항목 수 */
function countAuditEntries(resource) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const file = path.join(TMP_DIR, "audit", `audit-${dateStr}.jsonl`);
  if (!fs.existsSync(file)) return 0;
  const lines = fs.readFileSync(file, "utf-8").split("\n").filter(Boolean);
  return lines.filter((l) => {
    try { return JSON.parse(l).resource === resource; } catch { return false; }
  }).length;
}
