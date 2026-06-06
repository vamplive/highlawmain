/**
 * 포털 캘린더 일정 알림 cron — portal_events.reminder_minutes 도래 시 이메일로 발송.
 *
 * 매분 실행되며, 다음 조건의 일정을 찾는다:
 *   - reminder_minutes IS NOT NULL (사용자가 알림 시점을 설정함)
 *   - reminded = 0 (아직 발송 전)
 *   - starts_at - reminder_minutes <= 현재 시각 (알림 시점 도래)
 *   - starts_at >= 현재 시각 (이미 지난 일정은 발송하지 않음)
 *
 * 발송 대상: 일정 작성자(소유자)의 이메일.
 * 발송 후 reminded=1 로 마킹하여 중복 발송 방지.
 */
const { db, sqlite } = require("../db");
const { portalEvents, portalUsers } = require("../db/schema");
const { eq } = require("drizzle-orm");
const logger = require("./logger");

let emailService;
try { emailService = require("./email-service"); } catch { emailService = null; }

function formatStartsAt(value) {
  if (!value) return "";
  return value.length > 16 ? value.slice(0, 16).replace("T", " ") : value.replace("T", " ");
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildEmailHtml(event) {
  const lines = [
    `<h3 style="margin:0 0 12px;color:#0b1f3a;">일정 알림</h3>`,
    `<p style="margin:0 0 8px;font-weight:600;font-size:15px;">${escapeHtml(event.title)}</p>`,
    `<table style="border-collapse:collapse;font-size:13px;color:#333;">`,
    `<tr><td style="padding:4px 12px 4px 0;color:#666;">일시</td><td style="padding:4px 0;">${escapeHtml(formatStartsAt(event.startsAt))}${event.isAllDay ? " (하루 종일)" : ""}</td></tr>`,
  ];
  if (event.location) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;">장소</td><td style="padding:4px 0;">${escapeHtml(event.location)}</td></tr>`);
  }
  if (event.videoConferenceUrl) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;">화상 회의</td><td style="padding:4px 0;"><a href="${escapeHtml(event.videoConferenceUrl)}">${escapeHtml(event.videoConferenceUrl)}</a></td></tr>`);
  }
  if (event.description) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">메모</td><td style="padding:4px 0;">${escapeHtml(event.description)}</td></tr>`);
  }
  lines.push(`</table>`);
  return lines.join("");
}

/**
 * 도래한 일정 알림을 찾아 1건씩 처리.
 * @returns {Promise<number>} 처리된 건수
 */
async function dispatchDueReminders() {
  // SQLite datetime 비교: starts_at 에서 reminder_minutes 분을 뺀 시각이 현재 이전이면 알림 발송 시점 도래
  const due = sqlite.prepare(`
    SELECT * FROM portal_events
    WHERE reminder_minutes IS NOT NULL
      AND reminded = 0
      AND datetime(starts_at) >= datetime('now', 'localtime')
      AND datetime(starts_at, '-' || reminder_minutes || ' minutes') <= datetime('now', 'localtime')
    LIMIT 20
  `).all();

  if (due.length === 0) return 0;

  let processed = 0;
  for (const row of due) {
    try {
      const [owner] = await db
        .select({ email: portalUsers.email })
        .from(portalUsers)
        .where(eq(portalUsers.id, row.portal_user_id));

      const event = {
        title: row.title,
        startsAt: row.starts_at,
        isAllDay: row.is_all_day,
        location: row.location,
        videoConferenceUrl: row.video_conference_url,
        description: row.description,
      };

      if (owner?.email && emailService?.sendEmail) {
        await emailService.sendEmail(owner.email, `[일정 알림] ${event.title}`, buildEmailHtml(event)).catch((err) => {
          logger.warn({ err, eventId: row.id, target: "owner_email" }, "portal event reminder email failed");
        });
      }

      sqlite
        .prepare("UPDATE portal_events SET reminded = 1, updated_at = datetime('now') WHERE id = ?")
        .run(row.id);

      processed += 1;
      logger.info({ eventId: row.id, title: event.title, startsAt: event.startsAt }, "portal event reminder dispatched");
    } catch (err) {
      logger.error({ err, eventId: row.id }, "portal event reminder dispatch failed");
    }
  }
  return processed;
}

/**
 * cron 시작 — 60초 간격으로 실행. 시작 직후에도 한 번 실행.
 */
function startCron() {
  dispatchDueReminders().catch((err) => logger.warn({ err }, "portal event reminder initial dispatch failed"));

  const handle = setInterval(() => {
    dispatchDueReminders().catch((err) => logger.warn({ err }, "portal event reminder cron failed"));
  }, 60 * 1000);
  handle.unref();
  return handle;
}

module.exports = { startCron, dispatchDueReminders };
