import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import LogoCanvas from "../../components/layout/LogoCanvas";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const C = {
  dark: "rgba(10,15,28,0.97)",
  accent: "#3b82f6",
  gold: "#c9a84c",
  border: "rgba(59,130,246,0.18)",
};

const NAV = [
  {
    label: "하이로 게임센터",
    sub: [
      { label: "인사말", to: "/game/about" },
      { label: "핵심가치", to: "/game/about/values" },
      { label: "오시는 길", to: "/game/about/directions" },
      { label: "공익활동", to: "/game/about/probono" },
      { label: "연혁", to: "/game/about/history" },
    ],
  },
  {
    label: "구성원",
    sub: [
      { label: "변호사", to: "/game/members" },
      { label: "전문위원", to: "/game/members/consultants" },
      { label: "직원", to: "/game/members/staff" },
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
      { label: "하이로 뉴스", to: "/game/info" },
      { label: "게임법률 가이드", to: "/game/info/guide" },
    ],
  },
  {
    label: "상담문의",
    sub: [
      { label: "상담신청", to: "/game/consultation" },
      { label: "진행절차", to: "/game/consultation/process" },
      { label: "FAQ", to: "/game/consultation/faq" },
    ],
  },
];

export default function GameHeader() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const leaveTimer = useRef(null);

  function openMega(idx) {
    clearTimeout(leaveTimer.current);
    setActiveGroup(idx);
    setMegaOpen(true);
  }

  function scheduleClose() {
    leaveTimer.current = setTimeout(() => setMegaOpen(false), 140);
  }

  function cancelClose() {
    clearTimeout(leaveTimer.current);
  }

  return (
    <>
      <style>{`
        .gh-nav-btn {
          font-size: 12px; font-weight: 500; letter-spacing: 0.04em;
          color: rgba(255,255,255,0.6); cursor: pointer;
          padding: 0 18px; height: 64px;
          border: none; background: none;
          transition: color 0.15s; white-space: nowrap;
          display: flex; align-items: center; gap: 4px;
        }
        .gh-nav-btn:hover, .gh-nav-btn.gh-act { color: #fff; }
        .gh-mega-link {
          display: block; padding: 7px 12px; border-radius: 5px;
          font-size: 12px; color: rgba(255,255,255,0.55);
          text-decoration: none; transition: background 0.12s, color 0.12s;
          white-space: nowrap;
        }
        .gh-mega-link:hover { background: rgba(59,130,246,0.12); color: #fff; }
        .gh-mega-link-active { color: rgba(255,255,255,0.85) !important; }
        @media(max-width:960px){ .gh-desktop{ display:none!important; } }
        @media(min-width:961px){ .gh-mob-btn{ display:none!important; } }
      `}</style>

      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: C.dark, backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`, height: 64,
        }}
      >
        <div
          style={{
            height: 64, display: "flex", alignItems: "center",
            padding: "0 clamp(16px,3vw,40px)", gap: 0,
          }}
        >
          {/* Logo */}
          <Link to="/game" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, marginRight: 16 }}>
            <LogoCanvas size={28} color={C.gold} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.03em", lineHeight: 1.2 }}>
                HIGHLAW <span style={{ color: C.accent }}>게임센터</span>
              </span>
              <span style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: "0.07em" }}>법무법인 하이로</span>
            </div>
          </Link>

          {/* Desktop nav — takes remaining space */}
          <div
            className="gh-desktop"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
          >
            {/* Nav buttons + mega panel share the same CSS grid so columns align */}
            <div
              style={{ position: "relative" }}
              onMouseLeave={scheduleClose}
              onMouseEnter={cancelClose}
            >
              {/* Button row — CSS grid, 5 equal columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", minWidth: 480 }}>
                {NAV.map((item, idx) => (
                  <button
                    key={idx}
                    className={`gh-nav-btn${megaOpen && activeGroup === idx ? " gh-act" : ""}`}
                    style={{ justifyContent: "center" }}
                    onMouseEnter={() => openMega(idx)}
                  >
                    {item.label}
                    <ChevronDown
                      size={10}
                      style={{ transition: "transform 0.2s", transform: megaOpen && activeGroup === idx ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                ))}
              </div>

              {/* Mega panel — same CSS grid so columns align with buttons */}
              {megaOpen && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: "absolute", top: "calc(100% + 1px)", left: 0, right: 0,
                    background: "rgba(10,15,28,0.98)",
                    border: `1px solid ${C.border}`,
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(59,130,246,0.1)",
                    zIndex: 999,
                    backdropFilter: "blur(20px)",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    padding: "12px 0 16px",
                  }}
                >
                  {NAV.map((group, gIdx) => (
                    <div key={gIdx} style={{ padding: "0 8px", borderRight: gIdx < NAV.length - 1 ? "1px solid rgba(59,130,246,0.07)" : "none" }}>
                      <div
                        style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                          textTransform: "uppercase", padding: "4px 12px 8px",
                          color: gIdx === activeGroup ? C.accent : "rgba(59,130,246,0.35)",
                        }}
                      >
                        {group.label}
                      </div>
                      {group.sub.map(s => (
                        <Link
                          key={s.to}
                          to={s.to}
                          className={`gh-mega-link${gIdx === activeGroup ? " gh-mega-link-active" : ""}`}
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

            {/* Kakao CTA */}
            <a
              href={KAKAO_CHANNEL_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: C.accent, color: "#fff", fontWeight: 600, fontSize: 11,
                padding: "7px 14px", borderRadius: 4, textDecoration: "none",
                marginLeft: 16, whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: "0 0 16px rgba(59,130,246,0.4)",
              }}
            >
              <MessageCircle size={12} />카카오 상담
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="gh-mob-btn"
            onClick={() => setMobileOpen(o => !o)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 8, marginLeft: "auto" }}
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
            background: "rgba(10,15,28,0.98)", zIndex: 199,
            overflowY: "auto", padding: "12px 20px",
            backdropFilter: "blur(16px)",
          }}
        >
          {NAV.map((item, idx) => (
            <div key={idx} style={{ borderBottom: "1px solid rgba(59,130,246,0.08)", marginBottom: 4 }}>
              <button
                onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "none", border: "none", color: "rgba(255,255,255,0.85)",
                  fontSize: 14, fontWeight: 600, padding: "13px 4px", cursor: "pointer",
                }}
              >
                {item.label}
                <ChevronDown
                  size={14}
                  style={{ transform: mobileExpanded === idx ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                />
              </button>
              {mobileExpanded === idx && (
                <div style={{ paddingLeft: 16, paddingBottom: 10 }}>
                  {item.sub.map(s => (
                    <Link
                      key={s.to}
                      to={s.to}
                      onClick={() => setMobileOpen(false)}
                      style={{ display: "block", padding: "9px 4px", color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none" }}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a
            href={KAKAO_CHANNEL_CHAT}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14,
              padding: "14px 20px", borderRadius: 6, textDecoration: "none", marginTop: 16,
              boxShadow: "0 0 20px rgba(59,130,246,0.4)",
            }}
          >
            <MessageCircle size={16} />카카오톡으로 즉시 상담
          </a>
        </div>
      )}
    </>
  );
}
