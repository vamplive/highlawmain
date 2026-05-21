/**
 * 상담 예약 API 라우트 — 예약 슬롯 조회/예약(공개) + 설정/슬롯 생성(관리자)
 */
const { Router } = require("express");
const { db } = require("../db");
const { bookingSlots, bookingSettings, consultations } = require("../db/schema");
const { eq, and, desc, sql, gte, lte } = require("drizzle-orm");
const { adminAuth, requireMinRole } = require("../lib/auth");
const { auditMiddleware } = require("../lib/audit-log");
const triggerService = require("../services/trigger-service");
const { handleError } = require("../lib/route-handler");

const router = Router();

// 모든 쓰기 작업을 감사 로그에 기록 — 슬롯 생성/취소·설정 변경 추적용
router.use(auditMiddleware("bookings"));

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 날짜 형식 검증 (YYYY-MM-DD) */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 시간 문자열(HH:MM)을 분으로 변환
 * @param {string} time - "09:00" 형식
 * @returns {number} 분 단위 (예: 540)
 */
function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 분을 시간 문자열(HH:MM)로 변환
 * @param {number} minutes - 분 단위
 * @returns {string} "09:00" 형식
 */
function minutesToTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

/**
 * GET /api/bookings/available — 특정 날짜의 가용 슬롯 조회 (공개)
 * - ?date=YYYY-MM-DD&lawyerId=uuid (lawyerId 선택)
 */
router.get("/available", async (req, res) => {
  try {
    const { date, lawyerId } = req.query;

    if (!date || !DATE_REGEX.test(date)) {
      return res.status(400).json({ data: null, error: "올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)", meta: null });
    }

    let query = db
      .select()
      .from(bookingSlots)
      .where(and(
        eq(bookingSlots.date, date),
        eq(bookingSlots.isAvailable, 1),
      ));

    if (lawyerId && UUID_REGEX.test(lawyerId)) {
      query = db
        .select()
        .from(bookingSlots)
        .where(and(
          eq(bookingSlots.date, date),
          eq(bookingSlots.isAvailable, 1),
          eq(bookingSlots.lawyerId, lawyerId),
        ));
    }

    const rows = await query.orderBy(bookingSlots.startTime);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/bookings/available-week — 7일간 가용 슬롯 조회 (공개)
 * - ?startDate=YYYY-MM-DD&lawyerId=uuid
 */
router.get("/available-week", async (req, res) => {
  try {
    const { startDate, lawyerId } = req.query;

    if (!startDate || !DATE_REGEX.test(startDate)) {
      return res.status(400).json({ data: null, error: "올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)", meta: null });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split("T")[0];

    let conditions = and(
      gte(bookingSlots.date, startDate),
      lte(bookingSlots.date, endDate),
      eq(bookingSlots.isAvailable, 1),
    );

    if (lawyerId && UUID_REGEX.test(lawyerId)) {
      conditions = and(conditions, eq(bookingSlots.lawyerId, lawyerId));
    }

    const rows = await db
      .select()
      .from(bookingSlots)
      .where(conditions)
      .orderBy(bookingSlots.date, bookingSlots.startTime);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/bookings/book — 슬롯 예약 (공개)
 * - body: { slotId, consultationId }
 */
router.post("/book", async (req, res) => {
  try {
    const { slotId, consultationId } = req.body;

    if (!slotId || !UUID_REGEX.test(slotId)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 슬롯 ID입니다", meta: null });
    }
    // consultationId 필수화: 익명 슬롯 블로킹(DoS) 방지 — 실제 상담 신청 기록이 있어야 예약 가능
    if (!consultationId || !UUID_REGEX.test(consultationId)) {
      return res.status(400).json({ data: null, error: "상담 신청 정보가 필요합니다", meta: null });
    }

    const [consult] = await db.select().from(consultations).where(eq(consultations.id, consultationId));
    if (!consult) {
      return res.status(404).json({ data: null, error: "상담 신청을 찾을 수 없습니다", meta: null });
    }

    const [slot] = await db.select().from(bookingSlots).where(eq(bookingSlots.id, slotId));
    if (!slot) {
      return res.status(404).json({ data: null, error: "예약 슬롯을 찾을 수 없습니다", meta: null });
    }
    if (!slot.isAvailable) {
      return res.status(409).json({ data: null, error: "이미 예약된 시간입니다", meta: null });
    }

    const [updated] = await db
      .update(bookingSlots)
      .set({ isAvailable: 0, consultationId })
      .where(eq(bookingSlots.id, slotId))
      .returning();

    // 예약 리마인더 트리거 — delayMinutes가 음수면 예약 시각 이전에 발송됨
    const bookingTime = new Date(`${updated.date}T${updated.startTime}:00`);
    triggerService.fireTrigger("booking_reminder", {
      recipient: {
        name: consult.name, phone: consult.phone, email: consult.email,
        category: consult.category, consultationId: consult.id,
      },
      baseTime: bookingTime,
      originRef: `booking_reminder:${updated.id}`,
    });

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/bookings/cancel/:id — 예약 취소
 * - 슬롯을 다시 가용 상태로 변경
 */
router.post("/cancel/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [slot] = await db.select().from(bookingSlots).where(eq(bookingSlots.id, id));
    if (!slot) {
      return res.status(404).json({ data: null, error: "예약 슬롯을 찾을 수 없습니다", meta: null });
    }

    const [updated] = await db
      .update(bookingSlots)
      .set({ isAvailable: 1, consultationId: null })
      .where(eq(bookingSlots.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/bookings/settings — 예약 설정 목록 (관리자)
 */
router.get("/settings", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(bookingSettings);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/bookings/settings — 예약 설정 생성/수정 (관리자)
 * - body: { lawyerId, dayOfWeek, startTime, endTime, slotDuration }
 */
router.post("/settings", adminAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const { lawyerId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ data: null, error: "요일은 0(일)~6(토) 사이여야 합니다", meta: null });
    }

    const [inserted] = await db.insert(bookingSettings).values({
      lawyerId: lawyerId || null,
      dayOfWeek,
      startTime: startTime || "09:00",
      endTime: endTime || "18:00",
      slotDuration: slotDuration || 60,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/bookings/generate-slots — 기간별 슬롯 일괄 생성 (관리자)
 * - body: { startDate, endDate, lawyerId }
 * - 설정(bookingSettings)을 기반으로 각 날짜에 슬롯 생성
 */
router.post("/generate-slots", adminAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const { startDate, endDate, lawyerId } = req.body;

    if (!startDate || !DATE_REGEX.test(startDate) || !endDate || !DATE_REGEX.test(endDate)) {
      return res.status(400).json({ data: null, error: "올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)", meta: null });
    }

    // 해당 변호사의 활성 설정 조회
    let settingsQuery = db.select().from(bookingSettings).where(eq(bookingSettings.isActive, 1));
    if (lawyerId && UUID_REGEX.test(lawyerId)) {
      settingsQuery = db
        .select()
        .from(bookingSettings)
        .where(and(eq(bookingSettings.isActive, 1), eq(bookingSettings.lawyerId, lawyerId)));
    }
    const settings = await settingsQuery;

    if (settings.length === 0) {
      return res.status(400).json({ data: null, error: "예약 설정이 없습니다. 먼저 설정을 추가해주세요.", meta: null });
    }

    // 요일별 설정 맵 생성
    const settingsByDay = {};
    for (const s of settings) {
      settingsByDay[s.dayOfWeek] = s;
    }

    let createdCount = 0;
    const current = new Date(startDate);
    const endDt = new Date(endDate);

    while (current <= endDt) {
      const dayOfWeek = current.getDay();
      const setting = settingsByDay[dayOfWeek];

      if (setting) {
        const dateStr = current.toISOString().split("T")[0];
        const startMin = timeToMinutes(setting.startTime);
        const endMin = timeToMinutes(setting.endTime);
        const duration = setting.slotDuration;

        // 시작~종료 시간을 slotDuration 간격으로 슬롯 생성
        for (let min = startMin; min + duration <= endMin; min += duration) {
          await db.insert(bookingSlots).values({
            lawyerId: setting.lawyerId || lawyerId || null,
            date: dateStr,
            startTime: minutesToTime(min),
            endTime: minutesToTime(min + duration),
          });
          createdCount++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    res.json({ data: { created: createdCount }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/bookings — 예약된 슬롯 목록 (관리자)
 * - isAvailable=0인 슬롯 (예약 완료된 것)
 * - 쿼리: page, limit
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(bookingSlots)
      .where(eq(bookingSlots.isAvailable, 0))
      .orderBy(desc(bookingSlots.date), desc(bookingSlots.startTime))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`count(*)` })
      .from(bookingSlots)
      .where(eq(bookingSlots.isAvailable, 0));

    res.json({
      data: rows,
      error: null,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
