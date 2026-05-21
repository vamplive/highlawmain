/**
 * 컬러 그레이딩 패널 — 프리셋 + 기본 보정 + 크리에이티브 슬라이더
 */
import { D } from "./constants";
import { PanelSection, EditorSlider } from "./EditorPrimitives";

export default function ColorPanel({ filters, presets, onFiltersChange }) {
  const setFilter = (key, value) =>
    onFiltersChange((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PanelSection title="프리셋">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => onFiltersChange(p.filters)}
              style={{
                padding: "6px 8px",
                fontSize: 10,
                fontWeight: 500,
                background: D.surfaceLight,
                color: D.text,
                border: `1px solid ${D.border}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="기본 보정">
        <EditorSlider label="밝기" value={filters.brightness} min={0} max={200} onChange={(v) => setFilter("brightness", v)} />
        <EditorSlider label="대비" value={filters.contrast} min={0} max={200} onChange={(v) => setFilter("contrast", v)} />
        <EditorSlider label="채도" value={filters.saturate} min={0} max={200} onChange={(v) => setFilter("saturate", v)} />
        <EditorSlider label="색조" value={filters.hueRotate} min={-180} max={180} onChange={(v) => setFilter("hueRotate", v)} />
      </PanelSection>

      <PanelSection title="크리에이티브">
        <EditorSlider label="색온도" value={filters.temperature} min={-50} max={50} onChange={(v) => setFilter("temperature", v)} />
        <EditorSlider label="세피아" value={filters.sepia} min={0} max={100} onChange={(v) => setFilter("sepia", v)} />
        <EditorSlider label="블러" value={filters.blur} min={0} max={20} step={0.5} onChange={(v) => setFilter("blur", v)} />
        <EditorSlider label="비네팅" value={filters.vignette} min={0} max={80} onChange={(v) => setFilter("vignette", v)} />
        <EditorSlider label="투명도" value={filters.opacity} min={0} max={100} onChange={(v) => setFilter("opacity", v)} />
      </PanelSection>
    </>
  );
}
