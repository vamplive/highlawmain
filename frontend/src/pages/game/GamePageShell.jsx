import { useNavigate } from "react-router-dom";

const BLUE  = "#1d4ed8";
const NAVY  = "#0f172a";
const WHITE = "#ffffff";
const TEXT  = "#111827";

export default function GamePageShell({ eyebrow, title, tabs, activeId, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 64, background: "#f9fafb", minHeight: "100vh" }}>
      {/* Page banner */}
      <div
        style={{
          background: NAVY,
          padding: "48px clamp(20px,6vw,100px) 0",
          borderBottom: `3px solid ${BLUE}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.22em", color: "#93c5fd", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{eyebrow}</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", marginBottom: 36 }}>{title}</h1>
          {tabs && (
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  style={{
                    padding: "12px 24px", fontSize: 13, fontWeight: activeId === t.id ? 700 : 400,
                    color: activeId === t.id ? "#fff" : "rgba(255,255,255,0.4)",
                    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: activeId === t.id ? `3px solid ${BLUE}` : "3px solid transparent",
                    marginBottom: -3, transition: "color .15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "60px clamp(20px,6vw,100px)", maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}
