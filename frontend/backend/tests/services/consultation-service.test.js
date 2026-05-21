/**
 * consultation-service.js 단위 테스트
 * - createConsultation 입력 유효성 검증 테스트
 * - DB 의존성을 모킹하여 순수 비즈니스 로직만 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// DB와 ORM 모듈을 모킹
vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "test-uuid-1234" }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => []),
        })),
      })),
    })),
  },
}));

vi.mock("../../db/schema", () => ({
  consultations: { id: "id", status: "status", createdAt: "createdAt" },
  clients: { id: "id", phone: "phone", email: "email" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  desc: vi.fn((col) => ({ col })),
  sql: vi.fn(),
}));

vi.mock("../../lib/google-calendar", () => ({
  isConfigured: () => false,
  createConsultationEvent: vi.fn(),
}));

const {
  createConsultation,
  updateConsultation,
  deleteConsultation,
  confirmConsultation,
} = await import("../../services/consultation-service.js");

describe("createConsultation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("이름이 없으면 에러를 던진다", async () => {
    await expect(
      createConsultation({ name: "", phone: "010-1234-5678", message: "테스트 상담 내용입니다 10자 이상" })
    ).rejects.toThrow("이름을 입력해주세요");
  });

  it("이름이 공백만 있으면 에러를 던진다", async () => {
    await expect(
      createConsultation({ name: "   ", phone: "010-1234-5678", message: "테스트 상담 내용입니다 10자 이상" })
    ).rejects.toThrow("이름을 입력해주세요");
  });

  it("전화번호와 이메일 둘 다 없으면 에러를 던진다", async () => {
    await expect(
      createConsultation({ name: "홍길동", phone: "", email: "", message: "테스트 상담 내용입니다 10자 이상" })
    ).rejects.toThrow("연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요");
  });

  it("잘못된 전화번호 형식이면 에러를 던진다", async () => {
    await expect(
      createConsultation({ name: "홍길동", phone: "12345", message: "테스트 상담 내용입니다 10자 이상" })
    ).rejects.toThrow("올바른 연락처를 입력해주세요");
  });

  it("상담 내용이 10자 미만이면 에러를 던진다", async () => {
    await expect(
      createConsultation({ name: "홍길동", phone: "010-1234-5678", message: "짧은글" })
    ).rejects.toThrow("상담 내용은 10자 이상 입력해주세요");
  });

  it("이메일만 있고 전화번호가 없어도 성공한다", async () => {
    const result = await createConsultation({
      name: "홍길동",
      email: "test@example.com",
      message: "테스트 상담 내용입니다 10자 이상입니다",
      scheduleMode: "request",
      preferredSlots: [{ date: "2026-05-01", time: "14:00" }],
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("유효한 데이터로 상담을 생성한다", async () => {
    const result = await createConsultation({
      name: "홍길동",
      phone: "010-1234-5678",
      message: "변호사 상담을 요청합니다. 자세한 내용은 상담 시 설명드리겠습니다.",
      scheduleMode: "request",
      preferredSlots: [{ date: "2026-05-01", time: "14:00" }],
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("상담 내용이 5000자를 초과하면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "가".repeat(5001),
      })
    ).rejects.toThrow("5,000자 이내");
  });

  it("이름이 100자를 초과하면 에러", async () => {
    await expect(
      createConsultation({
        name: "가".repeat(101),
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
      })
    ).rejects.toThrow("이름은 100자");
  });

  it("meetingType이 화이트리스트 밖이면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
        meetingType: "hologram",
      })
    ).rejects.toThrow("대면/전화/화상");
  });

  it("scheduleMode가 slot/request 외이면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
        scheduleMode: "auction",
      })
    ).rejects.toThrow("예약 방식");
  });

  it("scheduleMode=slot인데 bookingSlotId가 없으면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
        scheduleMode: "slot",
      })
    ).rejects.toThrow("예약 시간을 선택");
  });

  it("scheduleMode=request인데 preferredSlots가 비어있으면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
        scheduleMode: "request",
        preferredSlots: [],
      })
    ).rejects.toThrow("희망 일정을 최소 1개");
  });

  it("scheduleMode=request인데 preferredSlots 항목에 date가 없으면 에러", async () => {
    await expect(
      createConsultation({
        name: "홍길동",
        phone: "010-1234-5678",
        message: "테스트 상담 내용입니다 10자 이상",
        scheduleMode: "request",
        preferredSlots: [{ time: "14:00" }, { note: "언제든" }],
      })
    ).rejects.toThrow("희망 일정을 최소 1개");
  });
});

describe("updateConsultation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("UUID 형식이 아니면 에러", async () => {
    await expect(updateConsultation("not-a-uuid", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("존재하지 않는 UUID는 404 (실 DB 조회 결과 없음)", async () => {
    await expect(
      updateConsultation("550e8400-e29b-41d4-a716-446655440000", { status: "done" })
    ).rejects.toThrow("상담 내역을 찾을 수 없습니다");
  });
});

describe("deleteConsultation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("UUID 형식이 아니면 에러", async () => {
    await expect(deleteConsultation("xx")).rejects.toThrow("유효하지 않은 ID");
  });

  it("존재하지 않는 UUID는 404", async () => {
    await expect(
      deleteConsultation("550e8400-e29b-41d4-a716-446655440000")
    ).rejects.toThrow("상담 내역을 찾을 수 없습니다");
  });
});

describe("confirmConsultation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("UUID 형식이 아니면 에러", async () => {
    await expect(confirmConsultation("nope")).rejects.toThrow("유효하지 않은 ID");
  });

  it("존재하지 않는 UUID는 404", async () => {
    await expect(
      confirmConsultation("550e8400-e29b-41d4-a716-446655440000")
    ).rejects.toThrow("상담을 찾을 수 없습니다");
  });
});
