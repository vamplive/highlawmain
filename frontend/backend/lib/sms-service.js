/**
 * 알리고(Aligo) 문자 발송 서비스
 * - SMS(90바이트 이하) / LMS(90바이트 초과) 자동 전환
 * - 환경변수: ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER, ALIGO_TEST_MODE
 * - 공식 API 문서: https://smartsms.aligo.in/admin/api/info.html
 */

const ALIGO_ENDPOINT = "https://apis.aligo.in/send/";

/** LMS 전환 기준 바이트 수 (알리고 기준: SMS는 90바이트 이하) */
const SMS_MAX_BYTES = 90;
/** 알리고 단일 메시지 최대 길이 */
const ALIGO_MAX_BYTES = 2000;
/** 알리고 응답 대기 제한 */
const REQUEST_TIMEOUT_MS = 10000;

/**
 * 한글 2바이트, ASCII 1바이트 기준으로 문자열 바이트 수를 계산한다.
 * 알리고는 EUC-KR 기준으로 SMS/LMS를 구분하므로 단순 UTF-8 바이트가 아닌
 * "한글은 2바이트"라는 규칙을 따라야 실제 과금 단위와 일치한다.
 * @param {string} text
 * @returns {number}
 */
function getKoreanByteLength(text) {
  let bytes = 0;
  for (const ch of text) {
    // 기본 다국어 평면 내 한글/한자/전각 문자는 2바이트로 계산
    bytes += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  }
  return bytes;
}

/** 하이픈/공백 제거하여 숫자만 추출한다 */
function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function readConfig() {
  return {
    apiKey: process.env.ALIGO_API_KEY,
    userId: process.env.ALIGO_USER_ID,
    sender: normalizePhone(process.env.ALIGO_SENDER || ""),
    testMode: (process.env.ALIGO_TEST_MODE || "N").toUpperCase() === "Y" ? "Y" : "N",
  };
}

function validateRecipientPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, phone: normalized, error: "수신번호가 비어있습니다" };
  if (!/^0\d{7,14}$/.test(normalized)) {
    return { ok: false, phone: normalized, error: "수신번호 형식이 올바르지 않습니다" };
  }
  return { ok: true, phone: normalized };
}

function buildProviderError(json, status) {
  const code = json?.result_code ?? json?.code;
  const message = json?.message || json?.msg || "알리고 발송 요청이 실패했습니다";
  return code !== undefined
    ? `${message} (알리고 code=${code})`
    : `${message} (HTTP ${status})`;
}

/**
 * SMS/LMS 발송
 * - 메시지가 90바이트를 초과하면 자동으로 LMS로 전환한다.
 * - 관리자 발송·상담 알림 훅 모두 이 함수를 사용한다.
 * @param {string} to - 수신번호 (예: 010-1234-5678)
 * @param {string} text - 메시지 내용
 * @param {object} [options]
 * @param {string} [options.title] - LMS 제목 (미지정 시 기본값 사용, 최대 44바이트)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, testMode?: boolean }>}
 */
async function sendSMS(to, text, options = {}) {
  const config = readConfig();
  if (!config.apiKey || !config.userId || !config.sender) {
    return { success: false, error: "알리고 API 설정이 올바르지 않습니다 (ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER 확인)" };
  }

  const recipient = validateRecipientPhone(to);
  if (!recipient.ok) {
    return { success: false, error: recipient.error };
  }

  const message = String(text || "").trim();
  if (!message) {
    return { success: false, error: "문자 내용이 비어있습니다" };
  }

  const bytes = getKoreanByteLength(message);
  if (bytes > ALIGO_MAX_BYTES) {
    return { success: false, error: `문자 내용은 ${ALIGO_MAX_BYTES}바이트를 초과할 수 없습니다` };
  }
  const msgType = bytes > SMS_MAX_BYTES ? "LMS" : "SMS";

  const form = new URLSearchParams();
  form.append("key", config.apiKey);
  form.append("user_id", config.userId);
  form.append("sender", config.sender);
  form.append("receiver", recipient.phone);
  form.append("msg", message);
  form.append("msg_type", msgType);
  form.append("testmode_yn", config.testMode);
  if (msgType === "LMS") {
    form.append("title", (options.title || "법무법인 하이로").slice(0, 30));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(ALIGO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: form.toString(),
      signal: controller.signal,
    });
    const raw = await res.text();

    // 정상 케이스는 JSON이지만, 방화벽/프록시가 평문 에러를 반환할 수 있어 안전하게 파싱한다
    let json;
    try {
      json = JSON.parse(raw);
    } catch (_) {
      return {
        success: false,
        error: `알리고 응답 형식 오류 (HTTP ${res.status}): ${raw.slice(0, 200)}`,
      };
    }

    // 알리고 응답 규약: result_code=1 성공, 그 외 실패
    if (Number(json.result_code) === 1) {
      return {
        success: true,
        messageId: json.msg_id ? String(json.msg_id) : undefined,
        testMode: config.testMode === "Y",
        msgType: json.msg_type || msgType,
        successCount: Number(json.success_cnt || 1),
      };
    }
    return {
      success: false,
      error: buildProviderError(json, res.status),
      providerCode: json.result_code,
      providerMessage: json.message,
    };
  } catch (err) {
    console.error("[SMS Error]", err.message || err);
    const message = err.name === "AbortError"
      ? "알리고 문자 발송 요청 시간이 초과되었습니다"
      : (err.message || "문자 발송에 실패했습니다.");
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  sendSMS,
  getKoreanByteLength,
  normalizePhone,
  validateRecipientPhone,
};
