/**
 * 색상 선택 그리드 컴포넌트 (Word 365 스타일)
 * 테마색, 틴트/셰이드, 표준색, 최근 사용색을 포함한 색상 팔레트
 */
import { useState } from "react";
import { THEME_COLORS, THEME_TINTS } from "../colorPalette";
import { showEditorAlert } from "../editorToast";
import { RIBBON_FONT, BTN_COLORS } from "./ribbonConstants";

export function ColorGrid({
  colors,
  value,
  onChange,
  columns = 10,
  recentColors = [],
  showNoColor,
  showMoreColors,
  noColorLabel = "색 없음",
  moreColorsLabel = "다른 색...",
}) {
  const [hoveredColor, setHoveredColor] = useState(null);

  /** 개별 색상 셀 렌더링 */
  const renderCell = (color, key) => {
    const isSelected = value?.toLowerCase() === color.toLowerCase();
    const isHovered = hoveredColor === key;

    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(color)}
        title={color}
        onMouseEnter={() => setHoveredColor(key)}
        onMouseLeave={() => setHoveredColor(null)}
        style={{
          width: 17,
          height: 17,
          background: color,
          border: isSelected
            ? "2px solid #333"
            : isHovered
              ? "2px solid #666"
              : "1px solid #d0d0d0",
          borderRadius: 1,
          cursor: "pointer",
          padding: 0,
          transform: isHovered ? "scale(1.3)" : "scale(1)",
          transition: "transform 0.06s ease, border 0.06s",
          zIndex: isHovered ? 2 : 1,
          position: "relative",
          boxShadow: isSelected ? "0 0 0 1px #fff inset" : "none",
          outline: "none",
        }}
      />
    );
  };

  /* 색 없음 옵션 */
  const renderNoColor = () => {
    if (!showNoColor) return null;
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "5px 8px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: RIBBON_FONT,
          color: "#333",
          borderBottom: "1px solid #e8e8e8",
          marginBottom: 4,
          transition: "background 0.06s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = BTN_COLORS.hover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 14, height: 14, border: "1px solid #ccc",
          background: "#fff", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#cc0000", borderRadius: 1,
        }}>
          ✕
        </span>
        {noColorLabel}
      </button>
    );
  };

  /* 다른 색 옵션 */
  const renderMoreColors = () => {
    if (!showMoreColors) return null;
    return (
      <button
        type="button"
        onClick={() => {
          const result = window.prompt("색상 코드 입력 (예: #FF5500):");
          if (result && /^#[0-9A-Fa-f]{3,8}$/.test(result.trim())) onChange(result.trim());
          else if (result) showEditorAlert("유효하지 않은 색상 코드입니다. (예: #FF5500)");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "5px 8px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: RIBBON_FONT,
          color: "#333",
          borderTop: "1px solid #e8e8e8",
          marginTop: 4,
          transition: "background 0.06s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = BTN_COLORS.hover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 14, height: 14, borderRadius: 7,
          background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
          display: "inline-block",
        }} />
        {moreColorsLabel}
      </button>
    );
  };

  return (
    <div style={{ padding: 4 }}>
      {/* 색 없음 */}
      {renderNoColor()}

      {/* 테마 색상 (상위 10색) */}
      <div style={{ marginBottom: 2 }}>
        <div style={{
          fontSize: 10, color: "#666", marginBottom: 3,
          fontFamily: RIBBON_FONT,
        }}>
          테마 색
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 17px)`, gap: 2 }}>
          {THEME_COLORS.slice(0, columns).map((c, i) => renderCell(c, `theme-${i}`))}
        </div>
      </div>

      {/* 틴트/셰이드 행 */}
      <div style={{ marginBottom: 4 }}>
        {THEME_TINTS.map((row, ri) => (
          <div key={`tint-row-${ri}`} style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 17px)`,
            gap: 2,
            marginTop: ri === 0 ? 2 : 0,
          }}>
            {row.slice(0, columns).map((c, ci) => renderCell(c, `tint-${ri}-${ci}`))}
          </div>
        ))}
      </div>

      {/* 표준 색상 */}
      <div style={{ marginBottom: 2 }}>
        <div style={{
          fontSize: 10, color: "#666", marginBottom: 3, marginTop: 4,
          fontFamily: RIBBON_FONT,
        }}>
          표준 색
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 17px)`,
          gap: 2,
        }}>
          {colors.slice(0, columns).map((c, i) => renderCell(c, `std-${i}`))}
        </div>
      </div>

      {/* 전체 팔레트 (기존 colors 배열에서 나머지) */}
      {colors.length > columns && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 17px)`,
          gap: 2,
          marginTop: 2,
        }}>
          {colors.slice(columns).map((c, i) => renderCell(c, `pal-${i}`))}
        </div>
      )}

      {/* 최근 사용 색상 */}
      {recentColors.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontSize: 10, color: "#666", marginBottom: 3,
            fontFamily: RIBBON_FONT,
          }}>
            최근에 사용한 색
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 17px)`, gap: 2 }}>
            {recentColors.slice(0, columns).map((c, i) => renderCell(c, `recent-${i}`))}
          </div>
        </div>
      )}

      {/* 다른 색 */}
      {renderMoreColors()}
    </div>
  );
}
