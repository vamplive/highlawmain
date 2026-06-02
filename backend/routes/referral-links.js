/**
 * 레퍼럴 링크 API — 상담 안내 문구 공유 + 클릭 추적
 * - 관리자: 링크 생성/목록/삭제
 * - 공개: 클릭 추적 후 상담 페이지로 리다이렉트
 */
const { Router } = require("express");
const crypto = require("crypto");
const { sqlite } = require("../db");
const { adminAuth } = require("../lib/auth");
const logger = require("../lib/logger");

const router = Router();

/** 짧은 코드 생성 (6자, 중복 방지) */
function generateCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** IP 마스킹 — 마지막 옥텟 제거 */
function maskIp(ip) {
  if (!ip) return null;
  const cleaned = ip.replace(/^::ffff:/, "");
  const parts = cleaned.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  return cleaned.replace(/:[^:]*$/, ":*");
}

/** POST / — 새 레퍼럴 링크 생성 */
router.post("/", adminAuth, (req, res) => {
  try {
    const { label, memo } = req.body || {};
    let code;
    // 중복 방지 루프
    for (let i = 0; i < 10; i++) {
      code = generateCode();
      const exists = sqlite.prepare("SELECT 1 FROM referral_links WHERE code = ?").get(code);
      if (!exists) break;
    }
    const id = crypto.randomUUID();
    sqlite.prepare(
      "INSERT INTO referral_links (id, code, label, memo, created_by) VALUES (?, ?, ?, ?, ?)"
    ).run(id, code, label || null, memo || null, req.adminUser?.userId || null);
    const row = sqlite.prepare("SELECT * FROM referral_links WHERE id = ?").get(id);
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e }, "referral link create failed");
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET / — 레퍼럴 링크 목록 (클릭 통계 포함) */
router.get("/", adminAuth, (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM referral_clicks WHERE referral_link_id = r.id) AS total_clicks,
        (SELECT COUNT(DISTINCT ip_masked) FROM referral_clicks WHERE referral_link_id = r.id) AS unique_visitors,
        (SELECT MAX(created_at) FROM referral_clicks WHERE referral_link_id = r.id) AS last_clicked_at
      FROM referral_links r
      ORDER BY r.created_at DESC
    `).all();
    res.json({ data: rows, error: null, meta: { count: rows.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /:id/clicks — 특정 링크의 클릭 상세 */
router.get("/:id/clicks", adminAuth, (req, res) => {
  try {
    const clicks = sqlite.prepare(
      "SELECT * FROM referral_clicks WHERE referral_link_id = ? ORDER BY created_at DESC LIMIT 200"
    ).all(req.params.id);
    res.json({ data: clicks, error: null, meta: { count: clicks.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** DELETE /:id — 링크 비활성화 */
router.delete("/:id", adminAuth, (req, res) => {
  try {
    sqlite.prepare("UPDATE referral_links SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ data: { deactivated: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /go/:code — 공개 클릭 추적 + 리다이렉트 (인증 불요) */
router.get("/go/:code", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM referral_links WHERE code = ? AND is_active = 1").get(req.params.code);
    if (!row) return res.redirect("/consultation");

    // 클릭 기록
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    sqlite.prepare(
      "INSERT INTO referral_clicks (id, referral_link_id, ip_masked, user_agent, referrer) VALUES (?, ?, ?, ?, ?)"
    ).run(crypto.randomUUID(), row.id, maskIp(ip), req.headers["user-agent"] || null, req.headers["referer"] || null);

    // 카운터 업데이트
    sqlite.prepare("UPDATE referral_links SET click_count = click_count + 1, updated_at = datetime('now') WHERE id = ?").run(row.id);

    res.redirect(`/consultation?ref=${row.code}`);
  } catch (e) {
    logger.error({ err: e }, "referral click track failed");
    res.redirect("/consultation");
  }
});

module.exports = router;
