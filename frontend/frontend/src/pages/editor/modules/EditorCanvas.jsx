/**
 * EditorCanvas — MS Word 스타일 메인 편집 영역
 * 스크롤 가능한 캔버스에 줌 변환, EditorContent, 눈금자, 마진 가이드,
 * 페이지 오버레이, 리뷰 패널, 코멘트 패널을 렌더링
 */
import { memo } from "react";
import { EditorContent } from "@tiptap/react";
import DOMPurify from "dompurify";
import { FloatingToolbar } from "./FloatingToolbar";
import { MobileSelectionBar } from "./mobile/MobileSelectionBar";
import { NavigationPane } from "./NavigationPane";
import { ContextMenu } from "./ContextMenu";
import { CommentPanel, CommentIndicators, ReviewingPane } from "./CommentPanel";
import { FootnoteArea, EndnoteArea } from "./FootnoteArea";
import { DrawingOverlay } from "./DrawCanvas";
import { HeaderArea, FooterArea } from "./HeaderFooterArea";
import { PIXELS_PER_CM } from "./editorConstants";

/**
 * @param {object} props
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {React.RefObject} props.editorCanvasRef - 에디터 캔버스 DOM ref
 * @param {string} props.viewMode - 보기 모드 (edit/preview/web)
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {number} props.zoom - 줌 비율 (%)
 * @param {boolean} props.showRuler - 눈금자 표시 여부
 * @param {boolean} props.showNavPane - 탐색 창 표시 여부
 * @param {function} props.setShowNavPane - 탐색 창 토글
 * @param {object} props.doc - 문서 객체 (title, subtitle, author, publishedDate)
 * @param {object} props.pageLayout - 페이지 레이아웃 값들
 * @param {object} props.commentProps - 코멘트 관련 속성들
 * @param {object} props.footnoteProps - 각주 관련 속성들
 * @param {function} props.setDialogOpen - 다이얼로그 열기 핸들러
 * @param {function} props.handleInsertComment - 코멘트 삽입 핸들러
 * @param {boolean} props.showHeaderFooter - 머리글/바닥글 표시 여부
 * @param {string} props.headerText - 머리글 텍스트
 * @param {function} props.setHeaderText - 머리글 변경 핸들러
 * @param {string} props.watermarkText - 워터마크 텍스트
 * @param {string} props.pageColor - 페이지 배경색
 * @param {object} props.drawProps - 그리기 캔버스 상태
 * @param {number} props.dynamicPageCount - 계산된 페이지 수
 */
export const EditorCanvas = memo(function EditorCanvas({
  editor,
  editorCanvasRef,
  viewMode,
  darkMode,
  zoom,
  showRuler,
  showNavPane,
  setShowNavPane,
  doc,
  pageLayout,
  commentProps,
  footnoteProps,
  setDialogOpen,
  handleInsertComment,
  showHeaderFooter,
  headerText,
  setHeaderText,
  footerText,
  setFooterText,
  watermarkText,
  pageColor,
  drawProps,
  dynamicPageCount = 1,
  isMobile = false,
}) {
  const { pageH } = pageLayout;
  const { commentStore, commentDispatch, commentAuthor } = commentProps;

  const pageBg = darkMode ? "#2d2d2d" : (pageColor || "#fff");
  // 모바일에서는 데스크톱 viewMode와 무관하게 본문 흐름 뷰로 강제 (A4 축소·눈금자·페이지 갭 비표시)
  const effectiveViewMode = isMobile ? "mobile" : viewMode;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Horizontal reviewing pane */}
      {commentStore.showReviewingPane === "horizontal" && (
        <div style={{ order: 2 }}>
          <ReviewingPane mode="horizontal" commentStore={commentStore} dispatch={commentDispatch}
            currentAuthor={commentAuthor} editor={editor}
            onClose={() => commentDispatch({ type: "SET_REVIEWING_PANE", mode: null })} />
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Vertical reviewing pane */}
        {!isMobile && commentStore.showReviewingPane === "vertical" && (
          <ReviewingPane mode="vertical" commentStore={commentStore} dispatch={commentDispatch}
            currentAuthor={commentAuthor} editor={editor}
            onClose={() => commentDispatch({ type: "SET_REVIEWING_PANE", mode: null })} />
        )}

        {/* Navigation Pane (모바일 비표시) */}
        {!isMobile && showNavPane && <NavigationPane editor={editor} onClose={() => setShowNavPane(false)} />}

        <div className="editor-canvas-scroll" style={{
          flex: 1, overflowY: "auto",
          background: effectiveViewMode === "web" || effectiveViewMode === "mobile"
            ? (darkMode ? "#1e1e1e" : "#fff")
            : (darkMode ? "#1e1e1e" : "#e8e8e8"),
          display: "flex", justifyContent: "center",
          padding: effectiveViewMode === "web" || effectiveViewMode === "mobile" ? "0" : "20px 0 60px",
          position: "relative",
        }}>
          {/* 세로 눈금자 — 모바일에서 비표시 */}
          {showRuler && !isMobile && (
            <VerticalRuler pageH={pageH} zoom={zoom} darkMode={darkMode} />
          )}

          {/* ═══ Mobile Flow View ═══ */}
          {effectiveViewMode === "mobile" && (
            <MobileFlowView
              editorCanvasRef={editorCanvasRef} editor={editor}
              darkMode={darkMode}
              handleInsertComment={handleInsertComment}
              setDialogOpen={setDialogOpen}
              footnoteProps={footnoteProps}
              commentStore={commentStore} commentDispatch={commentDispatch}
            />
          )}

          {/* ═══ Web Layout View ═══ */}
          {effectiveViewMode === "web" && (
            <WebLayoutView
              editorCanvasRef={editorCanvasRef} editor={editor}
              doc={doc} darkMode={darkMode} handleInsertComment={handleInsertComment}
              setDialogOpen={setDialogOpen}
            />
          )}

          {/* ═══ Read Mode View ═══ */}
          {effectiveViewMode === "preview" && (
            <ReadModeView
              editorCanvasRef={editorCanvasRef} editor={editor}
              doc={doc} darkMode={darkMode}
            />
          )}

          {/* ═══ A4 편집 영역 (인쇄 모양) ═══ */}
          {effectiveViewMode === "edit" && (
            <PrintLayoutView
              editorCanvasRef={editorCanvasRef} editor={editor}
              doc={doc} darkMode={darkMode} zoom={zoom}
              pageLayout={pageLayout} pageBg={pageBg}
              watermarkText={watermarkText}
              showHeaderFooter={showHeaderFooter}
              headerText={headerText} setHeaderText={setHeaderText}
              footerText={footerText} setFooterText={setFooterText}
              footnoteProps={footnoteProps}
              handleInsertComment={handleInsertComment}
              setDialogOpen={setDialogOpen}
              commentStore={commentStore} commentDispatch={commentDispatch}
              commentAuthor={commentAuthor}
              drawProps={drawProps}
              dynamicPageCount={dynamicPageCount}
            />
          )}
        </div>

        {/* Comment Panel (right side) */}
        {commentStore.markupMode === "all" && commentStore.showCommentsPanel && Object.keys(commentStore.comments).length > 0 && (
          <CommentPanel
            editor={editor}
            commentStore={commentStore}
            dispatch={commentDispatch}
            currentAuthor={commentAuthor}
          />
        )}
      </div>{/* end flex row */}
    </div>
  );
});

/**
 * 세로 눈금자 (cm 단위)
 */
function VerticalRuler({ pageH, zoom, darkMode }) {
  const totalCm = Math.ceil(pageH / PIXELS_PER_CM);
  const marks = [];
  for (let cm = 0; cm <= totalCm; cm++) {
    const yPx = cm * PIXELS_PER_CM * (zoom / 100);
    marks.push(
      <div key={`vc-${cm}`} style={{
        position: "absolute", right: 0, top: `${yPx}px`,
      }}>
        <div style={{ width: 8, height: 1, background: darkMode ? "#888" : "#666" }} />
        {cm > 0 && cm < totalCm && (
          <span style={{
            fontSize: 7, color: darkMode ? "#888" : "#777",
            position: "absolute", right: 10, top: -4,
            fontFamily: "'Segoe UI', sans-serif",
          }}>{cm}</span>
        )}
      </div>
    );
    const halfY = (cm + 0.5) * PIXELS_PER_CM * (zoom / 100);
    if (halfY < pageH * (zoom / 100)) {
      marks.push(
        <div key={`vh-${cm}`} style={{
          position: "absolute", right: 0, top: `${halfY}px`,
        }}>
          <div style={{ width: 4, height: 1, background: darkMode ? "#555" : "#aaa" }} />
        </div>
      );
    }
  }

  return (
    <div style={{
      width: 18, flexShrink: 0,
      background: darkMode ? "#2d2d2d" : "#f5f5f5",
      borderRight: `1px solid ${darkMode ? "#444" : "#ddd"}`,
      position: "sticky", top: 0, alignSelf: "flex-start",
      minHeight: `${pageH * (zoom / 100)}px`,
    }}>
      {marks}
    </div>
  );
}

/**
 * 모바일 흐름 뷰 — 전체 폭 사용, 페이지 경계/눈금자/줌 변환 없음.
 * A4 캔버스를 작은 화면에서 강제로 보여주면 가독성이 떨어지고 좌우 스크롤이 발생하므로
 * 본문을 자연스러운 흐름 형태로 렌더한다. 각주는 본문 하단에 일반 블록으로 함께 표시.
 */
function MobileFlowView({
  editorCanvasRef, editor, darkMode,
  handleInsertComment, setDialogOpen,
  footnoteProps, commentStore, commentDispatch,
}) {
  return (
    <div ref={editorCanvasRef} className="editor-mobile-flow" style={{
      background: darkMode ? "#1e1e1e" : "#fff",
      color: darkMode ? "#e5e7eb" : "#1f2937",
    }}>
      <EditorContent editor={editor} />
      {footnoteProps?.footnotes?.length > 0 && (
        <FootnoteArea
          editor={editor}
          footnotes={footnoteProps.footnotes}
          setFootnotes={footnoteProps.setFootnotes}
          onHeightChange={footnoteProps.setFootnoteAreaHeight}
          numberFormat={footnoteProps.footnoteNumberFormat}
          /* 모바일에서는 페이지 좌표 계산 대신 본문 끝 인라인 블록으로 렌더 */
          variant="blog"
          pageLayout={null}
          dynamicPageCount={1}
        />
      )}
      {footnoteProps?.endnotes?.length > 0 && (
        <EndnoteArea
          editor={editor}
          endnotes={footnoteProps.endnotes}
          setEndnotes={footnoteProps.setEndnotes}
          numberFormat={footnoteProps.endnoteNumberFormat}
        />
      )}
      <MobileSelectionBar
        editor={editor}
        onInsertComment={handleInsertComment}
        onOpenLink={() => setDialogOpen?.("hyperlink")}
      />
      <CommentIndicators editor={editor} commentStore={commentStore} dispatch={commentDispatch} />
    </div>
  );
}

/**
 * 웹 레이아웃 뷰
 */
function WebLayoutView({ editorCanvasRef, editor, doc, darkMode, handleInsertComment, setDialogOpen }) {
  return (
    <div ref={editorCanvasRef} style={{
      width: "100%", maxWidth: 900, padding: "20px 40px",
      background: darkMode ? "#2d2d2d" : "#fff",
      minHeight: "100%",
    }}>
      {doc.title && (
        <div style={{
          fontSize: 24, fontWeight: 700, color: darkMode ? "#eee" : "#1a1a1a",
          marginBottom: 8, fontFamily: "'Noto Serif KR', Georgia, serif",
        }}>{doc.title}</div>
      )}
      {doc.subtitle && (
        <div style={{ fontSize: 14, color: "#777", marginBottom: 20 }}>{doc.subtitle}</div>
      )}
      <EditorContent editor={editor} />
      <FloatingToolbar editor={editor} onInsertComment={handleInsertComment}
        onOpenImageEdit={() => setDialogOpen?.("imageEdit")} />
    </div>
  );
}

/**
 * 읽기 모드 뷰
 */
function ReadModeView({ editorCanvasRef, editor, doc, darkMode }) {
  return (
    <div ref={editorCanvasRef} style={{
      width: "100%", maxWidth: 800, padding: "40px 60px",
      background: darkMode ? "#2d2d2d" : "#fff",
      minHeight: "100%",
      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      margin: "0 auto",
    }}>
      {doc.title && (
        <div style={{
          fontSize: 28, fontWeight: 700, color: darkMode ? "#eee" : "#1a1a1a",
          marginBottom: 12, fontFamily: "'Noto Serif KR', Georgia, serif",
          borderBottom: "2px solid #1a2332", paddingBottom: 12,
        }}>{doc.title}</div>
      )}
      {doc.subtitle && (
        <div style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>{doc.subtitle}</div>
      )}
      {(doc.author || doc.publishedDate) && (
        <div style={{ fontSize: 12, color: "#999", marginBottom: 24 }}>
          {doc.author && <span>{doc.author}</span>}
          {doc.author && doc.publishedDate && <span> · </span>}
          {doc.publishedDate && <span>{doc.publishedDate}</span>}
        </div>
      )}
      <div className="ProseMirror"
        style={{
          fontFamily: "'맑은 고딕', sans-serif", fontSize: "11pt",
          lineHeight: 1.85, color: darkMode ? "#ddd" : "#1a1a1a",
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editor?.getHTML() || "") }}
      />
    </div>
  );
}

/**
 * A4 인쇄 모양 편집 뷰
 */
function PrintLayoutView({
  editorCanvasRef, editor, doc, darkMode, zoom,
  pageLayout, pageBg,
  watermarkText,
  showHeaderFooter, headerText, setHeaderText, footerText, setFooterText,
  footnoteProps, handleInsertComment,
  setDialogOpen,
  commentStore, commentDispatch, commentAuthor,
  drawProps,
  dynamicPageCount = 1,
}) {
  const { pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, PAGE_GAP = 20 } = pageLayout;
  const zoomR = zoom / 100;
  const guideColor = darkMode ? "#555" : "#c0c0c0";
  const pageCount = Math.max(1, Number(dynamicPageCount) || 1);
  const pageAreaMinHeight = pageCount * pageH + (pageCount - 1) * PAGE_GAP;

  return (
    <div style={{
      transform: `scale(${zoomR})`,
      transformOrigin: "top center",
      width: pageW,
      flexShrink: 0,
    }}>
      <div ref={editorCanvasRef} className="editor-page-area" style={{
        position: "relative",
        width: pageW,
        minHeight: pageAreaMinHeight,
        background: pageBg,
        boxShadow: darkMode
          ? "0 1px 4px rgba(0,0,0,0.5)"
          : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",
        border: darkMode ? "1px solid #444" : "none",
        paddingTop: marginTop,
        paddingBottom: marginBottom,
        paddingLeft: marginLeft,
        paddingRight: marginRight,
        boxSizing: "border-box",
      }}>

        {/* ── 마진 가이드라인 (Word 스타일: 모서리 L자 표시) ── */}
        <MarginGuides
          marginTop={marginTop} marginBottom={marginBottom}
          marginLeft={marginLeft} marginRight={marginRight}
          pageH={pageH} guideColor={guideColor}
        />

        {/* ── 워터마크 ── */}
        {watermarkText && (
          <div style={{
            position: "absolute", top: pageH / 2, left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 54, color: "rgba(192,192,192,0.25)",
            fontWeight: 300, whiteSpace: "nowrap", pointerEvents: "none",
            userSelect: "none", fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
            letterSpacing: 8, zIndex: 0,
          }}>{watermarkText}</div>
        )}

        {/* ── 머리글/바닥글 (1페이지) ── */}
        {showHeaderFooter && (
          <div style={{
            position: "absolute", top: 0, left: marginLeft, right: marginRight,
            height: marginTop, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9pt", color: "#aaa", zIndex: 1,
          }}>
            <HeaderArea
              value={headerText}
              onChange={setHeaderText}
              differentFirst={false}
              oddEvenDifferent={false}
              isFirstPage
              isOdd
            />
          </div>
        )}
        {showHeaderFooter && (
          <div style={{
            position: "absolute", bottom: 0, left: marginLeft, right: marginRight,
            height: marginBottom, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9pt", color: "#aaa", zIndex: 1,
          }}>
            <FooterArea
              value={footerText}
              onChange={setFooterText}
              differentFirst={false}
              oddEvenDifferent={false}
              isFirstPage
              isOdd
              pageNumber={1}
            />
          </div>
        )}

        {/* ── 제목 ── */}
        {doc.title && (
          <div style={{
            fontSize: 22, fontWeight: 700,
            color: darkMode ? "#eee" : "#1a1a1a",
            marginBottom: 8, fontFamily: "'Noto Serif KR', Georgia, serif",
          }}>{doc.title}</div>
        )}
        {doc.subtitle && (
          <div style={{
            fontSize: 14, color: "#777", marginBottom: 20,
            fontFamily: "'맑은 고딕', sans-serif",
          }}>{doc.subtitle}</div>
        )}

        {/* ── 에디터 본문 ── */}
        <EditorContent editor={editor} />
        <FootnoteArea editor={editor} footnotes={footnoteProps.footnotes} setFootnotes={footnoteProps.setFootnotes}
          onHeightChange={footnoteProps.setFootnoteAreaHeight} numberFormat={footnoteProps.footnoteNumberFormat}
          variant={doc.documentType === "blog" ? "blog" : "document"} pageLayout={pageLayout}
          dynamicPageCount={pageCount} />
        <EndnoteArea editor={editor} endnotes={footnoteProps.endnotes} setEndnotes={footnoteProps.setEndnotes}
          numberFormat={footnoteProps.endnoteNumberFormat} />
        <FloatingToolbar editor={editor} onInsertComment={handleInsertComment}
        onOpenImageEdit={() => setDialogOpen?.("imageEdit")} />
        <ContextMenu editor={editor}
          onOpenFontDialog={() => setDialogOpen("font")}
          onOpenParagraphDialog={() => setDialogOpen("paragraph")}
          onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
          onOpenTableDialog={() => setDialogOpen("table")}
          onInsertComment={handleInsertComment}
          commentStore={commentStore} commentDispatch={commentDispatch}
          commentAuthor={commentAuthor}
        />
        <CommentIndicators editor={editor} commentStore={commentStore} dispatch={commentDispatch} />
        {(drawProps?.drawOptions?.canvasActive || drawProps?.drawingState?.strokes?.length > 0) && (
          <DrawingOverlay
            activeTool={drawProps.drawOptions.activeTool}
            penColor={drawProps.drawOptions.penColor}
            penWidth={drawProps.drawOptions.penWidth}
            highlighterOpacity={drawProps.drawOptions.highlighterOpacity}
            drawingState={drawProps.drawingState}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 마진 가이드라인 (L자 코너 마커 8개)
 */
function MarginGuides({ marginTop, marginBottom, marginLeft, marginRight, pageH, guideColor }) {
  const style = { position: "absolute", pointerEvents: "none", zIndex: 4 };

  return (
    <>
      {/* 상단 좌 */}
      <div style={{ ...style, top: marginTop, left: marginLeft - 1, width: 12, height: 1, background: guideColor }} />
      <div style={{ ...style, top: marginTop, left: marginLeft - 1, width: 1, height: 12, background: guideColor }} />
      {/* 상단 우 */}
      <div style={{ ...style, top: marginTop, right: marginRight - 1, width: 12, height: 1, background: guideColor }} />
      <div style={{ ...style, top: marginTop, right: marginRight - 1, width: 1, height: 12, background: guideColor }} />
      {/* 하단 좌 */}
      <div style={{ ...style, top: pageH - marginBottom, left: marginLeft - 1, width: 12, height: 1, background: guideColor }} />
      <div style={{ ...style, top: pageH - marginBottom - 12, left: marginLeft - 1, width: 1, height: 12, background: guideColor }} />
      {/* 하단 우 */}
      <div style={{ ...style, top: pageH - marginBottom, right: marginRight - 1, width: 12, height: 1, background: guideColor }} />
      <div style={{ ...style, top: pageH - marginBottom - 12, right: marginRight - 1, width: 1, height: 12, background: guideColor }} />
    </>
  );
}
