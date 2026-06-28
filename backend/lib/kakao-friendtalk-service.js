/**
 * 알리고 카카오 채널 친구톡(FriendTalk) 발송 서비스
 * - 엔드포인트: https://kakaoapi.aligo.in/akv10/friend/send/
 * - 필수 환경변수: ALIGO_API_KEY, KAKAO_SENDER_KEY
 *   + KAKAO_USER_ID (카카오 전용 계정 ID) 또는 ALIGO_USER_ID (SMS와 공유)
 * - 선택 환경변수: ALIGO_TEST_MODE (Y이면 테스트 발송)
 * - 친구톡은 카카오 채널을 추가한 수신자에게만 발송됨 (미추가 시 실패)
 */

const FRIENDTALK_ENDPOINT = "https://kakaoapi.aligo.in/akv10/friend/send/";
const REQUEST_TIMEOUT_MS = 10000;

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, phone: normalized, error: "수신번호가 비어있습니다" };
  if (!/^0\d{7,14}$/.test(normalized)) return { ok: false, phone: normalized, error: "수신번호 형식이 올바르지 않습니다" };
  return { ok: true, phone: normalized };
}

function readConfig() {
  return {
    apiKey: process.env.ALIGO_API_KEY,
    // 카카오 계정이 SMS 계정과 다를 경우 KAKAO_USER_ID로 분리 설정 가능
    userId: process.env.KAKAO_USER_ID || process.env.ALIGO_USER_ID,
    senderKey: process.env.KAKAO_SENDER_KEY,
    testMode: (process.env.ALIGO_TEST_MODE || "N").toUpperCase() === "Y" ? "Y" : "N",
  };
}

/**
 * 카카오 채널 친구톡 1건 발송
 * @param {string} to - 수신번호 (예: 010-1234-5678)
 * @param {string} message - 메시지 내용
 * @param {object} [options]
 * @param {string} [options.name] - 수신자 이름
 * @param {string} [options.imageUrl] - 이미지 URL (이미지형 친구톡)
 * @param {string} [options.imageLink] - 이미지 클릭 링크
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendFriendTalk(to, message, options = {}) {
  const config = readConfig();
  if (!config.apiKey || !config.userId || !config.senderKey) {
    return { success: false, error: "카카오 친구톡 설정이 올바르지 않습니다 (ALIGO_API_KEY, KAKAO_SENDER_KEY, KAKAO_USER_ID 또는 ALIGO_USER_ID 확인)" };
  }

  const recipient = validatePhone(to);
  if (!recipient.ok) {
    return { success: false, error: recipient.error };
  }

  const text = String(message || "").trim();
  if (!text) {
    return { success: false, error: "메시지 내용이 비어있습니다" };
  }

  const form = new URLSearchParams();
  form.append("apikey", config.apiKey);
  form.append("userid", config.userId);
  form.append("senderkey", config.senderKey);
  form.append("tpl_code", "");
  form.append("receiver_1", recipient.phone);
  form.append("recvname_1", options.name || "");
  form.append("subject_1", text.slice(0, 10));
  form.append("message_1", text);
  if (options.imageUrl) {
    form.append("image_url", options.imageUrl);
    form.append("image_link", options.imageLink || "");
  }
  form.append("failover", "N");
  form.append("testMode", config.testMode);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(FRIENDTALK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: form.toString(),
      signal: controller.signal,
    });
    const raw = await res.text();

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return { success: false, error: `카카오 응답 형식 오류 (HTTP ${res.status}): ${raw.slice(0, 200)}` };
    }

    // 알리고 응답 규약: result_code=1 성공, 그 외 실패
    if (Number(json.result_code) === 1) {
      return {
        success: true,
        messageId: json.msg_id ? String(json.msg_id) : undefined,
        testMode: config.testMode === "Y",
      };
    }
    return {
      success: false,
      error: json.message || "카카오 친구톡 발송 실패",
      providerCode: json.result_code,
    };
  } catch (err) {
    const message = err.name === "AbortError"
      ? "카카오 친구톡 발송 요청 시간이 초과되었습니다"
      : (err.message || "카카오 친구톡 발송에 실패했습니다");
    return { success: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendFriendTalk, normalizePhone };
