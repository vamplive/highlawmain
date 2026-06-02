/**
 * 모바일 본문 북마크 — 문서별 ProseMirror 위치를 localStorage에 저장.
 *
 * 사용자가 긴 글에서 중요한 위치를 마크하고, 명령 팔레트에서 빠르게 점프할 수 있게 한다.
 * 본문 변경에 따라 위치가 어긋날 수 있으므로 텍스트 미리보기를 함께 저장해 두고,
 * 점프 시 ProseMirror에서 텍스트를 재탐색해 위치를 보정한다.
 */
const KEY_PREFIX = "yj-editor-mobile-bookmarks:";

function key(docId) { return `${KEY_PREFIX}${docId || "draft"}`; }

export function loadBookmarks(docId) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(docId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch { return []; }
}

export function saveBookmarks(docId, list) {
  try { localStorage.setItem(key(docId), JSON.stringify(list)); } catch { /* quota */ }
}

export function addBookmarkFromEditor(editor, docId, label) {
  if (!editor) return [];
  const sel = editor.state.selection;
  const pos = sel.from;
  const text = editor.state.doc.textBetween(Math.max(0, pos - 60), pos + 60, "\n", "\0").trim().slice(0, 120);
  const list = loadBookmarks(docId);
  const next = [{ id: `bm_${Date.now()}`, pos, text, label: label || text.slice(0, 30), createdAt: Date.now() }, ...list].slice(0, 30);
  saveBookmarks(docId, next);
  return next;
}

export function removeBookmark(docId, id) {
  const list = loadBookmarks(docId).filter((b) => b.id !== id);
  saveBookmarks(docId, list);
  return list;
}

export function jumpBookmark(editor, bm) {
  if (!editor || !bm) return;
  // 우선 저장된 pos 시도, 그 후 텍스트 검색으로 보정
  let target = bm.pos;
  try {
    const fullText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\0");
    const idx = fullText.indexOf((bm.text || "").slice(0, 30));
    if (idx >= 0) target = idx + 1;
    editor.chain().focus().setTextSelection(Math.max(1, Math.min(target, editor.state.doc.content.size))).scrollIntoView().run();
  } catch { /* ignore */ }
}
