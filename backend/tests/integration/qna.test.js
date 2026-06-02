/**
 * 법률 Q&A 라우트 통합 테스트 — 공개 카테고리/질문 + 관리자 카테고리 생성 + 인증 없는 보호 라우트 검증.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-qna-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-4";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const qnaRoute = (await import("../../routes/qna.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers, qnaCategories, qnaQuestions } = await import("../../db/schema.js");

const TEST_USERNAME = "qna-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;
let publishedSlug;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "Q&A 테스트 관리자",
    role: "admin",
  }).returning();

  // 카테고리 트리 구성: 건설(depth 0) → 시공(depth 1) → 공사대금(depth 2)
  const [topCat] = await db.insert(qnaCategories).values({
    name: "건설", slug: "qna-test-건설", depth: 0, sortOrder: 0,
  }).returning();

  const [midCat] = await db.insert(qnaCategories).values({
    name: "시공", slug: "qna-test-시공", parentId: topCat.id, depth: 1, sortOrder: 0,
  }).returning();

  const [leafCat] = await db.insert(qnaCategories).values({
    name: "공사대금", slug: "qna-test-공사대금", parentId: midCat.id, depth: 2, sortOrder: 0,
  }).returning();

  // 공개 목록/상세에서 보일 published 질문 하나
  publishedSlug = "qna-test-published-question";
  await db.insert(qnaQuestions).values({
    slug: publishedSlug,
    categoryId: leafCat.id,
    title: "공사대금을 받지 못했습니다",
    body: "시공자입니다. 공사대금이 미지급 상태입니다.",
    displayName: "고민하는 시공자",
    status: "published",
    publishedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  });

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/qna", qnaRoute);
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

describe("Q&A 라우트 (/api/qna)", () => {
  it("GET /questions — 공개 질문 목록을 반환한다", async () => {
    const res = await supertest(app).get("/api/qna/questions");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("GET /questions/:slug — 슬러그로 상세 조회 가능하다", async () => {
    const res = await supertest(app).get(`/api/qna/questions/${publishedSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(publishedSlug);
    expect(res.body.data).toHaveProperty("breadcrumb");
  });

  it("POST /admin/categories — 관리자가 신규 카테고리를 생성할 수 있다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const res = await agent
      .post("/api/qna/admin/categories")
      .set("x-csrf-token", csrf)
      .send({
        name: "부동산",
        slug: "qna-test-부동산",
        depth: 0,
        sortOrder: 1,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("부동산");
    expect(res.body.data.slug).toBe("qna-test-부동산");
  });

  it("GET /admin/questions — 인증 없으면 401을 반환한다", async () => {
    const res = await supertest(app).get("/api/qna/admin/questions");
    expect(res.status).toBe(401);
  });

  it("POST /questions — 본문에 포함된 <script>·이벤트 핸들러는 저장 단계에서 제거된다", async () => {
    // beforeAll에 등록된 leafCat을 다시 조회해 categoryId 확보
    const { eq } = await import("drizzle-orm");
    const [leaf] = await db
      .select()
      .from(qnaCategories)
      .where(eq(qnaCategories.slug, "qna-test-공사대금"));
    expect(leaf).toBeTruthy();

    const malicious = "안녕하세요<script>alert('xss')</script><img src=x onerror=alert(2)>본문";
    // 공개 POST에도 CSRF 토큰이 필요하므로 agent로 토큰을 받아 함께 전송
    const agent = supertest.agent(app);
    const init = await agent.get("/api/admin-users/me");
    const csrf = getCsrfTokenFromResponse(init);
    const res = await agent
      .post("/api/qna/questions")
      .set("x-csrf-token", csrf)
      .send({
        categoryId: leaf.id,
        title: "정상 제목",
        body: malicious,
        anonymityTier: 2,
      });
    expect(res.status).toBe(200);

    // DB에 저장된 body를 직접 조회해 sanitize 결과를 확인
    const [saved] = await db
      .select()
      .from(qnaQuestions)
      .where(eq(qnaQuestions.slug, res.body.data.slug));
    expect(saved).toBeTruthy();
    // <script> 자체가 사라져야 하고, on* 이벤트 속성도 제거되어야 한다
    expect(saved.body).not.toMatch(/<script/i);
    expect(saved.body).not.toMatch(/onerror/i);
    expect(saved.body).not.toMatch(/alert\(/i);
    // 정상 평문은 그대로 남는다
    expect(saved.body).toContain("안녕하세요");
    expect(saved.body).toContain("본문");
  });
});
