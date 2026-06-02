/** 포털 레이아웃 -- 의뢰인 포털 헤더/네비게이션 래퍼, 인증 확인 */
import { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate, Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";

export default function PortalLayout() {
  const navigate = useNavigate();

  // 토큰이 HttpOnly 쿠키에 있어 JS로 존재 여부를 알 수 없다 → /me로 서버에 확인.
  // 'checking' 동안에는 아무 것도 렌더하지 않아 보호 콘텐츠가 순간적으로라도 노출되지 않게 한다.
  const [authState, setAuthState] = useState("checking"); // "checking" | "authed" | "unauthed"

  useEffect(() => {
    let cancelled = false;
    portalApi.get("/me")
      .then(() => { if (!cancelled) setAuthState("authed"); })
      .catch(() => { if (!cancelled) setAuthState("unauthed"); });
    return () => { cancelled = true; };
  }, []);

  if (authState === "checking") return null;
  if (authState === "unauthed") return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    // 쿠키 삭제는 서버가 Set-Cookie로 처리한다
    try { await portalApi.post("/logout"); } catch { /* 네트워크 오류 무시 */ }
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
      {/* ==================== 헤더 ==================== */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60, background: "#fff",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link to="/portal" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif" }}>
            법무법인 하이로
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/portal/dashboard" style={{ fontSize: 13, color: T.text, textDecoration: "none", fontWeight: 500 }}>
            사건 목록
          </Link>
          <Link to="/portal/time-tracking" style={{ fontSize: 13, color: T.text, textDecoration: "none", fontWeight: 500 }}>
            타임트래킹
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 500,
              color: T.accent, background: "transparent",
              border: `1px solid ${T.accent}`, borderRadius: 4, cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>

      {/* ==================== 콘텐츠 ==================== */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
