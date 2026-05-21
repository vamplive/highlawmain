/**
 * usePagination — 워드 스타일 페이지 전환 로직
 * 에디터 콘텐츠를 페이지 단위로 분할하고,
 * VisualPagination 플러그인에 break 정보를 전달한다.
 */
import { useState, useRef, useEffect } from "react";
import { visualPaginationKey } from "../modules/pagination-extension";
import { scrollToCursor } from "../modules/scrollUtils";
import { MIN_FIRST_PAGE_HEIGHT } from "../modules/editorConstants";

const PAGE_GAP_DEFAULT = 20;

/**
 * @param {Object} params
 * @param {import("@tiptap/react").Editor} params.editor - TipTap 에디터 인스턴스
 * @param {string} params.viewMode - "edit" | "read" | "comment"
 * @param {boolean} params.darkMode - 다크모드 여부
 * @param {string|null} params.pageColor - 페이지 배경색
 * @param {number} params.pageW - 페이지 너비 (px)
 * @param {number} params.contentAreaHeight - 페이지당 콘텐츠 영역 높이
 * @param {number} params.marginTop - 상단 여백
 * @param {number} params.marginBottom - 하단 여백
 * @param {number} params.marginLeft - 좌측 여백
 * @param {number} params.marginRight - 우측 여백
 * @param {string} params.headerText - 머리글 텍스트
 * @param {string} params.footerText - 바닥글 텍스트
 * @param {number} params.PAGE_GAP - 페이지 간격
 * @param {React.RefObject} params.editorCanvasRef - 에디터 캔버스 DOM ref
 * @param {function} params.setDynamicPageCount - 동적 페이지 수 setter
 */
export default function usePagination({
  editor,
  viewMode,
  darkMode,
  pageColor,
  pageW,
  contentAreaHeight,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  headerText,
  footerText,
  PAGE_GAP = PAGE_GAP_DEFAULT,
  editorCanvasRef,
  setDynamicPageCount,
}) {
  const [pageBreaks, setPageBreaks] = useState([]);
  const paginationSignatureRef = useRef("");
  const pageBreakTimer = useRef(null);

  const pageBg = darkMode ? "#2d2d2d" : (pageColor || "#fff");
  const canvasBg = darkMode ? "#1e1e1e" : "#e8e8e8";

  useEffect(() => {
    if (!editor) return;

    if (viewMode !== "edit") {
      if (paginationSignatureRef.current) {
        paginationSignatureRef.current = "";
        editor.view.dispatch(editor.state.tr.setMeta(visualPaginationKey, { breaks: [] }));
      }
      return;
    }

    const resolveRunningText = (value, pageNumber) =>
      (value || "").replace(/\{PAGE\}/g, String(pageNumber));

    const buildBreakSpec = (pos, nextPage, afterPage) => ({
      pos,
      page: nextPage,
      afterPage,
      pageWidth: pageW,
      pageGap: PAGE_GAP,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      pageBg,
      canvasBg,
      guideColor: darkMode ? "#555" : "#c0c0c0",
      labelColor: darkMode ? "#777" : "#aaa",
      shadowColor: darkMode ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.08)",
      headerText: resolveRunningText(headerText, nextPage),
      footerText: resolveRunningText(footerText, afterPage),
    });

    const applyPageBreaks = () => {
      if (!editor || editor.isDestroyed) return;
      let dom;
      try { dom = editor.view?.dom; } catch { return; }
      if (!dom || contentAreaHeight <= 0) return;

      const docEntries = [];
      editor.state.doc.forEach((node, offset) => {
        docEntries.push({ node, offset });
      });

      const firstPageOffset = Math.max(0, dom.offsetTop - marginTop);
      const firstPageHeight = Math.max(MIN_FIRST_PAGE_HEIGHT, contentAreaHeight - firstPageOffset);
      let pageNum = 1;
      let pageTop = 0;
      let pageBottom = firstPageHeight;
      let existingGapHeight = 0;
      let docIndex = 0;
      let pendingForcedBreaks = 0;
      const breaks = [];

      for (const child of Array.from(dom.children)) {
        if (!(child instanceof HTMLElement)) continue;

        if (child.dataset.pageGap === "true") {
          existingGapHeight += child.offsetHeight;
          continue;
        }

        const entry = docEntries[docIndex++];
        if (!entry) break;

        const nodeType = entry.node.type.name;
        const sectionType = entry.node.attrs?.sectionType || "next-page";
        const isForcedBreakNode = nodeType === "pageBreak"
          || (nodeType === "sectionBreak" && sectionType !== "continuous");

        if (isForcedBreakNode) {
          pendingForcedBreaks += 1;
          continue;
        }

        if (entry.node.attrs?.pageBreakBefore) pendingForcedBreaks += 1;

        const realTop = child.offsetTop - existingGapHeight;
        const realBottom = realTop + child.offsetHeight;
        const fitsSinglePage = child.offsetHeight <= contentAreaHeight;

        while (pendingForcedBreaks > 0) {
          breaks.push(buildBreakSpec(entry.offset, pageNum + 1, pageNum));
          pageNum += 1;
          pageTop = realTop;
          pageBottom = realTop + contentAreaHeight;
          pendingForcedBreaks -= 1;
        }

        while (realTop >= pageBottom - 1) {
          pageNum += 1;
          pageTop = pageBottom;
          pageBottom = pageTop + contentAreaHeight;
        }

        if (realBottom <= pageBottom + 1) continue;

        if (fitsSinglePage && realTop > pageTop + 1) {
          breaks.push(buildBreakSpec(entry.offset, pageNum + 1, pageNum));
          pageNum += 1;
          pageTop = realTop;
          pageBottom = realTop + contentAreaHeight;
          continue;
        }

        while (realBottom > pageBottom + 1) {
          pageNum += 1;
          pageBottom += contentAreaHeight;
        }
      }

      pageNum += pendingForcedBreaks;
      setDynamicPageCount(Math.max(1, pageNum));
      setPageBreaks(breaks);

      const signature = JSON.stringify({
        breaks: breaks.map(({ pos, page, afterPage }) => [pos, page, afterPage]),
        pageW,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        pageBg,
        canvasBg,
        headerText,
        footerText,
      });

      if (signature !== paginationSignatureRef.current) {
        paginationSignatureRef.current = signature;
        editor.view.dispatch(editor.state.tr.setMeta(visualPaginationKey, { breaks }));
      }

      scrollToCursor();
    };

    const schedulePagination = () => {
      if (pageBreakTimer.current) cancelAnimationFrame(pageBreakTimer.current);
      pageBreakTimer.current = requestAnimationFrame(applyPageBreaks);
    };

    editor.on("update", schedulePagination);
    editor.on("selectionUpdate", scrollToCursor);
    const timer = setTimeout(schedulePagination, 100);
    const ro = new ResizeObserver(schedulePagination);
    // view 마운트 이후로 미뤄야 editor.view 게터가 throw하지 않음
    const observeTimer = setTimeout(() => {
      try {
        const dom = editor.view?.dom;
        if (dom) ro.observe(dom);
      } catch { /* view 미준비 — 무시 */ }
      if (editorCanvasRef.current) ro.observe(editorCanvasRef.current);
    }, 0);

    return () => {
      editor.off("update", schedulePagination);
      editor.off("selectionUpdate", scrollToCursor);
      clearTimeout(timer);
      clearTimeout(observeTimer);
      if (pageBreakTimer.current) cancelAnimationFrame(pageBreakTimer.current);
      ro.disconnect();
    };
  }, [
    editor,
    viewMode,
    contentAreaHeight,
    pageW,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    pageBg,
    canvasBg,
    darkMode,
    headerText,
    footerText,
    PAGE_GAP,
    editorCanvasRef,
    setDynamicPageCount,
  ]);

  return { pageBreaks, pageBg, canvasBg };
}
