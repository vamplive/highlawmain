/**
 * 미디어 파일 관리 API 라우트
 * - 파일 업로드 (단일/다중), 목록 조회, 메타데이터 수정, 삭제
 * - 폴더별 분류 및 파일 타입 필터링 지원
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { handleError } = require("../lib/route-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const sharp = require("sharp");
const { db } = require("../db");
const { mediaFiles } = require("../db/schema");
const { eq, desc, and, like, count } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");

// TODO: original_name 컬럼 PII 검토 — 의뢰인 이름·주소 등이 파일명에 포함되어 디스크/DB에 남을 수 있다.
//       정책 결정 후 익명화 또는 마스킹된 표시명으로 교체 필요.

// sharp로 EXIF/메타데이터를 strip할 이미지 mime 타입.
// SVG는 별도 sanitize 정책이 필요하므로 제외하고, 애니메이션 GIF는 sharp가
// 단일 프레임으로 변환할 수 있어 제외한다.
const EXIF_STRIPPABLE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const SHARP_FORMAT_BY_MIME = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * 업로드된 이미지에서 EXIF/메타데이터를 제거한다.
 * - sharp.rotate()로 EXIF orientation을 픽셀에 반영한 뒤
 *   toFormat(원본포맷)으로 다시 인코딩하여 메타데이터를 모두 제거한다.
 * - 처리 실패 시 경고만 남기고 원본을 그대로 둔다 (업로드 자체는 성공시킨다).
 *
 * @param {string} filePath - 디스크에 저장된 이미지 경로
 * @param {string} mimeType
 * @returns {Promise<void>}
 */
async function stripImageMetadata(filePath, mimeType) {
  if (!EXIF_STRIPPABLE_MIME.has(mimeType)) return;
  const format = SHARP_FORMAT_BY_MIME[mimeType];
  if (!format) return;

  try {
    const buffer = await fsp.readFile(filePath);
    const cleaned = await sharp(buffer).rotate().toFormat(format).toBuffer();
    await fsp.writeFile(filePath, cleaned);
  } catch (err) {
    logger.warn({ filePath, mimeType, errMsg: err.message }, "[Media] EXIF strip 실패 — 원본 유지");
  }
}

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

// 허용 파일 확장자
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4|webm)$/i;

// 스토리지 경로 설정
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const MEDIA_DIR = path.join(STORAGE_PATH, "uploads", "media");

// 미디어 디렉토리 생성
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

// 폴더명 검증 — 경로 탐색 공격 방지
function sanitizeFolder(folder) {
  return (folder || "general")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
    .slice(0, 50) || "general";
}

// Multer 디스크 스토리지 설정 (대상 디렉토리 생성은 비동기 fs API 사용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = sanitizeFolder(req.body.folder);
    const dir = path.join(MEDIA_DIR, folder);
    fsp.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `media-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTENSIONS.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("지원하지 않는 파일 형식입니다"));
    }
  },
});

// GET /api/media/folders — 폴더 목록 (고유값)
router.get("/folders", async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ folder: mediaFiles.folder })
      .from(mediaFiles)
      .orderBy(mediaFiles.folder);

    const folders = rows.map((r) => r.folder);
    res.json({ data: folders, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/media — 파일 목록 (페이지네이션, 필터)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;

    const folder = req.query.folder || null;
    const type = req.query.type || null;
    const search = req.query.search || null;

    const conditions = [];
    if (folder) conditions.push(eq(mediaFiles.folder, folder));
    if (type === "image") conditions.push(like(mediaFiles.mimeType, "image/%"));
    if (type === "video") conditions.push(like(mediaFiles.mimeType, "video/%"));
    if (type === "document") conditions.push(like(mediaFiles.mimeType, "application/%"));
    if (search) {
      const { escapeLike } = require("../lib/sanitize");
      conditions.push(like(mediaFiles.originalName, `%${escapeLike(search)}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(mediaFiles)
      .where(where);

    const rows = await db
      .select()
      .from(mediaFiles)
      .where(where)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows,
      error: null,
      meta: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/media/:id — 단일 파일 상세
router.get("/:id", async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [row] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!row) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    res.json({ data: row, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/upload — 단일 파일 업로드
router.post("/upload", adminAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const url = `/uploads/media/${folder}/${req.file.filename}`;

    // 이미지 EXIF/메타데이터 strip (GPS, 카메라 정보, 작성자 등 PII 제거).
    // 실패해도 업로드는 계속 진행한다.
    await stripImageMetadata(req.file.path, req.file.mimetype);
    // strip 결과 파일 크기가 변할 수 있으므로 stat으로 다시 확인.
    let finalSize = req.file.size;
    try {
      const stat = await fsp.stat(req.file.path);
      finalSize = stat.size;
    } catch (_e) { /* stat 실패 시 multer 보고값 사용 */ }

    const [record] = await db
      .insert(mediaFiles)
      .values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: finalSize,
        url,
        alt: req.body.alt || null,
        folder,
        uploadedBy: req.body.uploadedBy || "admin",
      })
      .returning();

    res.status(201).json({ data: record, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/upload-multiple — 다중 파일 업로드 (최대 10개)
router.post("/upload-multiple", adminAuth, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const records = [];

    for (const file of req.files) {
      const url = `/uploads/media/${folder}/${file.filename}`;

      // 이미지 EXIF/메타데이터 strip (단일 업로드와 동일 정책).
      await stripImageMetadata(file.path, file.mimetype);
      let finalSize = file.size;
      try {
        const stat = await fsp.stat(file.path);
        finalSize = stat.size;
      } catch (_e) { /* stat 실패 시 multer 보고값 사용 */ }

      const [record] = await db
        .insert(mediaFiles)
        .values({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: finalSize,
          url,
          alt: req.body.alt || null,
          folder,
          uploadedBy: req.body.uploadedBy || "admin",
        })
        .returning();

      records.push(record);
    }

    res.status(201).json({ data: records, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /api/media/:id — 메타데이터 수정 (alt, folder)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    const updates = {};
    if (req.body.alt !== undefined) updates.alt = req.body.alt;

    // 폴더 변경 시 물리적 파일 이동
    if (req.body.folder && req.body.folder !== existing.folder) {
      const newFolder = sanitizeFolder(req.body.folder);
      const oldPath = path.join(MEDIA_DIR, existing.folder, existing.filename);
      const newDir = path.join(MEDIA_DIR, newFolder);
      const newPath = path.join(newDir, existing.filename);

      await fsp.mkdir(newDir, { recursive: true });
      // 원본 파일이 없을 수 있으므로 존재 여부와 무관하게 예외만 안전 처리
      try {
        await fsp.rename(oldPath, newPath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }

      updates.folder = newFolder;
      updates.url = `/uploads/media/${newFolder}/${existing.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ data: existing, error: null, meta: null });
    }

    const [updated] = await db
      .update(mediaFiles)
      .set(updates)
      .where(eq(mediaFiles.id, req.params.id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/media/:id — 파일 삭제 (DB + 물리적 파일)
//
// 순서: DB 삭제 → 파일 삭제.
//   DB가 단일 트랜잭션 단위이고 재시도가 안전하므로 먼저 처리한다.
//   파일 삭제가 실패해도 DB 레코드가 사라진 후이므로 사용자 가시성에는 영향이 없고,
//   고아 파일은 별도 청소 작업으로 회수 가능하다 (재시도 시 ENOENT로 무시됨).
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    // 1) DB 레코드 삭제 — 실패 시 클라이언트에 500을 반환하고 파일은 그대로 둔다(재시도 가능).
    await db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    // 2) 물리적 파일 삭제 — 실패해도 사용자 응답에는 영향 없음. 경고만 남기고 진행.
    const filePath = path.join(MEDIA_DIR, existing.folder, existing.filename);
    try {
      await fsp.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        logger.warn({ filePath, errCode: err.code }, "[Media] 파일 삭제 실패 (DB는 정리됨, 고아 파일)");
      }
    }

    res.json({ data: { id: req.params.id }, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
