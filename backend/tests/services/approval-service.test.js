import { describe, it, expect } from "vitest";
import { calculateLeaveAllowance } from "../../services/approval-service.js";

describe("calculateLeaveAllowance (연차 계산 로직 테스트)", () => {
  it("입사일이 없거나 잘못된 형식인 경우 예외 또는 기본 처리가 된다", () => {
    const resEmpty = calculateLeaveAllowance("");
    expect(resEmpty.accruedDays).toBe(0);
    expect(resEmpty.details).toBe("입사일 미지정");

    const resInvalid = calculateLeaveAllowance("not-a-date");
    expect(resInvalid.accruedDays).toBe(0);
    expect(resInvalid.details).toBe("올바르지 않은 입사일 형식");
  });

  it("근속 1년 미만: 5개월 경과 시 5일의 연차(월차)가 부여된다", () => {
    // 2025-01-15 입사, 2025-06-20 기준 (5개월 완료)
    const res = calculateLeaveAllowance("2025-01-15", "2025-06-20");
    // 월차 그랜트 생성 시점: 2/15, 3/15, 4/15, 5/15, 6/15 (총 5개)
    expect(res.accruedDays).toBe(5);
    expect(res.accruedHours).toBe(40);
    expect(res.details).toContain("1년 미만 월차 5일");
  });

  it("근속 1년 미만: 11개월 경과 시 최대 11일의 연차가 부여된다", () => {
    // 2025-01-15 입사, 2025-12-20 기준 (11개월 완료)
    const res = calculateLeaveAllowance("2025-01-15", "2025-12-20");
    expect(res.accruedDays).toBe(11);
    expect(res.accruedHours).toBe(88);
  });

  it("근속 1년 완료: 11일의 월차와 1년 시점에 부여된 15일 연차가 합산되어 26일이 된다", () => {
    // 2025-01-15 입사, 2026-01-20 기준 (1년 완료)
    const res = calculateLeaveAllowance("2025-01-15", "2026-01-20");
    // 월차 11일 + 연차 15일 = 26일
    expect(res.accruedDays).toBe(26);
    expect(res.accruedHours).toBe(208);
    expect(res.details).toContain("1년 미만 월차 11일");
    expect(res.details).toContain("연차 가산 총 15일");
  });

  it("근속 2년 완료 (3년 차 진입): 16일의 연차가 추가로 쌓여 총 42일이 된다", () => {
    // 2025-01-15 입사, 2027-01-20 기준 (2년 완료)
    // 누적: 월차 11일 + 1년 완료 연차 15일 + 2년 완료 연차 16일 (3년 차 가산 적용) = 42일
    const res = calculateLeaveAllowance("2025-01-15", "2027-01-20");
    expect(res.accruedDays).toBe(42);
    expect(res.accruedHours).toBe(336);
    expect(res.details).toContain("연차 가산 총 31일"); // 15 + 16
  });

  it("근속 4년 완료 (5년 차 진입): 2년마다 1일씩 누적 가산되어 총 75일이 된다", () => {
    // 2025-01-15 입사, 2029-01-20 기준 (4년 완료)
    // 1년 완료: 15일
    // 2년 완료 (3년 차): 16일
    // 3년 완료 (4년 차): 16일
    // 4년 완료 (5년 차): 17일
    // 누적: 11 (월차) + 15 + 16 + 16 + 17 = 75일
    const res = calculateLeaveAllowance("2025-01-15", "2029-01-20");
    expect(res.accruedDays).toBe(75);
    expect(res.accruedHours).toBe(600);
  });
});
