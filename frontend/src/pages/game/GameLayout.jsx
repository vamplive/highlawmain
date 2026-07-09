import { Outlet, Link } from "react-router-dom";
import GameHeader from "./GameHeader";

export default function GameLayout() {
  return (
    <>
      <GameHeader />
      <main style={{ minHeight: "100vh" }}>
        <Outlet />
      </main>
      <footer style={{ background:"#03050c", padding:"28px clamp(20px,7vw,120px)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>© 2025 법무법인 하이로. All rights reserved.</span>
        <div style={{ display:"flex", gap:20 }}>
          {[{to:"/",label:"법인 홈페이지"},{to:"/game",label:"게임센터 홈"},{to:"/privacy",label:"개인정보처리방침"}].map(({to,label}) => (
            <Link key={to} to={to} style={{ fontSize:12, color:"rgba(255,255,255,0.35)", textDecoration:"none" }}
              onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.35)"}>{label}</Link>
          ))}
        </div>
      </footer>
    </>
  );
}
