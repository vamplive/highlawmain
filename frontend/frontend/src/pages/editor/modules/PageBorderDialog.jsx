/**
 * PageBorderDialog — 페이지 테두리 대화상자
 * 페이지 전체에 적용되는 테두리 스타일, 색상, 너비를 설정한다.
 */
import { useState } from "react";
import { BORDER_STYLES, BORDER_WIDTHS, PAGE_BORDER_STYLES } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function PageBorderDialog({ pageBorder, setPageBorder, onClose }) {
  const [style, setStyle] = useState(pageBorder?.style || "none");
  const [width, setWidth] = useState(pageBorder?.width || 1);
  const [color, setColor] = useState(pageBorder?.color || "#333");
  const [preset, setPreset] = useState(pageBorder?.preset || "box");

  const handleOk = () => {
    setPageBorder(style === "none" ? null : { style, width, color, preset });
    onClose();
  };

  return (
    <DialogShell title="페이지 테두리" onClose={onClose} width={480}>
      <div className="word-dialog-body">
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <label className="word-dialog-label">설정</label>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {PAGE_BORDER_STYLES.map(p => (
                <button key={p.id} type="button" onClick={() => { setPreset(p.id); setStyle(p.style); }}
                  style={{
                    padding: "6px 12px", border: preset === p.id ? "2px solid #3b82f6" : "1px solid #ccc",
                    borderRadius: 3, cursor: "pointer", background: "#fff", fontSize: 11,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
            <label className="word-dialog-label">스타일</label>
            <select className="word-dialog-input" value={style} onChange={e => setStyle(e.target.value)} style={{ marginBottom: 8 }}>
              {BORDER_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <label className="word-dialog-label">색</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 50, height: 24, border: "1px solid #ccc", cursor: "pointer", marginBottom: 8 }} />
            <label className="word-dialog-label">너비</label>
            <select className="word-dialog-input" value={width} onChange={e => setWidth(parseFloat(e.target.value))} style={{ width: 80 }}>
              {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
            </select>
          </div>
          {/* 미리보기 */}
          <div style={{ width: 160 }}>
            <label className="word-dialog-label">미리 보기</label>
            <div style={{
              width: 120, height: 160, margin: "0 auto",
              border: style !== "none" ? `${width}px ${style} ${color}` : "1px solid #ddd",
              borderRadius: 3, background: "#fff",
              boxShadow: preset === "shadow" ? "3px 3px 6px rgba(0,0,0,0.2)" : "none",
            }} />
          </div>
        </div>
      </div>
      <DialogFooter onOk={handleOk} onCancel={onClose} />
    </DialogShell>
  );
}
