/**
 * D안 — 감사 로그 조회 API 통합 테스트.
 *
 * 검증 포인트:
 *   1) admin만 조회 가능 — manager/staff는 403.
 *   2) 미인증은 401.
 *   3) /dates: 로그가 있는 날짜만 반환.
 *   4) /?date=...&resource=&action=&q= 필터가 정확히 적용된다.
 *   5) /summary는 action/resource/user별 카운트를 반환한다.
 *   6) path traversal 시도(date에 "../" 등)는 400으로 거부.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-audit-logs-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-D";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const auditLogsRoute = (await import("../../routes/audit-logs.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers } = await import("../../db/schema.js");

const PASSWORD = "test-password-1234";
const USERS = {
  admin:   "al-admin",
  manager: "al-manager",
  staff:   "al-staff",
};

const TODAY = new Date().toISOString().slice(0, 10);

let app;
let supertest;

/** 테스트용 감사 로그 파일 작성 */
function seedAuditLog(date, entries) {
  const dir = path.join(TMP_DIR, "audit");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `audit-${date}.jsonl`);
  fs.writeFileSync(file, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  for (const [role, username] of Object.entries(USERS)) {
    await db.insert(adminUsers).values({
      username,
      passwordHash: hashPassword(PASSWORD),
      name: `AL ${role}`,
      role,
    });
  }

  // 오늘자 + 어제자 시드
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  seedAuditLog(TODAY, [
    { timestamp: `${TODAY}T10:00:00.000Z`, action: "create",  resource: "invoices",      resourceId: "inv-1", userId: "u1", userName: "관리자A", ip: "127.0.0.1", details: { fields: ["clientId", "items"] } },
    { timestamp: `${TODAY}T10:05:00.000Z`, action: "delete",  resource: "invoices",      resourceId: "inv-2", userId: "u1", userName: "관리자A", ip: "127.0.0.1" },
    { timestamp: `${TODAY}T10:10:00.000Z`, action: "create",  resource: "payment_cards", resourceId: "pc-1",  userId: "u2", userName: "매니저B", ip: "127.0.0.1" },
    { timestamp: `${TODAY}T10:20:00.000Z`, action: "login_fail.bad_password", resource: "security", resourceId: null, userId: null, userName: null, ip: "203.0.113.7", details: { username: "guess" } },
  ]);
  seedAuditLog(yesterday, [
    { timestamp: `${yesterday}T09:00:00.000Z`, action: "create", resource: "messages", resourceId: "m-1", userId: "u1", userName: "관리자A", ip: "127.0.0.1" },
  ]);

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/audit-logs", auditLogsRoute);
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

async function loginAs(role) {
  const agent = supertest.agent(app);
  await agent.get("/api/admin-users/me");
  await agent.post("/api/admin-users/login").send({ username: USERS[role], password: PASSWORD });
  return agent;
}

describe("D안: GET /api/audit-logs — 권한", () => {
  it("미인증은 401", async () => {
    const res = await supertest(app).get("/api/audit-logs");
    expect(res.status).toBe(401);
  });

  it("manager는 403 — admin 전용", async () => {
    const agent = await loginAs("manager");
    const res = await agent.get("/api/audit-logs");
    expect(res.status).toBe(403);
  });

  it("staff도 403", async () => {
    const agent = await loginAs("staff");
    const res = await agent.get("/api/audit-logs");
    expect(res.status).toBe(403);
  });

  it("admin은 통과 — 200", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs?date=${TODAY}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // 시드된 4건 + 로그인 시 자동 기록되는 보안 이벤트가 추가되므로 ≥ 4 검증
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
  });
});

describe("D안: 필터링", () => {
  it("resource=invoices 로 필터하면 invoices 항목만 반환", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs?date=${TODAY}&resource=invoices`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((e) => e.resource === "invoices")).toBe(true);
  });

  it("action=delete 로 필터하면 삭제만 반환", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs?date=${TODAY}&action=delete`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe("delete");
  });

  it("q= IP 부분일치로 보안 이벤트를 찾는다", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs?date=${TODAY}&q=203.0.113`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].resource).toBe("security");
  });

  it("결과는 timestamp 내림차순(최신 우선)", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs?date=${TODAY}`);
    const ts = res.body.data.map((e) => e.timestamp);
    const sorted = [...ts].sort().reverse();
    expect(ts).toEqual(sorted);
  });
});

describe("D안: /dates", () => {
  it("로그가 있는 날짜를 최신순으로 반환", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get("/api/audit-logs/dates");
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toBe(TODAY); // 최신이 첫번째
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe("D안: /summary", () => {
  it("action/resource/user별 카운트를 반환", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get(`/api/audit-logs/summary?date=${TODAY}`);
    expect(res.status).toBe(200);
    // 시드 4건 + 로그인 보안 이벤트가 더 들어올 수 있어 정확한 total 비교는 하지 않는다.
    // 대신 시드된 카테고리의 카운트를 직접 검증.
    expect(res.body.data.byResource.invoices).toBe(2);
    expect(res.body.data.byResource.payment_cards).toBe(1);
    expect(res.body.data.byUser["관리자A"]).toBe(2);
  });
});

describe("D안: path traversal 방어", () => {
  it("잘못된 date 형식은 400으로 거부", async () => {
    const agent = await loginAs("admin");
    const res = await agent.get("/api/audit-logs?date=../etc/passwd");
    expect(res.status).toBe(400);
  });
});
