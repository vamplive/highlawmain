/** 방문 분석 — 인기 페이지 수평 바 차트 (Canvas) */
import { useEffect, useRef } from "react";
import { COLORS, EmptyState } from "../../../components/admin";
import {
  BAR_PADDING, BAR_HEIGHT, BAR_GAP, BAR_LABEL_MAX_LEN, BAR_RADIUS,
  FONT_BAR_LABEL, FONT_BAR_VALUE, CHART_COLORS,
  cardWrapper, sectionTitle, formatNumber, roundRect,
} from "./analyticsConstants";

/** 수평 바 차트 — Canvas 렌더링 */
function BarChart({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const pad = BAR_PADDING;
    const width = container.clientWidth;
    const height = pad.top + data.length * (BAR_HEIGHT + BAR_GAP) + pad.bottom;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxCount = Math.max(...data.map((d) => d.views), 1);
    const chartW = width - pad.left - pad.right;

    data.forEach((item, i) => {
      const y = pad.top + i * (BAR_HEIGHT + BAR_GAP);
      const barW = (item.views / maxCount) * chartW;

      /* 페이지명 라벨 */
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = FONT_BAR_LABEL;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label = item.page.length > BAR_LABEL_MAX_LEN
        ? item.page.slice(0, BAR_LABEL_MAX_LEN) + "…"
        : item.page;
      ctx.fillText(label, pad.left - 12, y + BAR_HEIGHT / 2);

      /* 바 배경 */
      ctx.fillStyle = CHART_COLORS.barBgLight;
      roundRect(ctx, pad.left, y, chartW, BAR_HEIGHT, BAR_RADIUS);
      ctx.fill();

      /* 바 (골드 그라데이션) */
      const barGradient = ctx.createLinearGradient(pad.left, 0, pad.left + barW, 0);
      barGradient.addColorStop(0, CHART_COLORS.barGradientStart);
      barGradient.addColorStop(1, CHART_COLORS.barGradientEnd);
      ctx.fillStyle = barGradient;
      roundRect(ctx, pad.left, y, Math.max(barW, 4), BAR_HEIGHT, BAR_RADIUS);
      ctx.fill();

      /* 수치 라벨 */
      ctx.fillStyle = COLORS.text;
      ctx.font = FONT_BAR_VALUE;
      ctx.textAlign = "left";
      ctx.fillText(formatNumber(item.views), pad.left + barW + 8, y + BAR_HEIGHT / 2);
    });
  }, [data]);

  if (!data?.length) {
    return <EmptyState icon="📊" message="페이지 데이터가 없습니다" />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/** 인기 페이지 탭 */
export default function PagesTab({ pages }) {
  return (
    <div style={cardWrapper}>
      <h2 style={sectionTitle}>인기 페이지 (Top 10)</h2>
      <BarChart data={pages} />
    </div>
  );
}
