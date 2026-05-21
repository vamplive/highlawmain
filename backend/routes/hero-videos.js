/**
 * 히어로 배경 영상 API 라우트 — CRUD + 활성화 관리
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { handleError } = require("../lib/route-handler");
const { db, sqlite } = require("../db");
const { heroVideos } = require("../db/schema");
const { eq, desc, asc } = require("drizzle-orm");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const { adminAuth } = require("../lib/auth");
const { UUID_REGEX } = require("../services/helpers");

const router = Router();

// 영상 업로드용 Multer 설정 (100MB 제한)
const UPLOAD_DIR = path.join(
  process.env.STORAGE_PATH || path.join(__dirname, "..", "data"),
  "uploads",
  "videos"
);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".mp4";
      cb(null, `hero-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = [".mp4", ".webm", ".mov"];
    const allowedMimes = ["video/mp4", "video/webm", "video/quicktime"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedExts.includes(ext) && allowedMimes.includes(file.mimetype));
  },
});

// GET / — 전체 목록
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = await db.select().from(heroVideos)
        .where(eq(heroVideos.category, category))
        .orderBy(asc(heroVideos.sortOrder), desc(heroVideos.createdAt));
    } else {
      rows = await db.select().from(heroVideos)
        .orderBy(asc(heroVideos.sortOrder), desc(heroVideos.createdAt));
    }
    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /active — 현재 활성 영상 (공개 엔드포인트)
router.get("/active", async (req, res) => {
  try {
    const [video] = await db.select().from(heroVideos)
      .where(eq(heroVideos.isActive, 1))
      .limit(1);
    res.json({ data: video || null, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /:id — 단건 조회
router.get("/:id", async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }
    const [video] = await db.select().from(heroVideos)
      .where(eq(heroVideos.id, req.params.id));
    if (!video) {
      return res.status(404).json({ data: null, error: "영상을 찾을 수 없습니다", meta: null });
    }
    res.json({ data: video, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST / — 새 영상 등록 (URL 방식)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, url, category } = req.body;
    if (!title || !url) {
      return res.status(400).json({ data: null, error: "title과 url은 필수입니다", meta: null });
    }
    const [inserted] = await db.insert(heroVideos).values({
      title,
      url,
      category: category || "manhattan",
    }).returning();
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /upload — 파일 업로드 방식
router.post("/upload", adminAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "영상 파일이 필요합니다", meta: null });
    }
    const { title, category } = req.body;
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const [inserted] = await db.insert(heroVideos).values({
      title: title || req.file.originalname,
      url: videoUrl,
      category: category || "manhattan",
    }).returning();
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /:id — 수정
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }
    const [existing] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "영상을 찾을 수 없습니다", meta: null });
    }
    const updateData = {};
    const allowedFields = ["title", "url", "category", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }
    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db.update(heroVideos)
      .set(updateData)
      .where(eq(heroVideos.id, id))
      .returning();
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /:id/activate — 활성화 (다른 모든 영상 비활성화 후 이 영상만 활성화)
router.patch("/:id/activate", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }
    // 대상 비디오 존재 확인 (없으면 모든 비디오가 비활성화되는 사고 방지)
    const [target] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    if (!target) {
      return res.status(404).json({ data: null, error: "영상을 찾을 수 없습니다", meta: null });
    }
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    // 트랜잭션으로 원자적 처리
    sqlite.transaction(() => {
      sqlite.prepare("UPDATE hero_videos SET is_active = 0, updated_at = ?").run(now);
      sqlite.prepare("UPDATE hero_videos SET is_active = 1, updated_at = ? WHERE id = ?").run(now, id);
    })();
    const [video] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    res.json({ data: video, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /:id — 삭제 (DB 먼저, 파일 나중)
//   파일 삭제 실패가 사용자 응답을 막지 않도록 순서를 분리한다.
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }
    const [existing] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "영상을 찾을 수 없습니다", meta: null });
    }

    // 1) DB 삭제
    await db.delete(heroVideos).where(eq(heroVideos.id, id));

    // 2) 로컬 업로드 파일이면 물리 파일도 정리 (실패는 경고만)
    if (existing.url.startsWith("/uploads/videos/")) {
      const filePath = path.join(UPLOAD_DIR, path.basename(existing.url));
      try {
        await fsp.unlink(filePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          logger.warn({ filePath, errCode: err.code }, "[HeroVideos] 파일 삭제 실패 (DB는 정리됨, 고아 파일)");
        }
      }
    }

    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
