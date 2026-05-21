/**
 * formatters.js 단위 테스트
 * - 날짜, 전화번호, 문자열 잘라내기, 바이트 길이 포맷 검증
 */
import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatPhone,
  truncate,
  getByteLength,
  renderPlaceholders,
} from "../../utils/formatters.js";

describe("formatDate", () => {
  it("ISO 날짜 문자열을 YYYY.MM.DD 형식으로 변환한다", () => {
    expect(formatDate("2025-03-15T14:30:00Z")).toBe("2025.03.15");
  });

  it("날짜만 있는 문자열도 처리한다", () => {
    expect(formatDate("2025-03-15")).toBe("2025.03.15");
  });

  it("null이면 '-'를 반환한다", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("undefined이면 '-'를 반환한다", () => {
    expect(formatDate(undefined)).toBe("-");
  });

  it("빈 문자열이면 '-'를 반환한다", () => {
    expect(formatDate("")).toBe("-");
  });
});

describe("formatPhone", () => {
  it("11자리 번호를 010-XXXX-XXXX 형식으로 변환한다", () => {
    expect(formatPhone("01012345678")).toBe("010-1234-5678");
  });

  it("10자리 번호를 0XX-XXX-XXXX 형식으로 변환한다", () => {
    expect(formatPhone("0312345678")).toBe("031-234-5678");
  });

  it("이미 포맷된 번호도 올바르게 처리한다", () => {
    expect(formatPhone("010-1234-5678")).toBe("010-1234-5678");
  });

  it("null이면 '-'를 반환한다", () => {
    expect(formatPhone(null)).toBe("-");
  });

  it("빈 문자열이면 '-'를 반환한다", () => {
    expect(formatPhone("")).toBe("-");
  });

  it("포맷할 수 없는 길이의 번호는 원본을 반환한다", () => {
    expect(formatPhone("1234")).toBe("1234");
  });
});

describe("truncate", () => {
  it("최대 길이보다 짧은 문자열은 그대로 반환한다", () => {
    expect(truncate("짧은 글", 50)).toBe("짧은 글");
  });

  it("최대 길이보다 긴 문자열은 잘라서 ...을 붙인다", () => {
    const longText = "가나다라마바사아자차카타파하";
    const result = truncate(longText, 5);
    expect(result).toBe("가나다라마...");
    expect(result).toHaveLength(8); // 5 + "..."
  });

  it("null이면 빈 문자열을 반환한다", () => {
    expect(truncate(null)).toBe("");
  });

  it("undefined이면 빈 문자열을 반환한다", () => {
    expect(truncate(undefined)).toBe("");
  });

  it("기본 최대 길이는 50이다", () => {
    const text = "a".repeat(60);
    const result = truncate(text);
    expect(result).toBe("a".repeat(50) + "...");
  });

  it("최대 길이와 정확히 같은 문자열은 그대로 반환한다", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });
});

describe("getByteLength", () => {
  it("ASCII 문자는 1바이트로 계산한다", () => {
    expect(getByteLength("abc")).toBe(3);
  });

  it("한국어 문자는 2바이트로 계산한다", () => {
    expect(getByteLength("가나다")).toBe(6);
  });

  it("혼합 문자열을 올바르게 계산한다", () => {
    expect(getByteLength("abc가나")).toBe(7); // 3 + 4
  });

  it("빈 문자열은 0을 반환한다", () => {
    expect(getByteLength("")).toBe(0);
  });

  it("숫자와 특수문자는 1바이트로 계산한다", () => {
    expect(getByteLength("123!@#")).toBe(6);
  });
});

describe("renderPlaceholders", () => {
  it("한글 고객명과 이중 중괄호 플레이스홀더를 이름으로 치환한다", () => {
    const result = renderPlaceholders(
      "{고객명}님 {{고객명}}님 {{ name }}님 {고객 이름}님",
      { name: "홍길동" }
    );
    expect(result).toBe("홍길동님 홍길동님 홍길동님 홍길동님");
  });
});
