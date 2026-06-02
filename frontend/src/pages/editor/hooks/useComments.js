/**
 * 댓글 시스템 훅
 * — EditorPage에서 분리된 댓글 생성/삭제/탐색/저장 로직
 */
import { useState, useCallback, useEffect, useReducer, useRef } from "react";
import {
  createCommentStore, commentReducer, createComment, generateCommentId,
  loadAuthor, saveAuthor, createAuthor,
  getNextComment, getPrevComment,
  saveCommentsToLocal, loadCommentsFromLocal,
} from "../modules/comment-store";

export default function useComments(editor, docId) {
  const [commentStore, dispatch] = useReducer(commentReducer, null, createCommentStore);
  const [commentAuthor, setCommentAuthor] = useState(() => loadAuthor());
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);
  const pendingCallbackRef = useRef(null);

  /** 작성자가 설정되어 있으면 바로 콜백, 아니면 다이얼로그 표시 */
  const ensureAuthor = useCallback((callback) => {
    if (commentAuthor) {
      callback(commentAuthor);
    } else {
      setShowAuthorDialog(true);
      pendingCallbackRef.current = callback;
    }
  }, [commentAuthor]);

  /** 작성자 다이얼로그 취소 */
  const handleAuthorCancel = useCallback(() => {
    setShowAuthorDialog(false);
    pendingCallbackRef.current = null;
  }, []);

  /** 작성자 다이얼로그에서 저장 */
  const handleAuthorSave = useCallback((name, initials) => {
    const author = createAuthor(name, initials);
    saveAuthor(author);
    setCommentAuthor(author);
    setShowAuthorDialog(false);
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current(author);
      pendingCallbackRef.current = null;
    }
  }, []);

  /** 댓글 삽입 */
  const handleInsertComment = useCallback(() => {
    if (!editor) return;
    ensureAuthor((author) => {
      const { from, to } = editor.state.selection;
      const id = generateCommentId();

      if (from === to) {
        // 선택 없음 — 커서 위치의 단어 자동 선택
        const $pos = editor.state.doc.resolve(from);
        const word = $pos.parent.textContent;
        if (!word.trim()) return;
        const textBefore = $pos.parent.textBetween(0, $pos.parentOffset);
        const textAfter = $pos.parent.textBetween($pos.parentOffset, $pos.parent.content.size);
        const wordStart = textBefore.search(/\S+$/);
        const wordEndMatch = textAfter.match(/^\S+/);
        const wordEnd = wordEndMatch ? $pos.parentOffset + wordEndMatch[0].length : $pos.parentOffset;
        const absStart = $pos.start() + (wordStart >= 0 ? wordStart : $pos.parentOffset);
        const absEnd = $pos.start() + wordEnd;
        if (absStart < absEnd) {
          editor.chain().focus().setTextSelection({ from: absStart, to: absEnd }).setComment(id).run();
        } else {
          return;
        }
      } else {
        editor.chain().focus().setComment(id).run();
      }

      const comment = createComment(author, "");
      comment.id = id;
      dispatch({ type: "ADD_COMMENT", comment });
    });
  }, [editor, ensureAuthor]);

  /** 활성 댓글 삭제 */
  const handleDeleteActiveComment = useCallback(() => {
    if (!editor || !commentStore.activeCommentId) return;
    editor.commands.unsetComment(commentStore.activeCommentId);
    dispatch({ type: "DELETE_COMMENT", id: commentStore.activeCommentId });
  }, [editor, commentStore.activeCommentId]);

  /** 전체 댓글 삭제 */
  const handleDeleteAllComments = useCallback(() => {
    if (!editor) return;
    editor.commands.unsetAllComments();
    dispatch({ type: "DELETE_ALL" });
  }, [editor]);

  /** 다음 댓글로 이동 */
  const handleNextComment = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const next = getNextComment(editor, from);
    if (next) {
      editor.commands.setTextSelection({ from: next.from, to: next.to });
      editor.commands.scrollIntoView();
      dispatch({ type: "SET_ACTIVE", id: next.commentId });
    }
  }, [editor]);

  /** 이전 댓글로 이동 */
  const handlePrevComment = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const prev = getPrevComment(editor, from);
    if (prev) {
      editor.commands.setTextSelection({ from: prev.from, to: prev.to });
      editor.commands.scrollIntoView();
      dispatch({ type: "SET_ACTIVE", id: prev.commentId });
    }
  }, [editor]);

  // Ctrl+Alt+M 커스텀 이벤트 리스너
  useEffect(() => {
    const handler = () => handleInsertComment();
    window.addEventListener("comment:insert", handler);
    return () => window.removeEventListener("comment:insert", handler);
  }, [handleInsertComment]);

  // 댓글 자동 저장
  useEffect(() => {
    if (Object.keys(commentStore.comments).length > 0) {
      saveCommentsToLocal(docId, commentStore.comments);
    }
  }, [commentStore.comments, docId]);

  // 문서 로드 시 저장된 댓글 복원
  useEffect(() => {
    const saved = loadCommentsFromLocal(docId);
    if (saved && Object.keys(saved).length > 0) {
      dispatch({ type: "LOAD_COMMENTS", comments: saved });
    }
  }, [docId]);

  // 댓글 하이라이트 활성/해결 CSS 클래스 동기화
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const updateHighlights = () => {
      if (!editor || editor.isDestroyed) return;
      // editor.view 게터는 view가 마운트되기 전에는 throw하므로 try/catch 필수
      let dom;
      try {
        dom = editor.view?.dom;
      } catch { return; }
      if (!dom) return;
      dom.querySelectorAll("span.comment-highlight").forEach((el) => {
        const id = el.getAttribute("data-comment-id");
        el.classList.toggle("comment-active", id === commentStore.activeCommentId);
        const comment = commentStore.comments[id];
        el.classList.toggle("comment-resolved", comment?.resolved ?? false);
      });
    };
    const t = setTimeout(updateHighlights, 0);
    editor.on("update", updateHighlights);
    return () => {
      clearTimeout(t);
      editor.off("update", updateHighlights);
    };
  }, [editor, commentStore.activeCommentId, commentStore.comments]);

  /** 전체 댓글 초기화 (새 문서 등) */
  const deleteAllComments = useCallback(() => {
    dispatch({ type: "DELETE_ALL" });
  }, []);

  /** 저장된 댓글 로드 */
  const loadComments = useCallback((comments) => {
    dispatch({ type: "LOAD_COMMENTS", comments });
  }, []);

  /** 활성 댓글 설정 */
  const setActiveComment = useCallback((id) => {
    dispatch({ type: "SET_ACTIVE", id });
  }, []);

  return {
    commentStore,
    // TODO: commentDispatch는 CommentPanel, ContextMenu, OtherTabs 등에서 직접 dispatch하는 곳이
    // 래핑 함수로 전환되면 제거해야 한다.
    commentDispatch: dispatch,
    commentAuthor, showAuthorDialog,
    handleInsertComment, handleAuthorSave, handleAuthorCancel,
    handleDeleteActiveComment, handleDeleteAllComments,
    handleNextComment, handlePrevComment,
    deleteAllComments, loadComments, setActiveComment,
  };
}
