/**
 * 모바일 하단 빠른 이동 바 — 가장 자주 쓰는 5개 ERP 페이지를 항상 손가락 닿기 좋은
 * 위치에 노출한다. 햄버거 메뉴를 매번 열지 않아도 핵심 화면 사이를 이동 가능.
 *
 * 모바일(<899px) 에서만 렌더링되며, 페이지 콘텐츠는 하단 70px 만큼 padding 으로 비켜둔다.
 */
import { NavLink } from "react-router-dom";

const QUICK_LINKS = [
  { to: "/admin", label: "홈", icon: "home", end: true },
  { to: "/admin/clients", label: "의뢰인", icon: "users" },
  { to: "/admin/tasks", label: "업무", icon: "check" },
  { to: "/admin/time-entries", label: "시간", icon: "clock" },
  { to: "/admin/court-dates", label: "일정", icon: "calendar" },
];

const ICONS = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
  users: <><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
};

function Icon({ name }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function MobileBottomNav() {
  return (
    <nav
      aria-label="빠른 이동"
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        zIndex: 30,
        display: "flex",
        background: "#fff",
        borderTop: "1px solid #e5e8ed",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px))",
      }}
    >
      {QUICK_LINKS.map((link) => (
        <NavLink
          key={link.to} to={link.to} end={link.end}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3,
            padding: "10px 4px 8px",
            color: isActive ? "#4f46e5" : "#64748b",
            background: isActive ? "rgba(79,70,229,0.06)" : "transparent",
            textDecoration: "none",
            fontSize: 11, fontWeight: isActive ? 700 : 500,
            transition: "color 150ms ease",
            minHeight: 56,
          })}
        >
          <Icon name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
