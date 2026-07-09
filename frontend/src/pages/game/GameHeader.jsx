import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const C = { dark: "rgba(6,9,15,0.96)", accent: "#3b82f6", gold: "#c9a84c", border: "rgba(59,130,246,0.15)" };

const NAV = [
  { label: "하이로 게임센터", sub: [
    { label: "인사말", to: "/game/about" },
    { label: "핵심가치", to: "/game/about/values" },
    { label: "오시는 길", to: "/game/about/directions" },
    { label: "공익활동", to: "/game/about/probono" },
    { label: "연혁", to: "/game/about/history" },
  ]},
  { label: "구성원", sub: [
    { label: "변호사", to: "/game/members" },
    { label: "전문위원", to: "/game/members/consultants" },
    { label: "직원", to: "/game/members/staff" },
  ]},
  { label: "업무 분야", sub: [
    { label: "게임민사", to: "/game/practices" },
    { label: "게임형사", to: "/game/practices/criminal" },
    { label: "게임행정", to: "/game/practices/admin" },
  ]},
  { label: "하이로 소식", sub: [
    { label: "하이로 뉴스", to: "/game/info" },
    { label: "게임법률 가이드", to: "/game/info/guide" },
  ]},
  { label: "상담문의", sub: [
    { label: "상담신청", to: "/game/consultation" },
    { label: "진행절차", to: "/game/consultation/process" },
    { label: "FAQ", to: "/game/consultation/faq" },
  ]},
];

export default function GameHeader() {
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);

  return (
    <>
      <style>{`
        .gh-sub-link { display:block; padding:7px 12px; border-radius:5px; font-size:12px; color:rgba(255,255,255,0.75); text-decoration:none; transition:background 0.15s,color 0.15s; }
        .gh-sub-link:hover { background:rgba(59,130,246,0.12); color:#fff; }
        .gh-nav-label { font-size:11px; font-weight:500; letter-spacing:0.08em; color:rgba(255,255,255,0.65); cursor:pointer; padding:6px 10px; border-radius:4px; transition:color 0.15s; border:none; background:none; }
        .gh-nav-label:hover { color:#fff; }
        @media (max-width:900px) { .gh-desktop-nav { display:none!important; } }
        @media (min-width:901px) { .gh-mobile-btn { display:none!important; } }
      `}</style>

      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, background:C.dark, backdropFilter:"blur(14px)", borderBottom:`1px solid ${C.border}`, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 clamp(16px,4vw,48px)" }}>
        {/* Logo */}
        <Link to="/game" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
          <span style={{ fontFamily:"var(--font-serif)", fontSize:18, fontWeight:700, color:C.gold, letterSpacing:"0.05em" }}>HIGH &amp; LAW</span>
          <div style={{ width:1, height:16, background:"rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize:11, fontWeight:600, color:C.accent, letterSpacing:"0.12em", textTransform:"uppercase" }}>게임센터</span>
        </Link>

        {/* Desktop nav */}
        <nav className="gh-desktop-nav" style={{ display:"flex", alignItems:"center", gap:4, position:"relative" }} onMouseLeave={() => setDropOpen(false)}>
          {NAV.map((item, idx) => (
            <div key={idx} style={{ position:"relative" }} onMouseEnter={() => setDropOpen(idx)}>
              <button className="gh-nav-label">{item.label}<ChevronDown size={11} style={{ marginLeft:4, verticalAlign:"middle" }} /></button>
              {dropOpen === idx && (
                <div style={{ position:"absolute", top:"calc(100% + 8px)", left:"50%", transform:"translateX(-50%)", background:"rgba(6,9,15,0.97)", border:`1px solid ${C.border}`, borderRadius:8, padding:8, minWidth:140, boxShadow:"0 12px 40px rgba(0,0,0,0.5)", zIndex:999 }}>
                  {item.sub.map(s => <Link key={s.to} to={s.to} className="gh-sub-link" onClick={() => setDropOpen(false)}>{s.label}</Link>)}
                </div>
              )}
            </div>
          ))}
          <a href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:6, background:C.accent, color:"#fff", fontWeight:600, fontSize:12, padding:"8px 16px", borderRadius:4, textDecoration:"none", marginLeft:8, whiteSpace:"nowrap" }}>
            <MessageCircle size={14} />카카오톡 상담
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button className="gh-mobile-btn" onClick={() => setMobileOpen(o => !o)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:8 }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position:"fixed", top:64, left:0, right:0, bottom:0, background:"rgba(6,9,15,0.98)", zIndex:199, overflowY:"auto", padding:"16px 20px" }}>
          {NAV.map((item, idx) => (
            <div key={idx} style={{ borderBottom:"1px solid rgba(59,130,246,0.1)", marginBottom:8 }}>
              <button onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
                style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", color:"rgba(255,255,255,0.85)", fontSize:14, fontWeight:600, padding:"12px 4px", cursor:"pointer" }}>
                {item.label}<ChevronDown size={14} style={{ transform: mobileExpanded===idx ? "rotate(180deg)":"none", transition:"transform 0.2s" }} />
              </button>
              {mobileExpanded === idx && (
                <div style={{ paddingLeft:16, paddingBottom:8 }}>
                  {item.sub.map(s => <Link key={s.to} to={s.to} onClick={() => setMobileOpen(false)}
                    style={{ display:"block", padding:"8px 4px", color:"rgba(255,255,255,0.65)", fontSize:13, textDecoration:"none" }}>{s.label}</Link>)}
                </div>
              )}
            </div>
          ))}
          <a href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:C.accent, color:"#fff", fontWeight:700, fontSize:14, padding:"14px 20px", borderRadius:6, textDecoration:"none", marginTop:16 }}>
            <MessageCircle size={16} />카카오톡으로 즉시 상담
          </a>
        </div>
      )}
    </>
  );
}
