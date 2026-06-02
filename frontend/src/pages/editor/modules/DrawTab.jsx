/**
 * 그리기 탭 - MS Word 365 스타일 드로잉 도구 모음
 * 펜, 형광펜, 지우개, 올가미 선택 등 잉크 입력 도구와
 * 잉크→텍스트/도형/수식 변환, 그리기 캔버스 삽입 기능 제공
 */
import { memo, useState, useCallback } from "react";
import {
  Highlighter, Eraser, Lasso,
  Type, Shapes, Sigma, Frame,
  Undo2, Redo2, ChevronDown, Trash2,
} from "lucide-react";
import {
  RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton, ColorGrid,
} from "./RibbonParts";
import {
  ICON_SIZE, ICON_SIZE_LARGE,
  PEN_TOOLS, HIGHLIGHTER_TOOLS,
  PEN_COLORS, HIGHLIGHTER_COLORS,
  MAX_RECENT_COLORS,
} from "./drawConstants";
import { showEditorAlert } from "./editorToast";

/* ================================================================
 *  서브 컴포넌트
 * ================================================================ */

/** 도구 선택 버튼 - 현재 색상을 하단에 표시 */
function ToolButton({ icon: Icon, label, active, color, onClick, title }) {
  return (
    <RibbonBtn active={active} onClick={onClick} title={title || label} small>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <Icon size={ICON_SIZE} />
        {/* 도구의 현재 색상 표시 바 */}
        {color && (
          <span style={{
            position: "absolute",
            bottom: -3,
            left: 0,
            right: 0,
            height: 2,
            background: color,
            borderRadius: 1,
          }} />
        )}
      </span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </RibbonBtn>
  );
}

/** 두께 슬라이더 - 1~10px 범위 */
function ThicknessSlider({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 9, color: "#888", minWidth: 28 }}>{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 60, height: 14, accentColor: "#0078D4" }}
        title={`${value}px`}
      />
      <span style={{ fontSize: 9, color: "#666", minWidth: 20 }}>{value}px</span>
    </div>
  );
}

/** 불투명도 슬라이더 - 형광펜용 (10~100%) */
function OpacitySlider({ value, onChange }) {
  const percent = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 9, color: "#888", minWidth: 28 }}>투명도</span>
      <input
        type="range"
        min={10}
        max={100}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: 60, height: 14, accentColor: "#0078D4" }}
        title={`${percent}%`}
      />
      <span style={{ fontSize: 9, color: "#666", minWidth: 24 }}>{percent}%</span>
    </div>
  );
}

/* ================================================================
 *  메인 그리기 탭 컴포넌트
 * ================================================================ */

/**
 * 그리기 탭 - 에디터 리본 메뉴의 드로잉 도구 그룹
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {object} props.drawingState - 공유 드로잉 스트로크 상태
 * @param {object} props.drawOptions - 공유 드로잉 도구 옵션
 * @param {function} props.setDrawOptions - 공유 드로잉 도구 옵션 업데이트
 */
export const DrawTab = memo(function DrawTab({
  editor,
  drawingState,
  drawOptions,
  setDrawOptions,
}) {
  /* ── 도구 상태 ── */
  const [recentColors, setRecentColors] = useState([]);
  const {
    activeTool = null,
    penColor = "#000000",
    penWidth = 3,
    highlighterOpacity = 0.4,
    canvasActive = false,
  } = drawOptions || {};

  const updateDrawOptions = useCallback((patch) => {
    setDrawOptions?.((prev) => ({ ...prev, ...patch }));
  }, [setDrawOptions]);

  /** 색상 선택 시 최근 사용 색상 목록에 추가 */
  const handleColorChange = useCallback((color) => {
    updateDrawOptions({ penColor: color });
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, [updateDrawOptions]);

  /** 도구 선택 처리 - 같은 도구 재클릭 시 해제 */
  const handleToolSelect = useCallback((toolId) => {
    updateDrawOptions({
      activeTool: activeTool === toolId ? null : toolId,
      canvasActive: true,
    });
  }, [activeTool, updateDrawOptions]);

  /** 펜 도구 선택 시 해당 도구의 기본 두께 적용 */
  const handlePenSelect = useCallback((pen) => {
    handleToolSelect(pen.id);
    updateDrawOptions({ penWidth: pen.width });
  }, [handleToolSelect, updateDrawOptions]);

  /** 형광펜 선택 시 기본 두께와 투명도 적용 */
  const handleHighlighterSelect = useCallback((hl) => {
    handleToolSelect(hl.id);
    updateDrawOptions({ penWidth: hl.width, highlighterOpacity: hl.opacity });
  }, [handleToolSelect, updateDrawOptions]);

  /** 드로잉 캔버스 토글 */
  const toggleCanvas = useCallback(() => {
    const next = !canvasActive;
    updateDrawOptions({
      canvasActive: next,
      activeTool: next ? activeTool : null,
    });
  }, [activeTool, canvasActive, updateDrawOptions]);

  /** 잉크를 텍스트로 변환 (알림만 표시 - 실제 OCR은 미구현) */
  const convertInkToText = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      showEditorAlert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    showEditorAlert("잉크→텍스트 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 잉크를 도형으로 변환 (알림만 표시) */
  const convertInkToShape = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      showEditorAlert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    showEditorAlert("잉크→도형 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 잉크를 수식으로 변환 (알림만 표시) */
  const convertInkToMath = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      showEditorAlert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    showEditorAlert("잉크→수식 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 현재 활성 도구가 형광펜인지 여부 */
  const isHighlighterActive = activeTool?.startsWith("highlight");

  /** 현재 도구에 맞는 색상 팔레트 선택 */
  const activeColorPalette = isHighlighterActive ? HIGHLIGHTER_COLORS : PEN_COLORS;

  if (!editor) return null;

  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)",
      borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px",
    }}>

      {/* ── 도구 그룹: 펜, 형광펜, 지우개, 올가미 ── */}
      <RibbonGroup label="도구">
        <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          {/* 펜 도구 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PEN_TOOLS.map((pen) => (
              <ToolButton
                key={pen.id}
                icon={pen.icon}
                label={pen.label}
                active={activeTool === pen.id}
                color={activeTool === pen.id ? penColor : null}
                onClick={() => handlePenSelect(pen)}
                title={`${pen.label} (${pen.width}px)`}
              />
            ))}
          </div>

          {/* 형광펜 + 지우개 + 올가미 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HIGHLIGHTER_TOOLS.map((hl) => (
              <ToolButton
                key={hl.id}
                icon={Highlighter}
                label={hl.label}
                active={activeTool === hl.id}
                color={activeTool === hl.id ? penColor : null}
                onClick={() => handleHighlighterSelect(hl)}
                title={`${hl.label} (${hl.width}px)`}
              />
            ))}
            <ToolButton
              icon={Eraser}
              label="지우개"
              active={activeTool === "eraser"}
              onClick={() => handleToolSelect("eraser")}
              title="스트로크 지우기"
            />
          </div>

          {/* 올가미 선택 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ToolButton
              icon={Lasso}
              label="올가미"
              active={activeTool === "lasso"}
              onClick={() => handleToolSelect("lasso")}
              title="올가미 선택"
            />
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 펜 설정 그룹: 색상, 두께, 투명도 ── */}
      <RibbonGroup label="펜">
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {/* 색상 선택 드롭다운 */}
          <DropdownButton trigger={
            <RibbonBtn title="펜 색상 선택">
              <span style={{
                display: "inline-block", width: 14, height: 14,
                background: penColor, border: "1px solid #ccc", borderRadius: 2,
              }} />
              <span style={{ fontSize: 10 }}>색상</span>
              <ChevronDown size={8} />
            </RibbonBtn>
          }>
            <div style={{ padding: 4, minWidth: 200 }}>
              <ColorGrid
                colors={activeColorPalette}
                value={penColor}
                onChange={handleColorChange}
                columns={5}
                recentColors={recentColors}
                showMoreColors
                moreColorsLabel="다른 색..."
              />
            </div>
          </DropdownButton>

          {/* 두께/투명도 슬라이더 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ThicknessSlider
              value={penWidth}
              onChange={(value) => updateDrawOptions({ penWidth: value })}
              label="두께"
            />
            {/* 형광펜 활성 시에만 투명도 슬라이더 표시 */}
            {isHighlighterActive && (
              <OpacitySlider
                value={highlighterOpacity}
                onChange={(value) => updateDrawOptions({ highlighterOpacity: value })}
              />
            )}
          </div>
        </div>

        {/* 최근 사용 색상 빠른 선택 */}
        {recentColors.length > 0 && (
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            {recentColors.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateDrawOptions({ penColor: color })}
                title={color}
                style={{
                  width: 14, height: 14,
                  background: color,
                  border: penColor === color ? "2px solid #333" : "1px solid #ccc",
                  borderRadius: 2,
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                }}
              />
            ))}
          </div>
        )}
      </RibbonGroup>

      <GroupSep />

      {/* ── 변환 그룹: 잉크→텍스트/도형/수식 ── */}
      <RibbonGroup label="변환">
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge
            icon={<Type size={ICON_SIZE_LARGE} />}
            label="잉크→텍스트"
            onClick={convertInkToText}
            title="잉크를 텍스트로 변환"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={convertInkToShape} title="잉크를 도형으로 변환" small>
              <Shapes size={ICON_SIZE} />
              <span style={{ fontSize: 10 }}>잉크→도형</span>
            </RibbonBtn>
            <RibbonBtn onClick={convertInkToMath} title="잉크를 수식으로 변환" small>
              <Sigma size={ICON_SIZE} />
              <span style={{ fontSize: 10 }}>잉크→수식</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 삽입 그룹: 그리기 캔버스 ── */}
      <RibbonGroup label="삽입">
        <RibbonBtnLarge
          icon={<Frame size={ICON_SIZE_LARGE} />}
          label="그리기 캔버스"
          onClick={toggleCanvas}
          active={canvasActive}
          title="에디터 위에 그리기 캔버스를 표시합니다"
        />
      </RibbonGroup>

      <GroupSep />

      {/* ── 실행취소/다시실행 ── */}
      <RibbonGroup label="실행취소">
        <div style={{ display: "flex", gap: 2 }}>
          <RibbonBtn
            onClick={drawingState.undo}
            disabled={!drawingState.canUndo}
            title="스트로크 실행취소"
            small
          >
            <Undo2 size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn
            onClick={drawingState.redo}
            disabled={!drawingState.canRedo}
            title="스트로크 다시실행"
            small
          >
            <Redo2 size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn
            onClick={drawingState.resetDrawings}
            disabled={drawingState.strokes.length === 0}
            title="모든 잉크 지우기"
            small
          >
            <Trash2 size={ICON_SIZE} />
          </RibbonBtn>
        </div>
      </RibbonGroup>
    </div>
  );
});

