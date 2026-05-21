import { describe, expect, it } from "vitest";
import { extractToc, toBlogContentHtml } from "../blogContent";

describe("toBlogContentHtml", () => {
  it("renders plain markdown into blog HTML", () => {
    const html = toBlogContentHtml("## 제목\n\n- 첫째\n- 둘째\n\n**강조**");

    expect(html).toContain("<h2 id=\"heading-1\">제목</h2>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>강조</strong>");
  });

  it("renders markdown that was saved as plain editor paragraphs", () => {
    const html = toBlogContentHtml("<p>## 제목</p><p>- 첫째</p><p>- 둘째</p><p>**강조**</p>");

    expect(html).toContain("<h2 id=\"heading-1\">제목</h2>");
    expect(html).toContain("<li>첫째</li>");
    expect(html).toContain("<strong>강조</strong>");
  });

  it("keeps already-rendered editor HTML as HTML", () => {
    const html = toBlogContentHtml("<h2>제목</h2><p><strong>본문</strong></p>");

    expect(html).toContain("<h2 id=\"heading-1\">제목</h2>");
    expect(html).toContain("<strong>본문</strong>");
  });

  it("keeps safe blog image attributes", () => {
    const html = toBlogContentHtml("<figure class=\"blog-figure\"><img src=\"/blog-images/law-guide-article.png\" alt=\"상담 준비 이미지\" loading=\"lazy\" /><figcaption>자료 정리</figcaption></figure>");

    expect(html).toContain("src=\"/blog-images/law-guide-article.png\"");
    expect(html).toContain("alt=\"상담 준비 이미지\"");
    expect(html).toContain("loading=\"lazy\"");
    expect(html).toContain("<figcaption>자료 정리</figcaption>");
  });

  it("keeps footnote section out of generated heading ids and toc", () => {
    const html = toBlogContentHtml("<h2>본문 제목</h2><p>본문</p><section class=\"blog-footnotes\"><h2>각주</h2><ol><li>내용</li></ol></section>");

    expect(html).toContain("<h2 id=\"heading-1\">본문 제목</h2>");
    expect(html).toContain("<h2>각주</h2>");
    expect(extractToc(html)).toEqual([{ level: 2, text: "본문 제목", slug: "heading-1" }]);
  });
});
