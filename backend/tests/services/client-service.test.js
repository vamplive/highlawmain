/**
 * client-service.js — 입력 유효성 + DB 호출 이전 단락 분기 테스트
 * (DB 흐름은 CJS require 기반 mock 이슈로 보류)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => []) })),
  },
}));

vi.mock("../../db/schema", () => ({
  clients: {}, consultations: {}, messageLogs: {},
  bookingSlots: {}, caseFilesTable: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({})), { raw: vi.fn(() => ({})) }),
  and: vi.fn(() => ({})),
  like: vi.fn(() => ({})),
  or: vi.fn(() => ({})),
  inArray: vi.fn(() => ({})),
  gte: vi.fn(() => ({})),
  lte: vi.fn(() => ({})),
  isNull: vi.fn(() => ({})),
  isNotNull: vi.fn(() => ({})),
}));

vi.mock("../../lib/sanitize", () => ({ escapeLike: vi.fn((s) => s) }));

const {
  createClient, updateClient, deleteClient, getClientById,
  findClientByUnsubscribeToken, updateClientConsentByToken,
  touchLastContacted, filterByConsent,
  getClientTimeline,
} = await import("../../services/client-service.js");

describe("createClient — 입력 유효성", () => {
  it("이름이 없으면 거부한다", async () => {
    await expect(createClient({ phone: "01012345678" }))
      .rejects.toThrow("이름과 전화번호");
  });

  it("전화번호가 없으면 거부한다", async () => {
    await expect(createClient({ name: "홍길동" }))
      .rejects.toThrow("이름과 전화번호");
  });

  it("공백 문자열도 거부한다", async () => {
    await expect(createClient({ name: "   ", phone: "01012345678" }))
      .rejects.toThrow("이름과 전화번호");
    await expect(createClient({ name: "홍길동", phone: "   " }))
      .rejects.toThrow("이름과 전화번호");
  });
});

describe("updateClient / deleteClient / getClientById — UUID 검증", () => {
  it("updateClient: UUID가 아니면 400을 던진다", async () => {
    await expect(updateClient("not-a-uuid", {}))
      .rejects.toThrow("유효하지 않은 ID");
  });

  it("deleteClient: UUID가 아니면 400을 던진다", async () => {
    await expect(deleteClient("12345")).rejects.toThrow("유효하지 않은 ID");
  });

  it("getClientById: UUID가 아니면 400을 던진다", async () => {
    await expect(getClientById("abc")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("findClientByUnsubscribeToken — 토큰 누락 시 DB 조회 없이 null", () => {
  it("null/undefined/빈 문자열/비문자열이면 null을 반환한다", async () => {
    await expect(findClientByUnsubscribeToken(null)).resolves.toBeNull();
    await expect(findClientByUnsubscribeToken(undefined)).resolves.toBeNull();
    await expect(findClientByUnsubscribeToken("")).resolves.toBeNull();
    await expect(findClientByUnsubscribeToken(123)).resolves.toBeNull();
  });
});

describe("updateClientConsentByToken — 입력 단락", () => {
  it("토큰이 없으면 null을 반환한다", async () => {
    await expect(updateClientConsentByToken(null, { smsConsent: true })).resolves.toBeNull();
    await expect(updateClientConsentByToken("", { smsConsent: true })).resolves.toBeNull();
  });

  it("변경사항이 없으면 null을 반환한다 (updatedAt만 있는 경우)", async () => {
    await expect(updateClientConsentByToken("tok", {})).resolves.toBeNull();
  });
});

describe("touchLastContacted — contact 누락 시 조용히 리턴", () => {
  it("빈 contact는 에러 없이 리턴한다", async () => {
    await expect(touchLastContacted(null)).resolves.toBeUndefined();
    await expect(touchLastContacted("")).resolves.toBeUndefined();
    await expect(touchLastContacted(undefined)).resolves.toBeUndefined();
  });
});

describe("filterByConsent — 경계값", () => {
  it("수신자 배열이 비어있으면 빈 결과를 반환한다", async () => {
    const r = await filterByConsent([], "sms");
    expect(r).toEqual({ allowed: [], blocked: [] });
  });

  it("배열이 아니면 빈 결과를 반환한다", async () => {
    const r = await filterByConsent(null, "sms");
    expect(r).toEqual({ allowed: [], blocked: [] });
  });

  it("contact가 모두 falsy면 원본 전체를 allowed로 반환한다", async () => {
    const recipients = [{ contact: "" }, { contact: null }];
    const r = await filterByConsent(recipients, "sms");
    expect(r.allowed).toEqual(recipients);
    expect(r.blocked).toEqual([]);
  });

  it("실 DB에 없는 연락처는 모두 allowed로 통과 (수신거부 조회 결과 없음)", async () => {
    const recipients = [{ contact: "01099998888" }, { contact: "nobody@example.test" }];
    const sms = await filterByConsent([recipients[0]], "sms");
    expect(sms.blocked).toEqual([]);
    expect(sms.allowed.length).toBe(1);
    const email = await filterByConsent([recipients[1]], "email");
    expect(email.blocked).toEqual([]);
    expect(email.allowed.length).toBe(1);
  });
});

describe("실 DB 404 경로 (valid UUID지만 존재하지 않음)", () => {
  const GHOST = "550e8400-e29b-41d4-a716-446655440000";

  it("getClientById: 존재하지 않으면 404", async () => {
    await expect(getClientById(GHOST)).rejects.toThrow("고객을 찾을 수 없습니다");
  });

  it("updateClient: 존재하지 않으면 404", async () => {
    await expect(updateClient(GHOST, { name: "x" }))
      .rejects.toThrow("고객을 찾을 수 없습니다");
  });

  it("deleteClient: 존재하지 않으면 404", async () => {
    await expect(deleteClient(GHOST)).rejects.toThrow("고객을 찾을 수 없습니다");
  });

  it("getClientTimeline: 존재하지 않으면 404 (getClientById 경유)", async () => {
    await expect(getClientTimeline(GHOST)).rejects.toThrow("고객을 찾을 수 없습니다");
  });
});

describe("updateClientConsentByToken — 존재하지 않는 토큰", () => {
  it("유효한 형태의 토큰이어도 DB에 없으면 null을 반환한다", async () => {
    await expect(
      updateClientConsentByToken(`ghost-token-${Date.now()}`, { smsConsent: false })
    ).resolves.toBeNull();
  });
});
