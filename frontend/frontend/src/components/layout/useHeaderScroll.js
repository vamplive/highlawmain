/** 헤더 배경 전환을 위한 스크롤 감지 훅 — 60px 초과 시 scrolled=true */
import { useEffect, useState } from "react";

export default function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = null;
    const fn = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        rafId = null;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      window.removeEventListener("scroll", fn);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return scrolled;
}
