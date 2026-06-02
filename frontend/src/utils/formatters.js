/**
 * 공통 포맷터 유틸리티
 * — Admin 페이지에서 반복되던 날짜/전화번호/바이트 포맷 함수를 통합
 */

/**
 * ISO 날짜 문자열을 "2025.03.15" 형식으로 변환한다.
 * @param {string|null} dateStr - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜 또는 "-"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

/**
 * ISO 날짜 문자열을 "2025.03.15 14:30" 형식으로 변환한다.
 * @param {string|null} dateStr - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜시간 또는 "-"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * 전화번호를 하이픈 포맷으로 변환한다 (01012345678 → 010-1234-5678).
 * @param {string|null} phone - 전화번호 문자열
 * @returns {string} 포맷된 전화번호 또는 "-"
 */
export function formatPhone(phone) {
  if (!phone) return "-";
  const clean = phone.replace(/[-\s]/g, "");
  if (clean.length === 11) return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  return phone;
}

/**
 * 문자열의 바이트 길이를 계산한다 (한글 등 2바이트 문자 감안).
 * @param {string} str - 대상 문자열
 * @returns {number} 바이트 길이
 */
export function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += str.charCodeAt(i) > 127 ? 2 : 1;
  }
  return len;
}

/**
 * 긴 텍스트를 지정 길이로 잘라내고 "..."을 붙인다.
 * @param {string|null} str - 대상 문자열
 * @param {number} [maxLen=50] - 최대 길이
 * @returns {string} 잘라낸 문자열
 */
export function truncate(str, maxLen = 50) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

/**
 * 전화번호를 부분 마스킹한다 (010-1234-5678 → 010-****-5678).
 * 개인정보 보호를 위해 발송 이력 등에서 중간 자리를 가린다.
 * @param {string|null} phone - 전화번호
 * @returns {string} 마스킹된 전화번호
 */
export function maskPhone(phone) {
  if (!phone) return "-";
  const clean = phone.replace(/[-\s]/g, "");
  if (clean.length === 11) return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  if (clean.length === 10) return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  return phone;
}

/**
 * 이메일 주소를 부분 마스킹한다 (abc@xyz.com → a**@xyz.com).
 * @param {string|null} email - 이메일 주소
 * @returns {string} 마스킹된 이메일
 */
export function maskEmail(email) {
  if (!email) return "-";
  const at = email.indexOf("@");
  if (at < 1) return email;
  const head = email.slice(0, at);
  const tail = email.slice(at);
  const visible = head.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(1, head.length - 1))}${tail}`;
}

/**
 * 이름을 부분 마스킹한다 (홍길동 → 홍*동, 김철수 → 김*수, 이박 → 이*).
 * @param {string|null} name - 이름
 * @returns {string} 마스킹된 이름
 */
export function maskName(name) {
  if (!name) return "-";
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

/**
 * 수신자 연락처를 포맷 + 마스킹한다 (전화번호인지 이메일인지 자동 판별).
 * @param {string|null} contact - 전화번호 또는 이메일
 * @param {boolean} [masked=false] - true면 마스킹 적용
 * @returns {string}
 */
export function formatContact(contact, masked = false) {
  if (!contact) return "-";
  if (contact.includes("@")) return masked ? maskEmail(contact) : contact;
  return masked ? maskPhone(contact) : formatPhone(contact);
}

/**
 * 플레이스홀더를 치환한다 ({name}, {{name}}, {고객명}, {date}, {category}).
 * @param {string} template - 치환할 문자열
 * @param {object} data - { name, category } 치환 데이터
 * @returns {string}
 */
export function renderPlaceholders(template, data = {}) {
  if (!template) return "";
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
  const categoryMap = {
    general: "일반", civil: "민사", criminal: "형사", family: "가사",
    admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
  };
  return template
    .replace(/\{\{\s*(name|customerName|clientName|고객명|고객\s*이름|수신자명|성명|이름)\s*\}\}/gi, data.name || "")
    .replace(/\{\s*(name|customerName|clientName|고객명|고객\s*이름|수신자명|성명|이름)\s*\}/gi, data.name || "")
    .replace(/\{\{\s*date\s*\}\}/gi, today)
    .replace(/\{\s*date\s*\}/gi, today)
    .replace(/\{\{\s*category\s*\}\}/gi, categoryMap[data.category] || data.category || "")
    .replace(/\{\s*category\s*\}/gi, categoryMap[data.category] || data.category || "");
}

/**
 * 다양한 형태의 저자 데이터를 문자열로 변환한다.
 * 백엔드에서 저자가 문자열, 배열, 또는 JSON 문자열로 올 수 있기 때문에 통일 처리가 필요하다.
 * @param {string|string[]|null} author - 저자 데이터
 * @returns {string} 포맷된 저자명
 */
export function parseAuthor(author) {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (Array.isArray(author)) return author.join(", ");
  return String(author);
}
