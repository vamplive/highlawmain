/** 모달용 포커스 트랩 — Tab/Shift+Tab이 모달 내부를 순환하도록 가둠 */
import { useEffect, useRef } from "react";

/** 포커스 가능한 셀렉터 (tabindex=-1은 제외) */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * 활성 트랩 스택. 중첩 모달이 열렸을 때 가장 위(top)의 트랩만 키 이벤트를 처리한다.
 * 동일 document에 여러 트랩이 동시 존재할 때 outer 트랩이 inner의 Tab을 가로채
 * 포커스를 outer 모달로 끌어가는 버그를 방지한다.
 */
const trapStack = [];

/**
 * 컨테이너 ref를 반환. 모달이 활성일 때 내부 포커스 트랩 활성화.
 * @param {boolean} active — true면 트랩 활성
 * @param {{ onEscape?: () => void, autoFocus?: boolean }} options
 */
export default function useFocusTrap(active, { onEscape, autoFocus = true } = {}) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement;

    // 첫 포커스 가능한 요소로 포커스 이동
    if (autoFocus) {
      const first = container.querySelector(FOCUSABLE_SELECTOR);
      if (first) first.focus();
      else container.focus();
    }

    function handleKey(e) {
      // 스택 최상단 트랩만 처리. 중첩 모달의 outer 트랩은 무시한다.
      if (trapStack[trapStack.length - 1] !== handleKey) return;

      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    trapStack.push(handleKey);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      const idx = trapStack.indexOf(handleKey);
      if (idx !== -1) trapStack.splice(idx, 1);
      // 모달이 닫히면 이전 포커스 요소로 복귀
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [active, onEscape, autoFocus]);

  return containerRef;
}
