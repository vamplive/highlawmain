/**
 * EditorShell — EditorPage의 렌더 트리(프레젠테이션 레이어)
 * 사이드바·타이틀바·리본·룰러·캔버스·상태바·메타 드로어를 한 번에 조립한다.
 * 비즈니스 상태는 EditorPage가 보유하고, 여기서는 prop으로 받은 값을 배치만 함.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { AuthorSetupDialog } from "./CommentPanel";
import { editorStyles } from "./styles";
import { MetaDrawer } from "./MetaDrawer";
import { DocListSidebar } from "./DocListSidebar";
import { RibbonBar } from "./RibbonBar";
import { EditorCanvas } from "./EditorCanvas";
import { EditorStatusBar } from "./EditorStatusBar";
import { TitleBar } from "./TitleBar";
import BlogSimpleShell from "./BlogSimpleShell";

const BLOG_ADVANCED_KEY = "yj-editor-blog-advanced-mode";
import { HorizontalRuler } from "./HorizontalRuler";
import { EditorSplash } from "./EditorSplash";
import { BlogPreviewModal } from "./BlogPublishingTools";
import { getBlogPublishStatus } from "./blogPublishingUtils";
import BlogComposerPanel from "./BlogComposerPanel";
import { withBlogFootnotes } from "./footnote-utils";
/* 모바일 셸은 데스크톱 사용자에게는 필요 없으므로 lazy import — 첫 모바일 진입 시에만 로드 */
import { MobileTopBar } from "./mobile/MobileTopBar";
import { MobileFormatBar } from "./mobile/MobileFormatBar";
import { useVisualViewport } from "./mobile/mobileHooks";
import { attachSnippetExpander } from "./mobile/snippets";
import { attachMarkdownPasteHandler } from "./mobile/markdownPaste";
import { pushVersion } from "./mobile/versionStore";
import { addBookmarkFromEditor, jumpBookmark, loadBookmarks, removeBookmark } from "./mobile/bookmarks";
import { showEditorAlert } from "./editorToast";

const MobileToolSheet = lazy(() => import("./mobile/MobileToolSheet").then((m) => ({ default: m.MobileToolSheet })));
const MobileSidebarDrawer = lazy(() => import("./mobile/MobileSidebarDrawer").then((m) => ({ default: m.MobileSidebarDrawer })));
const MobileSlashMenu = lazy(() => import("./mobile/MobileSlashMenu").then((m) => ({ default: m.MobileSlashMenu })));
const MobileVoiceInput = lazy(() => import("./mobile/MobileVoiceInput").then((m) => ({ default: m.MobileVoiceInput })));
const MobileImageQuickAdd = lazy(() => import("./mobile/MobileImageQuickAdd").then((m) => ({ default: m.MobileImageQuickAdd })));
const MobileOutline = lazy(() => import("./mobile/MobileOutline").then((m) => ({ default: m.MobileOutline })));
const MobileMetaSheet = lazy(() => import("./mobile/MobileMetaSheet").then((m) => ({ default: m.MobileMetaSheet })));
const MobileWritingHud = lazy(() => import("./mobile/MobileWritingHud").then((m) => ({ default: m.MobileWritingHud })));
const MobileSpeedDial = lazy(() => import("./mobile/MobileSpeedDial").then((m) => ({ default: m.MobileSpeedDial })));
const MobileCommandPalette = lazy(() => import("./mobile/MobileCommandPalette").then((m) => ({ default: m.MobileCommandPalette })));
const MobileAiAssistant = lazy(() => import("./mobile/MobileAiAssistant").then((m) => ({ default: m.MobileAiAssistant })));
const MobilePublishSheet = lazy(() => import("./mobile/MobilePublishSheet").then((m) => ({ default: m.MobilePublishSheet })));
const MobileFindReplace = lazy(() => import("./mobile/MobileFindReplace").then((m) => ({ default: m.MobileFindReplace })));
const MobileVersionHistory = lazy(() => import("./mobile/MobileVersionHistory").then((m) => ({ default: m.MobileVersionHistory })));
const MobileGoalBar = lazy(() => import("./mobile/MobileGoalBar").then((m) => ({ default: m.MobileGoalBar })));

/* lazy: 사용자가 실제로 열 때까지 번들에서 분리 */
const BackstageView = lazy(() => import("./BackstageView").then(m => ({ default: m.BackstageView })));
const DialogManager = lazy(() => import("./DialogManager").then(m => ({ default: m.DialogManager })));

/**
 * EditorPage가 모은 상태/핸들러를 받아 화면을 그린다.
 * @param {object} props
 */
export default function EditorShell(props) {
  const {
    /* 에디터 인스턴스/refs */
    editor, titleRef, editorCanvasRef,
    /* 문서 */
    doc, setDoc, docId, documents, loading, saveStatus, handleSave,
    loadDocument, handleNew, handleNewBlog, handleDeleteDocument, handlePublishBlog, isPublishing,
    /* 댓글 */
    showAuthorDialog, handleAuthorSave, handleAuthorCancel, handleInsertComment,
    commentStore,
    /* 백스테이지/내보내기 */
    showBackstage, setShowBackstage,
    handleExportDocx, handleExportPdf, handleExportHtml,
    handleExportMarkdown, handleExportHwpx, handleImportDocx,
    /* 다이얼로그 */
    dialogOpen, setDialogOpen,
    /* 사이드바 */
    sidebarCollapsed, setSidebarCollapsed, sidebarSearch, setSidebarSearch,
    /* 보기 상태 */
    viewMode, setViewMode, zoom, setZoom, showRuler,
    showNavPane, setShowNavPane, darkMode, setDarkMode,
    activeTab, setActiveTab, ribbonCollapsed, setRibbonCollapsed,
    findBarMode, setFindBarMode,
    /* 페이지 레이아웃 */
    pageW, marginLeft, marginRight,
    headerText, setHeaderText, footerText, setFooterText, watermarkText, pageColor,
    showHeaderFooter,
    /* 상태바 카운트 */
    dynamicPageCount, wordCount, charCount,
    /* 메타 드로어 */
    metaOpen, setMetaOpen,
    /* 메모 prop 묶음 */
    memoProps,
    drawingState,
  } = props;
  const [blogPreviewOpen, setBlogPreviewOpen] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileVoiceOpen, setMobileVoiceOpen] = useState(false);
  const [mobileImageOpen, setMobileImageOpen] = useState(false);
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [mobileMetaOpen, setMobileMetaOpen] = useState(false);
  const [mobileFocusMode, setMobileFocusMode] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);
  const [mobilePublishOpen, setMobilePublishOpen] = useState(false);
  const [mobileFindOpen, setMobileFindOpen] = useState(false);
  const [mobileVersionOpen, setMobileVersionOpen] = useState(false);
  const [mobileBookmarks, setMobileBookmarks] = useState(() => loadBookmarks(docId));
  const { keyboardHeight, keyboardOpen } = useVisualViewport();
  const [drawOptions, setDrawOptions] = useState({
    activeTool: null,
    penColor: "#000000",
    penWidth: 3,
    highlighterOpacity: 0.4,
    canvasActive: false,
  });
  const drawProps = {
    drawingState,
    drawOptions,
    setDrawOptions,
  };

  useEffect(() => {
    if (!editor) return undefined;
    const syncEditorHtml = () => setEditorHtml(editor.getHTML?.() || "");
    syncEditorHtml();
    editor.on("update", syncEditorHtml);
    return () => editor.off("update", syncEditorHtml);
  }, [editor]);

  /* 모바일에서만: 스니펫 자동 확장 + 마크다운 자동 paste 변환 */
  useEffect(() => {
    if (!isMobile || !editor) return undefined;
    const detachSnip = attachSnippetExpander(editor);
    const detachMd = attachMarkdownPasteHandler(editor);
    return () => { detachSnip?.(); detachMd?.(); };
  }, [isMobile, editor]);

  /* 모바일 자동 버전 스냅샷 — 60초마다 본문이 바뀌었으면 push */
  useEffect(() => {
    if (!isMobile || !editor) return undefined;
    const timer = setInterval(() => {
      const html = editor.getHTML?.();
      if (!html) return;
      pushVersion(docId, { html, label: "자동 저장" });
    }, 60_000);
    return () => clearInterval(timer);
  }, [isMobile, editor, docId]);

  /* docId 변경 시 북마크 다시 로드 */
  useEffect(() => {
    if (isMobile) setMobileBookmarks(loadBookmarks(docId));
  }, [docId, isMobile]);

  const previewDoc = {
    ...doc,
    blogCategory: doc?.blogCategory || doc?.category || "construction_realestate",
    author: doc?.author || "법무법인 하이로",
  };
  const blogPublishStatus = getBlogPublishStatus(previewDoc, editorHtml);
  const previewHtml = doc?.documentType === "blog"
    ? withBlogFootnotes(
      editorHtml,
      memoProps.canvasFootnoteProps?.footnotes || [],
      memoProps.canvasFootnoteProps?.footnoteNumberFormat || "decimal",
    )
    : editorHtml;

  /* 공유: Web Share API (지원 시) */
  const handleShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      showEditorAlert("이 기기에서는 공유 기능을 지원하지 않습니다.");
      return;
    }
    try {
      await navigator.share({
        title: doc?.title || "법무법인 하이로 문서",
        text: doc?.excerpt || doc?.summary || "",
        url: typeof window !== "undefined" ? window.location.href : "",
      });
    } catch { /* 사용자 취소 */ }
  };

  const isBlog = doc?.documentType === "blog";

  // 블로그 단순 에디터 모드 — 운영자가 한 번 'Word 스타일'을 선택하면 그 단말에서 기억.
  // 새 블로그를 시작할 때마다 다시 단순 모드로 떨어지길 바라는 운영자 피드백 반영.
  const [blogAdvanced, setBlogAdvanced] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    try { return localStorage.getItem(BLOG_ADVANCED_KEY) === "1"; } catch { return false; }
  });
  const setBlogAdvancedPersist = (v) => {
    setBlogAdvanced(v);
    try { localStorage.setItem(BLOG_ADVANCED_KEY, v ? "1" : "0"); } catch { /* quota */ }
  };

  // 블로그 + 단순 모드 + 데스크톱(or 모바일 둘 다 OK) 인 경우 BlogSimpleShell 로 위임.
  // 모바일은 화면이 좁아 어차피 메타 패널이 하단에 떨어지지만 동일 컴포넌트로 충분히 동작.
  if (isBlog && !blogAdvanced) {
    return (
      <>
        <BlogSimpleShell
          editor={editor}
          doc={doc}
          setDoc={setDoc}
          saveStatus={saveStatus}
          handleSave={handleSave}
          handlePublishBlog={handlePublishBlog}
          isPublishing={isPublishing}
          handleInsertComment={handleInsertComment}
          setShowBackstage={setShowBackstage}
          onSwitchToWordMode={() => setBlogAdvancedPersist(true)}
        />
        {showAuthorDialog && (
          <AuthorSetupDialog onSave={handleAuthorSave} onCancel={handleAuthorCancel} />
        )}
        <style>{editorStyles}</style>
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        ["--editor-keyboard-h"]: `${keyboardHeight}px`,
      }}
      data-keyboard-open={keyboardOpen ? "true" : "false"}
      className={`word-editor-root${darkMode ? " dark-mode" : ""}${mobileFocusMode && isMobile ? " mobile-focus-mode" : ""} comment-markup-${commentStore.markupMode}`}
    >
      <style>{editorStyles}</style>

      {loading && <EditorSplash />}

      {showAuthorDialog && (
        <AuthorSetupDialog onSave={handleAuthorSave} onCancel={handleAuthorCancel} />
      )}

      {showBackstage && (
        <Suspense fallback={null}>
          <BackstageView
            doc={doc} setDoc={setDoc}
            onClose={() => setShowBackstage(false)}
            onNew={() => { handleNew(); setShowBackstage(false); }}
            onSave={() => { handleSave(false); setShowBackstage(false); }}
            onExportDocx={handleExportDocx}
            onExportPdf={handleExportPdf}
            onExportHtml={handleExportHtml}
            onExportMarkdown={handleExportMarkdown}
            onExportHwpx={handleExportHwpx}
            onImportDocx={handleImportDocx}
            onPrint={() => window.print()}
          />
        </Suspense>
      )}

      {dialogOpen && (
        <Suspense fallback={null}>
          <DialogManager
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editor={editor}
            layoutProps={memoProps.dialogLayoutProps}
            pageProps={memoProps.dialogPageProps}
            footnoteProps={memoProps.dialogFootnoteProps}
            printPreviewProps={memoProps.dialogPrintPreviewProps}
          />
        </Suspense>
      )}

      {/* 데스크톱 사이드바 (모바일은 드로어로 대체) */}
      {!isMobile && (
        <DocListSidebar
          documents={documents} onSelect={loadDocument} currentId={docId}
          onNew={handleNew} onNewBlog={handleNewBlog} onDelete={handleDeleteDocument}
          search={sidebarSearch} setSearch={setSidebarSearch}
          collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        />
      )}

      {/* 모바일 사이드바 드로어 (lazy) */}
      {isMobile && (
        <Suspense fallback={null}>
          <MobileSidebarDrawer
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            documents={documents}
            currentId={docId}
            onSelect={loadDocument}
            onNew={handleNew}
            onNewBlog={handleNewBlog}
            onDelete={handleDeleteDocument}
            search={sidebarSearch}
            setSearch={setSidebarSearch}
          />
        </Suspense>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* 모바일 전용 상단 바 */}
        {isMobile && (
          <MobileTopBar
            editor={editor}
            doc={doc}
            setDoc={setDoc}
            saveStatus={saveStatus}
            darkMode={darkMode}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            onOpenSheet={() => setMobileSheetOpen(true)}
            onOpenOutline={() => setMobileOutlineOpen(true)}
            onOpenMeta={() => setMobileMetaOpen(true)}
            onToggleFocus={() => setMobileFocusMode((v) => !v)}
            focusMode={mobileFocusMode}
            onShare={typeof navigator !== "undefined" && navigator.share ? handleShare : null}
            isBlog={isBlog}
          />
        )}

        {/* 데스크톱 타이틀바 + 리본 (모바일에서는 숨김) */}
        {!isMobile && (
          <TitleBar
            editor={editor} doc={doc} setDoc={setDoc}
            titleRef={titleRef} darkMode={darkMode} setDarkMode={setDarkMode}
            saveStatus={saveStatus} handleSave={handleSave}
            handleNew={handleNew}
            handleNewBlog={handleNewBlog}
            handlePublishBlog={handlePublishBlog}
            isPublishing={isPublishing}
            onOpenBlogPreview={() => setBlogPreviewOpen(true)}
            setMetaOpen={setMetaOpen}
          />
        )}

        {!isMobile && (
          <RibbonBar
            editor={editor}
            doc={doc}
            activeTab={activeTab} setActiveTab={setActiveTab}
            ribbonCollapsed={ribbonCollapsed} setRibbonCollapsed={setRibbonCollapsed}
            darkMode={darkMode}
            viewMode={viewMode}
            setShowBackstage={setShowBackstage}
            findBarMode={findBarMode} setFindBarMode={setFindBarMode}
            setDialogOpen={setDialogOpen}
            onNew={handleNew}
            onNewBlog={handleNewBlog}
            onPublishBlog={handlePublishBlog}
            isPublishing={isPublishing}
            designProps={memoProps.ribbonDesignProps}
            layoutProps={memoProps.ribbonLayoutProps}
            referencesProps={memoProps.ribbonReferencesProps}
            reviewProps={memoProps.ribbonReviewProps}
            viewProps={memoProps.ribbonViewProps}
            drawProps={drawProps}
            blogPublishStatus={blogPublishStatus}
            onOpenBlogPreview={() => setBlogPreviewOpen(true)}
            onOpenMeta={() => setMetaOpen(true)}
            onSwitchToSimpleBlog={() => setBlogAdvancedPersist(false)}
          />
        )}

        {!isMobile && showRuler && (
          <HorizontalRuler
            darkMode={darkMode} zoom={zoom} pageW={pageW}
            marginLeft={marginLeft} marginRight={marginRight}
            showNavPane={showNavPane} showRuler={showRuler}
          />
        )}

        {doc?.documentType === "blog" && (
          <BlogComposerPanel
            doc={doc}
            setDoc={setDoc}
            onPublish={handlePublishBlog}
            onPreview={() => setBlogPreviewOpen(true)}
            isPublishing={isPublishing}
            editorHtml={editorHtml}
            editor={editor}
          />
        )}

        <EditorCanvas
          editor={editor}
          editorCanvasRef={editorCanvasRef}
          viewMode={viewMode}
          darkMode={darkMode}
          zoom={zoom}
          showRuler={showRuler && !isMobile}
          showNavPane={showNavPane && !isMobile}
          setShowNavPane={setShowNavPane}
          doc={doc}
          pageLayout={memoProps.canvasPageLayout}
          commentProps={memoProps.canvasCommentProps}
          footnoteProps={memoProps.canvasFootnoteProps}
          setDialogOpen={setDialogOpen}
          handleInsertComment={handleInsertComment}
          showHeaderFooter={showHeaderFooter && !isMobile}
          headerText={headerText}
          setHeaderText={setHeaderText}
          footerText={footerText}
          setFooterText={setFooterText}
          watermarkText={watermarkText}
          pageColor={pageColor}
          drawProps={drawProps}
          dynamicPageCount={dynamicPageCount}
          isMobile={isMobile}
        />

        {/* 모바일 전용 하단 서식 바 */}
        {isMobile && (
          <MobileFormatBar
            editor={editor}
            darkMode={darkMode}
            onOpenSheet={() => setMobileSheetOpen(true)}
            onOpenLinkDialog={() => setDialogOpen("hyperlink")}
            onOpenImageDialog={() => setMobileImageOpen(true)}
          />
        )}

        {/* 모바일 보조 위젯들 — 슬래시 메뉴 / 작성 통계 HUD / 목표 바 / 스피드 다이얼 */}
        {isMobile && (
          <Suspense fallback={null}>
            <MobileSlashMenu
              editor={editor}
              onOpenImage={() => setMobileImageOpen(true)}
              onOpenTable={() => setDialogOpen("table")}
              onInsertComment={handleInsertComment}
            />
            <MobileGoalBar editor={editor} hidden={mobileVoiceOpen || mobileImageOpen || mobileFocusMode || mobilePaletteOpen} />
            <MobileWritingHud editor={editor} hidden={mobileVoiceOpen || mobileImageOpen || mobileFocusMode || mobilePaletteOpen} />
            <MobileSpeedDial
              editor={editor}
              onVoice={() => setMobileVoiceOpen(true)}
              onImage={() => setMobileImageOpen(true)}
              onTable={() => setDialogOpen("table")}
              onFocus={() => setMobileFocusMode((v) => !v)}
              onPalette={() => setMobilePaletteOpen(true)}
              onAi={() => setMobileAiOpen(true)}
            />
            <MobileVoiceInput
              editor={editor}
              open={mobileVoiceOpen}
              onClose={() => setMobileVoiceOpen(false)}
            />
            <MobileImageQuickAdd
              editor={editor}
              open={mobileImageOpen}
              onClose={() => setMobileImageOpen(false)}
            />
            <MobileOutline
              editor={editor}
              open={mobileOutlineOpen}
              onClose={() => setMobileOutlineOpen(false)}
            />
            <MobileMetaSheet
              open={mobileMetaOpen}
              onClose={() => setMobileMetaOpen(false)}
              doc={doc}
              setDoc={setDoc}
              onPublish={() => { handlePublishBlog(); setMobileMetaOpen(false); }}
              onPreview={() => { setBlogPreviewOpen(true); setMobileMetaOpen(false); }}
              isPublishing={isPublishing}
            />
            <MobileCommandPalette
              open={mobilePaletteOpen}
              onClose={() => setMobilePaletteOpen(false)}
              editor={editor}
              onShowFind={() => { setMobileFindOpen(true); setMobilePaletteOpen(false); }}
              onShowReplace={() => { setMobileFindOpen(true); setMobilePaletteOpen(false); }}
              onOpenImage={() => { setMobileImageOpen(true); setMobilePaletteOpen(false); }}
              onOpenTable={() => { setDialogOpen("table"); setMobilePaletteOpen(false); }}
              onOpenSymbol={() => { setDialogOpen("symbol"); setMobilePaletteOpen(false); }}
              onInsertComment={() => { handleInsertComment(); setMobilePaletteOpen(false); }}
              onOpenSeo={() => { setMobilePublishOpen(true); setMobilePaletteOpen(false); }}
              onOpenAi={() => { setMobileAiOpen(true); setMobilePaletteOpen(false); }}
              onOpenSchedule={() => { setMobilePublishOpen(true); setMobilePaletteOpen(false); }}
              onOpenVersion={() => { setMobileVersionOpen(true); setMobilePaletteOpen(false); }}
              onTogglePresence={() => showEditorAlert("공동 편집 표시는 다음 단계에서 추가됩니다.")}
              bookmarks={mobileBookmarks}
              onAddBookmark={() => {
                const list = addBookmarkFromEditor(editor, docId);
                setMobileBookmarks(list);
              }}
              onJumpBookmark={(b) => jumpBookmark(editor, b)}
              onRemoveBookmark={(id) => setMobileBookmarks(removeBookmark(docId, id))}
            />
            <MobileAiAssistant
              editor={editor}
              open={mobileAiOpen}
              onClose={() => setMobileAiOpen(false)}
              doc={doc}
            />
            <MobilePublishSheet
              open={mobilePublishOpen}
              onClose={() => setMobilePublishOpen(false)}
              doc={doc}
              setDoc={setDoc}
              editorHtml={editorHtml}
              onPublish={() => { handlePublishBlog(); setMobilePublishOpen(false); }}
              isPublishing={isPublishing}
            />
            <MobileFindReplace
              editor={editor}
              open={mobileFindOpen}
              onClose={() => setMobileFindOpen(false)}
            />
            <MobileVersionHistory
              editor={editor}
              open={mobileVersionOpen}
              onClose={() => setMobileVersionOpen(false)}
              docId={docId}
            />
          </Suspense>
        )}

        {/* 데스크톱 상태 바 (모바일은 숨김) */}
        {!isMobile && (
          <EditorStatusBar
            darkMode={darkMode}
            dynamicPageCount={dynamicPageCount}
            wordCount={wordCount}
            charCount={charCount}
            viewMode={viewMode}
            setViewMode={setViewMode}
            zoom={zoom}
            setZoom={setZoom}
          />
        )}

        {/* 모바일 도구 시트 (lazy) */}
        {isMobile && (
          <Suspense fallback={null}>
          <MobileToolSheet
            open={mobileSheetOpen}
            onClose={() => setMobileSheetOpen(false)}
            editor={editor}
            doc={doc}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            handleSave={handleSave}
            handleNew={handleNew}
            handleNewBlog={handleNewBlog}
            handlePublishBlog={handlePublishBlog}
            isPublishing={isPublishing}
            onOpenBlogPreview={() => setBlogPreviewOpen(true)}
            onOpenMeta={() => setMetaOpen(true)}
            onShowFind={() => { setMobileFindOpen(true); setMobileSheetOpen(false); }}
            onShowReplace={() => { setMobileFindOpen(true); setMobileSheetOpen(false); }}
            onOpenImage={() => { setMobileImageOpen(true); setMobileSheetOpen(false); }}
            onOpenLink={() => setDialogOpen("hyperlink")}
            onOpenTable={() => setDialogOpen("table")}
            onOpenSymbol={() => setDialogOpen("symbol")}
            onInsertComment={handleInsertComment}
            exportHandlers={{
              docx: handleExportDocx,
              pdf: handleExportPdf,
              html: handleExportHtml,
              markdown: handleExportMarkdown,
              hwpx: handleExportHwpx,
            }}
            zoomCtl={{ zoom, setZoom }}
          />
          </Suspense>
        )}

        {metaOpen && (
          <div
            onClick={() => setMetaOpen(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.15)", zIndex: 999 }}
          />
        )}
        <MetaDrawer doc={doc} setDoc={setDoc} open={metaOpen} onClose={() => setMetaOpen(false)} editorHtml={editorHtml} />
        {blogPreviewOpen && (
          <BlogPreviewModal
            doc={previewDoc}
            html={previewHtml}
            status={blogPublishStatus}
            onPublish={handlePublishBlog}
            publishing={isPublishing}
            onClose={() => setBlogPreviewOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
