import { Link, NavLink, useLocation } from "react-router-dom";
import { setLanguage } from "../../hooks/useSiteSettings";
import HamburgerButton from "./HamburgerButton";
import LogoCanvas from "./LogoCanvas";

export default function Header({ heroTop, isLawyerDetail, menuOpen, onToggleMenu, navItems, lang }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: heroTop ? (isLawyerDetail ? "#333333" : "transparent") : "rgba(255,255,255,0.95)",
        borderBottom: heroTop ? "1px solid var(--white-15)" : "1px solid var(--border-color)",
        backdropFilter: heroTop ? "none" : "blur(16px)",
      }}
    >
      {/* Utility bar — Separator line deleted */}
      <div style={{ borderBottom: "none" }}>
        <div className="container flex items-center justify-between" style={{ height: 30 }}>
          {/* Utility Logo text deleted as requested */}
          <div className="flex gap-4" style={{ fontSize: 12, visibility: "hidden" }}>
            HIGH & LAW FIRM
          </div>
          <div className="hidden md:flex gap-6 items-center" style={{ fontSize: 9, color: heroTop ? "var(--white-40)" : "var(--text-muted)", transition: "color 0.5s ease" }}>
            <button onClick={() => setLanguage(lang === "ko" ? "en" : "ko")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 9, letterSpacing: "0.15em", padding: 0 }}
              aria-label="언어 전환 (한국어/English)">
              한/EN
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container" style={{ height: 78, position: "relative" }}>
        <div className="flex items-center justify-between h-full" style={{ gap: 20 }}>
          {/* Burger menu shifted slightly inward (negative margin removed) */}
          <div className="flex items-center" style={{ gap: 14 }}>
            <HamburgerButton menuOpen={menuOpen} onToggle={onToggleMenu} heroTop={heroTop} />
          </div>

          {/* 상단 중앙 브랜드 엠블럼 + 텍스트 세트 (엠블럼 및 폰트 크기 증대 적용) */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              textDecoration: "none",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          >
            <LogoCanvas
              size={34}
              color={heroTop ? "rgb(241, 190, 90)" : "#111111"}
              style={{ display: "block", transition: "color 0.5s ease" }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
              <span
                className="font-serif"
                style={{
                  fontSize: 15,
                  letterSpacing: "0.18em",
                  color: heroTop ? "#ffffff" : "var(--text-primary)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  transition: "color 0.5s ease",
                }}
              >
                HIGHLAW LAW FIRM
              </span>
              <span
                className="font-serif"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  color: heroTop ? "rgba(255,255,255,0.7)" : "var(--text-secondary)",
                  fontWeight: "400",
                  marginTop: 2,
                  transition: "color 0.5s ease",
                }}
              >
                법무법인 하이로
              </span>
            </div>
          </Link>

          {/* Desktop nav — 영어 둔탁함 개선을 위해 폰트 패밀리 강제 통일 및 자간 조정 */}
          <nav className="hidden lg:flex items-center gap-8 flex-shrink-0" aria-label="주요 메뉴">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="transition-colors duration-300"
                style={({ isActive }) => ({
                  fontFamily: "Pretendard, 'Noto Sans KR', -apple-system, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  fontWeight: isActive ? 500 : 400,
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: isActive
                    ? (heroTop ? "#fff" : "var(--text-primary)")
                    : (heroTop ? "rgba(255,255,255,0.65)" : "var(--text-muted)"),
                  paddingBottom: 4,
                  borderBottom: isActive ? `1.5px solid ${heroTop ? "rgba(255,255,255,0.7)" : "var(--accent-gold)"}` : "1.5px solid transparent",
                  transition: "color 0.5s ease, border-color 0.5s ease",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

        </div>
      </div>
    </header>
  );
}
