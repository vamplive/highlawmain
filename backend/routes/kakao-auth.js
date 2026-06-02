/**
 * 카카오 OAuth 라우트 — 로그인 URL 생성, 콜백 처리, 세션 관리
 * 환경변수 KAKAO_REST_API_KEY 미설정 시 모든 엔드포인트 비활성
 */
const { Router } = require("express");
const crypto = require("crypto");
const { sqlite } = require("../db");
const {
  createKakaoSession, getKakaoSession, deleteKakaoSession,
  extractKakaoToken, setSessionCookie, clearSessionCookie,
} = require("../lib/kakao-auth");
const logger = require("../lib/logger");

const router = Router();

/** 카카오 설정 확인 */
function getKakaoConfig() {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;
  return { clientId, redirectUri };
}

/** GET /api/auth/kakao/config — 클라이언트에 카카오 활성 여부 전달 */
router.get("/config", (req, res) => {
  const config = getKakaoConfig();
  res.json({
    data: { enabled: !!config },
    error: null,
    meta: null,
  });
});

/** GET /api/auth/kakao/login-url — 카카오 인가 코드 요청 URL 생성 */
router.get("/login-url", (req, res) => {
  const config = getKakaoConfig();
  if (!config) {
    return res.status(503).json({ data: null, error: "카카오 로그인이 설정되지 않았습니다", meta: null });
  }
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code`;
  res.json({ data: { url }, error: null, meta: null });
});

/** POST /api/auth/kakao/callback — 인가 코드 → 토큰 교환 → 사용자 정보 → 세션 생성 */
router.post("/callback", async (req, res) => {
  const config = getKakaoConfig();
  if (!config) {
    return res.status(503).json({ data: null, error: "카카오 로그인이 설정되지 않았습니다", meta: null });
  }
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ data: null, error: "인가 코드가 필요합니다", meta: null });
  }

  try {
    // 1) 인가 코드 → 액세스 토큰
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      logger.warn({ tokenData }, "kakao token exchange failed");
      return res.status(400).json({ data: null, error: "카카오 인증에 실패했습니다", meta: null });
    }

    // 2) 액세스 토큰 → 사용자 정보
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const kakaoId = String(userData.id);
    const nickname = userData.kakao_account?.profile?.nickname || userData.properties?.nickname || null;
    const profileImage = userData.kakao_account?.profile?.profile_image_url || null;
    const email = userData.kakao_account?.email || null;

    // 3) kakao_users upsert
    const existing = sqlite.prepare("SELECT * FROM kakao_users WHERE kakao_id = ?").get(kakaoId);
    let userId;
    if (existing) {
      sqlite.prepare(
        "UPDATE kakao_users SET nickname = ?, profile_image = ?, email = ?, last_login_at = datetime('now') WHERE id = ?"
      ).run(nickname, profileImage, email, existing.id);
      userId = existing.id;
    } else {
      userId = crypto.randomUUID();
      sqlite.prepare(
        "INSERT INTO kakao_users (id, kakao_id, nickname, profile_image, email) VALUES (?, ?, ?, ?, ?)"
      ).run(userId, kakaoId, nickname, profileImage, email);
    }

    // 4) 세션 생성 + 쿠키
    const token = createKakaoSession(userId, kakaoId, nickname);
    setSessionCookie(res, token);

    res.json({
      data: { id: userId, kakaoId, nickname, profileImage },
      error: null,
      meta: null,
    });
  } catch (e) {
    logger.error({ err: e }, "kakao callback failed");
    res.status(500).json({ data: null, error: "카카오 로그인 처리 중 오류가 발생했습니다", meta: null });
  }
});

/** GET /api/auth/kakao/me — 현재 로그인 상태 확인 */
router.get("/me", (req, res) => {
  const token = extractKakaoToken(req);
  const session = getKakaoSession(token);
  if (!session) {
    return res.json({ data: null, error: null, meta: null });
  }
  const user = sqlite.prepare("SELECT id, kakao_id, nickname, profile_image FROM kakao_users WHERE id = ?").get(session.kakao_user_id);
  res.json({ data: user || null, error: null, meta: null });
});

/** POST /api/auth/kakao/logout — 세션 삭제 + 쿠키 제거 */
router.post("/logout", (req, res) => {
  const token = extractKakaoToken(req);
  deleteKakaoSession(token);
  clearSessionCookie(res);
  res.json({ data: { loggedOut: true }, error: null, meta: null });
});

module.exports = router;
