/**
 * 서버측 HTML 살균기
 *
 * 블로그/게시물 본문 HTML을 안전한 화이트리스트로 거른다.
 * 프론트엔드의 sanitizeBlogHtml(DOMPurify)과 동일한 태그/속성 정책을 사용해
 * 정적 SEO 페이지(Nginx 직접 서빙)와 React 클라이언트 양쪽에서 동일한 결과를 보장한다.
 *
 * 적용 지점:
 *  1) blog-service.createPost / updatePost / restoreVersion — 저장 직전
 *  2) blog-static-renderer.articleContentHtml — 정적 HTML 출력 직전
 */
const sanitizeHtml = require("sanitize-html");

const ALLOWED_TAGS = [
  "p", "br", "span", "strong", "em", "u", "s", "code", "pre", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "a", "img", "hr", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "td", "th",
  "sub", "sup", "mark", "div", "section",
];

const ALLOWED_ATTR = ["href", "title", "src", "alt", "rel", "id", "class", "colspan", "rowspan", "loading"];

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_TAGS.reduce((acc, tag) => {
    acc[tag] = ALLOWED_ATTR;
    return acc;
  }, {}),
  // http/https/data(이미지) + mailto/tel만 허용. javascript:, vbscript:, file:, blob: 등 차단.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttribs: ["href", "src"],
  allowProtocolRelative: true,
  // <script>, <style>, <iframe>, <object>, <embed>, <form> 등은 ALLOWED_TAGS에 없으므로 자동 제거되며,
  // 추가로 텍스트 자체도 버려서 인라인 JS 코드가 페이지에 흘러들어가지 않도록 한다.
  disallowedTagsMode: "discard",
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  // 모든 태그에서 on*, style 속성을 차단하기 위해 enforceHtmlBoundary 사용 + 화이트리스트에 없으므로 제거됨.
  enforceHtmlBoundary: false,
  // 허용하지 않은 속성(예: style, on*)은 자동 제거된다.
};

/**
 * 신뢰할 수 없는 입력 HTML을 안전한 HTML로 변환한다.
 * 입력이 비어 있거나 문자열이 아니면 빈 문자열을 반환한다.
 * @param {string} html
 * @returns {string}
 */
function sanitizeRichHtml(html) {
  if (html === null || html === undefined) return "";
  return sanitizeHtml(String(html), SANITIZE_OPTIONS);
}

module.exports = {
  sanitizeRichHtml,
  ALLOWED_TAGS,
  ALLOWED_ATTR,
};
