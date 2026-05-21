/**
 * markdown-analyzer.js — 마크다운 자동 분석 순수 함수 테스트
 * frontmatter 파싱, 문서 유형 분류, 키워드 추출, 통합 분석의 결정적 동작을 검증한다.
 */
import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const {
  parseFrontmatter, classifyDocumentType, extractKeywords, analyzeMarkdown,
} = require("../../lib/markdown-analyzer");

describe("parseFrontmatter", () => {
  it("frontmatter가 없으면 body는 원본 그대로", () => {
    const { frontmatter, body } = parseFrontmatter("# 제목\n\n본문");
    expect(frontmatter).toEqual({});
    expect(body).toBe("# 제목\n\n본문");
  });

  it("--- 구분자 내부의 key: value를 파싱한다", () => {
    const md = "---\ntitle: 계약법\nauthor: 홍길동\n---\n본문";
    const { frontmatter, body } = parseFrontmatter(md);
    expect(frontmatter.title).toBe("계약법");
    expect(frontmatter.author).toBe("홍길동");
    expect(body).toBe("본문");
  });

  it("따옴표로 감싼 값을 벗겨낸다", () => {
    const md = "---\ntitle: \"큰따옴표\"\nsubtitle: '작은따옴표'\n---\n";
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter.title).toBe("큰따옴표");
    expect(frontmatter.subtitle).toBe("작은따옴표");
  });

  it("배열 값 [a, b, c]를 배열로 파싱한다", () => {
    const md = "---\ntags: [계약, 법, 민법]\n---\n";
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter.tags).toEqual(["계약", "법", "민법"]);
  });
});

describe("classifyDocumentType", () => {
  it("frontmatter type 힌트를 최우선으로 쓴다", () => {
    expect(classifyDocumentType("짧은 글", { type: "판례" })).toBe("case_law");
    expect(classifyDocumentType("짧은 글", { type: "law" })).toBe("statute");
    expect(classifyDocumentType("짧은 글", { type: "news" })).toBe("news");
  });

  it("제N조 패턴이 있으면 법령으로 분류한다", () => {
    const content = "제1조 (목적) 이 법은 ... 제2조 (정의) ... 시행령 ...";
    expect(classifyDocumentType(content, {})).toBe("statute");
  });

  it("판례 번호 패턴(YYYY다NNNN)은 case_law 가중치가 크다", () => {
    const content = "대법원 2019다12345 판결 선고 주문 원고 피고";
    expect(classifyDocumentType(content, {})).toBe("case_law");
  });

  it("기자/보도 키워드가 있으면 news로 분류한다", () => {
    const content = "연합뉴스 기자 취재 보도에 따르면 속보로 전해진 ".repeat(5);
    expect(classifyDocumentType(content, {})).toBe("news");
  });

  it("매칭되는 지표가 없는 짧은 문서는 note", () => {
    expect(classifyDocumentType("간단한 메모", {})).toBe("note");
  });
});

describe("extractKeywords", () => {
  it("markdown 문법을 제거하고 키워드를 뽑는다", () => {
    const md = "# 제목\n\n**중요한** 계약 관련 *분쟁* 사례입니다. 계약 위반 계약 해지";
    const keywords = extractKeywords(md);
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
  });

  it("maxKeywords 제한을 지킨다", () => {
    const md = "단어1 단어2 단어3 단어4 단어5 단어6 단어7 단어8 단어9 단어10".repeat(10);
    const keywords = extractKeywords(md, 3);
    expect(keywords.length).toBeLessThanOrEqual(3);
  });
});

describe("analyzeMarkdown — 통합", () => {
  it("frontmatter와 본문을 함께 분석해 구조화된 결과를 반환한다", () => {
    const md = [
      "---",
      "title: 공사 하자 분쟁",
      "tags: [건설, 하자]",
      "---",
      "# 공사 하자 분쟁",
      "",
      "대법원 2019다12345 판결에 따르면...",
    ].join("\n");

    const result = analyzeMarkdown(md, "dispute.md");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("documentType");
    expect(result).toHaveProperty("keywords");
    expect(result.documentType).toBe("case_law");
  });

  it("frontmatter 없는 순수 마크다운도 처리한다", () => {
    const result = analyzeMarkdown("# 간단한 메모\n\n오늘 할 일 정리");
    expect(result.title).toContain("간단한 메모");
    expect(result.documentType).toBe("note");
  });
});
