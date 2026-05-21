/**
 * DOCX 가져오기 - mammoth.js로 .docx 파일을 HTML로 변환
 *
 * 보안: mammoth가 반환한 HTML은 외부에서 작성된 파일이므로
 *       반드시 DOMPurify로 정제한 뒤 에디터에 삽입한다 (Stored XSS 방지).
 *
 * style 속성은 허용하지 않는다.
 *   CSS는 url(), expression(), behavior:url(...) 등 다양한 우회 벡터를 가진다.
 *   DOCX 임포트는 의미 구조(굵게/이탤릭/목록/표) 보존이 우선이며,
 *   세밀한 시각 스타일은 에디터에서 다시 적용하는 것이 안전하다.
 */
import DOMPurify from "dompurify";
import { showEditorAlert } from "./editorToast";

const ALLOWED_TAGS = [
  "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "td", "th",
  "a", "img", "sup", "sub", "hr",
];
const ALLOWED_ATTR = ["href", "title", "src", "alt", "colspan", "rowspan"];
const FORBID_ATTR = ["style", "on*"];

export async function importDocx(file) {
  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return DOMPurify.sanitize(result.value, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    });
  } catch (err) {
    showEditorAlert("DOCX 불러오기 중 오류가 발생했습니다: " + err.message);
    return null;
  }
}
