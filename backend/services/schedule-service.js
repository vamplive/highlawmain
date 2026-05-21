/**
 * 예약 메시지 서비스 — 예약 CRUD + 도달한 예약 일괄 발송 처리
 * - sms-service / email-service로 실제 발송
 * - 발송 후 message_logs에도 기록하여 일반 이력과 통합
 */
const { db } = require("../db");
const { scheduledMessages, messageLogs, messageTemplates } = require("../db/schema");
const { eq, desc, sql, and, lte } = require("drizzle-orm");
const { sendSMS } = require("../lib/sms-service");
const { sendEmail } = require("../lib/email-service");
const { ServiceError, validateUUID, normalizeMessageChannel, cleanPhone } = require("./helpers");
const clientService = require("./client-service");
const {
  resolveUnsubscribeToken, buildUnsubscribeUrl,
  replacePlaceholders, appendEmailFooter, injectTrackingPixel,
} = require("../lib/message-render");

/** 예약 상태 상수 */
const STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

/**
 * 예약 생성
 * @param {object} data - { channel, recipients[], templateId?, subject?, content, scheduledAt, source?, originRef? }
 * @returns {object}
 */
async function createSchedule(data) {
  const { recipients, templateId, subject, content, scheduledAt, source = "manual", originRef } = data;
  const channel = normalizeMessageChannel(data.channel);

  if (!channel || !["sms", "email"].includes(channel)) {
    throw new ServiceError("채널은 sms 또는 email이어야 합니다", 400);
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new ServiceError("수신자를 1명 이상 지정해주세요", 400);
  }
  if (!content?.trim()) {
    throw new ServiceError("메시지 내용을 입력해주세요", 400);
  }
  if (channel === "email" && !subject?.trim()) {
    throw new ServiceError("이메일 제목을 입력해주세요", 400);
  }
  if (!scheduledAt) {
    throw new ServiceError("예약 시각을 입력해주세요", 400);
  }
  // SQLite의 datetime 비교가 이루어지도록 "YYYY-MM-DD HH:MM:SS" 형식을 강제
  const normalizedAt = normalizeScheduledAt(scheduledAt);

  const [row] = await db.insert(scheduledMessages).values({
    channel,
    recipients: JSON.stringify(normalizeRecipients(recipients, channel)),
    templateId: templateId || null,
    subject: subject?.trim() || null,
    content: content.trim(),
    scheduledAt: normalizedAt,
    status: STATUS.PENDING,
    source,
    originRef: originRef || null,
  }).returning();

  return hydrate(row);
}

/**
 * 예약 목록 조회
 * @param {object} filters - { status?, channel?, limit?, page? }
 */
async function listSchedules(filters = {}) {
  const { status, channel } = filters;
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(filters.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(scheduledMessages.status, status));
  if (channel) conditions.push(eq(scheduledMessages.channel, channel));

  let query = db.select().from(scheduledMessages);
  let countQuery = db.select({ total: sql`count(*)` }).from(scheduledMessages);
  if (conditions.length > 0) {
    const where = and(...conditions);
    query = query.where(where);
    countQuery = countQuery.where(where);
  }

  const rows = await query.orderBy(desc(scheduledMessages.scheduledAt)).limit(limit).offset(offset);
  const [{ total }] = await countQuery;

  return {
    items: rows.map(hydrate),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * 예약 취소 (pending 상태만)
 */
async function cancelSchedule(id) {
  validateUUID(id);
  const [existing] = await db.select().from(scheduledMessages).where(eq(scheduledMessages.id, id));
  if (!existing) throw new ServiceError("예약을 찾을 수 없습니다", 404);
  if (existing.status !== STATUS.PENDING) {
    throw new ServiceError("대기 중인 예약만 취소할 수 있습니다", 400);
  }
  await db.update(scheduledMessages)
    .set({ status: STATUS.CANCELLED, updatedAt: sql`(datetime('now'))` })
    .where(eq(scheduledMessages.id, id));
  return { cancelled: true };
}

/**
 * 도달한(pending + scheduledAt <= now) 예약을 일괄 발송 처리한다.
 * - 스케줄러에서 주기적으로 호출
 * - 실패해도 다음 tick에 영향 없도록 개별 예약별 try/catch
 * @returns {{ processed: number, sent: number, failed: number }}
 */
async function processPendingMessages() {
  const due = await db.select().from(scheduledMessages)
    .where(and(
      eq(scheduledMessages.status, STATUS.PENDING),
      lte(scheduledMessages.scheduledAt, sql`datetime('now')`),
    ))
    .limit(50);

  if (due.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sentCount = 0;
  let failedCount = 0;

  for (const item of due) {
    // 동시 실행 방지용 낙관적 락 — processing으로 먼저 표시
    const claim = await db.update(scheduledMessages)
      .set({ status: STATUS.PROCESSING, updatedAt: sql`(datetime('now'))` })
      .where(and(
        eq(scheduledMessages.id, item.id),
        eq(scheduledMessages.status, STATUS.PENDING),
      ))
      .returning({ id: scheduledMessages.id });
    if (claim.length === 0) continue; // 다른 tick이 선점

    try {
      const parsedRecipients = parseRecipients(item.recipients);
      // 수동 예약(manual)과 재참여 트리거(reengagement)는 수신동의 필터 적용.
      // 상담 접수/확정/예약 리마인더는 트랜잭셔널이라 필터 제외.
      const isMarketing = item.source === "manual"
        || (item.originRef || "").startsWith("reengagement:");
      let recipients = parsedRecipients;
      let blocked = [];
      if (isMarketing) {
        const filtered = await clientService.filterByConsent(parsedRecipients, item.channel);
        recipients = filtered.allowed;
        blocked = filtered.blocked;
      }
      const results = [];
      for (const recipient of recipients) {
        const token = await resolveUnsubscribeToken(recipient.contact);
        const unsubscribeUrl = buildUnsubscribeUrl(token);

        const renderedContent = replacePlaceholders(item.content, {
          name: recipient.name, category: recipient.category, unsubscribeUrl,
        });
        const renderedSubject = item.subject ? replacePlaceholders(item.subject, {
          name: recipient.name, category: recipient.category, unsubscribeUrl,
        }) : null;

        // 이메일: 로그 먼저 생성 → 픽셀 삽입 → 발송
        let logId = null;
        let emailHtml = null;
        if (item.channel === "email") {
          const bodyWithFooter = appendEmailFooter(renderedContent, unsubscribeUrl);
          const [pendingLog] = await db.insert(messageLogs).values({
            channel: item.channel,
            recipientName: recipient.name || null,
            recipientContact: recipient.contact,
            consultationId: recipient.consultationId || null,
            templateId: item.templateId || null,
            subject: renderedSubject,
            content: bodyWithFooter,
            status: "pending",
          }).returning();
          logId = pendingLog.id;
          emailHtml = injectTrackingPixel(bodyWithFooter, logId);
        }

        const sendResult = item.channel === "sms"
          ? await sendSMS(recipient.contact, renderedContent)
          : await sendEmail(recipient.contact, renderedSubject, emailHtml);

        const now = sqlDateTimeNow();

        if (item.channel === "sms") {
          const [smsLog] = await db.insert(messageLogs).values({
            channel: item.channel,
            recipientName: recipient.name || null,
            recipientContact: recipient.contact,
            consultationId: recipient.consultationId || null,
            templateId: item.templateId || null,
            subject: null,
            content: renderedContent,
            status: sendResult.success ? "sent" : "failed",
            errorMessage: sendResult.error || null,
            sentAt: sendResult.success ? now : null,
          }).returning();
          logId = smsLog.id;
        } else {
          await db.update(messageLogs)
            .set({
              status: sendResult.success ? "sent" : "failed",
              errorMessage: sendResult.error || null,
              sentAt: sendResult.success ? now : null,
            })
            .where(eq(messageLogs.id, logId));
        }

        if (sendResult.success) {
          await clientService.touchLastContacted(recipient.contact);
        }

        results.push({
          recipientContact: recipient.contact,
          success: sendResult.success,
          error: sendResult.error || null,
        });
      }

      const sent = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      sentCount += sent;
      failedCount += failed;

      await db.update(scheduledMessages)
        .set({
          status: failed > 0 && sent === 0 ? STATUS.FAILED : STATUS.SENT,
          result: JSON.stringify({
            total: results.length, sent, failed, results,
            blockedByConsent: blocked.length,
          }),
          sentAt: sqlDateTimeNow(),
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(scheduledMessages.id, item.id));
    } catch (err) {
      failedCount += 1;
      await db.update(scheduledMessages)
        .set({
          status: STATUS.FAILED,
          errorMessage: err.message || String(err),
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(scheduledMessages.id, item.id));
    }
  }

  return { processed: due.length, sent: sentCount, failed: failedCount };
}

/** 예약 생성 시 템플릿 내용을 복사해 content/subject에 주입한다 */
async function resolveTemplate(templateId) {
  if (!templateId) return null;
  const [tpl] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, templateId));
  return tpl || null;
}

function hydrate(row) {
  if (!row) return row;
  return {
    ...row,
    recipients: parseRecipients(row.recipients),
    result: row.result ? safeJson(row.result) : null,
  };
}

function parseRecipients(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function normalizeRecipients(recipients, channel) {
  if (!Array.isArray(recipients)) return [];
  return recipients.map((recipient) => ({
    ...recipient,
    contact: channel === "email"
      ? String(recipient.contact || "").trim().toLowerCase()
      : cleanPhone(String(recipient.contact || "")),
  }));
}

function safeJson(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

/** YYYY-MM-DDTHH:mm 또는 ISO 문자열을 SQLite "YYYY-MM-DD HH:MM:SS"로 변환 */
function normalizeScheduledAt(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new ServiceError("예약 시각 형식이 올바르지 않습니다", 400);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function sqlDateTimeNow() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

module.exports = {
  STATUS,
  createSchedule,
  listSchedules,
  cancelSchedule,
  processPendingMessages,
  resolveTemplate,
};
