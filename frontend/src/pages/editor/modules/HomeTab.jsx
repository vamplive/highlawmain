/**
 * Home Tab - 홈 리본 탭
 * 클립보드, 글꼴, 단락, 스타일, 편집 그룹을 조합하는 컨테이너
 */
import { memo } from "react";
import { Eye, FilePlus2, Newspaper, Search, Replace, MousePointerClick } from "lucide-react";
import { RibbonBtn, RibbonGroup, GroupSep, DropdownButton } from "./RibbonParts";
import { ClipboardGroup } from "./ClipboardGroup";
import { FontGroup } from "./FontGroup";
import { ParagraphGroup } from "./ParagraphGroup";
import { StyleGallery } from "./StyleGallery";

const ICON_SIZE_SMALL = 11;

export const HomeTab = memo(function HomeTab({
  editor,
  onNew,
  onNewBlog,
  onPublishBlog,
  isPublishing,
  onOpenBlogPreview,
  onShowFind,
  onShowReplace,
  onOpenFontDialog,
  onOpenParagraphDialog,
  onOpenBorderDialog,
}) {
  if (!editor) return null;

  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)",
      flexShrink: 0, minHeight: 84, padding: "0 2px", overflowX: "auto",
    }}>
      <RibbonGroup label="문서">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => onNew?.()} title="새 문서 만들기" small>
            <FilePlus2 size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>새 문서</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => onNewBlog?.()} title="블로그 작성 전용 문서 만들기" small>
            <Newspaper size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>블로그 글쓰기</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => onPublishBlog?.()} disabled={isPublishing} title="현재 문서를 블로그 게시글로 발행" small>
            <Newspaper size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>{isPublishing ? "처리 중" : "게시글 발행"}</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => onOpenBlogPreview?.()} title="실제 블로그 발행 화면 미리보기" small>
            <Eye size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>미리보기</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <GroupSep />
      <ClipboardGroup editor={editor} />
      <GroupSep />
      <FontGroup editor={editor} onOpenFontDialog={onOpenFontDialog} />
      <GroupSep />
      <ParagraphGroup editor={editor} onOpenParagraphDialog={onOpenParagraphDialog} onOpenBorderDialog={onOpenBorderDialog} />
      <GroupSep />
      <StyleGallery editor={editor} />
      <GroupSep />

      {/* 편집 그룹 — 버튼 3개뿐이므로 인라인 유지 */}
      <RibbonGroup label="편집">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => onShowFind?.()} title="찾기 (Ctrl+F)" small>
            <Search size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>찾기</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => onShowReplace?.()} title="바꾸기 (Ctrl+H)" small>
            <Replace size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>바꾸기</span>
          </RibbonBtn>
          <DropdownButton trigger={
            <RibbonBtn title="선택" small>
              <MousePointerClick size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>선택</span>
            </RibbonBtn>
          }>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); editor.commands.focus(); editor.commands.selectAll(); }}>
              모두 선택 (Ctrl+A)
            </button>
          </DropdownButton>
        </div>
      </RibbonGroup>
    </div>
  );
});
