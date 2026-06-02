/**
 * 메시지(messages) 라우트 통합 테스트 — 템플릿 CRUD + 로그 조회를 검증한다.
 * 실제 SMS/이메일 발송은 외부 서비스를 호출하므로 /send 경로는 본 테스트에서 다루지 않는다.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// DB 파일을 임시 디렉터리로 격리해 다른 테스트와 충돌을 막는다
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-messages-test-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-5";
process.env.NODE_ENV = "test";
process.env.ALIGO_API_KEY = "test-api-key";
process.env.ALIGO_USER_ID = "test-user";
process.env.ALIGO_SENDER = "02-594-5583";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const messagesRoute = (await import("../../routes/messages.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers, messageLogs } = await import("../../db/schema.js");

const TEST_USERNAME = "messages-admin";
const TEST_PASSWORD = "test-password-1234";

let app;
let supertest;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: TEST_USERNAME,
    passwordHash: hashPassword(TEST_PASSWORD),
    name: "메시지 테스트 관리자",
    role: "admin",
  }).returning();

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/messages", messagesRoute);
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

describe("메시지 라우트 (/api/messages)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /templates — 관리자 인증 시 템플릿 목록을 반환한다", async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.get("/api/messages/templates");
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /templates — 템플릿을 생성하고 GET /templates에서 조회 가능하다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const createRes = await agent
      .post("/api/messages/templates")
      .set("x-csrf-token", csrf)
      .send({
        name: "테스트 SMS 템플릿",
        channel: "sms",
        content: "안녕하세요 {{name}}님, 상담 예약이 확정되었습니다.",
        sortOrder: 0,
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.data.name).toBe("테스트 SMS 템플릿");
    expect(createRes.body.data.channel).toBe("sms");

    const listRes = await agent.get("/api/messages/templates");
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((t) => t.id === createRes.body.data.id);
    expect(found).toBeTruthy();
  });

  it("POST /templates — 이름/내용 누락 시 400을 반환한다", async () => {
    const { agent, csrf } = await loginAsAdmin();
    const res = await agent
      .post("/api/messages/templates")
      .set("x-csrf-token", csrf)
      .send({ channel: "sms" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("필수");
  });

  it("GET /logs — 관리자 인증 시 발송 이력 목록을 반환한다", async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.get("/api/messages/logs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("total");
  });

  it("POST /send — SMS 발송 성공 시 연락처를 정규화하고 로그를 남긴다", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ result_code: 1, msg_id: "sms-test-1", success_cnt: 1, error_cnt: 0, msg_type: "SMS" }),
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    const { agent, csrf } = await loginAsAdmin();

    const res = await agent
      .post("/api/messages/send")
      .set("x-csrf-token", csrf)
      .send({
        channel: "sms",
        recipients: [{ name: "홍길동", contact: "010-1234-5678", category: "civil" }],
        content: "안녕하세요 {name}님",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(1);
    expect(res.body.data.failed).toBe(0);
    const body = fetchMock.mock.calls[0][1].body;
    expect(body).toContain("receiver=01012345678");
    expect(new URLSearchParams(body).get("msg")).toBe("안녕하세요 홍길동님");

    const logs = await db.select().from(messageLogs);
    const log = logs.find((row) => row.id === res.body.data.results[0].logId);
    expect(log).toBeTruthy();
    expect(log.recipientContact).toBe("01012345678");
    expect(log.status).toBe("sent");
  });

  it("POST /send — 한글 고객명 플레이스홀더를 수신자별 이름으로 치환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ result_code: 1, msg_id: "sms-test-name", success_cnt: 1, error_cnt: 0, msg_type: "SMS" }),
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    const { agent, csrf } = await loginAsAdmin();

    const res = await agent
      .post("/api/messages/send")
      .set("x-csrf-token", csrf)
      .send({
        channel: "문자",
        recipients: [{ name: "김민수", contact: "010-3333-4444", category: "civil" }],
        content: "안녕하세요 {고객명}님, {{고객명}}님 상담 분야는 {category}입니다.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(1);
    const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(params.get("msg")).toBe("안녕하세요 김민수님, 김민수님 상담 분야는 민사입니다.");
  });

  it("POST /send — SMS 제공자 실패는 500이 아니라 실패 결과로 반환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ result_code: -102, message: "잔여 포인트가 부족합니다" }),
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    const { agent, csrf } = await loginAsAdmin();

    const res = await agent
      .post("/api/messages/send")
      .set("x-csrf-token", csrf)
      .send({
        channel: "sms",
        recipients: [{ name: "김철수", contact: "010.9999.8888" }],
        content: "테스트 문자",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(0);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.results[0].error).toContain("잔여 포인트");
    expect(fetchMock.mock.calls[0][1].body).toContain("receiver=01099998888");
  });

  it("POST /send — 문자 채널 라벨을 sms로 정규화한다", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      text: async () => JSON.stringify({ result_code: 1, msg_id: "sms-test-2", success_cnt: 1, error_cnt: 0, msg_type: "SMS" }),
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);
    const { agent, csrf } = await loginAsAdmin();

    const res = await agent
      .post("/api/messages/send")
      .set("x-csrf-token", csrf)
      .send({
        channel: "문자",
        recipients: [{ name: "박영희", contact: "010 1111 2222" }],
        content: "문자 채널 테스트",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(1);
    expect(fetchMock.mock.calls[0][1].body).toContain("receiver=01011112222");
  });

  it("GET /templates — 인증 없으면 401을 반환한다", async () => {
    const res = await supertest(app).get("/api/messages/templates");
    expect(res.status).toBe(401);
  });
});
