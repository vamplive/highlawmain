/**
 * lib/auth.js 단위 테스트
 * - 비밀번호 해싱/검증 라운드트립
 * - 세션 생성/조회/삭제/만료
 */
import { describe, it, expect, vi } from "vitest";

// auth.js가 require("../db") 시 인메모리 DB를 사용하도록 모킹
vi.mock("../../db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(":memory:");
  return { sqlite: db };
});

// auth 모듈을 동적 임포트 (모듈 로드 시 sessions 테이블 생성됨)
const {
  hashPassword,
  verifyPassword,
  generateToken,
  dummyVerifyPassword,
  createSession,
  getSession,
  deleteSession,
  adminAuth,
  requireRole,
  VALID_ROLES,
  createPortalSession,
  getPortalSession,
  deletePortalSession,
  portalAuth,
  SESSION_TTL_MS,
} = await import("../../lib/auth.js");

function mockReqHeaders(headers = {}) {
  return {
    headers,
    get: (name) => headers[name] ?? headers[name.toLowerCase()],
  };
}
function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status: vi.fn((c) => { res.statusCode = c; return res; }),
    json: vi.fn((d) => { res.body = d; return res; }),
  };
  return res;
}

describe("hashPassword + verifyPassword", () => {
  it("해싱된 비밀번호를 올바르게 검증한다", () => {
    const hashed = hashPassword("myPassword123");
    expect(verifyPassword("myPassword123", hashed)).toBe(true);
  });

  it("잘못된 비밀번호는 검증 실패한다", () => {
    const hashed = hashPassword("myPassword123");
    expect(verifyPassword("wrongPassword", hashed)).toBe(false);
  });

  it("같은 비밀번호라도 매번 다른 해시를 생성한다 (salt 랜덤)", () => {
    const hash1 = hashPassword("same");
    const hash2 = hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });

  it("해시 형식이 salt:hash 구조이다", () => {
    const hashed = hashPassword("test");
    const parts = hashed.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBe(32);
    expect(parts[1].length).toBe(128);
  });

  it("저장값이 비정상이어도 throw 없이 false를 반환한다", () => {
    expect(verifyPassword("any", null)).toBe(false);
    expect(verifyPassword("any", "")).toBe(false);
    expect(verifyPassword("any", "no-colon-format")).toBe(false);
  });
});

describe("dummyVerifyPassword", () => {
  it("호출이 throw 없이 완료되며 어떤 값도 반환하지 않는다", () => {
    expect(() => dummyVerifyPassword()).not.toThrow();
    expect(dummyVerifyPassword()).toBeUndefined();
  });
});

describe("createSession + getSession", () => {
  it("세션을 생성하고 조회할 수 있다", () => {
    const token = createSession("user-1", "admin");
    const session = getSession(token);

    expect(session).not.toBeNull();
    expect(session.userId).toBe("user-1");
    expect(session.role).toBe("admin");
    expect(session.createdAt).toBeDefined();
  });

  it("존재하지 않는 토큰은 null을 반환한다", () => {
    const session = getSession("nonexistent-token");
    expect(session).toBeNull();
  });
});

describe("getSession — 만료 처리", () => {
  it("만료된 세션은 null을 반환한다", () => {
    // 세션 생성 후, Date.now를 미래로 이동시켜 만료를 시뮬레이션
    const token = createSession("user-expired", "admin");

    // 세션이 정상적으로 존재하는지 확인
    expect(getSession(token)).not.toBeNull();

    // Date.now를 TTL 이후로 이동
    const realDateNow = Date.now;
    Date.now = () => realDateNow() + SESSION_TTL_MS + 1000;

    const session = getSession(token);
    expect(session).toBeNull();

    // Date.now 복원
    Date.now = realDateNow;
  });
});

describe("deleteSession", () => {
  it("삭제된 세션은 null을 반환한다", () => {
    const token = createSession("user-2", "admin");
    expect(getSession(token)).not.toBeNull();

    deleteSession(token);
    expect(getSession(token)).toBeNull();
  });
});

describe("generateToken", () => {
  it("64자 hex 문자열을 반환한다 (32바이트)", () => {
    const t = generateToken();
    expect(t).toMatch(/^[a-f0-9]{64}$/);
  });

  it("두 번 호출 시 서로 다른 값이 나온다", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("adminAuth 미들웨어", () => {
  it("Authorization 헤더가 없으면 401", () => {
    const req = mockReqHeaders({});
    const res = mockRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/관리자 인증/);
    expect(next).not.toHaveBeenCalled();
  });

  it("Bearer 접두사가 없으면 401", () => {
    const req = mockReqHeaders({ Authorization: "abcdef" });
    const res = mockRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("유효하지 않은 토큰은 401", () => {
    const req = mockReqHeaders({ Authorization: "Bearer not-a-real-token" });
    const res = mockRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("유효한 토큰은 통과하고 req.adminUser를 주입한다", () => {
    const token = createSession("user-auth-1", "admin");
    const req = mockReqHeaders({ Authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();
    adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.adminUser).toMatchObject({ userId: "user-auth-1", role: "admin" });
  });
});

describe("requireRole 미들웨어", () => {
  it("req.adminUser가 없으면 403", () => {
    const mw = requireRole("admin");
    const req = {};
    const res = mockRes();
    const next = vi.fn();
    mw(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("허용되지 않은 역할은 403", () => {
    const mw = requireRole("admin");
    const req = { adminUser: { userId: "u", role: "editor" } };
    const res = mockRes();
    const next = vi.fn();
    mw(req, res, next);
    expect(res.statusCode).toBe(403);
  });

  it("허용된 역할은 통과한다", () => {
    const mw = requireRole("admin", "editor");
    const req = { adminUser: { userId: "u", role: "editor" } };
    const res = mockRes();
    const next = vi.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("VALID_ROLES는 admin과 editor를 포함한다", () => {
    expect(VALID_ROLES).toEqual(expect.arrayContaining(["admin", "editor"]));
  });
});

describe("포털 세션 (createPortalSession/getPortalSession/deletePortalSession)", () => {
  it("생성 후 조회하면 userId/email/clientId가 돌아온다", () => {
    const token = createPortalSession("pu-1", "a@b.com", "client-1");
    const session = getPortalSession(token);
    expect(session).toMatchObject({
      userId: "pu-1",
      email: "a@b.com",
      clientId: "client-1",
    });
    expect(typeof session.createdAt).toBe("number");
  });

  it("clientId가 null이어도 저장되고 null로 조회된다", () => {
    const token = createPortalSession("pu-2", "c@d.com", null);
    expect(getPortalSession(token).clientId).toBeNull();
  });

  it("빈 토큰은 null (getPortalSession 가드)", () => {
    expect(getPortalSession("")).toBeNull();
    expect(getPortalSession(null)).toBeNull();
    expect(getPortalSession(undefined)).toBeNull();
  });

  it("존재하지 않는 토큰은 null", () => {
    expect(getPortalSession("nope-token")).toBeNull();
  });

  it("만료된 포털 세션은 null", () => {
    const token = createPortalSession("pu-exp", "x@y.com", null);
    const realNow = Date.now;
    Date.now = () => realNow() + SESSION_TTL_MS + 1000;
    expect(getPortalSession(token)).toBeNull();
    Date.now = realNow;
  });

  it("삭제된 포털 세션은 null", () => {
    const token = createPortalSession("pu-del", "z@z.com", null);
    deletePortalSession(token);
    expect(getPortalSession(token)).toBeNull();
  });
});

describe("portalAuth 미들웨어", () => {
  it("x-portal-token 헤더가 없으면 401", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    portalAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/인증/);
    expect(next).not.toHaveBeenCalled();
  });

  it("잘못된 토큰은 401", () => {
    const req = { headers: { "x-portal-token": "bogus" } };
    const res = mockRes();
    const next = vi.fn();
    portalAuth(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("유효한 토큰은 통과하고 req.portalUser를 주입한다", () => {
    const token = createPortalSession("pu-mw", "mw@x.com", "c-mw");
    const req = { headers: { "x-portal-token": token } };
    const res = mockRes();
    const next = vi.fn();
    portalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.portalUser).toMatchObject({ userId: "pu-mw", email: "mw@x.com", clientId: "c-mw" });
  });
});

describe("세션 토큰의 해시 저장 동작", () => {
  it("createSession이 반환한 평문 토큰으로만 세션 조회가 가능하다", () => {
    // 동일 토큰을 두 번 발급해도 항상 새로운 평문이 나오고,
    // 잘못된 토큰(원본을 변형한 값)으로는 조회되지 않아야 한다.
    const token = createSession("user-hash", "admin");
    expect(getSession(token)).not.toBeNull();
    expect(getSession(token + "x")).toBeNull();
    expect(getSession(token.slice(0, -1))).toBeNull();
  });

  it("같은 사용자에 대해 발급된 토큰들은 모두 다르다", () => {
    const t1 = createSession("user-multi", "admin");
    const t2 = createSession("user-multi", "admin");
    expect(t1).not.toBe(t2);
    expect(getSession(t1)).not.toBeNull();
    expect(getSession(t2)).not.toBeNull();
  });
});
