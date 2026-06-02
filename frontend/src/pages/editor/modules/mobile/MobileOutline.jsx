/**
 * MobileOutline — 헤딩 트리 점프 패널
 *
 * 본문에 있는 h1/h2/h3 노드를 추출하여 우측 슬라이드 드로어로 표시.
 * 항목을 탭하면 해당 위치로 부드럽게 스크롤하고 커서를 옮긴다.
 *
 * 긴 글에서 모바일로도 빠르게 섹션 사이를 이동할 수 있게 한다.
 */
import { memo, useEffect, useState } from "react";
import { X } from "lucide-react";

function extractHeadings(editor) {
  if (!editor) return [];
  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type?.name === "heading") {
      headings.push({
        level: node.attrs?.level || 1,
        text: node.textContent || "",
        pos,
      });
    }
    return true;
  });
  return headings;
}

export const MobileOutline = memo(function MobileOutline({ editor, open, onClose }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!open || !editor) return undefined;
    const sync = () => setHeadings(extractHeadings(editor));
    sync();
    editor.on("update", sync);
    return () => editor.off("update", sync);
  }, [open, editor]);

  if (!open) return null;

  const jump = (h) => {
    if (!editor) return;
    try {
      editor.chain().focus().setTextSelection(h.pos + 1).scrollIntoView().run();
      onClose?.();
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={onClose} />
      <div className="editor-moutline editor-mobile-only" role="dialog" aria-label="문서 개요">
        <div className="moutline-header">
          <span>개요 ({headings.length})</span>
          <button type="button" onClick={onClose} aria-label="닫기"><X size={20} /></button>
        </div>
        <div className="moutline-list">
          {headings.length === 0 && (
            <div className="moutline-empty">아직 헤딩이 없습니다. 슬래시(/) 메뉴에서 제목을 추가해 보세요.</div>
          )}
          {headings.map((h, i) => (
            <button
              key={`${h.pos}-${i}`}
              type="button"
              className={`moutline-item lvl-${h.level}`}
              onClick={() => jump(h)}
            >
              <span className="moutline-bullet" data-level={h.level}>H{h.level}</span>
              <span className="moutline-text">{h.text || "(빈 제목)"}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
});

export default MobileOutline;
