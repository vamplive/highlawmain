/**
 * 게시판 리치 에디터 — TipTap 기반
 * 기능: 서식(굵기/기울기/밑줄/취소선), 제목, 목록, 링크, 이미지 삽입, 표, 특수문자, 첨부파일
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { useRef, useState, useEffect, useCallback } from "react";
import { portalApi } from "../utils/api";

// ── 특수문자 목록 (한컴오피스 스타일)
const SPECIAL_CHARS = [
  "©","®","™","°","±","×","÷","∞","√","∑","∫","∂",
  "α","β","γ","δ","ε","θ","λ","μ","π","σ","φ","ω",
  "←","→","↑","↓","↔","⇒","⇐","⇔","↩","↪",
  "■","□","●","○","◆","◇","▲","△","▶","▷","★","☆",
  "①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩",
  "Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ",
  "㎡","㎢","㎞","㎝","㎜","㎏","㎎","㎖","㎕",
  "′","″","§","¶","†","‡","※","¡","¿","·",
];

const FONT_SIZES = ["10","11","12","13","14","16","18","20","24","28","32","36","48"];

const COLORS = [
  "#000000","#333333","#666666","#999999","#cccccc","#ffffff",
  "#ff0000","#ff6600","#ffcc00","#33cc33","#0066ff","#9933ff",
  "#cc0000","#cc5200","#cc9900","#006600","#003399","#660066",
];

function ToolBtn({ active, title, onClick, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "3px 7px", fontSize: 13, lineHeight: 1.4,
        border: "1px solid transparent", borderRadius: 3, cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#dbeafe" : "transparent",
        color: active ? "#1d4ed8" : "#374151",
        fontWeight: active ? 700 : 400,
        transition: "all 0.1s",
        minWidth: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = "#f1f5f9"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "#dbeafe" : "transparent"; }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 3px", flexShrink: 0 }} />;
}

export default function BoardRichEditor({ value, onChange, placeholder = "내용을 작성해 주세요...", attachments = [], onAttachmentsChange }) {
  const imageInputRef = useRef(null);
  const attachInputRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [fontSize, setFontSize] = useState("14");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: false }),
      Underline,
      HorizontalRule,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    editorProps: {
      attributes: {
        style: "min-height:220px;padding:14px 16px;outline:none;font-size:14px;line-height:1.7;",
      },
    },
  });

  // value 외부 변경 시 동기화 (열기/수정 모드)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  // 폰트 크기 적용 (TextStyle + 인라인 CSS)
  const applyFontSize = (sz) => {
    setFontSize(sz);
    editor?.chain().focus().setMark("textStyle", { style: `font-size:${sz}pt` }).run();
  };

  // 이미지 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await portalApi.post("/board/upload-image", form);
      const url = res.data?.url;
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  // 첨부파일 업로드
  const handleAttachUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await portalApi.post("/board/upload-attachments", form);
      const uploaded = res.data?.files || [];
      onAttachmentsChange?.([...attachments, ...uploaded]);
    } catch {
      alert("첨부파일 업로드에 실패했습니다.");
    } finally {
      setAttachUploading(false);
      e.target.value = "";
    }
  };

  const insertLink = () => {
    const url = window.prompt("링크 URL을 입력하세요", "https://");
    if (!url || !editor) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  const hasTable = editor.isActive("table");

  return (
    <div style={{ border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      {/* 툴바 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px",
        borderBottom: "1px solid #e2e8f0", background: "#f8fafc", alignItems: "center",
      }}>
        {/* 제목 */}
        <select
          value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
          onChange={(e) => {
            if (e.target.value === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: parseInt(e.target.value.replace("h", "")) }).run();
          }}
          style={{ height: 26, fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 3, padding: "0 4px", background: "#fff", cursor: "pointer" }}
        >
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
        </select>

        {/* 폰트 크기 */}
        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          style={{ height: 26, fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 3, padding: "0 4px", background: "#fff", cursor: "pointer" }}
        >
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}pt</option>)}
        </select>

        <Separator />

        {/* 굵기/기울기/밑줄/취소선 */}
        <ToolBtn active={editor.isActive("bold")} title="굵게 (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
        <ToolBtn active={editor.isActive("italic")} title="기울기 (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
        <ToolBtn active={editor.isActive("underline")} title="밑줄 (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolBtn>
        <ToolBtn active={editor.isActive("strike")} title="취소선" onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolBtn>
        <ToolBtn active={editor.isActive("subscript")} title="아래첨자" onClick={() => editor.chain().focus().toggleSubscript().run()}>x₂</ToolBtn>
        <ToolBtn active={editor.isActive("superscript")} title="위첨자" onClick={() => editor.chain().focus().toggleSuperscript().run()}>x²</ToolBtn>

        <Separator />

        {/* 정렬 */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬" onClick={() => editor.chain().focus().setTextAlign("left").run()}>≡</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} title="가운데 정렬" onClick={() => editor.chain().focus().setTextAlign("center").run()}>≣</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} title="오른쪽 정렬" onClick={() => editor.chain().focus().setTextAlign("right").run()}>≡</ToolBtn>

        <Separator />

        {/* 목록 */}
        <ToolBtn active={editor.isActive("bulletList")} title="글머리 목록" onClick={() => editor.chain().focus().toggleBulletList().run()}>• ≡</ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} title="번호 목록" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. ≡</ToolBtn>
        <ToolBtn active={editor.isActive("taskList")} title="체크리스트" onClick={() => editor.chain().focus().toggleTaskList().run()}>☑</ToolBtn>

        <Separator />

        {/* 링크 */}
        <ToolBtn active={editor.isActive("link")} title="링크 삽입" onClick={insertLink}>🔗</ToolBtn>

        {/* 이미지 */}
        <ToolBtn title="이미지 삽입" disabled={imageUploading} onClick={() => imageInputRef.current?.click()}>
          {imageUploading ? "⏳" : "🖼"}
        </ToolBtn>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

        <Separator />

        {/* 표 삽입 */}
        <div style={{ position: "relative" }}>
          <ToolBtn active={showTableMenu} title="표 삽입/편집" onClick={() => setShowTableMenu(!showTableMenu)}>⊞</ToolBtn>
          {showTableMenu && (
            <div style={{
              position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: 8, minWidth: 160,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginTop: 2,
            }}
              onMouseLeave={() => setShowTableMenu(false)}
            >
              {!hasTable ? (
                <button type="button" onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowTableMenu(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}>
                  3×3 표 삽입
                </button>
              ) : (
                <>
                  {[
                    ["행 앞에 추가", () => editor.chain().focus().addRowBefore().run()],
                    ["행 뒤에 추가", () => editor.chain().focus().addRowAfter().run()],
                    ["열 앞에 추가", () => editor.chain().focus().addColumnBefore().run()],
                    ["열 뒤에 추가", () => editor.chain().focus().addColumnAfter().run()],
                    ["행 삭제", () => editor.chain().focus().deleteRow().run()],
                    ["열 삭제", () => editor.chain().focus().deleteColumn().run()],
                    ["표 삭제", () => editor.chain().focus().deleteTable().run()],
                  ].map(([label, fn]) => (
                    <button key={label} type="button" onClick={() => { fn(); setShowTableMenu(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 8px", fontSize: 12, border: "none", background: "none", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <ToolBtn title="수평선 삽입" onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</ToolBtn>

        <Separator />

        {/* 글자색 */}
        <div style={{ position: "relative" }}>
          <ToolBtn active={showColorPicker} title="글자 색상" onClick={() => { setShowColorPicker(!showColorPicker); setShowSpecialChars(false); }}>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>A</span>
              <span style={{ width: 16, height: 3, background: "#ff0000", borderRadius: 1, marginTop: 1 }} />
            </span>
          </ToolBtn>
          {showColorPicker && (
            <div style={{
              position: "absolute", top: "100%", left: 0, zIndex: 50,
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6,
              padding: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginTop: 2,
              display: "grid", gridTemplateColumns: "repeat(6, 20px)", gap: 3,
            }}
              onMouseLeave={() => setShowColorPicker(false)}
            >
              {COLORS.map((c) => (
                <button key={c} type="button" title={c}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                  style={{ width: 20, height: 20, borderRadius: 3, background: c, border: "1px solid #e2e8f0", cursor: "pointer", padding: 0 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 형광펜 */}
        <ToolBtn active={editor.isActive("highlight")} title="형광펜" onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde047" }).run()}>
          <span style={{ background: "#fde047", padding: "0 3px", borderRadius: 2, fontSize: 12 }}>H</span>
        </ToolBtn>

        <Separator />

        {/* 특수문자 */}
        <div style={{ position: "relative" }}>
          <ToolBtn active={showSpecialChars} title="특수문자 입력" onClick={() => { setShowSpecialChars(!showSpecialChars); setShowColorPicker(false); }}>Ω</ToolBtn>
          {showSpecialChars && (
            <div style={{
              position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginTop: 2,
              display: "grid", gridTemplateColumns: "repeat(10, 26px)", gap: 2,
            }}
              onMouseLeave={() => setShowSpecialChars(false)}
            >
              {SPECIAL_CHARS.map((ch) => (
                <button key={ch} type="button" title={ch}
                  onClick={() => { editor.chain().focus().insertContent(ch).run(); }}
                  style={{ width: 26, height: 26, fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 3, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* 되돌리기 / 다시하기 */}
        <ToolBtn title="실행 취소 (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>↩</ToolBtn>
        <ToolBtn title="다시 실행 (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↪</ToolBtn>

        {/* 첨부파일 */}
        <Separator />
        <ToolBtn title="파일 첨부 (HWP, DOCX, PDF 등)" disabled={attachUploading} onClick={() => attachInputRef.current?.click()}>
          {attachUploading ? "⏳" : "📎"}
        </ToolBtn>
        <input ref={attachInputRef} type="file" multiple accept=".hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.csv,.zip,image/*" style={{ display: "none" }} onChange={handleAttachUpload} />
      </div>

      {/* 에디터 본문 */}
      <div style={{ position: "relative" }}>
        <EditorContent editor={editor} />
        {(!editor.getText().trim()) && (
          <div style={{ position: "absolute", top: 14, left: 16, color: "#9ca3af", fontSize: 14, pointerEvents: "none", userSelect: "none" }}>
            {placeholder}
          </div>
        )}
      </div>

      {/* 첨부파일 목록 */}
      {attachments.length > 0 && (
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "10px 14px", background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>첨부파일 ({attachments.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {attachments.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                <span>📄</span>
                <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</a>
                <span style={{ color: "#9ca3af", flexShrink: 0 }}>{f.size ? `${(f.size / 1024).toFixed(1)}KB` : ""}</span>
                <button type="button" onClick={() => onAttachmentsChange?.(attachments.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TipTap 기본 스타일 */}
      <style>{`
        .tiptap-board { min-height: 220px; padding: 14px 16px; outline: none; font-size: 14px; line-height: 1.7; }
        .tiptap-board h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
        .tiptap-board h2 { font-size: 20px; font-weight: 700; margin: 14px 0 6px; }
        .tiptap-board h3 { font-size: 16px; font-weight: 700; margin: 12px 0 4px; }
        .tiptap-board ul { padding-left: 24px; list-style: disc; }
        .tiptap-board ol { padding-left: 24px; list-style: decimal; }
        .tiptap-board li { margin: 3px 0; }
        .tiptap-board blockquote { border-left: 3px solid #cbd5e1; padding-left: 14px; color: #64748b; margin: 10px 0; }
        .tiptap-board code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 13px; }
        .tiptap-board pre { background: #1e293b; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; overflow: auto; font-family: monospace; font-size: 13px; margin: 10px 0; }
        .tiptap-board table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .tiptap-board th, .tiptap-board td { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .tiptap-board th { background: #f8fafc; font-weight: 700; }
        .tiptap-board img { max-width: 100%; height: auto; border-radius: 4px; margin: 6px 0; }
        .tiptap-board hr { border: none; border-top: 2px solid #e2e8f0; margin: 16px 0; }
        .tiptap-board a { color: #2563eb; text-decoration: underline; }
        .tiptap-board ul[data-type="taskList"] { list-style: none; padding-left: 4px; }
        .tiptap-board ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; }
        .tiptap-board ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 3px; }
        .tiptap-board .ProseMirror-selectednode { outline: 2px solid #3b82f6; }
      `}</style>
    </div>
  );
}
