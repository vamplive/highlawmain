/**
 * schedule-service.js — createSchedule 입력 유효성 테스트
 * DB 호출 전에 throw되는 ServiceError 분기만 검증한다.
 * (DB 반환을 가정한 시나리오는 CJS/ESM mock 경계 문제로 여기서 제외)
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
  scheduledMessages: {},
  messageLogs: {},
  messageTemplates: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({})), { raw: vi.fn(() => ({})) }),
  and: vi.fn(() => ({})),
  lte: vi.fn(() => ({})),
  inArray: vi.fn(() => ({})),
}));

vi.mock("../../lib/sms-service", () => ({ sendSMS: vi.fn() }));
vi.mock("../../lib/email-service", () => ({ sendEmail: vi.fn() }));
vi.mock("../../services/client-service", () => ({
  filterByConsent: vi.fn(), touchLastContacted: vi.fn(),
}));
vi.mock("../../lib/message-render", () => ({
  resolveUnsubscribeToken: vi.fn(),
  buildUnsubscribeUrl: vi.fn(),
  replacePlaceholders: vi.fn((s) => s),
  appendEmailFooter: vi.fn((s) => s),
  injectTrackingPixel: vi.fn((s) => s),
}));

const { createSchedule, cancelSchedule } = await import("../../services/schedule-service.js");

describe("createSchedule — 입력 유효성", () => {
  const base = {
    channel: "sms",
    recipients: [{ contact: "010-1111-2222" }],
    content: "내용",
    scheduledAt: "2026-05-01T10:00",
  };

  it("채널이 sms/email이 아니면 거부한다", async () => {
    await expect(createSchedule({ ...base, channel: "fax" }))
      .rejects.toThrow("채널은 sms 또는 email");
  });

  it("채널이 누락되면 거부한다", async () => {
    await expect(createSchedule({ ...base, channel: undefined }))
      .rejects.toThrow("채널은 sms 또는 email");
  });

  it("수신자 배열이 비어있으면 거부한다", async () => {
    await expect(createSchedule({ ...base, recipients: [] }))
      .rejects.toThrow("수신자를 1명 이상");
  });

  it("수신자가 배열이 아니면 거부한다", async () => {
    await expect(createSchedule({ ...base, recipients: null }))
      .rejects.toThrow("수신자를 1명 이상");
  });

  it("내용이 공백이면 거부한다", async () => {
    await expect(createSchedule({ ...base, content: "   " }))
      .rejects.toThrow("메시지 내용");
  });

  it("이메일 채널인데 제목이 없으면 거부한다", async () => {
    await expect(createSchedule({ ...base, channel: "email", subject: "" }))
      .rejects.toThrow("이메일 제목");
  });

  it("예약 시각이 누락되면 거부한다", async () => {
    await expect(createSchedule({ ...base, scheduledAt: null }))
      .rejects.toThrow("예약 시각");
  });

  it("예약 시각이 파싱 불가능한 형식이면 거부한다", async () => {
    await expect(createSchedule({ ...base, scheduledAt: "not-a-date" }))
      .rejects.toThrow("예약 시각 형식");
  });
});

describe("cancelSchedule — UUID 검증", () => {
  it("형식이 잘못된 ID는 400을 던진다", async () => {
    await expect(cancelSchedule("not-a-uuid")).rejects.toThrow("ID");
  });
});
