/**
 * 포털 인증 흐름 통합 테스트 — HttpOnly 쿠키 전환 검증.
 *
 * 검증 시나리오:
 *   1) 회원가입 → 로그인 시 HttpOnly portal_session 쿠키 발급
 *   2) 쿠키로 /me 인증 통과
 *   3) 로그아웃 → 쿠키 무효화 → /me 401
 *   4) x-portal-token 헤더 폴백 인증 (모바일 앱 호환)
 *   5) 잘못된 자격증명 및 사용자 미존재 모두 401 + 동일 메시지
 *   6) 인증 없는 보호 라우트(/cases) 401
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yjlaw-portal-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-1";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const portalRoute = (await import("../../routes/portal.js")).default;

const TEST_EMAIL = "portal-user@example.com";
const TEST_PASSWORD = "portal-password-1234";
const TEST_NAME = "테스트 의뢰인";
const TEST_PHONE = "010-0000-0000";

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/portal", portalRoute);

  // 테스트용 포털 사용자 — register 엔드포인트를 통해 생성한다
  await supertest(app)
    .post("/api/portal/register")
    .send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
      phone: TEST_PHONE,
    });
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

/** Set-Cookie 헤더에서 특정 쿠키 값을 추출 */
function getCookieFromResponse(res, name) {
  const setCookie = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(new RegExp(`^${name}=([^;]+)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

describe("포털 인증 흐름 (HttpOnly 쿠키)", () => {
  it("로그인 성공 시 HttpOnly portal_session 쿠키를 발급한다", async () => {
    const loginRes = await supertest(app)
      .post("/api/portal/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeTruthy();
    expect(loginRes.body.data.user.email).toBe(TEST_EMAIL);

    const setCookie = loginRes.headers["set-cookie"] || [];
    const sessionCookie = setCookie.find((c) => c.startsWith("portal_session="));
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Strict");
  });

  it("발급된 쿠키로 /me 호출이 통과한다", async () => {
    const agent = supertest.agent(app);
    // csrf 쿠키 발급
    await agent.get("/api/portal/me");

    const loginRes = await agent
      .post("/api/portal/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(loginRes.status).toBe(200);

    const meRes = await agent.get("/api/portal/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(TEST_EMAIL);
  });

  it("로그아웃 후 같은 쿠키로는 더 이상 인증되지 않는다", async () => {
    const agent = supertest.agent(app);

    // 첫 GET으로 csrf 토큰 보관
    const init = await agent.get("/api/portal/me");
    const csrf = getCookieFromResponse(init, "csrf-token");
    expect(csrf).toBeTruthy();

    await agent
      .post("/api/portal/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const logoutRes = await agent
      .post("/api/portal/logout")
      .set("x-csrf-token", csrf);
    expect(logoutRes.status).toBe(200);

    const meAfter = await agent.get("/api/portal/me");
    expect(meAfter.status).toBe(401);
  });

  it("x-portal-token 헤더 폴백으로도 인증된다 (모바일 앱/외부 호환)", async () => {
    const loginRes = await supertest(app)
      .post("/api/portal/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const token = loginRes.body.data.token;

    const meRes = await supertest(app)
      .get("/api/portal/me")
      .set("x-portal-token", token);
    expect(meRes.status).toBe(200);
  });

  it("잘못된 비밀번호는 401을 반환한다", async () => {
    const res = await supertest(app)
      .post("/api/portal/login")
      .send({ email: TEST_EMAIL, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("올바르지 않습니다");
  });

  it("존재하지 않는 사용자도 401과 동일 메시지를 반환한다 (열거 방어)", async () => {
    const res = await supertest(app)
      .post("/api/portal/login")
      .send({ email: "no-such-user@example.com", password: "any-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("올바르지 않습니다");
  });

  it("인증 없이 보호 라우트(/cases)는 401", async () => {
    const res = await supertest(app).get("/api/portal/cases");
    expect(res.status).toBe(401);
  });
});
