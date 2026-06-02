/**
 * 단락 그룹 - 목록, 정렬, 줄 간격, 들여쓰기, 테두리/음영, 텍스트 효과
 */
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ListChecks, Indent, Outdent, ChevronsUpDown, Quote } from "lucide-react";
import { RibbonBtn, RibbonGroup, DropdownButton } from "./RibbonParts";
import { LINE_SPACINGS, PARAGRAPH_SHADING_COLORS, TEXT_EFFECTS } from "./constants";

const ICON_SIZE_SMALL = 11;
/** 정렬 버튼 설정 — 4개의 동일 패턴을 데이터로 통합 */
const ALIGNMENT_BUTTONS = [
  { align: "left", Icon: AlignLeft, title: "왼쪽 맞춤" },
  { align: "center", Icon: AlignCenter, title: "가운데 맞춤" },
  { align: "right", Icon: AlignRight, title: "오른쪽 맞춤" },
  { align: "justify", Icon: AlignJustify, title: "양쪽 맞춤" },
];

/** 테두리 옵션 설정 */
const BORDER_OPTIONS = [
  { label: "바깥쪽 테두리", sides: { top: true, bottom: true, left: true, right: true } },
  { label: "위쪽 테두리만", sides: { top: true, bottom: false, left: false, right: false } },
  { label: "아래쪽 테두리만", sides: { top: false, bottom: true, left: false, right: false } },
  { label: "테두리 없음", sides: null },
];

/** 에디터 isActive 안전 호출 */
function safeIsActive(editor, ...args) { try { return editor.isActive(...args); } catch { return false; } }

export function ParagraphGroup({ editor, onOpenParagraphDialog, onOpenBorderDialog }) {
  const applyBorder = (sides) => {
    if (!sides) { editor.chain().focus().unsetParagraphBorder().run(); return; }
    const v = "1px solid #333";
    editor.chain().focus().setParagraphBorder({
      borderTop: sides.top ? v : "none", borderBottom: sides.bottom ? v : "none",
      borderLeft: sides.left ? v : "none", borderRight: sides.right ? v : "none",
    }).run();
  };

  return (
    <RibbonGroup label="단락" dialogLauncher={onOpenParagraphDialog}>
      {/* 1행: 목록 + 들여쓰기 */}
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DropdownButton trigger={
          <RibbonBtn active={safeIsActive(editor, "bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호" small>
            <List size={ICON_SIZE_SMALL} />
          </RibbonBtn>
        }>
          <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}>● 원형</button>
          <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}>■ 사각형</button>
        </DropdownButton>

        <DropdownButton trigger={
          <RibbonBtn active={safeIsActive(editor, "orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 매기기" small>
            <ListOrdered size={ICON_SIZE_SMALL} />
          </RibbonBtn>
        }>
          <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}>1. 2. 3.</button>
        </DropdownButton>

        <RibbonBtn active={safeIsActive(editor, "taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="체크리스트" small>
          <ListChecks size={ICON_SIZE_SMALL} />
        </RibbonBtn>

        <span style={{ display: "inline-block", width: 3 }} />
        <RibbonBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="내어쓰기 (Shift+Tab)" small>
          <Outdent size={ICON_SIZE_SMALL} />
        </RibbonBtn>
        <RibbonBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="들여쓰기 (Tab)" small>
          <Indent size={ICON_SIZE_SMALL} />
        </RibbonBtn>
      </div>

      {/* 2행: 정렬 + 줄 간격 + 인용 + 테두리/음영 + 텍스트 효과 */}
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        {ALIGNMENT_BUTTONS.map(({ align, Icon, title }) => (
          <RibbonBtn key={align} active={safeIsActive(editor, { textAlign: align })}
            onClick={() => editor.chain().focus().setTextAlign(align).run()} title={title} small>
            <Icon size={ICON_SIZE_SMALL} />
          </RibbonBtn>
        ))}
        <span style={{ display: "inline-block", width: 3 }} />
        <DropdownButton trigger={<RibbonBtn title="줄 간격" small><ChevronsUpDown size={ICON_SIZE_SMALL} /></RibbonBtn>}>
          <div style={{ padding: 4 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px" }}>줄 간격</div>
            {LINE_SPACINGS.map(s => (
              <button key={s.value} className="word-dropdown-item"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setLineSpacing(s.value).run(); }}>
                {s.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSpacingBefore("12pt").run(); }}>단락 앞 간격 추가</button>
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSpacingAfter("12pt").run(); }}>단락 뒤 간격 추가</button>
          </div>
        </DropdownButton>
        <RibbonBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={safeIsActive(editor, "blockquote")} title="인용" small>
          <Quote size={ICON_SIZE_SMALL} />
        </RibbonBtn>
        <DropdownButton trigger={
          <RibbonBtn title="테두리 및 음영" small><span style={{ fontSize: 10 }}>▦</span></RibbonBtn>
        }>
          <div style={{ padding: 4, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>테두리</div>
            {BORDER_OPTIONS.map(opt => (
              <button key={opt.label} className="word-dropdown-item"
                onMouseDown={(e) => { e.preventDefault(); applyBorder(opt.sides); }}>
                {opt.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>음영</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 24px)", gap: 2, padding: "2px 8px" }}>
              {PARAGRAPH_SHADING_COLORS.slice(0, 10).map(c => (
                <button key={c} type="button" style={{ width: 24, height: 18, background: c, border: "1px solid #ddd", borderRadius: 2, cursor: "pointer" }}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setParagraphShading(c).run(); }} />
              ))}
            </div>
            <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onOpenBorderDialog?.(); }}>
              테두리 및 음영...
            </button>
          </div>
        </DropdownButton>

        {/* 텍스트 효과 */}
        <DropdownButton trigger={
          <RibbonBtn title="텍스트 효과" small><span style={{ fontSize: 10 }}>✦</span></RibbonBtn>
        }>
          <div style={{ padding: 6, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "2px 8px 6px", fontWeight: 600 }}>텍스트 효과</div>
            {TEXT_EFFECTS.map(eff => (
              <button key={eff.id} className="word-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (eff.id === "none") editor.chain().focus().unsetTextShadow().run();
                  else if (eff.style.textShadow) editor.chain().focus().setTextShadow(eff.style.textShadow).run();
                }}
                style={{ ...eff.style, fontSize: 12 }}>
                {eff.label} 가나다 Aa
              </button>
            ))}
          </div>
        </DropdownButton>
      </div>
    </RibbonGroup>
  );
}
