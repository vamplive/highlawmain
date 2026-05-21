/**
 * 입력 값 sanitize 유틸리티
 */

/**
 * SQL LIKE 쿼리에 사용할 문자열에서 와일드카드 문자를 이스케이프
 * - `%` → `\%`, `_` → `\_`
 * @param {string} str - 사용자 입력 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeLike(str) {
  if (!str) return str;
  return str.replace(/[%_\\]/g, "\\$&");
}

/**
 * URL이 안전한 프로토콜(http/https)인지 검증
 * javascript: 등 악의적 프로토콜 차단
 * @param {string} url - 검증할 URL 문자열
 * @returns {boolean}
 */
function isSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "") return true; // 빈 값은 허용 (선택 필드)
  try {
    const parsed = new URL(trimmed, "https://placeholder.invalid");
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    // 상대 경로(/path)도 허용
    return trimmed.startsWith("/");
  }
}

/**
 * CSS 색상 코드 검증 (#hex 3/4/6/8자리)
 * @param {string} color - 검증할 색상 문자열
 * @returns {boolean}
 */
function isValidColor(color) {
  if (!color || typeof color !== "string") return false;
  return /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color.trim());
}

/**
 * ISO 날짜 문자열 검증 (YYYY-MM-DD 또는 ISO 8601)
 * @param {string} dateStr - 검증할 날짜 문자열
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * 정렬 순서 값 검증 (정수, 합리적 범위)
 * @param {*} value - 검증할 값
 * @returns {boolean}
 */
function isValidSortOrder(value) {
  if (value === undefined || value === null) return true;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 9999;
}

/**
 * 문자열 길이 제한 검증
 * @param {string} str - 검증할 문자열
 * @param {number} maxLen - 최대 길이
 * @returns {boolean}
 */
function isWithinLength(str, maxLen) {
  if (!str || typeof str !== "string") return true;
  return str.length <= maxLen;
}

module.exports = { escapeLike, isSafeUrl, isValidColor, isValidDate, isValidSortOrder, isWithinLength };
