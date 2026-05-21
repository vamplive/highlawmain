/**
 * PII 필드 암호화/복호화 모듈
 * - AES-256-GCM 대칭키 암호화로 고객 개인정보를 DB에 암호화 저장
 * - 환경변수 ENCRYPTION_KEY (32바이트 hex)를 키로 사용
 * - 키 미설정 시 자동 생성 후 경고 (개발용)
 *
 * 듀오 사태 교훈: DB가 유출되더라도 개인정보 원문이 노출되지 않도록
 * 필드 레벨 암호화(Field-Level Encryption)를 적용한다.
 */
const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

/** 암호화 키 로드 (32바이트 = 64 hex chars) */
function getKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }
  // 개발 환경: 임시 키 자동 생성 (경고)
  if (process.env.NODE_ENV === "production") {
    console.error("[FATAL] ENCRYPTION_KEY 환경변수가 필요합니다 (64자 hex).");
    console.error("생성: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    process.exit(1);
  }
  console.warn("[보안 경고] ENCRYPTION_KEY 미설정 — 개발용 임시 키를 사용합니다");
  return crypto.createHash("sha256").update("dev-only-key-do-not-use-in-prod").digest();
}

let _key = null;
function key() {
  if (!_key) _key = getKey();
  return _key;
}

/**
 * 키 버전 prefix — 향후 키 회전 시 새 버전(v2 등)을 추가하면 두 키 동시 지원 가능.
 * decrypt는 prefix를 보고 적절한 키를 선택하므로 마이그레이션 중에도 무중단 운영.
 */
const KEY_VERSION = "v1";

/**
 * 평문을 AES-256-GCM으로 암호화
 * @param {string} plaintext - 암호화할 평문
 * @param {string} [aad] - Additional Authenticated Data. 보통 row의 식별자(예: client.id)를
 *                        넘기면, 다른 행에 ciphertext를 통째로 복사 붙여넣기하는 공격을
 *                        GCM auth tag 검증 단계에서 차단할 수 있다.
 * @returns {string} "v1:iv:tag:ciphertext" (hex 인코딩) — 버전 prefix 포함
 */
function encrypt(plaintext, aad = null) {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  if (aad) cipher.setAAD(Buffer.from(String(aad), "utf8"));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${KEY_VERSION}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * AES-256-GCM 암호문을 복호화
 * 지원 형식:
 *   - "v1:iv:tag:ciphertext" (현재 버전, prefix 포함)
 *   - "iv:tag:ciphertext" (구 버전, prefix 없음 — 호환 유지)
 *   - 그 외 (콜론 없거나 4-tuple 미일치) → 비암호화 평문으로 간주하고 원본 반환
 *
 * @param {string} ciphertext - 위 세 형식 중 하나
 * @param {string} [aad] - 암호화 시 사용한 AAD와 동일한 값. 다르면 GCM 검증 실패 → 원본 반환.
 * @returns {string} 복호화된 평문 (실패 시 원본)
 */
function decrypt(ciphertext, aad = null) {
  if (!ciphertext) return ciphertext;
  if (!ciphertext.includes(":")) return ciphertext;
  const parts = ciphertext.split(":");

  let iv, tag, encrypted;
  let useAad = false;
  if (parts.length === 4 && parts[0] === KEY_VERSION) {
    // 신규 형식 — 키 버전 prefix 포함. AAD 검증 활성화.
    iv = Buffer.from(parts[1], "hex");
    tag = Buffer.from(parts[2], "hex");
    encrypted = Buffer.from(parts[3], "hex");
    useAad = true;
  } else if (parts.length === 3) {
    // 구 형식 — prefix 없음. 기존에 AAD 없이 암호화된 데이터이므로 AAD 미사용 (호환).
    iv = Buffer.from(parts[0], "hex");
    tag = Buffer.from(parts[1], "hex");
    encrypted = Buffer.from(parts[2], "hex");
    useAad = false;
  } else {
    return ciphertext; // 형식 미일치 — 비암호화로 간주
  }

  try {
    const decipher = crypto.createDecipheriv(ALGO, key(), iv);
    if (useAad && aad) decipher.setAAD(Buffer.from(String(aad), "utf8"));
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    // 복호화 실패 시 원본 반환 — 비암호화 데이터 또는 AAD 불일치(다른 행에서 복사된 ciphertext)
    return ciphertext;
  }
}

/**
 * 객체의 특정 필드들을 암호화
 * @param {object} obj - 원본 객체
 * @param {string[]} fields - 암호화할 필드명 배열
 * @param {object} [opts]
 * @param {string} [opts.aadKey="id"] - AAD로 사용할 obj 내 식별자 키. 행 간 ciphertext 복사 방어.
 *                                       해당 키 값이 없으면 AAD 없이 암호화 (구 호환).
 * @returns {object} 암호화된 객체 (원본 불변)
 */
function encryptFields(obj, fields, opts = {}) {
  if (!obj) return obj;
  const aadKey = opts.aadKey || "id";
  const aad = obj[aadKey] != null ? String(obj[aadKey]) : null;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) result[field] = encrypt(result[field], aad);
  }
  return result;
}

/**
 * 객체의 특정 필드들을 복호화
 * @param {object} obj - 암호화된 객체
 * @param {string[]} fields - 복호화할 필드명 배열
 * @param {object} [opts]
 * @param {string} [opts.aadKey="id"] - 암호화 시 사용한 AAD 키.
 * @returns {object} 복호화된 객체 (원본 불변)
 */
function decryptFields(obj, fields, opts = {}) {
  if (!obj) return obj;
  const aadKey = opts.aadKey || "id";
  const aad = obj[aadKey] != null ? String(obj[aadKey]) : null;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) result[field] = decrypt(result[field], aad);
  }
  return result;
}

/** 고객 PII 필드 목록 */
const CLIENT_PII_FIELDS = ["phone", "email", "name"];
/** 상담 PII 필드 목록 */
const CONSULTATION_PII_FIELDS = ["phone", "email", "name"];

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  CLIENT_PII_FIELDS,
  CONSULTATION_PII_FIELDS,
};
