/**
 * SymbolPickerDialog — 기호 삽입 대화상자
 * 특수문자와 수식 기호를 카테고리별로 탐색하고 에디터에 삽입한다.
 */
import { useState } from "react";
import { X } from "lucide-react";
import { SPECIAL_CHARS, EQUATION_SYMBOLS } from "./constants";

export function SymbolPickerDialog({ editor, onClose }) {
  const [activeTab, setActiveTab] = useState("symbols");
  const [category, setCategory] = useState(SPECIAL_CHARS[0]?.category || "");
  const [eqCategory, setEqCategory] = useState(EQUATION_SYMBOLS[0]?.category || "");
  const [recentSymbols, setRecentSymbols] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [fontFilter, setFontFilter] = useState("all");

  const chars = activeTab === "symbols"
    ? (SPECIAL_CHARS.find(c => c.category === category)?.chars || [])
    : (EQUATION_SYMBOLS.find(c => c.category === eqCategory)?.chars || []);

  const categories = activeTab === "symbols" ? SPECIAL_CHARS : EQUATION_SYMBOLS;

  const handleInsert = (ch) => {
    if (!editor || !ch) return;
    editor.chain().focus().insertContent(ch).run();
    setRecentSymbols(prev => [ch, ...prev.filter(x => x !== ch)].slice(0, 20));
    setSelectedChar(ch);
  };

  const handleInsertAndClose = (ch) => {
    handleInsert(ch);
    onClose();
  };

  return (
    <div className="word-dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ minWidth: 520, maxWidth: 640 }}>
        <div className="word-dialog-title">
          <span>기호</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        {/* 탭 */}
        <div className="word-dialog-tabs">
          <button className={`word-dialog-tab${activeTab === "symbols" ? " active" : ""}`}
            onClick={() => setActiveTab("symbols")}>기호</button>
          <button className={`word-dialog-tab${activeTab === "equations" ? " active" : ""}`}
            onClick={() => setActiveTab("equations")}>특수 문자</button>
        </div>

        <div className="word-dialog-body">
          {/* 글꼴 필터 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: "#555" }}>글꼴:</label>
            <select value={fontFilter} onChange={(e) => setFontFilter(e.target.value)}
              style={{ padding: "3px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11 }}>
              <option value="all">(일반 텍스트)</option>
              <option value="symbol">Symbol</option>
              <option value="wingdings">Wingdings</option>
            </select>

            <label style={{ fontSize: 11, color: "#555", marginLeft: 12 }}>하위 집합:</label>
            <select
              value={activeTab === "symbols" ? category : eqCategory}
              onChange={(e) => activeTab === "symbols" ? setCategory(e.target.value) : setEqCategory(e.target.value)}
              style={{ padding: "3px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11, flex: 1 }}>
              {categories.map(c => (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </select>
          </div>

          {/* 문자 그리드 */}
          <div style={{
            border: "1px solid #d5d5d5", borderRadius: 2, padding: 4,
            maxHeight: 240, overflowY: "auto", background: "#fff",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 1 }}>
              {chars.map((ch, i) => (
                <button key={i} type="button"
                  onClick={() => setSelectedChar(ch)}
                  onDoubleClick={() => handleInsertAndClose(ch)}
                  style={{
                    width: 28, height: 28,
                    border: selectedChar === ch ? "2px solid #185ABD" : "1px solid #e0e0e0",
                    borderRadius: 2,
                    background: selectedChar === ch ? "#E5F1FB" : "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.08s",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { if (selectedChar !== ch) { e.currentTarget.style.background = "#f0f0f0"; } }}
                  onMouseLeave={(e) => { if (selectedChar !== ch) { e.currentTarget.style.background = "#fff"; } }}
                  title={`${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* 선택한 문자 정보 */}
          {selectedChar && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 11, color: "#555" }}>
              <span style={{ fontSize: 24, border: "1px solid #ddd", padding: "2px 8px", borderRadius: 3 }}>{selectedChar}</span>
              <div>
                <div>문자: {selectedChar}</div>
                <div>유니코드: U+{selectedChar.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}</div>
              </div>
            </div>
          )}

          {/* 최근 사용한 기호 */}
          {recentSymbols.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>최근 사용한 기호:</div>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {recentSymbols.map((ch, i) => (
                  <button key={i} type="button"
                    onClick={() => handleInsert(ch)}
                    style={{
                      width: 24, height: 24,
                      border: "1px solid #e0e0e0", borderRadius: 2,
                      background: "#fff", cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="word-dialog-footer">
          <button onClick={() => handleInsert(selectedChar)} className="word-dialog-btn primary"
            disabled={!selectedChar}>삽입</button>
          <button onClick={onClose} className="word-dialog-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}
