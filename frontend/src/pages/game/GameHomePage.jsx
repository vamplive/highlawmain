import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Shield, Swords, Gavel } from "lucide-react";
import { api } from "../../utils/api";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import Seo from "../../components/Seo";

const ACCENT = "#3b82f6";
const ACCENT2 = "#6366f1";
const GOLD = "#c9a84c";
const DARK = "#030508";
const GLOW = "rgba(59,130,246,0.35)";

const GAME_PRACTICES = [
  {
    Icon: Gavel,
    title: "게임민사",
    en: "CIVIL",
    to: "/game/practices",
    desc: "아이템·계정 거래 사기 손해배상, 게임머니 부당이득 반환, 운영사 손해배상",
    color: "#3b82f6",
  },
  {
    Icon: Swords,
    title: "게임형사",
    en: "CRIMINAL",
    to: "/game/practices/criminal",
    desc: "아이템 거래 사기 고소, 해킹·계정 도용 처벌, 게임머니 편취 수사 지원",
    color: "#6366f1",
  },
  {
    Icon: Shield,
    title: "게임행정",
    en: "ADMIN",
    to: "/game/practices/admin",
    desc: "이용정지·영구정지 불복, 운영사 부당 제재 이의, 소비자분쟁조정 대리",
    color: "#0ea5e9",
  },
];

const FALLBACK_POSTS = [
  { id: "g1", slug: "game-fraud-legal-guide", category: "law_guide", title: "게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt: "2026-05-20" },
  { id: "g2", slug: "highlaw-game-center", category: "construction_realestate", title: "HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시", publishedAt: "2026-06-01" },
];

function formatDate(d) {
  return d ? d.slice(0, 10).replace(/-/g, ".") : "";
}

const GRID_BG = `
  linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
`;

export default function GameHomePage() {
  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");
  const [lawyers, setLawyers] = useState([]);
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [newsTab, setNewsTab] = useState("news");
  const heroRef = useRef(null);

  useEffect(() => {
    api.get("/hero-videos/active").then(r => { if (r.data?.url) setHeroVideo(r.data.url); }).catch(() => {});
    api.get("/lawyers").then(r => {
      const all = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setLawyers(all.filter(l => l.position === "대표변호사" || l.position === "변호사").slice(0, 4));
    }).catch(() => {});
    api.get("/blog?limit=20").then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      if (arr.length) setPosts(arr);
    }).catch(() => {});
    setTimeout(() => heroRef.current?.classList.add("ghp-rdy"), 80);
  }, []);

  const newsPosts = posts.filter(p => newsTab === "news" ? p.category !== "law_guide" : p.category === "law_guide").slice(0, 5);

  return (
    <>
      <Seo
        title="HIGHLAW 게임센터 — 게임사기 전문 법률서비스"
        description="아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재 전문 법무법인 하이로 게임센터."
        path="/game"
      />
      <style>{`
        .ghp-rdy .ghp-l{opacity:1!important;transform:translateY(0)!important;}
        .ghp-l{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
        .ghp-rdy .ghp-l:nth-child(2){transition-delay:.14s;}
        .ghp-rdy .ghp-l:nth-child(3){transition-delay:.28s;}
        .ghp-rdy .ghp-l:nth-child(4){transition-delay:.42s;}
        .ghp-lawyer-card{display:flex;flex-direction:column;border-radius:8px;overflow:hidden;background:#07090f;border:1px solid rgba(59,130,246,0.14);text-decoration:none;color:inherit;transition:border-color .2s,box-shadow .2s,transform .2s;}
        .ghp-lawyer-card:hover{border-color:rgba(59,130,246,0.4);box-shadow:0 12px 40px rgba(0,0,0,.5),0 0 20px rgba(59,130,246,0.12);transform:translateY(-4px);}
        .ghp-pcard{background:#07090f;border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:32px 28px;color:#fff;text-decoration:none;display:block;transition:border-color .2s,transform .2s,box-shadow .2s;}
        .ghp-pcard:hover{border-color:rgba(59,130,246,0.5);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.6),0 0 24px rgba(59,130,246,0.15);}
        .ghp-post-row{display:flex;align-items:baseline;gap:16px;padding:14px 0;border-bottom:1px solid rgba(59,130,246,0.08);text-decoration:none;color:inherit;}
        .ghp-post-title{font-size:14px;font-weight:500;color:rgba(255,255,255,0.75);transition:color .15s;}
        .ghp-post-row:hover .ghp-post-title{color:#3b82f6;}
        .ghp-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .ghp-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
        @keyframes ghp-scan{0%{transform:translateY(-100%);}100%{transform:translateY(100vh);}}
        @media(max-width:900px){.ghp-grid4{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:720px){.ghp-grid3{grid-template-columns:1fr!important;}.ghp-grid4{grid-template-columns:1fr 1fr!important;}}
      `}</style>

      {/* ── HERO ── */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          textAlign: "center", overflow: "hidden", background: DARK,
        }}
      >
        <video
          key={heroVideo} autoPlay muted loop playsInline preload="metadata"
          src={heroVideo}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}
        />
        {/* Dark gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(3,5,8,.5) 0%,rgba(3,5,8,.8) 100%)" }} />
        {/* Hex grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: GRID_BG, backgroundSize: "40px 40px", opacity: 0.6 }} />
        {/* Scan line */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)", animation: "ghp-scan 8s linear infinite", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, padding: "100px clamp(20px,6vw,100px) 60px" }}>
          <div
            className="ghp-l"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
              padding: "5px 14px", borderRadius: 20,
              border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 6px ${GLOW}` }} />
            <span style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 600 }}>
              게임사기 전문 법률 서비스
            </span>
          </div>
          <h1
            className="ghp-l"
            style={{
              fontFamily: "var(--font-serif)", fontSize: "clamp(2.4rem,6vw,5rem)",
              fontWeight: 700, color: "#fff", lineHeight: 1.18, maxWidth: 820, margin: "0 auto 24px",
              textShadow: "0 2px 40px rgba(0,0,0,0.8)",
            }}
          >
            게임에서 피해를 입었다면,<br />
            <span style={{ color: ACCENT, textShadow: `0 0 30px ${GLOW}` }}>디지털 증거</span>가 핵심입니다
          </h1>
          <p
            className="ghp-l"
            style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(255,255,255,0.5)", lineHeight: 2, maxWidth: 540, margin: "0 auto 44px" }}
          >
            아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지<br />
            HIGHLAW 게임센터가 형사·민사 양면으로 피해를 회복합니다.
          </p>
          <div className="ghp-l" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/game/consultation"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 14,
                padding: "14px 32px", borderRadius: 4, textDecoration: "none",
                boxShadow: `0 0 24px ${GLOW}`,
              }}
            >
              사건 진단
            </Link>
            <a
              href={KAKAO_CHANNEL_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)",
                fontWeight: 500, fontSize: 14, padding: "14px 28px", borderRadius: 4, textDecoration: "none",
              }}
            >
              <MessageCircle size={15} />카카오톡 상담
            </a>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,.25)", textTransform: "uppercase" }}>scroll</span>
          <div style={{ width: 1, height: 36, background: `linear-gradient(${ACCENT},transparent)` }} />
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div
        style={{
          background: "#05080f",
          borderTop: "1px solid rgba(59,130,246,0.1)",
          borderBottom: "1px solid rgba(59,130,246,0.1)",
          padding: "24px clamp(20px,6vw,100px)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          {[
            { num: "형사+민사", label: "양면 전략" },
            { num: "디지털", label: "증거 전문 분석" },
            { num: "1:1", label: "담당 변호인 직접 대응" },
            { num: "즉시", label: "사건 착수 가능" },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.2rem,2.5vw,1.8rem)", fontWeight: 700, color: ACCENT, marginBottom: 4, textShadow: `0 0 20px ${GLOW}` }}>
                {item.num}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: "0.06em" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEMBERS ── */}
      <section
        style={{
          background: "#04060c",
          backgroundImage: GRID_BG,
          backgroundSize: "60px 60px",
          padding: "72px clamp(20px,6vw,100px)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>PARTNERS</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 48, color: "#e2e8f0" }}>구성원 소개</h2>
          {lawyers.length > 0 ? (
            <div className="ghp-grid4" style={{ marginBottom: 40 }}>
              {lawyers.map(l => (
                <Link key={l.id} to={`/partners/${l.slug || l.id}`} className="ghp-lawyer-card">
                  {l.photoUrl
                    ? <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#0a0c14" }}>
                      <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "cover", objectPosition: l.photoFocus || "center top", display: "block", margin: "auto", marginTop: "6%" }} />
                    </div>
                    : <div style={{ width: "100%", aspectRatio: "3/4", background: "#0c0e18", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 14 }}>사진</div>
                  }
                  <div style={{ padding: "16px 16px 20px" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>{l.name}</h3>
                    <p style={{ fontSize: 11, color: ACCENT, marginBottom: 8, letterSpacing: "0.06em" }}>{l.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "#334155", marginBottom: 40 }}>구성원 정보를 불러오는 중입니다.</p>
          )}
          <div style={{ textAlign: "center" }}>
            <Link
              to="/game/members"
              style={{ display: "inline-block", border: `1px solid ${ACCENT}`, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "9px 24px", borderRadius: 4, textDecoration: "none", letterSpacing: "0.04em" }}
            >
              구성원 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRACTICES ── */}
      <section style={{ background: "#030508", padding: "72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>SERVICES</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 48, color: "#e2e8f0" }}>게임사기 3대 분야</h2>
          <div className="ghp-grid3">
            {GAME_PRACTICES.map(p => {
              const IconComp = p.Icon;
              return (
                <Link key={p.title} to={p.to} className="ghp-pcard">
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      background: `rgba(${p.color === "#3b82f6" ? "59,130,246" : p.color === "#6366f1" ? "99,102,241" : "14,165,233"},0.12)`,
                      border: `1px solid ${p.color}30`, marginBottom: 20,
                    }}
                  >
                    <IconComp size={20} color={p.color} />
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: p.color, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{p.en}</div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 700, marginBottom: 14, color: "#e2e8f0" }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.75 }}>{p.desc}</p>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link
              to="/game/practices"
              style={{ display: "inline-block", border: `1px solid ${ACCENT}`, color: ACCENT, fontSize: 12, fontWeight: 600, padding: "9px 24px", borderRadius: 4, textDecoration: "none" }}
            >
              업무분야 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section
        style={{
          background: "#04060c",
          backgroundImage: GRID_BG,
          backgroundSize: "60px 60px",
          padding: "72px clamp(20px,6vw,100px)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>NEWS</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 32, color: "#e2e8f0" }}>하이로 소식</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {[{ id: "news", label: "하이로 뉴스" }, { id: "guide", label: "게임법률 가이드" }].map(t => (
              <button
                key={t.id}
                onClick={() => setNewsTab(t.id)}
                style={{
                  padding: "6px 16px", fontSize: 11, fontWeight: 600, borderRadius: 20,
                  border: "1px solid",
                  borderColor: newsTab === t.id ? ACCENT : "rgba(59,130,246,0.15)",
                  background: newsTab === t.id ? "rgba(59,130,246,0.12)" : "transparent",
                  color: newsTab === t.id ? ACCENT : "rgba(255,255,255,.4)",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div>
            {newsPosts.length ? newsPosts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="ghp-post-row">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", whiteSpace: "nowrap", minWidth: 80 }}>{formatDate(p.publishedAt)}</span>
                <span className="ghp-post-title">{p.title}</span>
              </Link>
            )) : (
              <p style={{ color: "rgba(255,255,255,.2)", padding: "20px 0" }}>게시물이 없습니다.</p>
            )}
          </div>
          <div style={{ textAlign: "right", marginTop: 20 }}>
            <Link to="/game/info" style={{ fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 600 }}>더보기 →</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "#030508",
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%), ${GRID_BG}`,
          backgroundSize: "auto, 40px 40px",
          padding: "80px clamp(20px,6vw,100px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block", marginBottom: 24,
            padding: "4px 14px", borderRadius: 20,
            border: "1px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)",
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 700 }}>즉시 대응이 중요합니다</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 28, lineHeight: 1.3 }}>
          게임 피해, 지금 바로<br />
          <span style={{ color: ACCENT }}>전문 변호인</span>과 상담하세요
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 auto 44px", width: "fit-content", textAlign: "left" }}>
          {[
            "디지털 증거는 시간이 지날수록 소멸됩니다.",
            "형사·민사 병행으로 피해 회복을 극대화합니다.",
            "전담 변호인이 처음부터 끝까지 책임집니다.",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "rgba(255,255,255,.55)", fontSize: 14 }}>
              <span style={{ color: ACCENT, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>✓</span>{t}
            </div>
          ))}
        </div>
        <Link
          to="/game/consultation"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 15,
            padding: "16px 44px", borderRadius: 4, textDecoration: "none",
            boxShadow: `0 0 32px ${GLOW}`,
          }}
        >
          지금 상담 신청
        </Link>
      </section>
    </>
  );
}
