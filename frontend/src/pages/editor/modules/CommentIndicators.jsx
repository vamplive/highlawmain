/**
 * CommentIndicators — 간단한 태그 모드에서 여백에 표시되는 댓글 표시기
 *
 * "simple" 마크업 모드일 때 본문 옆에 아이콘을 표시하여
 * 해당 위치에 댓글이 있음을 나타낸다.
 */
import { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { findCommentMarks } from "./comment-store";
import { debounce } from "./comment-utils";

export function CommentIndicators({ editor, commentStore, dispatch }) {
  const [indicators, setIndicators] = useState([]);

  const updateIndicators = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    // editor.view 게터는 view가 마운트되기 전에는 throw하므로 try/catch 필수
    let dom;
    try {
      dom = editor.view?.dom;
    } catch { return; }
    if (!dom) return;
    const marks = findCommentMarks(editor);
    const pageArea = dom.closest(".editor-page-area");
    if (!pageArea) return;
    const pageRect = pageArea.getBoundingClientRect();

    const inds = marks.map((mark) => {
      try {
        const comment = commentStore.comments[mark.commentId];
        if (!comment || comment.resolved) return null;
        const coords = editor.view.coordsAtPos(mark.from);
        return {
          commentId: mark.commentId,
          top: coords.top - pageRect.top,
        };
      } catch { return null; }
    }).filter(Boolean);
    setIndicators(inds);
  }, [editor, commentStore.comments]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const debounced = debounce(updateIndicators, 100);
    editor.on("update", debounced);
    editor.on("selectionUpdate", debounced);
    // scrollParent 조회는 view 준비 후에만 가능 — setTimeout 안에서 처리
    let scrollParent = null;
    const attachScroll = () => {
      try {
        const dom = editor.view?.dom;
        if (!dom) return;
        scrollParent = dom.closest(".editor-canvas-scroll");
        if (scrollParent) scrollParent.addEventListener("scroll", debounced);
      } catch { /* view 미준비 — 무시 */ }
      updateIndicators();
    };
    const t = setTimeout(attachScroll, 200);
    return () => {
      clearTimeout(t);
      editor.off("update", debounced);
      editor.off("selectionUpdate", debounced);
      if (scrollParent) scrollParent.removeEventListener("scroll", debounced);
    };
  }, [editor, updateIndicators]);

  if (commentStore.markupMode !== "simple") return null;

  return (
    <>
      {indicators.map((ind) => (
        <div key={ind.commentId}
          className="comment-margin-indicator"
          style={{ top: ind.top }}
          onClick={() => {
            dispatch({ type: "SET_MARKUP_MODE", mode: "all" });
            dispatch({ type: "SET_ACTIVE", id: ind.commentId });
            dispatch({ type: "SET_PANEL_VISIBLE", visible: true });
          }}
          title="메모 보기">
          <MessageSquare size={16} color="#FB8C00" />
        </div>
      ))}
    </>
  );
}
