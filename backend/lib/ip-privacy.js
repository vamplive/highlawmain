/**
 * ip-privacy.js — IP 주소 프라이버시 헬퍼
 *
 * page_views 등 분석 로그에서 평문 IP를 저장하지 않기 위해 사용한다.
 * - maskIp(ip)         : IPv4 마지막 옥텟을 0으로 치환, IPv6는 /64 prefix만 유지
 * - hashIp(ip, dateStr): 일자별 salt(ANALYTICS_IP_SALT + YYYY-MM-DD) 기반 SHA-256 16자
 *
 * 같은 사용자라도 일자가 바뀌면 다른 해시가 나오므로 장기 추적은 불가능하다.
 * 동일 일자 내 dedupe(고유 방문자 카운팅) 용도에만 사용한다.
 *
 * 참고: blog.js에는 별도의 maskIp/hashIp(HMAC + IP_HASH_SECRET)가 있다.
 * 그쪽은 장기 보관 가능한 안정 식별자가 필요한 블로그 조회 이벤트용이라
 * 패턴이 다르며, 본 헬퍼와는 의도적으로 분리한다.
 */
const crypto = require("crypto");

/**
 * IPv4-mapped IPv6(::ffff:1.2.3.4) 같은 prefix를 제거해 정규화한다.
 * @param {string} ip
 * @returns {string}
 */
function normalizeIp(ip = "") {
  return String(ip || "").replace(/^::ffff:/i, "").trim();
}

/**
 * IP를 마스킹해 일부 식별성을 제거한다.
 * - IPv4: a.b.c.d → a.b.c.0
 * - IPv6: 앞 4그룹(/64)만 유지하고 뒤는 ":"로 절단 (예: 2001:db8:1:2::)
 * - 빈 문자열/이상값은 빈 문자열 반환
 *
 * @param {string} ip
 * @returns {string} 마스킹된 IP 문자열
 */
function maskIp(ip = "") {
  const value = normalizeIp(ip);
  if (!value) return "";

  if (value.includes(".") && !value.includes(":")) {
    const parts = value.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return "";
  }

  if (value.includes(":")) {
    // /64 prefix(앞 4 hextet)만 유지하고 나머지는 잘라낸다.
    // "::"가 등장하면 거기서 즉시 절단해 압축 표기를 보존한다.
    // 예) 2001:db8::1   → 2001:db8::
    //     2001:db8:1:2:3:4:5:6 → 2001:db8:1:2::
    const compressedAt = value.indexOf("::");
    let prefix;
    if (compressedAt >= 0) {
      const head = value.slice(0, compressedAt);
      const headGroups = head ? head.split(":") : [];
      prefix = headGroups.slice(0, 4).join(":");
    } else {
      const groups = value.split(":");
      prefix = groups.slice(0, 4).join(":");
    }
    return prefix ? `${prefix}::` : "::";
  }

  return "";
}

/**
 * IP를 일자별 salt로 해싱한다.
 * @param {string} ip
 * @param {string} [dateStr] - YYYY-MM-DD. 미지정 시 오늘 날짜(UTC) 사용
 * @returns {string} 16자 hex
 */
function hashIp(ip = "", dateStr) {
  const value = normalizeIp(ip);
  if (!value) return "";
  const day = dateStr || new Date().toISOString().slice(0, 10);
  const baseSalt = process.env.ANALYTICS_IP_SALT || "";
  const dailySalt = `${baseSalt}${day}`;
  return crypto
    .createHash("sha256")
    .update(`${value}${dailySalt}`)
    .digest("hex")
    .slice(0, 16);
}

module.exports = { maskIp, hashIp, normalizeIp };
