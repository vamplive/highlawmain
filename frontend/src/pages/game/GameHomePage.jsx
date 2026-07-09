import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { api } from "../../utils/api";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import Seo from "../../components/Seo";

const ACCENT = "#3b82f6";
const DARK = "#06090f";
const GOLD = "#c9a84c";

const GAME_PRACTICES = [
  {
    title: "게임민사",
    en: "CIVIL",
    to: "/game/practices",
    items: ["아이템·계정 거래 사기 손해배상", "게임머니 부당이득 반환 청구", "운영사 손해배상", "집단소송 대리"],
  },
  {
    title: "게임형사",
    en: "CRIMINAL",
    to: "/game/practices/criminal",
    items: ["아이템 거래 사기 형사고소", "해킹·계정 도용 처벌", "게임머니 편취 수사 지원", "피해자 대리 변호"],
  },
  {
    title: "게임행정",
    en: "ADMIN",
    to: "/game/practices/admin",
    items: ["이용정지·영구정지 불복", "운영사 부당 제재 이의", "소비자분쟁조정 대리", "게임물 등급 분쟁"],
  },
];

const FALLBACK_POSTS = [
  { id: "g1", slug: "game-fraud-legal-guide", category: "law_guide", title: "게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt: "2026-05-20" },
  { id: "g2", slug: "highlaw-game-center", category: "construction_realestate", title: "HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시", publishedAt: "2026-06-01" },
];

function formatDate(d) {
  return d ? d.slice(0, 10).replace(/-/g, ".") : "";
}

export default function GameHomePage() {
  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");
  const [lawyers, setLawyers] = useState([]);
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [newsTab, setNewsTab] = useState("news");
  const heroRef = useRef(null);

  useEffect(() => {
    api.get("/hero-videos/active").then(r => { if (r.data?.url) setHeroVideo(r.data.url); }).catch(() => {});
    api.get("/lawyers").then(r => {
      const all = (r.data || []).filter(l => l.position === "대표변호사" || l.position === "변호사");
      setLawyers(all.slice(0, 4));
    }).catch(() => {});
    api.get("/blog?limit=20").then(r => { if ((r.data || []).length) setPosts(r.data); }).catch(() => {});
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
        .ghp-lawyer-card{display:flex;flex-direction:column;border-radius:8px;overflow:hidden;background:#f8fafc;border:1px solid #e2e8f0;text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s;}
        .ghp-lawyer-card:hover{box-shadow:0 12px 36px rgba(0,0,0,.12);transform:translateY(-4px);}
        .ghp-pcard{background:#0d1526;border:1px solid rgba(59,130,246,.18);border-radius:8px;padding:32px 28px;color:#fff;text-decoration:none;display:block;transition:border-color .2s,transform .2s,box-shadow .2s;}
        .ghp-pcard:hover{border-color:rgba(59,130,246,.5);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.4);}
        .ghp-post-row{display:flex;align-items:baseline;gap:16px;padding:14px 0;border-bottom:1px solid #e8eaed;text-decoration:none;color:inherit;}
        .ghp-post-row:hover .ghp-post-title{color:#3b82f6;}
        .ghp-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .ghp-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
        @media(max-width:900px){.ghp-grid4{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:720px){.ghp-grid3{grid-template-columns:1fr!important;}.ghp-grid4{grid-template-columns:1fr 1fr!important;}}
      `}</style>

      {/* HERO */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh", position: "relative", display: "flex",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          overflow: "hidden", background: DARK,
        }}
      >
        <video
          key={heroVideo} autoPlay muted loop playsInline preload="metadata"
          src={heroVideo}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(6,9,15,.3) 0%,rgba(6,9,15,.7) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "100px clamp(20px,6vw,100px) 60px" }}>
          <div className="ghp-l" style={{ fontSize: 11, letterSpacing: "0.24em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
            GAME FRAUD · 게임사기 전문 법률 서비스
          </div>
          <h1
            className="ghp-l"
            style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.4rem,6vw,5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.18, maxWidth: 820, margin: "0 auto 24px" }}
          >
            게임에서 피해를 입었다면,<br />
            <span style={{ color: ACCENT }}>디지털 증거</span>가 핵심입니다
          </h1>
          <p
            className="ghp-l"
            style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(255,255,255,0.6)", lineHeight: 2, maxWidth: 560, margin: "0 auto 44px" }}
          >
            아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지<br />
            HIGHLAW 게임센터가 형사·민사 양면으로 피해를 회복합니다.
          </p>
          <div className="ghp-l" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/game/consultation"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px 32px", borderRadius: 4, textDecoration: "none" }}
            >
              사건 진단
            </Link>
            <a
              href={KAKAO_CHANNEL_CHAT} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.8)", fontWeight: 500, fontSize: 14, padding: "14px 28px", borderRadius: 4, textDecoration: "none" }}
            >
              <MessageCircle size={15} />카카오톡 상담
            </a>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>scroll</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(rgba(59,130,246,.6),transparent)" }} />
        </div>
      </div>

      {/* MEMBERS */}
      <section style={{ background: "#fff", padding: "72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>PARTNERS</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 48, color: "#0f172a" }}>구성원 소개</h2>
          {lawyers.length > 0 ? (
            <div className="ghp-grid4" style={{ marginBottom: 40 }}>
              {lawyers.map(l => (
                <Link key={l.id} to={`/partners/${l.slug || l.id}`} className="ghp-lawyer-card">
                  {l.photoUrl
                    ? <div style={{ width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#e8e6e3" }}>
                      <img src={l.photoUrl} alt={l.name} loading="lazy" style={{ width: "88%", height: "88%", objectFit: "cover", objectPosition: l.photoFocus || "center top", display: "block", margin: "auto", marginTop: "6%" }} />
                    </div>
                    : <div style={{ width: "100%", aspectRatio: "3/4", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>사진</div>
                  }
                  <div style={{ padding: "16px 16px 20px" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>{l.name}</h3>
                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{l.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "#94a3b8", marginBottom: 40 }}>구성원 정보를 불러오는 중입니다.</p>
          )}
          <div style={{ textAlign: "center" }}>
            <Link to="/game/members" style={{ display: "inline-block", border: "1px solid " + ACCENT, color: ACCENT, fontSize: 13, fontWeight: 600, padding: "10px 28px", borderRadius: 4, textDecoration: "none" }}>
              구성원 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* PRACTICES */}
      <section style={{ background: "#f5f7fa", padding: "72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>SERVICES</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 48, color: "#0f172a" }}>게임사기 3대 분야</h2>
          <div className="ghp-grid3">
            {GAME_PRACTICES.map(p => (
              <Link key={p.title} to={p.to} className="ghp-pcard">
                <div style={{ fontSize: 10, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>{p.en}</div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{p.title}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.items.map(item => (
                    <li key={item} style={{ fontSize: 13, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />{item}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <Link to="/game/practices" style={{ display: "inline-block", border: "1px solid " + ACCENT, color: ACCENT, fontSize: 13, fontWeight: 600, padding: "10px 28px", borderRadius: 4, textDecoration: "none" }}>
              업무분야 전체보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section style={{ background: "#f2f4f8", padding: "72px clamp(20px,6vw,100px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>NEWS</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 600, marginBottom: 32, color: "#0f172a" }}>하이로 소식</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {[{ id: "news", label: "하이로 뉴스" }, { id: "guide", label: "게임법률 가이드" }].map(t => (
              <button
                key={t.id} onClick={() => setNewsTab(t.id)}
                style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, borderRadius: 20, border: "1px solid", borderColor: newsTab === t.id ? ACCENT : "#dde2e8", background: newsTab === t.id ? ACCENT : "transparent", color: newsTab === t.id ? "#fff" : "#64748b", cursor: "pointer" }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div>
            {newsPosts.length ? newsPosts.map(p => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="ghp-post-row">
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{formatDate(p.publishedAt)}</span>
                <span className="ghp-post-title" style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", transition: "color .15s" }}>{p.title}</span>
              </Link>
            )) : (
              <p style={{ color: "#94a3b8", padding: "20px 0" }}>게시물이 없습니다.</p>
            )}
          </div>
          <div style={{ textAlign: "right", marginTop: 20 }}>
            <Link to="/game/info" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 600 }}>더보기 →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0a1628", padding: "80px clamp(20px,6vw,100px)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 700, color: "#fff", marginBottom: 28, lineHeight: 1.3 }}>
          게임 피해는 지금 바로 대응이 중요합니다
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "0 auto 44px", width: "fit-content", textAlign: "left" }}>
          {[
            "디지털 증거는 시간이 지날수록 소멸됩니다.",
            "형사·민사 병행으로 피해 회복을 극대화합니다.",
            "전담 변호인이 처음부터 끝까지 책임집니다.",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, color: "rgba(255,255,255,.8)", fontSize: 15 }}>
              <span style={{ color: GOLD, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>✓</span>{t}
            </div>
          ))}
        </div>
        <Link
          to="/game/consultation"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 15, padding: "16px 44px", borderRadius: 4, textDecoration: "none" }}
        >
          지금 상담 신청
        </Link>
      </section>
    </>
  );
}
