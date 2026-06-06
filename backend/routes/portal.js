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
const {
  portalAuth,
  adminAuth,
  setPortalSessionCookie,
  clearPortalSessionCookie,
  extractPortalToken,
} = require("../lib/auth");
const portalService = require("../services/portal-service");
const googleCalendarOAuth = require("../lib/google-calendar-oauth");
const { logSecurityEvent } = require("../lib/audit-log");
const { handleError } = require("../lib/route-handler");

const router = Router();

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
// 영수증 업로드 multer 설정 (지출 결의 / 경비 청구)
// =============================================
const RECEIPTS_DIR = path.join(STORAGE_PATH, "uploads", "receipts");

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
    cb(null, RECEIPTS_DIR);
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
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일(JPG·PNG·WebP) 또는 PDF 파일만 업로드할 수 있습니다"), false);
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

/** POST /api/portal/login */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await portalService.loginUser(email, password);
    setPortalSessionCookie(res, result.token);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    if (e?.name === "ServiceError" && (e.status === 401 || e.status === 403)) {
      const subtype = e.status === 403 ? "inactive" : "invalid";
      logSecurityEvent(req, `portal_login_fail.${subtype}`, { attemptedEmail: req.body?.email });
    }
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

/** POST /api/portal/upload-receipt — 포털 지출결의/경비청구 영수증 업로드 */
router.post("/upload-receipt", portalAuth, (req, res) => {
  receiptUpload.single("receipt")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ data: null, error: err.message, meta: null });
    }
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    }
    const url = `/uploads/receipts/${req.file.filename}`;
    res.json({ data: { url, originalName: req.file.originalname }, error: null, meta: null });
  });
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

/** PATCH /api/portal/admin/users/:id — 역할 및 정보 수정 */
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

router.get("/departments", portalAuth, async (req, res) => {
  try {
    const isEmployee = await portalService.checkIsEmployee(req.portalUser.userId);
    if (!isEmployee) {
      return res.status(403).json({ data: [], error: "권한이 없습니다", meta: null });
    }
    const { db } = require("../db");
    const { departments, portalUsers, clients } = require("../db/schema");
    const { eq } = require("drizzle-orm");

    const rows = await db
      .select({
        id: departments.id,
        name: departments.name,
        parentId: departments.parentId,
        managerUserId: departments.managerUserId,
        managerName: clients.name,
        managerPosition: portalUsers.position,
      })
      .from(departments)
      .leftJoin(portalUsers, eq(departments.managerUserId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id));

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/members", portalAuth, async (req, res) => {
  try {
    const isEmployee = await portalService.checkIsEmployee(req.portalUser.userId);
    if (!isEmployee) {
      return res.status(403).json({ data: [], error: "권한이 없습니다", meta: null });
    }
    const { db } = require("../db");
    const { portalUsers, clients, departments, lawyers } = require("../db/schema");
    const { eq, and, sql } = require("drizzle-orm");

    const rows = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        name: clients.name,
        phone: clients.phone,
        role: portalUsers.role,
        position: portalUsers.position,
        departmentId: portalUsers.departmentId,
        departmentName: departments.name,
      })
      .from(portalUsers)
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .leftJoin(departments, eq(portalUsers.departmentId, departments.id))
      .where(
        and(
          eq(portalUsers.isActive, 1),
          sql`(${portalUsers.clientId} IS NULL OR ${portalUsers.role} != 'client')`
        )
      );

    // Resolve lawyers names for matching emails as display names fallback
    const allLawyersList = await db
      .select({
        name: lawyers.name,
        email: lawyers.email,
      })
      .from(lawyers);

    const lawyerNameMap = {};
    for (const l of allLawyersList) {
      if (l.email) lawyerNameMap[l.email.toLowerCase().trim()] = l.name;
    }

    const resolvedRows = rows.map(r => ({
      ...r,
      name: lawyerNameMap[r.email?.toLowerCase().trim()] || r.name || "미지정"
    }));

    res.json({ data: resolvedRows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

router.get("/events", portalAuth, async (req, res) => {
  try {
    const rows = await portalService.listPortalEvents(req.portalUser.userId, req.query);
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
    const existing = await portalService.getLawyerProfileByEmail(req.portalUser.email);
    if (existing) {
      const result = await portalService.updateLawyerProfile(existing.id, { ...req.body, email: req.portalUser.email });
      return res.json({ data: result, error: null, meta: null });
    }
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
    const result = await portalService.updateLawyerProfile(profile.id, { ...req.body, email: req.portalUser.email });
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
// 구글 캘린더 연동용 iCal 피드
// =============================================

/**
 * 이벤트를 iCalendar(RFC 5545) 형식으로 변환하는 헬퍼
 */
function formatEventsToICal(events) {
  let ical = [];
  ical.push("BEGIN:VCALENDAR");
  ical.push("VERSION:2.0");
  ical.push("PRODID:-//Highlaw//Calendar Feed//KO");
  ical.push("CALSCALE:GREGORIAN");
  ical.push("METHOD:PUBLISH");
  ical.push("X-WR-CALNAME:법무법인 하이로 일정");
  ical.push("X-WR-TIMEZONE:Asia/Seoul");

  const toICalDate = (dateStr, isAllDay) => {
    if (!dateStr) return "";
    const clean = dateStr.replace(/[-:]/g, "");
    if (isAllDay) {
      return clean.substring(0, 8);
    }
    let tIndex = clean.indexOf("T");
    if (tIndex === -1) {
      return clean.substring(0, 8);
    }
    let timePart = clean.substring(tIndex + 1);
    if (timePart.length === 4) {
      timePart += "00";
    }
    return clean.substring(0, 8) + "T" + timePart.substring(0, 6);
  };

  for (const event of events) {
    const isAllDay = event.isAllDay === 1;
    ical.push("BEGIN:VEVENT");
    ical.push(`UID:${event.id || Math.random().toString(36).substring(2)}@highlaw.co.kr`);
    
    const nowStr = new Date().toISOString().replace(/[-:]/g, "").substring(0, 15) + "Z";
    ical.push(`DTSTAMP:${nowStr}`);
    
    const startICal = toICalDate(event.startsAt, isAllDay);
    const endICal = toICalDate(event.endsAt || event.startsAt, isAllDay);
    
    if (isAllDay) {
      ical.push(`DTSTART;VALUE=DATE:${startICal}`);
      try {
        const endDateObj = new Date((event.endsAt || event.startsAt).substring(0, 10));
        endDateObj.setDate(endDateObj.getDate() + 1);
        const endStr = endDateObj.toISOString().substring(0, 10).replace(/[-:]/g, "");
        ical.push(`DTEND;VALUE=DATE:${endStr}`);
      } catch {
        ical.push(`DTEND;VALUE=DATE:${endICal}`);
      }
    } else {
      ical.push(`DTSTART:${startICal}`);
      ical.push(`DTEND:${endICal}`);
    }

    const summary = (event.title || "")
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
    ical.push(`SUMMARY:${summary}`);

    let descParts = [];
    if (event.description) {
      descParts.push(event.description);
    }
    if (event.ownerName) {
      descParts.push(`담당: ${event.ownerName}`);
    }
    if (event.isCourtDate) {
      descParts.push("[법정 기일]");
    }
    const description = descParts.join(" | ")
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
    if (description) {
      ical.push(`DESCRIPTION:${description}`);
    }

    ical.push("END:VEVENT");
  }

  ical.push("END:VCALENDAR");
  return ical.join("\r\n");
}

/** GET /api/portal/calendar/sync-info — 구글 캘린더 연동 정보 조회 */
router.get("/calendar/sync-info", portalAuth, (req, res) => {
  try {
    const { userId } = req.portalUser;
    
    // IP_HASH_SECRET 기반 HMAC 토큰 생성
    const IP_HASH_SECRET = process.env.IP_HASH_SECRET || process.env.CSRF_SECRET || "development-ip-hash-secret";
    const token = crypto.createHmac("sha256", IP_HASH_SECRET).update(userId).digest("hex");
    
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const feedUrl = `${appUrl}/api/portal/calendar/feed?userId=${userId}&token=${token}`;
    
    res.json({
      data: {
        feedUrl,
      },
      error: null,
      meta: null
    });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/calendar/feed — 구글 캘린더 구독용 iCal 피드 제공 (쿠키 인증 제외) */
router.get("/calendar/feed", async (req, res) => {
  try {
    const { token, userId } = req.query;
    if (!token || !userId) {
      return res.status(400).send("검증 파라미터가 누락되었습니다.");
    }

    const IP_HASH_SECRET = process.env.IP_HASH_SECRET || process.env.CSRF_SECRET || "development-ip-hash-secret";
    const expectedToken = crypto.createHmac("sha256", IP_HASH_SECRET).update(userId).digest("hex");
    
    if (token !== expectedToken) {
      return res.status(403).send("올바르지 않은 인증 토큰입니다.");
    }

    // 해당 사용자의 캘린더 일정 조회
    const events = await portalService.listPortalEvents(userId, {});
    const icalData = formatEventsToICal(events);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=calendar.ics");
    res.send(icalData);
  } catch (e) {
    console.error("[iCal Feed Error]", e);
    res.status(500).send("iCal 생성 중 오류가 발생했습니다.");
  }
});

module.exports = router;
