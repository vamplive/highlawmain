/**
 * lib/crypto-vault.js 유닛 테스트
 *
 * 검증 시나리오:
 *   1) encrypt → decrypt round-trip 동일성
 *   2) 레거시 평문(접두사 없음) 입력은 그대로 반환 (마이그레이션 호환)
 *   3) 동일 평문 두 번 암호화 시 IV 가 달라 ciphertext 가 서로 다름
 *   4) 변조된 ciphertext 복호화 시 throw (GCM auth tag 검증)
 *   5) NODE_ENV !== "test" 이고 키 환경변수 미설정이면 require/사용 시 에러
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

beforeAll(() => {
  // 테스트용 고정 키 — 64자 hex (32바이트). NODE_ENV=test 자동 폴백도 가능하지만
  // 명시적 키로 운영 환경과 동일한 코드 경로를 검증한다.
  process.env.SECRETS_ENCRYPTION_KEY = "b".repeat(64);
});

const { encryptSecret, decryptSecret, isEncrypted } = require("../../lib/crypto-vault");

describe("crypto-vault: round-trip", () => {
  it("암호화 후 복호화하면 원본과 동일하다", () => {
    const plaintext = "JBSWY3DPEHPK3PXP"; // 가짜 base32 TOTP 시드
    const ct = encryptSecret(plaintext);
    expect(ct).toMatch(/^v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(isEncrypted(ct)).toBe(true);
    expect(decryptSecret(ct)).toBe(plaintext);
  });

  it("빈 문자열·null 입력은 그대로 통과한다", () => {
    expect(encryptSecret("")).toBe("");
    expect(encryptSecret(null)).toBe(null);
    expect(decryptSecret("")).toBe("");
    expect(decryptSecret(null)).toBe(null);
  });
});

describe("crypto-vault: 레거시 평문 호환", () => {
  it("v1 접두사 없는 값은 평문(legacy)으로 간주하고 그대로 반환한다", () => {
    const legacy = "PLAINTEXTSECRET123";
    expect(isEncrypted(legacy)).toBe(false);
    expect(decryptSecret(legacy)).toBe(legacy);
  });

  it("isEncrypted 는 형식이 어긋난 v1 문자열을 false 로 반환한다", () => {
    expect(isEncrypted("v1:")).toBe(false);
    expect(isEncrypted("v1:abc:def")).toBe(false); // 4-tuple 미일치
    expect(isEncrypted("v2:aa:bb:cc")).toBe(false); // 다른 버전
  });
});

describe("crypto-vault: IV 무작위성", () => {
  it("동일 평문을 두 번 암호화하면 IV 와 ciphertext 가 서로 다르다", () => {
    const a = encryptSecret("same-secret");
    const b = encryptSecret("same-secret");
    expect(a).not.toBe(b);
    // round-trip 은 둘 다 정상
    expect(decryptSecret(a)).toBe("same-secret");
    expect(decryptSecret(b)).toBe("same-secret");
  });
});

describe("crypto-vault: 변조 검출", () => {
  it("ciphertext 일부를 바꾸면 GCM 검증 실패로 throw 한다", () => {
    const ct = encryptSecret("untampered");
    const parts = ct.split(":");
    // ciphertext hex 의 마지막 글자 1개를 다른 hex 로 변조
    const last = parts[2];
    const flipped = last.slice(0, -1) + (last.endsWith("a") ? "b" : "a");
    parts[2] = flipped;
    const tampered = parts.join(":");

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("auth tag 변조도 throw 한다", () => {
    const ct = encryptSecret("untampered");
    const parts = ct.split(":");
    const tag = parts[3];
    parts[3] = tag.slice(0, -1) + (tag.endsWith("a") ? "b" : "a");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });
});

describe("crypto-vault: 키 미설정 가드", () => {
  it("프로덕션 환경에서 키 미설정이면 사용 시 에러를 던진다", () => {
    // 깨끗한 환경에서 다시 require — vitest 모듈 캐시 우회
    const isolatedRequire = createRequire(import.meta.url);
    delete require.cache[isolatedRequire.resolve("../../lib/crypto-vault")];

    const prevKey = process.env.SECRETS_ENCRYPTION_KEY;
    const prevApp = process.env.APP_SECRET;
    const prevAdmin = process.env.ADMIN_SESSION_SECRET;
    const prevEnv = process.env.NODE_ENV;
    delete process.env.SECRETS_ENCRYPTION_KEY;
    delete process.env.APP_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;
    process.env.NODE_ENV = "production";

    try {
      const fresh = isolatedRequire("../../lib/crypto-vault");
      expect(() => fresh.encryptSecret("anything")).toThrow(/SECRETS_ENCRYPTION_KEY/);
    } finally {
      process.env.SECRETS_ENCRYPTION_KEY = prevKey;
      if (prevApp !== undefined) process.env.APP_SECRET = prevApp;
      if (prevAdmin !== undefined) process.env.ADMIN_SESSION_SECRET = prevAdmin;
      process.env.NODE_ENV = prevEnv;
      // 모듈 캐시 초기화 — 다른 테스트가 영향받지 않도록
      delete require.cache[isolatedRequire.resolve("../../lib/crypto-vault")];
    }
  });
});
