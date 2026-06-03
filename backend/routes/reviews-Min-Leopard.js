/**
 * 의뢰인 후기 API 라우트 — 후기 CRUD (공개 조회 + 관리자 관리)
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { reviews } = require("../db/schema");
const { eq, desc, sql } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/reviews — 후기 목록 조회
 * - ?published=true → 공개된 후기만 (공개 페이지용)
 * - 필터 없으면 전체 (관리자용)
 * - 쿼리: page, limit
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { published } = req.query;

    let query = db.select().from(reviews);
    let countQuery = db.select({ total: sql`count(*)` }).from(reviews);

    if (published === "true") {
      query = query.where(eq(reviews.isPublished, 1));
      countQuery = countQuery.where(eq(reviews.isPublished, 1));
    }

    const rows = await query.orderBy(desc(reviews.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await countQuery;

    res.json({
      data: rows,
      error: null,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/reviews/top — 홈페이지용 상위 3개 후기
 * - 공개 + 별점 높은 순
 */
router.get("/top", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.isPublished, 1))
      .orderBy(desc(reviews.rating), desc(reviews.createdAt))
      .limit(3);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/reviews — 후기 생성 (관리자)
 * - clientName, rating(1-5), content 필수
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const { clientName, rating, content, category, isAnonymous, isPublished } = req.body;

    if (!clientName || !clientName.trim()) {
      return res.status(400).json({ data: null, error: "고객명을 입력해주세요", meta: null });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ data: null, error: "후기 내용을 입력해주세요", meta: null });
    }

    const ratingValue = parseInt(rating) || 5;
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ data: null, error: "별점은 1~5 사이여야 합니다", meta: null });
    }

    const [inserted] = await db.insert(reviews).values({
      clientName: clientName.trim(),
      rating: ratingValue,
      content: content.trim(),
      category: category || null,
      isAnonymous: isAnonymous ? 1 : 0,
      isPublished: isPublished ? 1 : 0,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * PATCH /api/reviews/:id — 후기 수정 (관리자)
 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "후기를 찾을 수 없습니다", meta: null });
    }

    const { clientName, rating, content, category, isAnonymous, isPublished } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };

    if (clientName !== undefined) updateData.clientName = clientName.trim();
    if (rating !== undefined) updateData.rating = Math.min(5, Math.max(1, parseInt(rating) || 5));
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) updateData.category = category;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous ? 1 : 0;
    if (isPublished !== undefined) updateData.isPublished = isPublished ? 1 : 0;

    const [updated] = await db.update(reviews).set(updateData).where(eq(reviews.id, id)).returning();
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /api/reviews/:id — 후기 삭제 (관리자)
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(reviews).where(eq(reviews.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "후기를 찾을 수 없습니다", meta: null });
    }

    await db.delete(reviews).where(eq(reviews.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
