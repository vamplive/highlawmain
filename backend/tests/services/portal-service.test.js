/**
 * portal-service.js — 입력 유효성 + UUID 검증 테스트
 * (DB 흐름은 CJS require 기반 mock 이슈로 보류)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
  },
}));

vi.mock("../../db/schema", () => ({
  portalUsers: {}, caseFilesTable: {}, caseDocuments: {}, caseMessages: {}, clients: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({})), { raw: vi.fn(() => ({})) }),
}));

vi.mock("../../lib/auth", () => ({
  hashPassword: vi.fn(() => "hash"),
  verifyPassword: vi.fn(() => false),
  createPortalSession: vi.fn(() => "token"),
  deletePortalSession: vi.fn(),
}));

const {
  registerUser, loginUser, logoutUser,
  getCaseDetail, getCaseMessages, sendClientMessage,
  createAdminCase, updateAdminCase, sendLawyerMessage,
  getUserCases,
} = await import("../../services/portal-service.js");

describe("registerUser — 입력 유효성", () => {
  const base = { email: "a@b.com", password: "12345678", name: "홍길동", phone: "01012345678" };

  it("이메일 형식이 잘못되면 거부한다", async () => {
    await expect(registerUser({ ...base, email: "not-email" }))
      .rejects.toThrow("이메일");
    await expect(registerUser({ ...base, email: "" })).rejects.toThrow("이메일");
  });

  it("비밀번호가 8자 미만이면 거부한다", async () => {
    await expect(registerUser({ ...base, password: "1234567" }))
      .rejects.toThrow("8자 이상");
    await expect(registerUser({ ...base, password: "" })).rejects.toThrow("8자 이상");
  });

  it("이름이 비어있으면 거부한다", async () => {
    await expect(registerUser({ ...base, name: "" })).rejects.toThrow("이름");
    await expect(registerUser({ ...base, name: "   " })).rejects.toThrow("이름");
  });

  it("전화번호 형식이 잘못되면 거부한다", async () => {
    await expect(registerUser({ ...base, phone: "abc" }))
      .rejects.toThrow("연락처");
    await expect(registerUser({ ...base, phone: "" })).rejects.toThrow("연락처");
  });
});

describe("loginUser — 입력 유효성", () => {
  it("이메일이나 비밀번호가 비어있으면 거부한다", async () => {
    await expect(loginUser("", "pw")).rejects.toThrow("입력");
    await expect(loginUser("a@b.com", "")).rejects.toThrow("입력");
  });
});

describe("logoutUser — 토큰 누락 안전 처리", () => {
  it("null 토큰은 에러 없이 리턴한다", () => {
    expect(() => logoutUser(null)).not.toThrow();
    expect(() => logoutUser(undefined)).not.toThrow();
    expect(() => logoutUser("")).not.toThrow();
  });
});

describe("getUserCases — clientId 없으면 빈 배열", () => {
  it("null clientId는 DB 조회 없이 []를 반환한다", async () => {
    await expect(getUserCases(null)).resolves.toEqual([]);
    await expect(getUserCases(undefined)).resolves.toEqual([]);
  });
});

describe("getCaseDetail / getCaseMessages / sendClientMessage — UUID 검증", () => {
  it("getCaseDetail: UUID가 아니면 거부한다", async () => {
    await expect(getCaseDetail("not-uuid", "x")).rejects.toThrow("유효하지 않은 ID");
  });

  it("getCaseMessages: UUID가 아니면 거부한다", async () => {
    await expect(getCaseMessages("bad", "x", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("sendClientMessage: UUID가 아니면 거부한다", async () => {
    await expect(sendClientMessage("bad", "cl", "u", "msg")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("createAdminCase — 입력 유효성", () => {
  it("clientId가 UUID가 아니면 거부한다", async () => {
    await expect(createAdminCase({ clientId: "bad", title: "사건" }))
      .rejects.toThrow("유효하지 않은 ID");
  });

  it("title이 비어있으면 거부한다", async () => {
    const validUUID = "00000000-0000-4000-8000-000000000000";
    await expect(createAdminCase({ clientId: validUUID, title: "" }))
      .rejects.toThrow("사건 제목");
    await expect(createAdminCase({ clientId: validUUID, title: "   " }))
      .rejects.toThrow("사건 제목");
  });
});

describe("updateAdminCase / sendLawyerMessage — UUID 검증", () => {
  it("updateAdminCase: UUID가 아니면 거부한다", async () => {
    await expect(updateAdminCase("bad", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("sendLawyerMessage: UUID가 아니면 거부한다", async () => {
    await expect(sendLawyerMessage("bad", "msg")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("registerUser — 이메일 형식 엣지", () => {
  const base = { password: "12345678", name: "홍길동", phone: "01012345678" };

  it("@가 없는 이메일은 거부한다", async () => {
    await expect(registerUser({ ...base, email: "no-at-sign.com" }))
      .rejects.toThrow("이메일");
  });

  it("도메인에 점이 없는 이메일은 거부한다", async () => {
    await expect(registerUser({ ...base, email: "a@bcom" })).rejects.toThrow("이메일");
  });

  it("공백만 있는 이메일은 거부한다", async () => {
    await expect(registerUser({ ...base, email: "   " })).rejects.toThrow("이메일");
  });
});

describe("실 DB 404 경로 (valid UUID지만 존재하지 않음)", () => {
  const GHOST = "550e8400-e29b-41d4-a716-446655440000";
  const GHOST_CLIENT = "550e8400-e29b-41d4-a716-446655440001";

  it("getCaseDetail: 사건 없음 → 404", async () => {
    await expect(getCaseDetail(GHOST, GHOST_CLIENT))
      .rejects.toThrow("사건을 찾을 수 없습니다");
  });

  it("getCaseMessages: 사건 없음 → 404", async () => {
    await expect(getCaseMessages(GHOST, GHOST_CLIENT, {}))
      .rejects.toThrow("사건을 찾을 수 없습니다");
  });

  it("sendClientMessage: 사건 없음 → 404", async () => {
    await expect(sendClientMessage(GHOST, GHOST_CLIENT, "user-1", "msg"))
      .rejects.toThrow("사건을 찾을 수 없습니다");
  });

  it("updateAdminCase: 사건 없음 → 404", async () => {
    await expect(updateAdminCase(GHOST, { status: "closed" }))
      .rejects.toThrow("사건을 찾을 수 없습니다");
  });

  it("sendLawyerMessage: 사건 없음 → 404", async () => {
    await expect(sendLawyerMessage(GHOST, "msg"))
      .rejects.toThrow("사건을 찾을 수 없습니다");
  });

  it("loginUser: 이메일 미등록 → 401", async () => {
    await expect(loginUser(`ghost-${Date.now()}@nowhere.test`, "password123"))
      .rejects.toThrow(/올바르지 않습니다/);
  });
});
