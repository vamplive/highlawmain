/**
 * CommentPanel — MS Word 365 스타일 메모(댓글) 패널
 *
 * 오른쪽 패널에 메모 카드(풍선)를 표시하고, 본문 하이라이트와 연결선으로 연결.
 * 분리된 하위 컴포넌트들을 조합하여 패널 전체를 구성한다.
 *
 * 관련 파일:
 *   - CommentBalloon.jsx: 개별 댓글 풍선 카드
 *   - CommentIndicators.jsx: 간단한 태그 모드 표시기
 *   - ReviewingPane.jsx: 검토 창
 *   - AuthorSetupDialog.jsx: 사용자 정보 설정 대화상자
 *   - comment-shared.jsx: 공유 UI 컴포넌트 (AuthorAvatar, MoreMenu)
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare, X } from "lucide-react";
import { findCommentMarks, getAllThreads } from "./comment-store";
import { CommentBalloon } from "./CommentBalloon";

// 기존 import 호환을 위한 re-export
export { AuthorSetupDialog } from "./AuthorSetupDialog";
export { CommentIndicators } from "./CommentIndicators";
export { ReviewingPane } from "./ReviewingPane";

/* ─────────────────────────────────────────────
   Comment Panel (오른쪽 패널)
   ───────────────────────────────────────────── */
export function CommentPanel({ editor, commentStore, dispatch, currentAuthor }) {
  const panelRef = useRef(null);
  // connectLines 상태는 현재 렌더링되지 않음 — 향후 본문↔풍선 연결선 UI용 플레이스홀더
  const [, setConnectLines] = useState([]);

  const threads = useMemo(() => getAllThreads(commentStore), [commentStore]);

  // 하이라이트 → 풍선 연결선 계산
  const updateConnectLines = useCallback(() => {
    if (!editor || !panelRef.current) return;
    const marks = findCommentMarks(editor);
    const lines = [];
    const panelRect = panelRef.current.getBoundingClientRect();

    marks.forEach((mark) => {
      try {
        const coords = editor.view.coordsAtPos(mark.from);
        const balloonEl = panelRef.current.querySelector(`[data-comment-id="${mark.commentId}"]`);
        if (!balloonEl) return;
        const balloonRect = balloonEl.getBoundingClientRect();

        lines.push({
          commentId: mark.commentId,
          // 본문 하이라이트 오른쪽 끝 Y 좌표 (패널 기준)
          highlightY: coords.top - panelRect.top + panelRef.current.scrollTop + 8,
          // 풍선 상단 중앙 Y 좌표 (패널 기준)
          balloonY: balloonRect.top - panelRect.top + panelRef.current.scrollTop + 14,
        });
      } catch { /* ignore */ }
    });
    setConnectLines(lines);
  }, [editor]);

  // 에디터 변경, 스크롤, 리사이즈 시 연결선 업데이트
  useEffect(() => {
    if (!editor) return;
    let timer;
    const debouncedUpdate = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => updateConnectLines(...args), 80);
    };

    editor.on("update", debouncedUpdate);
    editor.on("selectionUpdate", debouncedUpdate);

    const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
    if (scrollParent) scrollParent.addEventListener("scroll", debouncedUpdate);
    window.addEventListener("resize", debouncedUpdate);

    setTimeout(updateConnectLines, 150);

    return () => {
      clearTimeout(timer);
      editor.off("update", debouncedUpdate);
      editor.off("selectionUpdate", debouncedUpdate);
      if (scrollParent) scrollParent.removeEventListener("scroll", debouncedUpdate);
      window.removeEventListener("resize", debouncedUpdate);
    };
  }, [editor, updateConnectLines]);

  // 하이라이트 클릭 → 해당 풍선 활성화
  useEffect(() => {
    if (!editor) return;
    const handleClick = () => {
      const { $from } = editor.state.selection;
      const marks = $from.marks();
      const commentMark = marks.find((m) => m.type.name === "comment");
      if (commentMark) {
        dispatch({ type: "SET_ACTIVE", id: commentMark.attrs.commentId });
      }
    };
    editor.on("selectionUpdate", handleClick);
    return () => editor.off("selectionUpdate", handleClick);
  }, [editor, dispatch]);

  const handleActivate = useCallback((id) => {
    dispatch({ type: "SET_ACTIVE", id });
    if (editor) {
      const marks = findCommentMarks(editor);
      const mark = marks.find((m) => m.commentId === id);
      if (mark) {
        editor.commands.setTextSelection({ from: mark.from, to: mark.to });
        const coords = editor.view.coordsAtPos(mark.from);
        const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
        if (scrollParent) {
          const rect = scrollParent.getBoundingClientRect();
          if (coords.top < rect.top || coords.top > rect.bottom) {
            scrollParent.scrollTop += coords.top - rect.top - rect.height / 3;
          }
        }
      }
    }
  }, [editor, dispatch]);

  // 마크업 모드에 따른 필터링
  const visibleThreads = useMemo(() => {
    if (commentStore.markupMode === "none" || commentStore.markupMode === "original") return [];
    if (commentStore.markupMode === "simple") return [];
    return threads;
  }, [threads, commentStore.markupMode]);

  if (!commentStore.showCommentsPanel || visibleThreads.length === 0) return null;

  return (
    <div ref={panelRef} className="comments-panel">
      {/* 헤더 */}
      <div className="comments-panel-header">
        <span className="comments-panel-title">
          <MessageSquare size={13} /> 메모 ({visibleThreads.length})
        </span>
        <button type="button" className="comments-panel-close"
          onClick={() => dispatch({ type: "SET_PANEL_VISIBLE", visible: false })}>
          <X size={14} />
        </button>
      </div>

      {/* 풍선 목록 */}
      <div className="comments-balloon-list">
        {visibleThreads.map((comment) => (
          <CommentBalloon
            key={comment.id}
            comment={comment}
            isActive={commentStore.activeCommentId === comment.id}
            currentAuthor={currentAuthor}
            editor={editor}
            dispatch={dispatch}
            onActivate={handleActivate}
          />
        ))}
      </div>
    </div>
  );
}
