/**
 * sanitize.js — SQL LIKE 와일드카드 이스케이프 유닛 테스트
 */
import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { escapeLike } = require("../../lib/sanitize");

describe("escapeLike", () => {
  it("빈 문자열/undefined/null은 그대로 반환한다", () => {
    expect(escapeLike("")).toBe("");
    expect(escapeLike(undefined)).toBe(undefined);
    expect(escapeLike(null)).toBe(null);
  });

  it("와일드카드가 없으면 원본과 동일하다", () => {
    expect(escapeLike("홍길동")).toBe("홍길동");
    expect(escapeLike("abc 123")).toBe("abc 123");
  });

  it("%와 _를 이스케이프한다", () => {
    expect(escapeLike("50%")).toBe("50\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("%_%")).toBe("\\%\\_\\%");
  });

  it("역슬래시 자체도 이스케이프한다", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("여러 문자가 섞여 있어도 모두 처리한다", () => {
    expect(escapeLike("100% off_sale\\now")).toBe("100\\% off\\_sale\\\\now");
  });
});
