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
import HomePracticeSection from "./HomePracticeSection";
import HomePeopleSection from "./HomePeopleSection";
import HomeNewsSection from "./HomeNewsSection";
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

  // 윈도우 스크롤 감지 및 활성 인덱스 업데이트 (도트 하이라이트 동기화)
  useEffect(() => {
    const handleWindowScroll = () => {
      const sections = document.querySelectorAll(".hp-hero, .hp-section");
      if (sections.length === 0) return;
      
      const scrollPos = window.scrollY + window.innerHeight / 3;
      let currentIdx = 0;
      
      sections.forEach((sec, idx) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentIdx = idx;
        }
      });
      
      setActiveIndex(Math.min(4, Math.max(0, currentIdx)));
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    // 초기 감지 실행
    handleWindowScroll();
    
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  // 특정 섹션으로 부드러운 스크롤 이동
  const scrollToSection = (index) => {
    const sections = document.querySelectorAll(".hp-hero, .hp-section");
    const target = sections[index];
    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  return (
    <div ref={ref} className="hp-scroll-container">
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
          const isDarkSection = activeIndex === 0 || activeIndex === 4;
          return (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              aria-label={`${idx + 1}번째 섹션으로 이동`}
              style={{
                width: isActive ? "12px" : "8px",
                height: isActive ? "12px" : "8px",
                borderRadius: "50%",
                background: isActive
                  ? "var(--accent-gold)"
                  : isDarkSection
                    ? "rgba(255, 255, 255, 0.45)"
                    : "rgba(10, 22, 40, 0.35)",
                border: isActive
                  ? "1px solid var(--accent-gold)"
                  : isDarkSection
                    ? "1px solid rgba(255, 255, 255, 0.15)"
                    : "1px solid rgba(10, 22, 40, 0.15)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isActive
                  ? (isDarkSection ? "0 0 10px var(--accent-gold)" : "0 0 8px rgba(197, 168, 128, 0.6)")
                  : "none",
                padding: 0,
                marginLeft: isActive ? "0px" : "2px",
              }}
            />
          );
        })}
      </div>

      <HomeHero heroVideo={heroVideo} settings={settings} copy={copy} />
      <HomePeopleSection copy={copy} />
      <HomePracticeSection lang={lang} copy={copy} />
      <HomeNewsSection />
      <HomeCtaSection copy={copy} />
      
      {/* 푸터 스냅 락을 차단하기 위해 스냅 컨테이너의 일부로 최하단 푸터 배치 */}
      <div style={{ scrollSnapAlign: "start", background: "#333333", width: "100%" }}>
        <Footer lang={lang} />
      </div>
    </div>
  );
}
