/**
 * 구조화 로거 — pino 기반.
 *
 * - 프로덕션: NDJSON 출력 (로그 수집 도구가 파싱하기 쉬움)
 * - 개발/테스트: 사람이 읽기 쉬운 한 줄 포맷 (msg 위주)
 *
 * request-id 부착은 lib/request-id.js의 미들웨어가 처리하며,
 * pino-http는 본 logger를 child logger로 확장하여 각 요청에 컨텍스트를 붙인다.
 *
 * 점진 마이그레이션 정책:
 *   기존 console.error/warn은 그대로 두되, 신규 코드와 글로벌 에러 핸들러는 logger를 사용한다.
 *   라우트 레벨 console.* 정리는 후속 PR로 분리한다.
 *
 * PII redact 정책:
 *   logger.error({ err, req, body }) 같은 패턴에서 password/token/phone/email 등이
 *   stdout·로그파일로 새지 않도록 pino redact 옵션으로 일괄 마스킹한다.
 *   redact는 정적 경로(또는 단일 와일드카드)만 지원하므로 자주 사용되는 위치를 명시한다.
 */
const pino = require("pino");

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// 민감 키 — pino redact는 와일드카드 '*' (한 단계)만 지원하므로 깊이별로 명시한다.
// 새 위치가 필요하면 같은 키 이름을 깊이별 경로로 추가한다.
const REDACT_PATHS = [
  // top-level (직접 객체에 키가 있는 경우)
  "password",
  "passwordHash",
  "passwordConfirm",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "resetToken",
  "resetTokenHash",
  "totpSecret",
  "totp_secret",
  "phone",
  "phoneNumber",
  "email",
  "ssn",
  "birthdate",
  "cardNumber",
  "last4",

  // 깊이 1 ({ user: { password } } 등)
  "*.password",
  "*.passwordHash",
  "*.passwordConfirm",
  "*.currentPassword",
  "*.newPassword",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.resetToken",
  "*.resetTokenHash",
  "*.totpSecret",
  "*.totp_secret",
  "*.phone",
  "*.phoneNumber",
  "*.email",
  "*.ssn",
  "*.birthdate",
  "*.cardNumber",
  "*.last4",

  // request 객체를 통째로 로깅하는 패턴 ({ req }) 대비
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["x-csrf-token"]',
  'req.headers["x-portal-token"]',
  "req.body.password",
  "req.body.passwordHash",
  "req.body.currentPassword",
  "req.body.newPassword",
  "req.body.token",
  "req.body.accessToken",
  "req.body.refreshToken",
  "req.body.resetToken",
  "req.body.totpSecret",
  "req.body.phone",
  "req.body.phoneNumber",
  "req.body.email",
  "req.body.ssn",
  "req.body.birthdate",
  "req.body.cardNumber",

  // morgan/express style 직접 로깅
  'request.headers.cookie',
  'request.headers.authorization',
  'request.headers["x-csrf-token"]',
  'request.headers["x-portal-token"]',
];

const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? "warn" : isProduction ? "info" : "debug"),
  // 프로덕션 외에는 단순한 포맷으로 (pino-pretty 의존성 추가 없이 transport 미사용)
  base: undefined, // pid/hostname 제거 — 로그 가독성 향상
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
    // 키 자체는 유지하되 값만 치환 — 디버깅 시 어떤 필드가 가려졌는지 파악 가능
    remove: false,
  },
});

module.exports = logger;
module.exports.REDACT_PATHS = REDACT_PATHS;
