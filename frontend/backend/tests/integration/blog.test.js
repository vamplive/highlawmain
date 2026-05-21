/**
 * 블로그(blog) 라우트 통합 테스트 — 공개 목록/슬러그 조회 + 관리자 생성/수정 + 인증 없는 PATCH 401 검증.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yjlaw-blog-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-6";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const blogRoute = (await import("../../routes/blog.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db, sqlite } = await import("../../db/index.js");
const { adminUsers } = await import("../../db/schema.js");

const TEST_USERNAME = "blog-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "블로그 테스트 관리자",
    role: "admin",
  }).returning();

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/blog", blogRoute);
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

describe("블로그 라우트 (/api/blog)", () => {
  it("GET / — 공개 게시글 목록을 페이지네이션 메타와 함께 반환한다", async () => {
    const res = await supertest(app).get("/api/blog");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).not.toHaveProperty("content");
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("total");
  });

  it("GET /?all=true — 인증 없이는 비공개 포함 목록을 반환하지 않는다", async () => {
    const res = await supertest(app).get("/api/blog?all=true");
    expect(res.status).toBe(401);
  });

  it("POST / — 관리자가 게시글을 생성하고 슬러그로 조회 가능하다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({
        title: "테스트 건설부동산 글",
        content: "본문 내용입니다.",
        category: "construction_realestate",
        isPublished: true,
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.data.title).toBe("테스트 건설부동산 글");
    expect(createRes.body.data.slug).toBeTruthy();

    const slug = createRes.body.data.slug;
    const detailRes = await supertest(app).get(`/api/blog/${slug}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.slug).toBe(slug);
  });

  it("조회수는 상세 GET이 아니라 실제 읽기 이벤트에서만 24시간 1회 증가한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({
        title: "조회수 집계 테스트",
        content: "본문 내용입니다.",
        category: "construction_realestate",
        isPublished: true,
      });
    expect(createRes.status).toBe(200);

    const slug = createRes.body.data.slug;
    const reader = supertest.agent(app);
    const init = await reader.get(`/api/blog/${slug}`);
    const publicCsrf = getCsrfTokenFromResponse(init);
    expect(init.status).toBe(200);
    expect(init.body.data.viewCount).toBe(0);

    const secondGet = await reader.get(`/api/blog/${slug}`);
    expect(secondGet.status).toBe(200);
    expect(secondGet.body.data.viewCount).toBe(0);

    const viewRes = await reader
      .post(`/api/blog/${slug}/view`)
      .set("x-csrf-token", publicCsrf)
      .send({});
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.data.counted).toBe(true);
    expect(viewRes.body.data.viewCount).toBe(1);
    const evidence = sqlite
      .prepare("SELECT ip_masked, ip_hash, visitor_id, event_key FROM blog_view_events WHERE slug = ?")
      .get(slug);
    expect(evidence.visitor_id).toBeTruthy();
    expect(evidence.event_key).toContain(createRes.body.data.id);
    expect(evidence.ip_masked || evidence.ip_hash).toBeTruthy();

    const duplicateView = await reader
      .post(`/api/blog/${slug}/view`)
      .set("x-csrf-token", publicCsrf)
      .send({});
    expect(duplicateView.status).toBe(200);
    expect(duplicateView.body.data.counted).toBe(false);
    expect(duplicateView.body.data.viewCount).toBe(1);
  });

  it("POST / — title/content 누락 시 400을 반환한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const res = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({ category: "construction_realestate" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("필수");
  });

  it("초안 게시글은 공개 상세에서 조회되지 않고, 관리자 all 목록에는 포함된다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({
        title: "비공개 초안 글",
        content: "아직 공개하지 않은 본문입니다.",
        category: "law_guide",
        isPublished: false,
      });
    expect(createRes.status).toBe(200);

    const slug = createRes.body.data.slug;
    const publicDetail = await supertest(app).get(`/api/blog/${slug}`);
    expect(publicDetail.status).toBe(404);

    const allList = await agent.get("/api/blog?all=true");
    expect(allList.status).toBe(200);
    const draft = allList.body.data.find((p) => p.slug === slug);
    expect(draft).toBeTruthy();
    expect(draft).toHaveProperty("content", "아직 공개하지 않은 본문입니다.");
  });

  it("POST/PATCH — 태그와 예약 발행을 저장하고 예약 해제 시 공개한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const createRes = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({
        title: "예약 발행 테스트",
        content: "예약 본문입니다.",
        category: "law_guide",
        tags: ["예약", "블로그"],
        isPublished: true,
        scheduledPublishAt: future,
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.data.isPublished).toBe(0);
    expect(createRes.body.data.scheduledPublishAt).toBeTruthy();
    expect(JSON.parse(createRes.body.data.tags)).toEqual(["예약", "블로그"]);

    const slug = createRes.body.data.slug;
    const publicBefore = await supertest(app).get(`/api/blog/${slug}`);
    expect(publicBefore.status).toBe(404);

    const past = new Date(Date.now() - 60 * 1000).toISOString();
    const patchRes = await agent
      .patch(`/api/blog/${createRes.body.data.id}`)
      .set("x-csrf-token", csrf)
      .send({
        isPublished: true,
        scheduledPublishAt: past,
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isPublished).toBe(1);
    expect(patchRes.body.data.scheduledPublishAt).toBeNull();

    const publicAfter = await supertest(app).get(`/api/blog/${slug}`);
    expect(publicAfter.status).toBe(200);
  });

  it("PATCH /:id — SEO 필드 수정과 버전 히스토리 생성을 지원한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/blog")
      .set("x-csrf-token", csrf)
      .send({
        title: "SEO 테스트 글",
        content: "초기 본문입니다.",
        category: "law_guide",
        seoTitle: "초기 SEO 제목",
        seoDescription: "초기 설명",
        isPublished: true,
      });
    expect(createRes.status).toBe(200);

    const id = createRes.body.data.id;
    const patchRes = await agent
      .patch(`/api/blog/${id}`)
      .set("x-csrf-token", csrf)
      .send({
        title: "SEO 테스트 글 수정",
        content: "수정 본문입니다.",
        seoTitle: "수정 SEO 제목",
        seoDescription: "수정 설명",
        canonicalUrl: "/blog/seo-test",
        ogImageUrl: "/og-image.jpg",
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.seoTitle).toBe("수정 SEO 제목");
    expect(patchRes.body.data.canonicalUrl).toBe("/blog/seo-test");

    const versionsRes = await agent
      .get(`/api/blog/${id}/versions`)
      .set("x-csrf-token", csrf);
    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(versionsRes.body.data[0].title).toBe("SEO 테스트 글");

    const restoreRes = await agent
      .post(`/api/blog/${id}/versions/${versionsRes.body.data[0].versionNo}/restore`)
      .set("x-csrf-token", csrf)
      .send({});
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.title).toBe("SEO 테스트 글");
    expect(restoreRes.body.data.seoTitle).toBe("초기 SEO 제목");
  });

  it("GET /:slug — 존재하지 않는 슬러그는 404를 반환한다", async () => {
    const res = await supertest(app).get("/api/blog/no-such-slug-xxxxx");
    expect(res.status).toBe(404);
  });

  it("PATCH /:id — 인증 없으면 401을 반환한다", async () => {
    // CSRF 토큰을 먼저 받아 헤더에 동봉해야 CSRF 단계를 통과해 adminAuth(401) 분기에 도달한다
    const agent = supertest.agent(app);
    const init = await agent.get("/api/blog");
    const csrf = getCsrfTokenFromResponse(init);

    const res = await agent
      .patch("/api/blog/00000000-0000-0000-0000-000000000000")
      .set("x-csrf-token", csrf)
      .send({ title: "변경" });
    expect(res.status).toBe(401);
  });
});
