/**
 * Comment Store — manages all comment data and operations.
 * Pure JS state (no framework dependency), used via React useState/useReducer.
 */

// ─── Author colors (cycled for multiple authors) ───
const AUTHOR_COLORS = ["#E53935", "#1E88E5", "#43A047", "#8E24AA", "#FB8C00", "#00ACC1", "#D81B60", "#6D4C41"];

let colorIndex = 0;
function nextAuthorColor() {
  const c = AUTHOR_COLORS[colorIndex % AUTHOR_COLORS.length];
  colorIndex++;
  return c;
}

// ─── localStorage keys ───
const LS_AUTHOR = "comment_author";
const LS_COMMENTS = "comment_data";

// ─── ID generation ───
export function generateCommentId() {
  return "cmt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

// ─── Author ───
export function loadAuthor() {
  try {
    const raw = localStorage.getItem(LS_AUTHOR);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveAuthor(author) {
  localStorage.setItem(LS_AUTHOR, JSON.stringify(author));
}

export function createAuthor(name, initials) {
  return {
    id: "author_" + Date.now().toString(36),
    name,
    initials: initials || name.charAt(0),
    color: nextAuthorColor(),
  };
}

// ─── Comment creation helpers ───
export function createComment(author, content, parentId = null) {
  const now = new Date();
  return {
    id: generateCommentId(),
    author,
    createdAt: now.toISOString(),
    modifiedAt: now.toISOString(),
    content,
    parentId,
    replies: [],
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
  };
}

// ─── Initial state ───
export function createCommentStore() {
  return {
    comments: {},           // id -> Comment
    activeCommentId: null,
    markupMode: "all",      // 'all' | 'simple' | 'none' | 'original'
    showCommentsPanel: true,
    showReviewingPane: null, // null | 'vertical' | 'horizontal'
  };
}

// ─── Reducer actions ───
export function commentReducer(state, action) {
  switch (action.type) {
    case "ADD_COMMENT": {
      const { comment } = action;
      return {
        ...state,
        comments: { ...state.comments, [comment.id]: comment },
        activeCommentId: comment.id,
        showCommentsPanel: true,
        markupMode: state.markupMode === "none" || state.markupMode === "original" ? "all" : state.markupMode,
      };
    }

    case "ADD_REPLY": {
      const { parentId, reply } = action;
      const parent = state.comments[parentId];
      if (!parent) return state;
      return {
        ...state,
        comments: {
          ...state.comments,
          [parentId]: {
            ...parent,
            replies: [...parent.replies, reply],
          },
        },
      };
    }

    case "EDIT_COMMENT": {
      const { id, content } = action;
      const comment = state.comments[id];
      if (!comment) return state;
      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: { ...comment, content, modifiedAt: new Date().toISOString() },
        },
      };
    }

    case "EDIT_REPLY": {
      const { parentId, replyIndex, content } = action;
      const parent = state.comments[parentId];
      if (!parent) return state;
      const newReplies = [...parent.replies];
      newReplies[replyIndex] = {
        ...newReplies[replyIndex],
        content,
        modifiedAt: new Date().toISOString(),
      };
      return {
        ...state,
        comments: {
          ...state.comments,
          [parentId]: { ...parent, replies: newReplies },
        },
      };
    }

    case "DELETE_COMMENT": {
      const { id } = action;
      const newComments = { ...state.comments };
      delete newComments[id];
      return {
        ...state,
        comments: newComments,
        activeCommentId: state.activeCommentId === id ? null : state.activeCommentId,
      };
    }

    case "DELETE_REPLY": {
      const { parentId, replyIndex } = action;
      const parent = state.comments[parentId];
      if (!parent) return state;
      const newReplies = parent.replies.filter((_, i) => i !== replyIndex);
      return {
        ...state,
        comments: {
          ...state.comments,
          [parentId]: { ...parent, replies: newReplies },
        },
      };
    }

    case "DELETE_ALL": {
      return {
        ...state,
        comments: {},
        activeCommentId: null,
      };
    }

    case "RESOLVE_COMMENT": {
      const { id, author } = action;
      const comment = state.comments[id];
      if (!comment) return state;
      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: {
            ...comment,
            resolved: true,
            resolvedBy: author,
            resolvedAt: new Date().toISOString(),
          },
        },
      };
    }

    case "REOPEN_COMMENT": {
      const { id } = action;
      const comment = state.comments[id];
      if (!comment) return state;
      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: {
            ...comment,
            resolved: false,
            resolvedBy: null,
            resolvedAt: null,
          },
        },
      };
    }

    case "RESOLVE_ALL": {
      const { author } = action;
      const now = new Date().toISOString();
      const newComments = {};
      for (const [k, v] of Object.entries(state.comments)) {
        newComments[k] = { ...v, resolved: true, resolvedBy: author, resolvedAt: now };
      }
      return { ...state, comments: newComments };
    }

    case "SET_ACTIVE": {
      return { ...state, activeCommentId: action.id };
    }

    case "SET_MARKUP_MODE": {
      return { ...state, markupMode: action.mode };
    }

    case "SET_PANEL_VISIBLE": {
      return { ...state, showCommentsPanel: action.visible };
    }

    case "SET_REVIEWING_PANE": {
      return { ...state, showReviewingPane: action.mode };
    }

    case "LOAD_COMMENTS": {
      return { ...state, comments: action.comments || {} };
    }

    default:
      return state;
  }
}

// ─── Selectors / helpers ───
export function getAllThreads(store) {
  return Object.values(store.comments)
    .filter((c) => !c.parentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function getUnresolvedThreads(store) {
  return getAllThreads(store).filter((c) => !c.resolved);
}

export function getResolvedThreads(store) {
  return getAllThreads(store).filter((c) => c.resolved);
}

export function getCommentCount(store) {
  return Object.keys(store.comments).length;
}

// ─── Find comment marks in the editor for navigation ───
export function findCommentMarks(editor) {
  if (!editor) return [];
  const marks = [];
  const { doc } = editor.state;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    node.marks.forEach((mark) => {
      if (mark.type.name === "comment") {
        const existing = marks.find((m) => m.commentId === mark.attrs.commentId);
        if (!existing) {
          marks.push({
            commentId: mark.attrs.commentId,
            from: pos,
            to: pos + node.nodeSize,
          });
        } else {
          // extend range
          existing.from = Math.min(existing.from, pos);
          existing.to = Math.max(existing.to, pos + node.nodeSize);
        }
      }
    });
  });
  return marks.sort((a, b) => a.from - b.from);
}

export function getNextComment(editor, currentPos) {
  const marks = findCommentMarks(editor);
  if (!marks.length) return null;
  const next = marks.find((m) => m.from > currentPos);
  return next || marks[0]; // wrap around
}

export function getPrevComment(editor, currentPos) {
  const marks = findCommentMarks(editor);
  if (!marks.length) return null;
  const reversed = [...marks].reverse();
  const prev = reversed.find((m) => m.from < currentPos);
  return prev || reversed[0]; // wrap around
}

// ─── Comments persistence (localStorage) ───
export function saveCommentsToLocal(docId, comments) {
  try {
    const key = docId ? `${LS_COMMENTS}_${docId}` : LS_COMMENTS;
    localStorage.setItem(key, JSON.stringify(comments));
  } catch {
    // QuotaExceededError 발생 시 조용히 실패
  }
}

export function loadCommentsFromLocal(docId) {
  try {
    const key = docId ? `${LS_COMMENTS}_${docId}` : LS_COMMENTS;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function clearCommentsFromLocal(docId) {
  try {
    const key = docId ? `${LS_COMMENTS}_${docId}` : LS_COMMENTS;
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

// ─── Format date for display ───
export function formatCommentDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `오늘 ${hour}:${min}`;
  return `${month}월 ${day}일 ${hour}:${min}`;
}
