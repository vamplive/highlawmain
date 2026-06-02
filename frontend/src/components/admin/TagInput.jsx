/**
 * TagInput — 칩(chip) 형태의 태그 입력 컴포넌트
 * - Enter/쉼표/탭으로 추가, Backspace(빈 상태)로 마지막 태그 삭제
 * - 중복 및 빈 문자열은 자동 제거
 */
import { useState } from "react";
import { COLORS, fieldStyle } from "./styles";

/**
 * @param {string[]} value - 현재 태그 배열
 * @param {(next: string[]) => void} onChange
 * @param {string} [placeholder]
 * @param {number} [maxTags=20]
 * @param {string[]} [suggestions] - 자주 쓰는 태그 후보 (클릭 시 추가)
 */
export default function TagInput({ value = [], onChange, placeholder = "태그 입력 후 Enter", maxTags = 20, suggestions = [] }) {
  const [input, setInput] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = (raw) => {
    const t = String(raw || "").trim();
    if (!t) return;
    if (tags.includes(t)) return;
    if (tags.length >= maxTags) return;
    onChange([...tags, t]);
    setInput("");
  };

  const removeTag = (idx) => {
    const next = tags.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (input.trim()) {
        e.preventDefault();
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const unusedSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div>
      <div style={{ ...fieldStyle, display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 8px", minHeight: 40, alignItems: "center" }}>
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} style={chipStyle}>
            #{t}
            <button type="button" onClick={() => removeTag(i)} style={chipRemoveStyle} aria-label={`${t} 삭제`}>×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input.trim() && addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{ flex: 1, minWidth: 120, border: "none", outline: "none", fontSize: 13, padding: "4px 2px", fontFamily: "inherit", background: "transparent" }}
        />
      </div>
      {unusedSuggestions.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
          <span style={{ fontSize: 11, color: COLORS.muted, alignSelf: "center" }}>추천:</span>
          {unusedSuggestions.slice(0, 12).map((s) => (
            <button key={s} type="button" onClick={() => addTag(s)} style={suggestionStyle}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 4px 2px 8px",
  fontSize: 12,
  fontWeight: 500,
  color: "#fff",
  background: COLORS.accent,
  borderRadius: 12,
};

const chipRemoveStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  padding: 0,
  background: "rgba(0,0,0,0.15)",
  border: "none",
  borderRadius: "50%",
  color: "#fff",
  fontSize: 14,
  lineHeight: 1,
  cursor: "pointer",
};

const suggestionStyle = {
  padding: "2px 8px",
  fontSize: 11,
  color: COLORS.textSecondary,
  background: "#fff",
  border: `1px dashed ${COLORS.border}`,
  borderRadius: 10,
  cursor: "pointer",
};
