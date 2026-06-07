/** 포털 레이아웃 -- NAVER Works 스타일의 전사 인트라넷 레이아웃 */
import { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
import LogoCanvas from "../../components/layout/LogoCanvas";
import {
  Search,
  Home,
  Calendar,
  FileText,
  User,
  LogOut,
  Menu,
  Plus,
  Star,
  Trash2,
  FolderClosed,
  Clock,
  BookOpen,
  MessageSquare,
  ChevronRight,
  FolderOpen,
  Mail,
  Bot,
  ArrowLeft,
  Users,
  CalendarCheck,
} from "lucide-react";

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

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authState, setAuthState] = useState("checking"); // "checking" | "authed" | "unauthed"
  const [userProfile, setUserProfile] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [boardCategories, setBoardCategories] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    portalApi.get("/me")
      .then((res) => {
        if (!cancelled) {
          setAuthState("authed");
          setUserProfile(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setAuthState("unauthed");
      });
    return () => { cancelled = true; };
  }, []);

  // 게시판 카테고리 목록 — 대표변호사가 추가한 게시판을 포함해 DB에서 불러온다
  useEffect(() => {
    let cancelled = false;
    portalApi.get("/board-categories")
      .then((res) => {
        if (!cancelled) setBoardCategories(res.data || []);
      })
      .catch(() => { /* 카테고리 목록은 보조 정보이므로 실패해도 사이드바 자체는 동작해야 한다 */ });
    return () => { cancelled = true; };
  }, []);

  if (authState === "checking") return null;
  if (authState === "unauthed") return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    try { await portalApi.post("/logout"); } catch { /* 무시 */ }
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/portal/board?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  // 현재 활성화된 카테고리나 필터 알아내기
  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get("category") || "";
  const activeFilter = queryParams.get("filter") || "";

  // 게시판 메뉴 진입 여부 — 게시판 경로에서는 사이드바를 게시판 전용 메뉴로 전환
  const isBoardMode = location.pathname.startsWith("/portal/board");

  // 현재 사용자 이름 첫 글자 추출
  const userInitial = userProfile?.client?.name 
    ? userProfile.client.name.charAt(0) 
    : (userProfile?.user?.email ? userProfile.user.email.charAt(0).toUpperCase() : "U");

  // 사이드바 카테고리 필터링 (검색어 입력 시)
  const filteredCategories = boardCategories.filter(cat => 
    cat.label.toLowerCase().includes(boardSearch.toLowerCase())
  );

  const isEditor = location.pathname.startsWith("/portal/editor");

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: THEME.pageBg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .portal-sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 13px;
          color: ${THEME.sidebarText} !important;
          font-weight: 500;
          transition: background-color 150ms ease, color 150ms ease;
          margin-bottom: 2px;
          border-left: 2px solid transparent;
        }
        .portal-sidebar-link:hover {
          background-color: ${THEME.sidebarHoverBg} !important;
          color: #ffffff !important;
        }
        .portal-sidebar-link-active {
          color: ${THEME.accent} !important;
          background-color: ${THEME.sidebarActiveBg} !important;
          font-weight: 600;
          border-left: 2px solid ${THEME.accent} !important;
        }
        .portal-sidebar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: ${THEME.sidebarTextMuted};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .portal-search-input {
          width: 100%;
          padding: 8px 14px 8px 38px;
          font-size: 13px;
          border: 1px solid ${THEME.border};
          border-radius: 20px;
          background: #f1f5f9;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .portal-search-input:focus {
          background: #fff !important;
          border-color: ${THEME.accent} !important;
          box-shadow: 0 0 0 2px ${THEME.accent}25;
        }
        .portal-board-filter-input {
          width: 100%;
          padding: 6px 10px 6px 28px;
          font-size: 12px;
          border: 1px solid ${THEME.sidebarBorder};
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          color: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .portal-board-filter-input::placeholder {
          color: ${THEME.sidebarTextMuted};
        }
        .portal-board-filter-input:focus {
          border-color: ${THEME.accent};
          background: rgba(255,255,255,0.10);
        }
      `}</style>

      {/* ==================== 모바일 사이드바 배경 오버레이 ==================== */}
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 105,
            background: "rgba(15, 23, 42, 0.34)", border: "none", cursor: "pointer",
          }}
        />
      )}

      {/* ==================== 1. 사이드바 (Sidebar) ==================== */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 110,
        width: 240,
        background: THEME.sidebarBg,
        borderRight: `1px solid ${THEME.sidebarBorder}`,
        display: "flex",
        flexDirection: "column",
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isSidebarOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
        {/* 브랜드 / 로고 섹션 */}
        <div style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center", gap: 12,
          justifyContent: "flex-start",
          borderBottom: `1px solid ${THEME.sidebarBorder}`,
          minHeight: 80,
          boxSizing: "border-box"
        }}>
          <Link to="/portal/calendar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: THEME.accentDim,
              border: `1px solid rgba(201,168,76,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, padding: 5,
            }}>
              <LogoCanvas size={22} color={THEME.accent} />
            </div>
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
                INTRANET
              </div>
            </div>
          </Link>
        </div>

        {/* 메인 메뉴 스크롤 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px 12px" }}>
          {isBoardMode ? (
            <>
              {/* 뒤로가기 — 전체 메뉴로 복귀 */}
              <button
                type="button"
                onClick={() => {
                  navigate("/portal/calendar");
                  if (isMobile) setIsSidebarOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "8px 12px", marginBottom: 8,
                  background: "transparent", border: "none", borderRadius: 6,
                  color: THEME.sidebarText, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "background-color 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = THEME.sidebarHoverBg; e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = THEME.sidebarText; }}
              >
                <ArrowLeft size={16} />
                전체 메뉴
              </button>

              <div className="portal-sidebar-header">
                게시판
              </div>

              {/* 글쓰기 버튼 */}
              <div style={{ padding: "4px 8px 12px" }}>
                <button
                  onClick={() => {
                    navigate("/portal/board?write=true");
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  style={{
                    width: "100%", height: 42,
                    background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.accentLight} 100%)`,
                    color: "#ffffff", border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: `0 4px 12px ${THEME.accent}40`,
                    transition: "transform 0.15s, opacity 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.95"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <Plus size={16} />
                  게시글 쓰기
                </button>
              </div>

              <div style={{ height: 1, background: THEME.sidebarBorder, margin: "12px 8px" }} />

              {/* 사이드바 게시판 필터 메뉴 */}
              <div style={{ padding: "0 8px 12px" }}>
                <div className="portal-sidebar-header">
                  게시판 필터
                </div>
                <Link
                  to="/portal/board?filter=recent"
                  className={`portal-sidebar-link ${activeFilter === "recent" ? "portal-sidebar-link-active" : ""}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <Clock size={16} />
                  최신글
                </Link>
                <Link
                  to="/portal/board?filter=pinned"
                  className={`portal-sidebar-link ${activeFilter === "pinned" ? "portal-sidebar-link-active" : ""}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <Star size={16} style={{ fill: activeFilter === "pinned" ? THEME.accent : "transparent" }} />
                  필독 게시글
                </Link>
                <Link
                  to="/portal/board?filter=important"
                  className={`portal-sidebar-link ${activeFilter === "important" ? "portal-sidebar-link-active" : ""}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <Star size={16} style={{ color: "#f59e0b", fill: activeFilter === "important" ? "#f59e0b" : "transparent" }} />
                  중요 게시글
                </Link>
                <Link
                  to="/portal/board?filter=mine"
                  className={`portal-sidebar-link ${activeFilter === "mine" ? "portal-sidebar-link-active" : ""}`}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <User size={16} />
                  내 게시글
                </Link>
              </div>

              <div style={{ height: 1, background: THEME.sidebarBorder, margin: "12px 8px" }} />

              {/* 게시판 필터링 검색창 */}
              <div style={{ padding: "0 8px 12px", position: "relative" }}>
                <input
                  type="text"
                  placeholder="게시판 이름으로 검색"
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  className="portal-board-filter-input"
                />
                <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: THEME.sidebarTextMuted, display: "flex", alignItems: "center" }}>
                  <Search size={13} />
                </div>
              </div>

              {/* 전체 게시판 카테고리 트리 */}
              <div style={{ padding: "0 8px" }}>
                <div className="portal-sidebar-header">
                  전체 게시판
                </div>

                {/* 메인 그룹: 법무법인 하이로 */}
                <div style={{ padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                    <ChevronRight size={14} style={{ transform: "rotate(90deg)", color: THEME.sidebarTextMuted }} />
                    <FolderOpen size={16} style={{ color: THEME.accent }} />
                    법무법인 하이로
                  </div>

                  {/* 하위 노드 */}
                  <div style={{ paddingLeft: 20 }}>
                    {filteredCategories.map((cat) => {
                      const isActive = activeCategory === cat.key;
                      return (
                        <Link
                          key={cat.key}
                          to={`/portal/board?category=${cat.key}`}
                          className={`portal-sidebar-link ${isActive ? "portal-sidebar-link-active" : ""}`}
                          onClick={() => isMobile && setIsSidebarOpen(false)}
                        >
                          <FolderClosed size={14} />
                          {cat.label}
                        </Link>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <div style={{ fontSize: 11, color: THEME.sidebarTextMuted, padding: "8px 12px" }}>
                        검색 결과 없음
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: 1, background: THEME.sidebarBorder, margin: "16px 8px" }} />

                {/* 휴지통 */}
                <div style={{ padding: "0 0 16px" }}>
                  <Link
                    to="/portal/board?filter=trash"
                    className={`portal-sidebar-link ${activeFilter === "trash" ? "portal-sidebar-link-active" : ""}`}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                  >
                    <Trash2 size={14} />
                    휴지통
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="portal-sidebar-header">
                메뉴
              </div>

              <Link
                to="/portal/calendar"
                className={`portal-sidebar-link ${location.pathname === "/portal/calendar" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Home size={16} />
                일정 캘린더 (홈)
              </Link>

              <Link
                to="/portal/dashboard"
                className={`portal-sidebar-link ${location.pathname === "/portal/dashboard" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Calendar size={16} />
                사건 목록
              </Link>

              <Link
                to="/portal/board"
                className={`portal-sidebar-link ${location.pathname.startsWith("/portal/board") ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <FileText size={16} />
                게시판
              </Link>

              <Link
                to="/portal/time-tracking"
                className={`portal-sidebar-link ${location.pathname === "/portal/time-tracking" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Clock size={16} />
                타임트래킹
              </Link>

              <Link
                to="/portal/profile"
                className={`portal-sidebar-link ${location.pathname === "/portal/profile" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <User size={16} />
                프로필 설정
              </Link>

              <Link
                to="/portal/blog"
                className={`portal-sidebar-link ${location.pathname === "/portal/blog" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <BookOpen size={16} />
                블로그 관리
              </Link>

              <Link
                to="/portal/qna"
                className={`portal-sidebar-link ${location.pathname === "/portal/qna" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <MessageSquare size={16} />
                법률 Q&A 관리
              </Link>

              <Link
                to="/portal/approvals"
                className={`portal-sidebar-link ${location.pathname === "/portal/approvals" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <FileText size={16} />
                전자결재 시스템
              </Link>

              <Link
                to="/portal/ai-settings"
                className={`portal-sidebar-link ${location.pathname === "/portal/ai-settings" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Bot size={16} />
                AI 연동 설정
              </Link>

              <Link
                to="/portal/messages"
                className={`portal-sidebar-link ${location.pathname === "/portal/messages" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Mail size={16} />
                메시지 발송
              </Link>

              <Link
                to="/portal/bookings"
                className={`portal-sidebar-link ${location.pathname === "/portal/bookings" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <CalendarCheck size={16} />
                예약 관리
              </Link>

              <Link
                to="/portal/clients"
                className={`portal-sidebar-link ${location.pathname === "/portal/clients" ? "portal-sidebar-link-active" : ""}`}
                onClick={() => isMobile && setIsSidebarOpen(false)}
              >
                <Users size={16} />
                고객 관리
              </Link>

              <a
                href="/"
                className="portal-sidebar-link"
              >
                <BookOpen size={16} style={{ color: THEME.sidebarTextMuted }} />
                홈페이지 바로가기
              </a>
            </>
          )}
        </div>

        {/* 사이드바 푸터 */}
        <div style={{ padding: 16, borderTop: `1px solid ${THEME.sidebarBorder}`, fontSize: 11, color: THEME.sidebarTextMuted }}>
          © 법무법인 하이로
        </div>
      </aside>

      {/* ==================== 2. 메인 콘텐츠 및 탑바 영역 ==================== */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : (isSidebarOpen ? 240 : 0),
        transition: "margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...(isEditor ? { height: "100vh" } : { minHeight: "100vh" })
      }}>
        {/* 탑 바 (Header) - 에디터 모드에서는 숨김 */}
        {!isEditor && (
          <header style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 24px", height: 60, background: "#ffffff",
            borderBottom: `1px solid ${THEME.border}`, position: "sticky", top: 0, zIndex: 100,
            boxShadow: "0 1px 3px rgba(11,31,58,0.05)"
          }}>
            {/* 왼쪽 로고 및 햄버거 메뉴 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", padding: 4, borderRadius: 4 }}
                title="사이드바 토글"
              >
                <Menu size={20} />
              </button>
              {isMobile ? (
                <Link to="/portal/calendar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <LogoCanvas size={16} color={THEME.accent} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text, letterSpacing: "0.05em", fontFamily: "'Georgia', serif" }}>
                    HIGHLAW
                  </span>
                </Link>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600, color: THEME.textSec, letterSpacing: "0.05em" }}>
                  INTRANET PORTAL
                </span>
              )}
            </div>

            {/* 가운데 검색창 */}
            {!isMobile && (
              <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: 360 }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="게시글 검색"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="portal-search-input"
                />
              </form>
            )}

            {/* 오른쪽 퀵 메뉴 및 아바타 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!isMobile && (
                <>
                  <Link 
                    to="/portal/calendar" 
                    style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/calendar" ? THEME.accent : "#64748b", transition: "background 0.2s", display: "flex" }}
                    title="일정 캘린더"
                  >
                    <Home size={20} />
                  </Link>
                  <Link 
                    to="/portal/board" 
                    style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/board" ? THEME.accent : "#64748b", transition: "background 0.2s", display: "flex" }}
                    title="내부 게시판"
                  >
                    <FileText size={20} />
                  </Link>
                  <Link 
                    to="/portal/dashboard" 
                    style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/dashboard" ? THEME.accent : "#64748b", transition: "background 0.2s", display: "flex" }}
                    title="사건 목록"
                  >
                    <Calendar size={20} />
                  </Link>
                  <Link 
                    to="/portal/time-tracking" 
                    style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/time-tracking" ? THEME.accent : "#64748b", transition: "background 0.2s", display: "flex" }}
                    title="타임트래킹"
                  >
                    <Clock size={20} />
                  </Link>
                  <Link 
                    to="/portal/profile" 
                    style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/profile" ? THEME.accent : "#64748b", transition: "background 0.2s", display: "flex" }}
                    title="내 프로필 설정"
                  >
                    <User size={20} />
                  </Link>

                  <div style={{ height: 16, width: 1, background: THEME.border, margin: "0 8px" }} />
                </>
              )}

              {/* 프로필 아바타 및 로그아웃 버튼 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: THEME.accentDim, color: THEME.accent,
                  border: `1px solid rgba(201,168,76,0.25)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
                  boxShadow: "0 2px 4px rgba(201,168,76,0.1)"
                }} title={userProfile?.client?.name || userProfile?.user?.email}>
                  {userInitial}
                </div>
                
                <a
                  href="/"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", fontSize: 12, fontWeight: 500,
                    color: THEME.textSec, background: "transparent",
                    border: `1px solid ${THEME.border}`, borderRadius: 6, textDecoration: "none",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  홈페이지 가기
                </a>

                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", fontSize: 12, fontWeight: 500,
                    color: "#ef4444", background: "transparent",
                    border: "1px solid #fee2e2", borderRadius: 6, cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <LogOut size={13} />
                  로그아웃
                </button>
              </div>
            </div>
          </header>
        )}

        {/* 본문 콘텐츠 영역 */}
        {isEditor ? (
          <Outlet />
        ) : (
          <main style={{
            flex: 1,
            padding: isMobile ? "16px 14px 80px" : "36px 44px",
            overflowY: "auto",
            boxSizing: "border-box"
          }}>
            <Outlet />
          </main>
        )}

        {/* 푸터 영역 - 에디터 모드에서는 숨김 */}
        {!isEditor && (
          <footer style={{
            borderTop: `1px solid ${THEME.border}`,
            padding: isMobile ? "12px 16px" : "12px 44px",
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: "0.1em",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            textTransform: "uppercase",
            background: THEME.white,
          }}>
            <span>HIGH & LAW FIRM INTRANET</span>
            <span style={{ fontFamily: "'Georgia', serif", color: THEME.textMuted }}>SECURE PORTAL ACCESS</span>
          </footer>
        )}
      </div>
    </div>
  );
}
