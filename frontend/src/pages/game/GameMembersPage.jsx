import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";

const ACCENT = "#3b82f6";

const TABS = [
  { id: "lawyers", label: "변호사", path: "/game/members" },
  { id: "consultants", label: "전문위원", path: "/game/members/consultants" },
  { id: "staff", label: "직원", path: "/game/members/staff" },
];

const SECTION_MAP = {
  consultants: "consultants",
  staff: "staff",
};

const STATIC_CONSULTANTS = [
  { name: "전문위원 정보는 준비 중입니다.", role: "", note: "" },
];

const STATIC_STAFF = [
  { name: "직원 정보는 준비 중입니다.", role: "", note: "" },
];

export default function GameMembersPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = tab && SECTION_MAP[tab] ? SECTION_MAP[tab] : "lawyers";

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lawyers").then(r => {
      setLawyers(r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const attorneys = lawyers.filter(l => l.position === "대표변호사" || l.position === "변호사");

  return (
    <>
      <Seo title="구성원 | HIGHLAW 게임센터" description="법무법인 하이로 게임센터의 변호사, 전문위원, 직원 소개입니다." path="/game/members" />

      <div style={{ paddingTop: 64 }}>
        <div style={{ background: "#0a1628", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>MEMBERS</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 40 }}>구성원</h1>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,.1)", overflowX: "auto" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  style={{
                    padding: "12px 24px", fontSize: 13, fontWeight: activeId === t.id ? 700 : 400,
                    color: activeId === t.id ? "#fff" : "rgba(255,255,255,.5)",
                    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: activeId === t.id ? "2px solid " + ACCENT : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "60px clamp(20px,6vw,100px)", maxWidth: 1100, margin: "0 auto" }}>
          {activeId === "lawyers" && (
            <div>
              {loading ? (
                <p style={{ color: "#94a3b8" }}>구성원 정보를 불러오는 중입니다...</p>
              ) : attorneys.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>등록된 변호사 정보가 없습니다.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 24 }}>
                  {attorneys.map(l => (
                    <Link
                      key={l.id}
                      to={`/partners/${l.slug || l.id}`}
                      style={{ display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", background: "#f8fafc", border: "1px solid #e2e8f0", textDecoration: "none", color: "inherit", transition: "box-shadow .2s,transform .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                    >
                      {l.photoUrl
                        ? <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#e8e6e3" }}>
                          <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "cover", objectPosition: l.photoFocus || "center top", display: "block", margin: "auto", marginTop: "6%" }} />
                        </div>
                        : <div style={{ width: "100%", aspectRatio: "3/4", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>사진</div>
                      }
                      <div style={{ padding: "16px 16px 20px" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>{l.name}</h3>
                        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{l.position}</p>
                        {l.specialties && l.specialties.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {l.specialties.slice(0, 3).map(s => (
                              <span key={s} style={{ fontSize: 10, background: "#eff6ff", color: ACCENT, padding: "2px 8px", borderRadius: 10 }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeId === "consultants" && (
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>전문위원</h2>
              <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8 }}>전문위원 정보는 준비 중입니다.</p>
            </div>
          )}

          {activeId === "staff" && (
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>직원</h2>
              <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8 }}>직원 정보는 준비 중입니다.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
