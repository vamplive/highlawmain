/**
 * 글꼴 그룹 - 글꼴/크기 선택, 서식(B/I/U/S/sub/sup), 텍스트 색, 강조 색
 */
import { useState } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript, Superscript, Eraser, CaseSensitive, AArrowUp, AArrowDown, Highlighter, Baseline } from "lucide-react";
import { RibbonBtn, RibbonGroup, DropdownButton, ColorGrid } from "./RibbonParts";
import { FONT_LIST, FONT_SIZES, HIGHLIGHT_COLORS, TEXT_COLORS } from "./constants";

const ICON_SIZE = 13;
const ICON_SIZE_SMALL = 11;
/** 서식 토글 버튼 설정 — 반복되는 6개 버튼을 데이터로 표현 */
const FORMAT_BUTTONS = [
  { mark: "bold", Icon: Bold, title: "굵게 (Ctrl+B)", cmd: "toggleBold", iconProps: { strokeWidth: 3 } },
  { mark: "italic", Icon: Italic, title: "기울임 (Ctrl+I)", cmd: "toggleItalic" },
  { mark: "underline", Icon: UnderlineIcon, title: "밑줄 (Ctrl+U)", cmd: "toggleUnderline" },
  { mark: "strike", Icon: Strikethrough, title: "취소선", cmd: "toggleStrike" },
  { mark: "subscript", Icon: Subscript, title: "아래 첨자", cmd: "toggleSubscript", useSmallIcon: true },
  { mark: "superscript", Icon: Superscript, title: "위 첨자", cmd: "toggleSuperscript", useSmallIcon: true },
]; /** 에디터 속성 안전 조회 — comment 마크 등으로 인한 crash 방지 */
function safeIsActive(editor, ...args) { try { return editor.isActive(...args); } catch { return false; } }
function safeGetAttr(editor, name) { try { return editor.getAttributes(name); } catch { return {}; } }

/** 색상 드롭다운 (강조/글꼴 색 공용) */
function ColorPickerButton({ label, icon, lastColor, colors, recentColors, columns, width, onApplyLast, onSelectColor, onClear, clearLabel, active }) {
  return (
    <DropdownButton trigger={
      <div style={{ display: "flex", alignItems: "center" }}>
        <RibbonBtn active={active} onClick={onApplyLast} title={label} small>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {icon}
            <span style={{ width: 14, height: 3, background: lastColor, borderRadius: 1, marginTop: icon.type === Baseline ? -2 : 0 }} />
          </span>
        </RibbonBtn>
        <span style={{ fontSize: 7, cursor: "pointer", color: "var(--ribbon-fg, #666)" }}>▼</span>
      </div>
    }>
      <div style={{ padding: 8, width }}>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{label}</div>
        <ColorGrid colors={colors} value={lastColor} recentColors={recentColors}
          onChange={onSelectColor} columns={columns} />
        <button className="word-dropdown-item" style={{ marginTop: 6, width: "100%" }}
          onMouseDown={(e) => { e.preventDefault(); onClear(); }}>
          {clearLabel}
        </button>
      </div>
    </DropdownButton>
  );
}

export function FontGroup({ editor, onOpenFontDialog }) {
  const [lastHighlight, setLastHighlight] = useState("#fef3b5");
  const [lastTextColor, setLastTextColor] = useState("#c00");
  const [recentHighlights, setRecentHighlights] = useState([]);
  const [recentTextColors, setRecentTextColors] = useState([]);

  const getCurrentFont = () => {
    const ff = safeGetAttr(editor, "textStyle").fontFamily;
    if (!ff) return "malgun";
    const found = FONT_LIST.find(f => ff.includes(f.label) || ff.includes(f.family.split(",")[0].replace(/'/g, "")));
    return found?.value || "malgun";
  };
  const getCurrentSize = () => {
    const fs = safeGetAttr(editor, "textStyle").fontSize;
    return fs ? fs.replace("pt", "").replace("px", "") : "11";
  };
  const handleFontChange = (val) => {
    const font = FONT_LIST.find(f => f.value === val);
    if (font) editor.chain().focus().setFontFamily(font.family).run();
  };
  const handleSizeChange = (val) => editor.chain().focus().setFontSize(val + "pt").run();
  const changeSizeStep = (dir) => {
    const cur = parseFloat(getCurrentSize()) || 11;
    const next = dir > 0
      ? FONT_SIZES.find(s => s > cur) || FONT_SIZES[FONT_SIZES.length - 1]
      : [...FONT_SIZES].reverse().find(s => s < cur) || FONT_SIZES[0];
    handleSizeChange(String(next));
  };
  const handleCaseChange = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to);
    const result = text === text.toLowerCase() ? text.toUpperCase()
      : text === text.toUpperCase() ? text.replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w/g, c => c.toLowerCase())
      : text.toLowerCase();
    editor.chain().focus().insertContentAt({ from, to }, result).run();
  };
  const addRecentColor = (color, setter, listSetter) => {
    listSetter(prev => [color, ...prev.filter(x => x !== color)].slice(0, 10));
    setter(color);
  };
  const selectStyle = {
    height: 24, padding: "0 4px", background: "var(--ribbon-input-bg, #fff)",
    border: "1px solid var(--ribbon-input-border, #c0c0c0)", borderRadius: 2,
    fontSize: 12, cursor: "pointer", color: "var(--ribbon-fg, #333)",
  };

  return (
    <RibbonGroup label="글꼴" dialogLauncher={onOpenFontDialog}>
      {/* 1행: 글꼴 + 크기 선택 */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <select value={getCurrentFont()} onChange={(e) => handleFontChange(e.target.value)} title="글꼴"
          style={{ ...selectStyle, width: 130 }}>
          {FONT_LIST.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontSize: 13 }}>{f.label}</option>
          ))}
        </select>
        <select value={getCurrentSize()} onChange={(e) => handleSizeChange(e.target.value)} title="글꼴 크기"
          style={{ ...selectStyle, width: 46 }}>
          {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
        </select>
        <RibbonBtn onClick={() => changeSizeStep(1)} title="글꼴 크기 증가 (Ctrl+Shift+>)" small>
          <AArrowUp size={ICON_SIZE_SMALL} />
        </RibbonBtn>
        <RibbonBtn onClick={() => changeSizeStep(-1)} title="글꼴 크기 감소 (Ctrl+Shift+<)" small>
          <AArrowDown size={ICON_SIZE_SMALL} />
        </RibbonBtn>
        <RibbonBtn onClick={handleCaseChange} title="대/소문자 변경" small>
          <CaseSensitive size={ICON_SIZE_SMALL} />
        </RibbonBtn>
        <RibbonBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="서식 지우기" small>
          <Eraser size={ICON_SIZE_SMALL} />
        </RibbonBtn>
      </div>

      {/* 2행: 인라인 서식 + 색상 */}
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {FORMAT_BUTTONS.map(({ mark, Icon, title, cmd, iconProps, useSmallIcon }) => (
          <RibbonBtn key={mark} active={safeIsActive(editor, mark)}
            onClick={() => editor.chain().focus()[cmd]().run()} title={title} small>
            <Icon size={useSmallIcon ? ICON_SIZE_SMALL : ICON_SIZE} {...iconProps} />
          </RibbonBtn>
        ))}

        <span style={{ display: "inline-block", width: 6 }} />
        <ColorPickerButton label="텍스트 강조" active={safeIsActive(editor, "highlight")}
          icon={<Highlighter size={ICON_SIZE_SMALL} />}
          lastColor={lastHighlight} colors={HIGHLIGHT_COLORS} recentColors={recentHighlights} columns={5} width={180}
          onApplyLast={() => editor.chain().focus().toggleHighlight({ color: lastHighlight }).run()}
          onSelectColor={(c) => { addRecentColor(c, setLastHighlight, setRecentHighlights); editor.chain().focus().toggleHighlight({ color: c }).run(); }}
          onClear={() => editor.chain().focus().unsetHighlight().run()} clearLabel="강조 없음" />
        <ColorPickerButton label="글꼴 색"
          icon={<Baseline size={ICON_SIZE} color={lastTextColor} strokeWidth={2.5} />}
          lastColor={lastTextColor} colors={TEXT_COLORS} recentColors={recentTextColors} columns={10} width={200}
          onApplyLast={() => editor.chain().focus().setColor(lastTextColor).run()}
          onSelectColor={(c) => { addRecentColor(c, setLastTextColor, setRecentTextColors); editor.chain().focus().setColor(c).run(); }}
          onClear={() => editor.chain().focus().unsetColor().run()} clearLabel="자동 (검정)" />
      </div>
    </RibbonGroup>
  );
}
