/**
 * 메시지 렌더링 공통 모듈
 * - 플레이스홀더 치환 ({name}, {date}, {category}, {unsubscribe_link})
 * - 이메일 자동 푸터 (수신거부 링크) 및 열람 추적 픽셀 삽입
 * - sb-messages.js(즉시 발송)와 schedule-service.js(예약/트리거 발송)가 공유
 */
const { db } = require("../db");
const { clients } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { cleanPhone } = require("../services/helpers");
const crypto = require("crypto");

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** 상담 방식 한국어 라벨 */
const MEETING_TYPE_LABELS = {
  in_person: "대면 상담", phone: "전화 상담", video: "화상 상담",
};

/** 사무소 주소 — 대면 상담 안내용 (환경변수로 오버라이드 가능) */
const OFFICE_ADDRESS = process.env.OFFICE_ADDRESS || "서울특별시 서초구 서초대로 327, 5층";

/** 외부에 노출할 기본 URL — 이메일/SMS에 포함되는 수신거부/추적 링크의 호스트 */
function getAppUrl() {
  return process.env.APP_URL || "http://localhost:5173";
}

/**
 * 수신자 연락처로 unsubscribe_token을 조회한다.
 * 토큰이 NULL인 고객은 이 자리에서 생성해 저장한다 (기존 행 누락 대비).
 * @param {string} contact - 전화번호(숫자만) 또는 이메일
 * @returns {Promise<string|null>} 토큰 또는 null(고객 미등록)
 */
async function resolveUnsubscribeToken(contact) {
  if (!contact) return null;
  const isEmail = contact.includes("@");
  const normalized = isEmail ? contact.trim().toLowerCase() : cleanPhone(contact);
  const column = isEmail ? clients.email : clients.phone;

  const [row] = await db.select({ id: clients.id, token: clients.unsubscribeToken })
    .from(clients)
    .where(eq(column, normalized));
  if (!row) return null;
  if (row.token) return row.token;

  // 토큰 없으면 즉석 생성
  const token = crypto.randomUUID();
  await db.update(clients)
    .set({ unsubscribeToken: token })
    .where(eq(clients.id, row.id));
  return token;
}

/**
 * 수신거부 URL 생성
 * @param {string|null} token
 * @returns {string|null}
 */
function buildUnsubscribeUrl(token) {
  if (!token) return null;
  return `${getAppUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * 열람 추적 픽셀 URL — 1x1 투명 이미지 엔드포인트
 * @param {string} logId - message_logs.id
 */
function buildOpenTrackingUrl(logId) {
  if (!logId) return null;
  return `${getAppUrl().replace(/\/$/, "")}/api/messages/track/open/${encodeURIComponent(logId)}.gif`;
}

/**
 * 플레이스홀더 치환 — {name}, {{name}}, {고객명}, {date}, {category}, {unsubscribe_link}
 * @param {string} text
 * @param {{ name?:string, category?:string, unsubscribeUrl?:string|null }} data
 * @returns {string}
 */
function replacePlaceholders(text, data) {
  if (!text) return "";
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const meetingType = data.meetingType ? (MEETING_TYPE_LABELS[data.meetingType] || data.meetingType) : "";
  // 화상: Meet 링크 / 대면: 사무소 주소 / 전화: 안내 문구
  let meetingInfo = "";
  if (data.meetingType === "video") meetingInfo = data.meetingLink || "(링크 준비 중)";
  else if (data.meetingType === "in_person") meetingInfo = OFFICE_ADDRESS;
  else if (data.meetingType === "phone") meetingInfo = "담당자가 해당 시각에 연락드립니다";

  return String(text)
    .replace(/\{\{\s*(name|customerName|clientName|고객명|고객\s*이름|수신자명|성명|이름)\s*\}\}/gi, data.name || "")
    .replace(/\{\s*(name|customerName|clientName|고객명|고객\s*이름|수신자명|성명|이름)\s*\}/gi, data.name || "")
    .replace(/\{\{\s*date\s*\}\}/gi, today)
    .replace(/\{\s*date\s*\}/gi, today)
    .replace(/\{\{\s*category\s*\}\}/gi, CATEGORY_LABELS[data.category] || data.category || "")
    .replace(/\{\s*category\s*\}/gi, CATEGORY_LABELS[data.category] || data.category || "")
    .replace(/\{\{\s*meeting_type\s*\}\}/gi, meetingType)
    .replace(/\{\s*meeting_type\s*\}/gi, meetingType)
    .replace(/\{\{\s*meeting_link\s*\}\}/gi, data.meetingLink || "")
    .replace(/\{\s*meeting_link\s*\}/gi, data.meetingLink || "")
    .replace(/\{\{\s*meeting_info\s*\}\}/gi, meetingInfo)
    .replace(/\{\s*meeting_info\s*\}/gi, meetingInfo)
    .replace(/\{\{\s*meeting_address\s*\}\}/gi, OFFICE_ADDRESS)
    .replace(/\{\s*meeting_address\s*\}/gi, OFFICE_ADDRESS)
    .replace(/\{\{\s*unsubscribe_link\s*\}\}/gi, data.unsubscribeUrl || "")
    .replace(/\{\s*unsubscribe_link\s*\}/gi, data.unsubscribeUrl || "");
}

/**
 * 이메일 HTML 본문에 수신거부 푸터를 자동 추가한다.
 * - 본문에 {unsubscribe_link}가 이미 포함됐으면 별도 푸터 추가 안 함 (중복 방지)
 * - 본문이 HTML이 아니면 개행을 <br>로 변환
 * @param {string} content - 원본 본문 (HTML 또는 평문)
 * @param {string|null} unsubscribeUrl
 * @returns {string} 푸터가 추가된 HTML
 */
function appendEmailFooter(content, unsubscribeUrl) {
  const hasHtmlTag = /<(p|div|br|table|a|span|h[1-6])/i.test(content || "");
  const body = hasHtmlTag ? content : String(content || "").replace(/\n/g, "<br>");

  if (!unsubscribeUrl) return body;

  const footer = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888;line-height:1.6;">
  본 메시지는 상담·정보 제공 목적으로 발송되었습니다.<br>
  더 이상 수신을 원치 않으시면 <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">여기</a>를 클릭해 주세요.
</div>`;
  return body + footer;
}

/**
 * 이메일 HTML에 열람 추적 1x1 픽셀을 삽입한다.
 * @param {string} html
 * @param {string|null} logId
 * @returns {string}
 */
function injectTrackingPixel(html, logId) {
  const url = buildOpenTrackingUrl(logId);
  if (!url) return html;
  return `${html}<img src="${url}" width="1" height="1" alt="" style="display:none" />`;
}

module.exports = {
  getAppUrl,
  resolveUnsubscribeToken,
  buildUnsubscribeUrl,
  buildOpenTrackingUrl,
  replacePlaceholders,
  appendEmailFooter,
  injectTrackingPixel,
};
