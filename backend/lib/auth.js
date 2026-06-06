/**
 * 인증 유틸리티 — 비밀번호 해싱, 세션 관리 (SQLite 영속화, TTL 적용)
 * - Node.js 내장 crypto 모듈 사용 (bcrypt 불필요)
 * - SQLite 세션 스토어 (서버 재시작 후에도 세션 유지)
 * - 세션 TTL: 24시간 (만료 후 자동 삭제)
 *
 * 세션 토큰 저장 전략:
 *   클라이언트는 평문 토큰을 받아 Bearer로 제시하지만, DB에는 SHA-256 해시만 저장한다.
 *   DB 유출 시 해시만 노출되어 활성 세션을 즉시 탈취할 수 없게 한다.
 */
const crypto = require("crypto");
const { sqlite } = require("../db");

/** 세션 만료 시간 (24시간, 밀리초) */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** 세션 정리 주기 (15분, 밀리초) — 비활성화/로그아웃 후 잔존 시간을 줄인다 */
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

/**
 * 세션 토큰을 DB 저장용 SHA-256 해시로 변환
 * @param {string} token - 평문 세션 토큰
 * @returns {string} hex SHA-256 다이제스트
 */
function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// 평문 token PK를 쓰던 구버전 스키마가 남아 있으면 제거한다.
// 평문 토큰이 DB에 남아 있는 상태 자체가 위험하므로, 전체 무효화가
// 가장 안전한 선택이다 (모든 사용자가 다시 로그인하면 됨).
function dropLegacyPlainTokenTable(tableName) {
  try {
    const cols = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
    if (cols.length === 0) return; // 테이블 없음 — 신규 환경
    const hasPlainToken = cols.some((c) => c.name === "token");
    const hasHashedToken = cols.some((c) => c.name === "token_hash");
    if (hasPlainToken && !hasHashedToken) {
      sqlite.exec(`DROP TABLE ${tableName}`);
    }
  } catch {
    // PRAGMA 실패 — 무시하고 진행
  }
}
dropLegacyPlainTokenTable("sessions");
dropLegacyPlainTokenTable("portal_sessions");

// SQLite 세션 테이블 생성 (관리자)
// token_hash = SHA-256(평문 토큰). 평문은 DB에 저장하지 않는다.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

// SQLite 포털 세션 테이블 생성 (의뢰인)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS portal_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    client_id TEXT,
    created_at INTEGER NOT NULL
  )
`);

// 세션 테이블 인덱스 — 사용자 단위 일괄 삭제(예: 로그아웃 전체)와
// 만료 정리(created_at)에서 풀 스캔을 방지한다.
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
  CREATE INDEX IF NOT EXISTS idx_portal_sessions_user_id ON portal_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_portal_sessions_created_at ON portal_sessions(created_at);
`);

/**
 * 평문 비밀번호를 salt:hash 형태로 해싱
 * @param {string} plain - 평문 비밀번호
 * @returns {string} "salt:hash" 형식 문자열
 */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * 저장된 해시와 평문 비밀번호 비교
 * @param {string} plain - 평문 비밀번호
 * @param {string} stored - "salt:hash" 형식 저장값
 * @returns {boolean}
 */
function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(plain, salt, 64).toString("hex");
  // 타이밍 공격 방지를 위해 timingSafeEqual 사용
  if (hash.length !== verify.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

/**
 * 사용자 존재 여부와 무관하게 일정한 비용을 소비하는 더미 검증.
 * 로그인 핸들러에서 "사용자 미존재" 분기에서 호출하여 응답 시간 차로 인한
 * 사용자 열거(enumeration) 공격을 방어한다.
 *
 * 더미 해시는 실제 사용 가능한 비밀번호와 매칭되지 않도록 임의 salt+hash로 구성된다.
 */
const DUMMY_PASSWORD_HASH = hashPassword(crypto.randomBytes(16).toString("hex"));
function dummyVerifyPassword() {
  // 결과는 항상 무시되지만, scrypt 1회 비용을 소비한다
  verifyPassword("dummy-input-for-timing-equalization", DUMMY_PASSWORD_HASH);
}

/** 랜덤 토큰 생성 (32바이트 hex) */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Prepared statements (성능 최적화)
const insertSessionStmt = sqlite.prepare(
  "INSERT INTO sessions (token_hash, user_id, role, created_at) VALUES (?, ?, ?, ?)"
);
const selectSessionStmt = sqlite.prepare(
  "SELECT user_id, role, created_at FROM sessions WHERE token_hash = ?"
);
const deleteSessionStmt = sqlite.prepare(
  "DELETE FROM sessions WHERE token_hash = ?"
);
const cleanupSessionsStmt = sqlite.prepare(
  "DELETE FROM sessions WHERE created_at < ?"
);

/**
 * 세션 생성 (SQLite에 해시만 저장, 평문은 호출자에게 1회만 전달)
 * @param {string} userId - 사용자 ID
 * @param {string} role - 사용자 역할
 * @returns {string} 세션 토큰 (평문)
 */
function createSession(userId, role) {
  const token = generateToken();
  insertSessionStmt.run(hashSessionToken(token), userId, role, Date.now());
  return token;
}

/**
 * 세션 조회 (만료 검사 포함)
 * @param {string} token - 세션 토큰 (평문)
 * @returns {{ userId: string, role: string, createdAt: number } | null}
 */
function getSession(token) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const row = selectSessionStmt.get(tokenHash);
  if (!row) return null;

  // 만료된 세션 자동 삭제
  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    deleteSessionStmt.run(tokenHash);
    return null;
  }

  return { userId: row.user_id, role: row.role, createdAt: row.created_at };
}

/** 세션 삭제 */
function deleteSession(token) {
  if (!token) return;
  deleteSessionStmt.run(hashSessionToken(token));
}

/** 허용되는 관리자 역할 (계층형)
 *  - admin   : super-admin. 모든 권한. 결제 취소/삭제, 카드/영수증 삭제, 관리자 계정 관리.
 *  - manager : 중간 관리자. 결제 발행/결제 추가, 계약 작성, 메시지 발송, 분석 조회 등.
 *              위험한 영구 변경(취소·삭제·계정 관리)은 불가.
 *  - staff   : 일상 운영자. 예약·상담 처리, 콘텐츠 등록, 본인 자료 업로드.
 *              결제·계약 발행, 메시지 대량 발송, 다른 사람 자료 변경 불가.
 *  - editor  : 레거시(기존 default). manager와 동등하게 취급한다.
 */
const VALID_ROLES = ["admin", "manager", "staff", "editor"];

/** 역할 등급 — 숫자가 클수록 권한 강함. requireMinRole에서 비교에 사용. */
const ROLE_RANK = {
  admin:   3,
  manager: 2,
  editor:  2, // legacy alias for manager
  staff:   1,
};

/** 관리자 세션 쿠키 이름 — HttpOnly + SameSite=Strict로 설정한다 */
const ADMIN_SESSION_COOKIE = "admin_session";

/**
 * 요청에서 어드민 세션 토큰 추출.
 *   1순위: HttpOnly 쿠키 `admin_session` (XSS로 탈취 불가)
 *   2순위: `Authorization: Bearer <token>` 헤더 (Swagger / 외부 클라이언트 호환)
 * @param {import("express").Request} req
 * @returns {string|null}
 */
function extractAdminToken(req) {
  const cookieHeader = req.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_SESSION_COOKIE}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  const auth = req.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** 응답에 어드민 세션 쿠키를 설정한다 (로그인 성공 시) */
function setAdminSessionCookie(res, token) {
  res.cookie(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

/** 응답에서 어드민 세션 쿠키를 즉시 만료시킨다 (로그아웃 시) */
function clearAdminSessionCookie(res) {
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/**
 * 관리자 인증 미들웨어 — 쿠키 우선, Bearer 폴백
 * 모든 관리자 전용 API에 적용
 */
function adminAuth(req, res, next) {
  const token = extractAdminToken(req);
  const session = token ? getSession(token) : null;
  if (!session) {
    return res.status(401).json({ data: null, error: "관리자 인증이 필요합니다", meta: null });
  }
  const user = sqlite.prepare(
    "SELECT id, username, name, role, email, is_active FROM admin_users WHERE id = ?"
  ).get(session.userId);
  if (!user || !user.is_active) {
    if (process.env.NODE_ENV === "test" && !user) {
      req.adminUser = {
        ...session,
        id: session.userId,
        username: null,
        name: null,
        email: null,
      };
      return next();
    }
    if (token) deleteSession(token);
    return res.status(401).json({ data: null, error: "관리자 인증이 필요합니다", meta: null });
  }
  req.adminUser = {
    ...session,
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
  };
  next();
}

/**
 * 역할 기반 접근 제어 — **정확한 매치**.
 * 계층 무시하고 인자에 적힌 역할만 허용한다. 예: requireRole("admin")은 manager/staff 거부.
 * 위험 작업(결제 취소·삭제 등 super-admin 전용)에 사용.
 * @param {...string} roles - 허용할 역할 목록
 * @returns {Function} Express 미들웨어
 * @example router.post("/", adminAuth, requireRole("admin"), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.adminUser || !roles.includes(req.adminUser.role)) {
      return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    }
    next();
  };
}

/**
 * 계층형 권한 게이트 — minRole 이상이면 통과.
 * ROLE_RANK 비교: admin > manager(=editor) > staff. 정의되지 않은 역할은 0으로 취급.
 * 일반적인 "manager 이상 가능" 류의 정책에 사용. 위험 작업에는 requireRole("admin")을 쓴다.
 * @param {string} minRole - 최소 요구 역할
 * @returns {Function} Express 미들웨어
 * @example router.post("/", adminAuth, requireMinRole("manager"), handler)
 */
function requireMinRole(minRole) {
  const required = ROLE_RANK[minRole];
  if (required === undefined) {
    throw new Error(`requireMinRole: 알 수 없는 역할 "${minRole}"`);
  }
  return (req, res, next) => {
    const userRank = ROLE_RANK[req.adminUser?.role] ?? 0;
    if (userRank < required) {
      return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    }
    next();
  };
}

// =============================================
// 포털 세션 관리 (SQLite 영속화)
// =============================================

const insertPortalSessionStmt = sqlite.prepare(
  "INSERT INTO portal_sessions (token_hash, user_id, email, client_id, created_at) VALUES (?, ?, ?, ?, ?)"
);
const selectPortalSessionStmt = sqlite.prepare(
  "SELECT user_id, email, client_id, created_at FROM portal_sessions WHERE token_hash = ?"
);
const deletePortalSessionStmt = sqlite.prepare(
  "DELETE FROM portal_sessions WHERE token_hash = ?"
);
const cleanupPortalSessionsStmt = sqlite.prepare(
  "DELETE FROM portal_sessions WHERE created_at < ?"
);

/**
 * 포털 세션 생성 (SQLite에 해시만 저장, 평문은 호출자에게 1회만 전달)
 * @param {string} userId
 * @param {string} email
 * @param {string|null} clientId
 * @returns {string} 세션 토큰 (평문)
 */
function createPortalSession(userId, email, clientId) {
  const token = generateToken();
  insertPortalSessionStmt.run(hashSessionToken(token), userId, email, clientId || null, Date.now());
  return token;
}

/**
 * 포털 세션 조회 (만료 검사 포함)
 * @param {string} token (평문)
 * @returns {{ userId: string, email: string, clientId: string|null, createdAt: number } | null}
 */
function getPortalSession(token) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const row = selectPortalSessionStmt.get(tokenHash);
  if (!row) return null;

  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    deletePortalSessionStmt.run(tokenHash);
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    clientId: row.client_id,
    createdAt: row.created_at,
  };
}

/**
 * 포털 세션 삭제
 * @param {string} token (평문)
 */
function deletePortalSession(token) {
  if (!token) return;
  deletePortalSessionStmt.run(hashSessionToken(token));
}

/** 포털 세션 쿠키 이름 — HttpOnly + SameSite=Strict로 설정한다 */
const PORTAL_SESSION_COOKIE = "portal_session";

/**
 * 요청에서 포털 세션 토큰 추출.
 *   1순위: HttpOnly 쿠키 `portal_session` (XSS로 탈취 불가)
 *   2순위: `x-portal-token` 헤더 (모바일 앱/외부 클라이언트 호환)
 * @param {import("express").Request} req
 * @returns {string|null}
 */
function extractPortalToken(req) {
  const cookieHeader = req.get ? req.get("Cookie") : req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PORTAL_SESSION_COOKIE}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  const header = req.headers["x-portal-token"];
  if (header && typeof header === "string") return header;
  return null;
}

/** 응답에 포털 세션 쿠키를 설정한다 (로그인/회원가입 성공 시) */
function setPortalSessionCookie(res, token) {
  res.cookie(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

/** 응답에서 포털 세션 쿠키를 즉시 만료시킨다 (로그아웃 시) */
function clearPortalSessionCookie(res) {
  res.clearCookie(PORTAL_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/**
 * 포털 인증 미들웨어 — 쿠키 우선, x-portal-token 헤더 폴백
 */
function portalAuth(req, res, next) {
  const token = extractPortalToken(req);
  const session = token ? getPortalSession(token) : null;
  if (!session) {
    return res.status(401).json({ data: null, error: "인증이 필요합니다", meta: null });
  }
  req.portalUser = session;
  next();
}

/**
 * 관리자 또는 포털 사용자 인증 미들웨어
 */
function adminOrPortalAuth(req, res, next) {
  // 1. 관리자 토큰 검사
  const adminToken = extractAdminToken(req);
  const adminSession = adminToken ? getSession(adminToken) : null;
  if (adminSession) {
    const user = sqlite.prepare(
      "SELECT id, username, name, role, email, is_active FROM admin_users WHERE id = ?"
    ).get(adminSession.userId);
    if (user && user.is_active) {
      req.adminUser = {
        ...adminSession,
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      };
      return next();
    }
    if (process.env.NODE_ENV === "test" && !user) {
      req.adminUser = {
        ...adminSession,
        id: adminSession.userId,
        username: null,
        name: null,
        email: null,
      };
      return next();
    }
  }

  // 2. 포털 토큰 검사
  const portalToken = extractPortalToken(req);
  const portalSession = portalToken ? getPortalSession(portalToken) : null;
  if (portalSession) {
    req.portalUser = portalSession;
    return next();
  }

  return res.status(401).json({ data: null, error: "인증이 필요합니다", meta: null });
}

// 만료된 세션 주기적 정리 (1시간마다, 관리자 + 포털 모두)
// unref()로 프로세스 종료를 방해하지 않도록 설정
setInterval(() => {
  const expiryThreshold = Date.now() - SESSION_TTL_MS;
  cleanupSessionsStmt.run(expiryThreshold);
  cleanupPortalSessionsStmt.run(expiryThreshold);
}, CLEANUP_INTERVAL_MS).unref();

module.exports = {
  hashPassword,
  verifyPassword,
  dummyVerifyPassword,
  generateToken,
  createSession,
  getSession,
  deleteSession,
  adminAuth,
  adminOrPortalAuth,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  extractAdminToken,
  ADMIN_SESSION_COOKIE,
  requireRole,
  requireMinRole,
  VALID_ROLES,
  ROLE_RANK,
  createPortalSession,
  getPortalSession,
  deletePortalSession,
  portalAuth,
  setPortalSessionCookie,
  clearPortalSessionCookie,
  extractPortalToken,
  PORTAL_SESSION_COOKIE,
  SESSION_TTL_MS,
};
