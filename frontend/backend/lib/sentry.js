/**
 * Sentry 에러 수집 초기화 — DSN이 설정된 환경(주로 프로덕션)에서만 활성화.
 *
 * - SENTRY_DSN 미설정이면 no-op으로 동작하여 dev/test 환경을 방해하지 않는다.
 * - pino logger와 공존: logger.error가 구조화된 요청 컨텍스트를 남기고,
 *   Sentry는 예외 스택 + 릴리즈/환경 태그로 장기 저장·경보를 담당한다.
 * - Express 통합은 index.js에서 requestHandler/errorHandler를 명시 장착한다.
 *
 * PII redact 정책:
 *   beforeSend 단계에서 헤더·쿠키·body·query_string·user.ip_address를 모두
 *   마스킹하여 Sentry 서버로 평문 PII가 전송되지 않도록 한다.
 */
const dsn = process.env.SENTRY_DSN;
const enabled = Boolean(dsn);

// logger와 동일한 키 리스트로 일관된 마스킹 정책 적용
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "passwordconfirm",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "resettoken",
  "resettokenhash",
  "totpsecret",
  "totp_secret",
  "phone",
  "phonenumber",
  "email",
  "ssn",
  "birthdate",
  "cardnumber",
  "card_number",
  "last4",
  "authorization",
  "cookie",
  "x-csrf-token",
  "x-portal-token",
]);

const REDACTED = "[REDACTED]";

/**
 * 객체/배열을 재귀 순회하며 민감 키의 값을 [REDACTED]로 치환한다.
 * 순환 참조 보호를 위해 WeakSet으로 방문 노드를 추적한다.
 * @param {*} value 마스킹 대상 (객체/배열/원시값)
 * @param {WeakSet} [seen] 재귀 호출 시 전달되는 방문 추적 집합
 * @returns {*} 동일한 형태의 마스킹된 값 (원본은 변경하지 않음)
 */
function redactSensitive(value, seen = new WeakSet()) {
  if (value == null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }

  const result = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
      result[key] = REDACTED;
    } else {
      result[key] = redactSensitive(val, seen);
    }
  }
  return result;
}

/**
 * application/x-www-form-urlencoded 형태의 query_string에서 민감 파라미터 마스킹.
 * @param {string} qs ?를 제외한 쿼리 문자열
 * @returns {string} 마스킹된 쿼리 문자열
 */
function redactQueryString(qs) {
  if (typeof qs !== "string" || qs.length === 0) return qs;
  return qs
    .split("&")
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq < 0) return part;
      const k = part.slice(0, eq);
      const decoded = decodeURIComponent(k).toLowerCase();
      if (SENSITIVE_KEYS.has(decoded)) return `${k}=${REDACTED}`;
      return part;
    })
    .join("&");
}

/**
 * IP 주소 마지막 옥텟(IPv4) 또는 마지막 64비트(IPv6)를 0으로 치환.
 * @param {string} ip 원본 IP 문자열
 * @returns {string} 마스킹된 IP
 */
function maskIp(ip) {
  if (typeof ip !== "string" || ip.length === 0) return ip;
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      parts[3] = "0";
      return parts.join(".");
    }
    return ip;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    // 앞 4그룹(64비트)만 유지하고 나머지는 0
    return parts.slice(0, 4).concat(["0", "0", "0", "0"]).join(":");
  }
  return ip;
}

/**
 * Sentry beforeSend 훅 — 이벤트가 전송되기 전 PII를 마스킹한다.
 * 단위 테스트에서 직접 호출할 수 있도록 export 한다.
 * @param {object} event Sentry 이벤트 객체
 * @returns {object} 마스킹된 이벤트
 */
function sanitizeEvent(event) {
  if (!event || typeof event !== "object") return event;

  if (event.request && typeof event.request === "object") {
    const req = event.request;

    // 헤더: 키별로 명시 마스킹 + 일반 재귀 마스킹
    if (req.headers && typeof req.headers === "object") {
      const h = req.headers;
      if (h.cookie) h.cookie = REDACTED;
      if (h.Cookie) h.Cookie = REDACTED;
      if (h.authorization) h.authorization = REDACTED;
      if (h.Authorization) h.Authorization = REDACTED;
      if (h["x-portal-token"]) h["x-portal-token"] = REDACTED;
      if (h["x-csrf-token"]) h["x-csrf-token"] = REDACTED;
    }

    // 쿠키 객체/문자열은 통째로 마스킹 (개별 쿠키 값 식별 어려움)
    if (req.cookies !== undefined && req.cookies !== null) {
      req.cookies = REDACTED;
    }

    // body (Sentry는 request body를 data 필드에 담는다)
    if (req.data !== undefined && req.data !== null) {
      req.data = redactSensitive(req.data);
    }

    // query string
    if (typeof req.query_string === "string") {
      req.query_string = redactQueryString(req.query_string);
    } else if (req.query_string && typeof req.query_string === "object") {
      req.query_string = redactSensitive(req.query_string);
    }
  }

  // user.ip_address 마스킹 (sendDefaultPii: false로도 막을 수 있으나
  // 운영자가 의도적으로 setUser({ ip_address }) 한 경우 대비 추가 방어)
  if (event.user && typeof event.user === "object") {
    if (event.user.ip_address) {
      event.user.ip_address = maskIp(event.user.ip_address);
    }
    if (event.user.email) event.user.email = REDACTED;
    if (event.user.phone) event.user.phone = REDACTED;
  }

  // extra/contexts에 포함된 임의 페이로드도 재귀 마스킹
  if (event.extra && typeof event.extra === "object") {
    event.extra = redactSensitive(event.extra);
  }
  if (event.contexts && typeof event.contexts === "object") {
    event.contexts = redactSensitive(event.contexts);
  }

  return event;
}

// DSN 미설정 시 @sentry/node를 로딩하지 않아 로컬 개발 환경 기동 속도 개선
let Sentry;
if (enabled) {
  Sentry = require("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production",
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
    // SDK 차원에서 IP·기본 PII 자동 수집을 끄고, beforeSend에서 추가 방어한다.
    sendDefaultPii: false,
    beforeSend(event) {
      return sanitizeEvent(event);
    },
  });
} else {
  Sentry = {
    captureException() {},
    captureMessage() {},
    withScope(cb) { cb({ setTag() {}, setExtra() {} }); },
  };
}

module.exports = { Sentry, enabled, sanitizeEvent, redactSensitive, maskIp };
