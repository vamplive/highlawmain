/** 공개 페이지 레이아웃 — 헤더, 모바일 메뉴, 푸터 등 하위 컴포넌트를 합성하는 셸 */
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSiteSettingsPage, useLanguage } from "../hooks/useSiteSettings";
import Announcements from "./Announcements";
import ChatWidget from "./ChatWidget";
import FloatingContact from "./FloatingContact";
import Header from "./layout/Header";
import MobileMenu from "./layout/MobileMenu";
import Footer from "./layout/Footer";
import useHeaderScroll from "./layout/useHeaderScroll";
import { LAYOUT_DEFAULTS, NAV_EN } from "./layout/layoutConfig";
import PrivacyConsentBanner from "./PrivacyConsentBanner";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const scrolled = useHeaderScroll();
  const navItems = lang === "en" ? NAV_EN : settings.nav.items;

  const isHome = pathname === "/";
  const isLawyerDetail = pathname.startsWith("/lawyers/");
  const isAbout = pathname === "/about";
  const heroTop = (isHome || isLawyerDetail || isAbout) && !scrolled && !menuOpen;

  // 라우트 변경 시 메뉴 닫고 페이지 최상단으로 스크롤
  useEffect(() => {
    let cancelled = false;
    window.scrollTo(0, 0);
    queueMicrotask(() => {
      if (!cancelled) setMenuOpen(false);
    });
    return () => { cancelled = true; };
  }, [pathname]);

  // 풀스크린 메뉴가 열려 있을 때 배경 스크롤 잠금
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* 키보드 사용자용 스킵 링크 */}
      <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>

      <Announcements />

      <Header
        heroTop={heroTop}
        isLawyerDetail={isLawyerDetail}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        navItems={navItems}
        lang={lang}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={navItems}
      />

      <main id="main-content" className="flex-1" tabIndex={-1}><Outlet /></main>

      {!isHome && <Footer isLawyerDetail={isLawyerDetail} lang={lang} />}

      {/* 플로팅 위젯 — 카카오톡 + 전화 스택 */}
      <ChatWidget />
      <FloatingContact />
      <PrivacyConsentBanner />
    </div>
  );
}
