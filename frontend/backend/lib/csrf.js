/**
 * CSRF 보호 미들웨어 — HMAC 서명 기반 더블 서브밋 쿠키 패턴
 * - GET 요청: HMAC 서명된 csrf-token 쿠키를 설정
 * - POST/PATCH/DELETE 요청: x-csrf-token 헤더의 서명을 서버 시크릿으로 검증
 * - 공개 엔드포인트(로그인, 회원가입, 상담 신청 등)는 검증 제외
 */
const crypto = require("crypto");

/**
 * CSRF 서명용 서버 시크릿
 * - 프로덕션: CSRF_SECRET 환경변수 필수 (없으면 서버 시작 차단)
 * - 개발/테스트: 미설정 시 무작위 생성 (재시작 시 기존 토큰 무효화 — 개발 한정 트레이드오프)
 *
 * WHY: 매 재시작마다 시크릿이 바뀌면 모든 사용자의 CSRF 토큰이 무효가 되어
 *      배포 중 정상 사용자가 403 응답을 받게 된다.
 */
function loadCsrfSecret() {
  if (process.env.CSRF_SECRET) return process.env.CSRF_SECRET;
  if (process.env.NODE_ENV === "production") {
    console.error("[FATAL] CSRF_SECRET 환경변수가 필요합니다. 32바이트 이상의 랜덤 문자열을 .env에 설정하세요.");
    process.exit(1);
  }
  console.warn("[ENV WARNING] CSRF_SECRET 미설정 — 무작위 시크릿으로 임시 동작 (서버 재시작 시 토큰 무효화)");
  return crypto.randomBytes(32).toString("hex");
}
const CSRF_SECRET = loadCsrfSecret();

/** CSRF 검증을 건너뛸 공개 엔드포인트 목록 (method + path) */
const CSRF_EXEMPT_ROUTES = [
  { method: "POST", path: "/api/admin-users/login" },
  // 비밀번호 재설정 흐름 — 사용자에게 세션이 없는 상태에서 호출하므로 CSRF 토큰을
  // 발급/제출할 컨텍스트가 없다. forgot-password는 등록된 이메일로만 발송하고,
  // reset-password는 메일로 발송된 일회용 토큰 자체가 인증 역할을 한다.
  { method: "POST", path: "/api/admin-users/forgot-password" },
  { method: "POST", path: "/api/admin-users/reset-password" },
  { method: "POST", path: "/api/portal/login" },
  { method: "POST", path: "/api/portal/register" },
  { method: "POST", path: "/api/consultations" },
  { method: "POST", path: "/api/newsletter/subscribe" },
  { method: "POST", path: "/api/bookings/book" },
  { method: "POST", path: "/api/reviews" },
];

/**
 * 공개 엔드포인트 prefix — 이 경로로 시작하면 모든 메서드 면제
 * 전자서명 시스템의 토큰 기반 공개 라우트는 토큰 자체가 인증 역할을 하므로
 * CSRF는 면제하고, 세션 쿠키 대신 검증 토큰으로 진위를 판단한다.
 */
const CSRF_EXEMPT_PREFIXES = [
  "/api/public/invite",
  "/api/public/sign",
];

/**
 * 요청이 CSRF 검증 면제 대상인지 확인
 * @param {string} method - HTTP 메서드
 * @param {string} reqPath - 요청 경로
 * @returns {boolean}
 */
function isExempt(method, reqPath) {
  if (CSRF_EXEMPT_ROUTES.some((route) => route.method === method && reqPath === route.path)) return true;
  if (CSRF_EXEMPT_PREFIXES.some((prefix) => reqPath.startsWith(prefix))) return true;
  return false;
}

/**
 * 쿠키 헤더에서 특정 쿠키 값을 파싱
 * @param {string} cookieHeader - Cookie 헤더 문자열
 * @param {string} name - 쿠키 이름
 * @returns {string|null}
 */
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * HMAC 서명된 CSRF 토큰 생성
 * 형식: nonce.signature (nonce = 32바이트 hex, signature = HMAC-SHA256)
 * @returns {string}
 */
function createCsrfToken() {
  const nonce = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

/**
 * CSRF 토큰의 HMAC 서명을 검증 (타이밍 공격 방지)
 * @param {string} token - "nonce.signature" 형식
 * @returns {boolean}
 *
 * 주의: Buffer.from(str, "hex")는 잘못된 hex 문자열을 만나면 조용히 잘라
 *       길이가 짧은 버퍼를 반환한다. 이때 timingSafeEqual은 RangeError를
 *       던지므로 try/catch로 감싸 false 반환을 보장한다.
 */
function verifyCsrfToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;
  const expected = crypto.createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const signatureBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * CSRF 보호 미들웨어
 * Express 미들웨어로 사용: app.use(csrfProtection)
 */
function csrfProtection(req, res, next) {
  // GET/HEAD/OPTIONS 요청: HMAC 서명된 csrf-token 쿠키 설정
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    const existing = parseCookie(req.get("Cookie"), "csrf-token");
    // 기존 토큰이 없거나 서명이 유효하지 않으면 새로 발급
    if (!existing || !verifyCsrfToken(existing)) {
      res.cookie("csrf-token", createCsrfToken(), {
        httpOnly: false, // 프론트엔드 JS에서 읽어야 하므로 httpOnly 비활성화
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return next();
  }

  // 모든 상태 변경 요청을 검증 — /api/ 외부 경로(/api/docs 등)도 보호 대상
  // 공개 엔드포인트는 명시적 화이트리스트(CSRF_EXEMPT_ROUTES)로만 면제한다
  if (isExempt(req.method, req.path)) {
    return next();
  }

  const headerToken = req.get("x-csrf-token");

  if (!headerToken || !verifyCsrfToken(headerToken)) {
    // 정상 사용자는 거의 발생시키지 않는 이벤트 — 공격 시도 신호로 분류해 보안 로그에 남긴다.
    // 순환 참조 방지: csrf는 db 부트스트랩 전에 로드될 수 있어 audit-log를 lazy require.
    try {
      const { logSecurityEvent } = require("./audit-log");
      logSecurityEvent(req, "csrf_reject", { reason: headerToken ? "invalid_token" : "missing_token" });
    } catch { /* 로깅 실패는 응답에 영향 X */ }
    return res.status(403).json({
      data: null,
      error: "CSRF 토큰이 유효하지 않습니다",
      meta: null,
    });
  }

  next();
}

module.exports = csrfProtection;
