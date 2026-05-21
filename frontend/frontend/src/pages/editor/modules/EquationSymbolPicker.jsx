/**
 * EquationSymbolPicker — 수식 기호 피커
 * 카테고리별로 분류된 수식 기호를 선택할 수 있는 그리드 UI
 */
import { useState } from "react";
import { EQUATION_SYMBOLS } from "./constants";

/**
 * @param {object} props
 * @param {function} props.onSelect - (char) => void
 */
export default function EquationSymbolPicker({ onSelect }) {
  const [category, setCategory] = useState(EQUATION_SYMBOLS[0].category);
  const chars = EQUATION_SYMBOLS.find(c => c.category === category)?.chars || [];

  return (
    <div style={{ padding: 8, width: 320 }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 500 }}>수식 기호</div>

      {/* 카테고리 탭 */}
      <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
        {EQUATION_SYMBOLS.map(c => (
          <button key={c.category} className="word-dropdown-item"
            onClick={(e) => { e.stopPropagation(); setCategory(c.category); }}
            style={{
              padding: "3px 8px", fontSize: 10,
              background: category === c.category ? "#dbeafe" : "transparent",
              borderRadius: 3, border: "1px solid #ddd",
              fontWeight: category === c.category ? 600 : 400,
            }}>{c.category}</button>
        ))}
      </div>

      {/* 기호 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 2 }}>
        {chars.map((ch, i) => (
          <button key={i} type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(ch); }}
            style={{
              minWidth: 28, height: 28, border: "1px solid #e0e0e0", borderRadius: 2,
              background: "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.08s", padding: "0 2px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
            title={ch}>{ch}</button>
        ))}
      </div>
    </div>
  );
}
