/** 헤더 배경 전환을 위한 스크롤 감지 훅 — 60px 초과 시 scrolled=true */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    let rafId = null;

    // 새로운 페이지 진입 시 스크롤 상태 초기화
    setScrolled(false);

    const fn = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const snapContainer = document.querySelector(".hp-snap-container");
        const scrollPos = snapContainer ? snapContainer.scrollTop : window.scrollY;
        setScrolled(scrollPos > 60);
        rafId = null;
      });
    };

    // capture: true 옵션을 사용하여 .hp-snap-container 내부의 scroll 이벤트까지 window에서 캡처할 수 있도록 설정
    window.addEventListener("scroll", fn, { capture: true, passive: true });
    
    // DOM 렌더링 후 초기 스크롤 위치 반영을 위해 지연 호출
    const timer = setTimeout(fn, 100);

    return () => {
      window.removeEventListener("scroll", fn, { capture: true });
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return scrolled;
}

