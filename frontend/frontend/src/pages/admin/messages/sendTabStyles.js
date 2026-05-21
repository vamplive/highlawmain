import { COLORS } from "../../../components/admin";

/** datetime-local input의 최소값(현재 시각 + 1분) 생성 */
export function toDatetimeLocalMin() {
  const d = new Date(Date.now() + 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: 13,
  border: "1px solid #cbd5e1", borderRadius: 6,
  background: "#fff", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

export const searchInputStyle = {
  ...inputStyle, padding: "8px 12px",
};

export const selectStyle = { ...inputStyle, cursor: "pointer" };

export const linkBtnStyle = {
  padding: "8px 12px", fontSize: 12, fontWeight: 500,
  color: COLORS.textSecondary, background: "none",
  border: "none", cursor: "pointer", whiteSpace: "nowrap",
};

export const listContainerStyle = {
  marginTop: 10, border: "1px solid #dbe3ef", borderRadius: 8,
  maxHeight: 420, overflowY: "auto", background: "#fff",
};

export const countBarStyle = {
  marginTop: 8, fontSize: 12, color: COLORS.text,
  fontWeight: 500, display: "flex", gap: 6,
};

export const primaryBtnStyle = (disabled) => ({
  marginTop: 16, width: "100%", padding: "14px 0",
  fontSize: 14, fontWeight: 600, color: "#fff",
  background: disabled ? "#94a3b8" : COLORS.accent,
  border: "none", borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.15s",
  letterSpacing: 0.2,
});
