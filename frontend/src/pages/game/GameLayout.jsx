import { Outlet, Link } from "react-router-dom";
import GameHeader from "./GameHeader";
import GameFloater from "./GameFloater";

const BLUE = "#1d4ed8";

export default function GameLayout() {
  return (
    <>
      <GameHeader />
      <main style={{ minHeight: "100vh" }}>
        <Outlet />
      </main>
      <footer
        style={{
          background: "#0f172a",
          borderTop: "3px solid " + BLUE,
          padding: "32px clamp(20px,7vw,120px)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>HIGHLAW 게임센터</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>© 2025 법무법인 하이로. All rights reserved.</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { to: "/",        label: "법인 홈페이지" },
            { to: "/game",    label: "게임센터 홈" },
            { to: "/privacy", label: "개인정보처리방침" },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
      <GameFloater />
    </>
  );
}
