/**
 * SpecialCharPicker — 특수 문자 피커
 * 카테고리별로 분류된 특수 문자를 선택할 수 있는 그리드 UI
 */
import { useState } from "react";
import { SPECIAL_CHARS } from "./constants";

/**
 * @param {object} props
 * @param {function} props.onSelect - (char) => void
 */
export default function SpecialCharPicker({ onSelect }) {
  const [category, setCategory] = useState(SPECIAL_CHARS[0].category);
  const chars = SPECIAL_CHARS.find(c => c.category === category)?.chars || [];

  return (
    <div style={{ padding: 8, width: 320 }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 500 }}>특수 문자</div>

      {/* 카테고리 탭 */}
      <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
        {SPECIAL_CHARS.map(c => (
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

      {/* 문자 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
        {chars.map((ch, i) => (
          <button key={i} type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(ch); }}
            style={{
              width: 24, height: 24, border: "1px solid #e0e0e0", borderRadius: 2,
              background: "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.08s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
            title={ch}>{ch}</button>
        ))}
      </div>
    </div>
  );
}
