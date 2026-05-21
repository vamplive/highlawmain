/**
 * document-service.js — 순수 함수 + 입력 유효성 테스트
 * stripMarkdown 결정성 / 검색·CRUD 검증 분기만 커버한다.
 * (DB 분기는 CJS require 기반 mock 이슈로 보류)
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => ({ all: vi.fn(() => []) })) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => ({ all: vi.fn(() => []) })) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ run: vi.fn() })) })),
  },
  sqlite: { transaction: (fn) => fn },
  searchFTSWithSnippet: vi.fn(() => []),
}));

vi.mock("../../db/schema", () => ({
  documents: {}, documentCategories: {}, categories: {},
  collections: {}, documentCollections: {},
  highlights: {}, documentRelations: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  sql: Object.assign(vi.fn(() => ({})), { raw: vi.fn(() => ({})) }),
  and: vi.fn(() => ({})),
  like: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
}));

vi.mock("../../lib/sanitize", () => ({ escapeLike: vi.fn((s) => s) }));

const {
  stripMarkdown, searchDocuments, getDocument,
  createDocument, updateDocument, deleteDocument,
} = await import("../../services/document-service.js");

describe("stripMarkdown — 마크다운 서식 제거", () => {
  it("헤딩 기호를 제거한다", () => {
    expect(stripMarkdown("# 제목\n## 소제목")).toBe("제목\n소제목");
  });

  it("굵게/기울임/취소선을 벗겨낸다", () => {
    expect(stripMarkdown("**굵게** *기울임* ~~취소선~~")).toBe("굵게 기울임 취소선");
  });

  it("인라인/블록 코드를 제거한다", () => {
    expect(stripMarkdown("`code` 그리고 ```block```")).toBe("그리고");
  });

  it("이미지는 삭제하고 링크는 텍스트만 남긴다", () => {
    expect(stripMarkdown("![alt](url) [링크](https://ex.com)")).toBe("링크");
  });

  it("인용/목록/수평선을 정리한다", () => {
    const out = stripMarkdown("> 인용\n- 항목1\n- 항목2\n1. 첫번째\n---");
    expect(out).not.toMatch(/[>\-*+]\s/);
    expect(out).toContain("인용");
    expect(out).toContain("항목1");
  });

  it("3회 이상 개행은 2회로 축약한다", () => {
    expect(stripMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("searchDocuments — 쿼리 검증", () => {
  it("빈 쿼리는 거부한다", () => {
    expect(() => searchDocuments("")).toThrow("required");
    expect(() => searchDocuments("   ")).toThrow("required");
  });

  it("null/undefined도 거부한다", () => {
    expect(() => searchDocuments(null)).toThrow("required");
    expect(() => searchDocuments(undefined)).toThrow("required");
  });
});

describe("createDocument — 입력 유효성", () => {
  it("title이 없으면 거부한다", async () => {
    await expect(createDocument({ documentType: "note" }))
      .rejects.toThrow("title and documentType are required");
  });

  it("documentType이 없으면 거부한다", async () => {
    await expect(createDocument({ title: "제목" }))
      .rejects.toThrow("title and documentType are required");
  });

  it("importance가 1~5 범위를 벗어나면 거부한다", async () => {
    await expect(createDocument({ title: "t", documentType: "note", importance: 0 }))
      .rejects.toThrow("1~5");
    await expect(createDocument({ title: "t", documentType: "note", importance: 6 }))
      .rejects.toThrow("1~5");
  });

  it("importance가 숫자가 아니면 거부한다", async () => {
    await expect(createDocument({ title: "t", documentType: "note", importance: "high" }))
      .rejects.toThrow("1~5");
  });
});

describe("getDocument — UUID 검증", () => {
  it("UUID 형식이 아닌 ID는 400을 던진다", async () => {
    await expect(getDocument("not-a-uuid")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("updateDocument — UUID 검증", () => {
  it("UUID 형식이 아닌 ID는 400을 던진다", async () => {
    await expect(updateDocument("12345", { title: "x" }))
      .rejects.toThrow("유효하지 않은 ID");
  });
});

describe("deleteDocument — UUID 검증", () => {
  it("UUID 형식이 아닌 ID는 400을 던진다", async () => {
    await expect(deleteDocument("abc")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("stripMarkdown — 추가 케이스", () => {
  it("__굵게__ / _기울임_ (언더스코어 변형)도 벗겨낸다", () => {
    expect(stripMarkdown("__진하게__ _슬랜트_")).toBe("진하게 슬랜트");
  });

  it("빈 문자열은 빈 문자열로 유지한다", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("앞뒤 공백을 trim한다", () => {
    expect(stripMarkdown("   hello   ")).toBe("hello");
  });
});

describe("createDocument — importance 경계값", () => {
  it("importance 1과 5는 유효 (importance 관련 에러를 던지지 않음)", async () => {
    // importance 검증은 통과하지만 이후 DB 단계에서 다른 이유로 실패할 수 있어
    // importance 에러 메시지만 검증한다.
    await expect(createDocument({ title: "t", documentType: "note", importance: 1 }))
      .resolves.toBeDefined()
      .catch((e) => expect(e.message).not.toMatch(/1~5/));
    await expect(createDocument({ title: "t", documentType: "note", importance: 5 }))
      .resolves.toBeDefined()
      .catch((e) => expect(e.message).not.toMatch(/1~5/));
  });

  it("importance가 null/undefined면 기본값으로 통과 (importance 에러 아님)", async () => {
    await expect(createDocument({ title: "t", documentType: "note", importance: null }))
      .resolves.toBeDefined()
      .catch((e) => expect(e.message).not.toMatch(/1~5/));
  });
});

describe("getDocument / updateDocument / deleteDocument — 존재하지 않는 UUID", () => {
  // 실 DB에 없는 임의 UUID는 404로 떨어진다 (CJS require는 vi.mock을 우회하므로 실 DB 사용)
  const GHOST_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("getDocument: 존재하지 않으면 404", async () => {
    await expect(getDocument(GHOST_UUID)).rejects.toThrow("문서를 찾을 수 없습니다");
  });

  it("updateDocument: 존재하지 않으면 404", async () => {
    await expect(updateDocument(GHOST_UUID, { title: "x" }))
      .rejects.toThrow("문서를 찾을 수 없습니다");
  });

  it("deleteDocument: 존재하지 않으면 404", async () => {
    await expect(deleteDocument(GHOST_UUID))
      .rejects.toThrow("문서를 찾을 수 없습니다");
  });
});
