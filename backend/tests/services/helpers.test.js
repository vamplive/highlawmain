/**
 * services/helpers.js 단위 테스트
 * - UUID 검증, 페이지네이션, 전화번호 정리, 타임스탬프 생성
 */
import { describe, it, expect } from "vitest";
import {
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
  cleanPhone,
  ServiceError,
} from "../../services/helpers.js";

describe("validateUUID", () => {
  it("유효한 UUID v4를 통과시킨다", () => {
    expect(() => validateUUID("550e8400-e29b-41d4-a716-446655440000")).not.toThrow();
  });

  it("대문자 UUID도 통과시킨다", () => {
    expect(() => validateUUID("550E8400-E29B-41D4-A716-446655440000")).not.toThrow();
  });

  it("빈 문자열이면 ServiceError를 던진다", () => {
    expect(() => validateUUID("")).toThrow(ServiceError);
  });

  it("null이면 ServiceError를 던진다", () => {
    expect(() => validateUUID(null)).toThrow(ServiceError);
  });

  it("형식이 잘못된 문자열이면 ServiceError를 던진다", () => {
    expect(() => validateUUID("not-a-uuid")).toThrow(ServiceError);
  });

  it("에러 status가 400이다", () => {
    try {
      validateUUID("invalid");
    } catch (e) {
      expect(e.status).toBe(400);
    }
  });
});

describe("parsePagination", () => {
  it("기본값을 반환한다 (page=1, limit=20)", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it("유효한 page, limit을 파싱한다", () => {
    const result = parsePagination({ page: "3", limit: "10" });
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it("page가 0 이하이면 1로 고정한다", () => {
    const result = parsePagination({ page: "-5", limit: "10" });
    expect(result.page).toBe(1);
  });

  it("limit이 maxLimit을 초과하면 maxLimit으로 고정한다", () => {
    const result = parsePagination({ limit: "999" }, { maxLimit: 50 });
    expect(result.limit).toBe(50);
  });

  it("limit이 0이면 기본값(20)을 사용한다 (parseInt('0')은 falsy)", () => {
    const result = parsePagination({ limit: "0" });
    expect(result.limit).toBe(20);
  });

  it("limit이 음수이면 1로 고정한다", () => {
    const result = parsePagination({ limit: "-5" });
    expect(result.limit).toBe(1);
  });

  it("문자열이 아닌 값을 넘기면 기본값을 사용한다", () => {
    const result = parsePagination({ page: "abc", limit: null });
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });
});

describe("buildPaginationMeta", () => {
  it("totalPages를 올바르게 계산한다", () => {
    const meta = buildPaginationMeta(95, 2, 20);
    expect(meta).toEqual({ total: 95, page: 2, limit: 20, totalPages: 5 });
  });

  it("전체 0건이면 totalPages는 0이다", () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(0);
  });
});

describe("cleanPhone", () => {
  it("하이픈을 제거한다", () => {
    expect(cleanPhone("010-1234-5678")).toBe("01012345678");
  });

  it("공백을 제거한다", () => {
    expect(cleanPhone("010 1234 5678")).toBe("01012345678");
  });

  it("하이픈과 공백을 모두 제거한다", () => {
    expect(cleanPhone("010 - 1234 - 5678")).toBe("01012345678");
  });

  it("null이면 빈 문자열을 반환한다", () => {
    expect(cleanPhone(null)).toBe("");
  });

  it("이미 깨끗한 번호는 그대로 반환한다", () => {
    expect(cleanPhone("01012345678")).toBe("01012345678");
  });
});

describe("nowTimestamp", () => {
  it("YYYY-MM-DD HH:MM:SS 형식 문자열을 반환한다", () => {
    const ts = nowTimestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("길이가 19자이다", () => {
    expect(nowTimestamp()).toHaveLength(19);
  });
});
