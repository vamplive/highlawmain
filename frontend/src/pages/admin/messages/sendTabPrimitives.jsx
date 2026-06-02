/**
 * 발송 탭 공용 UI 프리미티브 + 입력 스타일.
 * SectionLabel · Label · SegmentedControl · EmptyBlock 등
 * 발송 탭 내 여러 패널이 공통 사용.
 */
import { COLORS } from "../../../components/admin";

export function SectionLabel({ step, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: "#fff",
        background: COLORS.accent, borderRadius: "50%",
        width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{step}</span>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: 0 }}>{title}</h3>
    </div>
  );
}

export function Label({ children, hint }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 6 }}>
      {children}
      {hint && <span style={{ fontWeight: 400, color: COLORS.textLight, marginLeft: 8 }}>{hint}</span>}
    </label>
  );
}

export function SegmentedControl({ value, onChange, options, size = "md" }) {
  const h = size === "sm" ? 32 : 38;
  return (
    <div style={{
      display: "inline-flex", background: "#eef2f7", borderRadius: 7, padding: 3, gap: 2,
      border: "1px solid #dbe3ef",
    }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              height: h, padding: "0 16px",
              border: "none", borderRadius: 5,
              background: active ? "#fff" : "transparent",
              boxShadow: active ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
              color: active ? COLORS.text : COLORS.textSecondary,
              fontSize: size === "sm" ? 12 : 13,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}

export function EmptyBlock({ text }) {
  return <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: COLORS.muted }}>{text}</div>;
}
