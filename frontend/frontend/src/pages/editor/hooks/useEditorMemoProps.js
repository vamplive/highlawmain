/**
 * useEditorMemoProps — 자식 컴포넌트(RibbonBar, EditorCanvas, DialogManager)에
 * 전달할 prop 객체들을 useMemo로 묶어 불필요한 리렌더를 방지한다.
 */
import { useMemo } from "react";

/**
 * @param {object} params - 메모이즈에 필요한 모든 상태/세터/핸들러 묶음
 * @returns {{
 *   dialogLayoutProps: object,
 *   dialogPageProps: object,
 *   dialogFootnoteProps: object,
 *   dialogPrintPreviewProps: object,
 *   ribbonDesignProps: object,
 *   ribbonLayoutProps: object,
 *   ribbonReferencesProps: object,
 *   ribbonReviewProps: object,
 *   ribbonViewProps: object,
 *   canvasPageLayout: object,
 *   canvasCommentProps: object,
 *   canvasFootnoteProps: object,
 * }}
 */
export default function useEditorMemoProps({
  // 페이지 레이아웃
  margins, setMargins, orientation, setOrientation,
  pageSize, setPageSize, customMargins, setCustomMargins,
  headerFooterSettings, setHeaderFooterSettings,
  pageBorder, setPageBorder, watermarkText, setWatermarkText,
  pageColor, setPageColor, columns, setColumns,
  pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, contentAreaHeight,
  gapH, PAGE_GAP,
  // 각주/미주
  handleFootnoteDialogInsert,
  footnoteNumberFormat, setFootnoteNumberFormat,
  endnoteNumberFormat, setEndnoteNumberFormat,
  handleInsertFootnote, handleInsertEndnote,
  footnotes, setFootnotes,
  endnotes, setEndnotes,
  setFootnoteAreaHeight,
  drawings,
  // 댓글/추적변경
  handleInsertComment, handleDeleteActiveComment, handleDeleteAllComments,
  handleNextComment, handlePrevComment,
  commentStore, commentDispatch, commentAuthor,
  trackChangesEnabled, handleToggleTrackChanges,
  // 보기
  showRuler, setShowRuler, viewMode, setViewMode,
  zoom, setZoom, showNavPane, setShowNavPane,
  handleNew, darkMode, setDarkMode,
  handleFitPageWidth, handleToggleFullscreen, isFullscreen,
}) {
  const dialogLayoutProps = useMemo(() => ({
    margins, setMargins, orientation, setOrientation,
    pageSize, setPageSize, customMargins, setCustomMargins,
    headerFooterSettings, setHeaderFooterSettings,
  }), [margins, setMargins, orientation, setOrientation, pageSize, setPageSize, customMargins, setCustomMargins, headerFooterSettings, setHeaderFooterSettings]);

  const dialogPageProps = useMemo(() => ({
    pageBorder, setPageBorder, watermarkText, setWatermarkText,
  }), [pageBorder, setPageBorder, watermarkText, setWatermarkText]);

  const dialogFootnoteProps = useMemo(() => ({
    handleFootnoteDialogInsert,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
  }), [handleFootnoteDialogInsert, footnoteNumberFormat, setFootnoteNumberFormat, endnoteNumberFormat, setEndnoteNumberFormat]);

  const dialogPrintPreviewProps = useMemo(() => ({
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight,
    footnotes, footnoteNumberFormat, endnotes, endnoteNumberFormat, drawings,
  }), [
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight,
    footnotes, footnoteNumberFormat, endnotes, endnoteNumberFormat, drawings,
  ]);

  const ribbonDesignProps = useMemo(() => ({
    pageColor, setPageColor, watermarkText, setWatermarkText,
  }), [pageColor, setPageColor, watermarkText, setWatermarkText]);

  const ribbonLayoutProps = useMemo(() => ({
    margins, setMargins, orientation, setOrientation,
    pageSize, setPageSize, columns, setColumns,
  }), [margins, setMargins, orientation, setOrientation, pageSize, setPageSize, columns, setColumns]);

  const ribbonReferencesProps = useMemo(() => ({
    onInsertFootnote: handleInsertFootnote,
    onInsertEndnote: handleInsertEndnote,
  }), [handleInsertFootnote, handleInsertEndnote]);

  const ribbonReviewProps = useMemo(() => ({
    onInsertComment: handleInsertComment,
    onDeleteComment: handleDeleteActiveComment,
    onDeleteAllComments: handleDeleteAllComments,
    onPrevComment: handlePrevComment,
    onNextComment: handleNextComment,
    commentStore, commentDispatch,
    trackChangesEnabled,
    onToggleTrackChanges: handleToggleTrackChanges,
  }), [
    handleInsertComment, handleDeleteActiveComment, handleDeleteAllComments,
    handlePrevComment, handleNextComment, commentStore, commentDispatch,
    trackChangesEnabled, handleToggleTrackChanges,
  ]);

  const ribbonViewProps = useMemo(() => ({
    showRuler, setShowRuler, viewMode, setViewMode,
    zoom, setZoom, showNavPane, setShowNavPane,
    onNew: handleNew, darkMode, setDarkMode,
    onFitPageWidth: handleFitPageWidth, onToggleFullscreen: handleToggleFullscreen, isFullscreen,
  }), [
    showRuler, setShowRuler, viewMode, setViewMode,
    zoom, setZoom, showNavPane, setShowNavPane,
    handleNew, darkMode, setDarkMode,
    handleFitPageWidth, handleToggleFullscreen, isFullscreen,
  ]);

  const canvasPageLayout = useMemo(() => ({
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, contentAreaHeight, gapH, PAGE_GAP,
  }), [pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, contentAreaHeight, gapH, PAGE_GAP]);

  const canvasCommentProps = useMemo(() => ({
    commentStore, commentDispatch, commentAuthor,
  }), [commentStore, commentDispatch, commentAuthor]);

  const canvasFootnoteProps = useMemo(() => ({
    footnotes, setFootnotes,
    endnotes, setEndnotes,
    setFootnoteAreaHeight,
    footnoteNumberFormat, endnoteNumberFormat,
  }), [footnotes, setFootnotes, endnotes, setEndnotes, setFootnoteAreaHeight, footnoteNumberFormat, endnoteNumberFormat]);

  return {
    dialogLayoutProps,
    dialogPageProps,
    dialogFootnoteProps,
    dialogPrintPreviewProps,
    ribbonDesignProps,
    ribbonLayoutProps,
    ribbonReferencesProps,
    ribbonReviewProps,
    ribbonViewProps,
    canvasPageLayout,
    canvasCommentProps,
    canvasFootnoteProps,
  };
}
