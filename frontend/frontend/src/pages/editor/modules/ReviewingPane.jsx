/**
 * ReviewingPane — Word 스타일 검토 창
 *
 * 수직/수평 모드로 모든 댓글 스레드를 목록 형태로 표시.
 * 항목 클릭 시 본문 해당 위치로 스크롤하고 댓글을 활성화한다.
 */
import { useMemo } from "react";
import { MessageSquare, Check, Reply, X } from "lucide-react";
import { formatCommentDate, findCommentMarks, getAllThreads } from "./comment-store";
import { AuthorAvatar } from "./comment-shared";

export function ReviewingPane({ mode, commentStore, dispatch, editor, onClose }) {
  const threads = useMemo(() => getAllThreads(commentStore), [commentStore]);
  const isVertical = mode === "vertical";

  const handleItemClick = (commentId) => {
    dispatch({ type: "SET_ACTIVE", id: commentId });
    if (editor) {
      const marks = findCommentMarks(editor);
      const mark = marks.find((m) => m.commentId === commentId);
      if (mark) {
        editor.commands.setTextSelection({ from: mark.from, to: mark.to });
        const coords = editor.view.coordsAtPos(mark.from);
        const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
        if (scrollParent) {
          const rect = scrollParent.getBoundingClientRect();
          scrollParent.scrollTop += coords.top - rect.top - rect.height / 3;
        }
      }
    }
  };

  return (
    <div className={`reviewing-pane ${isVertical ? "reviewing-pane-vertical" : "reviewing-pane-horizontal"}`}>
      {/* 헤더 */}
      <div className="reviewing-pane-header">
        <div>
          <span className="reviewing-pane-title">검토 창</span>
          <span className="reviewing-pane-count">메모: {threads.length}개</span>
        </div>
        <button type="button" onClick={onClose} className="reviewing-pane-close">
          <X size={14} />
        </button>
      </div>

      {/* 목록 */}
      <div className="reviewing-pane-list">
        {threads.map((comment) => (
          <div key={comment.id}
            className={`reviewing-pane-item${commentStore.activeCommentId === comment.id ? " active" : ""}`}
            onClick={() => handleItemClick(comment.id)}>
            <div className="reviewing-pane-item-header">
              <AuthorAvatar author={comment.author} size={20} />
              <span className="reviewing-pane-item-name">{comment.author.name}</span>
              <span className="reviewing-pane-item-date">{formatCommentDate(comment.createdAt)}</span>
              {comment.resolved && <Check size={12} color="#4CAF50" />}
            </div>
            <div className="reviewing-pane-item-content">{comment.content}</div>
            {comment.replies.length > 0 && (
              <div className="reviewing-pane-item-replies">
                <Reply size={10} /> 답글 {comment.replies.length}개
              </div>
            )}
          </div>
        ))}

        {threads.length === 0 && (
          <div className="reviewing-pane-empty">
            <MessageSquare size={24} color="#ccc" />
            <span>메모가 없습니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}
