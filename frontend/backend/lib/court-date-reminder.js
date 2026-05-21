/**
 * 법정 일정 알림 cron — court_dates.reminder_at 도래 시 SMS/이메일 자동 발송.
 *
 * 매분 실행되며, 다음 조건의 일정을 찾는다:
 *   - reminder_at IS NOT NULL
 *   - reminded = 0
 *   - reminder_at <= 현재 시각
 *   - status = 'scheduled'
 *
 * 발송 대상:
 *   - 담당 변호사(lawyer) 의 phone/email
 *   - 의뢰인(client) 의 phone (의뢰인 알림은 옵션 — phone 있을 때만)
 *
 * 발송 후 reminded=1 로 마킹하여 중복 발송 방지.
 *
 * 메시지 본문:
 *   "[법무법인 하이로] {kind} 일정 안내
 *    {title}
 *    일시: 2026-05-10 14:30
 *    법원: 서울중앙지방법원 제427호
 *    사건번호: 2026가단123456"
 */
const { db, sqlite } = require("../db");
const { courtDates, lawyers, clients } = require("../db/schema");
const { eq, and, isNotNull, lte } = require("drizzle-orm");
const logger = require("./logger");

let smsService;
let emailService;
try { smsService = require("./sms-service"); } catch { smsService = null; }
try { emailService = require("./email-service"); } catch { emailService = null; }

const KIND_LABEL = {
  hearing: "변론기일",
  mediation: "조정기일",
  examination: "심문기일",
  sentencing: "선고기일",
  deadline: "제출기한",
};

function formatStartsAt(iso) {
  if (!iso) return "";
  /* "2026-05-10 14:30:00" → "2026-05-10 14:30" */
  return iso.slice(0, 16);
}

function buildMessage(courtDate) {
  const lines = [
    `[법무법인 하이로] ${KIND_LABEL[courtDate.kind] || courtDate.kind} 알림`,
    courtDate.title,
    `일시: ${formatStartsAt(courtDate.startsAt)}`,
  ];
  if (courtDate.courtName || courtDate.courtRoom) {
    lines.push(`법원: ${[courtDate.courtName, courtDate.courtRoom].filter(Boolean).join(" ")}`);
  }
  if (courtDate.caseNumber) {
    lines.push(`사건번호: ${courtDate.caseNumber}`);
  }
  if (courtDate.memo) {
    lines.push(`메모: ${courtDate.memo.slice(0, 60)}`);
  }
  return lines.join("\n");
}

function buildEmailHtml(courtDate) {
  const lines = [
    `<h3 style="margin:0 0 12px;color:#1a1f2c;">${KIND_LABEL[courtDate.kind] || courtDate.kind} 알림</h3>`,
    `<p style="margin:0 0 8px;font-weight:600;font-size:15px;">${escapeHtml(courtDate.title)}</p>`,
    `<table style="border-collapse:collapse;font-size:13px;color:#333;">`,
    `<tr><td style="padding:4px 12px 4px 0;color:#666;">일시</td><td style="padding:4px 0;">${formatStartsAt(courtDate.startsAt)}</td></tr>`,
  ];
  if (courtDate.courtName || courtDate.courtRoom) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;">법원</td><td style="padding:4px 0;">${escapeHtml([courtDate.courtName, courtDate.courtRoom].filter(Boolean).join(" "))}</td></tr>`);
  }
  if (courtDate.caseNumber) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;">사건번호</td><td style="padding:4px 0;">${escapeHtml(courtDate.caseNumber)}</td></tr>`);
  }
  if (courtDate.memo) {
    lines.push(`<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">메모</td><td style="padding:4px 0;">${escapeHtml(courtDate.memo)}</td></tr>`);
  }
  lines.push(`</table>`);
  return lines.join("");
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * 도래한 리마인더 1건씩 처리.
 * @returns {Promise<number>} 처리된 건수
 */
async function dispatchDueReminders() {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const due = await db
    .select()
    .from(courtDates)
    .where(and(
      isNotNull(courtDates.reminderAt),
      eq(courtDates.reminded, 0),
      eq(courtDates.status, "scheduled"),
      lte(courtDates.reminderAt, now),
    ))
    .limit(20);

  if (due.length === 0) return 0;

  let processed = 0;
  for (const cd of due) {
    try {
      const message = buildMessage(cd);
      const html = buildEmailHtml(cd);

      let lawyer = null, client = null;
      if (cd.lawyerId) {
        const [l] = await db.select().from(lawyers).where(eq(lawyers.id, cd.lawyerId)).limit(1);
        lawyer = l;
      }
      if (cd.clientId) {
        const [c] = await db.select().from(clients).where(eq(clients.id, cd.clientId)).limit(1);
        client = c;
      }

      const tasks = [];
      /* 변호사 SMS — phone 있을 때만 */
      if (lawyer?.phone && smsService?.sendSMS) {
        tasks.push(smsService.sendSMS(lawyer.phone, message).catch((err) => {
          logger.warn({ err, courtDateId: cd.id, target: "lawyer_sms" }, "court reminder SMS failed");
        }));
      }
      /* 변호사 이메일 — email 있을 때만 */
      if (lawyer?.email && emailService?.sendEmail) {
        tasks.push(emailService.sendEmail(lawyer.email, `[법정일정] ${cd.title}`, html).catch((err) => {
          logger.warn({ err, courtDateId: cd.id, target: "lawyer_email" }, "court reminder email failed");
        }));
      }
      /* 의뢰인 SMS — phone 있고 환경변수로 비활성 안 되어 있을 때 */
      if (client?.phone && smsService?.sendSMS && process.env.COURT_REMINDER_NOTIFY_CLIENT !== "false") {
        tasks.push(smsService.sendSMS(client.phone, message).catch((err) => {
          logger.warn({ err, courtDateId: cd.id, target: "client_sms" }, "court reminder SMS failed");
        }));
      }

      await Promise.all(tasks);

      /* 발송 완료 마킹 */
      sqlite
        .prepare("UPDATE court_dates SET reminded = 1, updated_at = datetime('now') WHERE id = ?")
        .run(cd.id);

      processed += 1;
      logger.info({
        courtDateId: cd.id,
        title: cd.title,
        startsAt: cd.startsAt,
        recipients: { lawyer: !!lawyer?.phone || !!lawyer?.email, client: !!client?.phone },
      }, "court reminder dispatched");
    } catch (err) {
      logger.error({ err, courtDateId: cd.id }, "court reminder dispatch failed");
    }
  }
  return processed;
}

/**
 * cron 시작 — 60초 간격으로 실행. 시작 직후에도 한 번 실행.
 */
function startCron() {
  /* 시작 직후 한 번 — 서버 재시작 시 누락된 리마인더 즉시 처리 */
  dispatchDueReminders().catch((err) => logger.warn({ err }, "court reminder initial dispatch failed"));

  const handle = setInterval(() => {
    dispatchDueReminders().catch((err) => logger.warn({ err }, "court reminder cron failed"));
  }, 60 * 1000);
  handle.unref();
  return handle;
}

module.exports = { startCron, dispatchDueReminders };
