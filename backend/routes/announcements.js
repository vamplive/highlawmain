/**
 * 공지/배너/팝업 API 라우트 — announcements CRUD
 * - GET / : 전체 목록 (type, active 필터)
 * - GET /active : 공개용 — 현재 활성 공지만 반환
 * - GET /:id : 단건 조회
 * - POST / : 생성
 * - PATCH /:id : 수정
 * - DELETE /:id : 삭제
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { db } = require("../db");
const { announcements } = require("../db/schema");
const { eq, and, or, sql, desc, asc, lte, gte, isNull } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");
const { isSafeUrl, isValidColor, isValidDate, isValidSortOrder } = require("../lib/sanitize");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── GET /active — 공개용: 현재 활성 공지 목록 ───
// 주의: /:id보다 먼저 등록해야 라우트 충돌 방지
router.get("/active", async (req, res) => {
  try {
    const now = new Date().toISOString();

    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, 1),
          or(isNull(announcements.startDate), lte(announcements.startDate, now)),
          or(isNull(announcements.endDate), gte(announcements.endDate, now))
        )
      )
      .orderBy(asc(announcements.sortOrder), desc(announcements.createdAt));

    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (err) {
    logger.error({ err }, "[announcements] 활성 목록 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET / — 전체 공지 목록 (관리자) ───
router.get("/", async (req, res) => {
  try {
    const { type, active } = req.query;

    const conditions = [];
    if (type) conditions.push(eq(announcements.type, type));
    if (active === "true") conditions.push(eq(announcements.isActive, 1));
    if (active === "false") conditions.push(eq(announcements.isActive, 0));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(announcements);
    if (whereClause) query = query.where(whereClause);

    const rows = await query.orderBy(asc(announcements.sortOrder), desc(announcements.createdAt));

    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (err) {
    logger.error({ err }, "[announcements] 목록 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET /:id — 단건 조회 ───
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [row] = await db.select().from(announcements).where(eq(announcements.id, id));
    if (!row) {
      return res.status(404).json({ data: null, error: "공지를 찾을 수 없습니다", meta: null });
    }

    res.json({ data: row, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[announcements] 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── POST / — 공지 생성 ───
router.post("/", adminAuth, async (req, res) => {
  try {
    const { type, title, content, linkUrl, bgColor, textColor, isActive, startDate, endDate, position, sortOrder } = req.body;

    if (!type || !type.trim()) {
      return res.status(400).json({ data: null, error: "type 필드는 필수입니다", meta: null });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ data: null, error: "title 필드는 필수입니다", meta: null });
    }

    // 입력값 검증
    if (linkUrl !== undefined && linkUrl && !isSafeUrl(linkUrl)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 URL 형식입니다", meta: null });
    }
    if (bgColor !== undefined && bgColor && !isValidColor(bgColor)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 배경색 형식입니다 (예: #FF0000)", meta: null });
    }
    if (textColor !== undefined && textColor && !isValidColor(textColor)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 텍스트색 형식입니다 (예: #FFFFFF)", meta: null });
    }
    if (startDate !== undefined && startDate && !isValidDate(startDate)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 시작 날짜입니다", meta: null });
    }
    if (endDate !== undefined && endDate && !isValidDate(endDate)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 종료 날짜입니다", meta: null });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ data: null, error: "시작 날짜가 종료 날짜보다 늦을 수 없습니다", meta: null });
    }
    if (!isValidSortOrder(sortOrder)) {
      return res.status(400).json({ data: null, error: "정렬 순서는 0~9999 사이 정수여야 합니다", meta: null });
    }

    const values = {
      type: type.trim(),
      title: title.trim(),
    };
    if (content !== undefined) values.content = content;
    if (linkUrl !== undefined) values.linkUrl = linkUrl;
    if (bgColor !== undefined) values.bgColor = bgColor;
    if (textColor !== undefined) values.textColor = textColor;
    if (isActive !== undefined) values.isActive = isActive ? 1 : 0;
    if (startDate !== undefined) values.startDate = startDate;
    if (endDate !== undefined) values.endDate = endDate;
    if (position !== undefined) values.position = position;
    if (sortOrder !== undefined) values.sortOrder = sortOrder;

    const [inserted] = await db.insert(announcements).values(values).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[announcements] 생성 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── PATCH /:id — 공지 수정 ───
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(announcements).where(eq(announcements.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "공지를 찾을 수 없습니다", meta: null });
    }

    const { type, title, content, linkUrl, bgColor, textColor, isActive, startDate, endDate, position, sortOrder } = req.body;

    // 입력값 검증
    if (linkUrl !== undefined && linkUrl && !isSafeUrl(linkUrl)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 URL 형식입니다", meta: null });
    }
    if (bgColor !== undefined && bgColor && !isValidColor(bgColor)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 배경색 형식입니다 (예: #FF0000)", meta: null });
    }
    if (textColor !== undefined && textColor && !isValidColor(textColor)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 텍스트색 형식입니다 (예: #FFFFFF)", meta: null });
    }
    const effectiveStart = startDate !== undefined ? startDate : existing.startDate;
    const effectiveEnd = endDate !== undefined ? endDate : existing.endDate;
    if (effectiveStart && effectiveEnd && new Date(effectiveStart) > new Date(effectiveEnd)) {
      return res.status(400).json({ data: null, error: "시작 날짜가 종료 날짜보다 늦을 수 없습니다", meta: null });
    }
    if (!isValidSortOrder(sortOrder)) {
      return res.status(400).json({ data: null, error: "정렬 순서는 0~9999 사이 정수여야 합니다", meta: null });
    }

    const updateData = { updatedAt: sql`(datetime('now'))` };
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (bgColor !== undefined) updateData.bgColor = bgColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (position !== undefined) updateData.position = position;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updated] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[announcements] 수정 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── DELETE /:id — 공지 삭제 ───
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(announcements).where(eq(announcements.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "공지를 찾을 수 없습니다", meta: null });
    }

    await db.delete(announcements).where(eq(announcements.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[announcements] 삭제 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
