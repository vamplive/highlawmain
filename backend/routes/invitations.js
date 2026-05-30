/**
 * 초대(invitations) 관리 API — 관리자 전용
 * - 초대 생성 + SMS/이메일 발송
 * - 목록 조회, 재발송, 취소
 */
const { Router } = require("express");
const { sqlite } = require("../db");
const { adminAuth } = require("../lib/auth");
const { createAndSendInvitation } = require("../lib/invite-sender");
const { logEvent } = require("../lib/audit-log");
const logger = require("../lib/logger");

const router = Router();

/** POST / — 새 초대 생성 + 발송 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.type) return res.status(400).json({ data: null, error: "type 필수", meta: null });

    const result = await createAndSendInvitation({
      ...body,
      adminUserId: req.adminUser?.userId || null,
    });
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e }, "invitation create failed");
    res.status(e.status || 500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET / — 초대 목록 */
router.get("/", adminAuth, (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;
    const parts = ["SELECT * FROM invitations WHERE 1=1"];
    const args = [];
    if (type) { parts.push("AND type = ?"); args.push(type); }
    if (status) { parts.push("AND status = ?"); args.push(status); }
    parts.push("ORDER BY created_at DESC LIMIT ?");
    args.push(Math.min(Number(limit) || 100, 500));
    const rows = sqlite.prepare(parts.join(" ")).all(...args);
    res.json({ data: rows, error: null, meta: { count: rows.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /:id — 상세 */
router.get("/:id", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM invitations WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });

    const smsLog = row.message_log_id
      ? sqlite.prepare("SELECT * FROM message_logs WHERE id = ?").get(row.message_log_id)
      : null;
    const emailLog = row.email_message_log_id
      ? sqlite.prepare("SELECT * FROM message_logs WHERE id = ?").get(row.email_message_log_id)
      : null;

    res.json({ data: { invitation: row, smsLog, emailLog }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/resend — 재발송 */
router.post("/:id/resend", adminAuth, async (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM invitations WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    if (row.status === "cancelled") return res.status(400).json({ data: null, error: "취소된 초대는 재발송 불가", meta: null });

    // 기존 token 재사용, SMS만 재발송
    const { renderTemplate, buildInviteUrl } = require("../lib/invite-sender");
    const { sendSMS } = require("../lib/sms-service");
    const DEFAULT = {
      consultation: "[법무법인 하이로] {name}님, 상담 신청 링크: {url}",
      engagement: "[법무법인 하이로] {name}님, 위임계약서 서명 요청: {url}",
      settlement: "[법무법인 하이로] {name}님, 합의서 서명 요청: {url}",
    };
    const url = buildInviteUrl(row.token);
    const text = renderTemplate(DEFAULT[row.type] || DEFAULT.consultation, {
      name: row.prefilled_name || "귀하",
      url,
    });
    if (!row.prefilled_phone) {
      return res.status(400).json({ data: null, error: "전화번호가 등록되지 않은 초대입니다", meta: null });
    }
    const sr = await sendSMS(row.prefilled_phone, text);
    logEvent({
      invitationId: row.id,
      actorType: "admin",
      actorIdentifier: req.adminUser?.userId,
      action: "link_sent",
      details: { resend: true, smsSuccess: sr.success },
      req,
    });
    res.json({ data: { resent: true, smsResult: sr }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/cancel — 취소 */
router.post("/:id/cancel", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM invitations WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    sqlite.prepare("UPDATE invitations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(row.id);
    logEvent({
      invitationId: row.id,
      actorType: "admin",
      actorIdentifier: req.adminUser?.userId,
      action: "contract_cancelled",
      details: { entity: "invitation" },
      req,
    });
    res.json({ data: { cancelled: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
