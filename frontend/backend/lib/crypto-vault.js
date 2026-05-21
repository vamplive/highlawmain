/**
 * crypto-vault — 민감 시크릿(예: TOTP secret) 전용 AES-256-GCM 암호화 모듈
 *
 * 설계 의도:
 *   - DB 백업이 유출되더라도 admin_users.totp_secret 같은 2FA 시드가 즉시 복원되지 않도록
 *     필드 레벨 암호화를 적용한다.
 *   - 기존 lib/encryption.js 는 고객 PII(전화·이메일·이름) 용도로 분화되어 있고
 *     AAD(행 식별자) 결합 정책이 다르다. TOTP 시크릿은 admin_user 행의 id와 묶기 어려운
 *     수명주기(셀프 등록 → 검증 단계에서 row id 미정 등)가 있으므로 AAD를 강제하지 않는
 *     별도의 vault 모듈을 사용한다. 키는 동일 인프라(SECRETS_ENCRYPTION_KEY)이지만
 *     의미적 분리가 가능하다.
 *
 * 저장 포맷: "v1:<iv_hex>:<ciphertext_hex>:<tag_hex>"
 *   - 12바이트 IV (GCM 권장)
 *   - 16바이트 auth tag
 *   - 평문(legacy)은 prefix 없이 그대로 저장된 상태일 수 있으므로 decryptSecret은
 *     prefix가 없으면 원본을 그대로 반환 (마이그레이션 호환).
 */
const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_VERSION = "v1";

/**
 * 32바이트 키를 환경변수에서 로드한다.
 *  1순위: SECRETS_ENCRYPTION_KEY (32바이트 = 64 hex 또는 44 base64)
 *  2순위: APP_SECRET / ADMIN_SESSION_SECRET 에서 scrypt(salt="yjlaw-secrets-vault/v1") 도출
 *  실패: NODE_ENV !== "test" 면 즉시 throw. 테스트 환경에서는 임시 키 생성(경고).
 */
function loadKey() {
  const direct = process.env.SECRETS_ENCRYPTION_KEY;
  if (direct && typeof direct === "string") {
    const trimmed = direct.trim();
    // 64자 hex
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    // base64 (32바이트 = 44자, 패딩 포함)
    try {
      const decoded = Buffer.from(trimmed, "base64");
      if (decoded.length === 32) return decoded;
    } catch {
      // ignore
    }
    throw new Error(
      "SECRETS_ENCRYPTION_KEY 형식이 올바르지 않습니다. 32바이트 hex(64자) 또는 base64(32바이트) 필요"
    );
  }

  const fallback = process.env.APP_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (fallback && typeof fallback === "string" && fallback.length > 0) {
    // scrypt 도출 — APP_SECRET 자체가 충분히 길지 않을 수 있으므로 KDF로 32바이트 정규화
    return crypto.scryptSync(fallback, "yjlaw-secrets-vault/v1", 32);
  }

  if (process.env.NODE_ENV === "test") {
    // 테스트 환경에서만 임시 키 허용 (CI/단위 테스트가 SECRETS_ENCRYPTION_KEY 없이도 동작하도록)
    return crypto.scryptSync("test-only-vault-key", "yjlaw-secrets-vault/test", 32);
  }

  throw new Error(
    "[crypto-vault] SECRETS_ENCRYPTION_KEY (또는 APP_SECRET/ADMIN_SESSION_SECRET) 환경변수가 필요합니다. " +
      "생성: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

let _key = null;
/** 키를 lazy 로드 — require 시점이 아닌 첫 사용 시점에 검증 (테스트 환경 setup 순서 유연) */
function key() {
  if (!_key) _key = loadKey();
  return _key;
}

/**
 * 평문이 v1 포맷 ciphertext 인지 빠르게 확인.
 * @param {string} stored
 * @returns {boolean}
 */
function isEncrypted(stored) {
  if (!stored || typeof stored !== "string") return false;
  // "v1:" + 24자 IV(hex) 이상부터는 무조건 50자 넘음 — 정밀 검증은 split 결과로
  if (!stored.startsWith(`${KEY_VERSION}:`)) return false;
  const parts = stored.split(":");
  if (parts.length !== 4) return false;
  // 빈 세그먼트 차단
  return parts[1].length > 0 && parts[2].length > 0 && parts[3].length > 0;
}

/**
 * 평문 시크릿을 v1 포맷으로 암호화한다.
 * @param {string} plaintext - 비어있지 않은 문자열
 * @returns {string} "v1:<iv_hex>:<ciphertext_hex>:<tag_hex>"
 */
function encryptSecret(plaintext) {
  if (plaintext == null) return plaintext;
  if (typeof plaintext !== "string") {
    throw new TypeError("encryptSecret: 평문은 문자열이어야 합니다");
  }
  if (plaintext.length === 0) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${KEY_VERSION}:${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/**
 * 저장값을 복호화한다.
 *   - v1 prefix 가 있으면 GCM 복호화 (auth tag 검증 실패 시 throw)
 *   - prefix 없으면 평문(legacy)으로 간주하고 그대로 반환 — 마이그레이션 호환
 *   - 빈/null 입력은 그대로 반환
 *
 * @param {string|null} stored
 * @returns {string|null}
 */
function decryptSecret(stored) {
  if (stored == null) return stored;
  if (typeof stored !== "string") {
    throw new TypeError("decryptSecret: 저장값은 문자열이어야 합니다");
  }
  if (stored.length === 0) return stored;
  if (!isEncrypted(stored)) {
    // 레거시 평문 — 마이그레이션 전 데이터를 검증 없이 통과시킨다
    return stored;
  }

  const [, ivHex, encHex, tagHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  // tag 검증 실패 시 final() 단계에서 throw — 호출부에서 catch 하여 처리
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

module.exports = {
  encryptSecret,
  decryptSecret,
  isEncrypted,
};
