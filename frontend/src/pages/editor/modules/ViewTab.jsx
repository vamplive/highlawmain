/**
 * ViewTab.jsx — 에디터 리본 "보기" 탭
 * 눈금자, 탐색 창, 보기 모드, 확대/축소, 전체 화면, 다크 모드를 제공한다.
 */

import { memo } from "react";
import {
  Ruler, Eye, EyeOff, Printer, FilePlus, ZoomIn, ZoomOut,
  FileText, BookOpen, Monitor, Columns2, PanelLeft,
} from "lucide-react";
import { RibbonBtn, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";

const ICON_SIZE = 12;

/** 줌 프리셋 (%) */
const ZOOM_PRESETS = [50, 75, 100, 125, 150, 175, 200];

/** 보기 모드 옵션 */
const VIEW_MODES = [
  { id: "edit", label: "인쇄 모양", icon: <FileText size={10} /> },
  { id: "preview", label: "읽기", icon: <BookOpen size={10} /> },
  { id: "web", label: "웹", icon: <Monitor size={10} /> },
];

export const ViewTab = memo(function ViewTab({ showRuler, setShowRuler, viewMode, setViewMode, zoom, setZoom, showNavPane, setShowNavPane, onNew, darkMode, setDarkMode, onFitPageWidth, onToggleFullscreen, isFullscreen }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="보기">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "var(--ribbon-fg, #555)" }}>
              <input type="checkbox" checked={showRuler} onChange={e => setShowRuler(e.target.checked)} /> <Ruler size={11} /> 눈금자
            </label>
            <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "var(--ribbon-fg, #555)" }}>
              <input type="checkbox" checked={showNavPane} onChange={e => setShowNavPane(e.target.checked)} /> <PanelLeft size={11} /> 탐색 창
            </label>
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--ribbon-input-border, #c0c0c0)", borderRadius: 3, overflow: "hidden" }}>
            {VIEW_MODES.map(v => (
              <button key={v.id} type="button" onClick={() => setViewMode(v.id)}
                style={{
                  height: 24, padding: "0 10px", fontSize: 10, border: "none", cursor: "pointer",
                  background: viewMode === v.id ? "#3b82f6" : "var(--ribbon-bg, #f3f3f3)",
                  color: viewMode === v.id ? "#fff" : "var(--ribbon-fg, #555)",
                  display: "flex", alignItems: "center", gap: 3,
                  borderLeft: v.id !== "edit" ? "1px solid var(--ribbon-input-border, #c0c0c0)" : "none",
                }}>{v.icon} {v.label}</button>
            ))}
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="확대/축소">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <RibbonBtn onClick={() => setZoom(100)} title="100%" small><span style={{ fontSize: 10 }}>100%</span></RibbonBtn>
            <RibbonBtn onClick={() => setZoom(z => Math.max(50, z - 10))} title="축소 (-10%)" small><ZoomOut size={ICON_SIZE} /></RibbonBtn>
            <span style={{ fontSize: 10, minWidth: 30, textAlign: "center", color: "var(--ribbon-fg, #555)" }}>{zoom}%</span>
            <RibbonBtn onClick={() => setZoom(z => Math.min(200, z + 10))} title="확대 (+10%)" small><ZoomIn size={ICON_SIZE} /></RibbonBtn>
            <DropdownButton trigger={<RibbonBtn title="프리셋" small><span style={{ fontSize: 7 }}>▼</span></RibbonBtn>}>
              {ZOOM_PRESETS.map(z => (
                <button key={z} className={`word-dropdown-item${zoom === z ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setZoom(z); }}>{z}%</button>
              ))}
            </DropdownButton>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <RibbonBtn onClick={onFitPageWidth} title="페이지 너비 맞춤" small>
              <Columns2 size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>너비 맞춤</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="창">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn active={isFullscreen} onClick={onToggleFullscreen} title="전체 화면 (F11)" small>
            <Monitor size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>전체 화면</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="기타">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={onNew} title="새 문서" small>
            <FilePlus size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>새 문서</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => window.print()} title="인쇄 (Ctrl+P)" small>
            <Printer size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>인쇄</span>
          </RibbonBtn>
          {setDarkMode && (
            <RibbonBtn active={darkMode} onClick={() => setDarkMode(!darkMode)} title="다크 모드" small>
              {darkMode ? <Eye size={ICON_SIZE} /> : <EyeOff size={ICON_SIZE} />} <span style={{ fontSize: 10 }}>다크모드</span>
            </RibbonBtn>
          )}
        </div>
      </RibbonGroup>
    </div>
  );
});
