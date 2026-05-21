/** 풀스크린 모바일 메뉴 — 햄버거 클릭 시 표시되는 전체 화면 네비게이션 */
import { Link, NavLink } from "react-router-dom";
import useFocusTrap from "../../hooks/useFocusTrap";

export default function MobileMenu({ open, onClose, navItems }) {
  const menuTrapRef = useFocusTrap(open, { onEscape: onClose });

  if (!open) return null;

  return (
    <div
      ref={menuTrapRef}
      id="primary-navigation"
      className="fixed inset-0 z-40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
      style={{ background: "rgba(15,25,35,0.97)", backdropFilter: "blur(24px)" }}
    >
      <nav className="text-center" aria-label="전체 메뉴 네비게이션">
        <NavLink to="/" end onClick={onClose}
          className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
          style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "var(--white-40)" }}>
          HOME
        </NavLink>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onClose}
            className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
            style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "var(--white-40)" }}>
            {item.label}
          </NavLink>
        ))}
        <div style={{ paddingTop: 48 }}>
          <Link to="/admin" onClick={onClose} className="view-more" style={{ color: "var(--accent-gold)", borderColor: "var(--white-15)" }}>관리자 페이지</Link>
        </div>
      </nav>
    </div>
  );
}
