/**
 * 관리자 페이지 공통 스타일 상수
 * — 14개 Admin 페이지에서 반복되던 스타일을 단일 소스로 통합
 */

/* ── 색상 토큰 ── */
export const COLORS = {
  primary: "#1a1a2e",
  danger: "#c0392b",
  warning: "#f39c12",
  success: "#27ae60",
  muted: "#999",
  text: "#1a1a1a",
  textSecondary: "#555",
  textMuted: "#888",
  textLight: "#bbb",
  border: "#e0e0e0",
  borderLight: "#e8e8e8",
  borderField: "#d0d0d0",
  bgPage: "#fff",
  bgForm: "#f9f9f8",
  bgInactive: "#f5f5f3",
  accent: "#3b6ea5",
};

/* ── 폼 필드 ── */
export const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: `1px solid ${COLORS.borderField}`,
  borderRadius: 4,
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

/* ── 라벨 ── */
export const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#444",
  marginBottom: 4,
  display: "block",
};

/* ── 버튼 (색상만 다르게 재사용) ── */
export const btnStyle = (bg = COLORS.primary) => ({
  padding: "8px 20px",
  fontSize: 13,
  fontWeight: 500,
  color: "#fff",
  background: bg,
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
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

/* ── 아웃라인 액션 버튼 (목록 아이템) ── */
export const outlineBtnStyle = (color = "inherit") => ({
  padding: "5px 12px",
  fontSize: 12,
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 4,
  cursor: "pointer",
  color,
});

/* ── 배지 ──
 *  whiteSpace: nowrap 으로 좁은 셀에서 한글이 한 글자씩 세로로 깨지는 현상 방지. */
export const badgeStyle = (bg, color = "#fff") => ({
  display: "inline-block",
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 12,
  color,
  background: bg,
  whiteSpace: "nowrap",
  lineHeight: 1.5,
});

/* ── 편집 폼 컨테이너 ── */
export const formContainerStyle = {
  marginBottom: 28,
  padding: 24,
  background: COLORS.bgForm,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
};

/* ── 페이지 헤더 ── */
export const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

/* ── 테이블 헤더 셀 ── */
export const thStyle = {
  padding: "10px 8px",
  fontWeight: 600,
  color: COLORS.textSecondary,
  textAlign: "left",
};

/* ── 테이블 바디 셀 ── */
export const tdStyle = {
  padding: "10px 8px",
};
