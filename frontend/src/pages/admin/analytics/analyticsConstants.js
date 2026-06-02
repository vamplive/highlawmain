/** 방문 분석 차트 렌더링 상수 및 헬퍼 함수 */
import { COLORS } from "../../../components/admin";

/* ── 차트 레이아웃 상수 ── */
export const CHART_PADDING = { top: 20, right: 24, bottom: 48, left: 56 };
export const Y_TICKS = 5;
export const LINE_CHART_HEIGHT = 320;
export const POINT_RADIUS = 3.5;
export const LINE_WIDTH = 2.5;
export const FONT_AXIS = "11px sans-serif";
export const FONT_BAR_LABEL = "12px sans-serif";
export const FONT_BAR_VALUE = "bold 12px sans-serif";
export const BAR_HEIGHT = 28;
export const BAR_GAP = 10;
export const BAR_PADDING = { top: 8, right: 60, bottom: 8, left: 160 };
export const BAR_LABEL_MAX_LEN = 22;
export const BAR_RADIUS = 4;
export const MAX_X_LABEL_WIDTH = 52;
export const PROGRESS_BAR_HEIGHT = 8;
export const PROGRESS_BAR_RADIUS = 4;

/* ── 기간 옵션 ── */
export const PERIODS = [
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "90일", value: "90d" },
];

/* ── 차트 색상 ── */
export const CHART_COLORS = {
  line: COLORS.accent,
  areaStart: "rgba(59,110,165,0.25)",
  areaEnd: "rgba(59,110,165,0.02)",
  gridLine: "#f0f0f0",
  pointFill: "#ffffff",
  barBgLight: "#eef3fa",
  barGradientStart: COLORS.accent,
  barGradientEnd: "#7aa6d4",
};

/* ── 공통 스타일 ── */
export const cardWrapper = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${COLORS.border}`,
};

export const sectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: COLORS.text,
  marginTop: 0,
  marginBottom: 16,
};

/* ── 숫자 포맷 헬퍼 ── */
export const formatNumber = (n) => {
  if (n == null) return "–";
  return n.toLocaleString("ko-KR");
};

export const formatPercent = (n) => {
  if (n == null) return "–";
  return `${n.toFixed(1)}%`;
};

/** 차트 X축용 날짜 포맷 (MM/DD) */
export const formatChartDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
};

/** Canvas 둥근 사각형 헬퍼 */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
