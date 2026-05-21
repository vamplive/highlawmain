/**
 * 클립보드 그룹 - 잘라내기, 복사, 붙여넣기, 서식 복사
 */
import { useState, useEffect, useRef } from "react";
import { ClipboardPaste, Scissors, Copy, Paintbrush, Eraser } from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, RibbonGroup } from "./RibbonParts";
import { plainTextToPasteHtml, sanitizeEditorPasteHtml } from "./pasteCleanup";

const ICON_SIZE_SMALL = 11;

/** 서식 복사에 사용할 마크 속성 목록 */
const FORMAT_MARK_NAMES = ["bold", "italic", "underline", "strike", "subscript", "superscript"];

/**
 * 현재 에디터 커서 위치의 서식 정보를 수집한다.
 * @param {object} editor - TipTap 에디터 인스턴스
 * @returns {object} 수집된 서식 마크 객체
 */
function collectFormatMarks(editor) {
  const marks = {};
  FORMAT_MARK_NAMES.forEach((name) => {
    if (editor.isActive(name)) marks[name] = true;
  });
  if (editor.isActive("highlight")) {
    marks.highlight = editor.getAttributes("highlight").color || "#fef3b5";
  }
  const style = editor.getAttributes("textStyle");
  if (style.color) marks.color = style.color;
  if (style.fontSize) marks.fontSize = style.fontSize;
  if (style.fontFamily) marks.fontFamily = style.fontFamily;
  return marks;
}

/**
 * 수집된 서식 마크를 현재 선택 영역에 적용한다.
 * @param {object} editor - TipTap 에디터 인스턴스
 * @param {object} marks - collectFormatMarks에서 수집된 마크 객체
 */
function applyFormatMarks(editor, marks) {
  let chain = editor.chain().focus().unsetAllMarks();
  if (marks.bold) chain = chain.setBold();
  if (marks.italic) chain = chain.setItalic();
  if (marks.underline) chain = chain.setUnderline();
  if (marks.strike) chain = chain.setStrike();
  if (marks.subscript) chain = chain.setSubscript();
  if (marks.superscript) chain = chain.setSuperscript();
  if (marks.highlight) chain = chain.setHighlight({ color: marks.highlight });
  if (marks.color) chain = chain.setColor(marks.color);
  if (marks.fontSize) chain = chain.setFontSize(marks.fontSize);
  if (marks.fontFamily) chain = chain.setFontFamily(marks.fontFamily);
  chain.run();
}

export function ClipboardGroup({ editor }) {
  const [formatPainting, setFormatPainting] = useState(false);
  const formatMarksRef = useRef(null);

  const handleFormatPaint = () => {
    if (!editor) return;
    if (formatPainting) {
      setFormatPainting(false);
      formatMarksRef.current = null;
      return;
    }
    formatMarksRef.current = collectFormatMarks(editor);
    setFormatPainting(true);
  };

  // 서식 복사 모드일 때: 클릭 시 선택 영역에 서식 적용
  useEffect(() => {
    if (!editor || !formatPainting) return;
    const handleClick = () => {
      const marks = formatMarksRef.current;
      if (!marks || editor.state.selection.empty) return;
      applyFormatMarks(editor, marks);
      setFormatPainting(false);
      formatMarksRef.current = null;
    };
    const dom = editor.view.dom;
    dom.addEventListener("mouseup", handleClick);
    return () => dom.removeEventListener("mouseup", handleClick);
  }, [editor, formatPainting]);

  const handleCut = () => {
    const sel = editor.state.selection;
    if (sel.empty) return;
    const text = editor.state.doc.textBetween(sel.from, sel.to, "\n");
    navigator.clipboard.writeText(text).then(() => {
      editor.chain().focus().deleteSelection().run();
    }).catch(() => document.execCommand("cut"));
  };

  const handleCopy = () => {
    const sel = editor.state.selection;
    if (sel.empty) return;
    const text = editor.state.doc.textBetween(sel.from, sel.to, "\n");
    navigator.clipboard.writeText(text).catch(() => document.execCommand("copy"));
  };

  const handlePaste = () => {
    navigator.clipboard.readText()
      .then((t) => editor.chain().focus().insertContent(plainTextToPasteHtml(t)).run())
      .catch(() => {});
  };

  const handleCleanupDocument = () => {
    if (!editor) return;
    const cleaned = sanitizeEditorPasteHtml(editor.getHTML());
    editor.commands.setContent(cleaned || "<p></p>");
  };

  return (
    <RibbonGroup label="클립보드">
      <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <RibbonBtnLarge
          icon={<ClipboardPaste size={18} />} label="붙여넣기"
          onClick={handlePaste} title="붙여넣기 (Ctrl+V)"
          split onDropdown={handlePaste}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={handleCut} title="잘라내기 (Ctrl+X)" small>
            <Scissors size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>잘라내기</span>
          </RibbonBtn>
          <RibbonBtn onClick={handleCopy} title="복사 (Ctrl+C)" small>
            <Copy size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>복사</span>
          </RibbonBtn>
          <RibbonBtn active={formatPainting} onClick={handleFormatPaint} title="서식 복사 (더블클릭: 연속)" small>
            <Paintbrush size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>서식복사</span>
          </RibbonBtn>
          <RibbonBtn onClick={handleCleanupDocument} title="문서 붙여넣기 서식 정리" small>
            <Eraser size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>서식정리</span>
          </RibbonBtn>
        </div>
      </div>
    </RibbonGroup>
  );
}
