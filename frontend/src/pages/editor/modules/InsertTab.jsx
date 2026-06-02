/**
 * 삽입 탭 - 페이지 나누기, 표지, 표, 이미지, 링크, 책갈피, 수식, 텍스트 상자,
 * 첫 글자 장식, 날짜/시간, 워드아트, 특수문자 등 삽입 기능 모음
 */
import { memo } from "react";
import {
  Table2, Image as ImageIcon, Shapes, Link2, Type, Code2,
  Minus, Quote, Hash, FileText, CornerDownRight,
  Omega, ChevronDown,
  SeparatorHorizontal, Bookmark, CalendarDays, Sigma,
  PanelTop, Sparkles,
} from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";
import { COVER_PAGE_PRESETS } from "./coverPageTemplates";
import { showEditorAlert } from "./editorToast";
import TableGridSelector from "./TableGridSelector";
import SpecialCharPicker from "./SpecialCharPicker";
import EquationSymbolPicker from "./EquationSymbolPicker";

/** 아이콘 기본 크기 */
const IS = 12;

/** URL 유효성 검사 — http/https만 허용 (javascript: 등 차단) */
function isValidUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch { return false; }
}

/** HTML 특수문자 이스케이프 (XSS 방지) */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── 날짜/시간 포맷 목록 ── */
const DATE_FORMATS = [
  { id: "iso", label: "2024-01-15", format: (d) => d.toISOString().split("T")[0] },
  { id: "korean", label: "2024년 1월 15일", format: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일` },
  { id: "us", label: "1/15/2024", format: (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}` },
  { id: "korean-weekday", label: "2024년 1월 15일 (월)", format: (d) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }},
  { id: "time-24", label: "14:30", format: (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` },
  { id: "datetime-korean", label: "2024년 1월 15일 오후 2:30", format: (d) => {
    const h = d.getHours();
    const period = h < 12 ? "오전" : "오후";
    const h12 = h % 12 || 12;
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${period} ${h12}:${String(d.getMinutes()).padStart(2, "0")}`;
  }},
];

/* ── 워드아트 스타일 목록 ── */
const WORD_ART_STYLES = [
  {
    id: "gradient-blue",
    label: "파란 그라데이션",
    style: "font-size:24pt; font-weight:bold; background:linear-gradient(90deg, #2563eb, #06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent;",
  },
  {
    id: "gold-shadow",
    label: "금색 그림자",
    style: "font-size:24pt; font-weight:bold; color:#b8860b; text-shadow:2px 2px 4px rgba(184,134,11,0.4), 0 0 8px rgba(255,215,0,0.2);",
  },
  {
    id: "neon-glow",
    label: "네온 효과",
    style: "font-size:24pt; font-weight:bold; color:#00ff88; text-shadow:0 0 7px #00ff88, 0 0 10px #00ff88, 0 0 21px #00ff88;",
  },
  {
    id: "outline-dark",
    label: "윤곽선",
    style: "font-size:24pt; font-weight:bold; color:transparent; -webkit-text-stroke:2px #1e3a5f;",
  },
  {
    id: "retro-shadow",
    label: "레트로 그림자",
    style: "font-size:24pt; font-weight:bold; color:#e74c3c; text-shadow:3px 3px 0 #c0392b, 6px 6px 0 rgba(0,0,0,0.1);",
  },
  {
    id: "gradient-purple",
    label: "보라 그라데이션",
    style: "font-size:24pt; font-weight:bold; background:linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent;",
  },
];

/* ================================================================
 *  메인 삽입 탭 컴포넌트
 * ================================================================ */

/**
 * 삽입 탭 - 에디터 리본 메뉴의 삽입 기능 그룹
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {function} props.onOpenHyperlinkDialog - 하이퍼링크 대화상자 열기
 * @param {function} props.onOpenImageDialog - 이미지 대화상자 열기
 * @param {function} props.onOpenBookmarkDialog - 책갈피 대화상자 열기
 * @param {function} props.onOpenCrossRefDialog - 상호 참조 대화상자 열기
 */
export const InsertTab = memo(function InsertTab({
  editor,
  onOpenHyperlinkDialog,
  onOpenImageDialog,
  onOpenBookmarkDialog,
  onOpenCrossRefDialog,
}) {
  if (!editor) return null;

  /** 텍스트 상자 삽입 */
  const insertTextBox = () => {
    editor.chain().focus().insertContent(
      '<div style="border:1px solid #999; padding:12px; margin:12px 0; min-height:60px;">텍스트 상자</div>'
    ).run();
  };

  /** 첫 글자 장식(Drop Cap) 적용 */
  const applyDropCap = () => {
    const { from } = editor.state.selection;
    const resolvedPos = editor.state.doc.resolve(from);
    const paragraph = resolvedPos.parent;

    if (paragraph.textContent.length > 0) {
      const firstChar = paragraph.textContent.charAt(0);
      const restText = paragraph.textContent.slice(1);
      const dropCapHtml =
        `<span style="float:left; font-size:3em; line-height:1; padding-right:6px; font-weight:bold; color:#1e3a5f;">${firstChar}</span>${restText}`;
      editor.chain().focus()
        .command(({ tr, state }) => {
          const startOfParagraph = resolvedPos.start();
          const endOfParagraph = resolvedPos.end();
          tr.replaceWith(startOfParagraph, endOfParagraph, state.schema.text(""));
          return true;
        })
        .insertContent(dropCapHtml)
        .run();
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)",
      borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px",
    }}>

      {/* ── 페이지 그룹: 페이지 나누기, 구역 나누기, 표지 ── */}
      <RibbonGroup label="페이지">
        <div style={{ display: "flex", gap: 4 }}>
          <DropdownButton trigger={
            <RibbonBtnLarge icon={<SeparatorHorizontal size={18} />} label="페이지 나누기" title="페이지/구역 나누기" />
          }>
            <div style={{ padding: 4, minWidth: 180 }}>
              <button className="word-dropdown-item" style={{ padding: "6px 12px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setPageBreak().run(); }}>
                <SeparatorHorizontal size={14} style={{ marginRight: 8, verticalAlign: "middle" }} />
                페이지 나누기
              </button>
              <div style={{ fontSize: 10, color: "#888", padding: "6px 12px 2px", fontWeight: 500 }}>구역 나누기</div>
              <button className="word-dropdown-item" style={{ padding: "5px 12px 5px 24px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSectionBreak("next-page").run(); }}>
                다음 페이지
              </button>
              <button className="word-dropdown-item" style={{ padding: "5px 12px 5px 24px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSectionBreak("continuous").run(); }}>
                연속
              </button>
              <button className="word-dropdown-item" style={{ padding: "5px 12px 5px 24px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSectionBreak("even-page").run(); }}>
                짝수 페이지
              </button>
              <button className="word-dropdown-item" style={{ padding: "5px 12px 5px 24px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSectionBreak("odd-page").run(); }}>
                홀수 페이지
              </button>
              <div style={{ height: 1, background: "#e5e7eb", margin: "4px 0" }} />
              <button className="word-dropdown-item" style={{ padding: "5px 12px", width: "100%", textAlign: "left", fontSize: 11 }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColumnBreak().run(); }}>
                단 나누기
              </button>
            </div>
          </DropdownButton>

          <DropdownButton trigger={
            <RibbonBtnLarge icon={<PanelTop size={18} />} label="표지" title="표지 삽입" />
          }>
            <div style={{ padding: 4, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 12px 2px", fontWeight: 500 }}>표지 페이지</div>
              {COVER_PAGE_PRESETS.map((preset) => (
                <button key={preset.id} className="word-dropdown-item"
                  style={{ padding: "6px 12px", width: "100%", textAlign: "left", fontSize: 11 }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().insertContentAt(0, preset.build()).run();
                  }}>
                  {preset.label}
                </button>
              ))}
            </div>
          </DropdownButton>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 표 그룹 ── */}
      <RibbonGroup label="표">
        <DropdownButton trigger={
          <RibbonBtnLarge icon={<Table2 size={18} />} label="표" title="표 삽입" />
        }>
          <TableGridSelector onSelect={(r, c) => editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run()} />
        </DropdownButton>
      </RibbonGroup>

      <GroupSep />

      {/* ── 일러스트레이션 그룹 ── */}
      <RibbonGroup label="일러스트레이션">
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge icon={<ImageIcon size={18} />} label="그림"
            onClick={() => onOpenImageDialog ? onOpenImageDialog() : (() => { const u = window.prompt("이미지 URL:"); if (u && isValidUrl(u)) editor.chain().focus().setImage({ src: u }).run(); else if (u) showEditorAlert("유효하지 않은 URL입니다."); })()}
            title="그림 삽입" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="도형" small><Shapes size={IS} /> <span style={{ fontSize: 10 }}>도형</span></RibbonBtn>
            }>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 11, marginBottom: 4, fontWeight: 500 }}>기본 도형</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: 2 }}>
                  {["□", "○", "△", "◇", "☆", "♡", "⬠", "⬡", "▬", "▭", "⌒", "⌓"].map((s, i) => (
                    <button key={i} type="button" className="word-dropdown-item"
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, padding: 0 }}
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(s).run(); }}>{s}</button>
                  ))}
                </div>
              </div>
            </DropdownButton>
            <RibbonBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선" small>
              <Minus size={IS} /> <span style={{ fontSize: 10 }}>구분선</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 머리글/바닥글 그룹 ── */}
      <RibbonGroup label="머리글/바닥글">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => { const t = window.prompt("머리글:"); if (t) editor.commands.setContent(`<div style="text-align:center;font-size:9pt;color:#999;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:12px;">${escapeHtml(t)}</div>` + editor.getHTML()); }} title="머리글" small>
            <FileText size={IS} /> <span style={{ fontSize: 10 }}>머리글</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => { const t = window.prompt("바닥글:"); if (t) editor.commands.setContent(editor.getHTML() + `<div style="text-align:center;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:4px;margin-top:12px;">${escapeHtml(t)}</div>`); }} title="바닥글" small>
            <FileText size={IS} /> <span style={{ fontSize: 10 }}>바닥글</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => editor.chain().focus().insertContent('<p style="text-align:center;font-size:10pt;color:#888;">— # —</p>').run()} title="페이지 번호" small>
            <Hash size={IS} /> <span style={{ fontSize: 10 }}>페이지번호</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 링크 그룹 ── */}
      <RibbonGroup label="링크">
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge icon={<Link2 size={18} />} label="링크" active={editor.isActive("link")}
            onClick={() => onOpenHyperlinkDialog ? onOpenHyperlinkDialog() : (() => {
              const prev = editor.getAttributes("link").href || "";
              const url = window.prompt("URL:", prev);
              if (url === null) return;
              if (!url) editor.chain().focus().unsetLink().run();
              else if (isValidUrl(url)) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
              else showEditorAlert("유효하지 않은 URL입니다. http:// 또는 https://로 시작해야 합니다.");
            })()} title="하이퍼링크 (Ctrl+K)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={() => onOpenBookmarkDialog?.()} title="책갈피 삽입" small>
              <Bookmark size={IS} /> <span style={{ fontSize: 10 }}>책갈피</span>
            </RibbonBtn>
            <RibbonBtn onClick={() => onOpenCrossRefDialog?.()} title="상호 참조 삽입" small>
              <CornerDownRight size={IS} /> <span style={{ fontSize: 10 }}>상호참조</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 수식 그룹 ── */}
      <RibbonGroup label="수식">
        <DropdownButton trigger={
          <RibbonBtnLarge icon={<Sigma size={18} />} label="수식" title="수식 기호 삽입" />
        }>
          <EquationSymbolPicker onSelect={(ch) => editor.chain().focus().insertContent(ch).run()} />
        </DropdownButton>
      </RibbonGroup>

      <GroupSep />

      {/* ── 텍스트 그룹 ── */}
      <RibbonGroup label="텍스트">
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용" small>
              <Quote size={IS} /> <span style={{ fontSize: 10 }}>인용</span>
            </RibbonBtn>
            <RibbonBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록" small>
              <Code2 size={IS} /> <span style={{ fontSize: 10 }}>코드</span>
            </RibbonBtn>
            <RibbonBtn onClick={insertTextBox} title="텍스트 상자 삽입" small>
              <Type size={IS} /> <span style={{ fontSize: 10 }}>텍스트상자</span>
            </RibbonBtn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={applyDropCap} title="첫 글자 장식 (Drop Cap)" small>
              <span style={{ fontSize: IS, fontWeight: 700, lineHeight: 1 }}>A</span>
              <span style={{ fontSize: 10 }}>첫글자장식</span>
            </RibbonBtn>

            {/* 날짜/시간 삽입 드롭다운 */}
            <DropdownButton trigger={
              <RibbonBtn title="날짜/시간 삽입" small>
                <CalendarDays size={IS} /> <span style={{ fontSize: 10 }}>날짜/시간</span> <ChevronDown size={8} />
              </RibbonBtn>
            }>
              <div style={{ padding: 4, minWidth: 200 }}>
                <div style={{ fontSize: 10, color: "#888", padding: "4px 12px 2px", fontWeight: 500 }}>날짜/시간 형식</div>
                {DATE_FORMATS.map((fmt) => {
                  const now = new Date();
                  return (
                    <button key={fmt.id} className="word-dropdown-item"
                      style={{ padding: "6px 12px", width: "100%", textAlign: "left", fontSize: 11 }}
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(fmt.format(now)).run(); }}>
                      {fmt.format(now)}
                    </button>
                  );
                })}
              </div>
            </DropdownButton>

            {/* 워드아트 드롭다운 */}
            <DropdownButton trigger={
              <RibbonBtn title="워드아트 삽입" small>
                <Sparkles size={IS} /> <span style={{ fontSize: 10 }}>워드아트</span> <ChevronDown size={8} />
              </RibbonBtn>
            }>
              <div style={{ padding: 4, minWidth: 220 }}>
                <div style={{ fontSize: 10, color: "#888", padding: "4px 12px 2px", fontWeight: 500 }}>워드아트 스타일</div>
                {WORD_ART_STYLES.map((art) => (
                  <button key={art.id} className="word-dropdown-item"
                    style={{ padding: "6px 12px", width: "100%", textAlign: "left", fontSize: 11 }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const inputText = window.prompt("워드아트 텍스트:", "워드아트");
                      if (inputText) {
                        editor.chain().focus().insertContent(
                          `<span style="${art.style}">${escapeHtml(inputText)}</span>`
                        ).run();
                      }
                    }}>
                    <span style={{ fontSize: 13, marginRight: 8, display: "inline-block", verticalAlign: "middle" }}
                      dangerouslySetInnerHTML={{ __html: `<span style="${art.style.replace(/font-size:[^;]+;/, "font-size:13px;")}">가</span>` }} />
                    {art.label}
                  </button>
                ))}
              </div>
            </DropdownButton>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 기호 그룹 ── */}
      <RibbonGroup label="기호">
        <DropdownButton trigger={
          <RibbonBtnLarge icon={<Omega size={18} />} label="특수문자" title="특수 문자 삽입" />
        }>
          <SpecialCharPicker onSelect={(ch) => editor.chain().focus().insertContent(ch).run()} />
        </DropdownButton>
      </RibbonGroup>
    </div>
  );
});
