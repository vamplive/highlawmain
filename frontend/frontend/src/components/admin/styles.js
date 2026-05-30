/**
 * 관리자 페이지 공통 스타일 상수
 * — 홈페이지 디자인 토큰(navy #0b1f3a + gold #c9a84c) 기반
 */

/* ── 색상 토큰 ── */
export const COLORS = {
  primary: "#0b1f3a",
  danger: "#c0392b",
  warning: "#d97706",
  success: "#166534",
  muted: "#8a97a8",
  text: "#0b1f3a",
  textSecondary: "#4a5568",
  textMuted: "#8a97a8",
  textLight: "#b0bbc9",
  border: "rgba(11,31,58,0.12)",
  borderLight: "rgba(11,31,58,0.07)",
  borderField: "rgba(11,31,58,0.20)",
  bgPage: "#ffffff",
  bgForm: "#f8f9fb",
  bgInactive: "#f5f3ef",
  accent: "#c9a84c",
  gold: "#c9a84c",
  goldLight: "rgba(201,168,76,0.10)",
  navy: "#0b1f3a",
  navyLight: "rgba(11,31,58,0.06)",
};

/* ── 폼 필드 ── */
export const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 13.5,
  border: `1px solid ${COLORS.borderField}`,
  borderRadius: 6,
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  color: COLORS.text,
  transition: "border-color 0.15s",
};

/* ── 라벨 ── */
export const labelStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: COLORS.textSecondary,
  marginBottom: 5,
  display: "block",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

/* ── 솔리드 버튼 ── */
export const btnStyle = (bg = COLORS.primary) => ({
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  background: bg,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  letterSpacing: "0.02em",
  transition: "opacity 0.15s",
});

/* ── 작은 액션 버튼 (테이블 행 내부) ── */
export const smallBtnStyle = (bg = COLORS.textSecondary) => ({
  padding: "4px 12px",
  fontSize: 12,
  fontWeight: 500,
  color: "#fff",
  background: bg,
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
});

/* ── 아웃라인 액션 버튼 ── */
export const outlineBtnStyle = (color = COLORS.textSecondary) => ({
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 500,
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  borderRadius: 6,
  cursor: "pointer",
  color,
  transition: "background 0.15s, border-color 0.15s",
});

/* ── 배지 ── */
export const badgeStyle = (bg, color = "#fff") => ({
  display: "inline-block",
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 20,
  color,
  background: bg,
  whiteSpace: "nowrap",
  lineHeight: 1.5,
  letterSpacing: "0.03em",
});

/* ── 편집 폼 컨테이너 ── */
export const formContainerStyle = {
  marginBottom: 28,
  padding: 24,
  background: COLORS.bgForm,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
};

/* ── 페이지 헤더 ── */
export const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 28,
};

/* ── 테이블 헤더 셀 ── */
export const thStyle = {
  padding: "11px 10px",
  fontWeight: 700,
  fontSize: 11,
  color: COLORS.textMuted,
  textAlign: "left",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/* ── 테이블 바디 셀 ── */
export const tdStyle = {
  padding: "11px 10px",
  fontSize: 13,
};
