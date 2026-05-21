/**
 * lib/encryption.js — AES-256-GCM 필드 암호화 유닛 테스트
 *
 * 검증 시나리오:
 *   1) 암복호화 round-trip 정상 동작 (v1 prefix 포함)
 *   2) 신규 v1 ciphertext에는 AAD가 적용되어 다른 행으로 ciphertext 복사 공격이 GCM 검증 실패
 *   3) 구 형식(3-tuple, prefix 없음) ciphertext는 AAD 없이 그대로 복호화됨 (마이그레이션 호환)
 *   4) encryptFields/decryptFields 기본 옵션(aadKey: "id")으로 round-trip
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

beforeAll(() => {
  // 테스트용 고정 키 — 64자 hex (32바이트)
  process.env.ENCRYPTION_KEY = "a".repeat(64);
});

const { encrypt, decrypt, encryptFields, decryptFields } = require("../../lib/encryption");
const crypto = require("node:crypto");

describe("encrypt/decrypt round-trip", () => {
  it("AAD 없이도 암복호화가 정상 동작한다", () => {
    const ct = encrypt("hello world");
    expect(ct).toMatch(/^v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(decrypt(ct)).toBe("hello world");
  });

  it("같은 AAD로 암복호화하면 정상 복원된다", () => {
    const ct = encrypt("01099998888", "client-uuid-123");
    expect(decrypt(ct, "client-uuid-123")).toBe("01099998888");
  });

  it("빈/null 입력은 그대로 통과", () => {
    expect(encrypt("")).toBe("");
    expect(encrypt(null)).toBe(null);
    expect(decrypt("")).toBe("");
    expect(decrypt(null)).toBe(null);
  });
});

describe("AAD 검증 — 행 간 ciphertext 복사 방어", () => {
  it("다른 AAD로 복호화하면 GCM 검증 실패하여 원본 ciphertext가 그대로 반환된다", () => {
    const ct = encrypt("01099998888", "client-A");
    // 공격자가 ciphertext를 그대로 client-B 행에 복사한 시나리오
    const result = decrypt(ct, "client-B");
    expect(result).not.toBe("01099998888");
    // 복호화 실패 시 원본 ciphertext 반환 (비암호화 데이터 호환을 위한 fallback)
    expect(result).toBe(ct);
  });
});

describe("구 형식 (prefix 없는 3-tuple) 호환", () => {
  it("AAD 없이 만든 구 형식 ciphertext도 그대로 복호화된다", () => {
    // 구 형식을 직접 생성 — v1 prefix 제거
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from("a".repeat(64), "hex"), iv);
    const enc = Buffer.concat([cipher.update("legacy data", "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const legacyCt = `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;

    // AAD 인자를 넘겨도 구 형식엔 적용되지 않으므로 정상 복호화돼야 함
    expect(decrypt(legacyCt, "any-aad")).toBe("legacy data");
    expect(decrypt(legacyCt)).toBe("legacy data");
  });
});

describe("encryptFields/decryptFields", () => {
  it("기본 aadKey('id')로 round-trip", () => {
    const obj = { id: "abc-123", phone: "01011112222", email: "u@example.com", name: "홍길동" };
    const enc = encryptFields(obj, ["phone", "email", "name"]);
    expect(enc.phone).not.toBe(obj.phone);
    expect(enc.email).not.toBe(obj.email);
    expect(enc.name).not.toBe(obj.name);
    expect(enc.id).toBe(obj.id);

    const dec = decryptFields(enc, ["phone", "email", "name"]);
    expect(dec.phone).toBe("01011112222");
    expect(dec.email).toBe("u@example.com");
    expect(dec.name).toBe("홍길동");
  });

  it("ciphertext를 다른 id의 행으로 복사하면 복호화 실패하여 평문 노출 차단", () => {
    const a = { id: "row-A", phone: "01011112222" };
    const b = { id: "row-B", phone: null };
    const encA = encryptFields(a, ["phone"]);
    // 공격자가 A 행의 phone ciphertext를 B 행에 그대로 INSERT/UPDATE한 상황
    const tampered = { ...b, phone: encA.phone };
    const dec = decryptFields(tampered, ["phone"]);
    // GCM 검증 실패 → 원본 ciphertext 반환 (평문 X)
    expect(dec.phone).toBe(encA.phone);
    expect(dec.phone).not.toBe("01011112222");
  });
});
