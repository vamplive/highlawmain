/**
 * 하단 타임라인 — 눈금 + 웨이브폼 + 트림 영역 + 플레이헤드
 */
import { useRef, useMemo } from "react";
import { D } from "./constants";

export default function Timeline({
  duration, currentTime, trimIn, trimOut,
  onSeek, formatTimecode, barCount,
}) {
  const timelineRef = useRef(null);
  const tickCount = Math.min(20, Math.ceil(duration));
  // 웨이브폼 막대 높이 — barCount 변경 시에만 새 랜덤 시드 생성 (렌더마다 깜빡임 방지)
  const waveJitter = useMemo(
    // eslint-disable-next-line react-hooks/purity -- 시각적 웨이브폼 시뮬레이션 용도이므로 결정론적일 필요 없음
    () => Array.from({ length: barCount }, () => Math.random() * 30),
    [barCount],
  );

  return (
    <div
      style={{
        height: 80,
        background: D.timeline,
        borderTop: `1px solid ${D.border}`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 타임라인 눈금 */}
      <div
        style={{
          height: 18,
          background: D.surface,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        {duration > 0 &&
          Array.from({ length: tickCount + 1 }, (_, i) => {
            const tickTime = (i / tickCount) * duration;
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: `${(i / tickCount) * 100}%`,
                  fontSize: 8,
                  color: D.textDim,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {formatTimecode(tickTime)}
              </span>
            );
          })}
      </div>

      {/* 타임라인 트랙 */}
      <div
        ref={timelineRef}
        style={{ flex: 1, position: "relative", margin: "0 16px", cursor: "pointer" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          onSeek(pct * duration);
        }}
      >
        {/* 배경 웨이브폼 시뮬레이션 */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 1, padding: "8px 0" }}>
          {Array.from({ length: barCount }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${20 + Math.sin(i * 0.3) * 40 + waveJitter[i]}%`,
                background: D.waveform,
                borderRadius: 1,
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {/* 트림 영역 */}
        {duration > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(trimIn / duration) * 100}%`,
              width: `${((trimOut - trimIn) / duration) * 100}%`,
              background: `${D.accent}20`,
              borderLeft: `2px solid ${D.blue}`,
              borderRight: `2px solid ${D.red}`,
            }}
          />
        )}

        {/* 플레이헤드 */}
        {duration > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(currentTime / duration) * 100}%`,
              width: 2,
              background: D.accent,
              boxShadow: `0 0 6px ${D.accent}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -4,
                left: -5,
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `8px solid ${D.accent}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
