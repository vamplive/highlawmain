/**
 * 인보이스(invoices) 라우트 통합 테스트 — 관리자 인증 후 목록/상세/생성 + 인증 없는 호출 401 검증.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-invoices-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-3";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const invoicesRoute = (await import("../../routes/invoices.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers, clients } = await import("../../db/schema.js");

const TEST_USERNAME = "invoices-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;
let testClientId;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "인보이스 테스트 관리자",
    role: "admin",
  }).returning();

  // 인보이스 생성 시 clientId가 필수 — 테스트용 고객 한 명을 먼저 만든다
  const [client] = await db.insert(clients).values({
    name: "테스트 고객",
    phone: "010-1111-2222",
    email: "client@example.com",
    source: "manual",
  }).returning();
  testClientId = client.id;

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/invoices", invoicesRoute);
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

function getCsrfTokenFromResponse(res) {
  const setCookie = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/^csrf-token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

async function loginAsAdmin() {
  const agent = supertest.agent(app);
  const init = await agent.get("/api/admin-users/me");
  const csrf = getCsrfTokenFromResponse(init);
  await agent
    .post("/api/admin-users/login")
    .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
  return { agent, csrf };
}

describe("인보이스 라우트 (/api/invoices)", () => {
  it("GET / — 관리자 인증 시 페이지네이션 메타와 함께 목록을 반환한다", async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.get("/api/invoices");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("total");
  });

  it("POST / — 인보이스 생성 후 GET /:id로 상세 조회 가능하다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/invoices")
      .set("x-csrf-token", csrf)
      .send({
        type: "simple",
        clientId: testClientId,
        vatRate: 10,
        items: [
          { description: "법률 자문 수임료", quantity: 1, unitPrice: 1000000 },
        ],
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe("draft");
    expect(createRes.body.data.client_id).toBe(testClientId);
    const id = createRes.body.data.id;

    const detailRes = await agent.get(`/api/invoices/${id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.id).toBe(id);
    expect(Array.isArray(detailRes.body.data.items)).toBe(true);
    expect(detailRes.body.data.items.length).toBe(1);
  });

  it("POST / — clientId 누락 시 400을 반환한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const res = await agent
      .post("/api/invoices")
      .set("x-csrf-token", csrf)
      .send({ type: "simple", items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("고객");
  });

  it("GET / — 인증 없으면 401을 반환한다", async () => {
    const res = await supertest(app).get("/api/invoices");
    expect(res.status).toBe(401);
  });
});
