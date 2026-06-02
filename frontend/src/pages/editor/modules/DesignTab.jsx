/**
 * DesignTab.jsx — 에디터 리본 "디자인" 탭
 * 문서 테마, 페이지 배경색, 워터마크, 페이지 테두리 설정을 제공한다.
 */

import { memo } from "react";
import { Palette, Droplets, PaintBucket } from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton, ColorGrid } from "./RibbonParts";

const ICON_SIZE = 12;

/** 페이지 배경 색상 팔레트 */
const THEME_COLORS = [
  "#ffffff", "#f8f9fa", "#fff8dc", "#f0f8ff", "#f5f5dc",
  "#faf0e6", "#f0fff0", "#ffe4e1", "#e6e6fa", "#fffff0",
  "#ffefd5", "#f0e68c", "#e0ffff", "#ffdab9", "#ffe4c4",
];

/** 문서 테마 프리셋 */
const THEMES = [
  { name: "기본", bg: "#fff", accent: "#1e3a5f" },
  { name: "세련", bg: "#f8f9fa", accent: "#2563eb" },
  { name: "따뜻한", bg: "#fffbeb", accent: "#b45309" },
  { name: "차가운", bg: "#f0f9ff", accent: "#0369a1" },
  { name: "자연", bg: "#f0fdf4", accent: "#15803d" },
];

export const DesignTab = memo(function DesignTab({ pageColor, setPageColor, onOpenPageBorderDialog, onOpenWatermarkDialog }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="문서 서식">
        <div style={{ display: "flex", gap: 4 }}>
          {THEMES.map(th => (
            <button key={th.name} type="button" className="word-style-card" onClick={() => setPageColor(th.bg)}
              style={{ width: 50, height: 50, border: pageColor === th.bg ? "2px solid #3b82f6" : "1px solid var(--ribbon-sep, #d5d5d5)", borderRadius: 3, background: th.bg, cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 8, height: 8, background: th.accent, borderRadius: 2 }} />
                <div style={{ width: 8, height: 8, background: th.accent + "66", borderRadius: 2 }} />
                <div style={{ width: 8, height: 8, background: th.accent + "33", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 7, color: "#888" }}>{th.name}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="페이지 배경">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <PaintBucket size={ICON_SIZE} color="#888" />
            <DropdownButton trigger={
              <div style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", border: "1px solid #ccc", borderRadius: 2, padding: "2px 6px" }}>
                <span style={{ display: "inline-block", width: 16, height: 12, background: pageColor || "#fff", border: "1px solid #ddd", borderRadius: 1 }} />
                <span style={{ fontSize: 10 }}>페이지 색</span>
              </div>
            }>
              <div style={{ padding: 8 }}>
                <ColorGrid colors={THEME_COLORS} value={pageColor} onChange={setPageColor} columns={5} />
                <button className="word-dropdown-item" style={{ marginTop: 6 }} onClick={() => setPageColor("#ffffff")}>색 없음</button>
              </div>
            </DropdownButton>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Droplets size={ICON_SIZE} color="#888" />
            <RibbonBtn onClick={onOpenWatermarkDialog} title="워터마크 설정" small>
              <span style={{ fontSize: 10 }}>워터마크</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="페이지 테두리">
        <RibbonBtnLarge icon={<Palette size={18} />} label="페이지 테두리"
          onClick={onOpenPageBorderDialog} title="페이지 테두리 설정" />
      </RibbonGroup>
    </div>
  );
});
