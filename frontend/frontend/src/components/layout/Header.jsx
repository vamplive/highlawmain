/** 공개 페이지 상단 헤더 — 유틸리티 바, 햄버거, 데스크톱 네비를 포함 */
import { Link, NavLink } from "react-router-dom";
import { setLanguage } from "../../hooks/useSiteSettings";
import HamburgerButton from "./HamburgerButton";

export default function Header({ heroTop, isLawyerDetail, menuOpen, onToggleMenu, navItems, lang }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: heroTop ? (isLawyerDetail ? "#333333" : "transparent") : "rgba(255,255,255,0.95)",
        borderBottom: heroTop ? "1px solid var(--white-15)" : "1px solid var(--border-color)",
        backdropFilter: heroTop ? "none" : "blur(16px)",
      }}
    >
      {/* Utility bar */}
      <div style={{ borderBottom: heroTop ? "1px solid var(--white-08)" : "1px solid var(--border-subtle)" }}>
        <div className="container flex items-center justify-between" style={{ height: 30 }}>
          <div className="flex gap-4" style={{ fontSize: 12 }}>
            <Link
              to="/"
              className="font-serif hover:opacity-75 transition-opacity"
              style={{
                letterSpacing: "0.25em",
                color: heroTop ? "#ffffff" : "var(--text-primary)",
                fontWeight: "400",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
              aria-label="HIGH & LAW FIRM 홈"
            >
              HIGH & LAW FIRM
            </Link>
          </div>
          <div className="hidden md:flex gap-6 items-center" style={{ fontSize: 10, color: heroTop ? "var(--white-40)" : "var(--text-muted)" }}>
            <button onClick={() => setLanguage(lang === "ko" ? "en" : "ko")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 10, letterSpacing: "0.1em", padding: 0 }}
              aria-label="언어 전환 (한국어/English)">
              한/EN
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container" style={{ height: 78 }}>
        <div className="flex items-center justify-between h-full" style={{ gap: 20 }}>
          <div className="flex items-center" style={{ gap: 14, marginLeft: "-16px" }}>
            <HamburgerButton menuOpen={menuOpen} onToggle={onToggleMenu} heroTop={heroTop} />

            <Link
              to="/"
              aria-label="법무법인 하이로 HIGHLAW 홈"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <img
                src="/brand/highlaw-mark-square.png"
                alt="HIGHLAW 법무법인 하이로 로고"
                style={{ height: 48, width: "auto", display: "block" }}
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 flex-shrink-0" aria-label="주요 메뉴">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="nav-text transition-colors duration-300"
                style={({ isActive }) => ({
                  color: isActive
                    ? (heroTop ? "#fff" : "var(--text-primary)")
                    : (heroTop ? "rgba(255,255,255,0.6)" : "var(--text-muted)"),
                  paddingBottom: 4,
                  borderBottom: isActive ? `1px solid ${heroTop ? "rgba(255,255,255,0.65)" : "var(--accent-gold)"}` : "1px solid transparent",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="lg:hidden" style={{ width: 44 }} />
        </div>
      </div>
    </header>
  );
}
