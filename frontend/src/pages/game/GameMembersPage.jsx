import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";

const ACCENT = "#3b82f6";
const GRID_BG = `
  linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
`;

const TABS = [
  { id: "lawyers", label: "변호사", path: "/game/members" },
  { id: "consultants", label: "전문위원", path: "/game/members/consultants" },
  { id: "staff", label: "직원", path: "/game/members/staff" },
];

const SECTION_MAP = { consultants: "consultants", staff: "staff" };

export default function GameMembersPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = (tab && SECTION_MAP[tab]) ? SECTION_MAP[tab] : "lawyers";

  const [allLawyers, setAllLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lawyers")
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        setAllLawyers(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const attorneys = allLawyers.filter(l => l.position === "대표변호사" || l.position === "변호사");
  const consultants = allLawyers.filter(l => l.position === "전문위원");
  const staff = allLawyers.filter(l => l.position === "직원");

  function LawyerCard({ l }) {
    return (
      <Link
        to={`/partners/${l.slug || l.id}`}
        style={{
          display: "flex", flexDirection: "column",
          borderRadius: 8, overflow: "hidden",
          background: "#07090f", border: "1px solid rgba(59,130,246,0.14)",
          textDecoration: "none", color: "inherit",
          transition: "border-color .2s,box-shadow .2s,transform .2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,.5),0 0 20px rgba(59,130,246,0.12)";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.14)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        {l.photoUrl
          ? <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#0a0c14" }}>
            <img
              src={l.photoUrl} alt={l.name} loading="lazy"
              style={{ width: "88%", height: "88%", objectFit: "cover", objectPosition: l.photoFocus || "center top", display: "block", margin: "auto", marginTop: "6%" }}
            />
          </div>
          : <div style={{ width: "100%", aspectRatio: "3/4", background: "#0c0e18", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e293b", fontSize: 14 }}>사진</div>
        }
        <div style={{ padding: "16px 16px 20px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>{l.name}</h3>
          <p style={{ fontSize: 11, color: ACCENT, marginBottom: 8, letterSpacing: "0.06em" }}>{l.position}</p>
          {Array.isArray(l.specialties) && l.specialties.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {l.specialties.slice(0, 3).map(s => (
                <span key={s} style={{ fontSize: 10, background: "rgba(59,130,246,0.1)", color: ACCENT, padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.2)" }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }

  function PlaceholderMsg({ text }) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>{text}</p>
      </div>
    );
  }

  return (
    <>
      <Seo title="구성원 | HIGHLAW 게임센터" description="법무법인 하이로 게임센터의 변호사, 전문위원, 직원 소개입니다." path="/game/members" />

      <div style={{ paddingTop: 64, background: "#030508", minHeight: "100vh", backgroundImage: GRID_BG, backgroundSize: "60px 60px" }}>
        {/* Page header */}
        <div style={{ background: "rgba(3,5,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.08)", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>MEMBERS</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 40 }}>구성원</h1>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(59,130,246,0.1)", overflowX: "auto" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  style={{
                    padding: "12px 24px", fontSize: 13, fontWeight: activeId === t.id ? 700 : 400,
                    color: activeId === t.id ? "#fff" : "rgba(255,255,255,.35)",
                    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: activeId === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                    marginBottom: -1, transition: "color 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "60px clamp(20px,6vw,100px)", maxWidth: 1100, margin: "0 auto" }}>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,.25)" }}>구성원 정보를 불러오는 중입니다...</p>
          ) : (
            <>
              {activeId === "lawyers" && (
                attorneys.length === 0
                  ? <PlaceholderMsg text="등록된 변호사 정보가 없습니다." />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 24 }}>
                    {attorneys.map(l => <LawyerCard key={l.id} l={l} />)}
                  </div>
              )}
              {activeId === "consultants" && (
                consultants.length === 0
                  ? <PlaceholderMsg text="등록된 전문위원 정보가 없습니다." />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 24 }}>
                    {consultants.map(l => <LawyerCard key={l.id} l={l} />)}
                  </div>
              )}
              {activeId === "staff" && (
                staff.length === 0
                  ? <PlaceholderMsg text="등록된 직원 정보가 없습니다." />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 24 }}>
                    {staff.map(l => <LawyerCard key={l.id} l={l} />)}
                  </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
