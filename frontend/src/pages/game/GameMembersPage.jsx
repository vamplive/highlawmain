import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";
import GameLawyerModal from "./GameLawyerModal";

const A = "#3b82f6";
const BG1 = "#0d1117";
const BG2 = "#111827";
const BG3 = "#162032";
const TXT = "#f1f5f9";
const GRID = `linear-gradient(rgba(59,130,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.05) 1px,transparent 1px)`;

const TABS = [
  { id:"lawyers",     label:"변호사",   path:"/game/members" },
  { id:"consultants", label:"전문위원", path:"/game/members/consultants" },
  { id:"staff",       label:"직원",     path:"/game/members/staff" },
];
const SECTION_MAP = { consultants:"consultants", staff:"staff" };

export default function GameMembersPage() {
  const { tab }    = useParams();
  const navigate   = useNavigate();
  const activeId   = (tab && SECTION_MAP[tab]) ? SECTION_MAP[tab] : "lawyers";

  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  useEffect(() => {
    api.get("/lawyers")
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        setAll(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const attorneys   = all.filter(l => l.position === "대표변호사" || l.position === "변호사");
  const consultants = all.filter(l => l.position === "전문위원");
  const staff       = all.filter(l => l.position === "직원");

  function LCard({ l }) {
    return (
      <div
        onClick={() => setModal(l)}
        style={{
          display:"flex", flexDirection:"column",
          borderRadius:10, overflow:"hidden",
          background:BG3, border:"1px solid rgba(59,130,246,0.18)",
          cursor:"pointer",
          transition:"border-color .2s,box-shadow .2s,transform .2s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,130,246,0.45)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,.4),0 0 20px rgba(59,130,246,0.12)";e.currentTarget.style.transform="translateY(-4px)";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(59,130,246,0.18)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}
      >
        {l.photoUrl
          ? <div style={{ width:"100%", aspectRatio:"3/4", overflow:"hidden", background:"#0d1420" }}>
              <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width:"88%", height:"88%", objectFit:"cover", objectPosition:l.photoFocus||"center top", display:"block", margin:"auto", marginTop:"6%" }} />
            </div>
          : <div style={{ width:"100%", aspectRatio:"3/4", background:"#131c2e", display:"flex", alignItems:"center", justifyContent:"center", color:"#334155", fontSize:13 }}>사진</div>
        }
        <div style={{ padding:"16px 16px 18px" }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4, color:TXT }}>{l.name}</h3>
          <p style={{ fontSize:11, color:A, marginBottom:6, letterSpacing:"0.05em" }}>{l.position}</p>
          {Array.isArray(l.specialties) && l.specialties.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {l.specialties.slice(0,3).map(s=>(
                <span key={s} style={{ fontSize:10, background:"rgba(59,130,246,0.1)", color:A, padding:"2px 8px", borderRadius:10, border:"1px solid rgba(59,130,246,0.2)" }}>{s}</span>
              ))}
            </div>
          )}
          <p style={{ fontSize:10, color:"rgba(241,245,249,0.3)", marginTop:10 }}>자세히 보기 →</p>
        </div>
      </div>
    );
  }

  function Grid({ list, emptyMsg }) {
    if (!list.length) return <p style={{ color:"rgba(255,255,255,0.2)", padding:"48px 0", textAlign:"center" }}>{emptyMsg}</p>;
    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20 }}>
        {list.map(l => <LCard key={l.id} l={l} />)}
      </div>
    );
  }

  return (
    <>
      <Seo title="구성원 | HIGHLAW 게임센터" description="법무법인 하이로 게임센터의 변호사, 전문위원, 직원 소개입니다." path="/game/members" />

      <div style={{ paddingTop:64, background:BG1, minHeight:"100vh", backgroundImage:GRID, backgroundSize:"60px 60px" }}>
        {/* Header */}
        <div style={{ background:"rgba(10,15,28,0.85)", backdropFilter:"blur(10px)", borderBottom:"1px solid rgba(59,130,246,0.1)", padding:"48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <p style={{ fontSize:10, letterSpacing:"0.22em", color:A, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>MEMBERS</p>
            <h1 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:700, color:TXT, marginBottom:40 }}>구성원</h1>
            <div style={{ display:"flex", gap:0, borderBottom:"1px solid rgba(59,130,246,0.12)", overflowX:"auto" }}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>navigate(t.path)}
                  style={{ padding:"12px 24px", fontSize:13, fontWeight:activeId===t.id?700:400, color:activeId===t.id?"#fff":"rgba(241,245,249,0.35)", background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap", borderBottom:activeId===t.id?`2px solid ${A}`:"2px solid transparent", marginBottom:-1, transition:"color .15s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding:"60px clamp(20px,6vw,100px)", maxWidth:1100, margin:"0 auto" }}>
          {loading ? (
            <p style={{ color:"rgba(255,255,255,.2)" }}>구성원 정보를 불러오는 중입니다...</p>
          ) : (
            <>
              {activeId === "lawyers"     && <Grid list={attorneys}   emptyMsg="등록된 변호사 정보가 없습니다." />}
              {activeId === "consultants" && <Grid list={consultants} emptyMsg="등록된 전문위원 정보가 없습니다." />}
              {activeId === "staff"       && <Grid list={staff}       emptyMsg="등록된 직원 정보가 없습니다." />}
            </>
          )}
        </div>
      </div>

      {modal && <GameLawyerModal lawyer={modal} onClose={() => setModal(null)} />}
    </>
  );
}
