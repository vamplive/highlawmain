/**
 * NewTablePropertiesDialog — 확장된 표 속성 대화상자
 * 표 너비/맞춤, 스타일 선택, 셀 속성을 설정한다.
 * NewDialogs.jsx에서는 TablePropertiesDialog로 export된다.
 */
import { useState } from "react";
import { TABLE_STYLES } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function NewTablePropertiesDialog({ editor, onClose }) {
  const [tab, setTab] = useState("table");
  const [tableWidth, setTableWidth] = useState("100");
  const [tableAlign, setTableAlign] = useState("left");
  const [cellPadding, setCellPadding] = useState("6");
  const [selectedStyle, setSelectedStyle] = useState("plain");

  const handleOk = () => {
    // 표 스타일 적용은 CSS 클래스로 처리
    onClose();
  };

  return (
    <DialogShell title="표 속성" onClose={onClose} width={560}>
      <div className="word-dialog-body">
        <div className="word-dialog-tabs">
          <button className={`word-dialog-tab${tab === "table" ? " active" : ""}`} onClick={() => setTab("table")}>표</button>
          <button className={`word-dialog-tab${tab === "style" ? " active" : ""}`} onClick={() => setTab("style")}>스타일</button>
          <button className={`word-dialog-tab${tab === "cell" ? " active" : ""}`} onClick={() => setTab("cell")}>셀</button>
        </div>
        <div style={{ padding: 16 }}>
          {tab === "table" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <label className="word-dialog-label">너비 (%)</label>
                  <input className="word-dialog-input" type="number" min={10} max={100} value={tableWidth}
                    onChange={e => setTableWidth(e.target.value)} style={{ width: 80 }} />
                </div>
                <div>
                  <label className="word-dialog-label">맞춤</label>
                  <select className="word-dialog-input" value={tableAlign} onChange={e => setTableAlign(e.target.value)} style={{ width: 100 }}>
                    <option value="left">왼쪽</option>
                    <option value="center">가운데</option>
                    <option value="right">오른쪽</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="word-dialog-label">셀 안쪽 여백 (px)</label>
                <input className="word-dialog-input" type="number" min={0} max={20} value={cellPadding}
                  onChange={e => setCellPadding(e.target.value)} style={{ width: 80 }} />
              </div>
            </div>
          )}
          {tab === "style" && (
            <div>
              <label className="word-dialog-label">표 스타일 선택</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {TABLE_STYLES.map(s => (
                  <button key={s.id} type="button" onClick={() => setSelectedStyle(s.id)}
                    style={{
                      padding: 8, border: selectedStyle === s.id ? "2px solid #3b82f6" : "1px solid #ddd",
                      borderRadius: 4, cursor: "pointer", background: "#fff", textAlign: "left",
                    }}>
                    {/* 미니 표 미리보기 */}
                    <div style={{ fontSize: 8, marginBottom: 4, display: "flex", flexDirection: "column", gap: 1 }}>
                      <div style={{ background: s.headerBg || "#f1f5f9", color: s.headerColor || "#333", padding: "2px 4px", borderRadius: 1, borderBottom: s.headerBorderBottom || "none" }}>
                        헤더
                      </div>
                      <div style={{ background: s.stripedBg || "#fff", padding: "2px 4px", borderRadius: 1 }}>행 1</div>
                      <div style={{ padding: "2px 4px" }}>행 2</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#555" }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === "cell" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div>
                  <label className="word-dialog-label">셀 너비</label>
                  <input className="word-dialog-input" type="text" placeholder="자동" style={{ width: 80 }} />
                </div>
                <div>
                  <label className="word-dialog-label">세로 맞춤</label>
                  <select className="word-dialog-input" style={{ width: 100 }}>
                    <option value="top">위쪽</option>
                    <option value="middle">가운데</option>
                    <option value="bottom">아래쪽</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="word-dialog-btn"
                  onClick={() => editor?.chain().focus().mergeCells().run()}>
                  셀 병합
                </button>
                <button type="button" className="word-dialog-btn"
                  onClick={() => editor?.chain().focus().splitCell().run()}>
                  셀 분할
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter onOk={handleOk} onCancel={onClose} />
    </DialogShell>
  );
}
