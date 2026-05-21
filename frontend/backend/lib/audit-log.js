/**
 * 관리자 행위 감사 로그 (Audit Log)
 * - 듀오 사태 교훈: 누가 언제 어떤 데이터에 접근했는지 추적 가능해야 함
 * - admin 계정의 모든 쓰기 작업(생성/수정/삭제)을 기록
 * - 개인정보 조회도 기록 (접근 이력 관리)
 */
const path = require("path");
const fs = require("fs");

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const AUDIT_DIR = path.join(STORAGE_PATH, "audit");
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

/**
 * 감사 로그 기록
 * @param {object} params
 * @param {string} params.action - 행위 (create, update, delete, read, login, logout)
 * @param {string} params.resource - 대상 리소스 (clients, consultations, lawyers 등)
 * @param {string} params.resourceId - 대상 ID
 * @param {string} params.userId - 행위자 ID
 * @param {string} params.userName - 행위자 이름
 * @param {string} params.ip - 요청 IP
 * @param {object} [params.details] - 추가 상세 (변경 전후 등)
 */
function logAudit({ action, resource, resourceId, userId, userName, ip, details }) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    resourceId: resourceId || null,
    userId: userId || "system",
    userName: userName || "system",
    ip: ip || "unknown",
    details: details || null,
  };

  // 파일 기반 로그 (일별 파일)
  const dateStr = new Date().toISOString().slice(0, 10);
  const logFile = path.join(AUDIT_DIR, `audit-${dateStr}.jsonl`);

  try {
    fs.appendFileSync(logFile, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("[audit] 로그 기록 실패:", err.message);
  }
}

/**
 * Express 미들웨어 — 관리자 API 호출 시 자동 감사 로그
 * adminAuth 뒤에 배치하면 req.adminUser가 존재함
 */
function auditMiddleware(resource) {
  return (req, res, next) => {
    // 응답 완료 후 로그 기록 (성공한 요청만)
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400 && req.method !== "GET") {
        const action = req.method === "POST" ? "create"
          : req.method === "PATCH" || req.method === "PUT" ? "update"
          : req.method === "DELETE" ? "delete" : "other";

        logAudit({
          action,
          resource,
          resourceId: req.params.id || req.params.idOrSlug || null,
          userId: req.adminUser?.id,
          userName: req.adminUser?.name,
          ip: req.ip,
          details: action === "delete" ? null : { fields: Object.keys(req.body || {}) },
        });
      }
      return originalJson(body);
    };
    next();
  };
}

/**
 * PII 접근 로그 — 고객 개인정보 조회 시 기록
 */
function logPiiAccess(req, resource, resourceId) {
  logAudit({
    action: "pii_access",
    resource,
    resourceId,
    userId: req.adminUser?.id,
    userName: req.adminUser?.name,
    ip: req.ip,
  });
}

/**
 * 계약서 이벤트 로그 — contract_audit_logs 테이블에 기록
 * routes/contracts.js + routes/public-sign.js 가 사용하는 계약 단위 감사 이력.
 * (logAudit는 파일 기반 일반 감사로그, 이쪽은 계약별 DB 기록으로 별도 운영)
 */
let _sqlite = null;
function getSqlite() {
  // 순환 참조 방지: db/index.js 가 lib/* 를 require 하므로 lazy 로드
  if (!_sqlite) ({ sqlite: _sqlite } = require("../db"));
  return _sqlite;
}

function logEvent({ contractId, partyId, invitationId, actorType, actorIdentifier, action, details, req }) {
  try {
    const id = require("crypto").randomUUID();
    const ip = req?.ip || null;
    const userAgent = req?.get?.("user-agent") || null;
    getSqlite().prepare(`
      INSERT INTO contract_audit_logs
        (id, contract_id, party_id, invitation_id, actor_type, actor_identifier, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      contractId || null,
      partyId || null,
      invitationId || null,
      actorType,
      actorIdentifier || null,
      action,
      details ? JSON.stringify(details) : null,
      ip,
      userAgent
    );
  } catch (err) {
    console.error("[audit-log] logEvent 실패:", err.message);
  }
}

function listByContract(contractId, limit = 200) {
  try {
    const rows = getSqlite().prepare(`
      SELECT * FROM contract_audit_logs
      WHERE contract_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(contractId, limit);
    return rows.map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
  } catch (err) {
    console.error("[audit-log] listByContract 실패:", err.message);
    return [];
  }
}

/**
 * 보안 이벤트 전용 로거 — 인증 실패, CSRF 거부, rate-limit 트립처럼
 * "공격이 시도되었을 때 우리가 알아야 하는" 이벤트를 별도 카테고리로 남긴다.
 *
 * 일반 audit 로그(logAudit)와 같은 파일에 기록하되 resource="security"로 분류해
 * `grep '"resource":"security"' audit-YYYY-MM-DD.jsonl` 한 줄로 사후 분석 가능하게 한다.
 *
 * action 컨벤션 (점 표기로 카테고리·서브타입 분리):
 *   - login_fail.no_user / login_fail.bad_password / login_fail.inactive
 *   - portal_login_fail.invalid
 *   - csrf_reject
 *   - rate_limit_hit.{login|forgot_password|api}
 *
 * @param {import('express').Request} req
 * @param {string} action
 * @param {object} [details] - 추가 컨텍스트 (예: 시도한 username, 경로)
 */
function logSecurityEvent(req, action, details = null) {
  logAudit({
    action,
    resource: "security",
    resourceId: null,
    userId: req?.adminUser?.id || req?.portalUser?.id,
    userName: req?.adminUser?.name || req?.portalUser?.name,
    ip: req?.ip,
    details: {
      path: req?.originalUrl || req?.url,
      method: req?.method,
      ua: req?.get?.("user-agent") || null,
      ...(details || {}),
    },
  });
}

module.exports = { logAudit, auditMiddleware, logPiiAccess, logEvent, listByContract, logSecurityEvent };
