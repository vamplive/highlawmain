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
import HomeTrustSection from "./HomeTrustSection";
import Footer from "../../components/layout/Footer";

const DEFAULT_HERO_VIDEO = "/videos/manhattan-panoramic.mp4";

function getInitialHeroVideo() {
  if (typeof window === "undefined") return DEFAULT_HERO_VIDEO;
  const cached = window.localStorage.getItem("activeHeroVideo");
  return cached && isSafeHttpUrl(cached) ? cached : DEFAULT_HERO_VIDEO;
}

export default function HomePage() {
  const [heroVideo, setHeroVideo] = useState(getInitialHeroVideo);
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

  return (
    <div ref={ref} className="hp-scroll-container">
      <style>{RESPONSIVE_STYLES}</style>
      <Seo
        path="/"
        title={copy.seoTitle}
        description={copy.seoDescription}
        jsonLd={buildLegalServiceJsonLd()}
      />

      <HomeHero heroVideo={heroVideo} settings={settings} copy={copy} />
      <HomePeopleSection copy={copy} settings={settings} />
      <HomePracticeSection lang={lang} copy={copy} settings={settings} />
      <HomeTrustSection />
      <HomeNewsSection settings={settings} />
      <HomeCtaSection copy={copy} settings={settings} />
      
      {/* 푸터 스냅 락을 차단하기 위해 스냅 컨테이너의 일부로 최하단 푸터 배치 */}
      <div style={{ scrollSnapAlign: "start", background: "#333333", width: "100%" }}>
        <Footer lang={lang} />
      </div>
    </div>
  );
}
