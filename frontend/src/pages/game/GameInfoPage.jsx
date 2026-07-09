import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";

const ACCENT = "#3b82f6";
const GRID_BG = `linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)`;

const TABS = [
  { id: "news", label: "하이로 뉴스", path: "/game/info" },
  { id: "guide", label: "게임법률 가이드", path: "/game/info/guide" },
];

const FALLBACK_NEWS = [
  { id: "n1", slug: "highlaw-game-center", title: "HIGHLAW 게임센터 출범, 게임사기 전문 법률 서비스 개시", publishedAt: "2026-06-01", category: "construction_realestate" },
  { id: "n2", slug: "game-fraud-awareness", title: "게임 아이템 거래 사기 피해 급증, 법률 대응 방법은?", publishedAt: "2026-05-15", category: "construction_realestate" },
];

const FALLBACK_GUIDES = [
  { id: "g1", slug: "game-fraud-legal-guide", title: "게임 아이템 및 계정 사기 형사고소 시 주의사항", publishedAt: "2026-05-20", category: "law_guide" },
  { id: "g2", slug: "game-account-hacking-guide", title: "게임 계정 해킹 피해 대응 완벽 가이드", publishedAt: "2026-04-10", category: "law_guide" },
];

function formatDate(d) {
  return d ? d.slice(0, 10).replace(/-/g, ".") : "";
}

export default function GameInfoPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = tab === "guide" ? "guide" : "news";

  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get("/blog?limit=100").then(r => {
      const arr = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.posts || []);
      setAllPosts(arr);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [activeId]);

  const fallback = activeId === "news" ? FALLBACK_NEWS : FALLBACK_GUIDES;
  const filtered = allPosts.length > 0
    ? allPosts.filter(p => activeId === "news" ? p.category !== "law_guide" : p.category === "law_guide")
    : fallback;

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Seo title={`${activeId === "news" ? "하이로 뉴스" : "게임법률 가이드"} | HIGHLAW 게임센터`} description="법무법인 하이로 게임센터의 소식과 게임법률 가이드를 확인하세요." path="/game/info" />

      <div style={{ paddingTop: 64, background: "#030508", minHeight: "100vh", backgroundImage: GRID_BG, backgroundSize: "60px 60px" }}>
        <div style={{ background: "rgba(3,5,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.08)", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>NEWS & GUIDE</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 40 }}>하이로 소식</h1>
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
            <p style={{ color: "rgba(255,255,255,.25)" }}>게시물을 불러오는 중입니다...</p>
          ) : paginated.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,.25)" }}>게시물이 없습니다.</p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {paginated.map(p => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    style={{
                      display: "flex", alignItems: "baseline", gap: 20, padding: "16px 0",
                      borderBottom: "1px solid rgba(59,130,246,0.07)", textDecoration: "none", color: "inherit",
                    }}
                    onMouseEnter={e => { const t = e.currentTarget.querySelector("[data-title]"); if (t) t.style.color = ACCENT; }}
                    onMouseLeave={e => { const t = e.currentTarget.querySelector("[data-title]"); if (t) t.style.color = "rgba(255,255,255,0.7)"; }}
                  >
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", whiteSpace: "nowrap", minWidth: 90 }}>{formatDate(p.publishedAt)}</span>
                    <span data-title style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)", transition: "color .15s", flex: 1 }}>{p.title}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)", whiteSpace: "nowrap" }}>→</span>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 40 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 34, height: 34, borderRadius: 6, border: "1px solid",
                        borderColor: page === n ? ACCENT : "rgba(59,130,246,0.15)",
                        background: page === n ? "rgba(59,130,246,0.15)" : "transparent",
                        color: page === n ? ACCENT : "rgba(255,255,255,.3)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
