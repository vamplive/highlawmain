/**
 * 게시판 리치 에디터 — 블로그 에디터(BlogSimpleShell) 스타일 Word-like UI
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
import { useRef, useState, useEffect } from "react";
import { portalApi } from "../utils/api";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Image as ImageIcon, Table2, Minus,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Undo2, Redo2, Paperclip, Type, Highlighter, Sigma,
  CheckSquare, ChevronDown,
} from "lucide-react";

const FONT_FAMILIES = [
  { value: "'맑은 고딕', sans-serif", label: "맑은 고딕" },
  { value: "'나눔고딕', sans-serif", label: "나눔고딕" },
  { value: "'나눔명조', serif", label: "나눔명조" },
  { value: "'Noto Sans KR', sans-serif", label: "Noto Sans KR" },
  { value: "'Arial', sans-serif", label: "Arial" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

const FONT_SIZES = ["9","10","11","12","13","14","16","18","20","24","28","32","36","48"];

const COLORS = [
  "#000000","#333333","#555555","#888888","#aaaaaa","#ffffff",
  "#c0392b","#e67e22","#f1c40f","#27ae60","#2980b9","#8e44ad",
  "#e74c3c","#f39c12","#2ecc71","#3498db","#9b59b6","#1abc9c",
];

const SPECIAL_CHARS = [
  "©","®","™","°","±","×","÷","∞","√","∑","∫",
  "α","β","γ","δ","π","σ","φ","ω","θ","λ","μ",
  "←","→","↑","↓","↔","⇒","⇐","⇔",
  "■","□","●","○","◆","★","☆","▲","▶",
  "①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩",
  "Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","㎡","㎞","㎝","§","¶","※",
];

// ── 툴바 버튼
function Btn({ active, title, onClick, disabled, children, style }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 4, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#dbeafe" : "transparent",
        color: active ? "#1d4ed8" : "#374151",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s",
        padding: 0, flexShrink: 0,
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.background = "#f1f5f9"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "#dbeafe" : "transparent"; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 2px", flexShrink: 0 }} />;
}

function ToolbarSelect({ value, onChange, children, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        height: 28, padding: "0 6px", fontSize: 12.5,
        border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff",
        cursor: "pointer", color: "#374151", flexShrink: 0, ...style,
      }}
    >
      {children}
    </select>
  );
}

export default function BoardRichEditor({
  value, onChange, placeholder = "내용을 작성해 주세요...",
  attachments = [], onAttachmentsChange,
}) {
  const imageInputRef = useRef(null);
  const attachInputRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);

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
      attributes: { class: "board-rich-editor-content" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  const applyFontSize = (sz) => {
    setFontSize(sz);
    editor?.chain().focus().setMark("textStyle", { style: `font-size:${sz}pt` }).run();
  };

  const applyFontFamily = (ff) => {
    setFontFamily(ff);
    editor?.chain().focus().setMark("textStyle", { style: `font-family:${ff}` }).run();
  };

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
    } catch { alert("이미지 업로드에 실패했습니다."); }
    finally { setImageUploading(false); e.target.value = ""; }
  };

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
    } catch { alert("첨부파일 업로드에 실패했습니다."); }
    finally { setAttachUploading(false); e.target.value = ""; }
  };

  const insertLink = () => {
    const url = window.prompt("링크 URL을 입력하세요", "https://");
    if (!url || !editor) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  const hasTable = editor.isActive("table");
  const getStyle = () => editor.isActive("heading", { level: 1 }) ? "h1"
    : editor.isActive("heading", { level: 2 }) ? "h2"
    : editor.isActive("heading", { level: 3 }) ? "h3"
    : editor.isActive("heading", { level: 4 }) ? "h4"
    : "p";

  return (
    <div style={{ border: "1px solid #d1d5db", borderRadius: 8, overflow: "visible", background: "#f3f4f6" }}>

      {/* ── 삽입 툴바 (1행) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "5px 10px",
        borderBottom: "1px solid #e5e7eb", background: "#fff", flexWrap: "wrap",
      }}>
        {/* 삽입 버튼들 */}
        <Btn title="사진 삽입" disabled={imageUploading} onClick={() => imageInputRef.current?.click()} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          <ImageIcon size={14} /> {imageUploading ? "업로드 중…" : "사진"}
        </Btn>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

        <Sep />

        <Btn title="인용구" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          인용구
        </Btn>

        <Btn title="구분선 삽입" onClick={() => editor.chain().focus().setHorizontalRule().run()} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          <Minus size={14} /> 구분선
        </Btn>

        <Btn title="링크 삽입" onClick={insertLink} active={editor.isActive("link")} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          <Link2 size={14} /> 링크
        </Btn>

        <Sep />

        {/* 표 */}
        <div style={{ position: "relative" }}>
          <Btn title="표 삽입/편집" active={showTableMenu || editor.isActive("table")} onClick={() => setShowTableMenu(!showTableMenu)} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
            <Table2 size={14} /> 표 <ChevronDown size={11} />
          </Btn>
          {showTableMenu && (
            <div style={{
              position: "absolute", top: "110%", left: 0, zIndex: 200, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 150,
            }}>
              {!hasTable ? (
                <>
                  {[[3,3],[4,4],[5,5],[3,5]].map(([r,c]) => (
                    <button key={`${r}x${c}`} type="button"
                      onClick={() => { editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run(); setShowTableMenu(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>
                      {r}×{c} 표 삽입
                    </button>
                  ))}
                </>
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
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer" }}>
                      {label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <Btn title="체크리스트" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          <CheckSquare size={14} /> 체크리스트
        </Btn>

        <Sep />

        {/* 특수문자 */}
        <div style={{ position: "relative" }}>
          <Btn title="특수문자 입력" active={showSpecialChars} onClick={() => { setShowSpecialChars(!showSpecialChars); setShowColorPicker(false); setShowHighlightPicker(false); }} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
            <Sigma size={14} /> 문자표
          </Btn>
          {showSpecialChars && (
            <div style={{
              position: "absolute", top: "110%", left: 0, zIndex: 200, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 2,
              display: "grid", gridTemplateColumns: "repeat(11, 28px)", gap: 2, width: 340,
            }}>
              {SPECIAL_CHARS.map((ch) => (
                <button key={ch} type="button" title={ch}
                  onClick={() => editor.chain().focus().insertContent(ch).run()}
                  style={{ width: 28, height: 28, fontSize: 13.5, border: "1px solid #e2e8f0", borderRadius: 3, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ch}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* 파일 첨부 */}
        <Btn title="파일 첨부 (HWP, DOCX, PDF 등)" disabled={attachUploading} onClick={() => attachInputRef.current?.click()} style={{ width: "auto", padding: "0 8px", gap: 4, fontSize: 12, fontWeight: 500 }}>
          <Paperclip size={14} /> {attachUploading ? "업로드 중…" : "파일첨부"}
        </Btn>
        <input ref={attachInputRef} type="file" multiple accept=".hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.csv,.zip,image/*" style={{ display: "none" }} onChange={handleAttachUpload} />

        <div style={{ flex: 1 }} />

        {/* 되돌리기 */}
        <Btn title="실행 취소 (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={14} /></Btn>
        <Btn title="다시 실행 (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={14} /></Btn>
      </div>

      {/* ── 서식 툴바 (2행) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "4px 10px",
        borderBottom: "1px solid #e5e7eb", background: "#fafafa", flexWrap: "wrap",
      }}>
        {/* 스타일 */}
        <ToolbarSelect value={getStyle()} onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().setHeading({ level: parseInt(v.replace("h", "")) }).run();
        }} style={{ width: 72 }}>
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
          <option value="h4">제목 4</option>
        </ToolbarSelect>

        {/* 폰트 패밀리 */}
        <ToolbarSelect value={fontFamily} onChange={(e) => applyFontFamily(e.target.value)} style={{ width: 110 }}>
          {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </ToolbarSelect>

        {/* 폰트 크기 */}
        <ToolbarSelect value={fontSize} onChange={(e) => applyFontSize(e.target.value)} style={{ width: 54 }}>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </ToolbarSelect>

        <Sep />

        {/* 기본 서식 */}
        <Btn active={editor.isActive("bold")} title="굵게 (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></Btn>
        <Btn active={editor.isActive("italic")} title="기울기 (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></Btn>
        <Btn active={editor.isActive("underline")} title="밑줄 (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></Btn>
        <Btn active={editor.isActive("strike")} title="취소선" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></Btn>

        <Sep />

        {/* 글자색 */}
        <div style={{ position: "relative" }}>
          <Btn active={showColorPicker} title="글자 색상" onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowSpecialChars(false); }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <Type size={13} />
              <div style={{ width: 14, height: 3, background: "#e74c3c", borderRadius: 1 }} />
            </div>
          </Btn>
          {showColorPicker && (
            <div style={{
              position: "absolute", top: "110%", left: 0, zIndex: 200, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 2,
              display: "grid", gridTemplateColumns: "repeat(6, 22px)", gap: 3,
            }}>
              {COLORS.map((c) => (
                <button key={c} type="button" title={c}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                  style={{ width: 22, height: 22, borderRadius: 3, background: c, border: c === "#ffffff" ? "1px solid #d1d5db" : "none", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          )}
        </div>

        {/* 형광펜 */}
        <div style={{ position: "relative" }}>
          <Btn active={showHighlightPicker || editor.isActive("highlight")} title="형광펜" onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowSpecialChars(false); }}>
            <Highlighter size={14} />
          </Btn>
          {showHighlightPicker && (
            <div style={{
              position: "absolute", top: "110%", left: 0, zIndex: 200, background: "#fff",
              border: "1px solid #e2e8f0", borderRadius: 6, padding: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 2,
              display: "grid", gridTemplateColumns: "repeat(6, 22px)", gap: 3,
            }}>
              {["#fef08a","#fed7aa","#fde2e8","#dcfce7","#dbeafe","#f3e8ff","#ffffff","#374151"].map((c) => (
                <button key={c} type="button" title={c}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }}
                  style={{ width: 22, height: 22, borderRadius: 3, background: c, border: "1px solid #d1d5db", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* 정렬 */}
        <Btn active={editor.isActive({ textAlign: "left" })} title="왼쪽" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} title="가운데" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></Btn>
        <Btn active={editor.isActive({ textAlign: "right" })} title="오른쪽" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></Btn>
        <Btn active={editor.isActive({ textAlign: "justify" })} title="양쪽" onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={14} /></Btn>

        <Sep />

        {/* 목록 */}
        <Btn active={editor.isActive("bulletList")} title="글머리 목록" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></Btn>
        <Btn active={editor.isActive("orderedList")} title="번호 목록" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></Btn>

        {/* 들여쓰기 */}
        <Btn title="들여쓰기 늘리기" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}>
          <span style={{ fontSize: 14 }}>→|</span>
        </Btn>
        <Btn title="들여쓰기 줄이기" onClick={() => editor.chain().focus().liftListItem("listItem").run()}>
          <span style={{ fontSize: 14 }}>|←</span>
        </Btn>

        <Sep />

        {/* 위/아래 첨자 */}
        <Btn active={editor.isActive("superscript")} title="위첨자" onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon size={14} /></Btn>
        <Btn active={editor.isActive("subscript")} title="아래첨자" onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon size={14} /></Btn>
      </div>

      {/* ── 편집 영역: 문서 페이지 스타일 */}
      <div style={{ background: "#e5e7eb", padding: "24px 32px", minHeight: 400, position: "relative" }}>
        <div style={{
          background: "#fff",
          maxWidth: 860, margin: "0 auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          borderRadius: 2,
          minHeight: 420,
          position: "relative",
        }}>
          <EditorContent editor={editor} />
          {!editor.getText().trim() && (
            <div style={{
              position: "absolute", top: 20, left: 24,
              color: "#9ca3af", fontSize: 14, pointerEvents: "none", userSelect: "none",
            }}>
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {/* ── 첨부파일 목록 */}
      {attachments.length > 0 && (
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "10px 14px", background: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>첨부파일 ({attachments.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {attachments.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                <Paperclip size={12} style={{ color: "#64748b" }} />
                <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</a>
                <span style={{ color: "#9ca3af", flexShrink: 0 }}>{f.size ? `${(f.size / 1024).toFixed(1)}KB` : ""}</span>
                <button type="button" onClick={() => onAttachmentsChange?.(attachments.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .board-rich-editor-content { outline: none; padding: 20px 24px; min-height: 400px; font-size: 14px; line-height: 1.8; font-family: '맑은 고딕', sans-serif; }
        .board-rich-editor-content h1 { font-size: 26px; font-weight: 700; margin: 18px 0 8px; line-height: 1.3; }
        .board-rich-editor-content h2 { font-size: 20px; font-weight: 700; margin: 16px 0 6px; line-height: 1.4; }
        .board-rich-editor-content h3 { font-size: 16px; font-weight: 700; margin: 14px 0 5px; }
        .board-rich-editor-content h4 { font-size: 14px; font-weight: 700; margin: 12px 0 4px; }
        .board-rich-editor-content p { margin: 0 0 6px; }
        .board-rich-editor-content ul { padding-left: 24px; list-style: disc; margin: 6px 0; }
        .board-rich-editor-content ol { padding-left: 24px; list-style: decimal; margin: 6px 0; }
        .board-rich-editor-content li { margin: 2px 0; }
        .board-rich-editor-content blockquote { border-left: 3px solid #cbd5e1; padding: 4px 14px; color: #64748b; margin: 10px 0; background: #f8fafc; }
        .board-rich-editor-content code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 13px; }
        .board-rich-editor-content pre { background: #1e293b; color: #e2e8f0; padding: 14px 16px; border-radius: 6px; overflow: auto; font-family: monospace; font-size: 13px; margin: 10px 0; }
        .board-rich-editor-content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .board-rich-editor-content th, .board-rich-editor-content td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 13px; }
        .board-rich-editor-content th { background: #f8fafc; font-weight: 600; }
        .board-rich-editor-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 6px 0; display: block; }
        .board-rich-editor-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .board-rich-editor-content a { color: #2563eb; text-decoration: underline; }
        .board-rich-editor-content ul[data-type="taskList"] { list-style: none; padding-left: 2px; }
        .board-rich-editor-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; margin: 3px 0; }
        .board-rich-editor-content ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 3px; }
        .board-rich-editor-content .ProseMirror-selectednode { outline: 2px solid #3b82f6; }
        .board-rich-editor-content .selectedCell::after { background: rgba(59,130,246,0.1); }
      `}</style>
    </div>
  );
}
