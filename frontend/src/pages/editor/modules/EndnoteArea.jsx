/**
 * EndnoteArea — 문서 끝에 표시되는 미주 영역
 *
 * FootnoteArea와 유사하지만 문서 끝에 위치하며,
 * 미주 번호 클릭 시 본문 참조 위치로 스크롤한다.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getFootnoteIdsFromDoc, formatFootnoteNumber } from "./footnote-extension";

export function EndnoteArea({
  editor, endnotes, setEndnotes,
  numberFormat = "lowerRoman",
}) {
  const editInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // 문서 순서 동기화
  useEffect(() => {
    if (!editor) return;

    const syncNumbers = () => {
      const docFootnotes = getFootnoteIdsFromDoc(editor.state.doc);
      const docIds = docFootnotes
        .filter(f => f.noteType === "endnote")
        .map(f => f.id);

      setEndnotes(prev => {
        let updated = prev.filter(fn => docIds.includes(fn.id));
        updated.sort((a, b) => docIds.indexOf(a.id) - docIds.indexOf(b.id));
        updated = updated.map((fn, i) => ({ ...fn, number: i + 1 }));
        return updated;
      });
    };

    editor.on("update", syncNumbers);
    syncNumbers();
    return () => editor.off("update", syncNumbers);
  }, [editor, setEndnotes]);

  const scrollToReference = useCallback((footnoteId) => {
    if (!editor) return;
    let targetPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "footnoteReference" && node.attrs.footnoteId === footnoteId) {
        targetPos = pos;
        return false;
      }
    });
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
      try {
        const domPos = editor.view.domAtPos(targetPos);
        const el = domPos.node.nodeType === Node.TEXT_NODE ? domPos.node.parentElement : domPos.node;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch { /* ignore */ }
    }
  }, [editor]);

  const startEdit = (id, content) => {
    setEditingId(id);
    setEditValue(content || "");
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 30);
  };

  const finishEdit = (id) => {
    setEndnotes(prev => prev.map(fn =>
      fn.id === id ? { ...fn, content: editValue } : fn
    ));
    setEditingId(null);
  };

  const deleteEndnote = (id) => {
    if (!editor) return;
    editor.commands.removeFootnote(id);
    setEndnotes(prev => prev.filter(fn => fn.id !== id));
  };

  const handleEndnoteKeyDown = (e, endnoteId) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      finishEdit(endnoteId);
      return;
    }
    if (e.key === "Escape") {
      setEditingId(null);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      finishEdit(endnoteId);
      const idx = endnotes.findIndex((fn) => fn.id === endnoteId);
      const next = endnotes[idx + 1];
      if (next) startEdit(next.id, next.content);
    }
  };

  if (!endnotes || endnotes.length === 0) return null;

  return (
    <div className="endnote-area">
      <div className="endnote-separator" />
      <div className="endnote-header">미주</div>
      <div className="footnote-list">
        {endnotes.map((fn) => {
          const displayNum = formatFootnoteNumber(fn.number, numberFormat);
          const isEditing = editingId === fn.id;

          return (
            <div key={fn.id} data-footnote-item-id={fn.id}
              className={`footnote-item${isEditing ? " footnote-item-editing" : ""}`}>
              <span className="footnote-item-number endnote-number"
                onClick={() => scrollToReference(fn.id)}
                title="클릭하면 본문 위치로 이동">
                {displayNum}
              </span>
              <div className="footnote-item-content" style={{ flex: 1 }}>
                {isEditing ? (
                  <textarea ref={editInputRef} className="footnote-edit-input"
                    value={editValue} onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => finishEdit(fn.id)}
                    onKeyDown={(e) => handleEndnoteKeyDown(e, fn.id)} />
                ) : (
                  <span className="footnote-item-text"
                    onClick={() => startEdit(fn.id, fn.content)}>
                    {fn.content || "(클릭하여 미주 내용 입력)"}
                  </span>
                )}
              </div>
              <button type="button" className="footnote-delete-btn"
                onClick={() => deleteEndnote(fn.id)} title="미주 삭제">✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
