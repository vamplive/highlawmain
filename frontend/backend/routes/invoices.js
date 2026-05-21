/**
 * 인보이스 API 라우트 — 관리자 CRUD + 발행 + 결제 기록
 * - 비즈니스 로직은 services/invoice-service.js 에 위임
 * - 발행 시 공급자 스냅샷은 site_settings 의 firm/supplier 에서, 고객 스냅샷은 clients 에서 조회
 */
const { Router } = require("express");
const { adminAuth, requireRole, requireMinRole } = require("../lib/auth");
const { auditMiddleware } = require("../lib/audit-log");
const invoiceService = require("../services/invoice-service");
const { sqlite } = require("../db");

const router = Router();

// 인보이스 라우트는 모든 쓰기 작업을 감사 로그에 기록한다.
// auditMiddleware는 GET을 무시하고 2xx 응답만 기록하므로 안전하게 전체에 적용 가능.
router.use(auditMiddleware("invoices"));

/** 발행 시점에 고정할 공급자 정보 스냅샷 로드 (site_settings.content 에 JSON 저장) */
function loadSupplierSnapshot() {
  const row = sqlite.prepare(`
    SELECT content FROM site_settings WHERE page = 'firm' AND section = 'supplier'
  `).get();
  if (!row) return {};
  try {
    return JSON.parse(row.content);
  } catch {
    return {};
  }
}

/**
 * 발행 시점에 고정할 고객(공급받는자) 정보 스냅샷 로드.
 * 현재 clients 테이블엔 주소·사업자번호·대표자명이 없으므로 Phase 2 에서 컬럼 확장 예정.
 * 당장은 있는 필드(name/phone/email/category)만 스냅샷에 포함.
 */
function loadCustomerSnapshot(clientId) {
  if (!clientId) return {};
  const row = sqlite.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
  if (!row) return {};
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    category: row.category || null,
    // 아래 필드들은 clients 스키마 확장 후 추가됨 (Phase 2)
    address: row.address || null,
    businessNo: row.business_no || null,
    representative: row.representative || null,
  };
}

/** 에러 핸들러 래퍼 — ServiceError 는 status 보존, 그 외는 500 */
function handleError(e, res) {
  const status = e && e.status ? e.status : 500;
  if (status >= 500) {
    console.error(e);
  }
  const message = e && e.message ? e.message : "서버 내부 오류가 발생했습니다";
  res.status(status).json({ data: null, error: message, meta: null });
}

/* ─────────────── 목록 / 상세 ─────────────── */
router.get("/", adminAuth, (req, res) => {
  try {
    const result = invoiceService.listInvoices(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) { handleError(e, res); }
});

router.get("/next-number", adminAuth, (req, res) => {
  try {
    const type = req.query.type || "simple";
    res.json({ data: { nextNumber: invoiceService.previewNextNumber(type) }, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

router.get("/stats", adminAuth, (req, res) => {
  try {
    res.json({ data: invoiceService.getStats(req.query.year), error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

router.get("/:id", adminAuth, (req, res) => {
  try {
    res.json({ data: invoiceService.getInvoiceDetail(req.params.id), error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

/* ─────────────── 생성 / 수정 / 삭제 ─────────────── */
// 인보이스 생성·수정: 청구서 발행 직전 단계 — manager 이상.
router.post("/", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const created = invoiceService.createInvoice(req.body, actorId);
    res.status(201).json({ data: created, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

router.patch("/:id", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const updated = invoiceService.updateInvoice(req.params.id, req.body, actorId);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

// 인보이스 삭제: 발행/결제 기록까지 사라지는 되돌리기 어려운 작업이므로 super-admin 전용.
router.delete("/:id", adminAuth, requireRole("admin"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const result = invoiceService.deleteInvoice(req.params.id, actorId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

/* ─────────────── 상태 전환 ─────────────── */
/**
 * POST /invoices/:id/issue — 발행 (번호 할당 + 공급자·고객 스냅샷 고정)
 * 발행 = 청구서 외부 송부 단계. manager 이상.
 */
router.post("/:id/issue", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    // 발행 직전 상세 조회로 client_id 확보
    const current = invoiceService.getInvoiceDetail(req.params.id);
    const supplier = loadSupplierSnapshot();
    const customer = loadCustomerSnapshot(current.client_id);
    const issued = invoiceService.issueInvoice(req.params.id, actorId, supplier, customer);
    res.json({ data: issued, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

// 인보이스 취소: 결제 환불 트리거에 해당하는 금전 작업 — super-admin 전용.
router.post("/:id/cancel", adminAuth, requireRole("admin"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const cancelled = invoiceService.cancelInvoice(req.params.id, actorId, req.body && req.body.reason);
    res.json({ data: cancelled, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

/* ─────────────── 결제 기록 ─────────────── */
// 결제 입금 기록 추가: 회계 입력 — manager 이상.
router.post("/:id/payments", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const updated = invoiceService.addPayment(req.params.id, req.body, actorId);
    res.status(201).json({ data: updated, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

// 의뢰인 예치금에서 결제 차감 — 한 트랜잭션으로 trust withdrawal + invoice payment 동시 기록.
router.post("/:id/pay-from-trust", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const result = invoiceService.payFromTrust(req.params.id, req.body, actorId);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

// 결제 기록 삭제: 입금/지급 흔적 제거 = 회계 무결성 영향 → super-admin 전용.
router.delete("/:id/payments/:paymentId", adminAuth, requireRole("admin"), (req, res) => {
  try {
    const actorId = req.adminUser && req.adminUser.userId;
    const updated = invoiceService.removePayment(req.params.id, req.params.paymentId, actorId);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { handleError(e, res); }
});

module.exports = router;
