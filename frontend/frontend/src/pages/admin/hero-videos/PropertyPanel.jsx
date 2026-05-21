/**
 * 우측 속성 패널 — 컬러/트랜스폼/트림/정보 탭 전환
 */
import { formatDate } from "../../../utils/formatters";
import { D, CATEGORIES, PRESETS } from "./constants";
import { PanelSection, InfoRow } from "./EditorPrimitives";
import ColorPanel from "./ColorPanel";
import TransformPanel from "./TransformPanel";
import TrimPanel from "./TrimPanel";

const PANELS = [
  { id: "color", label: "컬러 그레이딩" },
  { id: "transform", label: "트랜스폼" },
  { id: "trim", label: "트림 & 컷" },
  { id: "info", label: "정보" },
];

export default function PropertyPanel({
  activePanel, setActivePanel,
  filters, setFilters,
  transform, setTransform,
  trimIn, trimOut, duration, currentTime,
  setTrimIn, setTrimOut, formatTimecode,
  video, videoMeta,
}) {
  return (
    <div
      style={{
        width: 300, background: D.surface, borderLeft: `1px solid ${D.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}
    >
      {/* 패널 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            style={{
              flex: 1, padding: "10px 4px", fontSize: 9, fontWeight: 600,
              background: activePanel === p.id ? D.surfaceLight : "transparent",
              color: activePanel === p.id ? D.accent : D.textDim,
              border: "none",
              borderBottom: activePanel === p.id ? `2px solid ${D.accent}` : "2px solid transparent",
              cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 패널 내용 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {activePanel === "color" && (
          <ColorPanel filters={filters} presets={PRESETS} onFiltersChange={setFilters} />
        )}
        {activePanel === "transform" && (
          <TransformPanel transform={transform} onTransformChange={setTransform} />
        )}
        {activePanel === "trim" && (
          <TrimPanel
            trimIn={trimIn} trimOut={trimOut} duration={duration}
            currentTime={currentTime} onTrimInChange={setTrimIn}
            onTrimOutChange={setTrimOut} formatTimecode={formatTimecode}
          />
        )}
        {activePanel === "info" && (
          <PanelSection title="영상 정보">
            <InfoRow label="제목" value={video.title} />
            <InfoRow label="경로" value={video.url} />
            <InfoRow label="카테고리" value={CATEGORIES[video.category] || video.category} />
            <InfoRow label="해상도" value={`${videoMeta.width} × ${videoMeta.height}`} />
            <InfoRow label="길이" value={formatTimecode(duration)} />
            <InfoRow label="상태" value={video.isActive ? "활성" : "비활성"} />
            <InfoRow label="등록일" value={formatDate(video.createdAt)} />
          </PanelSection>
        )}
      </div>
    </div>
  );
}
