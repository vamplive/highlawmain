/**
 * 관리자 사용자 API 라우트 — 로그인/로그아웃, 사용자 CRUD
 * - 인메모리 세션 기반 인증
 * - 서버 시작 시 기본 관리자 계정 자동 생성
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { logAudit, logSecurityEvent } = require("../lib/audit-log");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { adminUsers } = require("../db/schema");
const { eq, sql } = require("drizzle-orm");
const {
  hashPassword,
  verifyPassword,
  dummyVerifyPassword,
  createSession,
  getSession,
  deleteSession,
  adminAuth,
  requireRole,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  extractAdminToken,
  VALID_ROLES,
} = require("../lib/auth");
const { sqlite } = require("../db");
const { sendEmail } = require("../lib/email-service");
const crypto = require("crypto");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 사용자 객체에서 비밀번호 해시·TOTP 시크릿·재설정 토큰 등 민감 필드를 제거.
 * - totpSecret 은 AES-256-GCM 암호화되어 저장되더라도 평문 ciphertext 가
 *   API 응답에 흘러갈 이유가 없으므로 화이트리스트 외 모든 클라이언트 응답에서 제외.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  if (!user) return null;
  const {
    passwordHash: _passwordHash,
    totpSecret: _totpSecret,
    resetTokenHash: _resetTokenHash,
    resetTokenExpiresAt: _resetTokenExpiresAt,
    ...safe
  } = user;
  return safe;
}

/**
 * POST /login — 로그인
 * - username, password로 인증 후 세션 토큰 반환
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ data: null, error: "아이디와 비밀번호를 입력해주세요", meta: null });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (!user) {
      // 사용자 미존재 시에도 동일한 비용을 소비하여 응답 시간 차로
      // 사용자 존재 여부가 외부에 노출되지 않도록 한다.
      dummyVerifyPassword();
      logSecurityEvent(req, "login_fail.no_user", { attemptedUsername: username });
      return res.status(401).json({ data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    if (!user.isActive) {
      logSecurityEvent(req, "login_fail.inactive", { attemptedUsername: username });
      return res.status(403).json({ data: null, error: "비활성화된 계정입니다", meta: null });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      logSecurityEvent(req, "login_fail.bad_password", { attemptedUsername: username });
      return res.status(401).json({ data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    // 마지막 로그인 시간 업데이트
    await db.update(adminUsers).set({
      lastLoginAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, user.id));

    const token = createSession(user.id, user.role);
    // HttpOnly 쿠키로 토큰 전달 — XSS로 탈취 불가능
    setAdminSessionCookie(res, token);

    // 감사 로그: 로그인 성공
    logAudit({ action: "login", resource: "admin", resourceId: user.id, userId: user.id, userName: user.name, ip: req.ip });

    res.json({
      data: {
        user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email },
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/** 재설정 토큰 만료 (30분, 밀리초) — 메일 도달 후 사용자가 클릭하기에 충분 */
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/** 평문 토큰을 SHA-256 hex로 해싱 (DB 저장용) */
function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/**
 * POST /forgot-password — 비밀번호 재설정 링크 이메일 발송
 *
 * 설계 의도 (이전의 "즉시 임시 비번 교체" 방식의 문제 해소):
 * - 평문 임시 비밀번호를 메일로 보내지 않는다. 일회용 reset 토큰 링크만 발송.
 * - 호출만으로 기존 비밀번호/세션을 변경하지 않는다 → 외부 공격자가 "alice"라는
 *   username만 알아도 정상 admin을 강제 로그아웃시키는 DoS가 불가능.
 * - 사용자(admin) 행에 등록된 email 로만 발송 (자유 입력 차단).
 * - 사용자/이메일 존재 여부를 응답으로 노출하지 않음 (열거 방지).
 *
 * 비밀번호 실제 교체와 세션 무효화는 /reset-password 단계에서 토큰 검증 후 실행한다.
 */
router.post("/forgot-password", async (req, res) => {
  const GENERIC_OK = { data: { sent: true }, error: null, meta: null };

  try {
    const { username } = req.body || {};
    if (!username || typeof username !== "string") {
      return res.status(400).json({ data: null, error: "아이디를 입력해주세요", meta: null });
    }
    // 합리적 상한 — 정상 username은 32자 이하. 거대 입력으로 SQL/메모리 소모를 막는다.
    if (username.length > 64) {
      return res.status(400).json({ data: null, error: "아이디 형식이 올바르지 않습니다", meta: null });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username.trim()));
    if (!user || !user.isActive || !user.email) {
      // 동일 응답 + 응답 시간 평준화 (사용자 존재 시 발생하는 hash/insert/sendEmail 비용을
      // 미존재 path에서도 일부 흉내내어 timing side-channel을 줄인다).
      // dummyHashReset: 의미 없는 해시 1회 — 실제 hashResetToken과 같은 비용.
      hashResetToken(crypto.randomBytes(32).toString("hex"));
      logAudit({ action: "forgot_password.miss", resource: "admin", resourceId: null, userName: username, ip: req.ip });
      return res.json(GENERIC_OK);
    }

    // 일회용 토큰 발급 — 32바이트 랜덤. 평문은 메일에만 담기고, DB에는 SHA-256 해시 저장.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

    await db.update(adminUsers).set({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, user.id));

    // 재설정 페이지 URL — APP_URL 환경변수 기반. Host 헤더 기반 생성을 의도적으로 회피.
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetUrl = `${appUrl.replace(/\/+$/, "")}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;

    const subject = "[법무법인 하이로] 관리자 비밀번호 재설정 안내";
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; margin: 0 0 16px;">비밀번호 재설정</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          아래 링크를 클릭하여 새 비밀번호를 설정해주세요. 링크는 30분간 유효합니다.
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${escapeHtml(resetUrl)}"
             style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            비밀번호 재설정
          </a>
        </div>
        <p style="color: #8a8a8a; font-size: 12px; line-height: 1.5; word-break: break-all;">
          버튼이 작동하지 않으면 다음 주소를 복사해 브라우저에 붙여넣으세요:<br />
          ${escapeHtml(resetUrl)}
        </p>
        <p style="color: #8a8a8a; font-size: 12px; line-height: 1.5; margin-top: 24px;">
          본 메일은 본인이 비밀번호 분실 기능을 이용한 경우에만 발송됩니다.<br />
          본인이 요청하지 않았다면 무시하셔도 됩니다 — 비밀번호와 세션은 변경되지 않습니다.
        </p>
      </div>
    `;
    const result = await sendEmail(user.email, subject, html);

    logAudit({
      action: result.success ? "forgot_password.link_sent" : "forgot_password.send_failed",
      resource: "admin",
      resourceId: user.id,
      userName: user.username,
      ip: req.ip,
    });

    if (!result.success) {
      logger.error({ err: result.error }, "forgot-password email failed");
    }

    res.json(GENERIC_OK);
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /reset-password — reset 토큰 검증 후 새 비밀번호 적용
 *
 * - 토큰은 평문으로 받아 SHA-256 해시 후 저장값과 timing-safe 비교.
 * - 만료(30분 경과)된 토큰은 거부.
 * - 검증 성공 시: 비밀번호 교체 + 토큰 1회용 폐기 + 모든 세션 무효화.
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ data: null, error: "토큰과 새 비밀번호가 필요합니다", meta: null });
    }
    // 토큰은 32바이트 랜덤의 hex 인코딩 = 64자 [0-9a-f]. 형식 미일치는 즉시 차단.
    // (Buffer.from/length 비교로도 걸리지만 명시적으로 막아 timing/리소스 부담을 줄인다.)
    if (token.length !== 64 || !/^[0-9a-f]+$/i.test(token)) {
      logAudit({ action: "reset_password.malformed_token", resource: "admin", resourceId: null, ip: req.ip });
      return res.status(400).json({ data: null, error: "토큰이 유효하지 않거나 만료되었습니다", meta: null });
    }
    if (password.length < 8) {
      return res.status(400).json({ data: null, error: "비밀번호는 8자 이상이어야 합니다", meta: null });
    }
    // 합리적 상한 — bcrypt가 72바이트 이후를 무시하므로 더 긴 입력은 의미 없고 메모리만 소모한다.
    if (password.length > 256) {
      return res.status(400).json({ data: null, error: "비밀번호는 256자 이하로 입력해주세요", meta: null });
    }

    const tokenHash = hashResetToken(token);

    // 토큰 해시로 직접 사용자 조회 (인덱스 없으나 admin_users는 소수 행)
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.resetTokenHash, tokenHash));

    // 만료/미존재/비활성 모두 동일한 일반 메시지로 응답 (정보 누출 차단)
    const INVALID = { status: 400, data: null, error: "토큰이 유효하지 않거나 만료되었습니다", meta: null };
    if (!user || !user.isActive || !user.resetTokenExpiresAt) {
      // timing 평준화용 dummy 해시 (eq 비교 시간과 비슷한 무효 비용)
      crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
      logAudit({ action: "reset_password.invalid_token", resource: "admin", resourceId: null, ip: req.ip });
      return res.status(INVALID.status).json(INVALID);
    }
    if (Date.now() > Number(user.resetTokenExpiresAt)) {
      logAudit({ action: "reset_password.expired", resource: "admin", resourceId: user.id, userName: user.username, ip: req.ip });
      return res.status(INVALID.status).json(INVALID);
    }

    // timing-safe 비교 — drizzle eq()는 SQL 단계 비교이므로 추가 방어용. 같은 길이라야 함.
    const stored = Buffer.from(user.resetTokenHash || "", "hex");
    const provided = Buffer.from(tokenHash, "hex");
    if (stored.length !== provided.length || !crypto.timingSafeEqual(stored, provided)) {
      logAudit({ action: "reset_password.mismatch", resource: "admin", resourceId: user.id, userName: user.username, ip: req.ip });
      return res.status(INVALID.status).json(INVALID);
    }

    // 비밀번호 교체 + 토큰 1회용 폐기
    await db.update(adminUsers).set({
      passwordHash: hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, user.id));

    // 기존 세션 모두 무효화 (탈취된 세션이 있을 가능성 차단)
    sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

    logAudit({ action: "reset_password.success", resource: "admin", resourceId: user.id, userName: user.username, ip: req.ip });
    res.json({ data: { reset: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** HTML 이스케이프 (이메일 본문용) */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * POST /logout — 로그아웃
 * - 쿠키 또는 Authorization 헤더의 토큰으로 세션 삭제 + 쿠키 만료
 */
router.post("/logout", (req, res) => {
  const token = extractAdminToken(req);
  if (token) deleteSession(token);
  clearAdminSessionCookie(res);
  res.json({ data: { success: true }, error: null, meta: null });
});

/**
 * GET /me — 현재 로그인된 사용자 정보
 */
router.get("/me", async (req, res) => {
  try {
    const token = extractAdminToken(req);
    if (!token) {
      return res.status(401).json({ data: null, error: "인증 토큰이 필요합니다", meta: null });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ data: null, error: "유효하지 않은 세션입니다", meta: null });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
    if (!user || !user.isActive) {
      return res.status(401).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    res.json({ data: sanitizeUser(user), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET / — 관리자 사용자 목록 (admin 역할만 접근 가능)
 */
router.get("/", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db.select().from(adminUsers);
    res.json({ data: rows.map(sanitizeUser), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST / — 관리자 사용자 생성 (admin 역할만 가능)
 * - username 중복 검사, 비밀번호 해싱, role 화이트리스트 검증
 */
router.post("/", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ data: null, error: "아이디, 비밀번호, 이름은 필수입니다", meta: null });
    }

    if (password.length < 8) {
      return res.status(400).json({ data: null, error: "비밀번호는 8자 이상이어야 합니다", meta: null });
    }

    const assignedRole = role || "editor";
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({ data: null, error: `유효하지 않은 역할입니다. 허용: ${VALID_ROLES.join(", ")}`, meta: null });
    }

    // 중복 username 검사
    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (existing) {
      return res.status(409).json({ data: null, error: "이미 사용 중인 아이디입니다", meta: null });
    }

    const [inserted] = await db.insert(adminUsers).values({
      username,
      passwordHash: hashPassword(password),
      name,
      role: assignedRole,
      email: email || null,
    }).returning();

    res.json({ data: sanitizeUser(inserted), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * PATCH /:id — 관리자 사용자 수정 (admin 역할만 가능)
 * - password 제공 시 재해싱, name/role/email/isActive 수정 가능
 * - 자기 자신 비활성화 불가, 마지막 admin 역할 변경/비활성화 불가
 */
router.patch("/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    const { password, name, role, email, isActive } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ data: null, error: "비밀번호는 8자 이상이어야 합니다", meta: null });
      }
      updateData.passwordHash = hashPassword(password);
    }
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ data: null, error: `유효하지 않은 역할입니다. 허용: ${VALID_ROLES.join(", ")}`, meta: null });
      }
      // 마지막 admin의 역할 변경 방지
      if (existing.role === "admin" && role !== "admin") {
        const activeAdminCount = sqlite.prepare(
          "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
        ).get().cnt;
        if (activeAdminCount <= 1) {
          return res.status(400).json({ data: null, error: "마지막 관리자의 역할을 변경할 수 없습니다", meta: null });
        }
      }
      updateData.role = role;
    }
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) {
      // 자기 자신 비활성화 방지
      if (!isActive && id === req.adminUser.userId) {
        return res.status(400).json({ data: null, error: "자기 자신을 비활성화할 수 없습니다", meta: null });
      }
      // 마지막 active admin 비활성화 방지
      if (!isActive && existing.role === "admin" && existing.isActive) {
        const activeAdminCount = sqlite.prepare(
          "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
        ).get().cnt;
        if (activeAdminCount <= 1) {
          return res.status(400).json({ data: null, error: "마지막 관리자를 비활성화할 수 없습니다", meta: null });
        }
      }
      updateData.isActive = isActive ? 1 : 0;
    }

    const [updated] = await db.update(adminUsers).set(updateData)
      .where(eq(adminUsers.id, id)).returning();

    // 비활성화된 사용자의 기존 세션 삭제
    if (isActive !== undefined && !isActive) {
      sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
    }

    res.json({ data: sanitizeUser(updated), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /:id — 관리자 사용자 비활성화 (소프트 삭제, admin 역할만 가능)
 * - 자기 자신 삭제 불가, 마지막 admin 삭제 불가
 */
router.delete("/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    // 자기 자신 삭제 방지
    if (id === req.adminUser.userId) {
      return res.status(400).json({ data: null, error: "자기 자신을 삭제할 수 없습니다", meta: null });
    }

    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    // 마지막 active admin 삭제 방지
    if (existing.role === "admin" && existing.isActive) {
      const activeAdminCount = sqlite.prepare(
        "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
      ).get().cnt;
      if (activeAdminCount <= 1) {
        return res.status(400).json({ data: null, error: "마지막 관리자를 삭제할 수 없습니다", meta: null });
      }
    }

    const [updated] = await db.update(adminUsers).set({
      isActive: 0,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, id)).returning();

    // 비활성화된 사용자의 기존 세션 삭제
    sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);

    res.json({ data: sanitizeUser(updated), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// 기본 관리자 계정 자동 생성 (환경변수 필수)
//
// 프로덕션에서 관리자 계정이 하나도 없는 상태로 서버가 기동되면
// 어드민 라우트에 접근 가능한 사용자가 없어 사실상 운영 불능 상태가 되거나,
// 누군가가 잘못된 초기화 흐름으로 들어올 수 있다.
// 따라서 production + 관리자 부재 + 초기 비밀번호 미설정인 경우
// 명시적으로 부팅을 차단하여 잘못된 배포를 조기에 알린다.
(async function initDefaultAdmin() {
  try {
    const [existing] = await db.select().from(adminUsers);
    if (existing) return;

    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    const isProduction = process.env.NODE_ENV === "production";

    if (!initialPassword) {
      const message = "[Auth] ⚠ ADMIN_INITIAL_PASSWORD 환경변수가 설정되지 않았습니다. .env에 8자 이상의 안전한 비밀번호를 설정하세요.";
      if (isProduction) {
        logger.fatal(message + " — 프로덕션에서는 부팅을 중단합니다.");
        process.exit(1);
      }
      logger.warn(message);
      return;
    }
    if (initialPassword.length < 8 && isProduction) {
      logger.fatal("[Auth] ⚠ ADMIN_INITIAL_PASSWORD는 8자 이상이어야 합니다. — 프로덕션에서는 부팅을 중단합니다.");
      process.exit(1);
    }

    await db.insert(adminUsers).values({
      username: process.env.ADMIN_INITIAL_USERNAME || "admin",
      passwordHash: hashPassword(initialPassword),
      name: "관리자",
      role: "admin",
    });
    logger.info("[Auth] 기본 관리자 계정 생성 완료 (최초 로그인 후 비밀번호를 변경해주세요)");
  } catch (e) {
    logger.error({ err: e }, "[Auth] 기본 관리자 계정 생성 실패");
  }
})();

module.exports = router;
