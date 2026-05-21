/**
 * 고객 관리 API 라우트 — 고객 CRUD
 * - 비즈니스 로직은 services/client-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const { auditMiddleware, logPiiAccess } = require("../lib/audit-log");
const clientService = require("../services/client-service");
const { handleError } = require("../lib/route-handler");

const router = Router();

// =============================================
// 공개 수신거부 API (토큰 기반, 인증 불필요)
// =============================================

/**
 * GET /api/clients/unsubscribe — 토큰으로 수신동의 상태 조회 (공개)
 * query: { token }
 * 응답에는 개인정보 최소화 — 이름 이니셜 + 마스킹된 연락처만
 */
router.get("/unsubscribe", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ data: null, error: "토큰이 필요합니다", meta: null });
    }
    const client = await clientService.findClientByUnsubscribeToken(token);
    if (!client) {
      return res.status(404).json({ data: null, error: "유효하지 않은 링크입니다", meta: null });
    }
    // 최소 정보만 반환 — 이름 앞글자 + 마스킹된 연락처
    const maskPhone = (p) => (p ? p.slice(0, 3) + "****" + (p.slice(-2) || "") : null);
    const maskEmail = (e) => {
      if (!e) return null;
      const [user, domain] = e.split("@");
      return user.slice(0, 2) + "***@" + (domain || "");
    };
    res.json({
      data: {
        nameInitial: (client.name || "고객").charAt(0) + "**",
        phoneMasked: maskPhone(client.phone),
        emailMasked: maskEmail(client.email),
        smsConsent: !!client.smsConsent,
        emailConsent: !!client.emailConsent,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/clients/unsubscribe — 토큰으로 수신동의 업데이트 (공개)
 * body: { token, smsConsent?: boolean, emailConsent?: boolean }
 */
router.post("/unsubscribe", async (req, res) => {
  try {
    const { token, smsConsent, emailConsent } = req.body || {};
    if (!token) {
      return res.status(400).json({ data: null, error: "토큰이 필요합니다", meta: null });
    }
    if (smsConsent === undefined && emailConsent === undefined) {
      return res.status(400).json({ data: null, error: "변경할 항목이 없습니다", meta: null });
    }
    const updated = await clientService.updateClientConsentByToken(token, {
      smsConsent: smsConsent === undefined ? undefined : !!smsConsent,
      emailConsent: emailConsent === undefined ? undefined : !!emailConsent,
    });
    if (!updated) {
      return res.status(404).json({ data: null, error: "유효하지 않은 링크입니다", meta: null });
    }
    res.json({
      data: { smsConsent: !!updated.smsConsent, emailConsent: !!updated.emailConsent },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/clients — 고객 목록 조회
 */
router.get("/", adminAuth, auditMiddleware("clients"), async (req, res) => {
  try {
    logPiiAccess(req, "clients", "list");
    const result = await clientService.listClients(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/clients/segment — 세그먼트 조건으로 고객 목록 조회
 * body: { categories?, sources?, tags?, consultationStatuses?, lastContactedBefore?, lastContactedAfter?, hasPhone?, hasEmail?, isActive? }
 * - 발송 대상 선정 시 사용 (최대 500명)
 */
router.post("/segment", adminAuth, async (req, res) => {
  try {
    const result = await clientService.findClientsBySegment(req.body || {});
    res.json({ data: result.items, error: null, meta: { count: result.count, criteria: result.criteria } });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/clients/:id — 고객 단건 조회
 */
router.get("/:id", adminAuth, async (req, res) => {
  try {
    logPiiAccess(req, "clients", req.params.id);
    const client = await clientService.getClientById(req.params.id);
    res.json({ data: client, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/clients/:id/timeline — 고객 통합 타임라인
 * - 상담·메시지·예약·사건을 시간순 병합
 */
router.get("/:id/timeline", adminAuth, async (req, res) => {
  try {
    logPiiAccess(req, "clients.timeline", req.params.id);
    const result = await clientService.getClientTimeline(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/clients — 고객 등록
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const inserted = await clientService.createClient(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * PATCH /api/clients/:id — 고객 정보 수정
 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await clientService.updateClient(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /api/clients/:id — 고객 삭제
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await clientService.deleteClient(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
