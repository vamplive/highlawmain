/**
 * MobileToolSheet — 화면 하단에서 슬라이드 업 되는 바텀 시트
 * 자주 쓰지 않지만 모바일에서도 필요한 기능들(파일/삽입/문단/공유/문서 속성 등)을
 * 카테고리별로 묶어 4xN 그리드 형태로 노출.
 *
 * 데스크톱 리본/타이틀바의 핵심 액션을 한 화면에 정리해, 모바일에서 좁은 화면에
 * 9개 탭 + 격자 버튼을 그릴 필요 없이 시트 하나로 모든 기능에 접근할 수 있도록 한다.
 */
import { memo, useEffect } from "react";
import {
  X, Save, FilePlus2, Newspaper, Eye, Send, Settings2,
  Search, Replace, Trash2, Type, Palette,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table2, Sigma, FileImage, Quote, ListChecks,
  Strikethrough, Highlighter, Subscript, Superscript,
  Link2, FileDown, Moon, Sun, ZoomIn, ZoomOut,
  MessageSquarePlus, Indent, Outdent, Pilcrow,
} from "lucide-react";

const ICON = 18;

function ToolItem({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      className="editor-msheet-item"
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.4 : 1,
        color: danger ? "#dc2626" : undefined,
      }}
    >
      {icon}
      <span className="editor-msheet-item-label">{label}</span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="editor-msheet-section">
      <div className="editor-msheet-section-title">{title}</div>
      <div className="editor-msheet-grid">{children}</div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {object} props.editor - TipTap 인스턴스
 * @param {object} props.doc
 * @param {boolean} props.darkMode
 * @param {function} props.setDarkMode
 * @param {function} props.handleSave
 * @param {function} props.handleNew
 * @param {function} props.handleNewBlog
 * @param {function} props.handlePublishBlog
 * @param {boolean} props.isPublishing
 * @param {function} props.onOpenBlogPreview
 * @param {function} props.onOpenMeta
 * @param {function} props.onShowFind
 * @param {function} props.onShowReplace
 * @param {function} props.onOpenImage
 * @param {function} props.onOpenLink
 * @param {function} props.onOpenTable
 * @param {function} props.onOpenSymbol
 * @param {function} props.onInsertComment
 * @param {object} props.exportHandlers - { docx, pdf, html, markdown, hwpx }
 * @param {function} props.onDelete
 * @param {object} props.zoomCtl - { zoom, setZoom }
 */
export const MobileToolSheet = memo(function MobileToolSheet({
  open,
  onClose,
  editor,
  doc,
  darkMode,
  setDarkMode,
  handleSave,
  handleNew,
  handleNewBlog,
  handlePublishBlog,
  isPublishing,
  onOpenBlogPreview,
  onOpenMeta,
  onShowFind,
  onShowReplace,
  onOpenImage,
  onOpenLink,
  onOpenTable,
  onOpenSymbol,
  onInsertComment,
  exportHandlers,
  onDelete,
  zoomCtl,
}) {
  // 시트 열림 동안 body 스크롤 잠금
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  if (!editor) return null;

  const isActive = (name, attrs) => {
    try { return editor.isActive(name, attrs); } catch { return false; }
  };

  const run = (fn) => () => fn(editor.chain().focus()).run();
  const close = () => onClose?.();
  const runAndClose = (fn) => () => { fn(); close(); };

  const isBlog = doc?.documentType === "blog";

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={close} />
      <div className={`editor-msheet${darkMode ? " dark" : ""}`} role="dialog" aria-label="에디터 도구">
        <div className="editor-msheet-handle" />
        <div className="editor-msheet-header">
          <div className="editor-msheet-title">에디터 도구</div>
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            style={{
              width: 36, height: 36, border: "none", background: "transparent",
              borderRadius: 8, color: darkMode ? "#e5e7eb" : "#0f172a", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="editor-msheet-body">
          {/* ── 파일 ── */}
          <Section title="파일">
            <ToolItem
              icon={<Save size={ICON} color="#2563eb" />}
              label="저장"
              onClick={runAndClose(() => handleSave?.(false))}
            />
            <ToolItem
              icon={<FilePlus2 size={ICON} />}
              label="새 문서"
              onClick={runAndClose(() => handleNew?.())}
            />
            <ToolItem
              icon={<Newspaper size={ICON} color="#1d4ed8" />}
              label="블로그 글쓰기"
              onClick={runAndClose(() => handleNewBlog?.())}
            />
            <ToolItem
              icon={<Eye size={ICON} />}
              label="미리보기"
              onClick={runAndClose(() => onOpenBlogPreview?.())}
            />
            <ToolItem
              icon={<Send size={ICON} color="#16a34a" />}
              label={isPublishing ? "처리 중..." : (isBlog ? "발행 저장" : "게시글 발행")}
              onClick={runAndClose(() => handlePublishBlog?.())}
              disabled={isPublishing}
            />
            <ToolItem
              icon={<Settings2 size={ICON} />}
              label="문서 속성"
              onClick={runAndClose(() => onOpenMeta?.())}
            />
            {onDelete && (
              <ToolItem
                icon={<Trash2 size={ICON} />}
                label="삭제"
                onClick={runAndClose(() => onDelete?.())}
                danger
              />
            )}
          </Section>

          {/* ── 텍스트 서식 ── */}
          <Section title="텍스트 서식">
            <ToolItem
              icon={<Strikethrough size={ICON} color={isActive("strike") ? "#1d4ed8" : undefined} />}
              label="취소선"
              onClick={run((c) => c.toggleStrike())}
            />
            <ToolItem
              icon={<Highlighter size={ICON} color={isActive("highlight") ? "#1d4ed8" : undefined} />}
              label="형광펜"
              onClick={run((c) => c.toggleHighlight())}
            />
            <ToolItem
              icon={<Superscript size={ICON} />}
              label="위 첨자"
              onClick={run((c) => c.toggleSuperscript())}
            />
            <ToolItem
              icon={<Subscript size={ICON} />}
              label="아래 첨자"
              onClick={run((c) => c.toggleSubscript())}
            />
            <ToolItem
              icon={<Type size={ICON} />}
              label="글꼴 크기"
              onClick={runAndClose(() => editor.chain().focus().setFontSize?.("16pt").run())}
            />
            <ToolItem
              icon={<Palette size={ICON} color="#dc2626" />}
              label="글자색"
              onClick={run((c) => c.setColor("#dc2626"))}
            />
          </Section>

          {/* ── 단락 ── */}
          <Section title="단락">
            <ToolItem
              icon={<AlignLeft size={ICON} color={isActive({ textAlign: "left" }) ? "#1d4ed8" : undefined} />}
              label="왼쪽 정렬"
              onClick={run((c) => c.setTextAlign("left"))}
            />
            <ToolItem
              icon={<AlignCenter size={ICON} color={isActive({ textAlign: "center" }) ? "#1d4ed8" : undefined} />}
              label="가운데"
              onClick={run((c) => c.setTextAlign("center"))}
            />
            <ToolItem
              icon={<AlignRight size={ICON} color={isActive({ textAlign: "right" }) ? "#1d4ed8" : undefined} />}
              label="오른쪽"
              onClick={run((c) => c.setTextAlign("right"))}
            />
            <ToolItem
              icon={<AlignJustify size={ICON} color={isActive({ textAlign: "justify" }) ? "#1d4ed8" : undefined} />}
              label="양쪽 맞춤"
              onClick={run((c) => c.setTextAlign("justify"))}
            />
            <ToolItem
              icon={<Indent size={ICON} />}
              label="들여쓰기"
              onClick={() => editor.chain().focus().indent?.()?.run()}
            />
            <ToolItem
              icon={<Outdent size={ICON} />}
              label="내어쓰기"
              onClick={() => editor.chain().focus().outdent?.()?.run()}
            />
            <ToolItem
              icon={<Pilcrow size={ICON} />}
              label="단락 기호"
              onClick={() => editor.chain().focus().setParagraph().run()}
            />
            <ToolItem
              icon={<Quote size={ICON} />}
              label="인용"
              onClick={run((c) => c.toggleBlockquote())}
            />
          </Section>

          {/* ── 삽입 ── */}
          <Section title="삽입">
            <ToolItem
              icon={<FileImage size={ICON} />}
              label="이미지"
              onClick={runAndClose(() => onOpenImage?.())}
            />
            <ToolItem
              icon={<Link2 size={ICON} />}
              label="링크"
              onClick={runAndClose(() => onOpenLink?.())}
            />
            <ToolItem
              icon={<Table2 size={ICON} />}
              label="표"
              onClick={runAndClose(() => onOpenTable?.())}
            />
            <ToolItem
              icon={<Sigma size={ICON} />}
              label="특수문자"
              onClick={runAndClose(() => onOpenSymbol?.())}
            />
            <ToolItem
              icon={<ListChecks size={ICON} />}
              label="체크리스트"
              onClick={() => editor.chain().focus().toggleTaskList?.()?.run()}
            />
            <ToolItem
              icon={<MessageSquarePlus size={ICON} />}
              label="댓글"
              onClick={runAndClose(() => onInsertComment?.())}
            />
          </Section>

          {/* ── 검색 ── */}
          <Section title="검색·바꾸기">
            <ToolItem
              icon={<Search size={ICON} />}
              label="찾기"
              onClick={runAndClose(() => onShowFind?.())}
            />
            <ToolItem
              icon={<Replace size={ICON} />}
              label="바꾸기"
              onClick={runAndClose(() => onShowReplace?.())}
            />
          </Section>

          {/* ── 보기 ── */}
          <Section title="보기">
            <ToolItem
              icon={darkMode ? <Sun size={ICON} /> : <Moon size={ICON} />}
              label={darkMode ? "라이트 모드" : "다크 모드"}
              onClick={() => setDarkMode?.(!darkMode)}
            />
            {zoomCtl && (
              <>
                <ToolItem
                  icon={<ZoomOut size={ICON} />}
                  label={`확대 ${zoomCtl.zoom}%`}
                  onClick={() => zoomCtl.setZoom((z) => Math.max(50, z - 10))}
                />
                <ToolItem
                  icon={<ZoomIn size={ICON} />}
                  label="확대"
                  onClick={() => zoomCtl.setZoom((z) => Math.min(200, z + 10))}
                />
              </>
            )}
          </Section>

          {/* ── 내보내기 ── */}
          {exportHandlers && (
            <Section title="내보내기">
              <ToolItem
                icon={<FileDown size={ICON} />}
                label="Word(.docx)"
                onClick={runAndClose(() => exportHandlers.docx?.())}
              />
              <ToolItem
                icon={<FileDown size={ICON} />}
                label="PDF"
                onClick={runAndClose(() => exportHandlers.pdf?.())}
              />
              <ToolItem
                icon={<FileDown size={ICON} />}
                label="HTML"
                onClick={runAndClose(() => exportHandlers.html?.())}
              />
              <ToolItem
                icon={<FileDown size={ICON} />}
                label="마크다운"
                onClick={runAndClose(() => exportHandlers.markdown?.())}
              />
            </Section>
          )}
        </div>
      </div>
    </>
  );
});

export default MobileToolSheet;
