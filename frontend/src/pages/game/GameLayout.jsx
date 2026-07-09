import { Outlet, Link } from "react-router-dom";
import GameHeader from "./GameHeader";
import GameFloater from "./GameFloater";

export default function GameLayout() {
  return (
    <>
      <GameHeader />
      <main style={{ minHeight: "100vh" }}>
        <Outlet />
      </main>
      <footer
        style={{
          background: "#020408",
          borderTop: "1px solid rgba(59,130,246,0.08)",
          padding: "28px clamp(20px,7vw,120px)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>HIGHLAW 게임센터</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>© 2025 법무법인 하이로. All rights reserved.</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { to: "/", label: "법인 홈페이지" },
            { to: "/game", label: "게임센터 홈" },
            { to: "/privacy", label: "개인정보처리방침" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
      <GameFloater />
    </>
  );
}
