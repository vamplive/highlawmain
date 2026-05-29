/**
 * 채용 공고 API 라우트
 * GET    /api/recruit           — 공개: 발행된 채용 공고 목록
 * GET    /api/recruit/:id       — 공개: 채용 공고 상세
 * POST   /api/recruit           — 관리자: 채용 공고 생성
 * PUT    /api/recruit/:id       — 관리자: 채용 공고 수정
 * DELETE /api/recruit/:id       — 관리자: 채용 공고 삭제
 */
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { db } = require("../db");
const { recruitPosts } = require("../db/schema");
const { eq, desc, and } = require("drizzle-orm");

// ── 공개: 채용 공고 목록 ──
// ?category=new_lawyer&all=true(관리자 전용)
router.get("/", (req, res) => {
  try {
    const { category, all } = req.query;
    let query = db.select().from(recruitPosts).orderBy(recruitPosts.sortOrder, desc(recruitPosts.createdAt));

    // 공개 API는 발행된 것만, all=true (관리자용)는 전체
    const conditions = [];
    if (!all || all !== "true") {
      conditions.push(eq(recruitPosts.isPublished, 1));
    }
    if (category) {
      conditions.push(eq(recruitPosts.category, category));
    }
    if (conditions.length === 1) {
      query = db.select().from(recruitPosts).where(conditions[0]).orderBy(recruitPosts.sortOrder, desc(recruitPosts.createdAt));
    } else if (conditions.length > 1) {
      query = db.select().from(recruitPosts).where(and(...conditions)).orderBy(recruitPosts.sortOrder, desc(recruitPosts.createdAt));
    }

    const posts = query.all();
    return res.json({ data: posts });
  } catch (err) {
    console.error("[recruit] GET / error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 공개: 채용 공고 상세 ──
router.get("/:id", (req, res) => {
  try {
    const post = db.select().from(recruitPosts).where(eq(recruitPosts.id, req.params.id)).get();
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.json({ data: post });
  } catch (err) {
    console.error("[recruit] GET /:id error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 채용 공고 생성 ──
router.post("/", (req, res) => {
  try {
    const {
      category = "new_lawyer",
      title,
      description,
      requirements,
      benefits,
      applicationDeadline,
      applicationFileUrl,
      applicationFileName,
      status = "open",
      isPublished = 0,
      sortOrder = 0,
    } = req.body;

    if (!title) return res.status(400).json({ error: "title is required" });

    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    db.insert(recruitPosts).values({
      id,
      category,
      title,
      description,
      requirements,
      benefits,
      applicationDeadline,
      applicationFileUrl,
      applicationFileName,
      status,
      isPublished: Number(isPublished),
      sortOrder: Number(sortOrder),
      createdAt: now,
      updatedAt: now,
    }).run();

    const created = db.select().from(recruitPosts).where(eq(recruitPosts.id, id)).get();
    return res.status(201).json({ data: created });
  } catch (err) {
    console.error("[recruit] POST / error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 채용 공고 수정 ──
router.put("/:id", (req, res) => {
  try {
    const existing = db.select().from(recruitPosts).where(eq(recruitPosts.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Not found" });

    const {
      category,
      title,
      description,
      requirements,
      benefits,
      applicationDeadline,
      applicationFileUrl,
      applicationFileName,
      status,
      isPublished,
      sortOrder,
    } = req.body;

    const now = new Date().toISOString().replace("T", " ").split(".")[0];
    const updates = { updatedAt: now };
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (requirements !== undefined) updates.requirements = requirements;
    if (benefits !== undefined) updates.benefits = benefits;
    if (applicationDeadline !== undefined) updates.applicationDeadline = applicationDeadline;
    if (applicationFileUrl !== undefined) updates.applicationFileUrl = applicationFileUrl;
    if (applicationFileName !== undefined) updates.applicationFileName = applicationFileName;
    if (status !== undefined) updates.status = status;
    if (isPublished !== undefined) updates.isPublished = Number(isPublished);
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);

    db.update(recruitPosts).set(updates).where(eq(recruitPosts.id, req.params.id)).run();
    const updated = db.select().from(recruitPosts).where(eq(recruitPosts.id, req.params.id)).get();
    return res.json({ data: updated });
  } catch (err) {
    console.error("[recruit] PUT /:id error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 채용 공고 삭제 ──
router.delete("/:id", (req, res) => {
  try {
    const existing = db.select().from(recruitPosts).where(eq(recruitPosts.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Not found" });
    db.delete(recruitPosts).where(eq(recruitPosts.id, req.params.id)).run();
    return res.json({ success: true });
  } catch (err) {
    console.error("[recruit] DELETE /:id error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
