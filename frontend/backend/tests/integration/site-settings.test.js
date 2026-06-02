/**
 * 사이트 설정 라우트 통합 테스트 — 관리자 저장 계약과 공개 조회 형태를 검증한다.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-site-settings-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-7";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const siteSettingsRoute = (await import("../../routes/site-settings.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers } = await import("../../db/schema.js");

const TEST_USERNAME = "settings-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "설정 테스트 관리자",
    role: "admin",
  }).returning();

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/site-settings", siteSettingsRoute);
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

describe("사이트 설정 라우트 (/api/site-settings)", () => {
  it("POST /bulk — 배열 형태 설정을 저장하고 page/section/content/key로 조회한다", async () => {
    const { agent, csrf } = await loginAsAdmin();

    const save = await agent
      .post("/api/site-settings/bulk")
      .set("x-csrf-token", csrf)
      .send({
        settings: [
          { page: "layout", section: "contact", content: { phone: "02-111-2222", phoneEnabled: true } },
        ],
      });

    expect(save.status).toBe(200);
    expect(save.body.data.upserted).toBe(1);

    const res = await supertest(app).get("/api/site-settings?page=layout");
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      page: "layout",
      section: "contact",
      key: "layout/contact",
      content: { phone: "02-111-2222", phoneEnabled: true },
    });
  });

  it("POST /bulk — 객체 형태 설정도 하위 호환으로 저장한다", async () => {
    const { agent, csrf } = await loginAsAdmin();

    const save = await agent
      .post("/api/site-settings/bulk")
      .set("x-csrf-token", csrf)
      .send({
        settings: {
          "seo/global": { defaultOgImage: "/og-image.jpg" },
        },
      });

    expect(save.status).toBe(200);
    expect(save.body.data.upserted).toBe(1);

    const res = await supertest(app).get("/api/site-settings?key=seo/global");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].content.defaultOgImage).toBe("/og-image.jpg");
  });
});
