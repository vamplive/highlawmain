/** 미디어 쿼리 훅 — 화면 너비/모션·데이터 선호 감지에 사용 */
import { useEffect, useState } from "react";

/**
 * 주어진 미디어 쿼리의 현재 매칭 여부를 반환.
 * SSR 안전(window 미정의 시 false), 마운트 시 즉시 동기화.
 *
 * @param {string} query - 예: "(min-width: 768px)", "(prefers-reduced-data: reduce)"
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    let cancelled = false;
    const mql = window.matchMedia(query);
    queueMicrotask(() => {
      if (!cancelled) setMatches(mql.matches);
    });
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => {
      cancelled = true;
      mql.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}
