import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { setLanguage } from "../../hooks/useSiteSettings";
import HamburgerButton from "./HamburgerButton";
import LogoCanvas from "./LogoCanvas";
import { NAV_DROPDOWN } from "./layoutConfig";

export default function Header({ heroTop, isLawyerDetail, menuOpen, onToggleMenu, navItems, lang }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


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
            <div className="hidden lg:block">
              <LogoCanvas
                size={34}
                color={heroTop ? "rgb(241, 190, 90)" : "#111111"}
                style={{ display: "block", transition: "color 0.5s ease" }}
              />
            </div>
            <div className="block lg:hidden">
              <LogoCanvas
                size={45}
                color={heroTop ? "rgb(241, 190, 90)" : "#111111"}
                style={{ display: "block", transition: "color 0.5s ease" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
              {/* Desktop brand title */}
              <span
                className="hidden lg:inline font-serif"
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
              {/* Mobile brand title: stacked */}
              <span
                className="inline-flex lg:hidden font-serif"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 15,
                  letterSpacing: "0.18em",
                  color: heroTop ? "#ffffff" : "var(--text-primary)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  transition: "color 0.5s ease",
                  lineHeight: 1.15,
                }}
              >
                <span>HIGHLAW</span>
                <span style={{ fontSize: 9.5, letterSpacing: "0.13em", marginTop: 2, fontWeight: "500" }}>LAWFIRM</span>
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

          {/* Desktop nav */}
          <nav
            className="hidden lg:grid grid-cols-6 items-center flex-shrink-0 lg:gap-3 xl:gap-4 lg:px-4 xl:px-6 lg:min-w-[560px] xl:min-w-[640px]"
            style={{ position: "relative" }}
            aria-label="주요 메뉴"
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            {navItems.map((item) => {
              const dropdownItems = NAV_DROPDOWN[item.to];
              return (
                <div
                  key={item.to}
                  onMouseEnter={() => {
                    if (dropdownItems) {
                      setIsDropdownOpen(true);
                    }
                  }}
                >
                  <NavLink
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
                      paddingLeft: 8,
                      paddingRight: 8,
                      borderBottom: isActive ? `1.5px solid ${heroTop ? "rgba(255,255,255,0.7)" : "var(--accent-gold)"}` : "1.5px solid transparent",
                      transition: "color 0.5s ease, border-color 0.5s ease",
                      display: "inline-block",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {item.label}
                  </NavLink>
                </div>
              );
            })}

            {/* 통합 대형 직사각형 드롭다운 */}
            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  paddingTop: 12,
                  zIndex: 100,
                  animation: "fadeIn 0.15s ease",
                }}
              >
                <div
                  className="grid grid-cols-6 lg:gap-3 xl:gap-4 lg:px-4 xl:px-6"
                  style={{
                    background: heroTop ? "rgba(10,20,38,0.96)" : "#fff",
                    border: heroTop ? "1px solid rgba(201,168,76,0.2)" : "1px solid #e8eaed",
                    borderRadius: 8,
                    boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                    backdropFilter: "blur(12px)",
                    paddingTop: 20,
                    paddingBottom: 20,
                  }}
                >
                  {navItems.map((item) => {
                    const dropdownItems = NAV_DROPDOWN[item.to] || [];
                    return (
                      <div
                        key={item.to}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6, // 상하 일관된 간격
                        }}
                      >
                        {dropdownItems.map((sub) => (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setIsDropdownOpen(false)}
                            style={{
                              display: "block",
                              padding: "6px 8px", // 좌우 상하 일관된 여백
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "Pretendard, 'Noto Sans KR', sans-serif",
                              letterSpacing: "0.04em",
                              color: heroTop ? "rgba(255,255,255,0.80)" : "var(--text-secondary)",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              transition: "background 0.15s, color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = heroTop ? "rgba(201,168,76,0.12)" : "#fdf6e8";
                              e.currentTarget.style.color = heroTop ? "#DEC584" : "var(--accent-gold)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = heroTop ? "rgba(255,255,255,0.80)" : "var(--text-secondary)";
                            }}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
