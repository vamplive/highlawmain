/**
 * CrossReferenceDialog — 상호 참조 대화상자
 * 문서 내 제목, 책갈피, 표를 참조하여 링크를 삽입한다.
 */
import { useState, useEffect } from "react";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function CrossReferenceDialog({ editor, onClose }) {
  const [refType, setRefType] = useState("heading");
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  // 문서 내 참조 가능 항목 수집
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const list = [];
      editor.state.doc.descendants((node) => {
        if (refType === "heading" && node.type.name === "heading") {
          list.push({ text: node.textContent, type: `제목 ${node.attrs.level}` });
        } else if (refType === "bookmark" && node.type.name === "bookmark") {
          list.push({ text: node.attrs.bookmarkName, type: "책갈피" });
        } else if (refType === "table" && node.type.name === "table") {
          list.push({ text: "표", type: "표" });
        }
      });
      setItems(list);
    });
    return () => { cancelled = true; };
  }, [editor, refType]);

  const handleOk = () => {
    if (!selectedItem || !editor) { onClose(); return; }
    const item = items[parseInt(selectedItem)];
    if (item) {
      editor.chain().focus().insertContent(
        `<span style="color:#3b82f6;text-decoration:underline;cursor:pointer;">${item.text}</span>`
      ).run();
    }
    onClose();
  };

  return (
    <DialogShell title="상호 참조" onClose={onClose} width={460}>
      <div className="word-dialog-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="word-dialog-label">참조 유형</label>
            <select className="word-dialog-input" value={refType} onChange={e => setRefType(e.target.value)}>
              <option value="heading">제목</option>
              <option value="bookmark">책갈피</option>
              <option value="table">표</option>
            </select>
          </div>
          <div>
            <label className="word-dialog-label">참조할 항목</label>
            <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 200, overflowY: "auto" }}>
              {items.length === 0 && (
                <div style={{ padding: 12, color: "#999", fontSize: 12, textAlign: "center" }}>
                  항목이 없습니다
                </div>
              )}
              {items.map((item, i) => (
                <button key={i} type="button" onClick={() => setSelectedItem(String(i))}
                  style={{
                    display: "block", width: "100%", padding: "6px 8px", border: "none",
                    background: selectedItem === String(i) ? "#dbeafe" : "transparent",
                    textAlign: "left", cursor: "pointer", fontSize: 12,
                    borderBottom: "1px solid #eee",
                  }}>
                  <span style={{ color: "#888", fontSize: 10, marginRight: 8 }}>[{item.type}]</span>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter onOk={handleOk} onCancel={onClose} />
    </DialogShell>
  );
}
