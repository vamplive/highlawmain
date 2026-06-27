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
const { sqlite } = require("../db");

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
    const { clientId, role } = req.portalUser;
    const { members, departmentId, ...caseData } = req.body;
    const result = await portalService.registerPortalCase(clientId, caseData);
    // 내부 사용자인 경우 담당자/부서 저장
    if (role === "internal" && result?.id) {
      const crypto2 = require("crypto");
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      if (Array.isArray(members)) {
        for (const m of members) {
          const dup = sqlite.prepare("SELECT id FROM case_members WHERE case_id=? AND member_id=?").get(result.id, m.id);
          if (!dup) sqlite.prepare("INSERT INTO case_members (id,case_id,member_type,member_id,member_name,role,created_at) VALUES (?,?,?,?,?,?,?)").run(crypto2.randomUUID(), result.id, "lawyer", m.id, m.name || null, "담당", now);
        }
      }
      if (departmentId) {
        const dept = sqlite.prepare("SELECT name FROM departments WHERE id=?").get(departmentId);
        const dup = sqlite.prepare("SELECT id FROM case_members WHERE case_id=? AND member_id=?").get(result.id, departmentId);
        if (!dup) sqlite.prepare("INSERT INTO case_members (id,case_id,member_type,member_id,member_name,role,created_at) VALUES (?,?,?,?,?,?,?)").run(crypto2.randomUUID(), result.id, "department", departmentId, dept?.name || null, "담당부서", now);
      }
    }
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





/** GET /api/portal/kakao/templates — 승인된 알림톡 템플릿 목록 */
router.get("/kakao/templates", portalAuth, internalOnly, async (req, res) => {
  try {
    const { listKakaoTemplates } = require("../lib/kakao-service");
    const result = await listKakaoTemplates();
    if (!result.ok) return res.status(502).json({ data: null, error: result.error, meta: null });
    res.json({ data: result.templates, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** POST /api/portal/kakao/send — 알림톡 발송 */
router.post("/kakao/send", portalAuth, internalOnly, async (req, res) => {
  try {
    const { sendKakao } = require("../lib/kakao-service");
    const { recipients, templateCode } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ data: null, error: "수신자를 1명 이상 지정해주세요", meta: null });
    if (!templateCode)
      return res.status(400).json({ data: null, error: "템플릿 코드가 필요합니다", meta: null });

    const result = await sendKakao(recipients, templateCode);

    // 발송 이력 기록
    const crypto2 = require("crypto");
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    for (const r of result.results) {
      const logId = crypto2.randomUUID();
      const content = recipients.find(x => x.contact.replace(/\D/g,"") === r.contact.replace(/\D/g,""))?.message || "";
      sqlite.prepare(
        "INSERT INTO message_logs (id,channel,recipient_name,recipient_contact,content,status,error_message,sent_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)"
      ).run(logId, "kakao", r.name || null, r.contact, content,
        r.success ? "sent" : "failed", r.error || null,
        r.success ? now : null, now);
    }

    res.json({ data: { total: result.total, sent: result.sent, failed: result.failed, results: result.results, testMode: result.testMode }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/sms/templates */
router.get("/sms/templates", portalAuth, (req, res) => {
  try {
    const rows = sqlite.prepare(
      "SELECT id, name, channel, subject, content, is_active, sort_order FROM message_templates WHERE is_active=1 ORDER BY sort_order ASC, name ASC"
    ).all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});


/** POST /api/portal/sms/templates — 템플릿 생성 */
router.post("/sms/templates", portalAuth, internalOnly, (req, res) => {
  try {
    const { name, content, subject } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ data: null, error: "이름을 입력해주세요", meta: null });
    if (!content || !content.trim()) return res.status(400).json({ data: null, error: "내용을 입력해주세요", meta: null });
    const crypto2 = require("crypto");
    const id = crypto2.randomUUID();
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const maxOrder = sqlite.prepare("SELECT coalesce(max(sort_order),0) as m FROM message_templates").get().m;
    sqlite.prepare(
      "INSERT INTO message_templates (id,name,channel,subject,content,is_active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?,?)"
    ).run(id, name.trim(), "sms", subject ? subject.trim() : null, content.trim(), Number(maxOrder) + 1, now, now);
    const row = sqlite.prepare("SELECT * FROM message_templates WHERE id=?").get(id);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** PATCH /api/portal/sms/templates/:id — 템플릿 수정 */
router.patch("/sms/templates/:id", portalAuth, internalOnly, (req, res) => {
  try {
    const { id } = req.params;
    const row = sqlite.prepare("SELECT id FROM message_templates WHERE id=?").get(id);
    if (!row) return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    const { name, content, subject } = req.body;
    if (name !== undefined && !name.trim()) return res.status(400).json({ data: null, error: "이름을 입력해주세요", meta: null });
    if (content !== undefined && !content.trim()) return res.status(400).json({ data: null, error: "내용을 입력해주세요", meta: null });
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const fields = []; const vals = [];
    if (name !== undefined) { fields.push("name=?"); vals.push(name.trim()); }
    if (content !== undefined) { fields.push("content=?"); vals.push(content.trim()); }
    if (subject !== undefined) { fields.push("subject=?"); vals.push(subject ? subject.trim() : null); }
    fields.push("updated_at=?"); vals.push(now);
    vals.push(id);
    sqlite.prepare("UPDATE message_templates SET " + fields.join(",") + " WHERE id=?").run(...vals);
    const updated = sqlite.prepare("SELECT * FROM message_templates WHERE id=?").get(id);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** DELETE /api/portal/sms/templates/:id — 템플릿 삭제 */
router.delete("/sms/templates/:id", portalAuth, internalOnly, (req, res) => {
  try {
    const { id } = req.params;
    const row = sqlite.prepare("SELECT id FROM message_templates WHERE id=?").get(id);
    if (!row) return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    sqlite.prepare("DELETE FROM message_templates WHERE id=?").run(id);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** POST /api/portal/sms/send */
router.post("/sms/send", portalAuth, internalOnly, async (req, res) => {
  try {
    const { sendSMS } = require("../lib/sms-service");
    const { recipients, content } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ data: null, error: "수신자를 1명 이상 지정해주세요", meta: null });
    if (!content || !content.trim())
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    const trimmed = content.trim();
    const crypto2 = require("crypto");
    const results = [];
    for (const r of recipients) {
      const result = await sendSMS(r.contact, trimmed);
      const logId = crypto2.randomUUID();
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      sqlite.prepare(
        "INSERT INTO message_logs (id,channel,recipient_name,recipient_contact,content,status,error_message,sent_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)"
      ).run(logId, "sms", r.name || null, r.contact, trimmed,
        result.success ? "sent" : "failed", result.error || null,
        result.success ? now : null, now);
      results.push({ name: r.name, contact: r.contact, success: result.success, error: result.error || null });
    }
    const sent = results.filter(r => r.success).length;
    res.json({ data: { total: results.length, sent, failed: results.length - sent, results }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** POST /api/portal/sms/schedule */
router.post("/sms/schedule", portalAuth, internalOnly, (req, res) => {
  try {
    const { recipients, content, scheduledAt } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ data: null, error: "수신자를 1명 이상 지정해주세요", meta: null });
    if (!content || !content.trim())
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    if (!scheduledAt)
      return res.status(400).json({ data: null, error: "예약 시각을 입력해주세요", meta: null });
    const when = new Date(scheduledAt);
    if (isNaN(when.getTime()) || when.getTime() < Date.now() + 30000)
      return res.status(400).json({ data: null, error: "예약 시각은 현재 이후여야 합니다", meta: null });
    const crypto2 = require("crypto");
    const id = crypto2.randomUUID();
    const normalizedAt = when.toISOString().replace("T", " ").slice(0, 19);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    sqlite.prepare(
      "INSERT INTO scheduled_messages (id,channel,recipients,content,scheduled_at,status,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).run(id, "sms", JSON.stringify(recipients), content.trim(), normalizedAt, "pending", "portal", now, now);
    const row = sqlite.prepare("SELECT * FROM scheduled_messages WHERE id=?").get(id);
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/sms/scheduled */
router.get("/sms/scheduled", portalAuth, internalOnly, (req, res) => {
  try {
    const { status = "", page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (p - 1) * l;
    let where = "WHERE 1=1";
    const params = [];
    if (status) { where += " AND status=?"; params.push(status); }
    const total = sqlite.prepare("SELECT count(*) as n FROM scheduled_messages " + where).get(...params).n;
    const rows = sqlite.prepare("SELECT * FROM scheduled_messages " + where + " ORDER BY scheduled_at ASC LIMIT ? OFFSET ?").all(...params, l, offset);
    res.json({ data: rows, error: null, meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (e) { handleError(res, e); }
});

/** DELETE /api/portal/sms/scheduled/:id */
router.delete("/sms/scheduled/:id", portalAuth, internalOnly, (req, res) => {
  try {
    const { id } = req.params;
    const row = sqlite.prepare("SELECT status FROM scheduled_messages WHERE id=?").get(id);
    if (!row) return res.status(404).json({ data: null, error: "예약을 찾을 수 없습니다", meta: null });
    if (row.status !== "pending") return res.status(400).json({ data: null, error: "대기 중인 예약만 취소할 수 있습니다", meta: null });
    sqlite.prepare("UPDATE scheduled_messages SET status='cancelled', updated_at=datetime('now') WHERE id=?").run(id);
    res.json({ data: { cancelled: true }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/sms/logs */
router.get("/sms/logs", portalAuth, internalOnly, (req, res) => {
  try {
    const { status = "", channel = "", page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (p - 1) * l;
    let where = "WHERE 1=1";
    const params = [];
    if (channel) { where += " AND channel=?"; params.push(channel); }
    if (status) { where += " AND status=?"; params.push(status); }
    const total = sqlite.prepare("SELECT count(*) as n FROM message_logs " + where).get(...params).n;
    const rows = sqlite.prepare("SELECT * FROM message_logs " + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?").all(...params, l, offset);
    res.json({ data: rows, error: null, meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/sms/stats */
router.get("/sms/stats", portalAuth, internalOnly, (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : defaultFrom;
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : today;
    const summary = sqlite.prepare(
      "SELECT count(*) as total, sum(case when status='sent' then 1 else 0 end) as sent, sum(case when status='failed' then 1 else 0 end) as failed FROM message_logs WHERE date(created_at) BETWEEN ? AND ?"
    ).get(from, to);
    const daily = sqlite.prepare(
      "SELECT date(created_at) as day, sum(case when status='sent' then 1 else 0 end) as sent, sum(case when status='failed' then 1 else 0 end) as failed FROM message_logs WHERE date(created_at) BETWEEN ? AND ? GROUP BY day ORDER BY day ASC"
    ).all(from, to);
    res.json({
      data: {
        range: { from, to },
        total: Number(summary.total || 0),
        sent: Number(summary.sent || 0),
        failed: Number(summary.failed || 0),
        daily: daily.map(r => ({ day: r.day, sent: Number(r.sent || 0), failed: Number(r.failed || 0) })),
      },
      error: null, meta: null,
    });
  } catch (e) { handleError(res, e); }
});

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
    return res.redirect(`${appUrl}/portal/calendar?googleError=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return res.redirect(`${appUrl}/portal/calendar?googleError=invalid_callback`);
  }

  try {
    // state에서 userId 추출 (형식: "userId:randomHex")
    const [userId] = state.split(":");
    if (!userId) throw new Error("잘못된 state 파라미터");

    const tokens = await googleCalendarOAuth.exchangeCodeForTokens(code);
    await portalService.saveGoogleTokens(userId, tokens);

    res.redirect(`${appUrl}/portal/calendar?googleConnected=1`);
  } catch (e) {
    console.warn("[portal/google/callback] 토큰 교환 실패:", e.message);
    res.redirect(`${appUrl}/portal/calendar?googleError=token_exchange_failed`);
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


/** POST /api/portal/google/sync-event/:eventId — 포털 일정을 구글 캘린더에 추가 */
router.post("/google/sync-event/:eventId", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const { eventId } = req.params;

    const event = sqlite.prepare("SELECT * FROM portal_events WHERE id=?").get(eventId);
    if (!event) return res.status(404).json({ data: null, error: "일정을 찾을 수 없습니다", meta: null });

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

    const gEvent = await googleCalendarOAuth.createCaseEvent(accessToken, {
      summary: event.title,
      description: event.description || "",
      date: event.starts_at || event.startsAt,
      endDate: event.ends_at || event.endsAt,
      isAllDay: event.is_all_day === 1 || event.isAllDay === 1,
    });

    // google_event_id를 DB에 저장 (이후 업데이트/삭제 동기화를 위해)
    sqlite.prepare("UPDATE portal_events SET google_event_id=? WHERE id=?").run(gEvent.eventId, eventId);

    res.json({ data: { ...gEvent, eventId: gEvent.eventId }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/google/sync-all — 모든 미동기화 일정을 구글 캘린더에 추가 */
router.post("/google/sync-all", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const tokenData = await portalService.getGoogleTokens(userId);
    if (!tokenData?.googleRefreshToken)
      return res.status(400).json({ data: null, error: "구글 캘린더 연동이 필요합니다", meta: null });
    const { accessToken, refreshed, newExpiry } = await googleCalendarOAuth.getValidAccessToken(tokenData);
    if (refreshed) await portalService.saveGoogleTokens(userId, { accessToken, refreshToken: tokenData.googleRefreshToken, expiresAt: newExpiry });
    const events = sqlite.prepare("SELECT * FROM portal_events WHERE portal_user_id=? AND (google_event_id IS NULL OR google_event_id='')").all(userId);
    let synced = 0, failed = 0;
    for (const ev of events) {
      try {
        const gEv = await googleCalendarOAuth.createCaseEvent(accessToken, {
          summary: ev.title, description: ev.description || "",
          date: ev.starts_at, endDate: ev.ends_at, isAllDay: ev.is_all_day === 1,
        });
        sqlite.prepare("UPDATE portal_events SET google_event_id=? WHERE id=?").run(gEv.eventId, ev.id);
        synced++;
      } catch { failed++; }
    }
    res.json({ data: { synced, failed, total: events.length }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
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
    const existing = sqlite.prepare("SELECT google_event_id, starts_at, ends_at, is_all_day, title, description FROM portal_events WHERE id=? AND portal_user_id=?").get(req.params.id, req.portalUser.userId);
    const result = await portalService.updatePortalEvent(req.params.id, req.portalUser.userId, req.body);
    if (existing?.google_event_id) {
      try {
        const tokenData = await portalService.getGoogleTokens(req.portalUser.userId);
        if (tokenData?.googleRefreshToken) {
          const { accessToken, refreshed, newExpiry } = await googleCalendarOAuth.getValidAccessToken(tokenData);
          if (refreshed) await portalService.saveGoogleTokens(req.portalUser.userId, { accessToken, refreshToken: tokenData.googleRefreshToken, expiresAt: newExpiry });
          await googleCalendarOAuth.updateCalendarEvent(accessToken, existing.google_event_id, {
            summary: req.body.title || existing.title,
            description: req.body.description ?? existing.description ?? "",
            date: req.body.startsAt || existing.starts_at,
            endDate: req.body.endsAt || existing.ends_at,
            isAllDay: (req.body.isAllDay ?? existing.is_all_day) === 1,
          });
        }
      } catch (gErr) { console.warn("[google] 이벤트 업데이트 실패:", gErr.message); }
    }
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.delete("/events/:id", portalAuth, async (req, res) => {
  try {
    const existing = sqlite.prepare("SELECT google_event_id FROM portal_events WHERE id=? AND portal_user_id=?").get(req.params.id, req.portalUser.userId);
    const result = await portalService.deletePortalEvent(req.params.id, req.portalUser.userId);
    if (existing?.google_event_id) {
      try {
        const tokenData = await portalService.getGoogleTokens(req.portalUser.userId);
        if (tokenData?.googleRefreshToken) {
          const { accessToken } = await googleCalendarOAuth.getValidAccessToken(tokenData);
          await googleCalendarOAuth.deleteCalendarEvent(accessToken, existing.google_event_id);
        }
      } catch (gErr) { console.warn("[google] 이벤트 삭제 실패:", gErr.message); }
    }
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 포털 변호사 프로필 설정 및 어드민 기능
// =============================================


/** GET /api/portal/internal/lawyers — 내부 변호사 목록 (멤버 피커용) */
router.get("/internal/lawyers", portalAuth, internalOnly, (req, res) => {
  try {
    const rows = sqlite.prepare("SELECT id, name, position, team FROM lawyers WHERE is_active=1 ORDER BY sort_order ASC, name ASC").all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/internal/departments — 부서 목록 */
router.get("/internal/departments", portalAuth, internalOnly, (req, res) => {
  try {
    const rows = sqlite.prepare("SELECT id, name, parent_id FROM departments ORDER BY name ASC").all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** GET /api/portal/cases/:id/members — 사건 담당자 목록 */
router.get("/cases/:id/members", portalAuth, internalOnly, (req, res) => {
  try {
    const rows = sqlite.prepare("SELECT * FROM case_members WHERE case_id=? ORDER BY created_at ASC").all(req.params.id);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** POST /api/portal/cases/:id/members — 담당자 추가 */
router.post("/cases/:id/members", portalAuth, internalOnly, (req, res) => {
  try {
    const { memberType, memberId, memberName, role } = req.body;
    if (!memberId) return res.status(400).json({ data: null, error: "memberId가 필요합니다", meta: null });
    const dup = sqlite.prepare("SELECT id FROM case_members WHERE case_id=? AND member_id=?").get(req.params.id, memberId);
    if (dup) return res.status(409).json({ data: null, error: "이미 추가된 멤버입니다", meta: null });
    const crypto2 = require("crypto");
    const id = crypto2.randomUUID();
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    sqlite.prepare("INSERT INTO case_members (id,case_id,member_type,member_id,member_name,role,created_at) VALUES (?,?,?,?,?,?,?)").run(id, req.params.id, memberType || "lawyer", memberId, memberName || null, role || "담당", now);
    const row = sqlite.prepare("SELECT * FROM case_members WHERE id=?").get(id);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

/** DELETE /api/portal/cases/:id/members/:memberId — 담당자 제거 */
router.delete("/cases/:id/members/:memberId", portalAuth, internalOnly, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT id FROM case_members WHERE id=? AND case_id=?").get(req.params.memberId, req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "멤버를 찾을 수 없습니다", meta: null });
    sqlite.prepare("DELETE FROM case_members WHERE id=?").run(req.params.memberId);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

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

router.get("/clients", portalAuth, internalOnly, async (req, res) => {
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

module.exports = router;
