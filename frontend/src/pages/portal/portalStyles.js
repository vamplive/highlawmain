/** 포털 공통 스타일 — 인디고/퍼플 테마 색상 토큰 및 재사용 컴포넌트 스타일 */

/** 포털 색상 토큰 */
export const T = {
  accent: "#6366f1",                     // indigo-500 (주 액센트)
  accentHover: "#4f46e5",                // indigo-600 (hover)
  accentDim: "rgba(99,102,241,0.09)",    // 연한 액센트 배경
  text: "#0f172a",                       // slate-900
  textSec: "#475569",                    // slate-600
  textMuted: "#94a3b8",                  // slate-400
  border: "#e2e8f0",                     // slate-200
  card: "#ffffff",
};

/** 입력 필드 기본 스타일 */
export const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
  color: "#0f172a",
};

/** 라벨 기본 스타일 */
export const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  display: "block",
  marginBottom: 6,
  letterSpacing: "0.01em",
};

/** 페이지 상단 그라디언트 배너 — 각 포털 페이지 최상단에 사용 */
export const pageHeaderStyle = {
  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
  borderRadius: 16,
  padding: "28px 32px",
  marginBottom: 28,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 18,
  boxShadow: "0 8px 32px rgba(79,70,229,0.22)",
};

/** 페이지 헤더 아이콘 박스 */
export const pageHeaderIconStyle = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

/** 주 액션 버튼 (보라-인디고 그라디언트) */
export const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 20px",
  borderRadius: 10,
  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  transition: "opacity 0.15s, transform 0.1s",
};

/** 카드 스타일 */
export const cardStyle = {
  background: "#ffffff",
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 4px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.03)",
  padding: "20px 24px",
};
