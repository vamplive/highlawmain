/**
 * 페이지 방문 로깅 미들웨어
 * - 공개 페이지 요청만 기록 (API, 관리자, 정적 파일 제외)
 * - IP + User-Agent + 날짜 기반 세션 ID 생성 (고유 방문자 카운팅용)
 *
 * 개인정보 보호:
 * - page_views.ip 컬럼에는 마스킹된 IP만 저장한다 (예: 1.2.3.0).
 *   평문 IP를 직접 저장하지 않는다. 컬럼 rename은 별도 마이그레이션에서 처리.
 * - 일자별 salt 해시(hashIp)는 동일 일자 내 dedupe 용도로만 활용.
 */
const { sqlite } = require("../db");
const crypto = require("crypto");
const { maskIp, hashIp, normalizeIp } = require("./ip-privacy");

const insertStmt = sqlite.prepare(
  "INSERT INTO page_views (id, page, path, referrer, user_agent, ip, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
);

/**
 * 경로에서 페이지 이름 추출
 * @param {string} path - URL 경로
 * @returns {string} 페이지 이름
 */
function getPageName(path) {
  if (path === "/") return "home";
  const segment = path.split("/")[1];
  return segment || "home";
}

/**
 * 일자별 IP 해시 + UA 조합으로 세션 ID 생성 (일별 고유 방문자 식별)
 * - 평문 IP를 해시 입력으로 직접 사용하지 않고, 일자별 salt가 적용된
 *   ipHash를 거쳐 결합한다. 일자가 바뀌면 다른 세션 ID가 된다.
 * @param {string} ipHashValue - hashIp(ip, today) 결과
 * @param {string} ua - User-Agent
 * @returns {string} 16자리 해시
 */
function getSessionId(ipHashValue, ua) {
  const date = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${ipHashValue}:${ua}:${date}`)
    .digest("hex")
    .slice(0, 16);
}

function hasAnalyticsConsent(req) {
  const cookie = req.get("cookie") || "";
  return /(?:^|;\s*)privacy_analytics_consent=granted(?:;|$)/.test(cookie);
}

/**
 * Express 미들웨어 — 페이지 방문 기록
 * - API, 관리자, 정적 파일, 업로드 경로는 제외
 * - 에러 발생 시 무시 (요청 처리를 차단하지 않음)
 */
module.exports = function analyticsMiddleware(req, res, next) {
  const path = req.path;

  // API, 관리자, 정적 파일, 업로드 경로는 기록하지 않음
  if (path.startsWith("/api/") || path.startsWith("/admin") || path.includes(".") || path.startsWith("/uploads")) {
    return next();
  }
  if (!hasAnalyticsConsent(req)) {
    return next();
  }

  try {
    const rawIp = req.ip || req.connection?.remoteAddress || "";
    const normalized = normalizeIp(rawIp);
    const ua = req.get("user-agent") || "";
    const referrer = req.get("referrer") || "";
    // 마스킹된 IP만 저장 (예: 1.2.3.0). 평문 IP 저장 금지.
    const ipMasked = maskIp(normalized);
    const ipHashValue = hashIp(normalized);
    const sessionId = getSessionId(ipHashValue, ua);
    const page = getPageName(path);

    insertStmt.run(crypto.randomUUID(), page, path, referrer, ua, ipMasked, sessionId);
  } catch (_err) {
    // 분석 로깅 실패는 요청 처리를 차단하지 않음
  }

  next();
};
