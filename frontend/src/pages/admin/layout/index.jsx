/**
 * AdminLayout — 프리미엄 로펌 관리자 레이아웃
 * 다크 그라디언트 사이드바 + 골드 악센트 + 세련된 타이포그래피
 */
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import useMediaQuery from "../../../hooks/useMediaQuery";

/* 홈페이지 기반 디자인 토큰 — 딥 네이비 사이드바 + 골드 액센트 */
const THEME = {
  /* 사이드바 — 홈페이지 bg-dark (#0b1f3a) */
  sidebarBg: "#0b1f3a",
  sidebarBorder: "rgba(255,255,255,0.08)",
  /* 골드 액센트 — 홈페이지 --accent-gold */
  accent: "#c9a84c",
  accentLight: "#b8923e",
  accentDim: "rgba(201,168,76,0.14)",
  accentText: "#c9a84c",
  /* 사이드바 텍스트 (다크 배경 위) */
  sidebarText: "rgba(255,255,255,0.82)",
  sidebarTextMuted: "rgba(255,255,255,0.40)",
  sidebarActiveText: "#c9a84c",
  sidebarActiveBg: "rgba(201,168,76,0.12)",
  sidebarHoverBg: "rgba(255,255,255,0.06)",
  /* 본문 */
  pageBg: "#f5f7fa",
  white: "#ffffff",
  border: "rgba(11,31,58,0.12)",
  text: "#0b1f3a",
  textSec: "#4a5568",
  textMuted: "#8a97a8",
};

/**
 * 2단계 트리 내비게이션
 * ─ 홈페이지(사이트) 관련 기능과 포털(인트라넷) 관련 기능을 명확히 분리
 */
const MENU_TREE = [
  { id: "dashboard", to: "/admin", label: "대시보드", icon: "grid", end: true },

  // ── 사건·고객 업무 ──────────────────────────────────
  {
    id: "casework",
    label: "사건관리",
    icon: "briefcase",
    children: [
      { to: "/admin/cases", label: "사건" },
      { to: "/admin/bookings", label: "예약" },
      { to: "/admin/clients", label: "고객" },
      { to: "/admin/court-dates", label: "법정 일정" },
      { to: "/admin/tasks", label: "업무" },
      { to: "/admin/time-entries", label: "시간 기록" },
      { to: "/admin/trust-accounts", label: "예치금" },
    ],
  },
  {
    id: "contracts",
    label: "문서·계약",
    icon: "file",
    children: [
      { to: "/admin/contracts", label: "계약서" },
      { to: "/admin/contract-templates", label: "계약서 양식" },
      { to: "/admin/receipts", label: "영수증" },
      { to: "/admin/invitations", label: "발송 링크" },
    ],
  },
  // ── 홈페이지 관련 ────────────────────────────────────
  {
    id: "homepage-mgmt",
    label: "홈페이지 관리",
    icon: "globe",
    children: [
      { to: "/admin/site-manager", label: "홈 편집" },
      { to: "/admin/chatbot", label: "상담 챗봇" },
      { to: "/admin/documents", label: "자료실·문서" },
      { to: "/admin/media", label: "미디어" },
      { to: "/admin/editor", label: "에디터" },
    ],
  },
  {
    id: "promo-contents",
    label: "홍보 및 콘텐츠",
    icon: "edit",
    children: [
      { to: "/admin/blog", label: "블로그·뉴스" },
      { to: "/admin/inquiry", label: "법률 Q&A" },
      { to: "/admin/reviews", label: "후기" },
      { to: "/admin/lectures", label: "강의" },
    ],
  },


  // ── 포털(인트라넷) 관련 ───────────────────────────────
  {
    id: "portal",
    label: "포털 관리",
    icon: "users",
    children: [
      { to: "/admin/portal-users", label: "회원 승인" },
      { to: "/admin/portal-members", label: "구성원 관리" },
      { to: "/admin/organization", label: "조직도 & 결재 관리" },
      { to: "/admin/portal-board-admin", label: "게시판 관리" },
      { to: "/admin/portal-time-overview", label: "업무시간 현황" },
    ],
  },
  {
    id: "system",
    label: "시스템",
    icon: "settings",
    children: [
      { to: "/admin/settings", label: "설정" },
      { to: "/admin/analytics", label: "분석" },
      { to: "/admin/lawyer-revenue", label: "변호사 매출" },
      { to: "/admin/ar-aging", label: "미수금 분석" },
      { to: "/admin/audit-logs", label: "감사 로그" },
    ],
  },
];

/**
 * 현재 경로에 매칭되는 (상위, 하위) 항목을 찾는다.
 * 상위만 라우트인 경우(자식 없음)는 child 가 null.
 */
function findActive(pathname) {
  for (const group of MENU_TREE) {
    if (group.children) {
      for (const child of group.children) {
        if (pathname === child.to || pathname.startsWith(child.to + "/")) {
          return { group, child };
        }
      }
    } else if (group.to) {
      const matched = group.end ? pathname === group.to : pathname.startsWith(group.to);
      if (matched) return { group, child: null };
    }
  }
  return { group: null, child: null };
}

/** 사이드바 아이콘 SVG */
function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    video: <><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    contact: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    star: <><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    receipt: <><path d="M6 2h12a1 1 0 011 1v18l-3-2-3 2-3-2-3 2-3-2-3 2V3a1 1 0 011-1z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    left: <><polyline points="15,18 9,12 15,6"/></>,
    right: <><polyline points="9,18 15,12 9,6"/></>,
    down: <><polyline points="6,9 12,15 18,9"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    vault: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="9" x2="12" y2="9.01"/><line x1="12" y1="15" x2="12" y2="15.01"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

import MobileBottomNav from "./MobileBottomNav";
import "./mobile.css";
import LogoCanvas from "../../../components/layout/LogoCanvas";

export default function AdminLayout({ onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { pathname } = useLocation();
  const isMobile = useMediaQuery("(max-width: 899px)");
  const isEditor = pathname.startsWith("/admin/editor");
  const sidebarWidth = isMobile ? 260 : (collapsed ? 68 : 240);
  const { group: activeGroup, child: activeChild } = findActive(pathname);

  // 펼침 상태: 사용자가 토글한 항목만 추적. 미설정(undefined)인 그룹은 활성 여부를 기본값으로 사용
  const [expandedGroups, setExpandedGroups] = useState({});
  const isGroupExpanded = (group) =>
    expandedGroups[group.id] !== undefined
      ? expandedGroups[group.id]
      : activeGroup?.id === group.id;

  const sidebarVisible = !isMobile || mobileOpen;

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: THEME.pageBg }}>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="관리자 메뉴 닫기"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 35,
            background: "rgba(15, 23, 42, 0.34)", border: "none", cursor: "pointer",
          }}
        />
      )}

      {/* 사이드바 */}
      <aside className="admin-sidebar" style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        width: sidebarWidth,
        background: THEME.sidebarBg,
        transform: sidebarVisible ? "translateX(0)" : "translateX(-105%)",
        transition: isMobile
          ? "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)"
          : "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex", flexDirection: "column",
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        borderRight: `1px solid ${THEME.sidebarBorder}`,
      }}>
        {/* 브랜드 */}
        <div style={{
          padding: collapsed && !isMobile ? "24px 0" : "28px 24px",
          display: "flex", flexDirection: collapsed && !isMobile ? "column" : "row",
          alignItems: "center", gap: collapsed && !isMobile ? 6 : 14,
          justifyContent: collapsed && !isMobile ? "center" : "flex-start",
          borderBottom: `1px solid ${THEME.sidebarBorder}`,
          minHeight: 80,
        }}>
          {/* 로고 마크 — 홈페이지 LogoCanvas */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: THEME.accentDim,
            border: `1px solid rgba(201,168,76,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, padding: 5,
          }}>
            <LogoCanvas size={22} color={THEME.accent} />
          </div>
          {(!collapsed || isMobile) && (
            <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "#ffffff",
                letterSpacing: "0.22em", fontFamily: "'Georgia', serif",
              }}>
                HIGHLAW
              </div>
              <div style={{
                fontSize: 9, color: THEME.accent,
                letterSpacing: "0.2em", marginTop: 3,
                fontWeight: 500,
              }}>
                ADMINISTRATION
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 — 2단계 트리 (상위 8 / 하위 펼침) */}
        <nav
          aria-label="관리자 메뉴"
          style={{ flex: 1, padding: collapsed && !isMobile ? "12px 8px" : "12px 12px", overflowY: "auto" }}
        >
          {MENU_TREE.map((group) => {
            const hasChildren = Array.isArray(group.children) && group.children.length > 0;
            const isCompact = collapsed && !isMobile;
            const isGroupActive = activeGroup?.id === group.id;
            const isExpanded = isGroupExpanded(group);

            // 상위 항목 — children 이 없으면 NavLink, 있으면 토글 버튼
            const headerStyle = (active, hovered) => ({
              display: "flex", alignItems: "center", gap: 12,
              padding: isCompact ? "10px 0" : "9px 14px",
              justifyContent: isCompact ? "center" : "flex-start",
              width: "100%",
              fontSize: 13, fontWeight: active ? 600 : 400,
              letterSpacing: "0.01em",
              color: active ? THEME.accent : (hovered ? "#ffffff" : THEME.sidebarText),
              background: active ? THEME.accentDim : (hovered ? THEME.sidebarHoverBg : "transparent"),
              borderRadius: 6, textDecoration: "none",
              borderLeft: active ? `2px solid ${THEME.accent}` : "2px solid transparent",
              transition: "background-color 150ms ease, color 150ms ease",
              marginBottom: 1,
              border: "none", cursor: "pointer", textAlign: "left",
              fontFamily: "inherit",
            });

            const HeaderIcon = (
              <span style={{ flexShrink: 0, display: "flex", opacity: 0.9 }}>
                <Icon name={group.icon} size={17} />
              </span>
            );
            const HeaderLabel = (!isCompact) && (
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {group.label}
              </span>
            );

            if (!hasChildren) {
              return (
                <NavLink
                  key={group.id}
                  to={group.to}
                  end={group.end}
                  onClick={() => { if (isMobile) setMobileOpen(false); }}
                  onMouseEnter={() => setHoveredItem(group.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={isCompact ? group.label : undefined}
                  style={({ isActive }) => headerStyle(isActive, hoveredItem === group.id)}
                >
                  {HeaderIcon}
                  {HeaderLabel}
                </NavLink>
              );
            }

            return (
              <div key={group.id} role="group" aria-label={group.label}>
                <button
                  type="button"
                  onClick={() => {
                    // 축소 모드에서 그룹 클릭 시 첫 자식으로 이동(메뉴 펼칠 공간이 없음)
                    if (isCompact) {
                      window.location.href = group.children[0].to;
                      return;
                    }
                    setExpandedGroups((prev) => ({ ...prev, [group.id]: !isExpanded }));
                  }}
                  onMouseEnter={() => setHoveredItem(group.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-expanded={isExpanded}
                  title={isCompact ? group.label : undefined}
                  style={headerStyle(isGroupActive, hoveredItem === group.id)}
                >
                  {HeaderIcon}
                  {HeaderLabel}
                  {!isCompact && (
                    <span style={{
                      display: "flex", color: THEME.textMuted,
                      transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 150ms ease",
                    }}>
                      <Icon name="down" size={14} />
                    </span>
                  )}
                </button>
                {!isCompact && isExpanded && (
                  <div style={{ paddingLeft: 14, marginTop: 2, marginBottom: 6 }}>
                    {group.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={() => { if (isMobile) setMobileOpen(false); }}
                        onMouseEnter={() => setHoveredItem(child.to)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={({ isActive }) => ({
                          display: "block",
                          padding: "7px 12px 7px 28px",
                          fontSize: 12.5,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? THEME.accent : (hoveredItem === child.to ? "#ffffff" : THEME.sidebarText),
                          background: isActive ? THEME.accentDim : (hoveredItem === child.to ? THEME.sidebarHoverBg : "transparent"),
                          borderRadius: 6,
                          textDecoration: "none",
                          borderLeft: isActive ? `2px solid ${THEME.accent}` : "2px solid transparent",
                          marginBottom: 1,
                          transition: "background-color 150ms ease, color 150ms ease",
                        })}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 하단 — 홈/로그아웃 + 토글 */}
        <div style={{ borderTop: `1px solid ${THEME.sidebarBorder}`, padding: "10px 12px" }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            justifyContent: collapsed && !isMobile ? "center" : "flex-start",
            fontSize: 12, color: THEME.sidebarTextMuted, textDecoration: "none",
            padding: collapsed && !isMobile ? "8px 0" : "8px 16px", borderRadius: 6,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = THEME.sidebarHoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = THEME.sidebarTextMuted; e.currentTarget.style.background = "transparent"; }}
          >
            <Icon name="home" size={15} />{(!collapsed || isMobile) && "홈페이지"}
          </Link>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            justifyContent: collapsed && !isMobile ? "center" : "flex-start",
            fontSize: 12, color: THEME.sidebarTextMuted, background: "none",
            border: "none", cursor: "pointer",
            padding: collapsed && !isMobile ? "8px 0" : "8px 16px", borderRadius: 6,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = THEME.sidebarHoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = THEME.sidebarTextMuted; e.currentTarget.style.background = "transparent"; }}
          >
            <Icon name="logout" size={15} />{(!collapsed || isMobile) && "로그아웃"}
          </button>

          {!isMobile && <button onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "관리자 메뉴 펼치기" : "관리자 메뉴 접기"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", marginTop: 6, padding: "7px 0",
              background: "none", border: "none", cursor: "pointer",
              color: THEME.sidebarTextMuted, borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = THEME.sidebarTextMuted}
          >
            <Icon name={collapsed ? "right" : "left"} size={14} />
          </button>}
        </div>
      </aside>

      {/* 메인 영역 */}
      <div className="admin-main" style={{
        flex: 1, marginLeft: isMobile ? 0 : sidebarWidth,
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        ...(isEditor ? { height: "100vh", overflow: "hidden" } : {}),
      }}>
        {/* 상단 배너 */}
        {!isEditor && (
          <div className="admin-topbar" style={{
            background: THEME.white,
            color: THEME.textSec,
            padding: isMobile ? "10px 18px" : "8px 44px",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.04em",
            borderBottom: `1px solid ${THEME.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <span>
              {activeGroup
                ? (activeChild ? `${activeGroup.label} / ${activeChild.label}` : activeGroup.label)
                : "HIGH & LAW FIRM"}
            </span>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  border: `1px solid ${THEME.border}`, background: "#fff",
                  color: THEME.text, borderRadius: 6, padding: "6px 10px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Icon name="grid" size={15} /> 메뉴
              </button>
            )}
          </div>
        )}

        {isEditor ? children : (
          <div className="admin-main-content" style={{
            padding: isMobile ? "16px 14px 88px" : "36px 44px",
            maxWidth: 1440,
            width: "100%",
            boxSizing: "border-box",
            flex: 1,
          }}>
            {children}
          </div>
        )}

        {/* 모바일 하단 빠른 이동 바 — 에디터 화면 제외 */}
        {!isEditor && isMobile && <MobileBottomNav />}

        {/* 하단 바 */}
        {!isEditor && (
          <div className="admin-footerbar" style={{
            borderTop: `1px solid ${THEME.border}`,
            padding: isMobile ? "12px 16px" : "12px 44px",
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: "0.1em",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            textTransform: "uppercase",
            background: THEME.white,
          }}>
            <span>HIGH & LAW FIRM</span>
            <span style={{ fontFamily: "'Georgia', serif", color: THEME.textMuted }}>CONFIDENTIAL ACCESS</span>
          </div>
        )}
      </div>
    </div>
  );
}
