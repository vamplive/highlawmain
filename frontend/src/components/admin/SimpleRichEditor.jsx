/**
 * 관리자용 간단한 리치 텍스트 에디터
 * Bold / Italic / Underline / Strikethrough / Align / Color
 * Props: value (HTML string), onChange (HTML string), minHeight
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from "lucide-react";
import { useEffect } from "react";
import { COLORS } from "./styles";

const PRESET_COLORS = [
  "#0b1f3a", "#334155", "#64748b",
  "#c9a84c", "#dc2626", "#16a34a", "#2563eb", "#7c3aed", "#db2777",
  "#000000", "#ffffff",
];

const toolbarBtnStyle = (active) => ({
  width: 28, height: 28,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", borderRadius: 4, cursor: "pointer",
  background: active ? "rgba(201,168,76,0.15)" : "transparent",
  color: active ? COLORS.accent : COLORS.textSecondary,
  transition: "background 0.1s",
  flexShrink: 0,
});

function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={toolbarBtnStyle(active)}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1, height: 18, background: COLORS.border,
      margin: "0 4px", alignSelf: "center", flexShrink: 0,
    }} />
  );
}

export default function SimpleRichEditor({
  value,
  onChange,
  minHeight = 160,
  placeholder = "내용을 입력하세요...",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      TextStyle,
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor || value === undefined) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value]); // eslint-disable-line

  if (!editor) return null;

  const activeColor = editor.getAttributes("textStyle").color;

  return (
    <div style={{
      border: `1px solid rgba(11,31,58,0.20)`,
      borderRadius: 6, overflow: "hidden",
    }}>
      {/* ── 툴바 ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center",
        gap: 1, padding: "5px 8px",
        background: "#f9fafb",
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        {/* 글꼴 스타일 */}
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="굵게 (Ctrl+B)"
        >
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="기울임 (Ctrl+I)"
        >
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="밑줄 (Ctrl+U)"
        >
          <UnderlineIcon size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="취소선"
        >
          <Strikethrough size={13} />
        </ToolBtn>

        <Divider />

        {/* 정렬 */}
        <ToolBtn
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="왼쪽 정렬"
        >
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="가운데 정렬"
        >
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="오른쪽 정렬"
        >
          <AlignRight size={13} />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="양쪽 정렬"
        >
          <AlignJustify size={13} />
        </ToolBtn>

        <Divider />

        {/* 색상 팔레트 */}
        <span style={{ fontSize: 10.5, color: COLORS.textMuted, marginRight: 3 }}>색상</span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
            title={c}
            style={{
              width: 15, height: 15, borderRadius: 3,
              background: c,
              border: activeColor === c
                ? "2px solid #c9a84c"
                : c === "#ffffff" ? "1px solid #ccc" : "1px solid rgba(0,0,0,0.18)",
              cursor: "pointer", flexShrink: 0,
            }}
          />
        ))}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
          title="색상 초기화"
          style={{
            padding: "1px 6px", fontSize: 10, lineHeight: "16px",
            border: "1px solid rgba(0,0,0,0.14)", borderRadius: 3,
            background: "transparent", cursor: "pointer",
            color: COLORS.textSecondary, flexShrink: 0,
          }}
        >
          초기화
        </button>
      </div>

      {/* ── 편집 영역 ── */}
      <div
        style={{ minHeight, padding: "12px 14px", background: "#fff", cursor: "text" }}
        onClick={() => editor.commands.focus()}
      >
        <style>{`
          .simple-rich-editor-content .ProseMirror {
            outline: none;
            min-height: inherit;
            font-size: 14px;
            line-height: 1.8;
            color: #1a202c;
          }
          .simple-rich-editor-content .ProseMirror p { margin: 0 0 8px; }
          .simple-rich-editor-content .ProseMirror p:last-child { margin-bottom: 0; }
          .simple-rich-editor-content .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left; height: 0; pointer-events: none;
            color: #9ca3af;
          }
        `}</style>
        <div className="simple-rich-editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
