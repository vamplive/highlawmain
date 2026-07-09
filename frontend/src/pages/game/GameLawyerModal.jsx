import { useEffect } from "react";
import { X } from "lucide-react";

const ACCENT = "#3b82f6";

function safeParseJSON(str) {
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Section({ title, items, renderItem }) {
  const list = items.filter(i => renderItem ? true : (i && String(i).trim()));
  if (!list.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((item, i) => (
          <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            {renderItem ? renderItem(item) : String(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameLawyerModal({ lawyer, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!lawyer) return null;

  const education = safeParseJSON(lawyer.education).filter(e => e.title && e.title.trim());
  const career = safeParseJSON(lawyer.career).filter(c => c.title && c.title.trim());
  const specialties = safeParseJSON(lawyer.specialties).filter(Boolean);
  const qualifications = safeParseJSON(lawyer.qualifications).filter(Boolean);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#131c2e",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: 14,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.1)",
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "flex-start", gap: 20, padding: "28px 28px 20px",
            borderBottom: "1px solid rgba(59,130,246,0.1)",
            flexShrink: 0,
          }}
        >
          {/* Photo */}
          <div style={{ flexShrink: 0, width: 80, height: 106, borderRadius: 8, overflow: "hidden", background: "#0d1117", border: "1px solid rgba(59,130,246,0.15)" }}>
            {lawyer.photoUrl
              ? <img src={lawyer.photoUrl} alt={lawyer.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: lawyer.photoFocus || "center top" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 12 }}>사진</div>
            }
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{lawyer.position}</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{lawyer.name}</h2>
            {lawyer.nameEn && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{lawyer.nameEn}</div>}
            {lawyer.tagline && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{lawyer.tagline}</p>}
            {specialties.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
                {specialties.map(s => (
                  <span key={s} style={{ fontSize: 10, background: "rgba(59,130,246,0.12)", color: ACCENT, padding: "3px 10px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.25)" }}>{s}</span>
                ))}
              </div>
            )}
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto" }}>
          <Section
            title="주요 경력"
            items={career}
            renderItem={c => (
              <div>
                {c.period && <span style={{ color: "rgba(59,130,246,0.8)", fontSize: 11, fontWeight: 600, marginRight: 8 }}>{c.period}</span>}
                {c.title}
                {c.detail && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{c.detail}</div>}
              </div>
            )}
          />
          <Section
            title="학력"
            items={education}
            renderItem={e => (
              <div>
                {e.period && <span style={{ color: "rgba(59,130,246,0.8)", fontSize: 11, fontWeight: 600, marginRight: 8 }}>{e.period}</span>}
                {e.title}
              </div>
            )}
          />
          <Section title="자격" items={qualifications} />
        </div>
      </div>
    </div>
  );
}
