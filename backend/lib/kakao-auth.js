/**
 * 카카오 로그인 세션 관리 — auth.js 패턴을 따른다
 * - kakao_sessions 테이블에 SHA-256 해시로 토큰 저장
 * - HttpOnly 쿠키(kakao_session) + 헤더 폴백
 * - 환경변수 KAKAO_REST_API_KEY 미설정 시 전체 비활성
 */
const crypto = require("crypto");
const { sqlite } = require("../db");

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const COOKIE_NAME = "kakao_session";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** 카카오 세션 생성 — 평문 토큰 반환, DB에는 해시 저장 */
function createKakaoSession(kakaoUserId, kakaoId, nickname) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  sqlite.prepare(
    "INSERT INTO kakao_sessions (token_hash, kakao_user_id, kakao_id, nickname, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(tokenHash, kakaoUserId, kakaoId, nickname || null, Date.now());
  return token;
}

/** 토큰 유효성 확인 — 만료 시 자동 삭제 */
function getKakaoSession(token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = sqlite.prepare("SELECT * FROM kakao_sessions WHERE token_hash = ?").get(tokenHash);
  if (!row) return null;
  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    sqlite.prepare("DELETE FROM kakao_sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }
  return row;
}

function deleteKakaoSession(token) {
  if (!token) return;
  sqlite.prepare("DELETE FROM kakao_sessions WHERE token_hash = ?").run(hashToken(token));
}

/** 요청에서 카카오 토큰 추출 (쿠키 우선, 헤더 폴백) */
function extractKakaoToken(req) {
  return req.cookies?.[COOKIE_NAME] || req.headers["x-kakao-token"] || null;
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// 만료 세션 정리 (15분 주기)
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  sqlite.prepare("DELETE FROM kakao_sessions WHERE created_at < ?").run(cutoff);
}, CLEANUP_INTERVAL_MS).unref();

module.exports = {
  createKakaoSession,
  getKakaoSession,
  deleteKakaoSession,
  extractKakaoToken,
  setSessionCookie,
  clearSessionCookie,
  COOKIE_NAME,
};
