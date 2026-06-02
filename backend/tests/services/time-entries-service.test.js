/**
 * time-entries-service.js — 입력 유효성 단위 테스트
 * (DB 흐름이 필요한 분기는 통합 테스트에서 다룬다)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })),
    insert: vi.fn(() => ({ values: () => Promise.resolve() })),
    update: vi.fn(() => ({ set: () => ({ where: () => Promise.resolve() }) })),
    delete: vi.fn(() => ({ where: () => Promise.resolve() })),
  },
}));
vi.mock("../../db/schema", () => ({
  timeEntries: { id: "id", lawyerId: "lawyer_id", endedAt: "ended_at", startedAt: "started_at" },
  lawyers: { id: "id", defaultHourlyRateKrw: "default_hourly_rate_krw" },
  TIME_ENTRY_ACTIVITY_TYPES: ["work", "research", "meeting", "court", "call", "email", "travel"],
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})), and: vi.fn(() => ({})), desc: vi.fn(() => ({})),
  isNull: vi.fn(() => ({})), gte: vi.fn(() => ({})), lte: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({ mapWith: vi.fn(() => ({})) })), { raw: vi.fn(() => ({})) }),
}));

const service = await import("../../services/time-entries-service");

const VALID_UUID = "11111111-1111-1111-1111-111111111111";

describe("startTimer 유효성", () => {
  it("lawyerId UUID 가 아니면 400", async () => {
    await expect(service.startTimer({ lawyerId: "abc", description: "x" }))
      .rejects.toMatchObject({ status: 400 });
  });

  it("description 비어 있으면 400", async () => {
    await expect(service.startTimer({ lawyerId: VALID_UUID, description: "" }))
      .rejects.toMatchObject({ status: 400 });
  });

  it("activityType 이 enum 외 값이면 400", async () => {
    await expect(service.startTimer({
      lawyerId: VALID_UUID,
      description: "법률 검토",
      activityType: "lunch",
    })).rejects.toMatchObject({ status: 400 });
  });
});

describe("create 유효성", () => {
  it("description 없으면 400", async () => {
    await expect(service.create({
      lawyerId: VALID_UUID,
      description: "",
      startedAt: "2026-05-06 09:00:00",
    })).rejects.toMatchObject({ status: 400 });
  });

  it("startedAt 없으면 400", async () => {
    await expect(service.create({
      lawyerId: VALID_UUID,
      description: "법률 검토",
    })).rejects.toMatchObject({ status: 400 });
  });

  it("durationMinutes 가 음수면 400", async () => {
    await expect(service.create({
      lawyerId: VALID_UUID,
      description: "법률 검토",
      startedAt: "2026-05-06 09:00:00",
      durationMinutes: -10,
    })).rejects.toMatchObject({ status: 400 });
  });

  it("activityType enum 외 값이면 400", async () => {
    await expect(service.create({
      lawyerId: VALID_UUID,
      description: "법률 검토",
      startedAt: "2026-05-06 09:00:00",
      activityType: "nap",
    })).rejects.toMatchObject({ status: 400 });
  });
});

describe("stopTimer", () => {
  it("active 타이머가 없으면 404", async () => {
    await expect(service.stopTimer(VALID_UUID))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe("getActiveTimer", () => {
  it("UUID 가 아니면 400", async () => {
    await expect(service.getActiveTimer("not-a-uuid"))
      .rejects.toMatchObject({ status: 400 });
  });
});
