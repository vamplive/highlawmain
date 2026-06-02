import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "td", "th",
  "a", "img", "sup", "sub", "hr",
];

const ALLOWED_ATTR = [
  "href", "title", "src", "alt", "colspan", "rowspan",
];

const SAFE_URI_PATTERN =
  /^(?:(?:https?|mailto|tel):|data:image\/(?:png|gif|jpe?g|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

export function escapePasteText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plainTextToPasteHtml(text) {
  return escapePasteText(text).replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");
}

export function sanitizeEditorPasteHtml(html) {
  const sanitized = DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_ATTR: ["style", "class", "id", "on*"],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: SAFE_URI_PATTERN,
    KEEP_CONTENT: true,
  });
  return stripPasteArtifacts(sanitized);
}

function stripPasteArtifacts(html) {
  if (!html || typeof document === "undefined") return html || "";

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("span").forEach((span) => {
    if (span.attributes.length > 0) return;
    span.replaceWith(...span.childNodes);
  });

  template.content.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) {
      link.replaceWith(...link.childNodes);
      return;
    }
    if (/^https?:/i.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  return template.innerHTML.trim();
}
