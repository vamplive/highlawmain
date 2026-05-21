/**
 * 전송 컨트롤 바 — 재생/정지, 프레임 이동, 속도, 줌
 */
import { D, ctrlBtn } from "./constants";

export default function TransportControls({
  playing, currentTime, duration, speed, zoom,
  trimIn, trimOut, onTogglePlay, onSeek, onStepFrame,
  onSpeedChange, onZoomChange, formatTimecode, speedOptions,
}) {
  return (
    <div
      style={{
        height: 48,
        background: D.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderTop: `1px solid ${D.border}`,
        flexShrink: 0,
      }}
    >
      <button onClick={() => onSeek(trimIn)} style={ctrlBtn} title="구간 시작">⏮</button>
      <button onClick={() => onStepFrame(-1)} style={ctrlBtn} title="이전 프레임">◀◀</button>
      <button
        onClick={onTogglePlay}
        style={{
          ...ctrlBtn,
          width: 40,
          height: 40,
          fontSize: 18,
          background: D.accent,
          borderRadius: "50%",
          color: "#fff",
        }}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button onClick={() => onStepFrame(1)} style={ctrlBtn} title="다음 프레임">▶▶</button>
      <button onClick={() => onSeek(trimOut)} style={ctrlBtn} title="구간 끝">⏭</button>

      <div style={{ width: 1, height: 24, background: D.border, margin: "0 12px" }} />

      {/* 타임코드 */}
      <span style={{ fontSize: 13, fontFamily: "'Courier New', monospace", color: D.accent, fontWeight: 600, letterSpacing: "0.05em", minWidth: 90 }}>
        {formatTimecode(currentTime)}
      </span>
      <span style={{ fontSize: 11, color: D.textDim }}>/</span>
      <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: D.textDim, minWidth: 80 }}>
        {formatTimecode(duration)}
      </span>

      <div style={{ width: 1, height: 24, background: D.border, margin: "0 12px" }} />

      {/* 속도 */}
      <select
        value={speed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        style={{
          background: D.surfaceLight,
          color: D.text,
          border: `1px solid ${D.border}`,
          padding: "4px 8px",
          fontSize: 11,
          outline: "none",
        }}
      >
        {speedOptions.map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>

      {/* 줌 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
        <span style={{ fontSize: 10, color: D.textDim }}>줌</span>
        <input
          type="range"
          min={50}
          max={200}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          style={{ width: 60, accentColor: D.accent }}
        />
        <span style={{ fontSize: 10, color: D.textDim, minWidth: 30 }}>{zoom}%</span>
      </div>
    </div>
  );
}
