import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Phone, Zap, X } from "lucide-react";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const ACCENT = "#3b82f6";
const GLOW = "rgba(59,130,246,0.45)";

export default function GameFloater() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes gf-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.5);} 50%{box-shadow:0 0 0 8px rgba(59,130,246,0);} }
        @keyframes gf-slide-up { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .gf-item { animation: gf-slide-up 0.22s cubic-bezier(.16,1,.3,1) both; }
        .gf-item:nth-child(1){animation-delay:0.05s;}
        .gf-item:nth-child(2){animation-delay:0.1s;}
        .gf-item:nth-child(3){animation-delay:0.15s;}
        .gf-action-btn { display:flex; align-items:center; gap:10px; background:rgba(3,5,10,0.96); border:1px solid rgba(59,130,246,0.2); border-radius:8px; padding:10px 16px; text-decoration:none; color:#fff; font-size:13px; font-weight:500; white-space:nowrap; transition:border-color 0.15s,box-shadow 0.15s; cursor:pointer; }
        .gf-action-btn:hover { border-color:rgba(59,130,246,0.5); box-shadow:0 0 16px rgba(59,130,246,0.2); color:#fff; }
      `}</style>

      <div
        style={{
          position: "fixed", bottom: 28, right: 24, zIndex: 300,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
        }}
      >
        {/* Action items */}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {/* Consultation */}
            <Link
              to="/game/consultation"
              className="gf-item gf-action-btn"
              onClick={() => setOpen(false)}
            >
              <span
                style={{
                  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: ACCENT, boxShadow: `0 0 10px ${GLOW}`, flexShrink: 0,
                }}
              >
                <Zap size={14} color="#fff" />
              </span>
              <span>사건 상담 신청</span>
            </Link>

            {/* Kakao */}
            <a
              href={KAKAO_CHANNEL_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              className="gf-item gf-action-btn"
            >
              <span
                style={{
                  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#FEE500", flexShrink: 0,
                }}
              >
                <MessageCircle size={14} color="#3c1e1e" />
              </span>
              <span style={{ color: "#fff" }}>카카오톡 즉시 상담</span>
            </a>

            {/* Phone */}
            <a
              href="tel:0269256757"
              className="gf-item gf-action-btn"
            >
              <span
                style={{
                  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", flexShrink: 0,
                }}
              >
                <Phone size={14} color={ACCENT} />
              </span>
              <span>02-6925-6757</span>
            </a>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: open ? "rgba(20,20,30,0.95)" : ACCENT,
            border: open ? "1px solid rgba(59,130,246,0.3)" : "none",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: open ? `0 0 0 1px ${GLOW}` : `0 0 24px ${GLOW}`,
            animation: open ? "none" : "gf-pulse 2.4s ease infinite",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
          aria-label="상담 메뉴"
        >
          {open
            ? <X size={20} />
            : <MessageCircle size={22} />
          }
        </button>
      </div>
    </>
  );
}
