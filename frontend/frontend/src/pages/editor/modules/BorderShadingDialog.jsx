/**
 * BorderShadingDialog — 테두리 및 음영 대화상자
 * 단락에 테두리 스타일(상하좌우)과 음영 색상을 적용한다.
 */
import { useState } from "react";
import { BORDER_STYLES, BORDER_WIDTHS, PARAGRAPH_SHADING_COLORS } from "./constants";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

export function BorderShadingDialog({ editor, onClose }) {
  const [tab, setTab] = useState("border");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#333333");
  const [sides, setSides] = useState({ top: true, bottom: true, left: true, right: true });
  const [shadingColor, setShadingColor] = useState("");

  const handleOk = () => {
    if (!editor) { onClose(); return; }
    if (tab === "border") {
      const borderVal = borderStyle === "none" ? "none" : `${borderWidth}px ${borderStyle} ${borderColor}`;
      editor.chain().focus().setParagraphBorder({
        borderTop: sides.top ? borderVal : "none",
        borderBottom: sides.bottom ? borderVal : "none",
        borderLeft: sides.left ? borderVal : "none",
        borderRight: sides.right ? borderVal : "none",
      }).run();
    } else {
      if (shadingColor) {
        editor.chain().focus().setParagraphShading(shadingColor).run();
      }
    }
    onClose();
  };

  return (
    <DialogShell title="테두리 및 음영" onClose={onClose} width={520}>
      <div className="word-dialog-body">
        <div className="word-dialog-tabs">
          <button className={`word-dialog-tab${tab === "border" ? " active" : ""}`} onClick={() => setTab("border")}>테두리</button>
          <button className={`word-dialog-tab${tab === "shading" ? " active" : ""}`} onClick={() => setTab("shading")}>음영</button>
        </div>
        <div style={{ padding: 16 }}>
          {tab === "border" ? (
            <div style={{ display: "flex", gap: 24 }}>
              {/* 설정 */}
              <div style={{ flex: 1 }}>
                <label className="word-dialog-label">스타일</label>
                <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 120, overflowY: "auto", marginBottom: 12 }}>
                  {BORDER_STYLES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setBorderStyle(s.value)}
                      style={{
                        display: "block", width: "100%", padding: "4px 8px", border: "none",
                        background: borderStyle === s.value ? "#dbeafe" : "transparent",
                        textAlign: "left", cursor: "pointer", fontSize: 12,
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <label className="word-dialog-label">색</label>
                <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}
                  style={{ width: 50, height: 24, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }} />
                <label className="word-dialog-label" style={{ marginTop: 8 }}>너비</label>
                <select value={borderWidth} onChange={e => setBorderWidth(parseFloat(e.target.value))}
                  className="word-dialog-input" style={{ width: 80 }}>
                  {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
                </select>
              </div>
              {/* 미리보기 */}
              <div style={{ width: 180 }}>
                <label className="word-dialog-label">미리 보기</label>
                <div style={{
                  width: 150, height: 100, border: "1px solid #ddd", borderRadius: 3,
                  position: "relative", background: "#fff", margin: "0 auto",
                }}>
                  <div style={{
                    position: "absolute", top: 20, left: 20, right: 20, bottom: 20,
                    borderTop: sides.top ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                    borderBottom: sides.bottom ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                    borderLeft: sides.left ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                    borderRight: sides.right ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                  {[
                    { key: "top", label: "\u25B2" },
                    { key: "bottom", label: "\u25BC" },
                    { key: "left", label: "\u25C0" },
                    { key: "right", label: "\u25B6" },
                  ].map(s => (
                    <button key={s.key} type="button"
                      onClick={() => setSides(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                      style={{
                        width: 28, height: 24, fontSize: 10, border: "1px solid #ccc",
                        borderRadius: 2, cursor: "pointer",
                        background: sides[s.key] ? "#dbeafe" : "#fff",
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "center" }}>
                  <button type="button" onClick={() => setSides({ top: true, bottom: true, left: true, right: true })}
                    style={{ padding: "2px 8px", fontSize: 10, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                    상자
                  </button>
                  <button type="button" onClick={() => setSides({ top: false, bottom: false, left: false, right: false })}
                    style={{ padding: "2px 8px", fontSize: 10, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                    없음
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="word-dialog-label">채우기 색</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 24px)", gap: 3, marginBottom: 12 }}>
                {PARAGRAPH_SHADING_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setShadingColor(c)}
                    style={{
                      width: 24, height: 24, background: c, border: shadingColor === c ? "2px solid #3b82f6" : "1px solid #ddd",
                      borderRadius: 2, cursor: "pointer",
                    }} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <label className="word-dialog-label" style={{ marginBottom: 0 }}>사용자 지정:</label>
                <input type="color" value={shadingColor || "#ffffff"} onChange={e => setShadingColor(e.target.value)}
                  style={{ width: 40, height: 24, border: "1px solid #ccc", cursor: "pointer" }} />
                <button type="button" onClick={() => setShadingColor("")}
                  style={{ padding: "2px 8px", fontSize: 11, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                  없음
                </button>
              </div>
              {/* 미리보기 */}
              <div style={{ marginTop: 16 }}>
                <label className="word-dialog-label">미리 보기</label>
                <div style={{
                  padding: 12, background: shadingColor || "#fff",
                  border: "1px solid #ddd", borderRadius: 3, minHeight: 40,
                  fontSize: 12, color: "#333",
                }}>
                  이 단락에 음영이 적용됩니다. 가나다라마바사 아자차카타파하.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter onOk={handleOk} onCancel={onClose} />
    </DialogShell>
  );
}
