/**
 * CommentBalloon — 개별 댓글 풍선 카드
 *
 * 댓글 내용 표시, 편집, 답글, 해결/다시열기, 삭제 기능을 제공하는 카드 UI.
 * CommentPanel 내부에서 각 댓글 스레드마다 하나씩 렌더링된다.
 */
import { useState, useEffect, useRef } from "react";
import { MoreHorizontal, Check, RotateCcw, Trash2, Pencil, Send, Reply } from "lucide-react";
import { formatCommentDate, createComment } from "./comment-store";
import { AuthorAvatar, MoreMenu } from "./comment-shared";

/* ─────────────────────────────────────────────
   Single Reply
   ───────────────────────────────────────────── */
function ReplyItem({ reply, index, isOwn, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);

  const handleSaveEdit = () => {
    if (editText.trim()) onEdit(index, editText.trim());
    setEditing(false);
  };

  return (
    <div className="comment-reply-item">
      <div className="comment-reply-header">
        <AuthorAvatar author={reply.author} size={22} />
        <span className="comment-author-name" style={{ fontSize: 12 }}>{reply.author.name}</span>
        <span className="comment-timestamp">{formatCommentDate(reply.createdAt)}</span>
        {reply.modifiedAt !== reply.createdAt && <span className="comment-edited-badge">(편집됨)</span>}
        <div style={{ flex: 1 }} />
        {isOwn && (
          <div style={{ position: "relative" }}>
            <button type="button" className="comment-more-btn"
              onClick={() => setMenuOpen(!menuOpen)}>
              <MoreHorizontal size={14} color="#888" />
            </button>
            {menuOpen && (
              <MoreMenu onClose={() => setMenuOpen(false)} items={[
                { label: "답글 편집", icon: <Pencil size={12} />, onClick: () => { setEditing(true); setEditText(reply.content); } },
                { label: "답글 삭제", icon: <Trash2 size={12} />, onClick: () => onDelete(index), danger: true },
              ]} />
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: 4, marginLeft: 28 }}>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            className="comment-edit-textarea"
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
            autoFocus />
          <div className="comment-edit-actions">
            <button className="word-dialog-btn primary" style={{ padding: "2px 10px", fontSize: 11 }} onClick={handleSaveEdit}>저장</button>
            <button className="word-dialog-btn" style={{ padding: "2px 10px", fontSize: 11 }} onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-content" style={{ marginLeft: 28 }}>{reply.content}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Comment Balloon Card
   ───────────────────────────────────────────── */
export function CommentBalloon({
  comment, isActive, currentAuthor, editor, dispatch, onActivate,
}) {
  const isNewComment = !comment.content;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(isNewComment);
  const [editText, setEditText] = useState(comment.content || "");
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const balloonRef = useRef(null);
  const textareaRef = useRef(null);

  const isOwn = currentAuthor && comment.author.id === currentAuthor.id;

  // 새 메모 생성 시 자동 포커스
  useEffect(() => {
    if (isNewComment && editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isNewComment, editing]);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      dispatch({ type: "EDIT_COMMENT", id: comment.id, content: editText.trim() });
      setEditing(false);
    } else if (isNewComment) {
      if (editor) editor.commands.unsetComment(comment.id);
      dispatch({ type: "DELETE_COMMENT", id: comment.id });
    } else {
      setEditing(false);
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    const reply = createComment(currentAuthor, replyText.trim(), comment.id);
    dispatch({ type: "ADD_REPLY", parentId: comment.id, reply });
    setReplyText("");
    setShowReplyInput(false);
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_COMMENT", id: comment.id, author: currentAuthor });
  };

  const handleReopen = () => {
    dispatch({ type: "REOPEN_COMMENT", id: comment.id });
  };

  const handleDeleteThread = () => {
    if (editor) editor.commands.unsetComment(comment.id);
    dispatch({ type: "DELETE_COMMENT", id: comment.id });
  };

  // 해결된 메모 (축소 뷰)
  if (comment.resolved) {
    return (
      <div ref={balloonRef}
        className={`comment-balloon resolved${isActive ? " active" : ""}`}
        data-comment-id={comment.id}
        onClick={() => onActivate(comment.id)}>
        <div className="comment-resolved-header">
          <Check size={14} color="#4CAF50" />
          <AuthorAvatar author={comment.author} size={20} />
          <span className="comment-resolved-text">{comment.content}</span>
          {isActive && (
            <button type="button" className="comment-reopen-btn"
              onClick={(e) => { e.stopPropagation(); handleReopen(); }}>
              <RotateCcw size={11} /> 다시 열기
            </button>
          )}
        </div>
      </div>
    );
  }

  const moreMenuItems = [
    ...(isOwn ? [{ label: "메모 편집", icon: <Pencil size={12} />, onClick: () => { setEditing(true); setEditText(comment.content); } }] : []),
    { label: "스레드 해결", icon: <Check size={12} />, onClick: handleResolve },
    { divider: true },
    ...(isOwn ? [{ label: "메모 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteThread, danger: true }] : []),
    { label: "스레드 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteThread, danger: true },
  ];

  return (
    <div ref={balloonRef}
      className={`comment-balloon${isActive ? " active" : ""}`}
      data-comment-id={comment.id}
      onClick={() => onActivate(comment.id)}
      style={{ "--author-color": comment.author.color }}>

      {/* 왼쪽 색상 바 */}
      <div className="comment-color-bar" style={{ backgroundColor: isActive ? comment.author.color : "transparent" }} />

      {/* 헤더 */}
      <div className="comment-balloon-header">
        <AuthorAvatar author={comment.author} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="comment-author-name">{comment.author.name}</span>
          <div className="comment-meta-row">
            <span className="comment-timestamp">{formatCommentDate(comment.createdAt)}</span>
            {comment.modifiedAt !== comment.createdAt && <span className="comment-edited-badge">(편집됨)</span>}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button type="button" className="comment-more-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <MoreHorizontal size={16} color="#888" />
          </button>
          {menuOpen && <MoreMenu items={moreMenuItems} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* 내용 */}
      {editing ? (
        <div className="comment-edit-area">
          <textarea ref={textareaRef} value={editText} onChange={(e) => setEditText(e.target.value)}
            placeholder={isNewComment ? "메모를 입력하세요..." : ""}
            className="comment-edit-textarea"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (isNewComment && !editText.trim()) {
                  if (editor) editor.commands.unsetComment(comment.id);
                  dispatch({ type: "DELETE_COMMENT", id: comment.id });
                } else {
                  setEditing(false);
                }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
            }}
            autoFocus />
          <div className="comment-edit-actions">
            <button className="comment-action-btn primary" onClick={handleSaveEdit}>
              {isNewComment ? "게시" : "저장"}
            </button>
            <button className="comment-action-btn" onClick={() => {
              if (isNewComment && !editText.trim()) {
                if (editor) editor.commands.unsetComment(comment.id);
                dispatch({ type: "DELETE_COMMENT", id: comment.id });
              } else {
                setEditing(false);
              }
            }}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-content">{comment.content}</div>
      )}

      {/* 답글 목록 */}
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply, i) => (
            <ReplyItem key={reply.id || i} reply={reply} index={i}
              isOwn={currentAuthor && reply.author.id === currentAuthor.id}
              onEdit={(idx, content) => dispatch({ type: "EDIT_REPLY", parentId: comment.id, replyIndex: idx, content })}
              onDelete={(idx) => dispatch({ type: "DELETE_REPLY", parentId: comment.id, replyIndex: idx })} />
          ))}
        </div>
      )}

      {/* 답글 입력 / 해결 버튼 (활성 메모만 표시) */}
      {isActive && !editing && (
        <div className="comment-actions-bar">
          {showReplyInput ? (
            <div className="comment-reply-area">
              <textarea className="comment-reply-input" value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  if (e.key === "Escape") { setShowReplyInput(false); setReplyText(""); }
                }}
                autoFocus />
              <div className="comment-edit-actions">
                <button className="comment-action-btn" onClick={() => { setShowReplyInput(false); setReplyText(""); }}>취소</button>
                <button className="comment-action-btn primary" onClick={handleReply} disabled={!replyText.trim()}>
                  <Send size={11} /> 게시
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-bottom-actions">
              <button className="comment-reply-trigger" onClick={() => setShowReplyInput(true)}>
                <Reply size={12} /> 답글...
              </button>
              <button className="comment-resolve-btn" onClick={handleResolve}>
                <Check size={12} /> 해결
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
