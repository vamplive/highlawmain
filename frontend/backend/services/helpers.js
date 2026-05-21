/**
 * 서비스 레이어 공통 헬퍼 함수
 * - UUID 검증, 페이지네이션 계산, 타임스탬프 생성, 커스텀 에러 클래스
 */

/** UUID v4 형식 정규식 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 한국 전화번호 패턴 (010-1234-5678, 01012345678, 02-535-0461 등) */
const KOREAN_PHONE_REGEX = /^(0[0-9]{1,2})-?([0-9]{3,4})-?([0-9]{4})$/;

/**
 * HTTP 상태 코드를 포함하는 서비스 에러
 * 라우트에서 catch 후 e.status로 응답 코드를 결정한다.
 */
class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

/**
 * UUID 형식을 검증하고, 유효하지 않으면 ServiceError를 던진다.
 * @param {string} id - 검증할 ID 문자열
 * @throws {ServiceError} 유효하지 않은 ID일 때
 */
function validateUUID(id) {
  if (!id || !UUID_REGEX.test(id)) {
    throw new ServiceError("유효하지 않은 ID 형식입니다", 400);
  }
}

/**
 * 페이지네이션 파라미터를 정규화한다.
 * @param {object} params - { page, limit } 쿼리 파라미터
 * @param {object} [options] - { maxLimit } 최대 limit 값 (기본 100)
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(params, options = {}) {
  const { maxLimit = 100 } = options;
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(params.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * 페이지네이션 메타 정보를 생성한다.
 * @param {number} total - 전체 레코드 수
 * @param {number} page - 현재 페이지
 * @param {number} limit - 페이지당 레코드 수
 * @returns {{ total: number, page: number, limit: number, totalPages: number }}
 */
function buildPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * SQLite용 현재 시각 문자열을 생성한다 (YYYY-MM-DD HH:MM:SS 형식).
 * @returns {string}
 */
function nowTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

/**
 * 전화번호에서 하이픈/공백을 제거한다.
 * @param {string} phone
 * @returns {string}
 */
function cleanPhone(phone) {
  return (phone || "").replace(/\D/g, "");
}

/**
 * 관리자 UI/기존 데이터에서 들어올 수 있는 채널 라벨을 API 내부 값으로 정규화한다.
 * @param {string} channel
 * @returns {string}
 */
function normalizeMessageChannel(channel) {
  const value = String(channel || "").trim().toLowerCase();
  if (["sms", "문자", "sms 문자", "sms문자", "text"].includes(value)) return "sms";
  if (["email", "e-mail", "이메일", "메일"].includes(value)) return "email";
  return value;
}

module.exports = {
  UUID_REGEX,
  KOREAN_PHONE_REGEX,
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
  cleanPhone,
  normalizeMessageChannel,
};
