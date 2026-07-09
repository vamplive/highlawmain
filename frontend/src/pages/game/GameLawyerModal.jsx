import { useEffect } from "react";
import { X } from "lucide-react";

const BLUE = "#1d4ed8";
const BLUE_L = "#3b82f6";

function safeParseJSON(str) {
  try {
    const p = typeof str === "string" ? JSON.parse(str) : str;
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

/* An item has content if EITHER period OR title is non-empty */
function hasContent(item) {
  return !!(item && ((item.period && item.period.trim()) || (item.title && item.title.trim())));
}

function renderCareerItem(c) {
  const period = c.period?.trim() || "";
  const title  = c.title?.trim()  || "";
  const detail = c.detail?.trim() || "";

  /* 강민구처럼 period에 전체 텍스트가 들어 있는 경우 */
  if (period && !title) {
    return (
      <div>
        <span style={{ color: BLUE_L }}>{period}</span>
        {detail && <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{detail}</div>}
      </div>
    );
  }
  /* 일반: period = 기간 표시(前 등), title = 내용 */
  return (
    <div>
      {period && <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_L, marginRight: 8 }}>{period}</span>}
      {title}
      {detail && <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{detail}</div>}
    </div>
  );
}

function renderEduItem(e) {
  const period = e.period?.trim() || "";
  const title  = e.title?.trim()  || "";

  if (period && !title) return <div>{period}</div>;
  return (
    <div>
      {period && <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_L, marginRight: 8 }}>{period}</span>}
      {title}
    </div>
  );
}

function Section({ title, items, renderItem }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.18em", color: BLUE, textTransform: "uppercase", fontWeight: 700, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>
            {renderItem(item)}
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
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  if (!lawyer) return null;

  const education    = safeParseJSON(lawyer.education).filter(hasContent);
  const career       = safeParseJSON(lawyer.career).filter(hasContent);
  const specialties  = safeParseJSON(lawyer.specialties).filter(Boolean);
  const qualifications = safeParseJSON(lawyer.qualifications).filter(Boolean);
  const hasBody = career.length || education.length || qualifications.length;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          maxWidth: 580,
          width: "100%",
          maxHeight: "88vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header band ── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${BLUE} 0%, #1e40af 100%)`,
            padding: "24px 24px 20px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            {/* Photo */}
            <div style={{ flexShrink: 0, width: 76, height: 100, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)" }}>
              {lawyer.photoUrl
                ? <img src={lawyer.photoUrl} alt={lawyer.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: lawyer.photoFocus || "center top" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>사진</div>
              }
            </div>

            {/* Name / position */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-block", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 20, marginBottom: 8,
                }}
              >
                {lawyer.position}
              </div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>
                {lawyer.name}
              </h2>
              {lawyer.nameEn && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{lawyer.nameEn}</div>}
              {lawyer.tagline && (
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginTop: 4 }}>{lawyer.tagline}</p>
              )}
              {specialties.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
                  {specialties.map(s => (
                    <span key={s} style={{ fontSize: 10, background: "rgba(255,255,255,0.18)", color: "#fff", padding: "3px 10px", borderRadius: 10, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.8)", flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {hasBody ? (
          <div style={{ padding: "24px 28px", overflowY: "auto" }}>
            <Section title="주요 경력" items={career} renderItem={renderCareerItem} />
            <Section title="학력"     items={education} renderItem={renderEduItem} />
            <Section title="자격"     items={qualifications} renderItem={q => <div>{q}</div>} />
          </div>
        ) : (
          <div style={{ padding: "32px 28px", color: "#9ca3af", fontSize: 14, textAlign: "center" }}>
            상세 이력 정보가 준비 중입니다.
          </div>
        )}
      </div>
    </div>
  );
}
