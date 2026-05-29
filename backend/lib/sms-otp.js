/**
 * SMS OTP (1회용 비밀번호) 인증 유틸
 * - 6자리 숫자 코드 생성 → bcrypt 대신 crypto.scrypt로 해시 저장 (평문 저장 금지)
 * - 유효기간 3분, 재발송 쿨다운 60초, 최대 5회 시도
 * - identity_verifications 테이블에 저장
 *
 * 흐름:
 *   1. requestOtp(contextType, contextId, phoneNumber) → 코드 생성 + SMS 발송
 *   2. verifyOtp(verificationId, code) → 일치 시 verifiedAt 기록
 */
const crypto = require("crypto");
const { sqlite } = require("../db");
const { sendSMS } = require("./sms-service");

/** OTP 유효 기간 (밀리초) */
const OTP_TTL_MS = 3 * 60 * 1000; // 3분
/** 재발송 쿨다운 (밀리초) */
const RESEND_COOLDOWN_MS = 60 * 1000; // 1분
/** 최대 시도 횟수 */
const MAX_ATTEMPTS = 5;

/** 6자리 숫자 OTP 생성 (앞자리 0 허용) */
function generateCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

/** 코드 해싱 (scrypt — 시간일정 비교를 위해) */
function hashCode(code) {
  return crypto.scryptSync(code, "yj-otp-salt", 32).toString("hex");
}

/** 해시 비교 (타이밍 공격 방지) */
function compareCode(code, stored) {
  const verify = hashCode(code);
  if (verify.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(verify, "hex"), Buffer.from(stored, "hex"));
}

/** 전화번호 E.164-like 정규화 (하이픈/공백 제거, 010... 형태 유지) */
function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[-\s]/g, "");
}

/** 전화번호 뒷 4자리 추출 */
function getLast4(phone) {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return digits.slice(-4);
}

const insertVerificationStmt = sqlite.prepare(`
  INSERT INTO identity_verifications (
    id, context_type, context_id, method, phone_number, phone_last4,
    challenge_hash, challenge_expires_at, attempts_used, max_attempts,
    ip_address, user_agent, created_at
  ) VALUES (?, ?, ?, 'sms_otp', ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'))
`);

const selectLatestByContextStmt = sqlite.prepare(`
  SELECT * FROM identity_verifications
  WHERE context_type = ? AND context_id = ? AND method = 'sms_otp'
  ORDER BY created_at DESC LIMIT 1
`);

const selectByIdStmt = sqlite.prepare(`
  SELECT * FROM identity_verifications WHERE id = ?
`);

const incrementAttemptsStmt = sqlite.prepare(`
  UPDATE identity_verifications SET attempts_used = attempts_used + 1 WHERE id = ?
`);

const markVerifiedStmt = sqlite.prepare(`
  UPDATE identity_verifications SET verified_at = datetime('now'), verified_name = ? WHERE id = ?
`);

/**
 * OTP 발송 요청
 * - 같은 context로 최근 60초 이내에 발송한 내역이 있으면 거부
 *
 * @param {object} opts - { contextType, contextId, phoneNumber, req?, dryRun? }
 * @returns {Promise<{ verificationId: string, expiresAt: number, sentTo: string }>}
 */
async function requestOtp(opts) {
  const { contextType, contextId, phoneNumber, req, dryRun } = opts;
  if (!contextType || !contextId || !phoneNumber) {
    throw new Error("contextType, contextId, phoneNumber 가 필요합니다");
  }

  // 쿨다운 체크
  const latest = selectLatestByContextStmt.get(contextType, contextId);
  if (latest && latest.created_at) {
    const latestTime = new Date(latest.created_at + "Z").getTime();
    if (!Number.isNaN(latestTime) && Date.now() - latestTime < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latestTime)) / 1000);
      const err = new Error(`인증번호는 ${wait}초 후 재발송 가능합니다`);
      err.status = 429;
      throw err;
    }
  }

  const code = generateCode();
  const challengeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const id = crypto.randomUUID();
  const normalized = normalizePhone(phoneNumber);
  const last4 = getLast4(phoneNumber);
  const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || null;
  const ua = req?.get?.("user-agent") || null;

  insertVerificationStmt.run(
    id, contextType, contextId, normalized, last4,
    challengeHash, expiresAt, MAX_ATTEMPTS, ip, ua,
  );

  const text = `[법무법인 하이로] 서명 인증번호: ${code} (3분 유효)`;

  if (dryRun) {
    return { verificationId: id, expiresAt: Date.now() + OTP_TTL_MS, sentTo: `***-${last4}`, devCode: code };
  }

  const result = await sendSMS(normalized, text);
  if (!result.success) {
    const err = new Error(result.error || "SMS 발송 실패");
    err.status = 502;
    throw err;
  }

  return { verificationId: id, expiresAt: Date.now() + OTP_TTL_MS, sentTo: `***-${last4}` };
}

/**
 * OTP 검증
 * @param {string} verificationId
 * @param {string} code
 * @param {object} [opts] - { verifiedName }
 * @returns {{ ok: true, row: object } | { ok: false, reason: string, remaining?: number }}
 */
function verifyOtp(verificationId, code, opts = {}) {
  if (!verificationId || !code) return { ok: false, reason: "입력값 누락" };
  const row = selectByIdStmt.get(verificationId);
  if (!row) return { ok: false, reason: "인증 세션을 찾을 수 없습니다" };
  if (row.verified_at) return { ok: true, row };

  // 만료
  const exp = new Date((row.challenge_expires_at || "") + (row.challenge_expires_at?.includes("Z") ? "" : "Z")).getTime();
  if (Number.isNaN(exp) || Date.now() > exp) {
    return { ok: false, reason: "인증번호가 만료되었습니다" };
  }

  // 시도 초과
  if (row.attempts_used >= row.max_attempts) {
    return { ok: false, reason: "시도 횟수를 초과했습니다" };
  }

  const matched = compareCode(String(code).trim(), row.challenge_hash);
  incrementAttemptsStmt.run(verificationId);

  if (!matched) {
    const remaining = row.max_attempts - (row.attempts_used + 1);
    return { ok: false, reason: "인증번호가 일치하지 않습니다", remaining: Math.max(0, remaining) };
  }

  markVerifiedStmt.run(opts.verifiedName || null, verificationId);
  return { ok: true, row: selectByIdStmt.get(verificationId) };
}

/** verificationId가 verified 상태인지 */
function isVerified(verificationId) {
  if (!verificationId) return false;
  const row = selectByIdStmt.get(verificationId);
  return !!(row && row.verified_at);
}

module.exports = {
  requestOtp,
  verifyOtp,
  isVerified,
  normalizePhone,
  getLast4,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
};
