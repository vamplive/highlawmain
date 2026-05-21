/**
 * 컬렉션 API 라우트 — 컬렉션 CRUD + 문서 연결 관리
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { collections, documentCollections, documents } = require("../db/schema");
const { eq, count } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");

const router = Router();

// GET /api/collections
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        icon: collections.icon,
        sortOrder: collections.sortOrder,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        documentCount: count(documentCollections.documentId),
      })
      .from(collections)
      .leftJoin(documentCollections, eq(collections.id, documentCollections.collectionId))
      .groupBy(collections.id);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/collections (관리자만)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ data: null, error: "name is required", meta: null });
    }

    const [inserted] = await db
      .insert(collections)
      .values({
        name,
        description: description ?? null,
        color: color ?? "#6366f1",
        icon: icon ?? null,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/collections/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    if (!collection) {
      return res.status(404).json({ data: null, error: "컬렉션을 찾을 수 없습니다", meta: null });
    }

    const docs = await db
      .select({
        id: documents.id,
        title: documents.title,
        documentType: documents.documentType,
        status: documents.status,
        importance: documents.importance,
        createdAt: documents.createdAt,
        addedAt: documentCollections.addedAt,
      })
      .from(documentCollections)
      .innerJoin(documents, eq(documentCollections.documentId, documents.id))
      .where(eq(documentCollections.collectionId, id));

    res.json({ data: { ...collection, documents: docs }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /api/collections/:id (관리자만)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(collections).where(eq(collections.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "컬렉션을 찾을 수 없습니다", meta: null });
    }

    const updateData = {};
    const allowedFields = ["name", "description", "color", "icon", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }
    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /api/collections/:id (관리자만)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(collections).where(eq(collections.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "컬렉션을 찾을 수 없습니다", meta: null });
    }

    await db.delete(collections).where(eq(collections.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
