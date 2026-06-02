/**
 * HyperlinkDialog — 하이퍼링크 삽입/편집 대화상자
 * URL과 표시 텍스트를 설정하거나 기존 링크를 제거한다.
 */
import { useState, useEffect } from "react";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function HyperlinkDialog({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const attrs = editor.getAttributes("link");
      if (attrs.href) setUrl(attrs.href);
      const { from, to } = editor.state.selection;
      if (from !== to) {
        setText(editor.state.doc.textBetween(from, to));
      }
    });
    return () => { cancelled = true; };
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      if (text && editor.state.selection.empty) {
        editor.chain().focus()
          .insertContent(`<a href="${url}">${text}</a>`)
          .run();
      } else {
        editor.chain().focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }
    }
    onClose();
  };

  return (
    <DialogShell title="하이퍼링크 삽입" onClose={onClose} width={440}>
      <div className="word-dialog-body">
        <div style={{ marginBottom: 12 }}>
          <label className="word-dialog-label">표시할 텍스트(T):</label>
          <input className="word-dialog-input" value={text} onChange={e => setText(e.target.value)} placeholder="링크 텍스트" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="word-dialog-label">주소(A):</label>
          <input className="word-dialog-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" autoFocus />
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>
          링크를 제거하려면 주소를 비워두고 확인을 누르세요.
        </div>
      </div>
      <DialogFooter
        onOk={apply}
        onCancel={onClose}
        extraButtons={
          <button className="word-dialog-btn" onClick={() => { if (editor) editor.chain().focus().unsetLink().run(); onClose(); }}>링크 제거</button>
        }
      />
    </DialogShell>
  );
}
