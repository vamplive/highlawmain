/**
 * 공개 초대 토큰 라우트 (인증 없음 — 토큰 자체가 키)
 * - /invite/:token 진입 시 프론트가 호출해 타입별 페이지로 분기
 * - 외부 상대방이 서명 링크를 열어볼 때 메타 조회
 */
const { Router } = require("express");
const { sqlite } = require("../db");
const { logEvent } = require("../lib/audit-log");

const router = Router();

/** 만료 여부 판단 */
function isExpired(row) {
  if (!row || !row.expires_at) return false;
  return Date.now() > new Date(row.expires_at + (row.expires_at.includes("Z") ? "" : "Z")).getTime();
}

/** GET /:token — 초대 메타 조회 (상태/타입만) */
router.get("/:token", (req, res) => {
  const row = sqlite.prepare("SELECT * FROM invitations WHERE token = ?").get(req.params.token);
  if (!row) return res.status(404).json({ data: null, error: "링크를 찾을 수 없습니다", meta: null });
  if (row.status === "cancelled") return res.status(410).json({ data: null, error: "취소된 링크입니다", meta: null });
  if (isExpired(row)) return res.status(410).json({ data: null, error: "만료된 링크입니다", meta: null });

  // 열람 기록 (최초 1회)
  if (row.status === "sent") {
    sqlite.prepare("UPDATE invitations SET status = 'opened', opened_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(row.id);
    logEvent({
      invitationId: row.id,
      actorType: "party",
      action: "link_opened",
      details: { type: row.type },
      req,
    });
  }

  // 민감 필드 제거, 프론트가 분기에 필요한 최소 정보만 반환
  res.json({
    data: {
      type: row.type,
      status: row.status,
      targetRef: row.target_ref,
      prefilledName: row.prefilled_name,
      prefilledPhone: row.prefilled_phone ? maskPhone(row.prefilled_phone) : null,
      prefilledEmail: row.prefilled_email || null,
      category: row.category,
      expiresAt: row.expires_at,
    },
    error: null,
    meta: null,
  });
});

/** 휴대폰 마스킹 (010-****-1234) */
function maskPhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 7) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

module.exports = router;
