/**
 * 자동 트리거 서비스 — 조건 기반 자동 메시지 발송 규칙 관리 + 예약 생성 훅
 * - consultation_received, consultation_confirmed, booking_reminder, reengagement
 * - 상담/예약 라우트에서 fireTrigger(...)를 호출해 scheduled_messages에 레코드 생성
 */
const { db } = require("../db");
const { autoTriggers, clients, scheduledMessages } = require("../db/schema");
const { eq, and, desc, sql, lte, inArray, or } = require("drizzle-orm");
const { ServiceError, validateUUID, normalizeMessageChannel } = require("./helpers");
const scheduleService = require("./schedule-service");

const TRIGGER_TYPES = [
  "consultation_received", "consultation_confirmed",
  "booking_reminder", "reengagement",
];

const CHANNELS = ["sms", "email"];

/** 트리거 목록 조회 */
async function listTriggers(filters = {}) {
  let query = db.select().from(autoTriggers);
  const conditions = [];
  if (filters.triggerType) conditions.push(eq(autoTriggers.triggerType, filters.triggerType));
  if (filters.enabled !== undefined) {
    conditions.push(eq(autoTriggers.isEnabled, filters.enabled === "true" ? 1 : 0));
  }
  if (conditions.length > 0) query = query.where(and(...conditions));
  const rows = await query.orderBy(desc(autoTriggers.createdAt));
  return rows;
}

/** 트리거 생성 */
async function createTrigger(data) {
  const { triggerType, name, templateId, subject, content, delayMinutes = 0, thresholdDays = 90, isEnabled = true } = data;
  const channel = normalizeMessageChannel(data.channel || "sms");
  if (!TRIGGER_TYPES.includes(triggerType)) {
    throw new ServiceError(`triggerType은 다음 중 하나여야 합니다: ${TRIGGER_TYPES.join(", ")}`, 400);
  }
  if (!CHANNELS.includes(channel)) {
    throw new ServiceError("채널은 sms 또는 email이어야 합니다", 400);
  }
  if (!name?.trim()) throw new ServiceError("이름을 입력해주세요", 400);
  if (!content?.trim()) throw new ServiceError("메시지 내용을 입력해주세요", 400);
  if (channel === "email" && !subject?.trim()) {
    throw new ServiceError("이메일 제목을 입력해주세요", 400);
  }

  const [row] = await db.insert(autoTriggers).values({
    triggerType, name: name.trim(), channel,
    templateId: templateId || null,
    subject: subject?.trim() || null,
    content: content.trim(),
    delayMinutes: Number(delayMinutes) || 0,
    thresholdDays: Math.max(1, Number(thresholdDays) || 90),
    isEnabled: isEnabled ? 1 : 0,
  }).returning();
  return row;
}

/** 트리거 수정 */
async function updateTrigger(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(autoTriggers).where(eq(autoTriggers.id, id));
  if (!existing) throw new ServiceError("트리거를 찾을 수 없습니다", 404);

  const update = { updatedAt: sql`(datetime('now'))` };
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.channel !== undefined) {
    const channel = normalizeMessageChannel(data.channel);
    if (!CHANNELS.includes(channel)) {
      throw new ServiceError("채널은 sms 또는 email이어야 합니다", 400);
    }
    update.channel = channel;
  }
  if (data.templateId !== undefined) update.templateId = data.templateId || null;
  if (data.subject !== undefined) update.subject = data.subject?.trim() || null;
  if (data.content !== undefined) update.content = data.content.trim();
  if (data.delayMinutes !== undefined) update.delayMinutes = Number(data.delayMinutes) || 0;
  if (data.thresholdDays !== undefined) update.thresholdDays = Math.max(1, Number(data.thresholdDays) || 90);
  if (data.isEnabled !== undefined) update.isEnabled = data.isEnabled ? 1 : 0;

  const [updated] = await db.update(autoTriggers).set(update)
    .where(eq(autoTriggers.id, id)).returning();
  return updated;
}

/** 트리거 삭제 */
async function deleteTrigger(id) {
  validateUUID(id);
  await db.delete(autoTriggers).where(eq(autoTriggers.id, id));
  return { deleted: true };
}

/**
 * 트리거 실행 — 지정 타입의 활성 트리거를 모두 찾아 scheduled_messages 생성.
 * 실패해도 호출자 흐름(상담 접수 등)에 영향을 주지 않도록 에러를 삼킨다.
 *
 * @param {string} triggerType - TRIGGER_TYPES 중 하나
 * @param {object} ctx - { recipient: { name, phone?, email?, category?, consultationId? }, baseTime?: Date, originRef? }
 */
async function fireTrigger(triggerType, ctx) {
  try {
    if (!TRIGGER_TYPES.includes(triggerType)) return;
    const { recipient } = ctx || {};
    if (!recipient) return;

    const rows = await db.select().from(autoTriggers).where(and(
      eq(autoTriggers.triggerType, triggerType),
      eq(autoTriggers.isEnabled, 1),
    ));
    if (rows.length === 0) return;

    const baseTime = ctx.baseTime ? new Date(ctx.baseTime) : new Date();

    for (const trig of rows) {
      const contact = trig.channel === "sms" ? recipient.phone : recipient.email;
      if (!contact) continue; // 해당 채널 연락처 없음 — 스킵

      const scheduledAt = new Date(baseTime.getTime() + trig.delayMinutes * 60 * 1000);

      await scheduleService.createSchedule({
        channel: trig.channel,
        recipients: [{
          name: recipient.name,
          contact,
          consultationId: recipient.consultationId || null,
          category: recipient.category || null,
        }],
        templateId: trig.templateId || null,
        subject: trig.subject,
        content: trig.content,
        scheduledAt: scheduledAt.toISOString(),
        source: "trigger",
        originRef: ctx.originRef || `${triggerType}:${recipient.consultationId || recipient.phone || recipient.email}`,
      });
    }
  } catch (err) {
    console.error(`[Trigger ${triggerType}] 실행 실패:`, err.message);
  }
}

/**
 * 재참여 트리거 처리 — lastContactedAt이 thresholdDays 이상 경과한 고객에게 메시지 예약.
 * - 이미 동일 트리거로 예약/발송된 고객은 제외 (originRef로 중복 방지)
 * - 스케줄러에서 하루 1회 호출하면 충분
 * @returns {{ processed: number, enqueued: number }}
 */
async function processReengagement() {
  const triggers = await db.select().from(autoTriggers).where(and(
    eq(autoTriggers.triggerType, "reengagement"),
    eq(autoTriggers.isEnabled, 1),
  ));
  if (triggers.length === 0) return { processed: 0, enqueued: 0 };

  let enqueued = 0;
  for (const trig of triggers) {
    const threshold = Math.max(1, trig.thresholdDays || 90);
    // 마지막 연락이 threshold일 이상 전이거나, 한 번도 연락한 적 없는 활성 고객
    const candidates = await db.select().from(clients).where(and(
      eq(clients.isActive, 1),
      trig.channel === "sms"
        ? sql`${clients.phone} IS NOT NULL AND ${clients.phone} != ''`
        : sql`${clients.email} IS NOT NULL AND ${clients.email} != ''`,
      // 수신동의 체크 (마케팅성 재참여 메시지는 수신동의 필수)
      trig.channel === "sms" ? eq(clients.smsConsent, 1) : eq(clients.emailConsent, 1),
      or(
        sql`${clients.lastContactedAt} IS NULL AND date(${clients.createdAt}) <= date('now', '-' || ${threshold} || ' days')`,
        lte(clients.lastContactedAt, sql`datetime('now', '-' || ${threshold} || ' days')`),
      ),
    )).limit(200);

    if (candidates.length === 0) continue;

    // 이미 이 트리거로 enqueue된 고객 필터링 (originRef 접두사 매칭)
    const originPrefix = `reengagement:${trig.id}:`;
    const existingRefs = await db.select({ originRef: scheduledMessages.originRef })
      .from(scheduledMessages)
      .where(inArray(
        scheduledMessages.originRef,
        candidates.map((c) => `${originPrefix}${c.id}`),
      ));
    const existingSet = new Set(existingRefs.map((r) => r.originRef));

    for (const client of candidates) {
      const originRef = `${originPrefix}${client.id}`;
      if (existingSet.has(originRef)) continue;

      const contact = trig.channel === "sms" ? client.phone : client.email;
      if (!contact) continue;

      const scheduledAt = new Date(Date.now() + (trig.delayMinutes || 0) * 60 * 1000);

      try {
        await scheduleService.createSchedule({
          channel: trig.channel,
          recipients: [{
            name: client.name,
            contact,
            consultationId: client.consultationId || null,
            category: client.category || null,
          }],
          templateId: trig.templateId || null,
          subject: trig.subject,
          content: trig.content,
          scheduledAt: scheduledAt.toISOString(),
          source: "trigger",
          originRef,
        });
        enqueued += 1;
      } catch (err) {
        console.error(`[reengagement] ${client.id}:`, err.message);
      }
    }
  }

  return { processed: triggers.length, enqueued };
}

module.exports = {
  TRIGGER_TYPES,
  listTriggers,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  fireTrigger,
  processReengagement,
};
