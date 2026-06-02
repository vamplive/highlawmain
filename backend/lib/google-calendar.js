/**
 * Google Calendar + Meet 연동
 * - 예약 확정 시 캘린더 이벤트 생성 + Google Meet 링크 자동 발급
 * - 환경변수 미설정 시 graceful fallback (null 반환 → 관리자가 수동 입력)
 *
 * 필요 환경변수:
 *  - GOOGLE_SERVICE_ACCOUNT_KEY : 서비스 계정 JSON (문자열 또는 파일 경로)
 *  - GOOGLE_CALENDAR_OWNER : 이벤트 생성 대상 캘린더 소유자 이메일 (도메인 위임 필요)
 *  - GOOGLE_CALENDAR_ID (선택) : 기본값 "primary"
 *
 * Google Workspace(HIGHLAW.com)에서 서비스 계정에 도메인 위임 설정이 되어 있어야
 * Meet 링크(conferenceData)가 자동 생성됩니다. 개인 Gmail은 OAuth 필요.
 */

const fs = require("fs");
const path = require("path");

const OWNER = process.env.GOOGLE_CALENDAR_OWNER || "";
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TIMEZONE = "Asia/Seoul";

let cachedClient = null;

/** 서비스 계정 credentials 로드 — JSON 문자열 또는 파일 경로 지원 */
function loadCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    if (raw.trim().startsWith("{")) return JSON.parse(raw);
    const resolved = path.isAbsolute(raw) ? raw : path.join(__dirname, "..", raw);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, "utf-8"));
    }
  } catch (err) {
    console.warn("[google-calendar] credentials 파싱 실패:", err.message);
  }
  return null;
}

/** 인증된 Calendar API 클라이언트 반환 (lazy init) */
async function getCalendarClient() {
  if (cachedClient) return cachedClient;

  const creds = loadCredentials();
  if (!creds || !OWNER) return null;

  try {
    const { google } = require("googleapis");
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar.events"],
      subject: OWNER, // 도메인 위임 대상 (HIGHLAW.com 계정)
    });
    await auth.authorize();
    cachedClient = google.calendar({ version: "v3", auth });
    return cachedClient;
  } catch (err) {
    console.warn("[google-calendar] 인증 실패:", err.message);
    return null;
  }
}

/** 설정 여부 — 라우트에서 미리 확인용 */
function isConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY && OWNER);
}

/**
 * 상담 예약용 캘린더 이벤트 생성 + Meet 링크 발급.
 * @param {object} opts
 * @param {string} opts.summary - 이벤트 제목
 * @param {string} opts.description - 본문
 * @param {string} opts.startDateTime - ISO 8601 또는 "YYYY-MM-DD HH:mm"
 * @param {string} opts.endDateTime
 * @param {string} [opts.attendeeEmail] - 의뢰인 이메일 (선택)
 * @returns {Promise<{ eventId: string, meetLink: string|null, htmlLink: string }|null>}
 */
async function createConsultationEvent({ summary, description, startDateTime, endDateTime, attendeeEmail }) {
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    const requestId = `highlaw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1,
      sendUpdates: attendeeEmail ? "all" : "none",
      requestBody: {
        summary,
        description,
        start: { dateTime: toIso(startDateTime), timeZone: TIMEZONE },
        end: { dateTime: toIso(endDateTime), timeZone: TIMEZONE },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink = res.data.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri || null;
    return {
      eventId: res.data.id,
      meetLink,
      htmlLink: res.data.htmlLink,
    };
  } catch (err) {
    console.warn("[google-calendar] 이벤트 생성 실패:", err.message);
    return null;
  }
}

/** "YYYY-MM-DD HH:mm" 또는 ISO 문자열 → ISO 8601 */
function toIso(input) {
  if (!input) return null;
  if (input.includes("T")) return input;
  // "YYYY-MM-DD HH:mm" → "YYYY-MM-DDTHH:mm:00"
  return input.replace(" ", "T") + (input.length === 16 ? ":00" : "");
}

module.exports = {
  isConfigured,
  createConsultationEvent,
};
