/**
 * sentry.js — beforeSend(sanitizeEvent) PII 마스킹 유닛 테스트.
 *
 * Sentry로 전송되는 이벤트에 password/token/phone/email 등의 PII가
 * 평문으로 흘러가지 않는지 확인한다.
 */
import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { sanitizeEvent, redactSensitive, maskIp } = require("../../lib/sentry");

const REDACTED = "[REDACTED]";

describe("redactSensitive", () => {
  it("최상위 password/token 키를 마스킹한다", () => {
    const out = redactSensitive({ password: "p", token: "t", name: "홍길동" });
    expect(out.password).toBe(REDACTED);
    expect(out.token).toBe(REDACTED);
    expect(out.name).toBe("홍길동");
  });

  it("중첩 객체의 phone/email을 재귀 마스킹한다", () => {
    const out = redactSensitive({
      user: { email: "a@b.c", phone: "010-1234-5678", id: 1 },
      meta: { ok: true },
    });
    expect(out.user.email).toBe(REDACTED);
    expect(out.user.phone).toBe(REDACTED);
    expect(out.user.id).toBe(1);
    expect(out.meta.ok).toBe(true);
  });

  it("배열 내부 객체도 마스킹한다", () => {
    const out = redactSensitive({
      list: [{ password: "x" }, { ok: 1 }],
    });
    expect(out.list[0].password).toBe(REDACTED);
    expect(out.list[1].ok).toBe(1);
  });

  it("키 비교는 대소문자 무시", () => {
    const out = redactSensitive({ Password: "x", PhoneNumber: "y" });
    expect(out.Password).toBe(REDACTED);
    expect(out.PhoneNumber).toBe(REDACTED);
  });

  it("순환 참조에 빠지지 않는다", () => {
    const obj = { a: 1 };
    obj.self = obj;
    expect(() => redactSensitive(obj)).not.toThrow();
  });
});

describe("maskIp", () => {
  it("IPv4 마지막 옥텟을 0으로 치환", () => {
    expect(maskIp("203.0.113.42")).toBe("203.0.113.0");
  });

  it("IPv6 prefix 64비트만 유지", () => {
    const masked = maskIp("2001:db8:85a3:1:abcd:1234:5678:9abc");
    expect(masked).toBe("2001:db8:85a3:1:0:0:0:0");
  });

  it("빈 값/비문자열은 그대로 반환", () => {
    expect(maskIp("")).toBe("");
    expect(maskIp(null)).toBe(null);
  });
});

describe("sanitizeEvent", () => {
  it("request.headers의 cookie/authorization/csrf/portal-token을 마스킹", () => {
    const event = {
      request: {
        headers: {
          cookie: "session=abc",
          authorization: "Bearer xxx",
          "x-csrf-token": "csrf",
          "x-portal-token": "portal",
          "user-agent": "Mozilla",
        },
      },
    };
    const out = sanitizeEvent(event);
    expect(out.request.headers.cookie).toBe(REDACTED);
    expect(out.request.headers.authorization).toBe(REDACTED);
    expect(out.request.headers["x-csrf-token"]).toBe(REDACTED);
    expect(out.request.headers["x-portal-token"]).toBe(REDACTED);
    expect(out.request.headers["user-agent"]).toBe("Mozilla");
  });

  it("request.data(body)의 password/token/phone/email/birthdate/cardNumber/ssn 마스킹", () => {
    const event = {
      request: {
        data: {
          username: "alice",
          password: "p@ss",
          token: "tok",
          phone: "010-1111-2222",
          email: "a@b.c",
          birthdate: "1990-01-01",
          cardNumber: "4111111111111111",
          ssn: "900101-1234567",
          nested: { newPassword: "n" },
        },
      },
    };
    const out = sanitizeEvent(event);
    const d = out.request.data;
    expect(d.username).toBe("alice");
    expect(d.password).toBe(REDACTED);
    expect(d.token).toBe(REDACTED);
    expect(d.phone).toBe(REDACTED);
    expect(d.email).toBe(REDACTED);
    expect(d.birthdate).toBe(REDACTED);
    expect(d.cardNumber).toBe(REDACTED);
    expect(d.ssn).toBe(REDACTED);
    expect(d.nested.newPassword).toBe(REDACTED);
  });

  it("query_string 문자열에서 password/token 파라미터 마스킹", () => {
    const event = {
      request: { query_string: "q=law&password=secret&token=abc&page=2" },
    };
    const out = sanitizeEvent(event);
    expect(out.request.query_string).toContain("q=law");
    expect(out.request.query_string).toContain(`password=${REDACTED}`);
    expect(out.request.query_string).toContain(`token=${REDACTED}`);
    expect(out.request.query_string).toContain("page=2");
  });

  it("request.cookies 전체를 [REDACTED]로 치환", () => {
    const event = { request: { cookies: { sid: "abc", csrf: "x" } } };
    const out = sanitizeEvent(event);
    expect(out.request.cookies).toBe(REDACTED);
  });

  it("user.ip_address를 마스킹한다", () => {
    const event = { user: { id: "u1", ip_address: "203.0.113.42" } };
    const out = sanitizeEvent(event);
    expect(out.user.id).toBe("u1");
    expect(out.user.ip_address).toBe("203.0.113.0");
  });

  it("user.email/phone도 마스킹", () => {
    const event = { user: { email: "a@b.c", phone: "010-1" } };
    const out = sanitizeEvent(event);
    expect(out.user.email).toBe(REDACTED);
    expect(out.user.phone).toBe(REDACTED);
  });

  it("extra/contexts 내부 PII도 재귀 마스킹", () => {
    const event = {
      extra: { body: { password: "x" } },
      contexts: { custom: { token: "t" } },
    };
    const out = sanitizeEvent(event);
    expect(out.extra.body.password).toBe(REDACTED);
    expect(out.contexts.custom.token).toBe(REDACTED);
  });

  it("event가 비어 있어도 예외 없이 반환", () => {
    expect(sanitizeEvent(null)).toBe(null);
    expect(sanitizeEvent({})).toEqual({});
  });
});
