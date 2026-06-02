/**
 * StylesManagerDialog — 스타일 관리자 대화상자
 * 문서 스타일을 생성, 수정, 삭제하고 미리보기를 제공한다.
 */
import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { STYLE_PRESETS } from "./constants";

export function StylesManagerDialog({ onClose, onApplyStyle }) {
  const [selectedStyle, setSelectedStyle] = useState("normal");
  const [customStyles, setCustomStyles] = useState([]);
  const [newStyleName, setNewStyleName] = useState("");

  const allStyles = [...STYLE_PRESETS, ...customStyles];
  const activeStyle = allStyles.find(s => s.id === selectedStyle) || allStyles[0];

  const handleApply = () => {
    if (onApplyStyle && activeStyle) {
      onApplyStyle(activeStyle);
      onClose();
    }
  };

  const handleCreateStyle = () => {
    if (!newStyleName.trim()) return;
    const id = `custom-${Date.now()}`;
    const newStyle = {
      id,
      label: newStyleName,
      tag: "p",
      fontSize: "11pt",
      fontWeight: 400,
      color: "#333",
      fontFamily: "'맑은 고딕', sans-serif",
      custom: true,
    };
    setCustomStyles(prev => [...prev, newStyle]);
    setSelectedStyle(id);
    setNewStyleName("");
  };

  const handleDeleteStyle = (id) => {
    setCustomStyles(prev => prev.filter(s => s.id !== id));
    if (selectedStyle === id) setSelectedStyle("normal");
  };

  return (
    <div className="word-dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ minWidth: 500, maxWidth: 600 }}>
        <div className="word-dialog-title">
          <span>스타일</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} />
          </button>
        </div>
        <div className="word-dialog-body" style={{ display: "flex", gap: 16, minHeight: 360 }}>
          {/* 왼쪽: 스타일 목록 */}
          <div style={{ flex: 1, border: "1px solid #d5d5d5", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {allStyles.map(style => (
                <div key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: selectedStyle === style.id ? "#CCE4F7" : "transparent",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                  <div>
                    <span style={{
                      fontFamily: style.fontFamily,
                      fontSize: parseInt(style.fontSize) > 14 ? 13 : 12,
                      fontWeight: style.fontWeight,
                      color: style.color,
                      fontStyle: style.fontStyle || "normal",
                    }}>가나다 Aa</span>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{style.label}</div>
                  </div>
                  {style.custom && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteStyle(style.id); }}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
                      <Trash2 size={12} color="#999" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 스타일 속성 미리보기 */}
          <div style={{ width: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>미리보기</div>
            <div style={{
              border: "1px solid #d5d5d5", borderRadius: 2, padding: 16, minHeight: 80,
              fontFamily: activeStyle.fontFamily,
              fontSize: activeStyle.fontSize,
              fontWeight: activeStyle.fontWeight,
              color: activeStyle.color,
              fontStyle: activeStyle.fontStyle || "normal",
              lineHeight: 1.75,
            }}>
              가나다라 마바사아 Aa
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: "#555" }}>
              <div><strong>글꼴:</strong> {activeStyle.fontFamily?.split(",")[0]?.replace(/'/g, "")}</div>
              <div><strong>크기:</strong> {activeStyle.fontSize}</div>
              <div><strong>굵기:</strong> {activeStyle.fontWeight >= 600 ? "굵게" : "보통"}</div>
              <div><strong>색상:</strong> {activeStyle.color}</div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              <input type="text" value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="새 스타일 이름..."
                className="word-dialog-input" style={{ fontSize: 11 }} />
              <button onClick={handleCreateStyle} className="word-dialog-btn" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Plus size={12} /> 새 스타일 만들기
              </button>
            </div>
          </div>
        </div>
        <div className="word-dialog-footer">
          <button onClick={handleApply} className="word-dialog-btn primary">적용</button>
          <button onClick={onClose} className="word-dialog-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}
