import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "td", "th",
  "a", "img", "sup", "sub", "hr", "button",
];

const ALLOWED_ATTR = [
  "href", "title", "src", "alt", "target", "rel",
  "id", "class", "style", "colspan", "rowspan",
  "type", "data-field-key",
];

const SAFE_URI_PATTERN =
  /^(?:(?:https?|mailto|tel):|data:image\/(?:png|gif|jpe?g|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

export function sanitizeContractHtml(html) {
  const sanitized = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: SAFE_URI_PATTERN,
  });
  return stripUnsafeInlineStyles(sanitized);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value) {
  return escapeHtml(value);
}

export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripUnsafeInlineStyles(html) {
  if (!html || typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    if (/(?:url\s*\(|expression\s*\(|behavior\s*:|@import|-moz-binding)/i.test(style)) {
      el.removeAttribute("style");
    }
  });
  return template.innerHTML;
}
