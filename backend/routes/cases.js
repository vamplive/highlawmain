/**
 * 성공 사례 API 라우트 — 사례 CRUD
 */
const { Router } = require("express");
const { db } = require("../db");
const { caseResults } = require("../db/schema");
const { eq, desc, asc, and, count } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");

const router = Router();

// UUID 형식 검증 헬퍼
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(id, res) {
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    return false;
  }
  return true;
}

// GET /api/cases — 공개 사례 목록 (카테고리 필터)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;
    const category = req.query.category || null;
    // 미공개 사건 포함은 인증된 관리자만 가능
    const auth = req.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const { getSession } = require("../lib/auth");
    const session = token ? getSession(token) : null;
    const includeUnpublished = req.query.all === "true" && !!session;

    const conditions = [];
    if (!includeUnpublished) {
      conditions.push(eq(caseResults.isPublished, 1));
    }
    if (category) {
      conditions.push(eq(caseResults.category, category));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(caseResults)
      .where(where);

    const rows = await db
      .select()
      .from(caseResults)
      .where(where)
      .orderBy(asc(caseResults.sortOrder), desc(caseResults.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows,
      error: null,
      meta: { total: totalResult.total, page, limit, totalPages: Math.ceil(totalResult.total / limit) },
    });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/cases — 사례 생성
router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, category, result, summary, detail, isPublished, sortOrder } = req.body;

    if (!title || !result || !summary) {
      return res.status(400).json({ data: null, error: "title, result, summary는 필수입니다", meta: null });
    }

    const [inserted] = await db
      .insert(caseResults)
      .values({
        title,
        category: category ?? "civil",
        result,
        summary,
        detail: detail ?? null,
        isPublished: isPublished ? 1 : 0,
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /api/cases/:id — 사례 수정
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(caseResults).where(eq(caseResults.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사례를 찾을 수 없습니다", meta: null });
    }

    const updateData = {};
    const allowedFields = ["title", "category", "result", "summary", "detail", "isPublished", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }
    if ("isPublished" in req.body) {
      updateData.isPublished = req.body.isPublished ? 1 : 0;
    }
    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db
      .update(caseResults)
      .set(updateData)
      .where(eq(caseResults.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /api/cases/:id — 사례 삭제
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(caseResults).where(eq(caseResults.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사례를 찾을 수 없습니다", meta: null });
    }

    await db.delete(caseResults).where(eq(caseResults.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
