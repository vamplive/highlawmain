/**
 * 구글 캘린더 OAuth2 — 포털 사용자 개인 캘린더 연동
 *
 * 필요 환경변수:
 *   GOOGLE_OAUTH_CLIENT_ID     : Google Cloud Console OAuth 클라이언트 ID
 *   GOOGLE_OAUTH_CLIENT_SECRET : OAuth 클라이언트 시크릿
 *   APP_URL                    : 리디렉트 기본 URL (예: https://highlaw.co.kr)
 *
 * 설정 방법:
 *   1. console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs
 *   2. 승인된 리디렉션 URI: {APP_URL}/api/portal/google/callback
 *   3. Google Calendar API 활성화
 */

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const BASE_URL = (process.env.APP_URL || "http://localhost:5001").replace(/\/$/, "");
const REDIRECT_URI = `${BASE_URL}/api/portal/google/callback`;
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const TIMEZONE = "Asia/Seoul";

function isConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

/** 구글 OAuth2 인증 URL 생성 */
function getAuthUrl(stateToken) {
  if (!isConfigured()) return null;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: stateToken,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * 인증 코드를 토큰으로 교환
 * @returns {{ accessToken, refreshToken, expiresAt }}
 */
async function exchangeCodeForTokens(code) {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || "토큰 교환 실패");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

/**
 * 액세스 토큰 갱신 (만료된 경우)
 * @returns {{ accessToken, expiresAt }}
 */
async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error("액세스 토큰 갱신 실패");

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

/**
 * 유효한 액세스 토큰 반환 (만료 시 자동 갱신)
 * @param {{ googleAccessToken, googleRefreshToken, googleTokenExpiresAt }} tokenData
 * @returns {{ accessToken: string, refreshed: boolean, newExpiry?: number }}
 */
async function getValidAccessToken(tokenData) {
  const { googleAccessToken, googleRefreshToken, googleTokenExpiresAt } = tokenData;

  if (!googleRefreshToken) throw new Error("구글 캘린더 연동이 필요합니다");

  const isExpired = !googleTokenExpiresAt || Date.now() > (googleTokenExpiresAt - 60000);
  if (!isExpired && googleAccessToken) {
    return { accessToken: googleAccessToken, refreshed: false };
  }

  const refreshed = await refreshAccessToken(googleRefreshToken);
  return { accessToken: refreshed.accessToken, refreshed: true, newExpiry: refreshed.expiresAt };
}

/**
 * 구글 캘린더에 이벤트 생성 (사건 또는 포털 일정)
 * @param {string} accessToken
 * @param {{ summary, description, date, endDate, isAllDay }} eventData
 *   date/endDate: "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm" 형식
 * @returns {{ eventId, htmlLink }}
 */
async function createCaseEvent(accessToken, { summary, description, date, endDate, isAllDay }) {
  const startStr = date ? String(date) : new Date().toISOString().substring(0, 10);
  const endStr = endDate ? String(endDate) : startStr;

  // 시간 정보가 있으면 dateTime, 없거나 isAllDay이면 date
  const hasTime = !isAllDay && startStr.includes("T") && startStr.length > 10;

  let startField, endField;
  if (hasTime) {
    // "YYYY-MM-DDTHH:mm" 형식을 ISO로 변환 (초 추가)
    const toISO = (s) => s.length === 16 ? s + ":00" : s;
    startField = { dateTime: toISO(startStr), timeZone: TIMEZONE };
    endField = { dateTime: toISO(endStr.includes("T") ? endStr : startStr), timeZone: TIMEZONE };
  } else {
    startField = { date: startStr.substring(0, 10), timeZone: TIMEZONE };
    // 종일 이벤트: Google Calendar는 end를 exclusive로 처리하므로 +1일
    const endDate10 = endStr.substring(0, 10);
    const endPlusOne = new Date(endDate10 + "T00:00:00+09:00");
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    endField = { date: endPlusOne.toISOString().substring(0, 10), timeZone: TIMEZONE };
  }

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description,
      start: startField,
      end: endField,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "캘린더 이벤트 생성 실패");
  }

  const data = await res.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}


/**
 * 구글 캘린더 이벤트 수정
 */
async function updateCalendarEvent(accessToken, googleEventId, { summary, description, date, endDate, isAllDay }) {
  const startStr = date ? String(date) : new Date().toISOString().substring(0, 10);
  const endStr = endDate ? String(endDate) : startStr;
  const hasTime = !isAllDay && startStr.includes("T") && startStr.length > 10;
  let startField, endField;
  if (hasTime) {
    const toISO = (s) => s.length === 16 ? s + ":00" : s;
    startField = { dateTime: toISO(startStr), timeZone: TIMEZONE };
    endField = { dateTime: toISO(endStr.includes("T") ? endStr : startStr), timeZone: TIMEZONE };
  } else {
    startField = { date: startStr.substring(0, 10), timeZone: TIMEZONE };
    const d = new Date(endStr.substring(0, 10) + "T00:00:00+09:00");
    d.setDate(d.getDate() + 1);
    endField = { date: d.toISOString().substring(0, 10), timeZone: TIMEZONE };
  }
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ summary, description, start: startField, end: endField }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "캘린더 이벤트 수정 실패");
  }
  const data = await res.json();
  return { eventId: data.id, htmlLink: data.htmlLink };
}

/**
 * 구글 캘린더 이벤트 삭제
 */
async function deleteCalendarEvent(accessToken, googleEventId) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error("캘린더 이벤트 삭제 실패");
  }
  return { deleted: true };
}

module.exports = {
  isConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  getValidAccessToken,
  createCaseEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
