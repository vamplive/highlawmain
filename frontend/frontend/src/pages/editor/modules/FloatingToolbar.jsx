/**
 * Floating Toolbar - 텍스트 선택 시 미니 서식 도구 (lucide-react)
 *
 * 이미지 노드가 선택되면 자동으로 이미지 전용 컨트롤(정렬, 캡션, 편집,
 * 회전, 보더, 자르기, 삭제)을 표시한다.
 */
import { memo, useState, useEffect, useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, Baseline, Link2,
  AlignLeft, AlignCenter, AlignRight,
  ChevronDown, MessageSquare,
  Maximize2, RotateCw, SquareDashed, Type, Crop, Trash2,
} from "lucide-react";
import { RibbonBtn, DropdownButton, ColorGrid } from "./RibbonParts";
import { HIGHLIGHT_COLORS, TEXT_COLORS, FONT_LIST, FONT_SIZES } from "./constants";
import { showEditorAlert } from "./editorToast";

const I = 13;

/**
 * 텍스트 선택 시 표시되는 미니 서식 도구 모음 (볼드/이탤릭/밑줄/링크/댓글).
 * @param {{ editor: import("@tiptap/react").Editor, onInsertComment: Function }} props
 */
export const FloatingToolbar = memo(function FloatingToolbar({ editor, onInsertComment, onOpenImageEdit }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [imageNode, setImageNode] = useState(null);
  const toolbarRef = useRef(null);
  const hideTimer = useRef(null);

  const updatePosition = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state;

    /* 이미지 노드가 선택된 경우엔 포커스 여부와 무관하게 표시 */
    const selectedNode = selection?.node;
    const isImageSelection = selectedNode?.type?.name === "image";

    if (!isImageSelection && (selection.empty || !editor.isFocused)) {
      setVisible(false);
      setImageNode(null);
      return;
    }

    try {
      const { from } = selection;
      const start = editor.view.coordsAtPos(from);
      // Walk up DOM tree to find the scroll container
      let scrollParent = editor.view.dom.parentElement;
      while (scrollParent && !scrollParent.classList.contains("editor-canvas-scroll")) {
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent) {
        // Fallback: use editor DOM parent
        scrollParent = editor.view.dom.closest("[class*='editor']")?.parentElement;
      }
      if (!scrollParent) { setVisible(false); return; }
      const scrollRect = scrollParent.getBoundingClientRect();

      const top = start.top - scrollRect.top - 48;
      const left = Math.max(10, Math.min(start.left - scrollRect.left, scrollRect.width - 380));

      if (top < 0 || top > scrollRect.height) { setVisible(false); return; }
      setPosition({ top, left });
      setImageNode(isImageSelection ? selectedNode : null);
      setVisible(true);
    } catch {
      setVisible(false);
      setImageNode(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onSelectionUpdate = () => {
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(updatePosition, 150);
    };
    const onBlur = () => {
      hideTimer.current = setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) setVisible(false);
      }, 300);
    };
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("blur", onBlur);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("blur", onBlur);
      clearTimeout(hideTimer.current);
    };
  }, [editor, updatePosition]);

  if (!visible || !editor) return null;

  /* 이미지 모드 — 정렬, 캡션, 편집 다이얼로그, 회전, 보더, 삭제 */
  if (imageNode) {
    return (
      <ImageBubbleToolbar
        editor={editor}
        position={position}
        imageNode={imageNode}
        onOpenImageEdit={onOpenImageEdit}
      />
    );
  }

  // Safe wrappers — prevent crash when marks (e.g. comment) cause isActive/getAttributes to throw
  const safeIsActive = (...args) => { try { return editor.isActive(...args); } catch { return false; } };
  const safeGetAttr = (name) => { try { return editor.getAttributes(name); } catch { return {}; } };

  const textColor = safeGetAttr("textStyle").color || "#333";
  const headingVal = safeIsActive("heading", { level: 1 }) ? "1"
    : safeIsActive("heading", { level: 2 }) ? "2"
    : safeIsActive("heading", { level: 3 }) ? "3" : "0";

  return (
    <div ref={toolbarRef} className="floating-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}>
      {/* 글꼴 및 크기 선택 */}
      <select value={(() => {
        const ff = safeGetAttr("textStyle").fontFamily;
        if (!ff) return "malgun";
        const found = FONT_LIST.find(f => ff.includes(f.label) || ff.includes(f.family.split(",")[0].replace(/'/g, "")));
        return found?.value || "malgun";
      })()} onChange={(e) => {
        const font = FONT_LIST.find(f => f.value === e.target.value);
        if (font) editor.chain().focus().setFontFamily(font.family).run();
      }} style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 2px", cursor: "pointer", background: "#fff", maxWidth: 80 }}>
        {FONT_LIST.slice(0, 12).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={(() => {
        const fs = safeGetAttr("textStyle").fontSize;
        return fs ? fs.replace("pt", "").replace("px", "") : "11";
      })()} onChange={(e) => editor.chain().focus().setFontSize(e.target.value + "pt").run()}
        style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 2px", cursor: "pointer", background: "#fff", width: 36 }}>
        {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
      </select>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게" small>
        <Bold size={I} strokeWidth={3} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임" small>
        <Italic size={I} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄" small>
        <Underline size={I} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선" small>
        <Strikethrough size={I} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <DropdownButton trigger={
        <RibbonBtn active={safeIsActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef3b5" }).run()} title="강조" small>
          <Highlighter size={12} />
        </RibbonBtn>
      }>
        <div style={{ padding: 6 }}>
          <ColorGrid colors={HIGHLIGHT_COLORS} onChange={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()} columns={5} />
        </div>
      </DropdownButton>

      <DropdownButton trigger={
        <RibbonBtn title="글꼴 색" small>
          <Baseline size={I} color={textColor} strokeWidth={2.5} />
        </RibbonBtn>
      }>
        <div style={{ padding: 6 }}>
          <ColorGrid colors={TEXT_COLORS.slice(0, 40)} onChange={(c) => editor.chain().focus().setColor(c).run()} columns={10} />
        </div>
      </DropdownButton>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <select value={headingVal} onChange={(e) => {
        const v = parseInt(e.target.value);
        if (v === 0) editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: v }).run();
      }} style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 3px", cursor: "pointer", background: "#fff" }}>
        <option value="0">본문</option>
        <option value="1">제목 1</option>
        <option value="2">제목 2</option>
        <option value="3">제목 3</option>
      </select>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="왼쪽" small>
        <AlignLeft size={11} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데" small>
        <AlignCenter size={11} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="오른쪽" small>
        <AlignRight size={11} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive("link")} onClick={() => {
        const prev = safeGetAttr("link").href || "";
        const url = window.prompt("URL:", prev);
        if (url === null) return;
        if (!url) editor.chain().focus().unsetLink().run();
        else {
          try {
            const parsed = new URL(url, window.location.origin);
            if (!["http:", "https:"].includes(parsed.protocol)) { showEditorAlert("유효하지 않은 URL입니다."); return; }
          } catch { showEditorAlert("유효하지 않은 URL입니다."); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
      }} title="링크" small>
        <Link2 size={12} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn onClick={() => onInsertComment?.()} title="새 메모 (Ctrl+Alt+M)" small>
        <MessageSquare size={12} />
      </RibbonBtn>
    </div>
  );
});

/**
 * 이미지 노드 전용 플로팅 툴바
 * 정렬(왼쪽/가운데/오른쪽/전체너비), 캡션, 회전, 보더, 편집 다이얼로그, 삭제
 */
const ImageBubbleToolbar = function ImageBubbleToolbar({
  editor, position, imageNode, onOpenImageEdit,
}) {
  const align = imageNode?.attrs?.align || "none";
  const isAlign = (a) => align === a;
  const setAlign = (a) => editor.chain().focus().setImageAlign(a).run();

  const editCaption = () => {
    const current = imageNode?.attrs?.caption || "";
    const next = window.prompt("캡션을 입력하세요 (비우면 제거):", current);
    if (next === null) return;
    editor.chain().focus().setImageCaption(next.trim()).run();
  };

  const editAlt = () => {
    const current = imageNode?.attrs?.alt || "";
    const next = window.prompt("대체 텍스트(alt)를 입력하세요:", current);
    if (next === null) return;
    editor.chain().focus().updateImage({ alt: next.trim() }).run();
  };

  const removeImage = () => {
    if (!window.confirm("이미지를 삭제할까요?")) return;
    editor.chain().focus().deleteSelection().run();
  };

  const btn = (active, onClick, title, icon, label) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        height: 26, padding: "0 8px",
        background: active ? "var(--editor-accent-bg-active, #dbeafe)" : "transparent",
        border: active ? "1px solid var(--editor-accent-border-soft, #93c5fd)" : "1px solid transparent",
        borderRadius: 3, fontSize: 11, color: "#333", cursor: "pointer",
        fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(59,130,246,0.08)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );

  return (
    <div
      className="floating-toolbar floating-toolbar-image"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {btn(isAlign("left"), () => setAlign("left"), "왼쪽 정렬", <AlignLeft size={12} />)}
      {btn(isAlign("center"), () => setAlign("center"), "가운데 정렬", <AlignCenter size={12} />)}
      {btn(isAlign("right"), () => setAlign("right"), "오른쪽 정렬", <AlignRight size={12} />)}
      {btn(isAlign("full"), () => setAlign("full"), "전체 너비", <Maximize2 size={12} />)}

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      {btn(false, editCaption, "캡션 추가/편집", <Type size={12} />, "캡션")}
      {btn(false, editAlt, "대체 텍스트", <span style={{ fontSize: 10, fontWeight: 700 }}>ALT</span>)}

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      {btn(false, () => editor.chain().focus().rotateImage(90).run(), "90° 회전", <RotateCw size={12} />)}
      {btn(
        Boolean(imageNode?.attrs?.bordered),
        () => editor.chain().focus().toggleImageBordered().run(),
        "테두리 토글",
        <SquareDashed size={12} />,
      )}
      {btn(
        Boolean(imageNode?.attrs?.rounded),
        () => editor.chain().focus().toggleImageRounded().run(),
        "둥근 모서리 토글",
        <span style={{ fontSize: 10, fontWeight: 700 }}>◖</span>,
      )}

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      {btn(false, () => onOpenImageEdit?.(), "사진 편집(자르기/밝기 등)", <Crop size={12} />, "편집")}

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      {btn(false, removeImage, "이미지 삭제", <Trash2 size={12} color="#b91c1c" />)}
    </div>
  );
};
