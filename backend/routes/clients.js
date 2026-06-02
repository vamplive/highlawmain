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

// =============================================
// 의뢰인 활동(소통) 기록 CRUD
// =============================================
const crypto = require("crypto");
const { sqlite } = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const activityUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/** GET /api/clients/:id/activities — 소통 기록 목록 */
router.get("/:id/activities", adminAuth, (req, res) => {
  try {
    const { type, limit = 100, offset = 0 } = req.query;
    const parts = ["SELECT * FROM client_activities WHERE client_id = ?"];
    const args = [req.params.id];
    if (type) { parts.push("AND type = ?"); args.push(type); }
    parts.push("ORDER BY occurred_at DESC LIMIT ? OFFSET ?");
    args.push(Math.min(Number(limit) || 100, 500), Number(offset) || 0);
    const rows = sqlite.prepare(parts.join(" ")).all(...args);
    const total = sqlite.prepare("SELECT count(*) as cnt FROM client_activities WHERE client_id = ?").get(req.params.id);
    res.json({ data: rows, error: null, meta: { total: total.cnt } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /api/clients/:id/activities — 소통 기록 추가 (파일 첨부 가능) */
router.post("/:id/activities", adminAuth, activityUpload.single("file"), (req, res) => {
  try {
    const { type, title, content, durationSeconds, occurredAt } = req.body || {};
    if (!type) return res.status(400).json({ data: null, error: "type 필수", meta: null });

    let fileUrl = null, fileName = null, fileSize = null;
    if (req.file) {
      const dir = path.join(process.env.STORAGE_PATH || path.join(__dirname, "..", "data"), "uploads", "client-files");
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(req.file.originalname) || "";
      const fname = `${crypto.randomUUID()}${ext}`;
      fs.writeFileSync(path.join(dir, fname), req.file.buffer);
      fileUrl = `/uploads/client-files/${fname}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO client_activities (id, client_id, type, title, content, file_url, file_name, file_size, duration_seconds, occurred_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, req.params.id, type, title || null, content || null,
      fileUrl, fileName, fileSize, durationSeconds ? Number(durationSeconds) : null,
      occurredAt || new Date().toISOString(), req.adminUser?.userId || null,
    );

    const row = sqlite.prepare("SELECT * FROM client_activities WHERE id = ?").get(id);
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** DELETE /api/clients/:id/activities/:actId — 소통 기록 삭제 */
router.delete("/:id/activities/:actId", adminAuth, (req, res) => {
  try {
    sqlite.prepare("DELETE FROM client_activities WHERE id = ? AND client_id = ?").run(req.params.actId, req.params.id);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
