import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import LogoCanvas from "../../components/layout/LogoCanvas";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const BLUE   = "#1d4ed8";
const BLUE_L = "#3b82f6";

const NAV = [
  {
    label: "하이로 게임센터",
    sub: [
      { label: "인사말",   to: "/game/about" },
      { label: "핵심가치", to: "/game/about/values" },
      { label: "오시는 길",to: "/game/about/directions" },
      { label: "공익활동", to: "/game/about/probono" },
      { label: "연혁",     to: "/game/about/history" },
    ],
  },
  {
    label: "구성원",
    sub: [
      { label: "변호사",   to: "/game/members" },
      { label: "전문위원", to: "/game/members/consultants" },
      { label: "직원",     to: "/game/members/staff" },
    ],
  },
  {
    label: "업무 분야",
    sub: [
      { label: "게임민사", to: "/game/practices" },
      { label: "게임형사", to: "/game/practices/criminal" },
      { label: "게임행정", to: "/game/practices/admin" },
    ],
  },
  {
    label: "하이로 소식",
    sub: [
      { label: "하이로 뉴스",     to: "/game/info" },
      { label: "게임법률 가이드", to: "/game/info/guide" },
    ],
  },
  {
    label: "상담문의",
    sub: [
      { label: "상담신청", to: "/game/consultation" },
      { label: "진행절차", to: "/game/consultation/process" },
      { label: "FAQ",      to: "/game/consultation/faq" },
    ],
  },
];

export default function GameHeader() {
  const [megaOpen,      setMegaOpen]      = useState(false);
  const [activeGroup,   setActiveGroup]   = useState(0);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [mobileExpanded,setMobileExpanded]= useState(null);
  const timer = useRef(null);

  function openMega(idx) {
    clearTimeout(timer.current);
    setActiveGroup(idx);
    setMegaOpen(true);
  }
  function scheduleClose() { timer.current = setTimeout(() => setMegaOpen(false), 150); }
  function cancelClose()   { clearTimeout(timer.current); }

  return (
    <>
      <style>{`
        .ghdr-btn {
          font-size: 12.5px; font-weight: 600; color: #374151;
          padding: 0 16px; height: 64px; border: none; background: none;
          cursor: pointer; transition: color .15s; white-space: nowrap;
          display: flex; align-items: center; gap: 4px; justify-content: center;
        }
        .ghdr-btn:hover, .ghdr-btn.act { color: ${BLUE}; }
        .ghdr-mlink { display: block; padding: 7px 12px; border-radius: 6px; font-size: 12.5px; color: #6b7280; text-decoration: none; transition: background .12s, color .12s; white-space: nowrap; }
        .ghdr-mlink:hover { background: #eff6ff; color: ${BLUE}; }
        .ghdr-mlink-hi { color: #374151 !important; }
        @media(max-width:960px){ .ghdr-desk{ display:none!important; } }
        @media(min-width:961px){ .ghdr-mob-btn{ display:none!important; } }
      `}</style>

      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
          height: 64,
        }}
      >
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 clamp(16px,3vw,40px)", gap: 0 }}>
          {/* Logo */}
          <Link to="/game" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, marginRight: 20 }}>
            <LogoCanvas size={28} color={BLUE} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: "0.03em", lineHeight: 1.2 }}>
                HIGHLAW <span style={{ color: BLUE }}>게임센터</span>
              </span>
              <span style={{ fontSize: 9, fontWeight: 500, color: "#9ca3af", letterSpacing: "0.08em" }}>법무법인 하이로</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="ghdr-desk" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div
              style={{ position: "relative" }}
              onMouseLeave={scheduleClose}
              onMouseEnter={cancelClose}
            >
              {/* Button row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", minWidth: 500 }}>
                {NAV.map((item, idx) => (
                  <button
                    key={idx}
                    className={`ghdr-btn${megaOpen && activeGroup === idx ? " act" : ""}`}
                    onMouseEnter={() => openMega(idx)}
                  >
                    {item.label}
                    <ChevronDown size={10} style={{ transition: "transform .2s", transform: megaOpen && activeGroup === idx ? "rotate(180deg)" : "none" }} />
                  </button>
                ))}
              </div>

              {/* Mega panel */}
              {megaOpen && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: "absolute", top: "calc(100% + 1px)", left: 0, right: 0,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderTop: "2px solid " + BLUE,
                    borderRadius: "0 0 12px 12px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
                    zIndex: 999,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    padding: "12px 0 16px",
                  }}
                >
                  {NAV.map((group, gIdx) => (
                    <div key={gIdx} style={{ padding: "0 8px", borderRight: gIdx < NAV.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div
                        style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                          textTransform: "uppercase", padding: "4px 12px 8px",
                          color: gIdx === activeGroup ? BLUE : "#d1d5db",
                        }}
                      >
                        {group.label}
                      </div>
                      {group.sub.map(s => (
                        <Link
                          key={s.to}
                          to={s.to}
                          className={`ghdr-mlink${gIdx === activeGroup ? " ghdr-mlink-hi" : ""}`}
                          onClick={() => setMegaOpen(false)}
                        >
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <a
              href={KAKAO_CHANNEL_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: BLUE, color: "#fff", fontWeight: 700, fontSize: 12,
                padding: "8px 16px", borderRadius: 6, textDecoration: "none",
                marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: "0 2px 8px rgba(29,78,216,0.35)",
              }}
            >
              <MessageCircle size={13} />카카오 상담
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="ghdr-mob-btn"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", padding: 8, marginLeft: "auto" }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", top: 64, left: 0, right: 0, bottom: 0,
            background: "#ffffff", zIndex: 199, overflowY: "auto", padding: "12px 20px",
          }}
        >
          {NAV.map((item, idx) => (
            <div key={idx} style={{ borderBottom: "1px solid #f3f4f6", marginBottom: 2 }}>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: "#111827", fontSize: 14, fontWeight: 600, padding: "13px 4px", cursor: "pointer" }}
              >
                {item.label}
                <ChevronDown size={14} style={{ transform: mobileExpanded === idx ? "rotate(180deg)" : "none", transition: "transform .2s", color: "#9ca3af" }} />
              </button>
              {mobileExpanded === idx && (
                <div style={{ paddingLeft: 16, paddingBottom: 10 }}>
                  {item.sub.map(s => (
                    <Link key={s.to} to={s.to} onClick={() => setMobileOpen(false)}
                      style={{ display: "block", padding: "9px 4px", color: "#6b7280", fontSize: 13, textDecoration: "none" }}>
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a
            href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: BLUE, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px 20px", borderRadius: 8, textDecoration: "none", marginTop: 16 }}
          >
            <MessageCircle size={16} />카카오톡으로 즉시 상담
          </a>
        </div>
      )}
    </>
  );
}
