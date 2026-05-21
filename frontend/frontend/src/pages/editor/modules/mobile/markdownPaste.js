/**
 * 모바일 마크다운 붙여넣기 자동 변환
 *
 * 외부 메모 앱(예: Notion, 메모, 옵시디언)에서 복사한 마크다운 텍스트를 붙여넣으면
 * # 제목, **굵게**, *기울임*, - 리스트, > 인용, [링크](url) 등을 자동으로 변환한다.
 *
 * `marked` 라이브러리가 이미 의존성에 있으므로 활용. HTML로 변환 후 insertContent.
 */
import { marked } from "marked";

const MARKDOWN_HINTS = [
  /^#{1,6}\s/m,                 // # 제목
  /\*\*[^*\n]+\*\*/,            // **굵게**
  /(^|\s)\*[^*\n]+\*/,          // *기울임*
  /^[-*]\s/m,                   // - 리스트
  /^\d+\.\s/m,                  // 1. 번호
  /^>\s/m,                      // > 인용
  /\[[^\]]+\]\([^)]+\)/,        // [링크](url)
  /^```/m,                      // 코드 블록
];

export function looksLikeMarkdown(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim();
  if (t.length < 4) return false;
  let hits = 0;
  for (const re of MARKDOWN_HINTS) if (re.test(t)) hits += 1;
  return hits >= 1 && t.length < 30000;
}

/**
 * editor의 paste 핸들러에 등록. plain text 형식으로 들어온 마크다운을 HTML로 변환해 삽입.
 * 다른 핸들러가 처리할 수 있도록 마크다운 신호가 명확할 때만 가로채고 그렇지 않으면 false 반환.
 *
 * @returns 분리 함수
 */
export function attachMarkdownPasteHandler(editor) {
  if (!editor?.view?.dom) return () => {};
  const dom = editor.view.dom;
  const onPaste = (event) => {
    const items = event.clipboardData;
    if (!items) return;
    // HTML이 동시에 있으면 ProseMirror 기본 처리에 맡김 (의도적 마크다운 표는 표 그대로)
    const html = items.getData("text/html");
    if (html && html.length > 16) return;
    const text = items.getData("text/plain");
    if (!text || !looksLikeMarkdown(text)) return;
    event.preventDefault();
    try {
      const out = marked.parse(text, { gfm: true, breaks: true });
      editor.chain().focus().insertContent(out).run();
    } catch {
      editor.chain().focus().insertContent(text).run();
    }
  };
  dom.addEventListener("paste", onPaste);
  return () => dom.removeEventListener("paste", onPaste);
}
