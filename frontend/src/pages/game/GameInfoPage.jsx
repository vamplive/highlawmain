import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";
import GamePageShell from "./GamePageShell";

const A = "#3b82f6";
const TXT2 = "rgba(241,245,249,0.6)";

const TABS = [
  { id:"news",  label:"하이로 뉴스",     path:"/game/info" },
  { id:"guide", label:"게임법률 가이드",  path:"/game/info/guide" },
];

const FB_NEWS = [
  { id:"n1", slug:"highlaw-game-center",   title:"HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시", publishedAt:"2026-06-01", category:"general" },
  { id:"n2", slug:"game-fraud-awareness",  title:"게임 아이템 거래 사기 피해 급증, 법률 대응 방법은?",  publishedAt:"2026-05-15", category:"general" },
];
const FB_GUIDE = [
  { id:"g1", slug:"game-fraud-legal-guide",    title:"게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt:"2026-05-20", category:"law_guide" },
  { id:"g2", slug:"game-account-hacking-guide",title:"게임 계정 해킹 피해 대응 완벽 가이드",          publishedAt:"2026-04-10", category:"law_guide" },
];

const fmt = d => d ? d.slice(0,10).replace(/-/g,".") : "";

export default function GameInfoPage() {
  const { tab }  = useParams();
  const activeId = tab === "guide" ? "guide" : "news";

  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const PER = 10;

  useEffect(() => {
    api.get("/blog?limit=100").then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.posts || []);
      setAll(arr);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [activeId]);

  const fallback = activeId === "news" ? FB_NEWS : FB_GUIDE;
  const filtered = all.length
    ? all.filter(p => activeId === "news" ? p.category !== "law_guide" : p.category === "law_guide")
    : fallback;
  const pages    = Math.ceil(filtered.length / PER);
  const shown    = filtered.slice((page-1)*PER, page*PER);

  return (
    <>
      <Seo title={`${activeId==="news"?"하이로 뉴스":"게임법률 가이드"} | HIGHLAW 게임센터`} description="법무법인 하이로 게임센터의 소식과 게임법률 가이드를 확인하세요." path="/game/info" />
      <GamePageShell eyebrow="NEWS & GUIDE" title="하이로 소식" tabs={TABS} activeId={activeId}>
        {loading ? (
          <p style={{ color:"rgba(255,255,255,.2)" }}>게시물을 불러오는 중입니다...</p>
        ) : !shown.length ? (
          <p style={{ color:"rgba(255,255,255,.2)" }}>게시물이 없습니다.</p>
        ) : (
          <>
            <div>
              {shown.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`}
                  style={{ display:"flex", alignItems:"baseline", gap:20, padding:"15px 10px", borderBottom:"1px solid rgba(59,130,246,0.07)", textDecoration:"none", borderRadius:4, transition:"background .12s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(59,130,246,0.05)";e.currentTarget.querySelector("[data-t]").style.color=A;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.querySelector("[data-t]").style.color=TXT2;}}>
                  <span style={{ fontSize:11, color:"rgba(241,245,249,0.25)", whiteSpace:"nowrap", minWidth:88 }}>{fmt(p.publishedAt)}</span>
                  <span data-t style={{ fontSize:14, fontWeight:500, color:TXT2, transition:"color .15s", flex:1 }}>{p.title}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.2)" }}>→</span>
                </Link>
              ))}
            </div>
            {pages > 1 && (
              <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:36 }}>
                {Array.from({length:pages},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>setPage(n)}
                    style={{ width:34, height:34, borderRadius:6, border:"1px solid", cursor:"pointer", borderColor:page===n?A:"rgba(59,130,246,0.15)", background:page===n?"rgba(59,130,246,0.14)":"transparent", color:page===n?A:"rgba(241,245,249,0.3)", fontSize:12, fontWeight:600 }}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </GamePageShell>
    </>
  );
}
