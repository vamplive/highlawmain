/** useReveal — 스크롤 시 요소 페이드인 애니메이션 훅 (IntersectionObserver) */
import { useLayoutEffect, useRef } from "react";

/**
 * 컨테이너 내 `.reveal` 클래스 요소가 뷰포트에 진입하면 `.visible`을 추가한다.
 * @returns {React.RefObject} 컨테이너 요소에 연결할 ref
 */
export default function useReveal() {
  const ref = useRef();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll(".reveal");
    if (targets.length === 0) return;

    targets.forEach((t) => t.classList.add("reveal-pending"));

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return ref;
}
