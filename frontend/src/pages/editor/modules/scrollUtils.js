/**
 * 에디터 스크롤 유틸리티
 * — 커서 가시성 보장을 위한 자동 스크롤 함수
 */

/** 커서가 뷰포트 밖에 있으면 보이는 영역으로 스크롤 */
const SCROLL_EDGE_PADDING = 40;
/** 스크롤 후 커서가 위치할 뷰포트 비율 (0.4 = 화면의 40% 지점) */
const SCROLL_TARGET_RATIO = 0.4;
/** 에디터 스크롤 컨테이너 선택자 */
const SCROLL_CONTAINER_SELECTOR = ".editor-canvas-scroll";

/**
 * 커서가 보이는 영역으로 즉시 스크롤
 * - ProseMirror 기본 scrollIntoView 비활성화 시 사용
 * - 페이지네이션 갭 영역을 고려한 커스텀 스크롤
 */
export function scrollToCursor() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) return;

  const scrollEl = document.querySelector(SCROLL_CONTAINER_SELECTOR);
  if (!scrollEl) return;

  const containerRect = scrollEl.getBoundingClientRect();
  const cursorRelativeTop = rect.top - containerRect.top;
  const cursorRelativeBottom = rect.bottom - containerRect.top;
  const visibleHeight = containerRect.height;

  if (cursorRelativeBottom > visibleHeight - SCROLL_EDGE_PADDING) {
    // 커서가 아래로 벗어남 → 화면 40% 위치로
    const targetScroll = scrollEl.scrollTop + cursorRelativeBottom - visibleHeight + visibleHeight * SCROLL_TARGET_RATIO;
    scrollEl.scrollTo({ top: targetScroll, behavior: "auto" });
  } else if (cursorRelativeTop < SCROLL_EDGE_PADDING) {
    // 커서가 위로 벗어남
    const targetScroll = scrollEl.scrollTop + cursorRelativeTop - visibleHeight * SCROLL_TARGET_RATIO;
    scrollEl.scrollTo({ top: Math.max(0, targetScroll), behavior: "auto" });
  }
}
