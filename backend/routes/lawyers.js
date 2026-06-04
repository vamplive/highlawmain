/** 변호사 관리 API — CRUD + 정렬 */
const { Router } = require("express");
const { eq, asc } = require("drizzle-orm");
const { db } = require("../db");
const { lawyers } = require("../db/schema");
const crypto = require("crypto");
const { adminAuth } = require("../lib/auth");

const router = Router();

/** 공통 — 서버 에러 응답 (클라이언트에 원본 err.message 노출 금지) */
function sendServerError(res, err) {
  console.error("[lawyers]", err.stack || err.message || err);
  res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
}

/** GET /api/lawyers — 활성 변호사 목록 (공개용, 정렬순) */
router.get("/", async (req, res) => {
  try {
    const all = req.query.all === "true";
    const rows = db
      .select()
      .from(lawyers)
      .orderBy(asc(lawyers.sortOrder))
      .all();

    const filtered = all ? rows : rows.filter((r) => r.isActive === 1);
    const result = filtered.map((r) => ({ ...r, slug: toSlug(r.nameEn) }));
    res.json({ data: result, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** GET /api/lawyers/:idOrSlug — 변호사 상세 (UUID 또는 영문 슬러그) */
router.get("/:idOrSlug", async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    // UUID 형식이면 id로, 아니면 name_en 슬러그로 검색
    const isUuid = /^[0-9a-f]{8}-/.test(param);
    let row;
    if (isUuid) {
      row = db.select().from(lawyers).where(eq(lawyers.id, param)).get();
    } else {
      // 슬러그 → name_en 매칭 (slug: "yoon-sehwan" → name_en에서 검색)
      const rows = db.select().from(lawyers).all();
      row = rows.find((r) => toSlug(r.nameEn) === param);
    }
    if (!row) return res.status(404).json({ data: null, error: "변호사를 찾을 수 없습니다", meta: null });
    res.json({ data: { ...row, slug: toSlug(row.nameEn) }, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** 영문 이름 → URL 슬러그 변환 */
function toSlug(nameEn) {
  if (!nameEn) return "";
  return nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** POST /api/lawyers — 변호사 등록 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const {
      name, nameEn, nameHanja, position, team, photoUrl, tagline,
      education, career, specialties, qualifications,
      publications, books, media, columns, cases, memberships,
      consultHours, blogUrl, introduction, email, phone, sortOrder, isActive,
    } = req.body;
    if (!name) return res.status(400).json({ data: null, error: "이름은 필수입니다", meta: null });

    db.insert(lawyers).values({
      id,
      name,
      nameEn: nameEn || null,
      nameHanja: nameHanja || null,
      position: position || "변호사",
      team: team || null,
      photoUrl: photoUrl || null,
      tagline: tagline || null,
      education: education || null,
      career: career || null,
      specialties: specialties || null,
      qualifications: qualifications || null,
      publications: publications || null,
      books: books || null,
      media: media || null,
      columns: columns || null,
      cases: cases || null,
      memberships: memberships || null,
      consultHours: consultHours || null,
      blogUrl: blogUrl || null,
      introduction: introduction || null,
      email: email || null,
      phone: phone || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? 1,
    }).run();

    const created = db.select().from(lawyers).where(eq(lawyers.id, id)).get();
    res.status(201).json({ data: created, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** PATCH /api/lawyers/:id — 변호사 정보 수정 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const existing = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ data: null, error: "변호사를 찾을 수 없습니다", meta: null });

    const updates = {};
    const fields = [
      "name", "nameEn", "nameHanja", "position", "team", "photoUrl", "tagline",
      "education", "career", "specialties", "qualifications",
      "publications", "books", "media", "columns", "cases", "memberships",
      "consultHours", "blogUrl", "introduction", "email", "phone", "sortOrder", "isActive",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    updates.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.update(lawyers).set(updates).where(eq(lawyers.id, req.params.id)).run();
    const updated = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** DELETE /api/lawyers/:id — 변호사 삭제 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const existing = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ data: null, error: "변호사를 찾을 수 없습니다", meta: null });

    db.delete(lawyers).where(eq(lawyers.id, req.params.id)).run();
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

module.exports = router;
