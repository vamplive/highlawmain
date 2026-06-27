/**
 * 알리고 카카오 알림톡 서비스
 * 공식 API: https://kakaoapi.aligo.in/akv10/
 * 알림톡: 사전 승인된 템플릿만 발송 가능
 * 친구톡과 달리 카카오 채널 친구 추가 불필요
 */

const TEMPLATE_LIST_URL = "https://kakaoapi.aligo.in/akv10/template/list/";
const SEND_URL = "https://kakaoapi.aligo.in/akv10/alimtalk/send/";
const REQUEST_TIMEOUT_MS = 10000;

function readConfig() {
  return {
    apiKey: process.env.ALIGO_API_KEY,
    userId: process.env.ALIGO_USER_ID,
    senderKey: process.env.ALIGO_KAKAO_SENDER_KEY,
    sender: (process.env.ALIGO_SENDER || "").replace(/\D/g, ""),
    testMode: (process.env.ALIGO_TEST_MODE || "N").toUpperCase() === "Y" ? "Y" : "N",
  };
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

/**
 * 알리고에서 승인된 알림톡 템플릿 목록 조회
 * @param {number} page
 * @param {number} limit
 */
async function listKakaoTemplates(page = 1, limit = 100) {
  const config = readConfig();
  if (!config.apiKey || !config.userId || !config.senderKey) {
    return { ok: false, error: "카카오 알림톡 API 설정이 올바르지 않습니다 (ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_KAKAO_SENDER_KEY 확인)", templates: [] };
  }

  const form = new URLSearchParams();
  form.append("apikey", config.apiKey);
  form.append("userid", config.userId);
  form.append("senderkey", config.senderKey);
  form.append("page", String(page));
  form.append("limit", String(limit));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(TEMPLATE_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: form.toString(),
      signal: controller.signal,
    });
    const json = await res.json();
    // 알리고 응답 code: 1 = 성공
    if (Number(json.code) !== 1) {
      return { ok: false, error: json.message || "템플릿 조회 실패", templates: [] };
    }
    // inspStatus: APR=승인, REQ=검토중, REJ=반려 — 승인된 것만 반환
    const templates = (json.list || [])
      .filter(t => t.inspStatus === "APR")
      .map(t => ({
        code: t.templtCode,
        name: t.templtName,
        content: t.templtContent,
        status: t.inspStatus,
        buttons: t.buttons || [],
      }));
    return { ok: true, templates };
  } catch (err) {
    const msg = err.name === "AbortError" ? "카카오 알림톡 API 응답 시간 초과" : (err.message || "알 수 없는 오류");
    return { ok: false, error: msg, templates: [] };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 알림톡 발송 (최대 500명 일괄)
 * @param {Array<{name: string, contact: string, message: string}>} recipients - message는 템플릿 변수 치환 완료된 내용
 * @param {string} templateCode
 */
async function sendKakao(recipients, templateCode) {
  const config = readConfig();
  if (!config.apiKey || !config.userId || !config.senderKey) {
    return { success: false, error: "카카오 알림톡 API 설정이 올바르지 않습니다" };
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { success: false, error: "수신자를 1명 이상 지정해주세요" };
  }
  if (!templateCode) {
    return { success: false, error: "템플릿 코드가 필요합니다" };
  }

  // 알리고는 한 번에 최대 500명 — 배치 처리
  const BATCH = 500;
  const allResults = [];

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const form = new URLSearchParams();
    form.append("apikey", config.apiKey);
    form.append("userid", config.userId);
    form.append("senderkey", config.senderKey);
    form.append("tpl_code", templateCode);
    form.append("sender", config.sender);
    form.append("testmode_yn", config.testMode);

    batch.forEach((r, idx) => {
      const n = idx + 1;
      const phone = normalizePhone(r.contact);
      form.append(`receiver_${n}`, phone);
      form.append(`recvname_${n}`, r.name || phone);
      form.append(`message_${n}`, r.message || "");
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
        body: form.toString(),
        signal: controller.signal,
      });
      const raw = await res.text();
      let json;
      try { json = JSON.parse(raw); } catch {
        allResults.push(...batch.map(r => ({ contact: r.contact, name: r.name, success: false, error: `알리고 응답 형식 오류: ${raw.slice(0, 100)}` })));
        continue;
      }
      if (Number(json.code) === 1) {
        // 성공: info 배열로 개별 결과 확인 가능
        const infos = json.info || [];
        batch.forEach((r, idx) => {
          const info = infos[idx];
          allResults.push({
            contact: r.contact, name: r.name,
            success: true,
            msgId: info?.mid || null,
          });
        });
      } else {
        const errMsg = json.message || "알림톡 발송 실패";
        allResults.push(...batch.map(r => ({ contact: r.contact, name: r.name, success: false, error: errMsg })));
      }
    } catch (err) {
      const msg = err.name === "AbortError" ? "API 응답 시간 초과" : (err.message || "알 수 없는 오류");
      allResults.push(...batch.map(r => ({ contact: r.contact, name: r.name, success: false, error: msg })));
    } finally {
      clearTimeout(timeout);
    }
  }

  const sent = allResults.filter(r => r.success).length;
  return {
    success: sent > 0,
    total: allResults.length,
    sent,
    failed: allResults.length - sent,
    results: allResults,
    testMode: config.testMode === "Y",
  };
}

module.exports = { listKakaoTemplates, sendKakao };
