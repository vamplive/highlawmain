/**
 * EditorPage — MS Word 스타일 문서 에디터 진입점(thin composition root)
 * 상태/효과/메모는 커스텀 훅으로, 렌더는 EditorShell로 위임한다.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import EditorShell from "./modules/EditorShell";
import { ZOOM_MIN, ZOOM_MAX, FIT_PAGE_PADDING } from "./modules/editorConstants";
import { useDrawingState } from "./modules/useDrawingState";

import {
  useDocumentManager,
  useComments,
  usePageLayout,
  useEditorShortcuts,
  useFootnotes,
  useExportImport,
  usePagination,
  useEditorInstance,
  useEditorEffects,
  useEditorMemoProps,
} from "./hooks";

export default function EditorPage() {
  const { id: routeDocId } = useParams();
  const [searchParams] = useSearchParams();
  const titleRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const scheduleAutoSaveRef = useRef(null);
  const initialRouteHandledRef = useRef(null);
  const metadataAutoSaveArmedRef = useRef(false);

  /* ── UI 로컬 상태 ── */
  const [viewMode, setViewMode] = useState("edit");
  const [metaOpen, setMetaOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showNavPane, setShowNavPane] = useState(false);
  const [findBarMode, setFindBarMode] = useState(null);
  const [showBackstage, setShowBackstage] = useState(false);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeaderFooter] = useState(true);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [dynamicPageCount, setDynamicPageCount] = useState(1);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(null);

  /* ── TipTap 에디터 인스턴스 ── */
  const editor = useEditorInstance({ onAutoSave: () => scheduleAutoSaveRef.current?.() });

  const footnotesHook = useFootnotes(editor);
  const drawingState = useDrawingState();
  const hydrateHeaderFooter = useCallback(({ headerText: nextHeaderText = "", footerText: nextFooterText = "" } = {}) => {
    setHeaderText(nextHeaderText);
    setFooterText(nextFooterText);
  }, []);
  const resetHeaderFooter = useCallback(() => {
    setHeaderText("");
    setFooterText("");
  }, []);
  const {
    footnotes, setFootnotes, endnotes, setEndnotes,
    setFootnoteAreaHeight,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
    handleInsertFootnote, handleInsertEndnote, handleFootnoteDialogInsert,
  } = footnotesHook;

  /* ── 도메인 훅 ── */
  const docManager = useDocumentManager(editor, {
    footnotes,
    endnotes,
    footnoteNumberFormat,
    endnoteNumberFormat,
    drawings: drawingState.strokes,
    hydrateFootnotes: footnotesHook.hydrateFootnotes,
    resetFootnotes: footnotesHook.resetFootnotes,
    hydrateDrawings: drawingState.hydrateDrawings,
    resetDrawings: drawingState.resetDrawings,
    headerText,
    footerText,
    hydrateHeaderFooter,
    resetHeaderFooter,
  });
  const {
    doc, setDoc, docId, documents, loading,
    saveStatus, setSaveStatus, loadDocument,
    handleSave, refreshList, scheduleAutoSave, handlePublishBlog,
    handleDeleteDocument,
    isPublishing,
  } = docManager;
  /* ref 동기화 — useEditor의 onUpdate에서 최신 scheduleAutoSave 참조 (latest-callback 패턴) */
  // eslint-disable-next-line react-hooks/refs
  scheduleAutoSaveRef.current = scheduleAutoSave;

  useEffect(() => {
    metadataAutoSaveArmedRef.current = false;
    const timer = setTimeout(() => {
      metadataAutoSaveArmedRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, [docId, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !metadataAutoSaveArmedRef.current) return;
    scheduleAutoSaveRef.current?.();
  }, [
    editor,
    footnotes,
    endnotes,
    footnoteNumberFormat,
    endnoteNumberFormat,
    drawingState.strokes,
    headerText,
    footerText,
  ]);

  const comments = useComments(editor, docId);
  const {
    commentStore, commentDispatch, commentAuthor, showAuthorDialog,
    handleInsertComment, handleAuthorSave, handleAuthorCancel,
    handleDeleteActiveComment, handleDeleteAllComments,
    handleNextComment, handlePrevComment, deleteAllComments,
  } = comments;

  const layout = usePageLayout();
  const {
    margins, setMargins, customMargins, setCustomMargins,
    orientation, setOrientation, pageSize, setPageSize,
    columns, setColumns, pageColor, setPageColor,
    watermarkText, setWatermarkText,
    pageBorder, setPageBorder,
    headerFooterSettings, setHeaderFooterSettings,
    pageW, pageH,
    marginTop, marginBottom, marginLeft, marginRight,
    contentAreaHeight, gapH, PAGE_GAP,
  } = layout;

  const {
    handleExportDocx, handleExportPdf, handleExportHtml,
    handleExportMarkdown, handleExportHwpx, handleImportDocx,
  } = useExportImport({
    editor, doc, setDoc, setSaveStatus, editorCanvasRef,
    layoutOptions: { orientation, pageSize },
    footnoteState: { footnotes, footnoteNumberFormat, endnotes, endnoteNumberFormat },
    drawingState,
  });

  /* ── 부수효과 ── */
  useEditorEffects({
    editor, viewMode, docId,
    setDoc, setSaveStatus, refreshList,
    setZoom, setIsFullscreen, setRibbonCollapsed,
    hydrateFootnotes: footnotesHook.hydrateFootnotes,
    hydrateDrawings: drawingState.hydrateDrawings,
    hydrateHeaderFooter,
  });

  /* ── 전체화면 토글 ── */
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  /* ── 키보드 단축키 ── */
  useEditorShortcuts(editor, {
    onSave: () => handleSave(false),
    onFind: () => setFindBarMode("find"),
    onReplace: () => setFindBarMode("replace"),
    onHyperlink: () => setDialogOpen("hyperlink"),
    onFont: () => setDialogOpen("font"),
    onPrint: () => setDialogOpen("printpreview"),
    onComment: () => handleInsertComment(),
    onFullscreen: handleToggleFullscreen,
  });

  /* ── 새 문서 (훅 초기화 통합) ── */
  const handleNew = useCallback(() => {
    docManager.handleNew();
    footnotesHook.resetFootnotes();
    drawingState.resetDrawings();
    deleteAllComments();
    titleRef.current?.focus();
  }, [docManager, footnotesHook, drawingState, deleteAllComments]);

  const handleNewBlog = useCallback(() => {
    docManager.handleNewBlog();
    footnotesHook.resetFootnotes();
    drawingState.resetDrawings();
    deleteAllComments();
    titleRef.current?.focus();
  }, [docManager, footnotesHook, drawingState, deleteAllComments]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const initialKey = routeDocId ? `doc:${routeDocId}` : `mode:${searchParams.get("mode") || ""}`;
    if (initialRouteHandledRef.current === initialKey) return;

    if (routeDocId) {
      initialRouteHandledRef.current = initialKey;
      loadDocument(routeDocId);
      return;
    }

    if (searchParams.get("mode") === "blog") {
      initialRouteHandledRef.current = initialKey;
      handleNewBlog();
    }
  }, [editor, routeDocId, searchParams, loadDocument, handleNewBlog]);

  /* ── 페이지네이션 ── */
  usePagination({
    editor, viewMode, darkMode, pageColor,
    pageW, contentAreaHeight,
    marginTop, marginBottom, marginLeft, marginRight,
    headerText, footerText, PAGE_GAP,
    editorCanvasRef, setDynamicPageCount,
  });

  /* ── 페이지 폭 맞춤 ── */
  const handleFitPageWidth = useCallback(() => {
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (!scrollEl) return;
    const availWidth = scrollEl.clientWidth - FIT_PAGE_PADDING;
    const newZoom = Math.round((availWidth / pageW) * 100);
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom)));
  }, [pageW]);

  /* ── 변경 추적 토글 ── */
  const handleToggleTrackChanges = useCallback(() => {
    setTrackChangesEnabled(v => !v);
    editor?.commands.toggleTrackChanges();
  }, [editor]);

  /* ── 카운터 ── */
  const charCount = editor?.storage.characterCount?.characters() || 0;
  const wordCount = editor?.storage.characterCount?.words() || 0;

  /* ── 자식에게 전달할 메모 prop 묶음 ── */
  const memoProps = useEditorMemoProps({
    margins, setMargins, orientation, setOrientation,
    pageSize, setPageSize, customMargins, setCustomMargins,
    headerFooterSettings, setHeaderFooterSettings,
    pageBorder, setPageBorder, watermarkText, setWatermarkText,
    pageColor, setPageColor, columns, setColumns,
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, contentAreaHeight,
    gapH, PAGE_GAP,
    handleFootnoteDialogInsert,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
    handleInsertFootnote, handleInsertEndnote,
    footnotes, setFootnotes, endnotes, setEndnotes, setFootnoteAreaHeight,
    drawings: drawingState.strokes,
    handleInsertComment, handleDeleteActiveComment, handleDeleteAllComments,
    handleNextComment, handlePrevComment,
    commentStore, commentDispatch, commentAuthor,
    trackChangesEnabled, handleToggleTrackChanges,
    showRuler, setShowRuler, viewMode, setViewMode,
    zoom, setZoom, showNavPane, setShowNavPane,
    handleNew, darkMode, setDarkMode,
    handleFitPageWidth, handleToggleFullscreen, isFullscreen,
  });

  return (
    <EditorShell
      editor={editor}
      titleRef={titleRef}
      editorCanvasRef={editorCanvasRef}
      doc={doc} setDoc={setDoc} docId={docId}
      documents={documents} loading={loading}
      saveStatus={saveStatus} handleSave={handleSave}
      loadDocument={loadDocument} handleNew={handleNew}
      handleNewBlog={handleNewBlog}
      handleDeleteDocument={handleDeleteDocument}
      handlePublishBlog={handlePublishBlog}
      isPublishing={isPublishing}
      showAuthorDialog={showAuthorDialog}
      handleAuthorSave={handleAuthorSave}
      handleAuthorCancel={handleAuthorCancel}
      handleInsertComment={handleInsertComment}
      commentStore={commentStore}
      showBackstage={showBackstage} setShowBackstage={setShowBackstage}
      handleExportDocx={handleExportDocx}
      handleExportPdf={handleExportPdf}
      handleExportHtml={handleExportHtml}
      handleExportMarkdown={handleExportMarkdown}
      handleExportHwpx={handleExportHwpx}
      handleImportDocx={handleImportDocx}
      dialogOpen={dialogOpen} setDialogOpen={setDialogOpen}
      sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
      sidebarSearch={sidebarSearch} setSidebarSearch={setSidebarSearch}
      viewMode={viewMode} setViewMode={setViewMode}
      zoom={zoom} setZoom={setZoom}
      showRuler={showRuler}
      showNavPane={showNavPane} setShowNavPane={setShowNavPane}
      darkMode={darkMode} setDarkMode={setDarkMode}
      activeTab={activeTab} setActiveTab={setActiveTab}
      ribbonCollapsed={ribbonCollapsed} setRibbonCollapsed={setRibbonCollapsed}
      findBarMode={findBarMode} setFindBarMode={setFindBarMode}
      pageW={pageW} marginLeft={marginLeft} marginRight={marginRight}
      headerText={headerText} setHeaderText={setHeaderText}
      footerText={footerText} setFooterText={setFooterText}
      watermarkText={watermarkText} pageColor={pageColor}
      showHeaderFooter={showHeaderFooter}
      dynamicPageCount={dynamicPageCount}
      wordCount={wordCount} charCount={charCount}
      metaOpen={metaOpen} setMetaOpen={setMetaOpen}
      memoProps={memoProps}
      drawingState={drawingState}
    />
  );
}
