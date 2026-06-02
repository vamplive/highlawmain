/**
 * 트림 패널 — 시작/끝 지점 설정 + 구간 초기화
 */
import { D, flipBtn } from "./constants";
import { PanelSection, EditorSlider } from "./EditorPrimitives";

export default function TrimPanel({
  trimIn, trimOut, duration, currentTime,
  onTrimInChange, onTrimOutChange, formatTimecode,
}) {
  return (
    <>
      <PanelSection title="구간 설정">
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: D.textDim }}>IN: {formatTimecode(trimIn)}</span>
            <span style={{ fontSize: 10, color: D.textDim }}>OUT: {formatTimecode(trimOut)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onTrimInChange(currentTime)} style={{ ...flipBtn, flex: 1, background: D.blue }}>
              [ 시작점 설정
            </button>
            <button onClick={() => onTrimOutChange(currentTime)} style={{ ...flipBtn, flex: 1, background: D.red }}>
              ] 끝점 설정
            </button>
          </div>
        </div>
        <EditorSlider label="시작" value={trimIn} min={0} max={duration} step={0.1} suffix="s" onChange={onTrimInChange} />
        <EditorSlider label="끝" value={trimOut} min={0} max={duration} step={0.1} suffix="s" onChange={onTrimOutChange} />
        <div style={{ fontSize: 11, color: D.accent, marginTop: 8, fontFamily: "'Courier New', monospace" }}>
          구간 길이: {formatTimecode(Math.max(0, trimOut - trimIn))}
        </div>
      </PanelSection>

      <PanelSection title="재생 범위">
        <button
          onClick={() => { onTrimInChange(0); onTrimOutChange(duration); }}
          style={{ ...flipBtn, width: "100%", background: D.surfaceLight }}
        >
          전체 범위로 초기화
        </button>
      </PanelSection>
    </>
  );
}
