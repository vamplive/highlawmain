/**
 * 사건 기록 API 라우트 — 전자소송 스타일 PDF 문서 관리.
 *
 * 엔드포인트:
 *   - GET    /api/case-records/admin/cases/:caseId/documents
 *   - POST   /api/case-records/admin/cases/:caseId/documents       (multipart/form-data)
 *   - PATCH  /api/case-records/admin/documents/:documentId
 *   - DELETE /api/case-records/admin/documents/:documentId
 *   - GET    /api/case-records/portal/cases/:caseId/documents      (의뢰인 본인 사건만)
 *   - GET    /api/case-records/portal/documents/:documentId        (단일 문서 메타데이터)
 *
 * 디스크 스토리지: STORAGE_PATH/uploads/case-records/{caseFileId}/{uuid}.pdf
 * 정적 서빙은 backend/index.js 의 /uploads 핸들러가 담당한다.
 */
const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const multer = require("multer");

const { adminAuth, portalAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const caseRecordsService = require("../services/case-records-service");
const logger = require("../lib/logger");

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// 디스크 스토리지 설정 — 사건별 폴더 분리로 권한 경계와 백업 단위를 명확히 한다.
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const RECORDS_DIR = path.join(STORAGE_PATH, "uploads", "case-records");
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EXTS = /\.(pdf|jpg|jpeg|png|hwp|hwpx|docx|doc|xlsx|xls|zip)$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB — 전자소송 첨부 한도와 동일 수준

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // caseId 가 URL param 으로 전달되므로 multer 에선 req.params 로 접근 가능
    const caseId = req.params.caseId;
    if (!caseId || !UUID_REGEX.test(caseId)) {
      return cb(new Error("유효하지 않은 사건 ID 입니다"));
    }
    const dir = path.join(RECORDS_DIR, caseId);
    fsp.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTS.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("지원하지 않는 파일 형식입니다 (pdf/이미지/한글/워드/엑셀/zip)"));
    }
  },
});

/** 디스크에 저장된 url(상대 경로) 로부터 실제 파일 경로 복원 */
function resolveDiskPath(url) {
  // url 은 /uploads/case-records/{caseId}/{uuid}.pdf 형태
  if (!url || !url.startsWith("/uploads/")) return null;
  const rel = url.replace(/^\/uploads\//, "");
  return path.join(STORAGE_PATH, "uploads", rel);
}

// ============================================================================
// 관리자 엔드포인트
// ============================================================================

/** GET /api/case-records/admin/cases/:caseId/documents — 사건 문서 전체 (비공개 포함) */
router.get("/admin/cases/:caseId/documents", adminAuth, async (req, res) => {
  try {
    const docs = await caseRecordsService.listAdminDocuments(req.params.caseId);
    res.json({ data: docs, error: null, meta: { total: docs.length } });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/case-records/admin/cases/:caseId/documents
 * multipart/form-data 로 file + 메타데이터를 한 번에 업로드한다.
 * 메타데이터 필드: documentType, submitter, submissionDate(YYYY-MM-DD),
 *               description, isVisibleToClient (기본 1)
 */
router.post(
  "/admin/cases/:caseId/documents",
  adminAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ data: null, error: "파일이 누락되었습니다", meta: null });
      }

      const caseId = req.params.caseId;
      const url = `/uploads/case-records/${caseId}/${req.file.filename}`;

      const inserted = await caseRecordsService.createAdminDocument({
        caseFileId: caseId,
        filename: req.file.filename,
        url,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        documentType: req.body.documentType,
        submitter: req.body.submitter,
        submissionDate: req.body.submissionDate,
        description: req.body.description,
        isVisibleToClient: req.body.isVisibleToClient === "0" ? 0 : 1,
        uploadedBy: req.adminUser?.userId || "admin",
      });

      res.json({ data: inserted, error: null, meta: null });
    } catch (e) {
      // DB 등록 실패 시 디스크에 남은 파일을 정리한다.
      if (req.file?.path) {
        fsp.unlink(req.file.path).catch(() => {});
      }
      handleError(res, e);
    }
  }
);

/** PATCH /api/case-records/admin/documents/:documentId — 메타데이터 수정 */
router.patch("/admin/documents/:documentId", adminAuth, async (req, res) => {
  try {
    const updated = await caseRecordsService.updateAdminDocument(req.params.documentId, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/case-records/admin/documents/:documentId — 문서 삭제 (디스크 + DB) */
router.delete("/admin/documents/:documentId", adminAuth, async (req, res) => {
  try {
    const removed = await caseRecordsService.deleteAdminDocument(req.params.documentId);
    // 디스크 파일 best-effort 삭제. 실패해도 DB 레코드는 이미 제거됐으므로 사용자에게는 성공 응답.
    const diskPath = resolveDiskPath(removed.url);
    if (diskPath) {
      fsp.unlink(diskPath).catch((err) => {
        logger.warn({ diskPath, errMsg: err.message }, "[case-records] 디스크 파일 삭제 실패");
      });
    }
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ============================================================================
// 의뢰인 포털 엔드포인트 — portalAuth + 사건 소유권 검증
// ============================================================================

/** GET /api/case-records/portal/cases/:caseId/documents — 본인 사건의 공개 문서 */
router.get("/portal/cases/:caseId/documents", portalAuth, async (req, res) => {
  try {
    const { caseFile, documents } = await caseRecordsService.listClientDocuments(
      req.params.caseId,
      req.portalUser.clientId
    );
    res.json({
      data: { caseFile, documents },
      error: null,
      meta: { total: documents.length },
    });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/case-records/portal/documents/:documentId — 단일 문서 메타데이터 */
router.get("/portal/documents/:documentId", portalAuth, async (req, res) => {
  try {
    const doc = await caseRecordsService.getClientDocument(
      req.params.documentId,
      req.portalUser.clientId
    );
    res.json({ data: doc, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
