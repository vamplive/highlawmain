/**
 * 의뢰인/직원 포털 API 라우트
 *
 * 공개:   /register, /login
 * 포털:   /logout, /me, /cases, /cases/:id, /messages
 *         /cases/register (사건 직접 등록)
 *         /time-entries/* (타임트래킹)
 *         /google/* (구글 캘린더 OAuth2)
 * 관리자: /admin/users (포털 사용자 승인)
 *         /admin/cases (사건 관리)
 *         /admin/time-entries (전체 타임트래킹 조회)
 */
const { Router } = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { decodeMultipartFilename } = require("../lib/decode-filename");
const {
  portalAuth,
  adminAuth,
  setPortalSessionCookie,
  clearPortalSessionCookie,
  extractPortalToken,
  getPortalSession,
} = require("../lib/auth");
const portalService = require("../services/portal-service");
const googleCalendarOAuth = require("../lib/google-calendar-oauth");
const { logSecurityEvent } = require("../lib/audit-log");
const { handleError } = require("../lib/route-handler");
const notif = require("../lib/notifications");
const { db: msgDb, sqlite } = require("../db");
const { messageTemplates, messageLogs } = require("../db/schema");
const { sendSMS: sendSMSFn } = require("../lib/sms-service");
const { sendFriendTalk: sendFriendTalkFn } = require("../lib/kakao-friendtalk-service");
const portalScheduleService = require("../services/schedule-service");
const { eq: deq, desc: ddesc, sql: dsql, and: dand } = require("drizzle-orm");
const { cleanPhone: cleanPhoneFn } = require("../services/helpers");

const router = Router();

// 내부 구성원만 접근 가능
// clientId가 null이거나, lawyers/admin_users 테이블에 등록된 이메일이면 통과
function internalOnly(req, res, next) {
  if (!req.portalUser.clientId) return next();
  const email = req.portalUser.email;
  if (portalService.checkIsLawyer(email)) return next();
  if (portalService.checkIsAdminByEmail(email)) return next();
  return res.status(403).json({ data: null, error: "내부 구성원만 이용할 수 있습니다", meta: null });
}

// =============================================
// 사진 업로드 multer 설정 (포털 변호사 프로필)
// =============================================
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const LAWYERS_PHOTO_DIR = path.join(STORAGE_PATH, "uploads", "lawyers");

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(LAWYERS_PHOTO_DIR, { recursive: true });
    cb(null, LAWYERS_PHOTO_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `lawyer-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일(JPG·PNG·WebP)만 업로드할 수 있습니다"), false);
    }
  },
});

// =============================================
// 게시판 첨부파일 업로드 multer 설정
// =============================================
const BOARD_ATTACH_DIR = path.join(STORAGE_PATH, "uploads", "board");

const boardAttachStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(BOARD_ATTACH_DIR, { recursive: true });
    cb(null, BOARD_ATTACH_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `board-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

// 허용 확장자: 이미지 + 오피스 + PDF
const ALLOWED_BOARD_MIME = /^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-excel|vnd\.ms-powerpoint|zip|x-zip-compressed)|text\/(plain|csv)|application\/haansofthwp)$/;

const boardAttachUpload = multer({
  storage: boardAttachStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB per file
  fileFilter: (_req, file, cb) => {
    // HWP, HWPX, DOCX, PDF 등 허용
    if (ALLOWED_BOARD_MIME.test(file.mimetype) || /\.(hwp|hwpx|docx?|xlsx?|pptx?|pdf|txt|csv|zip)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("허용되지 않는 파일 형식입니다"), false);
    }
  },
});

// =============================================
// 공개 엔드포인트
// =============================================

/** POST /api/portal/register — 포털 회원가입 (승인 대기) */
router.post("/register", async (req, res) => {
  try {
    const result = await portalService.registerUser(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/login — 이메일 또는 전화번호 + 비밀번호 */
router.post("/login", async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = identifier || email; // 신규: identifier, 하위호환: email
    const result = await portalService.loginUser(loginId, password);
    setPortalSessionCookie(res, result.token);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    if (e?.name === "ServiceError" && (e.status === 401 || e.status === 403)) {
      const subtype = e.status === 403 ? "inactive" : "invalid";
      logSecurityEvent(req, `portal_login_fail.${subtype}`, { attemptedEmail: req.body?.identifier || req.body?.email });
    }
    handleError(res, e);
  }
});

/**
 * GET /api/portal/auto-login?token=xxx&redirect=/portal/dashboard
 * Electron 메신저 앱 → 브라우저 포털 자동 로그인
 * 토큰이 유효하면 세션 쿠키를 설정하고 리다이렉트
 */
router.get("/auto-login", (req, res) => {
  const { token, redirect } = req.query;
  const session = token ? getPortalSession(token) : null;
  if (!session) {
    return res.redirect("/login?error=session_expired");
  }
  setPortalSessionCookie(res, token);
  const safePath = typeof redirect === "string" && /^\/portal\//.test(redirect)
    ? redirect
    : "/portal/dashboard";
  res.redirect(safePath);
});

/** POST /api/portal/find-id — 휴대폰 번호로 이메일(아이디) 찾기 */
router.post("/find-id", async (req, res) => {
  try {
    const result = await portalService.findEmailByPhone(req.body?.phone);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/change-password — 로그인 상태에서 비밀번호 변경 */
router.post("/change-password", portalAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ data: null, error: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요", meta: null });
    }
    const result = await portalService.changePortalPassword(req.portalUser.id, currentPassword, newPassword);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/board/upload-image — 게시판 에디터 인라인 이미지 업로드 */
router.post("/board/upload-image", portalAuth, (req, res) => {
  boardAttachUpload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ data: null, error: err.message, meta: null });
    if (!req.file) return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    res.json({ data: { url: `/uploads/board/${req.file.filename}` }, error: null, meta: null });
  });
});

/** POST /api/portal/board/upload-attachments — 게시판 첨부파일 (최대 10개) */
router.post("/board/upload-attachments", portalAuth, (req, res) => {
  boardAttachUpload.array("files", 10)(req, res, (err) => {
    if (err) return res.status(400).json({ data: null, error: err.message, meta: null });
    const files = (req.files || []).map((f) => ({
      name: decodeMultipartFilename(f.originalname),
      url: `/uploads/board/${f.filename}`,
      size: f.size,
      mime: f.mimetype,
    }));
    res.json({ data: { files }, error: null, meta: null });
  });
});

/** POST /api/portal/forgot-password — 비밀번호 재설정 링크 이메일 발송 */
router.post("/forgot-password", async (req, res) => {
  try {
    const result = await portalService.createPortalResetToken(req.body?.input);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/reset-password — 토큰 검증 후 비밀번호 재설정 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    const result = await portalService.resetPortalPassword(token, password);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/logout */
router.post("/logout", portalAuth, (req, res) => {
  portalService.logoutUser(extractPortalToken(req));
  clearPortalSessionCookie(res);
  res.json({ data: { message: "로그아웃 되었습니다" }, error: null, meta: null });
});

// =============================================
// 포털 인증 필요 엔드포인트
// =============================================

/** GET /api/portal/me */
router.get("/me", portalAuth, async (req, res) => {
  try {
    const { userId, clientId } = req.portalUser;
    const result = await portalService.getUserProfile(userId, clientId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/upload-photo — 포털 사용자 프로필 사진 업로드 */
router.post("/upload-photo", portalAuth, (req, res) => {
  photoUpload.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ data: null, error: err.message, meta: null });
    }
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    }
    const url = `/uploads/lawyers/${req.file.filename}`;
    res.json({ data: { url }, error: null, meta: null });
  });
});

// =============================================
// 결재 영수증 업로드 multer 설정 (이미지 + PDF, 최대 10MB)
// =============================================
const RECEIPT_DIR = path.join(STORAGE_PATH, "uploads", "receipts");

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(RECEIPT_DIR, { recursive: true });
    cb(null, RECEIPT_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `receipt-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("이미지(JPG·PNG·WebP·GIF) 또는 PDF 파일만 업로드 가능합니다"), false);
    }
  },
});

/** POST /api/portal/upload-receipt — 결재 영수증 파일 업로드 (단일) */
router.post("/upload-receipt", portalAuth, (req, res) => {
  receiptUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ data: null, error: err.message, meta: null });
    }
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    }
    const url = `/uploads/receipts/${req.file.filename}`;
    res.json({ data: { url }, error: null, meta: null });
  });
});

/** GET /api/portal/receipts — 내 의뢰인 영수증 목록 */
router.get("/receipts", portalAuth, (req, res) => {
  try {
    const { clientId } = req.portalUser;
    const rows = sqlite.prepare(
      `SELECT id, vendor, amount, paid_at, notes, file_name, ocr_status,
              created_at, updated_at, portal_user_id
       FROM receipts
       WHERE client_id = ? AND portal_user_id IS NOT NULL
       ORDER BY created_at DESC`
    ).all(clientId);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/receipts — 영수증 등록 (파일 업로드 + DB 저장) */
router.post("/receipts", portalAuth, (req, res) => {
  receiptUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ data: null, error: err.message, meta: null });
    }
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    }
    try {
      const { clientId, userId } = req.portalUser;
      const { vendor = "", amount, paid_at = "", notes = "" } = req.body;
      const id = crypto.randomUUID();
      const filePath = req.file.path;
      const fileName = decodeMultipartFilename(req.file.originalname);
      const now = new Date().toISOString();
      sqlite.prepare(
        `INSERT INTO receipts
           (id, file_path, file_name, mime_type, file_size, vendor, amount,
            paid_at, notes, ocr_status, portal_user_id, client_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
      ).run(
        id, filePath, fileName,
        req.file.mimetype, req.file.size,
        vendor || null,
        amount ? Number(amount) : null,
        paid_at || null,
        notes || null,
        userId, clientId,
        now, now
      );
      const row = sqlite.prepare("SELECT * FROM receipts WHERE id = ?").get(id);
      res.status(201).json({ data: row, error: null, meta: null });
    } catch (e) {
      handleError(res, e);
    }
  });
});

/** DELETE /api/portal/receipts/:id — 내 영수증 삭제 (본인 업로드만) */
router.delete("/receipts/:id", portalAuth, (req, res) => {
  try {
    const { clientId, userId } = req.portalUser;
    const row = sqlite.prepare(
      "SELECT * FROM receipts WHERE id = ? AND client_id = ? AND portal_user_id = ?"
    ).get(req.params.id, clientId, userId);
    if (!row) {
      return res.status(404).json({ data: null, error: "영수증을 찾을 수 없습니다", meta: null });
    }
    sqlite.prepare("DELETE FROM receipts WHERE id = ?").run(req.params.id);
    if (row.file_path) {
      fs.unlink(row.file_path, () => {});
    }
    res.json({ data: { id: req.params.id }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/cases — 내 사건 목록 */
router.get("/cases", portalAuth, async (req, res) => {
  try {
    const rows = await portalService.getUserCases(req.portalUser.clientId);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/cases — 포털 사용자 직접 사건 등록 */
router.post("/cases", portalAuth, async (req, res) => {
  try {
    const { clientId } = req.portalUser;
    const result = await portalService.registerPortalCase(clientId, req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/cases/:id */
router.get("/cases/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.getCaseDetail(req.params.id, req.portalUser.clientId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/cases/:id/messages */
router.get("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.getCaseMessages(
      req.params.id,
      req.portalUser.clientId,
      req.query,
    );
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/cases/:id/messages */
router.post("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { clientId, userId } = req.portalUser;
    const result = await portalService.sendClientMessage(
      req.params.id,
      clientId,
      userId,
      req.body.content,
    );
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 타임트래킹 (포털 사용자)
// =============================================

/** GET /api/portal/time-entries — 내 타임엔트리 목록 */
router.get("/time-entries", portalAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listPortalTimeEntries(req.portalUser.userId, req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/time-entries/summary — 사건별 시간 합계 */
router.get("/time-entries/summary", portalAuth, async (req, res) => {
  try {
    const data = await portalService.getPortalTimeSummary(req.portalUser.userId);
    res.json({ data, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/time-entries/active — 진행 중 타이머 */
router.get("/time-entries/active", portalAuth, async (req, res) => {
  try {
    const data = await portalService.getActivePortalTimer(req.portalUser.userId);
    res.json({ data, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/time-entries — 수동 입력 */
router.post("/time-entries", portalAuth, async (req, res) => {
  try {
    const row = await portalService.createPortalTimeEntry(req.portalUser.userId, req.body);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/time-entries/timer/start */
router.post("/time-entries/timer/start", portalAuth, async (req, res) => {
  try {
    const row = await portalService.startPortalTimer(req.portalUser.userId, req.body);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/time-entries/timer/stop */
router.post("/time-entries/timer/stop", portalAuth, async (req, res) => {
  try {
    const row = await portalService.stopPortalTimer(req.portalUser.userId);
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PUT /api/portal/time-entries/:id */
router.put("/time-entries/:id", portalAuth, async (req, res) => {
  try {
    const row = await portalService.updatePortalTimeEntry(req.params.id, req.portalUser.userId, req.body);
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/portal/time-entries/:id */
router.delete("/time-entries/:id", portalAuth, async (req, res) => {
  try {
    await portalService.deletePortalTimeEntry(req.params.id, req.portalUser.userId);
    res.status(204).end();
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 구글 캘린더 OAuth2 (포털 사용자 개인 캘린더)
// =============================================

/** GET /api/portal/google/auth-url — OAuth2 인증 URL 반환 */
router.get("/google/auth-url", portalAuth, (req, res) => {
  if (!googleCalendarOAuth.isConfigured()) {
    return res.json({
      data: { configured: false, message: "구글 캘린더 연동이 설정되지 않았습니다" },
      error: null,
      meta: null,
    });
  }
  // state에 userId를 담아 callback에서 검증
  const stateToken = `${req.portalUser.userId}:${crypto.randomBytes(16).toString("hex")}`;
  const authUrl = googleCalendarOAuth.getAuthUrl(stateToken);
  res.json({ data: { authUrl, configured: true }, error: null, meta: null });
});

/**
 * GET /api/portal/google/callback — OAuth2 콜백
 * 구글이 code와 state를 쿼리파라미터로 돌려보낸다.
 * 이 엔드포인트는 리디렉트를 받으므로 portalAuth 미들웨어 없이 state에서 userId 추출.
 */
router.get("/google/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

  if (oauthError) {
    return res.redirect(`${appUrl}/portal/dashboard?googleError=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return res.redirect(`${appUrl}/portal/dashboard?googleError=invalid_callback`);
  }

  try {
    // state에서 userId 추출 (형식: "userId:randomHex")
    const [userId] = state.split(":");
    if (!userId) throw new Error("잘못된 state 파라미터");

    const tokens = await googleCalendarOAuth.exchangeCodeForTokens(code);
    await portalService.saveGoogleTokens(userId, tokens);

    res.redirect(`${appUrl}/portal/dashboard?googleConnected=1`);
  } catch (e) {
    console.warn("[portal/google/callback] 토큰 교환 실패:", e.message);
    res.redirect(`${appUrl}/portal/dashboard?googleError=token_exchange_failed`);
  }
});

/** POST /api/portal/google/sync-case/:caseId — 사건을 구글 캘린더에 추가 */
router.post("/google/sync-case/:caseId", portalAuth, async (req, res) => {
  try {
    const { userId, clientId } = req.portalUser;

    // 소유권 검증
    const cases = await portalService.getUserCases(clientId);
    const targetCase = cases.find((c) => c.id === req.params.caseId);
    if (!targetCase) throw new Error("사건을 찾을 수 없습니다");

    const tokenData = await portalService.getGoogleTokens(userId);
    if (!tokenData?.googleRefreshToken) {
      return res.status(400).json({ data: null, error: "구글 캘린더 연동이 필요합니다", meta: null });
    }

    const { accessToken, refreshed, newExpiry } = await googleCalendarOAuth.getValidAccessToken(tokenData);
    if (refreshed) {
      await portalService.saveGoogleTokens(userId, {
        accessToken,
        refreshToken: tokenData.googleRefreshToken,
        expiresAt: newExpiry,
      });
    }

    const event = await googleCalendarOAuth.createCaseEvent(accessToken, {
      summary: `[하이로] ${targetCase.title}`,
      description: [
        targetCase.caseNumber && `사건번호: ${targetCase.caseNumber}`,
        targetCase.court && `법원: ${targetCase.court}`,
        targetCase.caseType && `유형: ${targetCase.caseType}`,
        targetCase.plaintiff && `원고: ${targetCase.plaintiff}`,
        targetCase.defendant && `피고: ${targetCase.defendant}`,
      ].filter(Boolean).join("\n"),
      date: targetCase.filedAt || targetCase.createdAt,
    });

    res.json({ data: event, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/portal/google/disconnect — 구글 캘린더 연결 해제 */
router.delete("/google/disconnect", portalAuth, async (req, res) => {
  try {
    const result = await portalService.disconnectGoogle(req.portalUser.userId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 관리자 엔드포인트 — 포털 사용자 관리
// =============================================

/** GET /api/portal/admin/users — 포털 사용자 목록 (상태별 필터 가능) */
router.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listPortalUsers(req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/admin/users/:id — 포털 사용자 단건 */
router.get("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const row = await portalService.getPortalUser(req.params.id);
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/users/:id/approve — 승인 */
router.post("/admin/users/:id/approve", adminAuth, async (req, res) => {
  try {
    const result = await portalService.approvePortalUser(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/users/:id/reject — 거절 */
router.post("/admin/users/:id/reject", adminAuth, async (req, res) => {
  try {
    const result = await portalService.rejectPortalUser(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/portal/admin/users/:id — 삭제 */
router.delete("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.deletePortalUser(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PATCH /api/portal/admin/users/:id — 구성원 역할(role) 등 필드 수정 */
router.patch("/admin/users/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.updatePortalUser(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 관리자 엔드포인트 — 사건 관리
// =============================================

/** GET /api/portal/admin/cases */
router.get("/admin/cases", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminCases(req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/cases */
router.post("/admin/cases", adminAuth, async (req, res) => {
  try {
    const result = await portalService.createAdminCase(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/admin/cases/:id */
router.get("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.getAdminCase(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PATCH /api/portal/admin/cases/:id */
router.patch("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.updateAdminCase(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/portal/admin/cases/:id */
router.delete("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.deleteAdminCase(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/admin/cases/:id/messages */
router.get("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminCaseMessages(req.params.id, req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/cases/:id/messages */
router.post("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const result = await portalService.sendLawyerMessage(req.params.id, req.body.content);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 관리자 엔드포인트 — 타임트래킹 전체 조회
// =============================================

/** GET /api/portal/admin/time-entries — 일자별/사건별/직원별 필터 */
router.get("/admin/time-entries", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminPortalTimeEntries(req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 포털 내부 게시판
// =============================================

router.get("/posts", portalAuth, async (req, res) => {
  try {
    const result = await portalService.listPortalPosts(req.query);
    res.json(result);
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/posts", portalAuth, async (req, res) => {
  try {
    const result = await portalService.createPortalPost(req.portalUser.userId, req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/posts/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.getPortalPost(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.put("/posts/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    const result = await portalService.updatePortalPost(req.params.id, req.portalUser.userId, isAdmin, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/posts/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    const result = await portalService.deletePortalPost(req.params.id, req.portalUser.userId, isAdmin);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 포털 일정 (캘린더)
// =============================================

router.get("/events", portalAuth, async (req, res) => {
  try {
    const rows = await portalService.listPortalEvents(req.portalUser.userId);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/events", portalAuth, async (req, res) => {
  try {
    const result = await portalService.createPortalEvent(req.portalUser.userId, req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.put("/events/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.updatePortalEvent(req.params.id, req.portalUser.userId, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/events/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.deletePortalEvent(req.params.id, req.portalUser.userId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 포털 변호사 프로필 설정 및 어드민 기능
// =============================================

router.get("/lawyers/my-profile", portalAuth, async (req, res) => {
  try {
    const profile = await portalService.getLawyerProfileByEmail(req.portalUser.email);
    res.json({ data: profile, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/lawyers/my-profile", portalAuth, async (req, res) => {
  try {
    const result = await portalService.createLawyerProfile(req.portalUser.email, req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.put("/lawyers/my-profile", portalAuth, async (req, res) => {
  try {
    const profile = await portalService.getLawyerProfileByEmail(req.portalUser.email);
    if (!profile) return res.status(404).json({ data: null, error: "프로필이 존재하지 않습니다", meta: null });
    const result = await portalService.updateLawyerProfile(profile.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/lawyers/admin/check", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    res.json({ data: { isAdmin }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/lawyers/admin/list", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const list = await portalService.listAllLawyers();
    res.json({ data: list, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/lawyers/admin/create", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.createLawyerProfile(req.body.email || "", req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.put("/lawyers/admin/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.updateLawyerProfile(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/lawyers/admin/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.deleteLawyerProfile(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/lawyers/admin/reorder", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.reorderLawyerProfiles(req.body.id1, req.body.id2);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 조직도 — 모든 포털 사용자 접근 가능
// =============================================

router.get("/org-chart", portalAuth, async (req, res) => {
  try {
    const list = await portalService.listLawyersForOrgChart();
    res.json({ data: list, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 알림 (Notifications)
// =============================================

router.get("/notifications", portalAuth, (req, res) => {
  try {
    const { userId } = req.portalUser;
    const userType = req.portalUser.userType || "portal";
    const notifications = notif.list(userId, userType);
    const count = notif.unreadCount(userId, userType);
    res.json({ data: { notifications, unreadCount: count }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/notifications/read-all", portalAuth, (req, res) => {
  try {
    const { userId } = req.portalUser;
    notif.markAll(userId, req.portalUser.userType || "portal");
    res.json({ data: { ok: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/notifications/:id/read", portalAuth, (req, res) => {
  try {
    notif.markOne(req.params.id);
    res.json({ data: { ok: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 게시판 카테고리
// =============================================

router.get("/board-categories", portalAuth, async (req, res) => {
  try {
    const list = await portalService.listBoardCategories();
    res.json({ data: list, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/board-categories", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.createBoardCategory(req.portalUser.userId, req.body);
    res.status(201).json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.put("/board-categories/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.updateBoardCategory(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/board-categories/:id", portalAuth, async (req, res) => {
  try {
    const isAdmin = await portalService.checkIsAdmin(req.portalUser.email);
    if (!isAdmin) return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    const result = await portalService.deleteBoardCategory(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 구성원 미팅 예약 (전체 구성원 이용 가능)
// =============================================

router.get("/members", portalAuth, async (req, res) => {
  try {
    const members = portalService.listPortalMembers();
    res.json({ data: members, myId: req.portalUser.userId, error: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/bookings", portalAuth, async (req, res) => {
  try {
    const bookings = portalService.listMemberBookings(req.portalUser.userId);
    res.json({ data: bookings, myId: req.portalUser.userId, error: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/bookings", portalAuth, async (req, res) => {
  try {
    const booking = portalService.createMemberBooking(req.portalUser.userId, req.body);
    res.status(201).json({ data: booking, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/bookings/:id/cancel", portalAuth, async (req, res) => {
  try {
    const result = portalService.cancelMemberBooking(req.params.id, req.portalUser.userId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 고객 관리 (내부 구성원 전용)
// =============================================

router.get("/clients", portalAuth, async (req, res) => {
  try {
    const result = await portalService.listPortalClients(req.query);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/clients", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.createPortalClient(req.body);
    res.status(201).json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.patch("/clients/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.updatePortalClient(req.params.id, req.body);
    res.json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/clients/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const result = await portalService.deletePortalClient(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/clients/:clientId/cases", portalAuth, internalOnly, async (req, res) => {
  try {
    const rows = await portalService.listClientCases(req.params.clientId);
    res.json({ data: { data: rows }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/clients/:clientId/cases", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.createClientCase(req.params.clientId, req.body);
    res.status(201).json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.patch("/clients/:clientId/cases/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.updateClientCase(req.params.clientId, req.params.id, req.body);
    res.json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/clients/:clientId/cases/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const result = await portalService.deleteClientCase(req.params.clientId, req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/clients/:clientId/persons", portalAuth, internalOnly, async (req, res) => {
  try {
    const rows = await portalService.listClientPersons(req.params.clientId);
    res.json({ data: { data: rows }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.post("/clients/:clientId/persons", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.createClientPerson(req.params.clientId, req.body);
    res.status(201).json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.patch("/clients/:clientId/persons/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const item = await portalService.updateClientPerson(req.params.clientId, req.params.id, req.body);
    res.json({ data: { data: item }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/clients/:clientId/persons/:id", portalAuth, internalOnly, async (req, res) => {
  try {
    const result = await portalService.deleteClientPerson(req.params.clientId, req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});


// =============================================
// 포털 메시지 발송 (SMS / 카카오 / 예약 / 이력)
// =============================================
const MSG_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/sms/templates', portalAuth, async (req, res) => {
  try {
    const rows = await msgDb.select().from(messageTemplates)
      .where(deq(messageTemplates.channel, 'sms')).orderBy(messageTemplates.sortOrder);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post('/sms/templates', portalAuth, async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name?.trim() || !content?.trim())
      return res.status(400).json({ data: null, error: '이름과 내용은 필수입니다', meta: null });
    const [inserted] = await msgDb.insert(messageTemplates)
      .values({ name: name.trim(), channel: 'sms', content: content.trim(), isActive: 1, sortOrder: 0 }).returning();
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.patch('/sms/templates/:id', portalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!MSG_UUID_RE.test(id)) return res.status(400).json({ data: null, error: '유효하지 않은 ID', meta: null });
    const { name, content } = req.body;
    const updateData = { updatedAt: dsql`(datetime('now'))` };
    if (name !== undefined) updateData.name = name.trim();
    if (content !== undefined) updateData.content = content.trim();
    const [updated] = await msgDb.update(messageTemplates).set(updateData).where(deq(messageTemplates.id, id)).returning();
    if (!updated) return res.status(404).json({ data: null, error: '템플릿을 찾을 수 없습니다', meta: null });
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.delete('/sms/templates/:id', portalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!MSG_UUID_RE.test(id)) return res.status(400).json({ data: null, error: '유효하지 않은 ID', meta: null });
    await msgDb.delete(messageTemplates).where(deq(messageTemplates.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post('/sms/send', portalAuth, async (req, res) => {
  try {
    const { recipients, content } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ data: null, error: '수신자를 1명 이상 지정해주세요', meta: null });
    if (!content?.trim())
      return res.status(400).json({ data: null, error: '메시지 내용을 입력해주세요', meta: null });
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const results = [];
    for (const r of recipients) {
      const contact = cleanPhoneFn(String(r.contact || ''));
      const sendResult = await sendSMSFn(contact, content.trim());
      const [log] = await msgDb.insert(messageLogs).values({
        channel: 'sms', recipientName: r.name || null, recipientContact: contact,
        content: content.trim(), status: sendResult.success ? 'sent' : 'failed',
        errorMessage: sendResult.error || null, sentAt: sendResult.success ? now : null,
      }).returning();
      results.push({ recipientContact: contact, success: sendResult.success, error: sendResult.error, logId: log.id });
    }
    const sent = results.filter(r => r.success).length;
    res.json({ data: { total: results.length, sent, failed: results.length - sent, results }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post('/sms/schedule', portalAuth, async (req, res) => {
  try {
    const item = await portalScheduleService.createSchedule({ channel: 'sms', ...(req.body || {}) });
    res.json({ data: item, error: null, meta: null });
  } catch (e) { res.status(e.status || 500).json({ data: null, error: e.message || '서버 오류', meta: null }); }
});

router.get('/sms/scheduled', portalAuth, async (req, res) => {
  try {
    const result = await portalScheduleService.listSchedules(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) { res.status(e.status || 500).json({ data: null, error: e.message || '서버 오류', meta: null }); }
});

router.delete('/sms/scheduled/:id', portalAuth, async (req, res) => {
  try {
    const result = await portalScheduleService.cancelSchedule(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) { res.status(e.status || 500).json({ data: null, error: e.message || '서버 오류', meta: null }); }
});

router.get('/sms/logs', portalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { channel, status } = req.query;
    const conditions = [deq(messageLogs.channel, channel || 'sms')];
    if (status) conditions.push(deq(messageLogs.status, status));
    const whereClause = dand(...conditions);
    const rows = await msgDb.select().from(messageLogs).where(whereClause)
      .orderBy(ddesc(messageLogs.createdAt)).limit(limit).offset((page - 1) * limit);
    const [{ total }] = await msgDb.select({ total: dsql`count(*)` }).from(messageLogs).where(whereClause);
    res.json({ data: rows, error: null, meta: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) } });
  } catch (e) { handleError(res, e); }
});

router.get('/sms/stats', portalAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const fromDate = DATE_RE.test(from) ? from : defaultFrom;
    const toDate = DATE_RE.test(to) ? to : today;
    const rangeCond = dsql`date(${messageLogs.createdAt}) BETWEEN ${fromDate} AND ${toDate}`;
    const [summary] = await msgDb.select({
      total: dsql`count(*)`,
      sent: dsql`sum(case when status='sent' then 1 else 0 end)`,
      failed: dsql`sum(case when status='failed' then 1 else 0 end)`,
      smsSent: dsql`sum(case when channel='sms' and status='sent' then 1 else 0 end)`,
    }).from(messageLogs).where(rangeCond);
    const byChannel = await msgDb.select({
      channel: messageLogs.channel,
      sent: dsql`sum(case when status='sent' then 1 else 0 end)`,
      failed: dsql`sum(case when status='failed' then 1 else 0 end)`,
    }).from(messageLogs).where(rangeCond).groupBy(messageLogs.channel);
    const daily = sqlite.prepare(
      "SELECT date(created_at) as day, channel, sum(case when status='sent' then 1 else 0 end) as sent, " +
      "sum(case when status='failed' then 1 else 0 end) as failed " +
      "FROM message_logs WHERE date(created_at) BETWEEN ? AND ? GROUP BY day, channel ORDER BY day ASC"
    ).all(fromDate, toDate);
    res.json({ data: {
      range: { from: fromDate, to: toDate },
      total: Number(summary.total||0), sent: Number(summary.sent||0), failed: Number(summary.failed||0),
      opened: 0, emailSent: 0, smsSent: Number(summary.smsSent||0), openRate: 0,
      byChannel: byChannel.map(r => ({ channel: r.channel, sent: Number(r.sent||0), failed: Number(r.failed||0), opened: 0 })),
      daily: daily.map(r => ({ day: r.day, channel: r.channel, sent: Number(r.sent||0), failed: Number(r.failed||0), opened: 0 })),
    }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get('/kakao/templates', portalAuth, async (req, res) => {
  try {
    const rows = await msgDb.select().from(messageTemplates)
      .where(deq(messageTemplates.channel, 'kakao')).orderBy(messageTemplates.sortOrder);
    res.json({ data: rows.map(t => ({ ...t, code: t.id })), error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post('/kakao/send', portalAuth, async (req, res) => {
  try {
    const { recipients } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ data: null, error: '수신자를 1명 이상 지정해주세요', meta: null });
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const results = [];
    for (const r of recipients) {
      const contact = cleanPhoneFn(String(r.contact || ''));
      const message = r.message || '';
      const sendResult = await sendFriendTalkFn(contact, message, { name: r.name });
      const [log] = await msgDb.insert(messageLogs).values({
        channel: 'kakao', recipientName: r.name || null, recipientContact: contact,
        content: message, status: sendResult.success ? 'sent' : 'failed',
        errorMessage: sendResult.error || null, sentAt: sendResult.success ? now : null,
      }).returning();
      results.push({ recipientContact: contact, success: sendResult.success, error: sendResult.error, logId: log.id });
    }
    const sent = results.filter(r => r.success).length;
    res.json({ data: { total: results.length, sent, failed: results.length - sent, results }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});


router.get('/me/ical-token', portalAuth, (req, res) => {
  try {
    const user = sqlite.prepare('SELECT id, ical_token FROM portal_users WHERE id = ?').get(req.portalUser.userId);
    let token = user && user.ical_token;
    if (!token) {
      token = require('crypto').randomBytes(32).toString('hex');
      sqlite.prepare('UPDATE portal_users SET ical_token = ? WHERE id = ?').run(token, req.portalUser.userId);
    }
    const icalUrl = 'https://highlaw.co.kr/ical/' + token + '.ics';
    res.json({ data: { token, icalUrl }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});


router.post('/events/:id/share', portalAuth, async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ data: null, error: '공유할 구성원을 선택해주세요', meta: null });
    const src = sqlite.prepare('SELECT * FROM portal_events WHERE id = ?').get(req.params.id);
    if (!src) return res.status(404).json({ data: null, error: '일정을 찾을 수 없습니다', meta: null });
    const { randomUUID } = require('crypto');
    let count = 0;
    for (const uid of userIds) {
      if (uid === req.portalUser.userId) continue;
      const exists = sqlite.prepare(
        "SELECT id FROM portal_events WHERE portal_user_id = ? AND title = ? AND starts_at = ?"
      ).get(uid, src.title, src.starts_at);
      if (!exists) {
        sqlite.prepare(
          "INSERT INTO portal_events (id,portal_user_id,title,description,starts_at,ends_at,is_all_day,color,location,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))"
        ).run(randomUUID(), uid, src.title, src.description, src.starts_at, src.ends_at, src.is_all_day, src.color, src.location);
        count++;
      }
    }
    res.json({ data: { shared: count }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

module.exports = router;
