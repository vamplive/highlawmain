/**
 * 상담 서비스 — 상담 신청 CRUD 비즈니스 로직
 * - 상담 생성 시 고객 자동 등록 + Apps Script 웹훅 알림
 */
const { db } = require("../db");
const { sqlite } = require("../db");
const logger = require("../lib/logger");
const { consultations, clients, bookingSlots, messageLogs } = require("../db/schema");
const { eq, desc, sql, inArray } = require("drizzle-orm");
const crypto = require("crypto");
const { sendSMS } = require("../lib/sms-service");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  KOREAN_PHONE_REGEX,
  cleanPhone,
} = require("./helpers");
const googleCalendar = require("../lib/google-calendar");

const MEETING_TYPES = ["in_person", "phone", "video"];
const SCHEDULE_MODES = ["slot", "request"];
const MEETING_TYPE_LABELS = {
  in_person: "대면 상담", phone: "전화 상담", video: "화상 상담",
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?:\s*(?:~|-|–|—)\s*([01]\d|2[0-3]):[0-5]\d)?$/;

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  civil: "민사", criminal: "형사", family: "가사", admin: "행정",
  tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};
const VALID_CATEGORIES = new Set(["general", ...Object.keys(CATEGORY_LABELS)]);

/** Google Apps Script 웹훅 URL (환경변수로 관리) */
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBHOOK_URL || "";

/** 상담 접수 시 SMS 알림을 받을 관리자 번호 (환경변수) */
const ADMIN_SMS_RECEIVER = process.env.ALIGO_ADMIN_RECEIVER || "";

function normalizePreferredDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : date;
}

function normalizePreferredTime(value) {
  return String(value || "")
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s*~\s*/g, "~")
    .replace(/\s*-\s*/g, "-");
}

function normalizePreferredSlots(preferredSlots) {
  if (!Array.isArray(preferredSlots)) return [];
  return preferredSlots
    .map((slot) => ({
      date: normalizePreferredDate(slot?.date),
      time: normalizePreferredTime(slot?.time),
    }))
    .filter((slot) => slot.date);
}

function formatSlotRange(slot) {
  if (!slot?.date || !slot?.startTime) return "";
  return `${slot.date} ${slot.startTime}${slot.endTime ? `~${slot.endTime}` : ""}`;
}

function buildRequestedScheduleSummary(data) {
  if (data.bookingSlot) {
    return formatSlotRange(data.bookingSlot);
  }
  const preferred = [1, 2, 3]
    .map((n) => ({
      date: data[`preferredDate${n}`],
      time: data[`preferredTime${n}`],
    }))
    .filter((slot) => slot.date)
    .map((slot, idx) => `${idx + 1}순위 ${slot.date}${slot.time ? ` ${slot.time}` : ""}`);
  return preferred.join(", ");
}

async function logSmsResult({ recipientName, recipientContact, consultationId, content, result }) {
  try {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    await db.insert(messageLogs).values({
      channel: "sms",
      recipientName,
      recipientContact: cleanPhone(recipientContact),
      consultationId,
      subject: null,
      content,
      status: result.success ? "sent" : "failed",
      errorMessage: result.error || null,
      sentAt: result.success ? now : null,
    });
  } catch (logErr) {
    logger.error({ err: logErr }, "[상담 SMS 로그 저장 실패]");
  }
}

/**
 * 상담 접수 시 신청자에게 접수 확인 SMS를 발송한다.
 * 실패해도 상담 생성 흐름에는 영향을 주지 않으며, messageLogs에 결과를 기록한다.
 * @param {object} data - 상담 데이터
 * @param {string} consultationId - 생성된 상담 ID
 */
async function notifyApplicantReceivedBySMS(data, consultationId) {
  if (!data.phone) return;

  const scheduleSummary = buildRequestedScheduleSummary(data);
  const text = [
    `[법무법인 하이로] ${data.name}님 상담 신청이 접수되었습니다.`,
    "담당자가 확인 후 연락드리겠습니다.",
    scheduleSummary ? `희망 일정: ${scheduleSummary}` : "",
    "문의 02-594-5583",
  ].filter(Boolean).join("\n");

  const result = await sendSMS(data.phone, text, { title: "상담 접수 안내" });
  await logSmsResult({
    recipientName: data.name,
    recipientContact: data.phone,
    consultationId,
    content: text,
    result,
  });
}

/**
 * 상담 접수 시 관리자 휴대폰으로 SMS 알림을 발송한다.
 * 실패해도 상담 생성 흐름에는 영향을 주지 않으며, messageLogs에 결과를 기록한다.
 * @param {object} data - 상담 데이터 ({ name, phone, category, message })
 * @param {string} consultationId - 생성된 상담 ID
 */
async function notifyAdminBySMS(data, consultationId) {
  if (!ADMIN_SMS_RECEIVER) {
    // 관리자 번호 미설정 시 조용히 패스 (운영자가 의도적으로 비활성화한 경우)
    return;
  }

  const categoryLabel = CATEGORY_LABELS[data.category] || data.category || "일반";
  // 90바이트 SMS 범위 안에 들어오도록 간결하게 구성
  const text = `[법무법인 하이로] 새 상담 접수\n이름: ${data.name}\n분야: ${categoryLabel}\n연락처: ${data.phone || "-"}`;

  const result = await sendSMS(ADMIN_SMS_RECEIVER, text);
  await logSmsResult({
    recipientName: "관리자",
    recipientContact: ADMIN_SMS_RECEIVER,
    consultationId,
    content: text,
    result,
  });
}

/**
 * Apps Script 웹훅으로 상담 데이터를 전송한다 (이메일 + 스프레드시트).
 * 전송 실패 시 로그만 남기고 에러를 던지지 않는다.
 * @param {object} data - 상담 데이터
 */
async function notifyAppsScript(data) {
  if (!APPS_SCRIPT_URL) {
    logger.warn("[상담 알림] APPS_SCRIPT_WEBHOOK_URL 환경변수가 설정되지 않았습니다");
    return;
  }
  try {
    const payload = JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      category: CATEGORY_LABELS[data.category] || data.category,
      preferredDate: data.preferredDate1 || data.bookingSlot?.date || "",
      preferredTime: data.preferredTime1 || formatSlotRange(data.bookingSlot) || "",
      message: data.message,
      agreed: data.agreed ? "동의" : "미동의",
    });
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
      redirect: "follow",
    });
    // 응답 상태만 기록 (본문에 민감 데이터 포함 가능하므로 로깅하지 않음)
    await res.text();
    if (!res.ok) logger.warn({ status: res.status }, "[상담 알림] Apps Script 응답 오류");
  } catch (err) {
    logger.error({ err }, "[상담 알림] Apps Script 전송 실패:");
  }
}

/**
 * 상담 신청 시 고객 DB에 자동 등록 또는 기존 고객 정보를 업데이트한다.
 * 실패해도 상담 생성에는 영향을 주지 않도록 내부에서 에러를 처리한다.
 * @param {object} dbData - { name, phone, email, category }
 * @param {string} consultationId - 생성된 상담 ID
 */
async function autoRegisterClient(dbData, consultationId) {
  const phoneDigits = cleanPhone(dbData.phone);
  try {
    let existingClient = null;

    if (phoneDigits) {
      [existingClient] = await db.select().from(clients)
        .where(eq(clients.phone, phoneDigits));
    }
    if (!existingClient && dbData.email) {
      [existingClient] = await db.select().from(clients)
        .where(eq(clients.email, dbData.email));
    }

    if (existingClient) {
      await db.update(clients).set({
        phone: phoneDigits || existingClient.phone,
        email: dbData.email || existingClient.email,
        category: dbData.category !== "general" ? dbData.category : existingClient.category,
        consultationId,
        updatedAt: sql`(datetime('now'))`,
      }).where(eq(clients.id, existingClient.id));
    } else {
      await db.insert(clients).values({
        name: dbData.name,
        phone: phoneDigits,
        email: dbData.email || null,
        category: dbData.category !== "general" ? dbData.category : null,
        source: "consultation",
        consultationId,
      });
    }
  } catch (clientErr) {
    logger.error({ err: clientErr }, "[고객 자동등록 오류]");
  }
}

function mapConsultationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    category: row.category,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    consentId: row.consent_id,
    invitationId: row.invitation_id,
    meetingType: row.meeting_type,
    meetingLink: row.meeting_link,
    scheduleMode: row.schedule_mode,
    bookingSlotId: row.booking_slot_id,
    preferredDate1: row.preferred_date_1,
    preferredTime1: row.preferred_time_1,
    preferredDate2: row.preferred_date_2,
    preferredTime2: row.preferred_time_2,
    preferredDate3: row.preferred_date_3,
    preferredTime3: row.preferred_time_3,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const createSlotConsultationTx = sqlite.transaction((dbData) => {
  const id = crypto.randomUUID();
  const slot = sqlite.prepare("SELECT id, is_available FROM booking_slots WHERE id = ?").get(dbData.bookingSlotId);
  if (!slot) throw new ServiceError("선택한 예약 시간을 찾을 수 없습니다", 404);
  if (!slot.is_available) throw new ServiceError("이미 예약된 시간입니다", 409);

  const updatedSlot = sqlite.prepare(`
    UPDATE booking_slots
    SET is_available = 0, consultation_id = ?
    WHERE id = ? AND is_available = 1
    RETURNING id
  `).get(id, dbData.bookingSlotId);
  if (!updatedSlot) throw new ServiceError("이미 예약된 시간입니다", 409);

  return sqlite.prepare(`
    INSERT INTO consultations (
      id, name, phone, email, category, message,
      consent_id, invitation_id, meeting_type, schedule_mode, booking_slot_id
    ) VALUES (
      @id, @name, @phone, @email, @category, @message,
      @consentId, @invitationId, @meetingType, @scheduleMode, @bookingSlotId
    )
    RETURNING *
  `).get({ id, ...dbData });
});

function createSlotConsultationAtomically(dbData) {
  return mapConsultationRow(createSlotConsultationTx(dbData));
}

/**
 * 상담 신청 생성 (공개 API)
 * - name, phone 또는 email, message(10자 이상) 필수
 * - 고객 자동 등록 + 웹훅 알림
 * @param {object} data - 요청 body 전체
 * @returns {object} 생성된 상담 레코드
 */
async function createConsultation(data) {
  const {
    name, phone, email, category, message, agreed,
    meetingType = "in_person",
    scheduleMode = "slot",
    bookingSlotId,
    preferredSlots,
    consentId,
    invitationId,
  } = data;

  // 필수값 검증
  if (!name || !name.trim()) {
    throw new ServiceError("이름을 입력해주세요", 400);
  }

  const hasPhone = phone && phone.trim();
  const hasEmail = email && email.trim();
  if (!hasPhone && !hasEmail) {
    throw new ServiceError("연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요", 400);
  }
  if (hasPhone && !KOREAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
    throw new ServiceError("올바른 연락처를 입력해주세요 (예: 010-1234-5678)", 400);
  }
  if (hasEmail && (!EMAIL_REGEX.test(email.trim()) || email.trim().length > 254)) {
    throw new ServiceError("올바른 이메일 주소를 입력해주세요", 400);
  }
  if (!message || message.trim().length < 10) {
    throw new ServiceError("상담 내용은 10자 이상 입력해주세요", 400);
  }
  if (message.length > 5000) {
    throw new ServiceError("상담 내용은 5,000자 이내로 입력해주세요", 400);
  }
  if (name.length > 100) {
    throw new ServiceError("이름은 100자 이내로 입력해주세요", 400);
  }
  if (category && !VALID_CATEGORIES.has(category)) {
    throw new ServiceError("상담 분야가 올바르지 않습니다", 400);
  }
  if (!MEETING_TYPES.includes(meetingType)) {
    throw new ServiceError("상담 방식은 대면/전화/화상 중 하나여야 합니다", 400);
  }
  if (!SCHEDULE_MODES.includes(scheduleMode)) {
    throw new ServiceError("예약 방식이 올바르지 않습니다", 400);
  }
  if (scheduleMode === "slot" && !bookingSlotId) {
    throw new ServiceError("예약 시간을 선택해주세요", 400);
  }

  let normalizedPreferredSlots = [];
  if (scheduleMode === "request") {
    normalizedPreferredSlots = normalizePreferredSlots(preferredSlots);
    if (normalizedPreferredSlots.length === 0) {
      throw new ServiceError("희망 일정을 최소 1개 이상 입력해주세요", 400);
    }
    for (const slot of normalizedPreferredSlots.slice(0, 3)) {
      if (!DATE_REGEX.test(slot.date) || (slot.time && !TIME_REGEX.test(slot.time))) {
        throw new ServiceError("희망 일정 형식이 올바르지 않습니다", 400);
      }
    }
  }

  const dbData = {
    name: name.trim(),
    phone: hasPhone ? phone.trim() : "",
    email: hasEmail ? email.trim() : null,
    category: category || "general",
    message: message.trim(),
    meetingType,
    scheduleMode,
    consentId: consentId || null,
    invitationId: invitationId || null,
  };

  let selectedSlot = null;

  // slot 모드: 슬롯 점유 상태 확인 후 예약
  if (scheduleMode === "slot") {
    validateUUID(bookingSlotId);
    const [slot] = await db.select().from(bookingSlots).where(eq(bookingSlots.id, bookingSlotId));
    if (!slot) throw new ServiceError("선택한 예약 시간을 찾을 수 없습니다", 404);
    if (!slot.isAvailable) throw new ServiceError("이미 예약된 시간입니다", 409);
    selectedSlot = slot;
    dbData.bookingSlotId = bookingSlotId;
  }

  // request 모드: 후보 일정 3개까지 구조화 저장
  if (scheduleMode === "request") {
    for (let i = 0; i < Math.min(3, normalizedPreferredSlots.length); i++) {
      const slot = normalizedPreferredSlots[i];
      dbData[`preferredDate${i + 1}`] = slot.date;
      dbData[`preferredTime${i + 1}`] = slot.time || null;
    }
  }

  let inserted;
  if (scheduleMode === "slot") {
    inserted = createSlotConsultationAtomically(dbData);
  } else {
    [inserted] = await db.insert(consultations).values(dbData).returning();
  }

  // 개인정보 동의 레코드에 consultationId 역연결 (감사 추적)
  if (consentId) {
    try {
      const { sqlite } = require("../db");
      sqlite.prepare("UPDATE privacy_consents SET consultation_id = ? WHERE id = ?")
        .run(inserted.id, consentId);
    } catch (e) {
      logger.warn({ err: e }, "[consent 링크 실패]");
    }
  }

  // 초대 완료 상태 업데이트 (Phase 4.5 초대 시스템)
  if (invitationId) {
    try {
      const { sqlite } = require("../db");
      sqlite.prepare(
        "UPDATE invitations SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
      ).run(invitationId);
    } catch (e) {
      logger.warn({ err: e }, "[invitation 완료 처리 실패]");
    }
  }

  // 고객 자동 등록 (실패해도 상담 생성은 성공)
  await autoRegisterClient(dbData, inserted.id);

  const notificationData = {
    ...dbData,
    bookingSlot: selectedSlot ? {
      id: selectedSlot.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    } : null,
  };

  // 웹훅 알림
  try {
    await notifyAppsScript({
      ...notificationData,
      meetingType: MEETING_TYPE_LABELS[meetingType] || meetingType,
      agreed: !!agreed,
    });
  } catch (_) {}

  // 신청자 접수 확인 SMS (실패해도 무시)
  try { await notifyApplicantReceivedBySMS(notificationData, inserted.id); } catch (_) {}

  // 관리자 SMS 알림 (실패해도 무시)
  try { await notifyAdminBySMS(dbData, inserted.id); } catch (_) {}

  return inserted;
}

/**
 * 관리자 상담 확정 — 화상이면 Google Meet 자동 생성, 메시지 템플릿에 {meeting_link} 주입용 데이터 반환
 * @param {string} id - 상담 UUID
 * @param {object} opts - { meetingLink?: 수동 링크, adminNote? }
 */
async function confirmConsultation(id, opts = {}) {
  validateUUID(id);
  const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
  if (!existing) throw new ServiceError("상담을 찾을 수 없습니다", 404);
  if (existing.status === "confirmed") {
    return existing; // 이미 확정됨
  }

  let meetingLink = opts.meetingLink || existing.meetingLink || null;

  // 화상 상담 & 슬롯 확정 & Meet 링크 없음 → Google Calendar API로 자동 생성 시도
  if (existing.meetingType === "video" && !meetingLink && existing.bookingSlotId && googleCalendar.isConfigured()) {
    try {
      const [slot] = await db.select().from(bookingSlots).where(eq(bookingSlots.id, existing.bookingSlotId));
      if (slot) {
        const startDateTime = `${slot.date} ${slot.startTime}`;
        const endDateTime = `${slot.date} ${slot.endTime}`;
        const ev = await googleCalendar.createConsultationEvent({
          summary: `[법무법인 하이로] ${existing.name}님 화상 상담`,
          description: `분야: ${existing.category}\n연락처: ${existing.phone}\n\n${existing.message || ""}`,
          startDateTime, endDateTime,
          attendeeEmail: existing.email || undefined,
        });
        if (ev?.meetLink) meetingLink = ev.meetLink;
      }
    } catch (err) {
      logger.error({ err }, "[Meet 자동생성 실패]");
    }
  }

  const update = {
    status: "confirmed",
    meetingLink,
    updatedAt: sql`(datetime('now'))`,
  };
  if (opts.adminNote !== undefined) update.adminNote = opts.adminNote;

  const [updated] = await db.update(consultations)
    .set(update)
    .where(eq(consultations.id, id))
    .returning();

  return updated;
}

async function attachBookingSlotDetails(rows) {
  const slotIds = [...new Set(rows.map((row) => row.bookingSlotId).filter(Boolean))];
  if (slotIds.length === 0) return rows;

  const slots = await db.select().from(bookingSlots).where(inArray(bookingSlots.id, slotIds));
  const slotById = new Map(slots.map((slot) => [slot.id, {
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    lawyerId: slot.lawyerId,
  }]));

  return rows.map((row) => ({
    ...row,
    bookingSlot: slotById.get(row.bookingSlotId) || null,
  }));
}

/**
 * 상담 목록 조회 (관리자)
 * @param {object} filters - { page, limit, status }
 * @returns {{ items: Array, meta: object }}
 */
async function listConsultations(filters) {
  const { page, limit, offset } = parsePagination(filters);

  let query = db.select().from(consultations);
  let countQuery = db.select({ total: sql`count(*)` }).from(consultations);

  if (filters.status) {
    query = query.where(eq(consultations.status, filters.status));
    countQuery = countQuery.where(eq(consultations.status, filters.status));
  }

  const rows = await query.orderBy(desc(consultations.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await countQuery;

  return {
    items: await attachBookingSlotDetails(rows),
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 상담 상태/메모 수정 (관리자)
 * @param {string} id - 상담 UUID
 * @param {object} data - { status, adminNote }
 * @returns {object} 수정된 상담 레코드
 */
async function updateConsultation(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
  if (!existing) {
    throw new ServiceError("상담 내역을 찾을 수 없습니다", 404);
  }

  const { status, adminNote } = data;
  const updateData = { updatedAt: sql`(datetime('now'))` };
  if (status !== undefined) updateData.status = status;
  if (adminNote !== undefined) updateData.adminNote = adminNote;

  const [updated] = await db
    .update(consultations)
    .set(updateData)
    .where(eq(consultations.id, id))
    .returning();

  return updated;
}

/**
 * 상담 삭제 (관리자)
 * @param {string} id - 상담 UUID
 * @returns {{ deleted: true }}
 */
async function deleteConsultation(id) {
  validateUUID(id);

  const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
  if (!existing) {
    throw new ServiceError("상담 내역을 찾을 수 없습니다", 404);
  }

  await db.delete(consultations).where(eq(consultations.id, id));
  return { deleted: true };
}

module.exports = {
  createConsultation,
  listConsultations,
  updateConsultation,
  confirmConsultation,
  deleteConsultation,
  MEETING_TYPE_LABELS,
};
