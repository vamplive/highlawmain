/**
 * qna-service.js — 순수 유틸 + 입력 유효성 테스트
 * sanitizePII / generateQuestionSlug / submitQuestion 검증 분기만 커버한다.
 * (DB 분기는 CJS require 기반 mock 이슈로 보류)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => []) })),
  },
  sqlite: {},
}));

vi.mock("../../db/schema", () => ({
  qnaCategories: {}, qnaQuestions: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
  inArray: vi.fn(() => ({})),
}));

const {
  sanitizePII,
  generateQuestionSlug,
  submitQuestion,
  generateAnonymousDisplayName,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  getQuestion,
} = await import("../../services/qna-service.js");

describe("sanitizePII — 민감정보 차단/마스킹", () => {
  it("주민등록번호는 저장을 거부한다", () => {
    const result = sanitizePII("문의: 123456-1234567 부탁드립니다");
    expect(result.blockedReason).toContain("주민등록번호");
  });

  it("하이픈 없는 주민번호 형식(공백 있음)도 차단한다", () => {
    const result = sanitizePII("123456 - 1234567");
    expect(result.blockedReason).toBeDefined();
  });

  it("휴대폰 번호는 뒤 4자리를 마스킹한다", () => {
    const result = sanitizePII("010-1234-5678 로 연락주세요");
    expect(result.blockedReason).toBeUndefined();
    expect(result.text).toContain("010-****-****");
    expect(result.text).not.toContain("5678");
  });

  it("사업자등록번호 가운데 두 자리를 마스킹한다", () => {
    const result = sanitizePII("사업자번호 123-45-67890 입니다");
    expect(result.text).toContain("123-**-67890");
  });

  it("일반 텍스트는 변경하지 않는다", () => {
    const plain = "그냥 평범한 질문입니다";
    expect(sanitizePII(plain).text).toBe(plain);
  });

  it("빈 문자열은 안전하게 처리한다", () => {
    expect(sanitizePII("")).toEqual({ text: "" });
    expect(sanitizePII(null)).toEqual({ text: "" });
  });
});

describe("generateQuestionSlug — URL 안전 슬러그", () => {
  it("한글 제목을 소문자로 유지하고 공백을 하이픈으로 변환한다", () => {
    const slug = generateQuestionSlug("건설 공사 하자 분쟁");
    expect(slug).toMatch(/^건설-공사-하자-분쟁-[a-z0-9]+$/);
  });

  it("특수문자를 제거한다", () => {
    const slug = generateQuestionSlug("하자?? 보수!@#$%^&");
    expect(slug).not.toMatch(/[?!@#$%^&]/);
  });

  it("연속 공백/하이픈을 하나로 축약한다", () => {
    const slug = generateQuestionSlug("abc   def");
    expect(slug).not.toMatch(/--/);
  });

  it("제목이 없으면 question을 기반으로 만든다", () => {
    const slug = generateQuestionSlug("");
    expect(slug).toMatch(/^question-[a-z0-9]+$/);
  });

  it("60자 이상은 접두어를 잘라낸다", () => {
    const long = "a".repeat(100);
    const slug = generateQuestionSlug(long);
    const [prefix] = slug.split("-").slice(0, -1);
    expect(prefix.length).toBeLessThanOrEqual(60);
  });
});

describe("submitQuestion — 입력 유효성", () => {
  const base = {
    categoryId: "cat-1",
    title: "공사 계약 관련 문의",
    body: "계약서에 명시되지 않은 공사를 요구받았습니다.",
  };

  it("카테고리/제목/내용 중 하나라도 비면 거부한다", async () => {
    await expect(submitQuestion({ ...base, categoryId: "" })).rejects.toThrow("필수");
    await expect(submitQuestion({ ...base, title: "   " })).rejects.toThrow("필수");
    await expect(submitQuestion({ ...base, body: "" })).rejects.toThrow("필수");
  });

  it("제목 120자 초과는 거부한다", async () => {
    await expect(submitQuestion({ ...base, title: "가".repeat(121) }))
      .rejects.toThrow("120자 이하");
  });

  it("내용 5000자 초과는 거부한다", async () => {
    await expect(submitQuestion({ ...base, body: "나".repeat(5001) }))
      .rejects.toThrow("5000자 이하");
  });
});

describe("generateAnonymousDisplayName", () => {
  it("카테고리와 관계없이 '형용사 명사' 형태를 만든다", () => {
    const name = generateAnonymousDisplayName("건설");
    expect(name).toMatch(/^\S+(\s\S+)+$/);
  });

  it("미등록 카테고리는 default 명사 세트를 쓴다", () => {
    // 여러 번 돌려 default set의 단어 중 하나가 나오는지 확인
    const defaults = ["의뢰인", "상담자", "질문자"];
    const names = new Set();
    for (let i = 0; i < 30; i++) names.add(generateAnonymousDisplayName("모르는분야"));
    const joined = [...names].join(" ");
    expect(defaults.some((d) => joined.includes(d))).toBe(true);
  });
});

describe("adminUpdateQuestion — UUID / 존재 검증", () => {
  it("UUID 형식이 아니면 에러", async () => {
    await expect(adminUpdateQuestion("bad", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("존재하지 않는 UUID는 404", async () => {
    await expect(
      adminUpdateQuestion("550e8400-e29b-41d4-a716-446655440000", { answer: "a" })
    ).rejects.toThrow("질문을 찾을 수 없습니다");
  });
});

describe("adminDeleteQuestion — UUID 검증", () => {
  it("UUID 형식이 아니면 에러", async () => {
    await expect(adminDeleteQuestion("xx")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("adminCreateCategory", () => {
  it("이름 없으면 에러", async () => {
    await expect(adminCreateCategory({ slug: "x" })).rejects.toThrow("이름/슬러그는 필수");
  });

  it("슬러그 없으면 에러", async () => {
    await expect(adminCreateCategory({ name: "건설" })).rejects.toThrow("이름/슬러그는 필수");
  });

  it("이름/슬러그 모두 비어있으면 에러", async () => {
    await expect(adminCreateCategory({})).rejects.toThrow("이름/슬러그는 필수");
  });
});

describe("adminUpdateCategory / adminDeleteCategory — UUID 검증", () => {
  it("UUID 형식이 아니면 adminUpdateCategory는 에러", async () => {
    await expect(adminUpdateCategory("nope", {})).rejects.toThrow("유효하지 않은 ID");
  });

  it("UUID 형식이 아니면 adminDeleteCategory는 에러", async () => {
    await expect(adminDeleteCategory("nope")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("getQuestion — slug 미존재", () => {
  it("존재하지 않는 slug는 404", async () => {
    await expect(
      getQuestion("surely-not-a-real-slug-" + Date.now())
    ).rejects.toThrow("질문을 찾을 수 없습니다");
  });
});
