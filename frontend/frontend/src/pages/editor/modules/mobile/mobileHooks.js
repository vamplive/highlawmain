/**
 * 모바일 에디터 전용 인터랙션 훅 모음
 *
 * - useVisualViewport: VisualViewport API로 키보드 높이 / 화면 가용 영역을 추적.
 *   키보드가 올라온 만큼 하단 sticky 바를 위로 들어 올려 본문 가림을 방지.
 * - useHapticFeedback: Vibration API 단일 진동. 굵게 토글 등에서 짧은 피드백.
 * - useSwipeGestures: 좌/우 스와이프 제스처 콜백 등록.
 * - useEditorSelectionRect: TipTap selection rect를 React 상태로 전달.
 */
import { useCallback, useEffect, useState } from "react";

const KEYBOARD_THRESHOLD_PX = 80;

/**
 * VisualViewport API로 키보드 상태를 추적.
 * 모바일 사파리/안드로이드 크롬에서 가상 키보드는 `window.innerHeight`를 변경하지 않고
 * `visualViewport.height`만 줄이므로 이 차이를 키보드 높이로 환산한다.
 *
 * @returns {{ height: number, offsetTop: number, keyboardHeight: number, keyboardOpen: boolean }}
 */
export function useVisualViewport() {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { height: 0, offsetTop: 0, keyboardHeight: 0, keyboardOpen: false };
    const vv = window.visualViewport;
    if (!vv) return { height: window.innerHeight, offsetTop: 0, keyboardHeight: 0, keyboardOpen: false };
    return {
      height: vv.height,
      offsetTop: vv.offsetTop || 0,
      keyboardHeight: Math.max(0, window.innerHeight - vv.height),
      keyboardOpen: window.innerHeight - vv.height > KEYBOARD_THRESHOLD_PX,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return undefined;
    const vv = window.visualViewport;
    const sync = () => {
      const kb = Math.max(0, window.innerHeight - vv.height);
      setState({
        height: vv.height,
        offsetTop: vv.offsetTop || 0,
        keyboardHeight: kb,
        keyboardOpen: kb > KEYBOARD_THRESHOLD_PX,
      });
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  return state;
}

/**
 * 짧은 진동 피드백.
 * @param {number} duration - ms (default 10)
 */
export function useHapticFeedback() {
  return useCallback((duration = 10) => {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate === "function") {
      try { navigator.vibrate(duration); } catch { /* ignore */ }
    }
  }, []);
}

/**
 * 좌/우 스와이프 제스처 등록 (수직 우세한 경우 무시).
 * @param {React.RefObject<HTMLElement>} ref
 * @param {{ onSwipeRight?: ()=>void, onSwipeLeft?: ()=>void, threshold?: number, edgeOnly?: boolean }} opts
 */
export function useSwipeGestures(ref, { onSwipeRight, onSwipeLeft, threshold = 70, edgeOnly = true } = {}) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;
    let startX = 0, startY = 0, startTime = 0;
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    };
    const onEnd = (e) => {
      const t = e.changedTouches?.[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      if (dt > 600) return;
      if (Math.abs(dy) > 60) return;
      if (Math.abs(dx) < threshold) return;
      // edgeOnly: 우측 스와이프는 화면 좌측 가장자리에서만 시작했을 때만 활성 (사이드바 열기 패턴)
      if (edgeOnly && dx > 0 && startX > 30) return;
      if (dx > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [ref, onSwipeRight, onSwipeLeft, threshold, edgeOnly]);
}

/**
 * 두 손가락 탭 감지 (실행 취소 등에 활용).
 */
export function useTwoFingerTap(ref, onTap) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;
    let lastCount = 0;
    let lastTime = 0;
    const onStart = (e) => {
      lastCount = e.touches.length;
      lastTime = Date.now();
    };
    const onEnd = () => {
      if (lastCount === 2 && Date.now() - lastTime < 250) onTap?.();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [ref, onTap]);
}

/**
 * TipTap selection이 비어있지 않을 때 좌표(rect)를 반환.
 * @param {import("@tiptap/react").Editor} editor
 * @returns {{ rect: DOMRect | null, hasSelection: boolean }}
 */
export function useEditorSelectionRect(editor) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => {
      try {
        const { selection } = editor.state;
        if (!selection || selection.empty) { setRect(null); return; }
        const { from, to } = selection;
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const top = Math.min(start.top, end.top);
        const bottom = Math.max(start.bottom, end.bottom);
        const left = Math.min(start.left, end.left);
        const right = Math.max(start.right, end.right);
        setRect({ top, bottom, left, right, width: right - left, height: bottom - top });
      } catch {
        setRect(null);
      }
    };
    editor.on("selectionUpdate", update);
    editor.on("blur", () => setRect(null));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  return { rect, hasSelection: rect !== null };
}
