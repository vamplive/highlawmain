/**
 * fileUtils.js — 자동저장 localStorage 래퍼 테스트
 * exportHtml — HTML 외곽(styles + title)이 포함된 Blob이 다운로드되는지 검증.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { autoSaveToLocal, buildFullDocumentHtml, loadAutoSave, clearAutoSave } from "../fileUtils";
import { exportHtml } from "../otherExports";
import { extractBlogFootnotes, normalizeFootnotes, stripBlogFootnotes, withBlogFootnotes } from "../footnote-utils";

const AUTOSAVE_KEY = "word-editor-autosave";

describe("buildFullDocumentHtml", () => {
  it("title/subtitle 메타데이터를 본문 앞에 추가한다", () => {
    const html = buildFullDocumentHtml("<p>본문</p>", {
      title: "계약서",
      subtitle: "검토본",
    });

    expect(html).toContain('data-export-metadata="title"');
    expect(html).toContain(">계약서</h1>");
    expect(html).toContain('data-export-metadata="subtitle"');
    expect(html).toContain(">검토본</p>");
    expect(html.endsWith("<p>본문</p>")).toBe(true);
  });

  it("메타데이터가 없으면 기존 editor body HTML을 그대로 반환한다", () => {
    const body = "<p><strong>본문</strong></p>";
    expect(buildFullDocumentHtml(body, { title: "  ", subtitle: "" })).toBe(body);
  });

  it("메타데이터 텍스트는 HTML로 이스케이프한다", () => {
    const html = buildFullDocumentHtml("<p>본문</p>", {
      title: "<계약 & 검토>",
      subtitle: "\"초안\"",
    });

    expect(html).toContain("&lt;계약 &amp; 검토&gt;");
    expect(html).toContain("&quot;초안&quot;");
    expect(html).not.toContain("><계약");
  });

  it("문서 내보내기 HTML 끝에 각주를 포함하고 줄바꿈을 보존한다", () => {
    const html = buildFullDocumentHtml("<p>본문</p>", {}, {
      footnoteNumberFormat: "lowerRoman",
      footnotes: [
        { id: "fn-1", number: 1, content: "첫 줄\n둘째 줄" },
      ],
    });

    expect(html).toContain('data-export-notes="각주"');
    expect(html).toContain("<sup>i</sup>");
    expect(html).toContain("첫 줄<br>둘째 줄");
  });

  it("문서 내보내기 HTML 끝에 미주도 포함한다", () => {
    const html = buildFullDocumentHtml("<p>본문</p>", {}, {
      endnoteNumberFormat: "upperAlpha",
      endnotes: [
        { id: "en-1", number: 1, content: "미주 내용" },
      ],
    });

    expect(html).toContain('data-export-notes="미주"');
    expect(html).toContain("<sup>A</sup>");
    expect(html).toContain("미주 내용");
  });

  it("문서 내보내기 HTML에 그리기 스트로크를 SVG로 포함한다", () => {
    const html = buildFullDocumentHtml("<p>본문</p>", {}, {
      pageW: 800,
      pageH: 1000,
      drawings: [
        { color: "#ff0000", width: 3, opacity: 0.5, points: [{ x: 10, y: 20 }, { x: 30, y: 40 }] },
      ],
    });

    expect(html).toContain('data-export-drawings="true"');
    expect(html).toContain('viewBox="0 0 800 1000"');
    expect(html).toContain('stroke="#ff0000"');
    expect(html).toContain("M 10 20 L 30 40");
  });
});

describe("autoSaveToLocal / loadAutoSave / clearAutoSave", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("저장 후 불러오면 동일 payload (timestamp 포함)", () => {
    const before = Date.now();
    autoSaveToLocal("<p>hi</p>", { type: "doc" });
    const loaded = loadAutoSave();
    expect(loaded.html).toBe("<p>hi</p>");
    expect(loaded.doc).toEqual({ type: "doc" });
    expect(typeof loaded.timestamp).toBe("number");
    expect(loaded.timestamp).toBeGreaterThanOrEqual(before);
  });

  it("저장 값은 AUTOSAVE_KEY 하위에 JSON 문자열로 들어간다", () => {
    autoSaveToLocal("<p>x</p>", null, { footnotes: { footnotes: [{ id: "fn-1" }] } });
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    expect(raw).toBeTypeOf("string");
    const parsed = JSON.parse(raw);
    expect(parsed.html).toBe("<p>x</p>");
    expect(parsed.footnotes.footnotes).toEqual([{ id: "fn-1" }]);
  });

  it("loadAutoSave는 키가 없으면 null", () => {
    expect(loadAutoSave()).toBeNull();
  });

  it("loadAutoSave는 JSON 파싱 실패 시 null", () => {
    localStorage.setItem(AUTOSAVE_KEY, "not-json{");
    expect(loadAutoSave()).toBeNull();
  });

  it("clearAutoSave는 키를 제거한다", () => {
    autoSaveToLocal("<p>x</p>", null);
    expect(localStorage.getItem(AUTOSAVE_KEY)).not.toBeNull();
    clearAutoSave();
    expect(localStorage.getItem(AUTOSAVE_KEY)).toBeNull();
  });

  it("QuotaExceededError는 조용히 삼킨다 (throw 없음)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => autoSaveToLocal("<p>x</p>", null)).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});

describe("blog footnote helpers", () => {
  it("appends blog footnotes at the bottom and preserves body", () => {
    const html = withBlogFootnotes("<p>본문</p>", [
      { id: "fn-1", number: 1, content: "대법원 판례 참조" },
    ]);

    expect(html).toContain("<p>본문</p>");
    expect(html).toContain("class=\"blog-footnotes\"");
    expect(html).toContain("id=\"fn-content-fn-1\"");
    expect(html).toContain("대법원 판례 참조");
  });

  it("extracts and strips saved blog footnotes", () => {
    const saved = withBlogFootnotes("<p>본문</p>", [
      { id: "fn-1", number: 1, content: "각주 내용" },
    ]);

    expect(extractBlogFootnotes(saved)).toEqual([
      { id: "fn-1", number: 1, content: "각주 내용", refId: "fn-1" },
    ]);
    expect(stripBlogFootnotes(saved)).toBe("<p>본문</p>");
  });

  it("structured blog footnote JSON을 정규화한다", () => {
    expect(normalizeFootnotes(JSON.stringify([{ id: "fn-1", number: 1, content: "내용" }]))).toEqual([
      { id: "fn-1", number: 1, content: "내용" },
    ]);
    expect(normalizeFootnotes("bad-json")).toEqual([]);
  });
});

describe("exportHtml", () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("downloadBlob에 title.html 파일명으로 넘긴다", () => {
    const anchors = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el);
      return el;
    });
    exportHtml("<p>본문</p>", "계약서");
    const a = anchors[anchors.length - 1];
    expect(a.download).toBe("계약서.html");
  });

  it("생성된 Blob은 DOCTYPE + lang=ko + 사용자 HTML + 스타일을 포함한다", async () => {
    let capturedBlob;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn((blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });

    exportHtml("<p>본문-마커</p>", "제목X");
    const text = await capturedBlob.text();
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain('<html lang="ko">');
    expect(text).toContain("<title>제목X</title>");
    expect(text).toContain("<p>본문-마커</p>");
    expect(text).toContain("맑은 고딕");

    URL.createObjectURL = origCreate;
  });

  it("title 생략 시 기본 파일명은 '문서.html'", () => {
    const anchors = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === "a") anchors.push(el);
      return el;
    });
    exportHtml("<p>x</p>");
    const a = anchors[anchors.length - 1];
    expect(a.download).toBe("문서.html");
  });
});
