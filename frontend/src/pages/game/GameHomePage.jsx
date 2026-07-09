import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Gavel, Swords, Shield } from "lucide-react";
import { api } from "../../utils/api";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import Seo from "../../components/Seo";
import GameLawyerModal from "./GameLawyerModal";

/* ── Palette ── */
const A = "#3b82f6";        // accent blue
const A2 = "#06b6d4";       // accent cyan
const GOLD = "#c9a84c";
const BG1 = "#0d1117";      // primary bg
const BG2 = "#111827";      // alternate section
const BG3 = "#162032";      // card bg
const TXT = "#f1f5f9";
const TXT2 = "rgba(241,245,249,0.6)";
const GLOW = "rgba(59,130,246,0.4)";
const GRID = `linear-gradient(rgba(59,130,246,0.06) 1px,transparent 1px),
              linear-gradient(90deg,rgba(59,130,246,0.06) 1px,transparent 1px)`;

const PRACTICES = [
  { Icon: Gavel,  title: "게임민사",  en: "CIVIL",    to: "/game/practices",           color: A,   desc: "아이템·계정 거래 사기 손해배상, 게임머니 부당이득 반환, 운영사 손해배상" },
  { Icon: Swords, title: "게임형사",  en: "CRIMINAL", to: "/game/practices/criminal",  color: "#818cf8", desc: "아이템 거래 사기 고소, 해킹·계정 도용 처벌, 게임머니 편취 수사 지원" },
  { Icon: Shield, title: "게임행정",  en: "ADMIN",    to: "/game/practices/admin",     color: A2,  desc: "이용정지·영구정지 불복, 운영사 부당 제재 이의, 소비자분쟁조정 대리" },
];

const FALLBACK = [
  { id: "f1", slug: "game-fraud-legal-guide", category: "law_guide", title: "게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt: "2026-05-20" },
  { id: "f2", slug: "highlaw-game-center",    category: "general",   title: "HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시",  publishedAt: "2026-06-01" },
];

const fmt = d => d ? d.slice(0,10).replace(/-/g,".") : "";

export default function GameHomePage() {
  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");
  const [lawyers,  setLawyers]   = useState([]);
  const [posts,    setPosts]     = useState(FALLBACK);
  const [newsTab,  setNewsTab]   = useState("news");
  const [modal,    setModal]     = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    api.get("/hero-videos/active").then(r => { if (r.data?.url) setHeroVideo(r.data.url); }).catch(() => {});
    api.get("/lawyers").then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setLawyers(arr.filter(l => l.position === "대표변호사" || l.position === "변호사").slice(0, 4));
    }).catch(() => {});
    api.get("/blog?limit=20").then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.posts || []);
      if (arr.length) setPosts(arr);
    }).catch(() => {});
    setTimeout(() => heroRef.current?.classList.add("rdy"), 80);
  }, []);

  const shown = posts.filter(p => newsTab === "news" ? p.category !== "law_guide" : p.category === "law_guide").slice(0, 5);

  return (
    <>
      <Seo title="HIGHLAW 게임센터 — 게임사기 전문 법률서비스" description="아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재 전문 법무법인 하이로 게임센터." path="/game" />
      <style>{`
        .rdy .fl{opacity:1!important;transform:translateY(0)!important;}
        .fl{opacity:0;transform:translateY(24px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
        .rdy .fl:nth-child(2){transition-delay:.12s;}.rdy .fl:nth-child(3){transition-delay:.24s;}.rdy .fl:nth-child(4){transition-delay:.36s;}
        @keyframes scan{from{transform:translateY(-100%);}to{transform:translateY(100vh);}}
        .glw-btn{transition:box-shadow .2s,transform .15s;} .glw-btn:hover{box-shadow:0 0 28px rgba(59,130,246,0.6)!important;transform:translateY(-1px);}
        .lcard{cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .2s;}
        .lcard:hover{border-color:rgba(59,130,246,0.45)!important;box-shadow:0 12px 40px rgba(0,0,0,.4),0 0 20px rgba(59,130,246,0.14)!important;transform:translateY(-4px);}
        .pcard{transition:border-color .2s,transform .2s,box-shadow .2s;}
        .pcard:hover{border-color:rgba(59,130,246,0.5)!important;transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.5),0 0 24px rgba(59,130,246,0.12)!important;}
        .post-row{transition:background .12s;} .post-row:hover{background:rgba(59,130,246,0.05)!important;}
        .post-row:hover .ptit{color:#3b82f6!important;}
      `}</style>

      {/* ── HERO ── */}
      <div ref={heroRef} style={{ minHeight:"100dvh", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", overflow:"hidden", background: BG1 }}>
        <video key={heroVideo} autoPlay muted loop playsInline preload="metadata" src={heroVideo}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.25 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(13,17,23,.5) 0%,rgba(13,17,23,.85) 100%)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:GRID, backgroundSize:"44px 44px", opacity:.7 }} />
        <div style={{ position:"absolute", left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${A2},transparent)`, animation:"scan 10s linear infinite", zIndex:1 }} />

        <div style={{ position:"relative", zIndex:2, padding:"100px clamp(20px,6vw,100px) 60px" }}>
          <div className="fl" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:28, padding:"5px 16px", borderRadius:20, border:`1px solid rgba(6,182,212,0.35)`, background:"rgba(6,182,212,0.07)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:A2, boxShadow:`0 0 8px ${A2}` }} />
            <span style={{ fontSize:10, letterSpacing:"0.22em", color:A2, textTransform:"uppercase", fontWeight:600 }}>게임사기 전문 법률 서비스</span>
          </div>
          <h1 className="fl" style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(2.2rem,5.5vw,4.5rem)", fontWeight:700, color:TXT, lineHeight:1.2, maxWidth:800, margin:"0 auto 24px", textShadow:"0 2px 40px rgba(0,0,0,0.8)" }}>
            게임에서 피해를 입었다면,<br/>
            <span style={{ color:A, textShadow:`0 0 30px ${GLOW}` }}>디지털 증거</span>가 핵심입니다
          </h1>
          <p className="fl" style={{ fontSize:"clamp(14px,1.5vw,16px)", color:TXT2, lineHeight:2, maxWidth:520, margin:"0 auto 44px" }}>
            아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지<br/>
            HIGHLAW 게임센터가 형사·민사 양면으로 피해를 회복합니다.
          </p>
          <div className="fl" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/game/consultation" className="glw-btn"
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:A, color:"#fff", fontWeight:700, fontSize:14, padding:"14px 32px", borderRadius:4, textDecoration:"none", boxShadow:`0 0 20px ${GLOW}` }}>
              사건 진단
            </Link>
            <a href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(255,255,255,.2)", color:TXT2, fontWeight:500, fontSize:14, padding:"14px 28px", borderRadius:4, textDecoration:"none" }}>
              <MessageCircle size={15} />카카오톡 상담
            </a>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:9, letterSpacing:"0.2em", color:"rgba(255,255,255,.2)", textTransform:"uppercase" }}>scroll</span>
          <div style={{ width:1, height:36, background:`linear-gradient(${A},transparent)` }} />
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background:"#0a1020", borderTop:`1px solid rgba(59,130,246,0.15)`, borderBottom:`1px solid rgba(59,130,246,0.15)`, padding:"22px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-around", flexWrap:"wrap", gap:20 }}>
          {[{n:"형사+민사",l:"양면 전략"},{n:"디지털",l:"증거 전문 분석"},{n:"1:1",l:"담당 변호인 직접 대응"},{n:"즉시",l:"사건 착수 가능"}].map(item=>(
            <div key={item.l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.1rem,2.2vw,1.6rem)", fontWeight:700, color:A, marginBottom:4, textShadow:`0 0 16px ${GLOW}` }}>{item.n}</div>
              <div style={{ fontSize:11, color:"rgba(241,245,249,0.4)", letterSpacing:"0.05em" }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEMBERS ── */}
      <section style={{ background:BG2, backgroundImage:GRID, backgroundSize:"60px 60px", padding:"72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <p style={{ fontSize:10, letterSpacing:"0.22em", color:A, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>PARTNERS</p>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:600, marginBottom:48, color:TXT }}>구성원 소개</h2>
          {lawyers.length > 0 ? (
            <div style={{
              display:"flex", flexWrap:"wrap", gap:20, justifyContent:"center",
              marginBottom:40,
            }}>
              {lawyers.map(l => (
                <div
                  key={l.id}
                  className="lcard"
                  onClick={() => setModal(l)}
                  style={{
                    width: 220, flexShrink: 0,
                    display:"flex", flexDirection:"column",
                    borderRadius:10, overflow:"hidden",
                    background:BG3,
                    border:"1px solid rgba(59,130,246,0.18)",
                  }}
                >
                  {l.photoUrl
                    ? <div style={{ width:"100%", aspectRatio:"3/4", overflow:"hidden", background:"#0d1420" }}>
                        <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width:"88%", height:"88%", objectFit:"cover", objectPosition:l.photoFocus||"center top", display:"block", margin:"auto", marginTop:"6%" }} />
                      </div>
                    : <div style={{ width:"100%", aspectRatio:"3/4", background:"#131c2e", display:"flex", alignItems:"center", justifyContent:"center", color:"#334155", fontSize:13 }}>사진</div>
                  }
                  <div style={{ padding:"16px 16px 18px" }}>
                    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4, color:TXT }}>{l.name}</h3>
                    <p style={{ fontSize:11, color:A, marginBottom:8, letterSpacing:"0.05em" }}>{l.position}</p>
                    <p style={{ fontSize:11, color:"rgba(241,245,249,0.35)" }}>자세히 보기 →</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:"rgba(255,255,255,0.2)", marginBottom:40 }}>구성원 정보를 불러오는 중입니다.</p>
          )}
          <div style={{ textAlign:"center" }}>
            <Link to="/game/members" style={{ display:"inline-block", border:`1px solid ${A}`, color:A, fontSize:12, fontWeight:600, padding:"9px 24px", borderRadius:4, textDecoration:"none" }}>
              구성원 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRACTICES ── */}
      <section style={{ background:BG1, padding:"72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <p style={{ fontSize:10, letterSpacing:"0.22em", color:A, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>SERVICES</p>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:600, marginBottom:48, color:TXT }}>게임사기 3대 분야</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
            {PRACTICES.map(p => {
              const IconC = p.Icon;
              return (
                <Link key={p.title} to={p.to} className="pcard"
                  style={{ background:BG3, border:"1px solid rgba(59,130,246,0.16)", borderRadius:10, padding:"32px 28px", color:TXT, textDecoration:"none", display:"block" }}>
                  <div style={{ width:44, height:44, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:`${p.color}14`, border:`1px solid ${p.color}30`, marginBottom:20 }}>
                    <IconC size={20} color={p.color} />
                  </div>
                  <div style={{ fontSize:9, letterSpacing:"0.2em", color:p.color, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{p.en}</div>
                  <h3 style={{ fontFamily:"var(--font-serif)", fontSize:21, fontWeight:700, marginBottom:14, color:TXT }}>{p.title}</h3>
                  <p style={{ fontSize:13, color:TXT2, lineHeight:1.75 }}>{p.desc}</p>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign:"center", marginTop:36 }}>
            <Link to="/game/practices" style={{ display:"inline-block", border:`1px solid ${A}`, color:A, fontSize:12, fontWeight:600, padding:"9px 24px", borderRadius:4, textDecoration:"none" }}>
              업무분야 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section style={{ background:BG2, backgroundImage:GRID, backgroundSize:"60px 60px", padding:"72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <p style={{ fontSize:10, letterSpacing:"0.22em", color:A, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>NEWS</p>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:600, marginBottom:32, color:TXT }}>하이로 소식</h2>
          <div style={{ display:"flex", gap:8, marginBottom:28 }}>
            {[{id:"news",label:"하이로 뉴스"},{id:"guide",label:"게임법률 가이드"}].map(t=>(
              <button key={t.id} onClick={()=>setNewsTab(t.id)}
                style={{ padding:"6px 16px", fontSize:11, fontWeight:600, borderRadius:20, border:"1px solid", cursor:"pointer", borderColor:newsTab===t.id?A:"rgba(59,130,246,0.15)", background:newsTab===t.id?"rgba(59,130,246,0.14)":"transparent", color:newsTab===t.id?A:"rgba(241,245,249,0.35)" }}>
                {t.label}
              </button>
            ))}
          </div>
          <div>
            {shown.length ? shown.map(p=>(
              <Link key={p.id} to={`/blog/${p.slug}`} className="post-row"
                style={{ display:"flex", alignItems:"baseline", gap:16, padding:"14px 10px", borderBottom:"1px solid rgba(59,130,246,0.07)", textDecoration:"none", borderRadius:4 }}>
                <span style={{ fontSize:11, color:"rgba(241,245,249,0.25)", whiteSpace:"nowrap", minWidth:84 }}>{fmt(p.publishedAt)}</span>
                <span className="ptit" style={{ fontSize:14, fontWeight:500, color:TXT2, transition:"color .15s", flex:1 }}>{p.title}</span>
              </Link>
            )) : <p style={{ color:"rgba(255,255,255,0.2)", padding:"20px 0" }}>게시물이 없습니다.</p>}
          </div>
          <div style={{ textAlign:"right", marginTop:20 }}>
            <Link to="/game/info" style={{ fontSize:12, color:A, textDecoration:"none", fontWeight:600 }}>더보기 →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background:`radial-gradient(ellipse 80% 60% at 50% 50%,rgba(59,130,246,0.08) 0%,${BG1} 70%)`, padding:"80px clamp(20px,6vw,100px)", textAlign:"center", backgroundImage:GRID, backgroundSize:"40px 40px" }}>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", fontWeight:700, color:TXT, marginBottom:28, lineHeight:1.3 }}>
          게임 피해는 지금 바로<br/><span style={{ color:A }}>대응이 중요</span>합니다
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10, margin:"0 auto 44px", width:"fit-content", textAlign:"left" }}>
          {["디지털 증거는 시간이 지날수록 소멸됩니다.","형사·민사 병행으로 피해 회복을 극대화합니다.","전담 변호인이 처음부터 끝까지 책임집니다."].map((t,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, color:TXT2, fontSize:14 }}>
              <span style={{ color:GOLD, fontSize:16, fontWeight:700, lineHeight:1.3 }}>✓</span>{t}
            </div>
          ))}
        </div>
        <Link to="/game/consultation" className="glw-btn"
          style={{ display:"inline-flex", alignItems:"center", gap:8, background:A, color:"#fff", fontWeight:700, fontSize:15, padding:"16px 44px", borderRadius:4, textDecoration:"none", boxShadow:`0 0 24px ${GLOW}` }}>
          지금 상담 신청
        </Link>
      </section>

      {modal && <GameLawyerModal lawyer={modal} onClose={() => setModal(null)} />}
    </>
  );
}
