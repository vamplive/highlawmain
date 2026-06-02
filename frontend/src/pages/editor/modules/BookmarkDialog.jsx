/**
 * BookmarkDialog — 책갈피 대화상자
 * 문서 내 책갈피를 추가, 삭제, 이동할 수 있다.
 */
import { useState, useEffect } from "react";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function BookmarkDialog({ editor, onClose }) {
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // 문서 내 북마크 목록 수집
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const list = [];
      editor.state.doc.descendants((node) => {
        if (node.type.name === "bookmark") {
          list.push({ id: node.attrs.bookmarkId, name: node.attrs.bookmarkName });
        }
      });
      setBookmarks(list);
    });
    return () => { cancelled = true; };
  }, [editor]);

  const handleAdd = () => {
    if (!bookmarkName.trim() || !editor) return;
    editor.chain().focus().setBookmark(bookmarkName.trim()).run();
    onClose();
  };

  const handleDelete = (name) => {
    if (!editor) return;
    editor.chain().focus().removeBookmark(name).run();
    setBookmarks(prev => prev.filter(b => b.name !== name));
  };

  const handleGoTo = (name) => {
    if (!editor) return;
    // 북마크 위치로 이동
    let targetPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "bookmark" && node.attrs.bookmarkName === name) {
        targetPos = pos;
      }
    });
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
    }
  };

  return (
    <DialogShell title="책갈피" onClose={onClose} width={400}>
      <div className="word-dialog-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="word-dialog-label">책갈피 이름</label>
            <input className="word-dialog-input" value={bookmarkName}
              onChange={e => setBookmarkName(e.target.value)}
              placeholder="새 책갈피 이름 입력..." autoFocus />
          </div>
          {bookmarks.length > 0 && (
            <div>
              <label className="word-dialog-label">문서 내 책갈피</label>
              <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 160, overflowY: "auto" }}>
                {bookmarks.map(b => (
                  <div key={b.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 8px", borderBottom: "1px solid #eee", fontSize: 12,
                  }}>
                    <span style={{ cursor: "pointer", color: "#3b82f6" }} onClick={() => handleGoTo(b.name)}>
                      {b.name}
                    </span>
                    <button type="button" onClick={() => handleDelete(b.name)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", fontSize: 11 }}>
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter onOk={handleAdd} onCancel={onClose} />
    </DialogShell>
  );
}
