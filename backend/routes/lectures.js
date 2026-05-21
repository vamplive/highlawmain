/** 강의 활동 관리 API — 변호사별 강의 CRUD + 강의안 파일 업로드 */
const { Router } = require("express");
const { eq, asc, and, desc } = require("drizzle-orm");
const { db } = require("../db");
const { lectures, lawyers } = require("../db/schema");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const { adminAuth } = require("../lib/auth");

const router = Router();

/** 영문 이름 → URL 슬러그 변환 */
function toSlug(nameEn) {
  if (!nameEn) return "";
  return nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** 공통 — 서버 에러 응답 */
function sendServerError(res, err) {
  console.error("[lectures]", err.stack || err.message || err);
  res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
}

// 강의안 파일 업로드 설정
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const LECTURES_DIR = path.join(STORAGE_PATH, "uploads", "lectures");
if (!fs.existsSync(LECTURES_DIR)) fs.mkdirSync(LECTURES_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = /\.(pdf|pptx?|docx?|hwp|hwpx|jpg|jpeg|png|zip)$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fsp.mkdir(LECTURES_DIR, { recursive: true })
      .then(() => cb(null, LECTURES_DIR))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `lecture-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
      return cb(new Error("허용되지 않는 파일 형식입니다 (PDF, PPT, DOC, HWP, 이미지, ZIP만 가능)"));
    }
    cb(null, true);
  },
});

/** GET /api/lectures — 전체 강의 목록 (공개용, 선택적 변호사 필터) */
router.get("/", async (req, res) => {
  try {
    const { lawyerId, all } = req.query;
    let rows;
    if (lawyerId) {
      rows = db.select().from(lectures)
        .where(all === "true"
          ? eq(lectures.lawyerId, lawyerId)
          : and(eq(lectures.lawyerId, lawyerId), eq(lectures.isPublished, 1)))
        .orderBy(asc(lectures.sortOrder), desc(lectures.date))
        .all();
    } else {
      rows = db.select().from(lectures)
        .where(all === "true" ? undefined : eq(lectures.isPublished, 1))
        .orderBy(asc(lectures.sortOrder), desc(lectures.date))
        .all();
    }
    res.json({ data: rows, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** GET /api/lectures/:id — 강의 상세 */
router.get("/:id", async (req, res) => {
  try {
    const row = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    if (!row) return res.status(404).json({ data: null, error: "강의를 찾을 수 없습니다", meta: null });

    // 변호사 정보도 함께 조회 (슬러그 포함)
    const lawyer = db.select().from(lawyers).where(eq(lawyers.id, row.lawyerId)).get();
    const lawyerWithSlug = lawyer ? { ...lawyer, slug: toSlug(lawyer.nameEn) } : null;
    res.json({ data: { ...row, lawyer: lawyerWithSlug }, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** POST /api/lectures — 강의 등록 (관리자) */
router.post("/", adminAuth, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { lawyerId, title, description, date, venue, organizer, isPublished, sortOrder } = req.body;
    if (!lawyerId) return res.status(400).json({ data: null, error: "변호사를 선택해주세요", meta: null });
    if (!title) return res.status(400).json({ data: null, error: "강의 제목은 필수입니다", meta: null });

    db.insert(lectures).values({
      id,
      lawyerId,
      title,
      description: description || null,
      date: date || null,
      venue: venue || null,
      organizer: organizer || null,
      isPublished: isPublished ?? 1,
      sortOrder: sortOrder ?? 0,
    }).run();

    const created = db.select().from(lectures).where(eq(lectures.id, id)).get();
    res.status(201).json({ data: created, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** PATCH /api/lectures/:id — 강의 수정 (관리자) */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const existing = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ data: null, error: "강의를 찾을 수 없습니다", meta: null });

    const updates = {};
    const fields = ["lawyerId", "title", "description", "date", "venue", "organizer", "thumbnailUrl", "materialUrl", "materialName", "isPublished", "sortOrder"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    updates.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.update(lectures).set(updates).where(eq(lectures.id, req.params.id)).run();
    const updated = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** DELETE /api/lectures/:id — 강의 삭제 (관리자) */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const existing = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ data: null, error: "강의를 찾을 수 없습니다", meta: null });

    // 강의안 파일이 있으면 삭제
    if (existing.materialUrl) {
      const filePath = path.join(STORAGE_PATH, existing.materialUrl.replace(/^\//, ""));
      fsp.unlink(filePath).catch(() => {});
    }

    db.delete(lectures).where(eq(lectures.id, req.params.id)).run();
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

/** POST /api/lectures/:id/upload-material — 강의안 파일 업로드 (관리자) */
router.post("/:id/upload-material", adminAuth, upload.single("file"), async (req, res) => {
  try {
    const existing = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ data: null, error: "강의를 찾을 수 없습니다", meta: null });

    if (!req.file) return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });

    // 기존 파일 삭제
    if (existing.materialUrl) {
      const oldPath = path.join(STORAGE_PATH, existing.materialUrl.replace(/^\//, ""));
      fsp.unlink(oldPath).catch(() => {});
    }

    const materialUrl = `/uploads/lectures/${req.file.filename}`;
    const materialName = req.file.originalname;

    db.update(lectures).set({
      materialUrl,
      materialName,
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    }).where(eq(lectures.id, req.params.id)).run();

    const updated = db.select().from(lectures).where(eq(lectures.id, req.params.id)).get();
    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    sendServerError(res, err);
  }
});

module.exports = router;
