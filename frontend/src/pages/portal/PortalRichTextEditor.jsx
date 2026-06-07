/**
 * PortalRichTextEditor — 게시판 글쓰기용 리치 텍스트 에디터
 *
 * 블로그 관리(EditorPage)의 BlogSimpleShell과 동일한 TipTap 기반 WYSIWYG 편집 경험을
 * 게시판 글쓰기에도 제공한다. 블로그 발행/예약/AI 도구 등 게시판과 무관한 기능은 제외하고
 * 굵게/기울임/목록/인용구/링크/이미지/구분선 등 글쓰기에 필요한 핵심 서식만 담은
 * 가벼운 버전이다.
 */
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { portalApi } from "../../utils/api";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Minus, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

const toolbarBtnStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, padding: 0, border: "none", background: "transparent",
  cursor: "pointer", color: "#374151", borderRadius: 6,
};

const toolbarBtnActiveStyle = {
  ...toolbarBtnStyle, background: "#ede9fe", color: "#6d28d9",
};

function ToolButton({ active, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
      title={title}
      aria-label={title}
      disabled={disabled}
      style={{
        ...(active ? toolbarBtnActiveStyle : toolbarBtnStyle),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

export default function PortalRichTextEditor({ value, onChange, placeholder }) {
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "내용을 작성해 주세요..." }),
    ],
    content: value || "",
    onUpdate: ({ editor: editorInstance }) => {
      onChange?.(editorInstance.getHTML());
    },
  });

  // 외부에서 value가 바뀌었을 때(예: 수정 모달을 열어 기존 글을 불러올 때)만 내용을 동기화한다.
  // 매 onChange마다 setContent를 부르면 커서 위치가 튀므로 현재 HTML과 다를 때만 반영한다.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const isActive = (name, attrs) => {
    try { return editor?.isActive(name, attrs) ?? false; } catch { return false; }
  };

  const insertLink = () => {
    const url = window.prompt("링크 URL을 입력하세요", "https://");
    if (url && url.startsWith("http")) {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const triggerImagePicker = () => fileInputRef.current?.click();

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    setImageUploading(true);
    try {
      const res = await portalApi.upload("/posts/upload-image", file);
      const url = res.data?.url;
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert(err.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
      {/* 서식 툴바 */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2,
        padding: "6px 10px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
      }}>
        <ToolButton title="굵게" active={isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolButton>
        <ToolButton title="기울임" active={isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolButton>
        <ToolButton title="밑줄" active={isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton title="취소선" active={isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolButton>

        <span style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <select
          value={
            isActive("heading", { level: 2 }) ? "h2"
            : isActive("heading", { level: 3 }) ? "h3"
            : isActive("heading", { level: 4 }) ? "h4"
            : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor?.chain().focus().setParagraph().run();
            else editor?.chain().focus().toggleHeading({ level: Number(v.slice(1)) }).run();
          }}
          style={{
            height: 30, padding: "0 6px", fontSize: 12.5,
            border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", color: "#374151",
          }}
          aria-label="단락 종류"
        >
          <option value="p">본문</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
          <option value="h4">제목 4</option>
        </select>

        <span style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <ToolButton title="글머리 기호 목록" active={isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolButton>
        <ToolButton title="번호 매기기 목록" active={isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton title="인용구" active={isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolButton>
        <ToolButton title="구분선" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolButton>

        <span style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <ToolButton title="왼쪽 정렬" active={isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton title="가운데 정렬" active={isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton title="오른쪽 정렬" active={isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={16} />
        </ToolButton>

        <span style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />

        <ToolButton title="링크" active={isActive("link")} onClick={insertLink}>
          <Link2 size={16} />
        </ToolButton>
        <ToolButton title="이미지 삽입" onClick={triggerImagePicker} disabled={imageUploading}>
          <ImageIcon size={16} />
        </ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageFileChange}
        />
        {imageUploading && (
          <span style={{ fontSize: 11.5, color: "#94a3b8", marginLeft: 4 }}>이미지 업로드 중...</span>
        )}
      </div>

      {/* 본문 캔버스 */}
      <div
        onClick={() => editor?.chain().focus().run()}
        style={{ background: "#ffffff", padding: "14px 16px", minHeight: 240, maxHeight: 480, overflowY: "auto", cursor: "text" }}
      >
        <EditorContent editor={editor} className="portal-rich-text-editor" />
      </div>

      <style>{`
        .portal-rich-text-editor .ProseMirror {
          outline: none;
          font-size: 14.5px;
          line-height: 1.7;
          color: #334155;
        }
        .portal-rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .portal-rich-text-editor .ProseMirror img {
          max-width: 100%;
          border-radius: 6px;
        }
        .portal-rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1;
          margin: 0;
          padding-left: 14px;
          color: #64748b;
        }
        .portal-rich-text-editor .ProseMirror a {
          color: #6d28d9;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
