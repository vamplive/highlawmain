/** 방문 분석 — 요약 카드 그리드 + 일별 조회수 라인 차트 */
import { useEffect, useRef } from "react";
import { COLORS } from "../../../components/admin";
import { EmptyState } from "../../../components/admin";
import {
  CHART_PADDING, Y_TICKS, LINE_CHART_HEIGHT, POINT_RADIUS, LINE_WIDTH,
  FONT_AXIS, MAX_X_LABEL_WIDTH, CHART_COLORS,
  cardWrapper, sectionTitle, formatNumber, formatPercent, formatChartDate,
} from "./analyticsConstants";

/* ── 요약 카드 그리드 ── */
export function SummaryCardGrid({ cards }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
      {cards.map((c) => (
        <SummaryCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "24px 20px",
      border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.02em" }}>
        {value}
      </span>
    </div>
  );
}

/* ── 라인 차트 그리기 헬퍼 함수들 ── */

/** Y축 격자선과 라벨 그리기 */
function drawYAxis(ctx, pad, chartW, chartH, yStep, yMax) {
  ctx.strokeStyle = CHART_COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.font = FONT_AXIS;
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= Y_TICKS; i++) {
    const val = yStep * i;
    const y = pad.top + chartH - (val / yMax) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(formatNumber(val), pad.left - 8, y);
  }
}

/** 면적 그라데이션 채우기 */
function drawAreaFill(ctx, points, pad, chartH) {
  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  gradient.addColorStop(0, CHART_COLORS.areaStart);
  gradient.addColorStop(1, CHART_COLORS.areaEnd);
  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + chartH);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

/** 선 그리기 */
function drawLine(ctx, points) {
  ctx.beginPath();
  ctx.strokeStyle = CHART_COLORS.line;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
}

/** 데이터 포인트(원) 그리기 */
function drawDataPoints(ctx, points) {
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = CHART_COLORS.pointFill;
    ctx.fill();
    ctx.strokeStyle = CHART_COLORS.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/** X축 라벨 그리기 — 라벨이 겹치지 않도록 간격 조절 */
function drawXLabels(ctx, data, pad, chartW, chartH) {
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = FONT_AXIS;

  const maxLabels = Math.floor(chartW / MAX_X_LABEL_WIDTH);
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));
  data.forEach((d, i) => {
    if (i % labelStep !== 0 && i !== data.length - 1) return;
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
    ctx.fillText(formatChartDate(d.date), x, pad.top + chartH + 10);
  });
}

/* ── 일별 조회수 Canvas 라인 차트 ── */
export function LineChart({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = LINE_CHART_HEIGHT;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = CHART_PADDING;
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const counts = data.map((d) => d.count);
    const maxVal = Math.max(...counts, 1);
    const yStep = Math.ceil(maxVal / Y_TICKS);
    const yMax = yStep * Y_TICKS;

    drawYAxis(ctx, pad, chartW, chartH, yStep, yMax);

    const points = data.map((d, i) => ({
      x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
      y: pad.top + chartH - (d.count / yMax) * chartH,
    }));

    drawAreaFill(ctx, points, pad, chartH);
    drawLine(ctx, points);
    drawDataPoints(ctx, points);
    drawXLabels(ctx, data, pad, chartW, chartH);
  }, [data]);

  if (!data?.length) {
    return <EmptyState icon="📉" message="조회수 데이터가 없습니다" />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/** 개요 탭: 요약 카드 + 라인 차트 */
export default function OverviewTab({ overview, conversion }) {
  const avgPerDay = overview?.viewsPerDay?.length
    ? Math.round(overview.totalViews / overview.viewsPerDay.length)
    : 0;

  const summaryCards = [
    { label: "전체 조회수", value: formatNumber(overview?.totalViews), icon: "👁" },
    { label: "순방문자", value: formatNumber(overview?.uniqueVisitors), icon: "👤" },
    { label: "일 평균 조회수", value: formatNumber(avgPerDay), icon: "📊" },
    { label: "상담 전환율", value: formatPercent(conversion?.rate), icon: "📈" },
  ];

  return (
    <>
      <SummaryCardGrid cards={summaryCards} />
      <div style={cardWrapper}>
        <h2 style={sectionTitle}>일별 조회수</h2>
        <LineChart data={overview?.viewsPerDay ?? []} />
      </div>
    </>
  );
}
