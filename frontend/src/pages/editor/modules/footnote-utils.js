import { formatFootnoteNumber } from "./footnote-extension";

const BLOG_FOOTNOTES_CLASS = "blog-footnotes";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseEditorMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function buildEditorMetadata(doc = {}, footnoteState = {}) {
  return {
    ...parseEditorMetadata(doc.metadata),
    editor: {
      ...parseEditorMetadata(doc.metadata).editor,
      footnotes: footnoteState.footnotes || [],
      endnotes: footnoteState.endnotes || [],
      footnoteNumberFormat: footnoteState.footnoteNumberFormat || "decimal",
      endnoteNumberFormat: footnoteState.endnoteNumberFormat || "lowerRoman",
      drawings: Array.isArray(footnoteState.drawings) ? footnoteState.drawings : [],
      headerText: footnoteState.headerText || "",
      footerText: footnoteState.footerText || "",
    },
  };
}

export function extractFootnoteStateFromMetadata(metadata) {
  const editor = parseEditorMetadata(metadata).editor || {};
  return {
    footnotes: Array.isArray(editor.footnotes) ? editor.footnotes : [],
    endnotes: Array.isArray(editor.endnotes) ? editor.endnotes : [],
    footnoteNumberFormat: editor.footnoteNumberFormat || "decimal",
    endnoteNumberFormat: editor.endnoteNumberFormat || "lowerRoman",
    drawings: Array.isArray(editor.drawings) ? editor.drawings : [],
    headerText: editor.headerText || "",
    footerText: editor.footerText || "",
  };
}

export function stripBlogFootnotes(html = "") {
  if (!html || typeof document === "undefined") return html || "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  wrapper.querySelectorAll(`.${BLOG_FOOTNOTES_CLASS}`).forEach((node) => node.remove());
  return wrapper.innerHTML.trim();
}

export function extractBlogFootnotes(html = "") {
  if (!html || typeof document === "undefined") return [];
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const items = wrapper.querySelectorAll(`.${BLOG_FOOTNOTES_CLASS} li[id^="fn-content-"]`);
  return Array.from(items).map((item, index) => {
    const id = item.id.replace(/^fn-content-/, "");
    const backref = item.querySelector(".blog-footnote-backref");
    const clone = item.cloneNode(true);
    clone.querySelectorAll(".blog-footnote-backref").forEach((node) => node.remove());
    clone.querySelectorAll(".blog-footnote-number").forEach((node) => node.remove());
    return {
      id,
      number: index + 1,
      content: (clone.textContent || "").trim(),
      ...(backref?.getAttribute("href") ? { refId: backref.getAttribute("href").replace(/^#fn-ref-/, "") } : {}),
    };
  }).filter((item) => item.id);
}

export function normalizeFootnotes(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildBlogFootnotesHtml(footnotes = [], numberFormat = "decimal") {
  const usable = footnotes.filter((fn) => fn?.id);
  if (!usable.length) return "";

  const items = usable.map((fn, index) => {
    const number = formatFootnoteNumber(fn.number || index + 1, numberFormat);
    const content = escapeHtml(fn.content || "").replace(/\n/g, "<br>");
    const id = escapeHtml(fn.id);
    return `<li id="fn-content-${id}" class="blog-footnote-item"><span class="blog-footnote-number">${escapeHtml(number)}</span> ${content || "<span class=\"blog-footnote-empty\">각주 내용 없음</span>"} <a class="blog-footnote-backref" href="#fn-ref-${id}" aria-label="본문 각주로 돌아가기">↩</a></li>`;
  }).join("");

  return `<section class="${BLOG_FOOTNOTES_CLASS}" aria-label="각주"><h2>각주</h2><ol>${items}</ol></section>`;
}

export function withBlogFootnotes(html = "", footnotes = [], numberFormat = "decimal") {
  const cleanBody = stripBlogFootnotes(html);
  const footnotesHtml = buildBlogFootnotesHtml(footnotes, numberFormat);
  return footnotesHtml ? `${cleanBody}${footnotesHtml}` : cleanBody;
}
