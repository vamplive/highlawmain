/** 포털 레이아웃 -- NAVER Works 스타일의 전사 인트라넷 레이아웃 */
import { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
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
  Mail
} from "lucide-react";

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

  // 현재 사용자 이름 첫 글자 추출
  const userInitial = userProfile?.client?.name 
    ? userProfile.client.name.charAt(0) 
    : (userProfile?.user?.email ? userProfile.user.email.charAt(0).toUpperCase() : "U");

  // 게시판 카테고리 목록
  const boardCategories = [
    { key: "notice", label: "공지사항" },
    { key: "manual", label: "업무 매뉴얼" },
    { key: "free", label: "자유게시판" },
    { key: "template", label: "양식" },
  ];

  // 사이드바 카테고리 필터링 (검색어 입력 시)
  const filteredCategories = boardCategories.filter(cat => 
    cat.label.toLowerCase().includes(boardSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ==================== 1. 탑 바 (Header) ==================== */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60, background: "#ffffff",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
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
          <Link to="/portal/calendar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.025em" }}>
              HIGH & LAW <span style={{ color: "#8b5cf6", fontWeight: 500, fontSize: 14 }}>인트라넷</span>
            </span>
          </Link>
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
              style={{
                width: "100%", padding: "8px 14px 8px 38px", fontSize: 13,
                border: "1px solid #e2e8f0", borderRadius: 20, background: "#f1f5f9",
                outline: "none", transition: "all 0.2s", boxSizing: "border-box"
              }}
              onFocus={(e) => { e.target.style.background = "#fff"; e.target.style.borderColor = "#a855f7"; }}
              onBlur={(e) => { e.target.style.background = "#f1f5f9"; e.target.style.borderColor = "#e2e8f0"; }}
            />
          </form>
        )}

        {/* 오른쪽 퀵 메뉴 및 아바타 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <>
              <Link 
                to="/portal/calendar" 
                style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/calendar" ? "#8b5cf6" : "#64748b", transition: "background 0.2s", display: "flex" }}
                title="일정 캘린더"
              >
                <Home size={20} />
              </Link>
              <Link 
                to="/portal/board" 
                style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/board" ? "#8b5cf6" : "#64748b", transition: "background 0.2s", display: "flex" }}
                title="내부 게시판"
              >
                <FileText size={20} />
              </Link>
              <Link 
                to="/portal/dashboard" 
                style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/dashboard" ? "#8b5cf6" : "#64748b", transition: "background 0.2s", display: "flex" }}
                title="사건 목록"
              >
                <Calendar size={20} />
              </Link>
              <Link 
                to="/portal/time-tracking" 
                style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/time-tracking" ? "#8b5cf6" : "#64748b", transition: "background 0.2s", display: "flex" }}
                title="타임트래킹"
              >
                <Clock size={20} />
              </Link>
              <Link 
                to="/portal/profile" 
                style={{ padding: 8, borderRadius: 8, color: location.pathname === "/portal/profile" ? "#8b5cf6" : "#64748b", transition: "background 0.2s", display: "flex" }}
                title="내 프로필 설정"
              >
                <User size={20} />
              </Link>

              <div style={{ height: 16, width: 1, background: "#cbd5e1", margin: "0 8px" }} />
            </>
          )}

          {/* 프로필 아바타 및 로그아웃 버튼 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "#a855f7", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
              boxShadow: "0 2px 4px rgba(168,85,247,0.2)"
            }} title={userProfile?.client?.name || userProfile?.user?.email}>
              {userInitial}
            </div>
            
            <a
              href="/"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", fontSize: 12, fontWeight: 500,
                color: "#475569", background: "transparent",
                border: "1px solid #cbd5e1", borderRadius: 6, textDecoration: "none",
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

      {/* ==================== 2. 바디 영역 (사이드바 + 콘텐츠) ==================== */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* 사이드바 */}
        <aside style={{
          width: isSidebarOpen ? 240 : 0,
          background: "#ffffff",
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          overflow: "hidden",
          boxSizing: "border-box"
        }}>
          {/* 메인 메뉴 */}
          <div style={{ padding: "16px 8px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              메뉴
            </div>
            
            <Link
              to="/portal/calendar"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/calendar" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/calendar" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/calendar" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <Home size={16} />
              일정 캘린더 (홈)
            </Link>

            <Link
              to="/portal/dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/dashboard" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/dashboard" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/dashboard" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <Calendar size={16} />
              사건 목록
            </Link>

            <Link
              to="/portal/board"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname.startsWith("/portal/board") ? "#7c3aed" : "#334155",
                background: location.pathname.startsWith("/portal/board") ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname.startsWith("/portal/board") ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <FileText size={16} />
              내부 게시판
            </Link>

            <Link
              to="/portal/time-tracking"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/time-tracking" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/time-tracking" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/time-tracking" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <Clock size={16} />
              타임트래킹
            </Link>

            <Link
              to="/portal/profile"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/profile" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/profile" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/profile" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <User size={16} />
              프로필 설정
            </Link>

            <Link
              to="/portal/blog"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/blog" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/blog" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/blog" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <BookOpen size={16} />
              블로그 관리
            </Link>

            <Link
              to="/portal/qna"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/qna" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/qna" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/qna" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <MessageSquare size={16} />
              법률 Q&A 관리
            </Link>

            <Link
              to="/portal/messages"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: location.pathname === "/portal/messages" ? "#7c3aed" : "#334155",
                background: location.pathname === "/portal/messages" ? "#f5f3ff" : "transparent",
                fontWeight: location.pathname === "/portal/messages" ? 600 : 500,
                transition: "background 0.15s", marginBottom: 2
              }}
            >
              <Mail size={16} />
              메시지 발송
            </Link>

            <a
              href="/"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: "#334155",
                fontWeight: 500,
                transition: "background 0.15s", marginBottom: 2
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <BookOpen size={16} style={{ color: "#64748b" }} />
              홈페이지 바로가기
            </a>
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "0 16px 12px" }} />

          {/* 글쓰기 버튼 */}
          <div style={{ padding: "8px 16px 12px" }}>
            <button
              onClick={() => navigate("/portal/board?write=true")}
              style={{
                width: "100%", height: 42,
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "#ffffff", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                transition: "transform 0.15s, opacity 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.95"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <Plus size={16} />
              게시글 쓰기
            </button>
          </div>

          {/* 사이드바 게시판 필터 메뉴 */}
          <div style={{ padding: "0 8px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              게시판 필터
            </div>
            <Link
              to="/portal/board?filter=recent"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: activeFilter === "recent" ? "#7c3aed" : "#334155",
                background: activeFilter === "recent" ? "#f5f3ff" : "transparent",
                fontWeight: activeFilter === "recent" ? 600 : 500,
                transition: "background 0.15s"
              }}
            >
              <Clock size={16} />
              최신글
            </Link>
            <Link
              to="/portal/board?filter=pinned"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: activeFilter === "pinned" ? "#7c3aed" : "#334155",
                background: activeFilter === "pinned" ? "#f5f3ff" : "transparent",
                fontWeight: activeFilter === "pinned" ? 600 : 500,
                transition: "background 0.15s"
              }}
            >
              <Star size={16} style={{ fill: activeFilter === "pinned" ? "#7c3aed" : "transparent" }} />
              필독 게시글
            </Link>
            <Link
              to="/portal/board?filter=important"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: activeFilter === "important" ? "#7c3aed" : "#334155",
                background: activeFilter === "important" ? "#f5f3ff" : "transparent",
                fontWeight: activeFilter === "important" ? 600 : 500,
                transition: "background 0.15s"
              }}
            >
              <Star size={16} style={{ color: "#f59e0b", fill: activeFilter === "important" ? "#f59e0b" : "transparent" }} />
              중요 게시글
            </Link>
            <Link
              to="/portal/board?filter=mine"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 6, textDecoration: "none", fontSize: 13,
                color: activeFilter === "mine" ? "#7c3aed" : "#334155",
                background: activeFilter === "mine" ? "#f5f3ff" : "transparent",
                fontWeight: activeFilter === "mine" ? 600 : 500,
                transition: "background 0.15s"
              }}
            >
              <User size={16} />
              내 게시글
            </Link>
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "0 16px 16px" }} />

          {/* 게시판 필터링 검색창 */}
          <div style={{ padding: "0 16px 16px", position: "relative" }}>
            <input
              type="text"
              placeholder="게시판 이름으로 검색"
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              style={{
                width: "100%", padding: "6px 10px 6px 28px", fontSize: 12,
                border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc",
                outline: "none", boxSizing: "border-box"
              }}
            />
            <div style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center" }}>
              <Search size={13} />
            </div>
          </div>

          {/* 전체 게시판 카테고리 트리 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              전체 게시판
            </div>

            {/* 메인 그룹: 법무법인 하이로 */}
            <div style={{ padding: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                <ChevronRight size={14} style={{ transform: "rotate(90deg)", color: "#94a3b8" }} />
                <FolderOpen size={16} style={{ color: "#64748b" }} />
                법무법인 하이로
              </div>

              {/* 하위 노드 */}
              <div style={{ paddingLeft: 24 }}>
                {filteredCategories.map((cat) => {
                  const isActive = activeCategory === cat.key;
                  return (
                    <Link
                      key={cat.key}
                      to={`/portal/board?category=${cat.key}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                        borderRadius: 6, textDecoration: "none", fontSize: 12.5,
                        color: isActive ? "#7c3aed" : "#475569",
                        background: isActive ? "#f5f3ff" : "transparent",
                        fontWeight: isActive ? 600 : 500,
                        transition: "background 0.15s"
                      }}
                    >
                      <FolderClosed size={14} style={{ color: isActive ? "#a78bfa" : "#94a3b8" }} />
                      {cat.label}
                    </Link>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <div style={{ fontSize: 11, color: "#94a3b8", padding: "8px 12px" }}>
                    검색 결과 없음
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "16px 8px" }} />

            {/* 휴지통 */}
            <div style={{ padding: "0 0 16px" }}>
              <Link
                to="/portal/board?filter=trash"
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                  borderRadius: 6, textDecoration: "none", fontSize: 12.5,
                  color: activeFilter === "trash" ? "#7c3aed" : "#64748b",
                  background: activeFilter === "trash" ? "#f5f3ff" : "transparent",
                  fontWeight: activeFilter === "trash" ? 600 : 500,
                  transition: "background 0.15s"
                }}
              >
                <Trash2 size={14} style={{ color: activeFilter === "trash" ? "#7c3aed" : "#94a3b8" }} />
                휴지통
              </Link>
            </div>
          </div>

          {/* 사이드바 푸터 */}
          <div style={{ padding: 16, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
            © 법무법인 하이로
          </div>
        </aside>

        {/* ==================== 3. 메인 콘텐츠 콘텐츠 영역 ==================== */}
        <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto", boxSizing: "border-box" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
