/** 사이트 관리자 탭 간 공유 서브컴포넌트 (SectionCard, ItemCard, FieldRow 등) */
import { COLORS, fieldStyle, labelStyle } from "../../../components/admin/styles";

/** 섹션 카드 래퍼 -- 한 편집 블록을 감싸는 컨테이너 */
export function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10,
      padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 3, height: 18, background: COLORS.accent, borderRadius: 2 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: COLORS.textSecondary,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/** 반복 항목 서브카드 */
export function ItemCard({ children, onRemove }) {
  return (
    <div style={{
      border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16,
      marginBottom: 12, background: COLORS.bgForm, position: "relative",
    }}>
      {onRemove && (
        <button onClick={onRemove} style={{
          position: "absolute", top: 8, right: 8, background: "none",
          border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 16, lineHeight: 1,
        }} title="삭제">x</button>
      )}
      {children}
    </div>
  );
}

/** 항목 추가 버튼 */
export function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", fontSize: 12, fontWeight: 500,
      color: COLORS.accent, background: "rgba(26,58,107,0.08)",
      border: `1px dashed ${COLORS.accent}`, borderRadius: 6, cursor: "pointer",
    }}>
      + {label}
    </button>
  );
}

/** 2~3열 그리드 레이아웃 */
export function FieldRow({ children, cols = 2 }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 12, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

/** 색상 피커 + 텍스트 입력 조합 */
export function ColorPickerField({ label: lbl, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 36, border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: "pointer", padding: 2 }} />
        <input style={{ ...fieldStyle, maxWidth: 140 }} value={value}
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

/** 토글 스위치 */
export function ToggleSwitch({ isOn, onToggle, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onToggle}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: isOn ? COLORS.success : "#ccc",
          position: "relative", transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: isOn ? 22 : 2,
          width: 20, height: 20, borderRadius: 10, background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
      {label && <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</span>}
    </div>
  );
}

/** 다국어 토글 */
export function LangToggle({ editingLang, setEditingLang }) {
  const langs = [{ key: "ko", label: "한국어" }, { key: "en", label: "English" }];
  return (
    <div style={{
      display: "flex", gap: 0, marginBottom: 16,
      border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: "hidden", width: "fit-content",
    }}>
      {langs.map((lang) => (
        <button
          key={lang.key}
          onClick={() => setEditingLang(lang.key)}
          style={{
            padding: "6px 16px", fontSize: 12, fontWeight: editingLang === lang.key ? 600 : 400,
            color: editingLang === lang.key ? "#fff" : COLORS.textSecondary,
            background: editingLang === lang.key ? COLORS.accent : "#fff",
            border: "none", cursor: "pointer",
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
