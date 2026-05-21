/**
 * ip-privacy.js 단위 테스트
 * - maskIp: IPv4 마지막 옥텟 0 치환, IPv6 /64 prefix 보존
 * - hashIp: 일자별 salt 기반 해시 — 같은 일자/IP는 같은 해시, 다른 일자는 다른 해시
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";

const ORIGINAL_SALT = process.env.ANALYTICS_IP_SALT;

beforeEach(() => {
  process.env.ANALYTICS_IP_SALT = "test-salt";
});

afterAll(() => {
  if (ORIGINAL_SALT === undefined) delete process.env.ANALYTICS_IP_SALT;
  else process.env.ANALYTICS_IP_SALT = ORIGINAL_SALT;
});

describe("maskIp", () => {
  let maskIp;
  beforeEach(async () => {
    ({ maskIp } = await import("../../lib/ip-privacy.js"));
  });

  it("IPv4 마지막 옥텟을 0으로 치환한다", () => {
    expect(maskIp("1.2.3.4")).toBe("1.2.3.0");
    expect(maskIp("203.0.113.55")).toBe("203.0.113.0");
  });

  it("IPv4-mapped IPv6 prefix(::ffff:)를 제거한 뒤 마스킹한다", () => {
    expect(maskIp("::ffff:10.0.0.7")).toBe("10.0.0.0");
  });

  it("IPv6는 앞 4 hextet(/64)만 유지하고 뒤를 ::로 절단한다", () => {
    expect(maskIp("2001:db8:1:2:3:4:5:6")).toBe("2001:db8:1:2::");
    expect(maskIp("2001:db8::1")).toBe("2001:db8::");
    expect(maskIp("fe80::1")).toBe("fe80::");
  });

  it("빈 입력이나 잘못된 입력은 빈 문자열을 반환한다", () => {
    expect(maskIp("")).toBe("");
    expect(maskIp(undefined)).toBe("");
    expect(maskIp(null)).toBe("");
    expect(maskIp("not-an-ip")).toBe("");
  });
});

describe("hashIp", () => {
  let hashIp;
  beforeEach(async () => {
    ({ hashIp } = await import("../../lib/ip-privacy.js"));
  });

  it("16자 hex 문자열을 반환한다", () => {
    const h = hashIp("1.2.3.4", "2026-05-06");
    expect(h).toMatch(/^[a-f0-9]{16}$/);
  });

  it("같은 IP + 같은 일자는 같은 해시", () => {
    const a = hashIp("1.2.3.4", "2026-05-06");
    const b = hashIp("1.2.3.4", "2026-05-06");
    expect(a).toBe(b);
  });

  it("같은 IP라도 일자가 바뀌면 다른 해시 (장기 추적 불가)", () => {
    const a = hashIp("1.2.3.4", "2026-05-06");
    const b = hashIp("1.2.3.4", "2026-05-07");
    expect(a).not.toBe(b);
  });

  it("다른 IP는 같은 일자라도 다른 해시", () => {
    const a = hashIp("1.2.3.4", "2026-05-06");
    const b = hashIp("1.2.3.5", "2026-05-06");
    expect(a).not.toBe(b);
  });

  it("빈 입력은 빈 문자열을 반환한다", () => {
    expect(hashIp("", "2026-05-06")).toBe("");
    expect(hashIp(undefined, "2026-05-06")).toBe("");
  });

  it("dateStr 미지정 시 현재 UTC 일자를 사용한다", () => {
    const today = new Date().toISOString().slice(0, 10);
    const a = hashIp("1.2.3.4");
    const b = hashIp("1.2.3.4", today);
    expect(a).toBe(b);
  });
});
