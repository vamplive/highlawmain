/**
 * HorizontalRuler — MS Word 365 스타일 수평 눈금자 (cm 단위)
 * 여백 영역 표시, cm/0.5cm 눈금, 여백 조절 핸들
 */
import { memo, useMemo } from "react";
import { PIXELS_PER_CM } from "./editorConstants";

/**
 * @param {object} props
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {number} props.zoom - 줌 비율 (%)
 * @param {number} props.pageW - 페이지 폭 (px)
 * @param {number} props.marginLeft - 왼쪽 여백 (px)
 * @param {number} props.marginRight - 오른쪽 여백 (px)
 * @param {boolean} props.showNavPane - 탐색 창 표시 여부
 * @param {boolean} props.showRuler - 눈금자 표시 여부
 */
export const HorizontalRuler = memo(function HorizontalRuler({ darkMode, zoom, pageW, marginLeft, marginRight, showNavPane, showRuler }) {
  const zoomRatio = zoom / 100;

  /* 눈금 마크를 메모이제이션 — zoom/margin/pageW가 바뀔 때만 재계산 */
  const marks = useMemo(() => {
    const contentWidthPx = pageW - marginLeft - marginRight;
    const contentWidthCm = contentWidthPx / PIXELS_PER_CM;
    const totalCm = Math.ceil(contentWidthCm);
    const zr = zoom / 100;
    const result = [];

    for (let cm = -Math.floor(marginLeft / PIXELS_PER_CM); cm <= totalCm + Math.floor(marginRight / PIXELS_PER_CM); cm++) {
      const xPx = (marginLeft + cm * PIXELS_PER_CM) * zr;
      if (xPx < -5 || xPx > pageW * zr + 5) continue;

      /* 1cm 눈금 */
      result.push(
        <div key={`cm-${cm}`} style={{
          position: "absolute", left: `${xPx}px`, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{ width: 1, height: 10, background: darkMode ? "#888" : "#666" }} />
          {cm > 0 && cm <= totalCm && (
            <span style={{
              fontSize: 7, color: darkMode ? "#888" : "#777",
              position: "absolute", top: 2, left: 3, fontFamily: "'Segoe UI', sans-serif",
            }}>{cm}</span>
          )}
        </div>
      );

      /* 0.5cm 하위 눈금 */
      const halfX = (marginLeft + (cm + 0.5) * PIXELS_PER_CM) * zr;
      if (halfX > 0 && halfX < pageW * zr) {
        result.push(
          <div key={`half-${cm}`} style={{
            position: "absolute", left: `${halfX}px`, bottom: 0,
          }}>
            <div style={{ width: 1, height: 5, background: darkMode ? "#666" : "#aaa" }} />
          </div>
        );
      }
    }
    return result;
  }, [zoom, pageW, marginLeft, marginRight, darkMode]);

  const handleColor = darkMode ? "#999" : "#666";

  return (
    <div style={{
      height: 24, background: darkMode ? "#2d2d2d" : "#f5f5f5",
      borderBottom: `1px solid ${darkMode ? "#444" : "#ddd"}`,
      display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
      position: "relative",
    }}>
      <div style={{ width: showNavPane ? 220 : 0, flexShrink: 0 }} />
      <div style={{ width: showRuler ? 20 : 0, flexShrink: 0 }} />

      <div style={{
        width: `${pageW * zoomRatio}px`, maxWidth: "calc(100% - 56px)",
        position: "relative", height: "100%",
      }}>
        {/* 왼쪽 여백 영역 */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${marginLeft * zoomRatio}px`,
          background: darkMode ? "#3a3a3a" : "#c4c4c4",
        }} />
        {/* 오른쪽 여백 영역 */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: `${marginRight * zoomRatio}px`,
          background: darkMode ? "#3a3a3a" : "#c4c4c4",
        }} />
        {/* 본문 영역 */}
        <div style={{
          position: "absolute", left: `${marginLeft * zoomRatio}px`, right: `${marginRight * zoomRatio}px`,
          top: 0, bottom: 0,
          background: darkMode ? "#2d2d2d" : "#fff",
        }} />

        {marks}

        {/* 왼쪽 여백 조절 핸들 */}
        <div style={{
          position: "absolute", left: `${marginLeft * zoomRatio - 4}px`, bottom: 0,
          width: 8, height: 8, cursor: "ew-resize",
          borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
          borderBottom: `8px solid ${handleColor}`,
        }} />
        {/* 오른쪽 여백 조절 핸들 */}
        <div style={{
          position: "absolute", right: `${marginRight * zoomRatio - 4}px`, bottom: 0,
          width: 8, height: 8, cursor: "ew-resize",
          borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
          borderBottom: `8px solid ${handleColor}`,
        }} />
      </div>
      <div style={{ width: 28, flexShrink: 0 }} />
    </div>
  );
});
