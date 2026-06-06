/**
 * BlogSimpleShell — 네이버 블로그 스타일 단순 에디터 셸
 *
 * 기존 EditorPage 의 TipTap 에디터 인스턴스(useEditorInstance) 를 그대로 재사용하면서,
 * 본 셸은 Word 스타일 리본 대신 한 줄짜리 삽입 툴바 + 한 줄짜리 서식 툴바 + 큰 제목 +
 * 깨끗한 본문 캔버스 + 우측 슬라이드 메타 패널로 구성된 가벼운 레이아웃을 제공한다.
 *
 * 사용 시점: doc.documentType === "blog" 이고 운영자가 Word 모드로 강제 전환하지 않은 경우.
 * 고급 편집(여백/단/머리글바닥글/변경추적/각주/표 속성 다이얼로그 등)이 필요하면 상단 우측의
 * "Word 스타일" 버튼으로 기존 EditorShell 로 폴백한다.
 */
import { useState, useRef } from "react";
import LogoCanvas from "../../../components/layout/LogoCanvas";
import { EditorContent } from "@tiptap/react";
import {
  Save, Eye, Send, MoreVertical,
  Image as ImageIcon, Quote, Minus, Link2, Calendar, Code, Table as TableIcon, Sigma, Sparkles,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Superscript, Subscript,
  X, ChevronRight, Bot,
} from "lucide-react";
import BlogCoverImagePicker from "./BlogCoverImagePicker";
import BlogAutoIllustrateDialog from "./BlogAutoIllustrateDialog";
import BlogAutoWriteDialog from "./BlogAutoWriteDialog";
import { BLOG_CATEGORIES } from "./constants";
import { deriveBlogPublishMetadata, isValidFutureSchedule } from "./blogPublishingUtils";

const FONT_FAMILIES = [
  { label: "맑은 고딕", value: "맑은 고딕, Malgun Gothic, sans-serif" },
  { label: "나눔고딕", value: "Nanum Gothic, sans-serif" },
  { label: "본명조", value: "Nanum Myeongjo, serif" },
  { label: "Noto Sans KR", value: "Noto Sans KR, sans-serif" },
  { label: "Pretendard", value: "Pretendard, sans-serif" },
];
const FONT_SIZES = [11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40];

/* 작은 색상 팔레트 — 네이버처럼 빠른 선택 */
const TEXT_COLORS = ["#111827", "#374151", "#6b7280", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHT_COLORS = ["transparent", "#fef9c3", "#fee2e2", "#dcfce7", "#dbeafe", "#fce7f3", "#e9d5ff"];

const toolbarBtnStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 36, height: 36, padding: 0, border: "none", background: "transparent",
  cursor: "pointer", color: "#374151", borderRadius: 6,
};

const toolbarBtnActiveStyle = {
  ...toolbarBtnStyle, background: "#e0e7ff", color: "#1e40af",
};

const insertItemStyle = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  padding: "10px 14px", border: "none", background: "transparent",
  cursor: "pointer", color: "#374151", borderRadius: 8,
  fontSize: 12, fontFamily: "inherit", minWidth: 64,
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

function InsertButton({ icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
      disabled={disabled}
      title={label}
      style={{ ...insertItemStyle, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f3f4f6"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}>
        {icon}
      </span>
      <span style={{ fontSize: 11, lineHeight: 1, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

/* ── 색상 드롭다운 ── */
function ColorPopover({ open, onClose, colors, onPick, label }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label={label}
      style={{
        position: "absolute", top: "100%", left: 0, marginTop: 4,
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)", padding: 8,
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, zIndex: 100,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => { onPick(c); onClose(); }}
          style={{
            width: 24, height: 24, borderRadius: 4,
            border: c === "transparent" ? "1px dashed #d1d5db" : "1px solid #e5e7eb",
            background: c === "transparent" ? "#fff" : c, cursor: "pointer", padding: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function BlogSimpleShell({
  editor,
  doc, setDoc,
  saveStatus,
  handleSave,
  handlePublishBlog,
  isPublishing,
  setShowBackstage,
  onSwitchToWordMode,
}) {
  const [metaOpen, setMetaOpen] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [autoIllustrateOpen, setAutoIllustrateOpen] = useState(false);
  const [autoWriteOpen, setAutoWriteOpen] = useState(false);
  const fileInputRef = useRef(null);

  const isScheduled = doc.status === "scheduled";
  const scheduleReady = !isScheduled || isValidFutureSchedule(doc.scheduledPublishAt);
  const update = (patch) => setDoc((d) => ({ ...d, ...patch }));

  const editorHtml = editor?.getHTML?.() || "";

  /* 저장 상태 텍스트 단순화 — 한 글자 마크 + 색 */
  const statusKey = typeof saveStatus === "object" ? saveStatus?.status || "" : saveStatus || "";
  const statusColor = statusKey === "저장됨" ? "#16a34a"
    : statusKey === "발행됨" ? "#2563eb"
    : statusKey === "수정됨" ? "#ca8a04"
    : statusKey === "오류" || String(statusKey).startsWith("오류") ? "#dc2626"
    : "#9ca3af";

  /* ── 삽입 핸들러 ── */
  const insertImage = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "blog");
    const csrf = (document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/) || [])[1];
    const headers = csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {};
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST", credentials: "include", headers, body: formData,
      });
      const json = await res.json();
      if (json?.data?.url) {
        editor.chain().focus().setImage({ src: json.data.url, alt: file.name }).run();
      }
    } catch { /* ignore */ }
  };

  const insertQuote = () => editor?.chain().focus().toggleBlockquote().run();
  const insertDivider = () => editor?.chain().focus().setHorizontalRule().run();
  const insertLink = () => {
    const url = window.prompt("링크 URL을 입력하세요", "https://");
    if (url && url.startsWith("http")) editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const insertCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const insertTable = () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  /* ── 서식 헬퍼 ── */
  const isActive = (name, attrs) => {
    try { return editor?.isActive(name, attrs) ?? false; } catch { return false; }
  };
  const setHeading = (level) => editor?.chain().focus().toggleHeading({ level }).run();
  const setParagraph = () => editor?.chain().focus().setParagraph().run();
  const currentParagraphLabel =
    isActive("heading", { level: 1 }) ? "제목 1"
    : isActive("heading", { level: 2 }) ? "제목 2"
    : isActive("heading", { level: 3 }) ? "제목 3"
    : "본문";

  return (
    <div style={{
      display: "flex", flexDirection: "column", flex: 1,
      background: "#fff", height: "100%", overflow: "hidden",
      fontFamily: "'Pretendard', '맑은 고딕', sans-serif",
    }}>
      {/* ═══ 1) 슬림 상단바 ═══ */}
      <div style={{
        display: "flex", alignItems: "center", padding: "10px 18px",
        borderBottom: "1px solid #f1f5f9", flexShrink: 0, gap: 12,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 18, fontWeight: 700, color: "#1a3a6b",
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8, background: "rgba(26,58,107,0.08)",
            border: "1px solid rgba(26,58,107,0.15)", padding: 5,
          }}>
            <LogoCanvas size={20} color="#1a3a6b" />
          </span>
          <span>blog</span>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: statusColor, fontWeight: 500 }}>
          저장 · {statusKey || "—"}
        </span>
        <button
          type="button"
          onClick={() => handleSave?.(false)}
          style={{
            height: 36, padding: "0 14px", fontSize: 13,
            border: "1px solid #e5e7eb", borderRadius: 6,
            background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 500,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          <Save size={14} /> 저장
        </button>
        <button
          type="button"
          onClick={() => setShowBackstage?.(true)}
          style={{
            height: 36, padding: "0 14px", fontSize: 13,
            border: "1px solid #e5e7eb", borderRadius: 6,
            background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 500,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
          title="실제 게시 화면 미리보기"
        >
          <Eye size={14} /> 미리보기
        </button>
        <button
          type="button"
          onClick={handlePublishBlog}
          disabled={isPublishing || !scheduleReady}
          style={{
            height: 36, padding: "0 18px", fontSize: 14, fontWeight: 600,
            border: "none", borderRadius: 6,
            background: isPublishing || !scheduleReady ? "#94a3b8" : "#03c75a",
            color: "#fff", cursor: isPublishing || !scheduleReady ? "default" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          <Send size={14} />
          {isPublishing ? "처리 중" : isScheduled ? "예약 발행" : "발행"}
        </button>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMoreMenuOpen((v) => !v)}
            style={{ ...toolbarBtnStyle, width: 32, height: 36 }}
            aria-label="더 보기"
          >
            <MoreVertical size={18} />
          </button>
          {moreMenuOpen && (
            <div
              style={{
                position: "absolute", right: 0, top: "100%", marginTop: 4,
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)", padding: 4,
                minWidth: 180, zIndex: 100,
              }}
              onMouseLeave={() => setMoreMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => { setMoreMenuOpen(false); onSwitchToWordMode?.(); }}
                style={{
                  width: "100%", padding: "10px 12px", border: "none",
                  background: "transparent", textAlign: "left", fontSize: 13, cursor: "pointer", borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Word 스타일로 전환
              </button>
              <button
                type="button"
                onClick={() => { setMoreMenuOpen(false); setMetaOpen((v) => !v); }}
                style={{
                  width: "100%", padding: "10px 12px", border: "none",
                  background: "transparent", textAlign: "left", fontSize: 13, cursor: "pointer", borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                메타 패널 {metaOpen ? "닫기" : "열기"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ 2) 삽입 툴바 ═══ */}
      <div style={{
        display: "flex", alignItems: "center", padding: "8px 18px",
        borderBottom: "1px solid #f1f5f9", flexShrink: 0, gap: 4,
        overflowX: "auto",
      }}>
        <InsertButton icon={<ImageIcon size={20} />} label="사진" onClick={insertImage} />
        <InsertButton icon={<Quote size={20} />} label="인용구" onClick={insertQuote} />
        <InsertButton icon={<Minus size={20} />} label="구분선" onClick={insertDivider} />
        <InsertButton icon={<Link2 size={20} />} label="링크" onClick={insertLink} />
        <InsertButton icon={<TableIcon size={20} />} label="표" onClick={insertTable} />
        <InsertButton icon={<Code size={20} />} label="코드" onClick={insertCodeBlock} />
        <InsertButton
          icon={<Bot size={20} color="#6366f1" />}
          label="AI 글쓰기"
          onClick={() => setAutoWriteOpen(true)}
        />
        <InsertButton
          icon={<Sparkles size={20} color="#1a3a6b" />}
          label="AI 일러스트"
          onClick={() => setAutoIllustrateOpen(true)}
        />
        <span style={{ flex: 1 }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* ═══ 3) 서식 툴바 ═══ */}
      <div style={{
        display: "flex", alignItems: "center", padding: "6px 18px",
        borderBottom: "1px solid #e5e7eb", flexShrink: 0, gap: 6, flexWrap: "wrap",
        background: "#fafafa",
      }}>
        {/* 단락 종류 */}
        <select
          value={
            isActive("heading", { level: 1 }) ? "h1"
            : isActive("heading", { level: 2 }) ? "h2"
            : isActive("heading", { level: 3 }) ? "h3"
            : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") setParagraph();
            else setHeading(Number(v.slice(1)));
          }}
          style={{
            height: 32, padding: "0 8px", fontSize: 13,
            border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
          }}
          aria-label="단락 종류"
          title={currentParagraphLabel}
        >
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
        </select>

        {/* 글꼴 */}
        <select
          onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
          defaultValue={FONT_FAMILIES[0].value}
          style={{
            height: 32, padding: "0 8px", fontSize: 13,
            border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
            minWidth: 110,
          }}
          aria-label="글꼴"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* 글꼴 크기 */}
        <select
          onChange={(e) => editor?.chain().focus().setFontSize(`${e.target.value}pt`).run()}
          defaultValue="11"
          style={{
            height: 32, padding: "0 6px", fontSize: 13,
            border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", width: 60,
          }}
          aria-label="글꼴 크기"
        >
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolButton active={isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)">
          <Bold size={16} />
        </ToolButton>
        <ToolButton active={isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)">
          <Italic size={16} />
        </ToolButton>
        <ToolButton active={isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="밑줄 (Ctrl+U)">
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton active={isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} title="취소선">
          <Strikethrough size={16} />
        </ToolButton>

        {/* 글자색 */}
        <div style={{ position: "relative" }}>
          <ToolButton onClick={() => { setTextColorOpen((v) => !v); setHighlightOpen(false); }} title="글자색">
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>A</span>
              <span style={{ width: 16, height: 3, background: "#dc2626", marginTop: 1 }} />
            </span>
          </ToolButton>
          <ColorPopover
            open={textColorOpen}
            onClose={() => setTextColorOpen(false)}
            colors={TEXT_COLORS}
            onPick={(c) => editor?.chain().focus().setColor(c).run()}
            label="글자색 선택"
          />
        </div>

        {/* 형광펜 */}
        <div style={{ position: "relative" }}>
          <ToolButton onClick={() => { setHighlightOpen((v) => !v); setTextColorOpen(false); }} title="형광펜">
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 700, background: "#fef9c3", padding: "0 2px" }}>A</span>
            </span>
          </ToolButton>
          <ColorPopover
            open={highlightOpen}
            onClose={() => setHighlightOpen(false)}
            colors={HIGHLIGHT_COLORS}
            onPick={(c) => {
              if (c === "transparent") editor?.chain().focus().unsetHighlight().run();
              else editor?.chain().focus().setHighlight({ color: c }).run();
            }}
            label="형광펜 색상 선택"
          />
        </div>

        <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolButton active={isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()} title="왼쪽 정렬">
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton active={isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} title="가운데 정렬">
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton active={isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()} title="오른쪽 정렬">
          <AlignRight size={16} />
        </ToolButton>
        <ToolButton active={isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} title="양쪽 맞춤">
          <AlignJustify size={16} />
        </ToolButton>

        <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolButton active={isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="글머리 기호">
          <List size={16} />
        </ToolButton>
        <ToolButton active={isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="번호 매기기">
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton onClick={() => editor?.chain().focus().sinkListItem("listItem").run()} title="들여쓰기">
          <Indent size={16} />
        </ToolButton>
        <ToolButton onClick={() => editor?.chain().focus().liftListItem("listItem").run()} title="내어쓰기">
          <Outdent size={16} />
        </ToolButton>

        <div style={{ width: 1, height: 22, background: "#e5e7eb", margin: "0 4px" }} />

        <ToolButton active={isActive("superscript")} onClick={() => editor?.chain().focus().toggleSuperscript().run()} title="위 첨자">
          <Superscript size={16} />
        </ToolButton>
        <ToolButton active={isActive("subscript")} onClick={() => editor?.chain().focus().toggleSubscript().run()} title="아래 첨자">
          <Subscript size={16} />
        </ToolButton>

        <span style={{ flex: 1 }} />

        {/* 메타 패널 토글 (네이버 블로그의 "글감/내돈내산" 우측 영역과 비슷한 위치) */}
        <button
          type="button"
          onClick={() => setMetaOpen((v) => !v)}
          style={{
            height: 32, padding: "0 12px", fontSize: 12,
            border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500,
          }}
          title="블로그 메타 / SEO / 대표 이미지 패널"
        >
          {metaOpen ? <X size={14} /> : <ChevronRight size={14} />}
          {metaOpen ? "메타 닫기" : "메타 열기"}
        </button>
      </div>

      {/* ═══ 4) 본문 영역 + 우측 메타 패널 ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "32px 24px 80px" }}>
          <div style={{ width: "100%", maxWidth: 760 }}>
            {/* 제목 */}
            <input
              type="text"
              value={doc.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="제목"
              style={{
                width: "100%", border: "none", outline: "none",
                fontSize: 32, fontWeight: 700, color: "#111827",
                padding: "12px 0", borderBottom: "1px solid #e5e7eb",
                background: "transparent", marginBottom: 24,
                fontFamily: "inherit",
              }}
            />

            {/* 본문 — 기존 TipTap 인스턴스를 그대로 사용 */}
            <div className="blog-simple-editor-content" style={{ minHeight: "60vh", fontSize: 16, lineHeight: 1.85, color: "#1f2937" }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* 우측 메타 패널 */}
        {metaOpen && (
          <aside style={{
            width: 360, flexShrink: 0, borderLeft: "1px solid #e5e7eb",
            background: "#fafafa", overflowY: "auto", padding: 18,
            display: "grid", gap: 16, alignContent: "start",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 14, color: "#0f172a" }}>발행 설정</strong>
              <button type="button" onClick={() => setMetaOpen(false)} style={{ ...toolbarBtnStyle, width: 28, height: 28 }} title="패널 닫기">
                <X size={14} />
              </button>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>게시판</span>
              <select
                value={doc.blogCategory || "construction_realestate"}
                onChange={(e) => update({ blogCategory: e.target.value, documentType: "blog" })}
                style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
              >
                {BLOG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>공개 상태</span>
              <select
                value={doc.status || "draft"}
                onChange={(e) => update({ status: e.target.value })}
                style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
              >
                <option value="draft">초안 저장</option>
                <option value="published">즉시 발행</option>
                <option value="scheduled">예약 발행</option>
              </select>
            </label>

            {isScheduled && (
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>예약 일시</span>
                <input
                  type="datetime-local"
                  value={doc.scheduledPublishAt || ""}
                  onChange={(e) => update({ scheduledPublishAt: e.target.value })}
                  style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
                />
                {!scheduleReady && <span style={{ fontSize: 11, color: "#dc2626" }}>미래 시각으로 설정해 주세요</span>}
              </label>
            )}

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>태그</span>
              <input
                type="text"
                value={doc.tags || ""}
                onChange={(e) => update({ tags: e.target.value })}
                placeholder="건설, 하자, 계약"
                style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>URL 슬러그</span>
              <input
                type="text"
                value={doc.slug || ""}
                onChange={(e) => update({ slug: e.target.value })}
                placeholder="비워두면 제목으로 자동 생성"
                style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
              />
            </label>

            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>대표 이미지</span>
              <BlogCoverImagePicker
                value={doc.thumbnailUrl || ""}
                onChange={(url) => update({
                  thumbnailUrl: url,
                  ogImageUrl: doc.ogImageUrl ? doc.ogImageUrl : url,
                })}
                docContext={{ title: doc.title }}
                getEditorHtml={() => editorHtml}
              />
            </div>

            <button
              type="button"
              onClick={() => setAutoIllustrateOpen(true)}
              style={{
                height: 36, padding: "0 12px", fontSize: 13,
                border: "1px solid #1a3a6b", borderRadius: 6,
                background: "#fff", color: "#1a3a6b", cursor: "pointer", fontWeight: 500,
                display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
              }}
              title="본문을 분석해 어울리는 이미지를 AI 로 만들어 본문에 삽입"
            >
              <Sparkles size={14} />
              AI 본문 이미지 자동 추가
            </button>

            <button
              type="button"
              onClick={() => update(deriveBlogPublishMetadata(doc, editorHtml))}
              style={{
                height: 36, padding: "0 12px", fontSize: 13,
                border: "1px solid #e5e7eb", borderRadius: 6,
                background: "#fff", color: "#374151", cursor: "pointer", fontWeight: 500,
                display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
              }}
              title="본문 기준으로 요약·SEO 설명·GEO 키워드·슬러그 자동 채움"
            >
              <Sparkles size={14} /> SEO/GEO 자동 채움
            </button>
          </aside>
        )}
      </div>

      <BlogAutoIllustrateDialog
        open={autoIllustrateOpen}
        onClose={() => setAutoIllustrateOpen(false)}
        editor={editor}
        doc={doc}
      />

      <BlogAutoWriteDialog
        open={autoWriteOpen}
        onClose={() => setAutoWriteOpen(false)}
        editor={editor}
        doc={doc}
        setDoc={setDoc}
      />

      {/* 본문 placeholder · 링크 색 등 라이트한 스타일 */}
      <style>{`
        .blog-simple-editor-content .ProseMirror {
          outline: none;
          padding: 8px 4px;
        }
        .blog-simple-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          content: "본문을 입력하세요...";
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .blog-simple-editor-content .ProseMirror h1 { font-size: 28px; margin: 24px 0 12px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror h2 { font-size: 22px; margin: 20px 0 10px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror h3 { font-size: 18px; margin: 16px 0 8px; font-weight: 700; }
        .blog-simple-editor-content .ProseMirror blockquote {
          border-left: 4px solid #1a3a6b;
          padding: 4px 16px;
          color: #475569;
          margin: 12px 0;
          background: #f8fafc;
        }
        .blog-simple-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
          margin: 12px 0;
        }
        .blog-simple-editor-content .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .blog-simple-editor-content .ProseMirror table {
          border-collapse: collapse;
          margin: 12px 0;
          width: 100%;
        }
        .blog-simple-editor-content .ProseMirror th,
        .blog-simple-editor-content .ProseMirror td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
        }
        .blog-simple-editor-content .ProseMirror th { background: #f3f4f6; font-weight: 600; }
        .blog-simple-editor-content .ProseMirror pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 12px 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .blog-simple-editor-content .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 24px 0;
        }
        @media (max-width: 768px) {
          .blog-simple-editor-content .ProseMirror { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
