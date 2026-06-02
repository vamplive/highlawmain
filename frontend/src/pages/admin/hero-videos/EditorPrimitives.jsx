/**
 * 비디오 에디터 공용 프리미티브 컴포넌트
 * — PanelSection, EditorSlider, InfoRow
 */
import { D } from "./constants";

/** 다크 테마 섹션 제목 */
export function PanelSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: D.textDim,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** 다크 테마 슬라이더 (에디터 전용) */
export function EditorSlider({ label, value, min, max, step = 1, suffix = "", onChange }) {
  const displayValue =
    typeof value === "number"
      ? Number.isInteger(step) ? value : value.toFixed(1)
      : value;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: D.textDim }}>{label}</span>
        <span style={{ fontSize: 10, color: D.accent, fontFamily: "'Courier New', monospace" }}>
          {displayValue}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: D.accent, height: 4 }}
      />
    </div>
  );
}

/** 다크 테마 정보 행 */
export function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: `1px solid ${D.border}`,
      }}
    >
      <span style={{ fontSize: 10, color: D.textDim }}>{label}</span>
      <span
        style={{
          fontSize: 10,
          color: D.text,
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}
