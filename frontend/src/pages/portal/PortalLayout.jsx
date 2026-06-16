/** 포털 레이아웃 -- NAVER Works 스타일의 전사 인트라넷 레이아웃 */
import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
import LogoCanvas from "../../components/layout/LogoCanvas";
import {
  Search, Home, Calendar, FileText, User, LogOut, Menu, Plus, Star,
  Trash2, FolderClosed, Clock, BookOpen, MessageSquare, ChevronRight,
  FolderOpen, Mail, Bot, ArrowLeft, Users, CalendarCheck, Bell, Network,
  Receipt, Globe, Image, Video, Settings,
} from "lucide-react";

const THEME = {
  sidebarBg: "linear-gradient(180deg, #0c2340 0%, #0f3460 45%, #0a4a80 100%)",  // 딥 네이비 블루
  sidebarBorder: "rgba(255,255,255,0.10)",
  accent: "#7dd3fc",             // sky-300 (사이드바 내 밝은 액센트)
  accentLight: "#38bdf8",        // sky-400
  accentDim: "rgba(125,211,252,0.16)",
  accentText: "#7dd3fc",
  sidebarText: "rgba(255,255,255,0.85)",
  sidebarTextMuted: "rgba(255,255,255,0.42)",
  sidebarActiveText: "#ffffff",
  sidebarActiveBg: "rgba(255,255,255,0.14)",
  sidebarHoverBg: "rgba(255,255,255,0.08)",
  pageBg: "#f0f9ff",             // sky-50 (매우 연한 하늘색 배경)
  white: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSec: "#475569",
  textMuted: "#94a3b8",
  topbarAccent: "#0ea5e9",       // sky-500 탑바 액센트
  topbarAccentDim: "rgba(14,165,233,0.08)",
};

// ─── 직급 정렬 순서 (부서 내 카드 정렬용) ──────────────────────────────
const POSITION_ORDER = ["대표변호사", "변호사", "전문위원", "직원", "기타"];
function positionRank(p) {
  const i = POSITION_ORDER.indexOf(p);
  return i >= 0 ? i : POSITION_ORDER.length;
}

// ─── 부서(팀) 정렬: 등록 순서 보존, 미지정은 맨 뒤 ────────────────────
const UNASSIGNED_TEAM = "기타";
function teamLabel(t) { return t && t.trim() ? t.trim() : UNASSIGNED_TEAM; }

// ─── 알림 아이콘 매핑 ─────────────────────────────────────────────────
function notifIcon(type) {
  if (type === "message") return "💬";
  if (type === "board") return "📋";
  if (type === "system") return "⚙️";
  return "🔔";
}

function fmtNotifTime(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authState, setAuthState] = useState("checking");
  const [userProfile, setUserProfile] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 768;
    return true;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [boardCategories, setBoardCategories] = useState([]);
  const [isPortalAdmin, setIsPortalAdmin] = useState(false);
  const [openGroups, setOpenGroups] = useState({ blog: false, system: false, client: false });

  // ─ 알림
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);

  // ─ 조직도
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgData, setOrgData] = useState([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSelectedMember, setOrgSelectedMember] = useState(null); // 프로필 팝업

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    portalApi.get("/me")
      .then((res) => {
        if (!cancelled) { setAuthState("authed"); setUserProfile(res.data); }
      })
      .catch(() => { if (!cancelled) setAuthState("unauthed"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    portalApi.get("/board-categories")
      .then((res) => { if (!cancelled) setBoardCategories(res.data || []); })
      .catch(() => {});
    portalApi.get("/lawyers/admin/check")
      .then((res) => { if (!cancelled) setIsPortalAdmin(res.data?.isAdmin || false); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ─ 알림 폴링 (30초 간격)
  const loadNotifications = useCallback(async () => {
    try {
      const res = await portalApi.get("/notifications");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    if (authState !== "authed") return;
    loadNotifications();
    const iv = setInterval(loadNotifications, 30000);
    return () => clearInterval(iv);
  }, [authState, loadNotifications]);

  // ─ 알림 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!showNotifPanel) return;
    function close(e) {
      if (!notifPanelRef.current?.contains(e.target)) setShowNotifPanel(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showNotifPanel]);

  // ─ 현재 경로 기반 그룹 활성 여부 — 조건부 return 전에 계산해야 hooks 순서가 유지됨
  const SYSTEM_PATHS_LOCAL = ["/portal/profile", "/portal/lectures", "/portal/approvals", "/portal/ai-settings"];
  const CLIENT_PATHS_LOCAL = ["/portal/clients", "/portal/messages", "/portal/contract-admin", "/portal/receipts", "/portal/reviews", "/portal/bookings"];
  const isBlogActiveEarly = location.pathname.startsWith("/portal/blog") || location.pathname.startsWith("/portal/editor");
  const isSystemActiveEarly = SYSTEM_PATHS_LOCAL.some(p => location.pathname.startsWith(p));
  const isClientActiveEarly = CLIENT_PATHS_LOCAL.some(p => location.pathname.startsWith(p));

  // 현재 경로가 그룹 내 항목이면 자동으로 펼침 — 반드시 조건부 return 전에 위치해야 함
  useEffect(() => {
    setOpenGroups(prev => ({
      blog: prev.blog || isBlogActiveEarly,
      system: prev.system || isSystemActiveEarly,
      client: prev.client || isClientActiveEarly,
    }));
  }, [isBlogActiveEarly, isSystemActiveEarly, isClientActiveEarly]);

  if (authState === "checking") return null;
  if (authState === "unauthed") return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    try { await portalApi.post("/logout"); } catch { /* 무시 */ }
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/portal/board?search=${encodeURIComponent(searchVal.trim())}`);
  };

  async function handleReadAll() {
    try {
      await portalApi.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* 무시 */ }
  }

  async function handleReadOne(id, link) {
    try {
      await portalApi.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* 무시 */ }
    if (link) { setShowNotifPanel(false); navigate(link); }
  }

  async function openOrgChart() {
    setShowOrgChart(true);
    if (orgData.length > 0) return;
    setOrgLoading(true);
    try {
      const res = await portalApi.get("/org-chart");
      setOrgData(res.data || []);
    } catch { /* 무시 */ }
    finally { setOrgLoading(false); }
  }

  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get("category") || "";
  const activeFilter = queryParams.get("filter") || "";
  const isBoardMode = location.pathname.startsWith("/portal/board");

  const SYSTEM_PATHS = SYSTEM_PATHS_LOCAL;
  const CLIENT_PATHS = CLIENT_PATHS_LOCAL;
  const isBlogActive = isBlogActiveEarly;
  const isSystemActive = isSystemActiveEarly;
  const isClientActive = isClientActiveEarly;

  // 프로필 사진 — lawyerPhotoUrl(변호사 프로필) > photoUrl(직접 업로드) > 이니셜
  const effectivePhotoUrl = userProfile?.user?.lawyerPhotoUrl || userProfile?.user?.photoUrl || null;
  const userInitial = userProfile?.client?.name
    ? userProfile.client.name.charAt(0)
    : (userProfile?.user?.email ? userProfile.user.email.charAt(0).toUpperCase() : "U");
  const displayName = userProfile?.client?.name || userProfile?.user?.email || "";

  const filteredCategories = boardCategories.filter((cat) =>
    cat.label.toLowerCase().includes(boardSearch.toLowerCase())
  );

  const isEditor = location.pathname.startsWith("/portal/editor");

  // 조직도 필터
  const filteredOrg = orgData.filter((p) => {
    if (!orgSearch) return true;
    const q = orgSearch.toLowerCase();
    return (p.name || "").toLowerCase().includes(q)
      || (p.nameEn || "").toLowerCase().includes(q)
      || (p.position || "").toLowerCase().includes(q)
      || (p.team || "").toLowerCase().includes(q)
      || (p.email || "").toLowerCase().includes(q);
  });

  // 부서(team) 기준 그룹화 — 부서 내 멤버는 직급 순으로 정렬
  const groupedOrg = filteredOrg.reduce((acc, p) => {
    const dept = teamLabel(p.team);
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(p);
    return acc;
  }, {});

  // 부서 순서: 원본 데이터 첫 등장 순, "기타"는 항상 마지막
  const deptOrder = [];
  filteredOrg.forEach((p) => {
    const dept = teamLabel(p.team);
    if (!deptOrder.includes(dept)) deptOrder.push(dept);
  });
  const unassignedIdx = deptOrder.indexOf(UNASSIGNED_TEAM);
  if (unassignedIdx > 0) {
    deptOrder.splice(unassignedIdx, 1);
    deptOrder.push(UNASSIGNED_TEAM);
  }

  const orderedGroups = deptOrder
    .filter((dept) => groupedOrg[dept])
    .map((dept) => [
      dept,
      [...groupedOrg[dept]].sort((a, b) => positionRank(a.position) - positionRank(b.position)),
    ]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: THEME.pageBg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .portal-sidebar-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 6px; text-decoration: none;
          font-size: 13px; color: ${THEME.sidebarText} !important; font-weight: 500;
          transition: background-color 150ms ease, color 150ms ease;
          margin-bottom: 2px; border-left: 2px solid transparent;
        }
        .portal-sidebar-link:hover { background-color: ${THEME.sidebarHoverBg} !important; color: #ffffff !important; }
        .portal-sidebar-link-active {
          color: ${THEME.accent} !important; background-color: ${THEME.sidebarActiveBg} !important;
          font-weight: 600; border-left: 2px solid ${THEME.accent} !important;
        }
        .portal-sidebar-header {
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          font-size: 11px; font-weight: 700; color: ${THEME.sidebarTextMuted};
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .portal-search-input {
          width: 100%; padding: 8px 14px 8px 38px; font-size: 13px;
          border: 1px solid ${THEME.border}; border-radius: 20px;
          background: #f1f5f9; outline: none; transition: all 0.2s; box-sizing: border-box;
        }
        .portal-search-input:focus {
          background: #fff !important; border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }
        .portal-board-filter-input {
          width: 100%; padding: 6px 10px 6px 28px; font-size: 12px;
          border: 1px solid ${THEME.sidebarBorder}; border-radius: 6px;
          background: rgba(255,255,255,0.06); color: #ffffff; outline: none;
          box-sizing: border-box; transition: all 0.15s ease;
        }
        .portal-board-filter-input::placeholder { color: ${THEME.sidebarTextMuted}; }
        .portal-board-filter-input:focus { border-color: ${THEME.accent}; background: rgba(255,255,255,0.10); }
        .notif-item:hover { background: #f8fafc !important; }
        .org-card:hover { box-shadow: 0 4px 16px rgba(11,31,58,0.1) !important; transform: translateY(-1px); }
      `}</style>

      {/* 모바일 사이드바 오버레이 */}
      {isMobile && isSidebarOpen && (
        <button type="button" aria-label="메뉴 닫기" onClick={() => setIsSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 105, background: "rgba(15,23,42,0.34)", border: "none", cursor: "pointer" }} />
      )}

      {/* ==================== 사이드바 ==================== */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 110,
        width: 240, background: THEME.sidebarBg, borderRight: `1px solid ${THEME.sidebarBorder}`,
        display: "flex", flexDirection: "column",
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isSidebarOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
        overflow: "hidden", boxSizing: "border-box"
      }}>
        {/* 브랜드 */}
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${THEME.sidebarBorder}`, minHeight: 80, boxSizing: "border-box" }}>
          <Link to="/portal/calendar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: THEME.accentDim, border: `1px solid rgba(99,102,241,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 5 }}>
              <LogoCanvas size={22} color={THEME.accent} />
            </div>
            <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", letterSpacing: "0.22em", fontFamily: "'Georgia', serif" }}>HIGHLAW</div>
              <div style={{ fontSize: 9, color: THEME.accent, letterSpacing: "0.2em", marginTop: 3, fontWeight: 500 }}>INTRANET</div>
            </div>
          </Link>
        </div>

        {/* 메뉴 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px 12px" }}>
          {isBoardMode ? (
            <>
              <button type="button"
                onClick={() => { navigate("/portal/calendar"); if (isMobile) setIsSidebarOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", marginBottom: 8, background: "transparent", border: "none", borderRadius: 6, color: THEME.sidebarText, fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.sidebarHoverBg; e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = THEME.sidebarText; }}
              >
                <ArrowLeft size={16} />전체 메뉴
              </button>
              <div className="portal-sidebar-header">게시판</div>
              <div style={{ padding: "4px 8px 12px" }}>
                <button onClick={() => { navigate("/portal/board?write=true"); if (isMobile) setIsSidebarOpen(false); }}
                  style={{ width: "100%", height: 42, background: `linear-gradient(135deg,${THEME.accent} 0%,${THEME.accentLight} 100%)`, color: "#ffffff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 12px ${THEME.accent}40` }}>
                  <Plus size={16} />게시글 쓰기
                </button>
              </div>
              <div style={{ height: 1, background: THEME.sidebarBorder, margin: "12px 8px" }} />
              <div style={{ padding: "0 8px 12px" }}>
                <div className="portal-sidebar-header">게시판 필터</div>
                {[
                  { to: "/portal/board?filter=recent", icon: <Clock size={16} />, label: "최신글", key: "recent" },
                  { to: "/portal/board?filter=pinned", icon: <Star size={16} style={{ fill: activeFilter === "pinned" ? THEME.accent : "transparent" }} />, label: "필독 게시글", key: "pinned" },
                  { to: "/portal/board?filter=important", icon: <Star size={16} style={{ color: "#f59e0b", fill: activeFilter === "important" ? "#f59e0b" : "transparent" }} />, label: "중요 게시글", key: "important" },
                  { to: "/portal/board?filter=mine", icon: <User size={16} />, label: "내 게시글", key: "mine" },
                ].map(({ to, icon, label, key }) => (
                  <Link key={key} to={to} className={`portal-sidebar-link ${activeFilter === key ? "portal-sidebar-link-active" : ""}`} onClick={() => isMobile && setIsSidebarOpen(false)}>
                    {icon}{label}
                  </Link>
                ))}
              </div>
              <div style={{ height: 1, background: THEME.sidebarBorder, margin: "12px 8px" }} />
              <div style={{ padding: "0 8px 12px", position: "relative" }}>
                <input type="text" placeholder="게시판 이름으로 검색" value={boardSearch} onChange={(e) => setBoardSearch(e.target.value)} className="portal-board-filter-input" />
                <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: THEME.sidebarTextMuted, display: "flex", alignItems: "center" }}><Search size={13} /></div>
              </div>
              <div style={{ padding: "0 8px" }}>
                <div className="portal-sidebar-header">전체 게시판</div>
                <div style={{ padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                    <ChevronRight size={14} style={{ transform: "rotate(90deg)", color: THEME.sidebarTextMuted }} />
                    <FolderOpen size={16} style={{ color: THEME.accent }} />
                    법무법인 하이로
                  </div>
                  <div style={{ paddingLeft: 20 }}>
                    {filteredCategories.map((cat) => (
                      <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                        <Link
                          to={`/portal/board?category=${cat.key}`}
                          className={`portal-sidebar-link ${activeCategory === cat.key ? "portal-sidebar-link-active" : ""}`}
                          onClick={() => isMobile && setIsSidebarOpen(false)}
                          style={{ flex: 1 }}
                        >
                          <FolderClosed size={14} />{cat.label}
                        </Link>
                        {isPortalAdmin && (
                          <button
                            type="button"
                            title="게시판 삭제"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!window.confirm(`"${cat.label}" 게시판을 삭제할까요?\n게시글은 삭제되지 않습니다.`)) return;
                              try {
                                await portalApi.delete(`/board-categories/${cat.id}`);
                                setBoardCategories((prev) => prev.filter((c) => c.id !== cat.id));
                              } catch (err) {
                                alert(err.message || "삭제에 실패했습니다.");
                              }
                            }}
                            style={{
                              background: "transparent", border: "none", cursor: "pointer",
                              color: "rgba(255,255,255,0.3)", padding: "4px 6px", borderRadius: 4,
                              flexShrink: 0, lineHeight: 1, display: "flex", alignItems: "center",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {filteredCategories.length === 0 && <div style={{ fontSize: 11, color: THEME.sidebarTextMuted, padding: "8px 12px" }}>검색 결과 없음</div>}
                  </div>
                </div>
                <div style={{ height: 1, background: THEME.sidebarBorder, margin: "16px 8px" }} />
                <div style={{ padding: "0 0 16px" }}>
                  <Link to="/portal/board?filter=trash" className={`portal-sidebar-link ${activeFilter === "trash" ? "portal-sidebar-link-active" : ""}`} onClick={() => isMobile && setIsSidebarOpen(false)}>
                    <Trash2 size={14} />휴지통
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="portal-sidebar-header">메뉴</div>
              {[
                { to: "/portal/calendar",      icon: <Home size={16} />,     label: "일정 캘린더 (홈)", exact: true },
                { to: "/portal/dashboard",     icon: <Calendar size={16} />, label: "사건 목록" },
                { to: "/portal/board",         icon: <FileText size={16} />, label: "게시판" },
                { to: "/portal/time-tracking", icon: <Clock size={16} />,    label: "타임트래킹" },
              ].map(({ to, icon, label, exact }) => (
                <Link key={to} to={to}
                  className={`portal-sidebar-link ${location.pathname.startsWith(to) && (!exact || location.pathname === to) ? "portal-sidebar-link-active" : ""}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  {icon}{label}
                </Link>
              ))}

              {/* ─ 블로그 그룹 */}
              <SidebarGroup
                label="블로그"
                icon={<BookOpen size={16} />}
                open={openGroups.blog}
                active={isBlogActive}
                onToggle={() => setOpenGroups(p => ({ ...p, blog: !p.blog }))}
              >
                {[
                  { to: "/portal/blog",              icon: <FileText size={14} />, label: "블로그 목록" },
                  { to: "/portal/editor?mode=blog", icon: <Plus size={14} />,     label: "새 글 쓰기" },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to}
                    className={`portal-sidebar-link ${location.pathname.startsWith(to) ? "portal-sidebar-link-active" : ""}`}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    style={{ fontSize: 12, paddingLeft: 10 }}
                  >
                    {icon}{label}
                  </Link>
                ))}
              </SidebarGroup>

              {/* ─ 고객 그룹 */}
              <SidebarGroup
                label="고객"
                icon={<Users size={16} />}
                open={openGroups.client}
                active={isClientActive}
                onToggle={() => setOpenGroups(p => ({ ...p, client: !p.client }))}
              >
                {[
                  { to: "/portal/clients",       icon: <Users size={14} />,        label: "고객 관리" },
                  { to: "/portal/messages",      icon: <Mail size={14} />,          label: "메시지 발송" },
                  { to: "/portal/contract-admin",icon: <FileText size={14} />,      label: "계약서 관리" },
                  { to: "/portal/receipts",      icon: <Receipt size={14} />,       label: "영수증" },
                  { to: "/portal/reviews",       icon: <Star size={14} />,          label: "후기 관리" },
                  { to: "/portal/bookings",      icon: <CalendarCheck size={14} />, label: "예약 관리" },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to}
                    className={`portal-sidebar-link ${location.pathname.startsWith(to) ? "portal-sidebar-link-active" : ""}`}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    style={{ fontSize: 12, paddingLeft: 10 }}
                  >
                    {icon}{label}
                  </Link>
                ))}
              </SidebarGroup>

              {/* ─ 시스템 그룹 */}
              <SidebarGroup
                label="시스템"
                icon={<Settings size={16} />}
                open={openGroups.system}
                active={isSystemActive}
                onToggle={() => setOpenGroups(p => ({ ...p, system: !p.system }))}
              >
                {[
                  { to: "/portal/profile",     icon: <User size={14} />,     label: "프로필 설정" },
                  { to: "/portal/lectures",    icon: <Video size={14} />,    label: "강의" },
                  { to: "/portal/approvals",   icon: <FileText size={14} />, label: "전자결재 시스템" },
                  { to: "/portal/ai-settings", icon: <Bot size={14} />,      label: "AI 연동 설정" },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to}
                    className={`portal-sidebar-link ${location.pathname.startsWith(to) ? "portal-sidebar-link-active" : ""}`}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    style={{ fontSize: 12, paddingLeft: 10 }}
                  >
                    {icon}{label}
                  </Link>
                ))}
              </SidebarGroup>

              <a href="/" className="portal-sidebar-link">
                <BookOpen size={16} style={{ color: THEME.sidebarTextMuted }} />홈페이지 바로가기
              </a>
            </>
          )}
        </div>
        <div style={{ padding: 16, borderTop: `1px solid ${THEME.sidebarBorder}`, fontSize: 11, color: THEME.sidebarTextMuted }}>
          © 법무법인 하이로
        </div>
      </aside>

      {/* ==================== 메인 콘텐츠 ==================== */}
      <div style={{
        flex: 1, marginLeft: isMobile ? 0 : (isSidebarOpen ? 240 : 0),
        transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        ...(isEditor ? { height: "100vh" } : { minHeight: "100vh" }),
      }}>
        {/* ─ 탑바 */}
        {!isEditor && (
          <header style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px", height: 60, background: "#ffffff",
            borderBottom: `1px solid ${THEME.border}`, position: "sticky", top: 0, zIndex: 100,
            boxShadow: "0 1px 3px rgba(11,31,58,0.05)",
          }}>
            {/* 왼쪽 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", padding: 4, borderRadius: 4 }}
                title="사이드바 토글"
              >
                <Menu size={20} />
              </button>
              {isMobile ? (
                <Link to="/portal/calendar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <LogoCanvas size={16} color={THEME.accent} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text, letterSpacing: "0.05em", fontFamily: "'Georgia', serif" }}>HIGHLAW</span>
                </Link>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, letterSpacing: "0.05em" }}>INTRANET PORTAL</span>
              )}
            </div>

            {/* 가운데 검색 */}
            {!isMobile && (
              <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: 360 }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Search size={16} />
                </div>
                <input type="text" placeholder="게시글 검색" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} className="portal-search-input" />
              </form>
            )}

            {/* 오른쪽 */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {!isMobile && (
                <>
                  {[
                    { to: "/portal/dashboard",    icon: <Home size={20} />,           label: "홈" },
                    { to: "/portal/messenger",    icon: <MessageSquare size={20} />,  label: "메신저" },
                    { to: "/portal/mail",         icon: <Mail size={20} />,           label: "메일" },
                    { to: "/portal/calendar",     icon: <Calendar size={20} />,       label: "캘린더" },
                    { to: "/portal/board",        icon: <FileText size={20} />,       label: "게시판" },
                    { to: "/portal/time-tracking",icon: <Clock size={20} />,          label: "타임트래킹" },
                  ].map(({ to, icon, label }) => {
                    const isActive = location.pathname === to || (to !== "/portal/dashboard" && location.pathname.startsWith(to));
                    return (
                      <Link key={to} to={to} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "5px 10px", borderRadius: 8, textDecoration: "none", minWidth: 54, height: 48,
                        color: isActive ? THEME.topbarAccent : "#64748b",
                        background: isActive ? THEME.topbarAccentDim : "transparent",
                        transition: "background 0.15s, color 0.15s", gap: 2,
                      }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = THEME.topbarAccent; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
                      >
                        {icon}
                        <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{label}</span>
                      </Link>
                    );
                  })}

                  {/* ─ 알림 벨 */}
                  <div ref={notifPanelRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowNotifPanel((p) => !p)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                        minWidth: 54, height: 48, background: showNotifPanel ? THEME.topbarAccentDim : "transparent",
                        color: showNotifPanel ? THEME.topbarAccent : "#64748b", gap: 2, position: "relative",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!showNotifPanel) { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = THEME.topbarAccent; } }}
                      onMouseLeave={(e) => { if (!showNotifPanel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
                      title="알림"
                    >
                      <div style={{ position: "relative" }}>
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span style={{
                            position: "absolute", top: -4, right: -4,
                            background: "#ef4444", color: "#fff", borderRadius: "50%",
                            width: 14, height: 14, fontSize: 9, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1.5px solid #fff",
                          }}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>알림</span>
                    </button>

                    {/* 알림 드롭다운 패널 */}
                    {showNotifPanel && (
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 4px)",
                        width: 340, maxHeight: 480, overflowY: "auto",
                        background: "#fff", borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(11,31,58,0.15)",
                        border: `1px solid ${THEME.border}`, zIndex: 200,
                      }}>
                        <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${THEME.border}` }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>
                            알림 {unreadCount > 0 && <span style={{ color: "#ef4444", fontSize: 12 }}>({unreadCount})</span>}
                          </span>
                          {unreadCount > 0 && (
                            <button onClick={handleReadAll}
                              style={{ fontSize: 11, color: THEME.textMuted, background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                              모두 읽음
                            </button>
                          )}
                        </div>

                        {notifications.length === 0 ? (
                          <div style={{ padding: "32px 16px", textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
                            <Bell size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <div>새 알림이 없습니다</div>
                          </div>
                        ) : notifications.map((n) => (
                          <button key={n.id} className="notif-item"
                            onClick={() => handleReadOne(n.id, n.link)}
                            style={{
                              width: "100%", padding: "12px 16px", border: "none", cursor: "pointer",
                              background: n.is_read ? "transparent" : "#f0f9ff",
                              textAlign: "left", display: "flex", gap: 10, alignItems: "flex-start",
                              borderBottom: `1px solid ${THEME.border}`,
                            }}
                          >
                            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{notifIcon(n.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: THEME.text, wordBreak: "break-word" }}>{n.title}</div>
                              {n.body && <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>{n.body}</div>}
                              <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 3 }}>{fmtNotifTime(n.created_at)}</div>
                            </div>
                            {!n.is_read && (
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 4 }} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ─ 조직도 */}
                  <button
                    onClick={openOrgChart}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                      minWidth: 54, height: 48, background: "transparent", color: "#64748b",
                      gap: 2, transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = THEME.topbarAccent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
                    title="조직도"
                  >
                    <Network size={20} />
                    <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>조직도</span>
                  </button>

                  <div style={{ height: 32, width: 1, background: THEME.border, margin: "0 8px" }} />
                </>
              )}

              {/* 프로필 아바타 + 버튼들 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* 프로필 아바타 — 클릭 시 마이페이지 이동 */}
                <Link to="/portal/profile" title={`${displayName} · 마이페이지`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  {effectivePhotoUrl ? (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `2px solid ${THEME.accentDim}`, cursor: "pointer", transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = THEME.accentDim}
                    >
                      <img src={effectivePhotoUrl} alt={displayName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
                        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                      />
                      <div style={{ display: "none", width: "100%", height: "100%", background: THEME.accentDim, color: THEME.accent, alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
                        {userInitial}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: THEME.accentDim, color: THEME.accent,
                      border: `1px solid rgba(99,102,241,0.25)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 600,
                      boxShadow: "0 2px 4px rgba(99,102,241,0.15)", cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = THEME.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"}
                    >
                      {userInitial}
                    </div>
                  )}
                </Link>

                <a href="/"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: THEME.textSec, background: "transparent", border: `1px solid ${THEME.border}`, borderRadius: 6, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  홈페이지 가기
                </a>

                <button onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: "#ef4444", background: "transparent", border: "1px solid #fee2e2", borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={13} />로그아웃
                </button>
              </div>
            </div>
          </header>
        )}

        {/* 본문 */}
        {isEditor ? (
          <Outlet />
        ) : (
          <main style={{ flex: 1, padding: isMobile ? "16px 14px 80px" : "36px 44px", overflowY: "auto", boxSizing: "border-box" }}>
            <Outlet />
          </main>
        )}

        {/* 푸터 */}
        {!isEditor && (
          <footer style={{
            borderTop: `1px solid ${THEME.border}`, padding: isMobile ? "12px 16px" : "12px 44px",
            fontSize: 10, color: THEME.textMuted, letterSpacing: "0.1em",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            textTransform: "uppercase", background: THEME.white,
          }}>
            <span>HIGH & LAW FIRM INTRANET</span>
            <span style={{ fontFamily: "'Georgia', serif", color: THEME.textMuted }}>SECURE PORTAL ACCESS</span>
          </footer>
        )}
      </div>

      {/* ==================== 조직도 모달 ==================== */}
      {showOrgChart && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowOrgChart(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(11,31,58,0.45)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "#fff", borderRadius: 16, width: "min(900px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(11,31,58,0.25)", overflow: "hidden" }}>
            {/* 모달 헤더 */}
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Network size={20} color={THEME.accent} />
                <span style={{ fontSize: 17, fontWeight: 700, color: THEME.text }}>조직도</span>
                <span style={{ fontSize: 12, color: THEME.textMuted }}>법무법인 하이로</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {/* 검색 */}
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted }} />
                  <input
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    placeholder="이름·직급 검색"
                    style={{ padding: "7px 12px 7px 30px", fontSize: 12, border: `1px solid ${THEME.border}`, borderRadius: 20, outline: "none", width: 180 }}
                    onFocus={(e) => e.target.style.borderColor = THEME.accent}
                    onBlur={(e) => e.target.style.borderColor = THEME.border}
                  />
                </div>
                <button onClick={() => setShowOrgChart(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: THEME.textMuted, padding: 6, display: "flex", borderRadius: 6 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 조직도 본문 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {orgLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: THEME.textMuted }}>불러오는 중...</div>
              ) : orgData.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: THEME.textMuted }}>
                  <Network size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div>등록된 구성원이 없습니다</div>
                </div>
              ) : orderedGroups.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: THEME.textMuted }}>검색 결과가 없습니다</div>
              ) : orderedGroups.map(([dept, members]) => (
                <div key={dept} style={{ marginBottom: 28 }}>
                  {/* 부서 헤더 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ height: 1, flex: "0 0 16px", background: THEME.border }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: THEME.text, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {dept}
                    </span>
                    <span style={{ fontSize: 10, color: THEME.textMuted, whiteSpace: "nowrap" }}>
                      {members.length}명
                    </span>
                    <div style={{ height: 1, flex: 1, background: THEME.border }} />
                  </div>

                  {/* 카드 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {members.map((p) => (
                      <OrgCard key={p.id} person={p} accent={THEME.accent} accentDim={THEME.accentDim} text={THEME.text} textSec={THEME.textSec} textMuted={THEME.textMuted} border={THEME.border} onSelect={setOrgSelectedMember} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 구성원 상세 프로필 팝업 ── */}
      {orgSelectedMember && (
        <div
          onClick={() => setOrgSelectedMember(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(11,31,58,0.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <MemberProfilePopup member={orgSelectedMember} onClose={() => setOrgSelectedMember(null)} accent={THEME.accent} accentDim={THEME.accentDim} border={THEME.border} text={THEME.text} textSec={THEME.textSec} textMuted={THEME.textMuted} />
        </div>
      )}
    </div>
  );
}

// ─── 구성원 상세 프로필 팝업 ─────────────────────────────────────────────
function MemberProfilePopup({ member, onClose, accent, accentDim, border, text, textSec, textMuted }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = (member.name || "?").charAt(0);
  const color = avatarColor(member.name || "");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 360,
        boxShadow: "0 24px 80px rgba(11,31,58,0.28)", position: "relative", textAlign: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: "none", fontSize: 18, color: "#aaa", cursor: "pointer", lineHeight: 1, padding: 4 }}
      >✕</button>

      {/* 아바타 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {member.photoUrl && !imgErr ? (
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: `3px solid ${accentDim}` }}>
            <img src={member.photoUrl} alt={member.name || ""} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
          </div>
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>
            {initials}
          </div>
        )}
      </div>

      {/* 이름 */}
      <div style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>{member.name || "-"}</div>
      {member.nameEn && <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>{member.nameEn}</div>}

      {/* 직급 + 부서 */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {member.position && (
          <span style={{ background: accentDim, color: accent, fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>
            {member.position}
          </span>
        )}
        {member.team && (
          <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500, padding: "3px 12px", borderRadius: 20 }}>
            {member.team}
          </span>
        )}
      </div>

      {/* 소개 */}
      {member.tagline && (
        <div style={{ fontSize: 12.5, color: textSec, fontStyle: "italic", marginBottom: 16, lineHeight: 1.5 }}>{member.tagline}</div>
      )}

      {/* 연락처 */}
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {member.email && (
          <a href={`mailto:${member.email}`} style={{ fontSize: 13, color: "#3b82f6", textDecoration: "none" }}>
            ✉ {member.email}
          </a>
        )}
        {member.phone && (
          <a href={`tel:${member.phone}`} style={{ fontSize: 13, color: textSec, textDecoration: "none" }}>
            ☎ {member.phone}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 조직도 카드 ──────────────────────────────────────────────────────
function OrgCard({ person, accent, accentDim, text, textSec, textMuted, border, onSelect }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = (person.name || "?").charAt(0);
  const color = avatarColor(person.name || "");

  return (
    <div
      className="org-card"
      onClick={() => onSelect?.(person)}
      style={{
        background: "#fff", borderRadius: 12, border: `1px solid ${border}`,
        padding: 16, display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, transition: "box-shadow 0.15s, transform 0.15s",
        boxShadow: "0 1px 4px rgba(11,31,58,0.06)",
        cursor: "pointer",
      }}
    >
      {/* 아바타 */}
      {person.photoUrl && !imgErr ? (
        <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `2px solid ${accentDim}`, flexShrink: 0 }}>
          <img src={person.photoUrl} alt={person.name || ""} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
        </div>
      ) : (
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
      )}

      {/* 이름 */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{person.name || "-"}</div>
        {person.nameEn && <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>{person.nameEn}</div>}
      </div>

      {/* 직급 뱃지 */}
      <div style={{ background: accentDim, color: accent, fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 12 }}>
        {person.position || "-"}
      </div>

      {/* 소속 */}
      {person.team && (
        <div style={{ fontSize: 11, color: textMuted, textAlign: "center" }}>{person.team}</div>
      )}

      {/* 연락처 */}
      <div style={{ width: "100%", borderTop: `1px solid ${border}`, marginTop: 4, paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        {person.email && (
          <a href={`mailto:${person.email}`} style={{ fontSize: 10, color: "#3b82f6", textDecoration: "none", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {person.email}
          </a>
        )}
        {person.phone && (
          <div style={{ fontSize: 10, color: textSec, textAlign: "center" }}>{person.phone}</div>
        )}
        {person.tagline && (
          <div style={{ fontSize: 10, color: textMuted, textAlign: "center", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {person.tagline}
          </div>
        )}
      </div>
    </div>
  );
}

const AVATAR_COLORS = ["#0ea5e9", "#0891b2", "#059669", "#d97706", "#dc2626", "#2563eb", "#0b1f3a"];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ─── 사이드바 아코디언 그룹 ──────────────────────────────────────────────
function SidebarGroup({ label, icon, open, active, onToggle, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "8px 12px", borderRadius: 6,
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: active ? 600 : 500,
          color: active ? THEME.accent : THEME.sidebarText,
          borderLeft: active ? `2px solid ${THEME.accent}` : "2px solid transparent",
          transition: "background-color 150ms ease, color 150ms ease",
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = THEME.sidebarHoverBg;
            e.currentTarget.style.color = "#ffffff";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = THEME.sidebarText;
          }
        }}
      >
        {icon}
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <ChevronRight
          size={13}
          style={{
            flexShrink: 0,
            color: THEME.sidebarTextMuted,
            transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
}
