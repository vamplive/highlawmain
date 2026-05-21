/**
 * lib/csrf.js 단위 테스트
 * - CSRF 미들웨어 동작 검증 (mock req/res/next)
 */
import { describe, it, expect, vi } from "vitest";
import csrfProtection from "../../lib/csrf.js";

/** Express req 모의 객체 생성 */
function mockReq(overrides = {}) {
  const headers = overrides.headers || {};
  return {
    method: overrides.method || "GET",
    path: overrides.path || "/",
    get: (name) => headers[name] || headers[name.toLowerCase()] || undefined,
    ...overrides,
  };
}

/** Express res 모의 객체 생성 */
function mockRes() {
  const res = {
    statusCode: 200,
    cookies: {},
    body: null,
    status: vi.fn((code) => { res.statusCode = code; return res; }),
    json: vi.fn((data) => { res.body = data; return res; }),
    cookie: vi.fn((name, value, opts) => { res.cookies[name] = { value, opts }; }),
  };
  return res;
}

/** 현재 미들웨어로 유효한 csrf-token을 발급받는다 */
function issueToken() {
  const req = mockReq({ method: "GET" });
  const res = mockRes();
  const next = vi.fn();

  csrfProtection(req, res, next);

  return res.cookies["csrf-token"]?.value;
}

describe("csrfProtection 미들웨어", () => {
  it("GET 요청 시 csrf-token 쿠키를 설정한다", () => {
    const req = mockReq({ method: "GET" });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "csrf-token",
      expect.any(String),
      expect.objectContaining({ sameSite: "Strict", path: "/" })
    );
    expect(next).toHaveBeenCalled();
  });

  it("GET 요청 시 이미 유효한 csrf-token 쿠키가 있으면 새로 설정하지 않는다", () => {
    const token = issueToken();
    const req = mockReq({
      method: "GET",
      headers: { Cookie: `csrf-token=${token}` },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("보호된 경로에 토큰 없이 POST하면 403을 반환한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe("CSRF 토큰이 유효하지 않습니다");
    expect(next).not.toHaveBeenCalled();
  });

  it("보호된 경로에 올바른 토큰을 보내면 통과한다", () => {
    const token = issueToken();
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: {
        Cookie: `csrf-token=${token}`,
        "x-csrf-token": token,
      },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("쿠키 토큰과 헤더 토큰이 불일치하면 403을 반환한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: {
        Cookie: "csrf-token=cookie-token",
        "x-csrf-token": "different-header-token",
      },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("nonce는 같지만 서명이 잘못된 hex여도 403을 반환한다 (timingSafeEqual 예외 없음)", () => {
    // 정상 토큰을 받아 서명부만 비-hex 문자로 치환해 RangeError 트리거 시도
    const valid = issueToken();
    const [nonce, signature] = valid.split(".");
    // 서명 길이는 유지하되 hex가 아닌 문자로 채움
    const malformed = `${nonce}.${"z".repeat(signature.length)}`;
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: { "x-csrf-token": malformed },
    });
    const res = mockRes();
    const next = vi.fn();

    expect(() => csrfProtection(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("token이 객체 등 비정상 타입이어도 throw 없이 403", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: { "x-csrf-token": { foo: "bar" } },
    });
    const res = mockRes();
    const next = vi.fn();

    expect(() => csrfProtection(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("면제 경로(로그인)는 토큰 없이도 통과한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/admin-users/login",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("면제 경로(상담 신청)는 토큰 없이도 통과한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/consultations",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("면제 목록에 없는 경로는 모두 CSRF 검증 대상이다 (/api/ 외부 포함)", () => {
    const req = mockReq({
      method: "POST",
      path: "/other/endpoint",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("HEAD 요청도 GET과 동일하게 csrf-token 쿠키를 설정한다", () => {
    const req = mockReq({ method: "HEAD" });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.cookie).toHaveBeenCalledWith("csrf-token", expect.any(String), expect.any(Object));
    expect(next).toHaveBeenCalled();
  });

  it("OPTIONS 요청(CORS preflight)도 검증 없이 통과한다", () => {
    const req = mockReq({ method: "OPTIONS" });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("GET 요청 시 기존 쿠키 서명이 깨졌으면 새 토큰을 재발급한다", () => {
    const req = mockReq({
      method: "GET",
      headers: { Cookie: "csrf-token=tampered.value" },
    });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.cookie).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("PATCH 요청도 유효한 토큰 없이는 403", () => {
    const req = mockReq({ method: "PATCH", path: "/api/documents/1", headers: {} });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("DELETE 요청도 유효한 토큰 없이는 403", () => {
    const req = mockReq({ method: "DELETE", path: "/api/documents/1", headers: {} });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("점(.)이 없는 헤더 토큰은 검증 실패 → 403", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: { "x-csrf-token": "no-dot-here" },
    });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("서명 변조(nonce는 같고 signature만 변경)는 403", () => {
    const token = issueToken();
    const [nonce] = token.split(".");
    const tampered = `${nonce}.${"0".repeat(64)}`;
    const req = mockReq({
      method: "POST",
      path: "/api/documents",
      headers: { "x-csrf-token": tampered },
    });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("회원가입 엔드포인트(/api/portal/register)도 면제 대상", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/portal/register",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
