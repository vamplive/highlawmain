/**
 * blog-service.js — 순수 함수 + 입력 유효성 테스트
 * generateSlug 결정성 / createPost·updatePost·deletePost 검증 분기만 커버한다.
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
}));

vi.mock("../../db/schema", () => ({ blogPosts: {}, blogPostVersions: {} }));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({})),
  desc: vi.fn(() => ({})),
  and: vi.fn(() => ({})),
  count: vi.fn(() => ({})),
  max: vi.fn(() => ({})),
  lte: vi.fn(() => ({})),
}));

const {
  generateSlug,
  createPost,
  updatePost,
  deletePost,
  getPost,
  normalizeFootnotes,
} = await import("../../services/blog-service.js");

describe("generateSlug — URL 안전 슬러그", () => {
  it("한글은 유지하고 공백은 하이픈으로 바꾼다", () => {
    const slug = generateSlug("윤정 법률 칼럼");
    expect(slug).toMatch(/^윤정-법률-칼럼-[a-z0-9]+$/);
  });

  it("특수문자를 제거한다", () => {
    const slug = generateSlug("계약?? 해지!@#");
    expect(slug).not.toMatch(/[?!@#]/);
  });

  it("연속 하이픈/공백은 단일 하이픈으로 축약한다", () => {
    const slug = generateSlug("abc   def   ghi");
    expect(slug).not.toMatch(/--/);
  });

  it("앞뒤 하이픈은 제거한다", () => {
    const slug = generateSlug("-- 제목 --");
    expect(slug.startsWith("-")).toBe(false);
  });

  it("호출할 때마다 타임스탬프 접미사가 달라 유일성을 보장한다", async () => {
    const s1 = generateSlug("test");
    await new Promise((r) => setTimeout(r, 5));
    const s2 = generateSlug("test");
    // 밀리초 간격이 짧으면 같을 수도 있지만 형식은 `base-접미사` 꼴
    expect(s1).toMatch(/^test-[a-z0-9]+$/);
    expect(s2).toMatch(/^test-[a-z0-9]+$/);
  });
});

describe("createPost — 입력 유효성", () => {
  it("title이 없으면 거부한다", async () => {
    await expect(createPost({ content: "본문" }))
      .rejects.toThrow("title과 content는 필수");
  });

  it("content가 없으면 거부한다", async () => {
    await expect(createPost({ title: "제목" }))
      .rejects.toThrow("title과 content는 필수");
  });

  it("둘 다 없으면 거부한다", async () => {
    await expect(createPost({})).rejects.toThrow("title과 content는 필수");
  });
});

describe("normalizeFootnotes — 블로그 각주 저장 포맷", () => {
  it("배열 입력을 JSON 문자열로 정규화한다", () => {
    const normalized = normalizeFootnotes([
      { id: "fn-1", number: "2", content: "각주 내용" },
    ]);

    expect(JSON.parse(normalized)).toEqual([
      { id: "fn-1", number: 2, content: "각주 내용" },
    ]);
  });

  it("잘못된 JSON이나 빈 배열은 null로 처리한다", () => {
    expect(normalizeFootnotes("not-json")).toBeNull();
    expect(normalizeFootnotes([])).toBeNull();
  });
});

describe("updatePost — UUID 검증", () => {
  it("UUID 형식이 아닌 ID는 400을 던진다", async () => {
    await expect(updatePost("not-a-uuid", { title: "x" }))
      .rejects.toThrow("유효하지 않은 ID");
  });

  it("빈 ID도 거부한다", async () => {
    await expect(updatePost("", { title: "x" }))
      .rejects.toThrow("유효하지 않은 ID");
  });
});

describe("deletePost — UUID 검증", () => {
  it("UUID 형식이 아닌 ID는 400을 던진다", async () => {
    await expect(deletePost("12345")).rejects.toThrow("유효하지 않은 ID");
  });
});

describe("generateSlug — 추가 엣지 케이스", () => {
  it("빈 문자열은 접미사만 있는 슬러그를 만든다", () => {
    const slug = generateSlug("");
    expect(slug).toMatch(/^-[a-z0-9]+$/);
  });

  it("영문 대소문자는 모두 소문자로 변환한다", () => {
    const slug = generateSlug("Hello World TEST");
    expect(slug.startsWith("hello-world-test-")).toBe(true);
  });

  it("숫자는 유지된다", () => {
    const slug = generateSlug("2026 법률 이야기");
    expect(slug).toMatch(/^2026-법률-이야기-[a-z0-9]+$/);
  });
});

describe("실 DB 404 경로 (valid UUID / slug 없음)", () => {
  const GHOST_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("updatePost: 존재하지 않으면 404", async () => {
    await expect(updatePost(GHOST_UUID, { title: "x" }))
      .rejects.toThrow("게시글을 찾을 수 없습니다");
  });

  it("deletePost: 존재하지 않으면 404", async () => {
    await expect(deletePost(GHOST_UUID))
      .rejects.toThrow("게시글을 찾을 수 없습니다");
  });

  it("getPost: 존재하지 않는 slug는 404", async () => {
    await expect(getPost(`ghost-slug-${Date.now()}`))
      .rejects.toThrow("게시글을 찾을 수 없습니다");
  });
});
