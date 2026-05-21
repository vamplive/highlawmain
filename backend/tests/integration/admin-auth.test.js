/**
 * 어드민 인증 흐름 통합 테스트 — supertest로 실제 Express 앱을 띄워 검증.
 *
 * 검증 시나리오:
 *   1) 로그인 성공 → HttpOnly 쿠키 발급 + 응답 body에는 세션 토큰 미노출
 *   2) 발급된 쿠키로 /me 인증 통과
 *   3) 로그아웃 → 쿠키 삭제 + 세션 무효화 (이후 /me 401)
 *   4) Authorization Bearer 폴백 인증
 *   5) 잘못된 자격증명 → 401, 사용자 미존재도 동일 응답
 *   6) 보호 라우트(목록 조회)는 인증 없으면 401
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yjlaw-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-0";
process.env.NODE_ENV = "test";

// 동적 require로 환경변수 설정 후 DB가 초기화되도록 한다
const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const { hashPassword, createSession } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers } = await import("../../db/schema.js");

const TEST_USERNAME = "testadmin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;
let adminUserId;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  // 테스트용 관리자 계정 직접 삽입
  const [insertedAdmin] = await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "테스트 관리자",
    role: "admin",
  }).returning();
  adminUserId = insertedAdmin.id;

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
});

afterAll(() => {
  // 정리
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

describe("어드민 인증 흐름 (HttpOnly 쿠키)", () => {
  it("로그인 성공 시 HttpOnly admin_session 쿠키를 발급한다", async () => {
    // 1) GET 요청으로 csrf-token 쿠키를 먼저 발급받는다 (실제 SPA와 동일 흐름)
    const csrfRes = await supertest(app).get("/api/admin-users/me");
    const csrfToken = getCsrfTokenFromResponse(csrfRes);
    expect(csrfToken).toBeTruthy();

    // 2) 로그인은 CSRF 면제 라우트라 토큰 없이도 가능
    const loginRes = await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeUndefined();
    expect(loginRes.body.data.user.username).toBe(TEST_USERNAME);

    // HttpOnly 쿠키 검증
    const setCookie = loginRes.headers["set-cookie"] || [];
    const adminSessionCookie = setCookie.find((c) => c.startsWith("admin_session="));
    expect(adminSessionCookie).toBeTruthy();
    expect(adminSessionCookie).toContain("HttpOnly");
    expect(adminSessionCookie).toContain("SameSite=Strict");
  });

  it("발급된 쿠키로 /me 호출이 통과한다", async () => {
    const agent = supertest.agent(app);
    await agent.get("/api/admin-users/me"); // csrf 쿠키 받기

    const loginRes = await agent
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
    expect(loginRes.status).toBe(200);

    // agent가 자동으로 쿠키를 유지하므로 헤더 없이도 인증됨
    const meRes = await agent.get("/api/admin-users/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.username).toBe(TEST_USERNAME);
  });

  it("로그아웃 후 같은 쿠키로는 더 이상 인증되지 않는다", async () => {
    const agent = supertest.agent(app);

    // 첫 GET에서 csrf-token 쿠키를 받아 토큰 값을 보관 (이후 같은 토큰을 헤더로 사용)
    const initRes = await agent.get("/api/admin-users/me");
    const csrfToken = getCsrfTokenFromResponse(initRes);
    expect(csrfToken).toBeTruthy();

    await agent
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });

    // 로그아웃은 보호 라우트 — csrf 헤더 필요
    const logoutRes = await agent
      .post("/api/admin-users/logout")
      .set("x-csrf-token", csrfToken);
    expect(logoutRes.status).toBe(200);

    // 쿠키가 만료되어 /me는 401
    const meAfter = await agent.get("/api/admin-users/me");
    expect(meAfter.status).toBe(401);
  });

  it("Authorization Bearer 폴백으로도 인증된다 (Swagger / 외부 호환)", async () => {
    const token = createSession(adminUserId, "admin");

    const meRes = await supertest(app)
      .get("/api/admin-users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(200);
  });

  it("잘못된 비밀번호는 401을 반환한다", async () => {
    const res = await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("올바르지 않습니다");
  });

  it("존재하지 않는 사용자도 401과 동일 메시지를 반환한다 (사용자 열거 방어)", async () => {
    const res = await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: "no-such-user", password: "any" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("올바르지 않습니다");
  });

  it("인증 없이 보호 라우트(목록)는 401", async () => {
    const res = await supertest(app).get("/api/admin-users/");
    expect(res.status).toBe(401);
  });

  it("로그인 실패가 보안 감사 로그(resource=security)에 기록된다", async () => {
    // 같은 일자 audit 파일을 직접 읽어 새 항목이 추가됐는지 확인
    const dateStr = new Date().toISOString().slice(0, 10);
    const auditFile = path.join(TMP_DIR, "audit", `audit-${dateStr}.jsonl`);

    await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: "definitely-wrong-password" });

    expect(fs.existsSync(auditFile)).toBe(true);
    const lines = fs.readFileSync(auditFile, "utf8").trim().split("\n");
    const entries = lines.map((l) => JSON.parse(l));
    const securityEvents = entries.filter((e) => e.resource === "security");
    expect(securityEvents.some((e) => e.action === "login_fail.bad_password")).toBe(true);

    // 미존재 username 케이스도 별도 분기로 기록되는지 확인
    await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: "ghost-user", password: "any" });
    const linesAfter = fs.readFileSync(auditFile, "utf8").trim().split("\n");
    const entriesAfter = linesAfter.map((l) => JSON.parse(l));
    expect(entriesAfter.some((e) => e.resource === "security" && e.action === "login_fail.no_user")).toBe(true);
  });
});

// =============================================
// 비밀번호 재설정 플로우 (토큰 기반 reset link)
// =============================================
describe("비밀번호 재설정 플로우", () => {
  // 헬퍼: DB에서 직접 reset_token_hash를 읽어, 메일로 발송된 평문 토큰 대신
  // 해시값으로 검증한다 (테스트 환경엔 실제 메일이 발송되지 않음).
  // 실제 사용자 흐름은 메일 링크의 평문 토큰을 그대로 POST한다.
  async function readStoredToken(userId) {
    const { sqlite } = await import("../../db/index.js");
    return sqlite
      .prepare("SELECT reset_token_hash, reset_token_expires_at FROM admin_users WHERE id = ?")
      .get(userId);
  }

  it("forgot-password 호출만으로는 비밀번호와 세션이 변경되지 않는다 (DoS 방어)", async () => {
    const { db } = await import("../../db/index.js");
    const { adminUsers: au } = await import("../../db/schema.js");
    const { eq } = await import("drizzle-orm");

    // 1) 등록된 이메일을 세팅
    await db.update(au).set({ email: "test@example.com" }).where(eq(au.username, TEST_USERNAME));

    // 2) 활성 세션 생성
    const activeToken = createSession(adminUserId, "admin");
    const me1 = await supertest(app).get("/api/admin-users/me").set("Authorization", `Bearer ${activeToken}`);
    expect(me1.status).toBe(200);

    // 3) forgot-password 호출 (실제 메일은 발송되지 않더라도 토큰은 발급되어 DB 저장)
    const res = await supertest(app)
      .post("/api/admin-users/forgot-password")
      .send({ username: TEST_USERNAME });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);

    // 4) 기존 비밀번호로 여전히 로그인 가능 (비번 미변경)
    const loginAfter = await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
    expect(loginAfter.status).toBe(200);

    // 5) 기존 활성 세션도 유효 (강제 로그아웃 없음)
    const me2 = await supertest(app).get("/api/admin-users/me").set("Authorization", `Bearer ${activeToken}`);
    expect(me2.status).toBe(200);

    // 6) 그래도 reset_token_hash는 DB에 저장돼 있어 메일 링크가 유효함
    const stored = await readStoredToken(adminUserId);
    expect(stored.reset_token_hash).toBeTruthy();
    expect(stored.reset_token_expires_at).toBeGreaterThan(Date.now());
  });

  it("미존재 username도 200 OK 동일 응답 (사용자 열거 방어)", async () => {
    const res = await supertest(app)
      .post("/api/admin-users/forgot-password")
      .send({ username: "no-such-user-xyz" });
    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(true);
  });

  it("잘못된 reset 토큰은 400으로 거부", async () => {
    const res = await supertest(app)
      .post("/api/admin-users/reset-password")
      .send({ token: "0".repeat(64), password: "new-password-1234" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("유효하지 않");
  });

  it("올바른 토큰으로 비밀번호 재설정 + 토큰 1회용 폐기 + 세션 무효화", async () => {
    const { db } = await import("../../db/index.js");
    const { adminUsers: au } = await import("../../db/schema.js");
    const { eq } = await import("drizzle-orm");
    const crypto = await import("node:crypto");

    // 1) 평문 토큰을 직접 만들어 DB에 저장 (실제 흐름은 forgot-password가 메일에 평문 토큰을 보냄)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await db.update(au).set({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: Date.now() + 30 * 60 * 1000,
    }).where(eq(au.id, adminUserId));

    // 2) 기존 세션 1개 발급
    const oldToken = createSession(adminUserId, "admin");
    const meOld = await supertest(app).get("/api/admin-users/me").set("Authorization", `Bearer ${oldToken}`);
    expect(meOld.status).toBe(200);

    // 3) reset-password 호출
    const NEW_PW = "brand-new-password-9876";
    const reset = await supertest(app)
      .post("/api/admin-users/reset-password")
      .send({ token: rawToken, password: NEW_PW });
    expect(reset.status).toBe(200);
    expect(reset.body.data.reset).toBe(true);

    // 4) 새 비밀번호로 로그인 가능
    const loginNew = await supertest(app)
      .post("/api/admin-users/login")
      .send({ username: TEST_USERNAME, password: NEW_PW });
    expect(loginNew.status).toBe(200);

    // 5) 기존 세션은 무효화됨
    const meAfter = await supertest(app).get("/api/admin-users/me").set("Authorization", `Bearer ${oldToken}`);
    expect(meAfter.status).toBe(401);

    // 6) 같은 토큰 재사용은 거부됨 (1회용)
    const replay = await supertest(app)
      .post("/api/admin-users/reset-password")
      .send({ token: rawToken, password: "yet-another-pw-1234" });
    expect(replay.status).toBe(400);

    // 후속 테스트 영향 방지 — 비밀번호를 원복
    await db.update(au).set({ passwordHash: hashPassword(TEST_PASSWORD) }).where(eq(au.id, adminUserId));
  });

  it("만료된 토큰은 거부", async () => {
    const { db } = await import("../../db/index.js");
    const { adminUsers: au } = await import("../../db/schema.js");
    const { eq } = await import("drizzle-orm");
    const crypto = await import("node:crypto");

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await db.update(au).set({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: Date.now() - 1000, // 이미 만료
    }).where(eq(au.id, adminUserId));

    const res = await supertest(app)
      .post("/api/admin-users/reset-password")
      .send({ token: rawToken, password: "another-new-pw-1234" });
    expect(res.status).toBe(400);
  });

  it("8자 미만 새 비밀번호는 400", async () => {
    const res = await supertest(app)
      .post("/api/admin-users/reset-password")
      .send({ token: "x".repeat(64), password: "short" });
    expect(res.status).toBe(400);
  });
});
