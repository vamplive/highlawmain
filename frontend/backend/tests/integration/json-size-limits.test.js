/**
 * C안 — JSON 본문 크기 제한 통합 테스트.
 *
 * 검증 포인트:
 *   1) 일반 라우트(/api/admin-users/login)는 1MB로 제한 — 1.5MB 본문은 413(또는 PayloadTooLarge)
 *   2) 컨텐츠 라우트(/api/blog 등)는 10MB까지 허용 — 1.5MB 본문은 정상 처리(인증/검증으로
 *      400/401이 떨어지더라도 413은 아님)
 *   3) 정상 크기(1KB)는 모든 라우트에서 본문 크기 때문에 거부되지 않는다.
 *
 * 본 테스트는 권한·검증을 검증하지 않고 오직 body parser의 size 게이트만 본다.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "yjlaw-json-limit-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-B";
process.env.NODE_ENV = "test";

// 실제 index.js의 path-conditional parser 정책을 그대로 검증하기 위해 동일하게 셋업
const express = (await import("express")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const blogRoute = (await import("../../routes/blog.js")).default;

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  app = express();

  // index.js와 동일한 path-conditional limit 정책
  const TIGHT_JSON = express.json({ limit: "1mb" });
  const LARGE_JSON = express.json({ limit: "10mb" });
  const LARGE_BODY_PATHS = [
    "/api/documents", "/api/contracts", "/api/contract-templates",
    "/api/blog", "/api/site-settings", "/api/qna",
    "/api/lawyers", "/api/lectures",
  ];
  app.use((req, res, next) => {
    const isLarge = LARGE_BODY_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"));
    return (isLarge ? LARGE_JSON : TIGHT_JSON)(req, res, next);
  });

  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/blog", blogRoute);
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

/** N바이트의 무해한 JSON 페이로드 생성 (큰 문자열 1개) */
function payloadOfBytes(approxBytes, fieldName = "content") {
  // 약간의 오버헤드를 고려해 따옴표·중괄호 비용을 빼고 채운다
  const overhead = 30 + fieldName.length;
  const fillerLen = Math.max(0, approxBytes - overhead);
  return { [fieldName]: "x".repeat(fillerLen) };
}

describe("C안: JSON body size limits (path-conditional)", () => {
  describe("일반 라우트 — 1MB 제한", () => {
    it("1.5MB 페이로드는 413으로 거부된다", async () => {
      const body = payloadOfBytes(1_500_000, "username");
      const res = await supertest(app).post("/api/admin-users/login").send(body);
      // express.json은 size 초과 시 413 PayloadTooLarge를 던진다.
      // CSRF 미들웨어가 없으면 parser 단계에서 즉시 거부.
      expect(res.status).toBe(413);
    });

    it("작은 페이로드(1KB)는 size로 인해 거부되지 않는다", async () => {
      const body = payloadOfBytes(1_000, "username");
      const res = await supertest(app).post("/api/admin-users/login").send(body);
      // 인증/검증 결과는 무엇이든 OK. 다만 413(size)이면 안 된다.
      expect(res.status).not.toBe(413);
    });
  });

  describe("컨텐츠 라우트 — 10MB 제한", () => {
    it("1.5MB 페이로드는 size로 거부되지 않는다 (큰 본문 허용 라우트)", async () => {
      const body = payloadOfBytes(1_500_000, "content");
      // 인증 없으니 401 또는 비즈니스 검증 응답이 떨어지지만, parser 단에서 413이면 안 됨.
      const res = await supertest(app).post("/api/blog").send(body);
      expect(res.status).not.toBe(413);
    });
  });
});
