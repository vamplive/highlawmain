import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../utils/api";
import GamePageShell from "./GamePageShell";
import GameLawyerModal from "./GameLawyerModal";

const BLUE  = "#1d4ed8";
const WHITE = "#ffffff";
const TEXT  = "#111827";
const TEXT2 = "#6b7280";

const TABS = [
  { id: "lawyers",     label: "변호사",   path: "/game/members" },
  { id: "consultants", label: "전문위원", path: "/game/members/consultants" },
  { id: "staff",       label: "직원",     path: "/game/members/staff" },
];

function MemberCard({ lawyer, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 210, flexShrink: 0,
        background: WHITE,
        borderRadius: 14,
        boxShadow: hov ? "0 12px 40px rgba(29,78,216,0.18)" : "0 2px 12px rgba(0,0,0,0.07)",
        overflow: "hidden", cursor: "pointer",
        transform: hov ? "translateY(-6px)" : "none",
        transition: "all .25s",
        border: hov ? `1.5px solid ${BLUE}` : "1.5px solid #f3f4f6",
      }}
    >
      <div style={{ width: "100%", aspectRatio: "3/4", background: "#e5e7eb", position: "relative", overflow: "hidden" }}>
        {lawyer.photoUrl ? (
          <img
            src={lawyer.photoUrl}
            alt={lawyer.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              objectPosition: lawyer.photoFocus || "center top",
              filter: hov ? "brightness(1.05)" : "brightness(0.97)",
              transition: "filter .25s",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>사진 준비 중</div>
        )}
        {hov && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(29,78,216,0.7) 0%, transparent 50%)",
            display: "flex", alignItems: "flex-end", padding: 14,
          }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>프로필 보기 →</span>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 5 }}>{lawyer.position}</div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{lawyer.name}</div>
        {lawyer.nameEn && <div style={{ fontSize: 11, color: TEXT2, marginBottom: 8 }}>{lawyer.nameEn}</div>}
        {lawyer.tagline && (
          <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 4 }}>
            {lawyer.tagline.length > 55 ? lawyer.tagline.slice(0, 55) + "…" : lawyer.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GameMembersPage() {
  const { tab } = useParams();
  const activeId = tab || "lawyers";
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.get("/lawyers").then(r => {
      const data = r.data;
      const arr = Array.isArray(data) ? data : (data?.data || []);
      setLawyers(arr.filter(l => l.isActive !== false));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const attorneys   = lawyers.filter(l => l.position && (l.position.includes("변호사") || l.position.includes("대표")));
  const consultants = lawyers.filter(l => l.position && (l.position.includes("전문") || l.position.includes("위원")));
  const staff       = lawyers.filter(l => l.position && !l.position.includes("변호사") && !l.position.includes("대표") && !l.position.includes("전문") && !l.position.includes("위원"));

  const lists = { lawyers: attorneys, consultants, staff };
  const current = lists[activeId] || attorneys;

  return (
    <GamePageShell eyebrow="HIGHLAW GAME CENTER" title="구성원" tabs={TABS} activeId={activeId}>
      {loading ? (
        <div style={{ padding: "80px 0", textAlign: "center", color: TEXT2, fontSize: 14 }}>로딩 중…</div>
      ) : current.length === 0 ? (
        <div style={{ padding: "80px 0", textAlign: "center", color: TEXT2, fontSize: 14 }}>등록된 구성원이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {current.map(l => (
            <MemberCard key={l.id} lawyer={l} onClick={() => setModal(l)} />
          ))}
        </div>
      )}
      {modal && <GameLawyerModal lawyer={modal} onClose={() => setModal(null)} />}
    </GamePageShell>
  );
}
