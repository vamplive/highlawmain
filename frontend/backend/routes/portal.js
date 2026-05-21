/**
 * 의뢰인 포털 API 라우트 — 회원가입/로그인(공개) + 사건 조회/메시지(인증) + 사건 관리(관리자)
 * 비즈니스 로직은 services/portal-service.js에 위임한다.
 */
const { Router } = require("express");
const {
  portalAuth,
  adminAuth,
  setPortalSessionCookie,
  clearPortalSessionCookie,
  extractPortalToken,
} = require("../lib/auth");
const portalService = require("../services/portal-service");
const { logSecurityEvent } = require("../lib/audit-log");
const { handleError } = require("../lib/route-handler");

const router = Router();

// =============================================
// 공개 엔드포인트 (인증 불필요)
// =============================================

/** POST /api/portal/register — 포털 회원가입 */
router.post("/register", async (req, res) => {
  try {
    const result = await portalService.registerUser(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/portal/login — 포털 로그인
 * HttpOnly 쿠키 portal_session 발급. 응답 body의 token은 모바일 앱 등
 * 외부 클라이언트 호환을 위해 남기지만 웹 프론트엔드는 쿠키만 사용한다.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await portalService.loginUser(email, password);
    setPortalSessionCookie(res, result.token);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    // 자격 증명 실패만 보안 로그로 분류 (입력 형식 오류 400은 단순 사용자 오타)
    if (e?.name === "ServiceError" && (e.status === 401 || e.status === 403)) {
      const subtype = e.status === 403 ? "inactive" : "invalid";
      logSecurityEvent(req, `portal_login_fail.${subtype}`, { attemptedEmail: req.body?.email });
    }
    handleError(res, e);
  }
});

/**
 * POST /api/portal/logout — 로그아웃 (인증된 사용자만)
 * 쿠키 또는 x-portal-token 헤더에서 토큰을 추출해 세션을 삭제하고 쿠키를 만료시킨다.
 */
router.post("/logout", portalAuth, (req, res) => {
  portalService.logoutUser(extractPortalToken(req));
  clearPortalSessionCookie(res);
  res.json({ data: { message: "로그아웃 되었습니다" }, error: null, meta: null });
});

// =============================================
// 인증 필요 엔드포인트 (portalAuth 미들웨어)
// =============================================

/** GET /api/portal/me — 현재 사용자 정보 */
router.get("/me", portalAuth, async (req, res) => {
  try {
    const { userId, clientId } = req.portalUser;
    const result = await portalService.getUserProfile(userId, clientId);
    res.json({ data: result, error: null, meta: null });
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

/** GET /api/portal/cases/:id — 사건 상세 (문서 + 최근 메시지) */
router.get("/cases/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.getCaseDetail(req.params.id, req.portalUser.clientId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/cases/:id/messages — 사건 메시지 목록 (페이지네이션) */
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

/** POST /api/portal/cases/:id/messages — 의뢰인 메시지 전송 */
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
// 관리자 엔드포인트
// =============================================

/** GET /api/portal/admin/cases — 전체 사건 목록 (관리자) */
router.get("/admin/cases", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminCases(req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/cases — 사건 생성 (관리자) */
router.post("/admin/cases", adminAuth, async (req, res) => {
  try {
    const result = await portalService.createAdminCase(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/admin/cases/:id — 사건 단건 (관리자) */
router.get("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.getAdminCase(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PATCH /api/portal/admin/cases/:id — 사건 수정 (관리자) */
router.patch("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.updateAdminCase(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /api/portal/admin/cases/:id — 사건 삭제 (관리자) — cascade 로 문서/메시지 같이 제거 */
router.delete("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.deleteAdminCase(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/portal/admin/cases/:id/messages — 사건 메시지 목록 (관리자, 시간 오름차순) */
router.get("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminCaseMessages(req.params.id, req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/portal/admin/cases/:id/messages — 변호사 메시지 전송 (관리자) */
router.post("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const result = await portalService.sendLawyerMessage(req.params.id, req.body.content);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
