/**
 * 계약서(contracts) 라우트 통합 테스트 — 관리자 인증 후 목록/상세/생성 + 인증 없는 호출 401 검증.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-contracts-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-2";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const contractsRoute = (await import("../../routes/contracts.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers } = await import("../../db/schema.js");

const TEST_USERNAME = "contracts-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "계약서 테스트 관리자",
    role: "admin",
  }).returning();

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/contracts", contractsRoute);
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

/** 응답 헤더에서 csrf-token 쿠키 값을 추출 */
function getCsrfTokenFromResponse(res) {
  const setCookie = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/^csrf-token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

/** 관리자 로그인 후 csrf 토큰 + 인증된 agent를 반환 */
async function loginAsAdmin() {
  const agent = supertest.agent(app);
  const init = await agent.get("/api/admin-users/me");
  const csrf = getCsrfTokenFromResponse(init);
  await agent
    .post("/api/admin-users/login")
    .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
  return { agent, csrf };
}

describe("계약서 라우트 (/api/contracts)", () => {
  it("GET / — 관리자 인증 시 빈 목록을 반환한다", async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.get("/api/contracts");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("count");
  });

  it("POST / — 계약서를 생성하고 GET /:id로 상세 조회 가능하다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/contracts")
      .set("x-csrf-token", csrf)
      .send({
        type: "engagement",
        title: "테스트 위임계약서",
        contentJson: { type: "doc", content: [] },
        contentHtml: "<p>본문</p>",
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.data.contract.title).toBe("테스트 위임계약서");
    expect(createRes.body.data.contract.status).toBe("draft");
    const id = createRes.body.data.contract.id;

    const detailRes = await agent.get(`/api/contracts/${id}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.contract.id).toBe(id);
    expect(Array.isArray(detailRes.body.data.parties)).toBe(true);
  });

  it("POST / — title/contentJson 누락 시 400을 반환한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const res = await agent
      .post("/api/contracts")
      .set("x-csrf-token", csrf)
      .send({ type: "engagement" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("필수");
  });

  it("GET / — 인증 없으면 401을 반환한다", async () => {
    const res = await supertest(app).get("/api/contracts");
    expect(res.status).toBe(401);
  });
});
