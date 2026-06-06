/** 포털 공통 스타일 -- 색상 토큰, 입력 필드, 라벨 등 재사용 스타일 */

/** 포털 색상 토큰 (CSS 변수 참조) */
export const T = {
  accent: "var(--accent-gold)",
  text: "var(--text-primary)",
  textSec: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  border: "var(--border-color)",
  card: "#fff",
  cardShadow: "0 4px 20px -2px rgba(11, 31, 58, 0.05)",
  cardShadowHover: "0 10px 25px -3px rgba(11, 31, 58, 0.08)",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
};

/** 입력 필드 기본 스타일 */
export const fieldStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 14,
  border: "1px solid rgba(11, 31, 58, 0.16)",
  borderRadius: 6,
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

/** 라벨 기본 스타일 */
export const labelStyle = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: 6,
  letterSpacing: "0.02em",
};

