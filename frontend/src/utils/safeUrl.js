/**
 * 외부에서 받은 URL을 안전하게 사용하기 위한 검증 헬퍼.
 *
 * WHY: javascript:, data:, vbscript: 같은 스킴이 <a href> 또는
 *      <video src>로 들어가면 클릭/재생 시 코드 실행이 가능해 XSS가 된다.
 *      서버에서 받은 값이라도 신뢰하지 말고 여기서 한 번 더 검사한다.
 */

/** 허용 스킴 — http/https + 같은 출처 상대경로 */
const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * URL이 안전한 http(s) 또는 상대 경로인지 검사
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeHttpUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // 상대 경로(/path, ./path, path)는 허용
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return !trimmed.startsWith("//"); // protocol-relative 차단
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 안전하지 않은 URL은 fallback(기본값 빈 문자열)으로 대체
 * @param {unknown} url
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function safeHttpUrl(url, fallback = "") {
  return isSafeHttpUrl(url) ? url : fallback;
}
