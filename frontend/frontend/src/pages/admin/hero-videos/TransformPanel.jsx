/**
 * 트랜스폼 패널 — 크기, 회전, 위치, 뒤집기 제어
 */
import { D, flipBtn } from "./constants";
import { PanelSection, EditorSlider } from "./EditorPrimitives";

export default function TransformPanel({ transform, onTransformChange }) {
  const setField = (key, value) =>
    onTransformChange((t) => ({ ...t, [key]: value }));

  const resetAll = () =>
    onTransformChange({
      scale: 100, rotate: 0, translateX: 0, translateY: 0,
      flipH: false, flipV: false,
    });

  return (
    <>
      <PanelSection title="크기 & 회전">
        <EditorSlider label="스케일" value={transform.scale} min={50} max={200} suffix="%" onChange={(v) => setField("scale", v)} />
        <EditorSlider label="회전" value={transform.rotate} min={-180} max={180} suffix="°" onChange={(v) => setField("rotate", v)} />
      </PanelSection>

      <PanelSection title="위치">
        <EditorSlider label="X 이동" value={transform.translateX} min={-500} max={500} suffix="px" onChange={(v) => setField("translateX", v)} />
        <EditorSlider label="Y 이동" value={transform.translateY} min={-500} max={500} suffix="px" onChange={(v) => setField("translateY", v)} />
      </PanelSection>

      <PanelSection title="뒤집기">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setField("flipH", !transform.flipH)}
            style={{ ...flipBtn, background: transform.flipH ? D.accent : D.surfaceLight }}
          >
            ↔ 좌우
          </button>
          <button
            onClick={() => setField("flipV", !transform.flipV)}
            style={{ ...flipBtn, background: transform.flipV ? D.accent : D.surfaceLight }}
          >
            ↕ 상하
          </button>
        </div>
      </PanelSection>

      <PanelSection title="초기화">
        <button onClick={resetAll} style={{ ...flipBtn, width: "100%", background: D.surfaceLight }}>
          모든 트랜스폼 초기화
        </button>
      </PanelSection>
    </>
  );
}
