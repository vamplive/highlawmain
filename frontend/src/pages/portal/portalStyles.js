/** 포털 공통 스타일 -- 색상 토큰, 입력 필드, 라벨 등 재사용 스타일 */

/** 포털 색상 토큰 (CSS 변수 참조) */
export const T = {
  accent: "var(--accent-gold)",
  text: "var(--text-primary)",
  textSec: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  border: "var(--border-color)",
  card: "#fff",
};

/** 입력 필드 기본 스타일 */
export const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 14,
  border: "1px solid var(--border-color)",
  borderRadius: 6,
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

/** 라벨 기본 스타일 */
export const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: 6,
};
