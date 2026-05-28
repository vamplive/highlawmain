/** 좌측 슬라이드인 모바일 메뉴 — 햄버거 클릭 시 좌측에서 사이드바 형태로 표시되는 네비게이션 */
import { Link, NavLink } from "react-router-dom";
import useFocusTrap from "../../hooks/useFocusTrap";

export default function MobileMenu({ open, onClose, navItems }) {
  const menuTrapRef = useFocusTrap(open, { onEscape: onClose });

  if (!open) return null;

  return (
    <>
      {/* 백드롭 레이어: 클릭 시 메뉴 닫힘 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
        style={{
          opacity: 1,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* 좌측 사이드바 패널 */}
      <div
        ref={menuTrapRef}
        id="primary-navigation"
        className="fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[80vw] h-full flex flex-col justify-between p-8 border-r border-white/10"
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        style={{
          background: "#050505", // 파비콘 배경에 맞춘 프리미엄 리치 블랙
          boxShadow: "10px 0 30px rgba(0,0,0,0.5)",
          animation: "slideIn 0.3s ease-out forwards",
        }}
      >
        <div className="flex flex-col">
          {/* 상단 닫기 헤더 */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="메뉴 닫기"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                lineHeight: 1,
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>

          {/* 네비게이션 목록 */}
          <nav className="flex flex-col gap-5" aria-label="전체 메뉴 네비게이션">
            <NavLink
              to="/"
              end
              onClick={onClose}
              className="block font-serif transition-colors duration-300 hover:text-[#DEC584] py-1"
              style={({ isActive }) => ({
                fontSize: "clamp(18px, 4vw, 22px)",
                fontWeight: 300,
                letterSpacing: "0.1em",
                color: isActive ? "#DEC584" : "rgba(255, 255, 255, 0.6)",
                textDecoration: "none",
              })}
            >
              HOME
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="block font-serif transition-colors duration-300 hover:text-[#DEC584] py-1"
                style={({ isActive }) => ({
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                  color: isActive ? "#DEC584" : "rgba(255, 255, 255, 0.6)",
                  textDecoration: "none",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 하단 관리자 링크 */}
        <div style={{ paddingTop: 28, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <Link
            to="/admin"
            onClick={onClose}
            className="view-more"
            style={{
              color: "#DEC584",
              borderColor: "rgba(255, 255, 255, 0.15)",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            관리자 페이지
          </Link>
        </div>
      </div>
    </>
  );
}
