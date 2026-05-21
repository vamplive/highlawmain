/**
 * trigger-service.js — createTrigger 입력 유효성 + UUID 검증 테스트
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
  autoTriggers: {}, clients: {}, scheduledMessages: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({})), { raw: vi.fn(() => ({})) }),
  lte: vi.fn(() => ({})),
  inArray: vi.fn(() => ({})),
  or: vi.fn(() => ({})),
}));

vi.mock("../../services/schedule-service", () => ({
  createSchedule: vi.fn(),
}));

const { createTrigger, updateTrigger, deleteTrigger } = await import("../../services/trigger-service.js");

describe("createTrigger — 입력 유효성", () => {
  const base = {
    triggerType: "consultation_received",
    name: "상담 접수 안내",
    channel: "sms",
    content: "접수되었습니다",
  };

  it("triggerType이 허용 목록에 없으면 거부한다", async () => {
    await expect(createTrigger({ ...base, triggerType: "unknown" }))
      .rejects.toThrow("triggerType");
  });

  it("허용된 triggerType 4종은 통과 (consultation_received, consultation_confirmed, booking_reminder, reengagement)", async () => {
    // 이름 없이 보내서 다음 단계 에러가 나는지로 triggerType 단계는 통과했음을 확인
    for (const t of ["consultation_received", "consultation_confirmed", "booking_reminder", "reengagement"]) {
      await expect(createTrigger({ ...base, triggerType: t, name: "" }))
        .rejects.toThrow("이름");
    }
  });

  it("channel이 sms/email이 아니면 거부한다", async () => {
    await expect(createTrigger({ ...base, channel: "fax" }))
      .rejects.toThrow("sms 또는 email");
  });

  it("name이 비어있으면 거부한다", async () => {
    await expect(createTrigger({ ...base, name: "" })).rejects.toThrow("이름");
    await expect(createTrigger({ ...base, name: "   " })).rejects.toThrow("이름");
  });

  it("content가 비어있으면 거부한다", async () => {
    await expect(createTrigger({ ...base, content: "" })).rejects.toThrow("메시지 내용");
    await expect(createTrigger({ ...base, content: "   " })).rejects.toThrow("메시지 내용");
  });

  it("email 채널인데 subject가 없으면 거부한다", async () => {
    await expect(createTrigger({ ...base, channel: "email", subject: "" }))
      .rejects.toThrow("이메일 제목");
    await expect(createTrigger({ ...base, channel: "email" })).rejects.toThrow("이메일 제목");
  });
});

describe("updateTrigger / deleteTrigger — UUID 검증", () => {
  it("updateTrigger: UUID가 아니면 거부한다", async () => {
    await expect(updateTrigger("bad-id", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("deleteTrigger: UUID가 아니면 거부한다", async () => {
    await expect(deleteTrigger("bad-id")).rejects.toThrow("유효하지 않은 ID");
  });
});
