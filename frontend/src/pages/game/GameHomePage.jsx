import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Gavel, Swords, Shield, ArrowRight } from "lucide-react";
import { api } from "../../utils/api";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import Seo from "../../components/Seo";
import GameLawyerModal from "./GameLawyerModal";

const BLUE  = "#1d4ed8";
const BLUE_L= "#3b82f6";
const RED   = "#dc2626";
const YELLOW= "#f59e0b";
const NAVY  = "#0f172a";
const WHITE = "#ffffff";
const LIGHT = "#f0f4ff";
const GRAY  = "#f9fafb";
const TEXT  = "#111827";
const TEXT2 = "#6b7280";

const PRACTICES = [
  { Icon: Gavel,  title:"게임민사", en:"CIVIL",    to:"/game/practices",          color:BLUE,   bg:"#eff6ff", items:["아이템·계정 거래 사기 손해배상","게임머니 부당이득 반환 청구","운영사 손해배상","집단소송 대리"] },
  { Icon: Swords, title:"게임형사", en:"CRIMINAL", to:"/game/practices/criminal", color:RED,    bg:"#fef2f2", items:["아이템 거래 사기 형사고소","해킹·계정 도용 처벌","게임머니 편취 수사 지원","피해자 대리 변호"] },
  { Icon: Shield, title:"게임행정", en:"ADMIN",    to:"/game/practices/admin",    color:YELLOW, bg:"#fffbeb", items:["이용정지·영구정지 불복","운영사 부당 제재 이의","소비자분쟁조정 대리","게임물 등급 분쟁"] },
];

const FALLBACK = [
  { id:"f1", slug:"game-fraud-legal-guide", category:"law_guide", title:"게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt:"2026-05-20" },
  { id:"f2", slug:"highlaw-game-center",    category:"general",   title:"HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시",  publishedAt:"2026-06-01" },
];

const fmt = d => d ? d.slice(0,10).replace(/-/g,".") : "";

export default function GameHomePage() {
  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");
  const [lawyers,   setLawyers]   = useState([]);
  const [posts,     setPosts]     = useState(FALLBACK);
  const [newsTab,   setNewsTab]   = useState("news");
  const [modal,     setModal]     = useState(null);
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

  const shown = posts.filter(p => newsTab === "news" ? p.category !== "law_guide" : p.category === "law_guide").slice(0,5);

  return (
    <>
      <Seo title="HIGHLAW 게임센터 — 게임사기 전문 법률서비스" description="아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재 전문 법무법인 하이로 게임센터." path="/game" />
      <style>{`
        .rdy .fl{opacity:1!important;transform:translateY(0)!important;}
        .fl{opacity:0;transform:translateY(22px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1);}
        .rdy .fl:nth-child(2){transition-delay:.1s;}.rdy .fl:nth-child(3){transition-delay:.2s;}.rdy .fl:nth-child(4){transition-delay:.3s;}
        .lcard{cursor:pointer;transition:box-shadow .2s,transform .2s;}
        .lcard:hover{box-shadow:0 16px 48px rgba(29,78,216,0.18)!important;transform:translateY(-5px)!important;}
        .pcard{transition:box-shadow .2s,transform .2s;}
        .pcard:hover{box-shadow:0 12px 36px rgba(0,0,0,0.12)!important;transform:translateY(-4px)!important;}
        .post-row:hover{background:#eff6ff!important;}
        .post-row:hover .ptit{color:${BLUE}!important;}
        .stat-box{border-radius:12px;padding:24px 20px;text-align:center;transition:transform .2s,box-shadow .2s;}
        .stat-box:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.12);}
      `}</style>

      {/* ── HERO ── */}
      <div ref={heroRef} style={{ minHeight:"100dvh", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", overflow:"hidden", background:NAVY }}>
        <video key={heroVideo} autoPlay muted loop playsInline preload="metadata" src={heroVideo}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.2 }} />
        {/* gradient overlay */}
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(160deg, rgba(15,23,42,0.7) 0%, rgba(29,78,216,0.3) 50%, rgba(15,23,42,0.8) 100%)` }} />
        {/* diagonal accent */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:6, background:`linear-gradient(90deg, ${RED}, ${YELLOW}, ${BLUE})` }} />

        <div style={{ position:"relative", zIndex:2, padding:"100px clamp(20px,6vw,100px) 80px" }}>
          <div className="fl" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:24, padding:"5px 16px", borderRadius:20, background:"rgba(29,78,216,0.25)", border:"1px solid rgba(59,130,246,0.5)" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:YELLOW, boxShadow:`0 0 8px ${YELLOW}` }} />
            <span style={{ fontSize:10, letterSpacing:"0.2em", color:"#93c5fd", textTransform:"uppercase", fontWeight:700 }}>게임사기 전문 법률 서비스</span>
          </div>
          <h1 className="fl" style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(2.2rem,5.5vw,4.8rem)", fontWeight:700, color:"#fff", lineHeight:1.18, maxWidth:820, margin:"0 auto 20px" }}>
            게임에서 피해를 입었다면,<br/>
            <span style={{ color:YELLOW }}>디지털 증거</span>가 핵심입니다
          </h1>
          <p className="fl" style={{ fontSize:"clamp(14px,1.6vw,17px)", color:"rgba(255,255,255,0.65)", lineHeight:2, maxWidth:540, margin:"0 auto 44px" }}>
            아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지<br/>
            HIGHLAW 게임센터가 형사·민사 양면으로 피해를 회복합니다.
          </p>
          <div className="fl" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/game/consultation"
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:BLUE, color:"#fff", fontWeight:700, fontSize:14, padding:"14px 32px", borderRadius:6, textDecoration:"none", boxShadow:"0 4px 20px rgba(29,78,216,0.5)" }}>
              사건 진단 <ArrowRight size={15} />
            </Link>
            <a href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,.3)", color:"rgba(255,255,255,.85)", fontWeight:500, fontSize:14, padding:"14px 28px", borderRadius:6, textDecoration:"none" }}>
              <MessageCircle size={15} />카카오톡 상담
            </a>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:9, letterSpacing:"0.2em", color:"rgba(255,255,255,.3)", textTransform:"uppercase" }}>scroll</span>
          <div style={{ width:1, height:32, background:`linear-gradient(${YELLOW},transparent)` }} />
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background:BLUE, padding:"0 clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:0 }}>
          {[
            { n:"형사+민사", l:"양면 전략" },
            { n:"디지털", l:"증거 전문 분석" },
            { n:"1:1", l:"담당 변호인" },
            { n:"즉시", l:"사건 착수 가능" },
          ].map((s,i) => (
            <div key={s.l} style={{ padding:"28px 20px", textAlign:"center", borderRight: i<3 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
              <div style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.2rem,2.5vw,2rem)", fontWeight:800, color:"#fff", marginBottom:4 }}>{s.n}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", letterSpacing:"0.04em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEMBERS ── */}
      <section style={{ background:WHITE, padding:"80px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"0.2em", color:BLUE, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>PARTNERS</div>
              <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.4rem)", fontWeight:700, color:TEXT }}>구성원 소개</h2>
            </div>
            <Link to="/game/members" style={{ fontSize:13, color:BLUE, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>
          {lawyers.length > 0 ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:20, justifyContent:"center" }}>
              {lawyers.map(l => (
                <div key={l.id} className="lcard" onClick={() => setModal(l)}
                  style={{ width:210, flexShrink:0, borderRadius:12, overflow:"hidden", background:WHITE, border:"2px solid #e5e7eb", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                  {l.photoUrl
                    ? <div style={{ width:"100%", aspectRatio:"3/4", overflow:"hidden", background:"#f3f4f6" }}>
                        <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width:"88%", height:"88%", objectFit:"cover", objectPosition:l.photoFocus||"center top", display:"block", margin:"auto", marginTop:"6%" }} />
                      </div>
                    : <div style={{ width:"100%", aspectRatio:"3/4", background:"#f0f4ff", display:"flex", alignItems:"center", justifyContent:"center", color:"#c7d2fe", fontSize:13 }}>사진</div>
                  }
                  <div style={{ padding:"16px 16px 18px", borderTop:"3px solid "+BLUE }}>
                    <h3 style={{ fontSize:16, fontWeight:700, marginBottom:3, color:TEXT }}>{l.name}</h3>
                    <p style={{ fontSize:11, color:BLUE, fontWeight:600, marginBottom:8, letterSpacing:"0.04em" }}>{l.position}</p>
                    <p style={{ fontSize:11, color:"#9ca3af" }}>자세히 보기 →</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:TEXT2 }}>구성원 정보를 불러오는 중입니다.</p>
          )}
        </div>
      </section>

      {/* ── PRACTICES ── */}
      <section style={{ background:GRAY, padding:"80px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"0.2em", color:BLUE, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>SERVICES</div>
              <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.4rem)", fontWeight:700, color:TEXT }}>게임사기 3대 분야</h2>
            </div>
            <Link to="/game/practices" style={{ fontSize:13, color:BLUE, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
            {PRACTICES.map(p => {
              const I = p.Icon;
              return (
                <Link key={p.title} to={p.to} className="pcard"
                  style={{ background:WHITE, border:"2px solid #e5e7eb", borderRadius:12, padding:"32px 28px", textDecoration:"none", color:TEXT, display:"block", borderTop:`4px solid ${p.color}`, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                    <I size={22} color={p.color} />
                  </div>
                  <div style={{ fontSize:9, letterSpacing:"0.2em", color:p.color, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{p.en}</div>
                  <h3 style={{ fontFamily:"var(--font-serif)", fontSize:22, fontWeight:700, marginBottom:16, color:TEXT }}>{p.title}</h3>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:8 }}>
                    {p.items.map(item => (
                      <li key={item} style={{ fontSize:13, color:TEXT2, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:p.color, flexShrink:0 }} />{item}
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section style={{ background:LIGHT, padding:"80px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:"0.2em", color:BLUE, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>NEWS</div>
              <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.6rem,3vw,2.4rem)", fontWeight:700, color:TEXT }}>하이로 소식</h2>
            </div>
            <Link to="/game/info" style={{ fontSize:13, color:BLUE, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>더보기 <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:24 }}>
            {[{id:"news",label:"하이로 뉴스"},{id:"guide",label:"게임법률 가이드"}].map(t=>(
              <button key={t.id} onClick={()=>setNewsTab(t.id)}
                style={{ padding:"7px 18px", fontSize:12, fontWeight:600, borderRadius:20, border:"2px solid", cursor:"pointer", borderColor:newsTab===t.id?BLUE:"#d1d5db", background:newsTab===t.id?BLUE:"transparent", color:newsTab===t.id?"#fff":"#6b7280", transition:"all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ background:WHITE, borderRadius:12, overflow:"hidden", border:"1px solid #e5e7eb" }}>
            {shown.length ? shown.map((p,i)=>(
              <Link key={p.id} to={`/blog/${p.slug}`} className="post-row"
                style={{ display:"flex", alignItems:"baseline", gap:20, padding:"16px 20px", borderBottom:i<shown.length-1?"1px solid #f3f4f6":"none", textDecoration:"none", transition:"background .12s" }}>
                <span style={{ fontSize:11, color:"#9ca3af", whiteSpace:"nowrap", minWidth:84 }}>{fmt(p.publishedAt)}</span>
                <span className="ptit" style={{ fontSize:14, fontWeight:500, color:TEXT2, transition:"color .15s", flex:1 }}>{p.title}</span>
                <ArrowRight size={13} style={{ color:"#d1d5db", flexShrink:0 }} />
              </Link>
            )) : <p style={{ color:TEXT2, padding:"24px 20px" }}>게시물이 없습니다.</p>}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background:NAVY, padding:"80px clamp(20px,6vw,100px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        {/* color stripe */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${RED},${YELLOW},${BLUE})` }} />
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 50%, rgba(29,78,216,0.15) 0%, transparent 70%)` }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:700, color:"#fff", marginBottom:24, lineHeight:1.3 }}>
            게임 피해는 지금 바로<br/><span style={{ color:YELLOW }}>대응이 중요</span>합니다
          </h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.55)", marginBottom:40, lineHeight:1.8 }}>
            디지털 증거는 시간이 지날수록 소멸됩니다.<br/>형사·민사 병행으로 피해 회복을 극대화합니다.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/game/consultation"
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:BLUE, color:"#fff", fontWeight:700, fontSize:15, padding:"16px 40px", borderRadius:6, textDecoration:"none", boxShadow:"0 4px 20px rgba(29,78,216,0.5)" }}>
              지금 상담 신청 <ArrowRight size={16} />
            </Link>
            <a href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,.8)", fontWeight:600, fontSize:15, padding:"16px 32px", borderRadius:6, textDecoration:"none" }}>
              <MessageCircle size={16} />카카오 상담
            </a>
          </div>
        </div>
      </section>

      {modal && <GameLawyerModal lawyer={modal} onClose={() => setModal(null)} />}
    </>
  );
}
