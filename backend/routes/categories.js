/**
 * 카테고리 API 라우트 — 카테고리 CRUD
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { categories } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");

const router = Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(categories);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/categories (관리자만)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, slug, parentId, color, icon, sortOrder } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ data: null, error: "name and slug are required", meta: null });
    }

    // parentId 존재 여부 검증
    if (parentId) {
      const [parent] = await db.select().from(categories).where(eq(categories.id, parentId));
      if (!parent) {
        return res.status(400).json({ data: null, error: "존재하지 않는 부모 카테고리입니다", meta: null });
      }
    }

    const [inserted] = await db
      .insert(categories)
      .values({
        name,
        slug,
        parentId: parentId ?? null,
        color: color ?? null,
        icon: icon ?? null,
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /api/categories/:id (관리자만)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(categories).where(eq(categories.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "카테고리를 찾을 수 없습니다", meta: null });
    }

    // 순환 참조 방지: 자기 자신을 부모로 설정 불가
    if (req.body.parentId === id) {
      return res.status(400).json({ data: null, error: "자기 자신을 부모 카테고리로 설정할 수 없습니다", meta: null });
    }
    if (req.body.parentId) {
      const [parent] = await db.select().from(categories).where(eq(categories.id, req.body.parentId));
      if (!parent) {
        return res.status(400).json({ data: null, error: "존재하지 않는 부모 카테고리입니다", meta: null });
      }
    }

    const updateData = {};
    const allowedFields = ["name", "slug", "parentId", "color", "icon", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /api/categories/:id (관리자만)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(categories).where(eq(categories.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "카테고리를 찾을 수 없습니다", meta: null });
    }

    await db.delete(categories).where(eq(categories.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
