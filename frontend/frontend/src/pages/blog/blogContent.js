import { marked } from "marked";
import DOMPurify from "dompurify";

export const CATEGORY_LABELS = {
  construction_realestate: "건설부동산 이야기",
  case_analysis: "판례 분석",
  law_guide: "법률 가이드",
};

export function htmlToPlainText(html = "") {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map((tag) => String(tag).trim()).filter(Boolean);
  } catch {
    // fall through to comma parser
  }
  return String(tags).split(",").map((tag) => tag.trim()).filter(Boolean);
}

export function tagsToInputValue(tags) {
  return parseTags(tags).join(", ");
}

export function looksLikeHtml(content) {
  if (!content) return false;
  const trimmed = content.trim();
  return /^<(p|h[1-6]|ul|ol|blockquote|figure|img|table|div|hr|pre|article)\b/i.test(trimmed);
}

function hasRenderedHtmlStructure(wrapper) {
  return Boolean(wrapper.querySelector([
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "blockquote", "figure", "img", "table", "pre", "hr",
  ].join(",")));
}

function blockTextFromHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const blocks = wrapper.querySelectorAll("p, div, li, blockquote, h1, h2, h3, h4, h5, h6, pre");
  if (blocks.length === 0) return wrapper.textContent || "";
  const lines = Array.from(blocks)
    .map((node) => (node.textContent || "").trimEnd())
    .filter((text) => text.trim());
  return lines.reduce((acc, line, index) => {
    if (index === 0) return line;
    const previous = lines[index - 1];
    const bothListItems = /^\s*(?:[-*+]|\d+\.)\s+\S/.test(previous) && /^\s*(?:[-*+]|\d+\.)\s+\S/.test(line);
    return `${acc}${bothListItems ? "\n" : "\n\n"}${line}`;
  }, "");
}

function containsMarkdownSyntax(text) {
  const source = String(text || "");
  return /(^|\n)\s{0,3}(#{1,6}\s+\S|[-*+]\s+\S|\d+\.\s+\S|>\s+\S|```|---+\s*$|\|.+\|)/m.test(source)
    || /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*]\([^)]+\))/.test(source);
}

function htmlLooksLikePlainMarkdown(content) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = content;
  if (hasRenderedHtmlStructure(wrapper)) return false;
  return containsMarkdownSyntax(blockTextFromHtml(content));
}

export function extractToc(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const headings = wrapper.querySelectorAll("h2, h3");
  let counter = 0;
  return Array.from(headings).filter((h) => !h.closest(".blog-footnotes")).map((h) => {
    counter += 1;
    const text = h.textContent.trim();
    const slug = `heading-${counter}`;
    return { level: h.tagName === "H2" ? 2 : 3, text, slug };
  });
}

export function assignHeadingIds(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const headings = wrapper.querySelectorAll("h2, h3");
  let counter = 0;
  headings.forEach((h) => {
    if (h.closest(".blog-footnotes")) return;
    counter += 1;
    h.setAttribute("id", `heading-${counter}`);
  });
  return wrapper.innerHTML;
}

export function sanitizeBlogHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "span", "strong", "em", "u", "s", "code", "pre", "blockquote",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "a", "img", "hr", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "td", "th",
      "sub", "sup", "mark", "div", "section",
    ],
    /* 이미지 편집(리사이즈/정렬/캡션) 결과를 보존하기 위해
       width, height, style, data-align 을 추가 허용한다.
       style 은 DOMPurify가 자체적으로 위험한 CSS 값을 필터링한다. */
    ALLOWED_ATTR: [
      "href", "title", "src", "alt", "rel", "id", "class",
      "colspan", "rowspan", "loading",
      "width", "height", "style",
      "data-align", "data-yj-image",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

export function toBlogContentHtml(content = "") {
  const source = String(content || "");
  const html = looksLikeHtml(source)
    ? (htmlLooksLikePlainMarkdown(source)
      ? marked.parse(blockTextFromHtml(source), { breaks: true, gfm: true, mangle: false })
      : source)
    : marked.parse(source, { breaks: true, gfm: true, mangle: false });
  return sanitizeBlogHtml(assignHeadingIds(html));
}
