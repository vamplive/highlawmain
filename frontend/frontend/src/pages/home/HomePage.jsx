/** HomePage — 법무법인 하이로 메인 랜딩 페이지 (오케스트레이터) */
import { useState, useEffect } from "react";
import useReveal from "../../hooks/useReveal";
import { useLanguage, useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { api } from "../../utils/api";
import { isSafeHttpUrl } from "../../utils/safeUrl";
import Seo from "../../components/Seo";
import { buildLegalServiceJsonLd } from "../../lib/seo";
import { HOME_COPY, HOME_DEFAULTS, RESPONSIVE_STYLES } from "./homeTokens";
import "./home.css";
import HomeHero from "./HomeHero";
import HomeSolutionSection from "./HomeSolutionSection";
import HomePracticeSection from "./HomePracticeSection";
import HomePeopleSection from "./HomePeopleSection";
import HomeCtaSection from "./HomeCtaSection";
import Footer from "../../components/layout/Footer";

const DEFAULT_HERO_VIDEO = "/videos/manhattan-panoramic.mp4";

function getInitialHeroVideo() {
  if (typeof window === "undefined") return DEFAULT_HERO_VIDEO;
  const cached = window.localStorage.getItem("activeHeroVideo");
  return cached && isSafeHttpUrl(cached) ? cached : DEFAULT_HERO_VIDEO;
}

export default function HomePage() {
  const [heroVideo, setHeroVideo] = useState(getInitialHeroVideo);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useReveal();
  const lang = useLanguage();
  const copy = HOME_COPY[lang] || HOME_COPY.ko;
  const { settings } = useSiteSettingsPage("home", HOME_DEFAULTS, lang);

  // 활성 히어로 비디오 로드 (캐시 우선 → API 동기화)
  useEffect(() => {
    api.get("/hero-videos/active")
      .then((json) => {
        const url = json.data?.url;
        if (url && isSafeHttpUrl(url)) {
          setHeroVideo(url);
          localStorage.setItem("activeHeroVideo", url);
        }
      })
      .catch(() => {});
  }, []);

  // 다른 탭에서 비디오를 변경했을 때 동기화
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "activeHeroVideo" && e.newValue && isSafeHttpUrl(e.newValue)) {
        setHeroVideo(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 스냅 컨테이너 스크롤 감지 및 활성 인덱스 업데이트
  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    const vh = window.innerHeight || 720;
    // 50% 넘는 순간 바로 도트와 헤더 반응 전환이 활성화되도록 반올림 적용
    const index = Math.min(4, Math.max(0, Math.round(scrollTop / vh)));
    setActiveIndex(index);
  };

  // 특정 섹션으로 부드러운 스냅 스크롤 이동
  const scrollToSection = (index) => {
    const container = document.querySelector(".hp-snap-container");
    if (container) {
      const vh = window.innerHeight || 720;
      container.scrollTo({
        top: index * vh,
        behavior: "smooth"
      });
    }
  };

  return (
    <div ref={ref} className="hp-snap-container" onScroll={handleScroll}>
      <style>{RESPONSIVE_STYLES}</style>
      <Seo
        path="/"
        title={copy.seoTitle}
        description={copy.seoDescription}
        jsonLd={buildLegalServiceJsonLd()}
      />

      {/* 우측 페이지 도트 네비게이션 */}
      <div
        style={{
          position: "fixed",
          right: "24px",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          zIndex: 100,
        }}
      >
        {[0, 1, 2, 3, 4].map((idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              aria-label={`${idx + 1}번째 섹션으로 이동`}
              style={{
                width: isActive ? "12px" : "8px",
                height: isActive ? "12px" : "8px",
                borderRadius: "50%",
                background: isActive ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.4)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isActive ? "0 0 10px var(--accent-gold)" : "none",
                padding: 0,
                marginLeft: isActive ? "0px" : "2px",
              }}
            />
          );
        })}
      </div>

      <HomeHero heroVideo={heroVideo} settings={settings} copy={copy} />
      <HomeSolutionSection lang={lang} copy={copy} />
      <HomePeopleSection copy={copy} />
      <HomePracticeSection lang={lang} copy={copy} />
      <HomeCtaSection copy={copy} />
      
      {/* 푸터 스냅 락을 차단하기 위해 스냅 컨테이너의 일부로 최하단 푸터 배치 */}
      <div style={{ scrollSnapAlign: "start", background: "#333333", width: "100%" }}>
        <Footer lang={lang} />
      </div>
    </div>
  );
}
