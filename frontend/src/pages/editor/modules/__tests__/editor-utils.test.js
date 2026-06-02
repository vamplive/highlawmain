/**
 * 에디터 모듈 — 순수 유틸 테스트
 * comment-utils (debounce), fileHelpers (isMarkdown / htmlToMarkdown / downloadBlob),
 * editorToast (showEditorAlert), colorPalette / coverPageTemplates 상수 검증.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "../comment-utils";
import { isMarkdown, htmlToMarkdown, downloadBlob } from "../fileHelpers";
import { showEditorAlert } from "../editorToast";
import { THEME_COLORS, THEME_TINTS } from "../colorPalette";
import { COVER_PAGE_PRESETS } from "../coverPageTemplates";
import { createPageGapNode } from "../pagination-extension";
import { buildEditorMetadata, extractFootnoteStateFromMetadata } from "../footnote-utils";
import { TOAST_DURATION_MS, TOAST_FADEOUT_MS } from "../../../../utils/timing";

describe("debounce", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("delay 전까지는 실행되지 않는다", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("연속 호출 시 마지막 호출만 실행되고 인자가 유지된다", () => {
    const fn = vi.fn();
    const d = debounce(fn, 50);
    d("a");
    vi.advanceTimersByTime(30);
    d("b");
    vi.advanceTimersByTime(30);
    d("c");
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });
});

describe("isMarkdown", () => {
  it("# 헤딩으로 시작하면 마크다운", () => {
    expect(isMarkdown("# 제목")).toBe(true);
    expect(isMarkdown("### 제목")).toBe(true);
  });

  it("** 볼드 문법이 있으면 마크다운", () => {
    expect(isMarkdown("앞 **강조** 뒤")).toBe(true);
  });

  it("- 또는 * 리스트로 시작하면 마크다운", () => {
    expect(isMarkdown("- 항목\n- 항목")).toBe(true);
    expect(isMarkdown("* 항목")).toBe(true);
  });

  it("리스트 판정은 첫 비어있지 않은 줄 기준", () => {
    expect(isMarkdown("\n\n- 항목")).toBe(true);
  });

  it("평범한 텍스트는 마크다운 아님", () => {
    expect(isMarkdown("그냥 글입니다")).toBe(false);
    expect(isMarkdown("")).toBe(false);
    expect(isMarkdown(null)).toBe(false);
  });
});

describe("htmlToMarkdown", () => {
  it("h1/h2/h3을 # ## ###로 변환한다", () => {
    expect(htmlToMarkdown("<h1>A</h1>")).toContain("# A");
    expect(htmlToMarkdown("<h2>B</h2>")).toContain("## B");
    expect(htmlToMarkdown("<h3>C</h3>")).toContain("### C");
  });

  it("strong/b는 **, em/i는 *로 변환한다", () => {
    expect(htmlToMarkdown("<strong>굵게</strong>")).toBe("**굵게**");
    expect(htmlToMarkdown("<b>굵게</b>")).toBe("**굵게**");
    expect(htmlToMarkdown("<em>기울임</em>")).toBe("*기울임*");
    expect(htmlToMarkdown("<i>기울임</i>")).toBe("*기울임*");
  });

  it("p 태그는 이중 개행, br은 단일 개행", () => {
    expect(htmlToMarkdown("<p>첫째</p><p>둘째</p>")).toContain("첫째\n\n둘째");
    expect(htmlToMarkdown("A<br>B")).toContain("A\nB");
  });

  it("남은 HTML 태그를 제거하고 엔티티를 디코드한다", () => {
    const out = htmlToMarkdown("<div><span>5 &lt; 7 &amp; 8 &gt; 2</span></div>");
    // div/span 태그는 제거되고 숫자/엔티티 디코드 결과만 남는다
    expect(out).not.toMatch(/<\/?(div|span)/i);
    expect(out).toContain("5");
    expect(out).toContain("<");
    expect(out).toContain("&");
    expect(out).toContain(">");
  });

  it("빈 값은 빈 문자열", () => {
    expect(htmlToMarkdown("")).toBe("");
    expect(htmlToMarkdown(null)).toBe("");
  });
});

describe("downloadBlob", () => {
  beforeEach(() => {
    // URL.createObjectURL은 jsdom에 기본 구현이 없음
    global.URL.createObjectURL = vi.fn(() => "blob:mock");
    global.URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("a 태그를 생성해 클릭 후 제거한다", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    downloadBlob(blob, "test.txt");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    // a 태그가 body에서 정리되었는지
    expect(document.body.querySelector("a[download]")).toBeNull();
  });
});

describe("showEditorAlert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("메시지 엘리먼트를 DOM에 삽입한다", () => {
    showEditorAlert("저장 완료");
    expect(document.body.querySelector("div").textContent).toBe("저장 완료");
  });

  it("TOAST_DURATION_MS + FADEOUT_MS 이후 제거된다", () => {
    showEditorAlert("사라질");
    const el = document.body.querySelector("div");
    vi.advanceTimersByTime(TOAST_DURATION_MS);
    expect(el.style.opacity).toBe("0");
    vi.advanceTimersByTime(TOAST_FADEOUT_MS);
    expect(document.body.contains(el)).toBe(false);
  });
});

describe("colorPalette 상수", () => {
  it("테마 색상은 10개이고 모두 hex", () => {
    expect(THEME_COLORS).toHaveLength(10);
    THEME_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/));
  });

  it("틴트 매트릭스는 5행 x 10열 모두 hex", () => {
    expect(THEME_TINTS).toHaveLength(5);
    THEME_TINTS.forEach((row) => {
      expect(row).toHaveLength(10);
      row.forEach((c) => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/));
    });
  });
});

describe("COVER_PAGE_PRESETS", () => {
  it("3종 (basic/modern/business)을 포함한다", () => {
    expect(COVER_PAGE_PRESETS.map((p) => p.id)).toEqual(["basic", "modern", "business"]);
  });

  it("각 프리셋의 build()가 유효한 HTML 문자열을 반환한다", () => {
    for (const preset of COVER_PAGE_PRESETS) {
      const html = preset.build();
      expect(typeof html).toBe("string");
      expect(html).toContain("page-break-after");
      expect(html).toContain("문서 제목");
    }
  });

  it("build() 결과에 오늘 날짜(ko-KR locale)가 포함된다", () => {
    const today = new Date().toLocaleDateString("ko-KR");
    for (const preset of COVER_PAGE_PRESETS) {
      expect(preset.build()).toContain(today);
    }
  });
});

describe("createPageGapNode", () => {
  it("페이지 갭 DOM을 만들고 머리글/바닥글은 텍스트로만 삽입한다", () => {
    const node = createPageGapNode({
      pageWidth: 794,
      pageGap: 20,
      marginTop: 96,
      marginBottom: 96,
      marginLeft: 80,
      marginRight: 80,
      headerText: "<img src=x onerror=alert(1)>",
      footerText: "문서 {PAGE}",
      page: 2,
      afterPage: 1,
    });

    expect(node.dataset.pageGap).toBe("true");
    expect(node.querySelector(".editor-page-gap-separator").textContent).toBe("1 / 2");
    expect(node.querySelector(".header-text").textContent).toBe("<img src=x onerror=alert(1)>");
    expect(node.querySelector(".header-text").querySelector("img")).toBeNull();
    expect(node.querySelector(".footer-text").textContent).toBe("문서 {PAGE}");
  });
});

describe("editor metadata", () => {
  it("머리글/바닥글 상태를 저장하고 복원한다", () => {
    const metadata = buildEditorMetadata(
      { metadata: { editor: { existing: true } } },
      { headerText: "문서 머리글", footerText: "페이지 {PAGE}" },
    );

    expect(metadata.editor.headerText).toBe("문서 머리글");
    expect(metadata.editor.footerText).toBe("페이지 {PAGE}");
    expect(metadata.editor.existing).toBe(true);

    const restored = extractFootnoteStateFromMetadata(metadata);
    expect(restored.headerText).toBe("문서 머리글");
    expect(restored.footerText).toBe("페이지 {PAGE}");
  });
});
