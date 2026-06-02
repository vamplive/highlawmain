/**
 * 결제·금전 흔적 라우트 권한 분리(A안) 통합 테스트.
 *
 * 검증 포인트:
 *   - editor 역할은 결제 취소·인보이스 삭제·결제기록 삭제·카드 삭제·영수증 삭제에서 403을 받아야 한다
 *   - admin 역할은 동일 호출에서 403이 나오지 않는다 (404/400 등 비즈니스 응답은 허용 — 권한 게이트만 통과 확인)
 *   - 일반 조회/생성(editor도 허용)은 401/403 없이 통과한다
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "highlaw-payment-roles-"));
process.env.STORAGE_PATH = TMP_DIR;
process.env.CSRF_SECRET = "test-csrf-secret-32bytes-fixed-value-9";
process.env.NODE_ENV = "test";

const express = (await import("express")).default;
const csrfProtection = (await import("../../lib/csrf.js")).default;
const adminUsersRoute = (await import("../../routes/admin-users.js")).default;
const invoicesRoute = (await import("../../routes/invoices.js")).default;
const paymentCardsRoute = (await import("../../routes/payment-cards.js")).default;
const receiptsRoute = (await import("../../routes/receipts.js")).default;
const { hashPassword } = await import("../../lib/auth.js");
const { db } = await import("../../db/index.js");
const { adminUsers, clients } = await import("../../db/schema.js");
const { sqlite } = await import("../../db/index.js");

const ADMIN_USERNAME = "pay-admin";
const EDITOR_USERNAME = "pay-editor";
const PASSWORD = "test-password-1234";

let app;
let supertest;
let testInvoiceId;
let testCardId;
let testReceiptId;

beforeAll(async () => {
  supertest = (await import("supertest")).default;

  await db.insert(adminUsers).values({
    username: ADMIN_USERNAME,
    passwordHash: hashPassword(PASSWORD),
    name: "결제 admin",
    role: "admin",
  });
  await db.insert(adminUsers).values({
    username: EDITOR_USERNAME,
    passwordHash: hashPassword(PASSWORD),
    name: "결제 editor",
    role: "editor",
  });

  const [client] = await db.insert(clients).values({
    name: "테스트 고객",
    phone: "010-0000-0001",
    email: "c@example.com",
    source: "manual",
  }).returning();

  app = express();
  app.use(express.json());
  app.use(csrfProtection);
  app.use("/api/admin-users", adminUsersRoute);
  app.use("/api/invoices", invoicesRoute);
  app.use("/api/payment-cards", paymentCardsRoute);
  app.use("/api/receipts", receiptsRoute);

  // 테스트 픽스처 — admin으로 인보이스/카드/영수증 생성하여 권한 게이트 검증에 사용
  const adminAgent = (await loginAs(ADMIN_USERNAME)).agent;
  const adminCsrf = (await loginAs(ADMIN_USERNAME)).csrf;

  const invRes = await adminAgent.post("/api/invoices").set("x-csrf-token", adminCsrf).send({
    type: "simple",
    clientId: client.id,
    vatRate: 0,
    items: [{ description: "테스트", quantity: 1, unitPrice: 10000 }],
  });
  testInvoiceId = invRes.body.data.id;

  const cardRes = await adminAgent.post("/api/payment-cards").set("x-csrf-token", adminCsrf).send({
    last4: "1234", issuer: "신한", label: "테스트 카드",
  });
  testCardId = cardRes.body.data.id;

  // 영수증은 multer 파일 업로드라 테스트가 무거우니 DB에 직접 삽입
  testReceiptId = "test-receipt-" + Date.now();
  sqlite.prepare(`
    INSERT INTO receipts (id, file_path, file_name, mime_type, file_size, created_by_admin_id, ocr_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(testReceiptId, "/tmp/no-such-file", "test.pdf", "application/pdf", 100, null, "manual");
});

afterAll(() => {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
});

function getCsrf(res) {
  const setCookie = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/^csrf-token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

async function loginAs(username) {
  const agent = supertest.agent(app);
  const init = await agent.get("/api/admin-users/me");
  const csrf = getCsrf(init);
  await agent.post("/api/admin-users/login").send({ username, password: PASSWORD });
  return { agent, csrf };
}

describe("A안: 결제·금전 흔적 라우트 권한 게이트", () => {
  describe("editor 역할은 위험 작업에서 403", () => {
    it("POST /api/invoices/:id/cancel — 결제 취소 차단", async () => {
      const { agent, csrf } = await loginAs(EDITOR_USERNAME);
      const res = await agent
        .post(`/api/invoices/${testInvoiceId}/cancel`)
        .set("x-csrf-token", csrf)
        .send({ reason: "test" });
      expect(res.status).toBe(403);
    });

    it("DELETE /api/invoices/:id — 인보이스 삭제 차단", async () => {
      const { agent, csrf } = await loginAs(EDITOR_USERNAME);
      const res = await agent
        .delete(`/api/invoices/${testInvoiceId}`)
        .set("x-csrf-token", csrf);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/invoices/:id/payments/:paymentId — 결제 기록 삭제 차단", async () => {
      const { agent, csrf } = await loginAs(EDITOR_USERNAME);
      const res = await agent
        .delete(`/api/invoices/${testInvoiceId}/payments/anything`)
        .set("x-csrf-token", csrf);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/payment-cards/:id — 카드 삭제 차단", async () => {
      const { agent, csrf } = await loginAs(EDITOR_USERNAME);
      const res = await agent
        .delete(`/api/payment-cards/${testCardId}`)
        .set("x-csrf-token", csrf);
      expect(res.status).toBe(403);
    });

    it("DELETE /api/receipts/:id — 영수증 삭제 차단", async () => {
      const { agent, csrf } = await loginAs(EDITOR_USERNAME);
      const res = await agent
        .delete(`/api/receipts/${testReceiptId}`)
        .set("x-csrf-token", csrf);
      expect(res.status).toBe(403);
    });
  });

  describe("editor 역할도 일반 조회·생성은 통과", () => {
    it("GET /api/invoices — 목록 조회 200", async () => {
      const { agent } = await loginAs(EDITOR_USERNAME);
      const res = await agent.get("/api/invoices");
      expect(res.status).toBe(200);
    });

    it("GET /api/payment-cards — 카드 목록 200", async () => {
      const { agent } = await loginAs(EDITOR_USERNAME);
      const res = await agent.get("/api/payment-cards");
      expect(res.status).toBe(200);
    });
  });

  describe("admin 역할은 권한 게이트 통과", () => {
    it("DELETE /api/payment-cards/:id — admin은 403이 아니다 (실제 삭제 성공)", async () => {
      const { agent, csrf } = await loginAs(ADMIN_USERNAME);
      const res = await agent
        .delete(`/api/payment-cards/${testCardId}`)
        .set("x-csrf-token", csrf);
      expect(res.status).not.toBe(403);
      expect(res.status).toBe(200);
    });

    it("DELETE /api/receipts/:id — admin은 403이 아니다", async () => {
      const { agent, csrf } = await loginAs(ADMIN_USERNAME);
      const res = await agent
        .delete(`/api/receipts/${testReceiptId}`)
        .set("x-csrf-token", csrf);
      expect(res.status).not.toBe(403);
    });
  });
});
