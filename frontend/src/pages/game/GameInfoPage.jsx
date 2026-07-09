import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";
import { api } from "../../utils/api";

const ACCENT = "#3b82f6";

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
      setAllPosts(r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [activeId]);

  const filtered = allPosts.length > 0
    ? allPosts.filter(p => activeId === "news" ? p.category !== "law_guide" : p.category === "law_guide")
    : (activeId === "news" ? FALLBACK_NEWS : FALLBACK_GUIDES);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Seo title={`${activeId === "news" ? "하이로 뉴스" : "게임법률 가이드"} | HIGHLAW 게임센터`} description="법무법인 하이로 게임센터의 소식과 게임법률 가이드를 확인하세요." path="/game/info" />

      <div style={{ paddingTop: 64 }}>
        <div style={{ background: "#0a1628", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>NEWS & GUIDE</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 40 }}>하이로 소식</h1>
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
          {loading ? (
            <p style={{ color: "#94a3b8" }}>게시물을 불러오는 중입니다...</p>
          ) : paginated.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>게시물이 없습니다.</p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {paginated.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/blog/${p.slug}`}
                    style={{
                      display: "flex", alignItems: "baseline", gap: 20, padding: "18px 0",
                      borderBottom: "1px solid #e8eaed", textDecoration: "none", color: "inherit",
                    }}
                    onMouseEnter={e => e.currentTarget.querySelector(".gi-title").style.color = ACCENT}
                    onMouseLeave={e => e.currentTarget.querySelector(".gi-title").style.color = "#1e293b"}
                  >
                    <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", minWidth: 90 }}>{formatDate(p.publishedAt)}</span>
                    <span className="gi-title" style={{ fontSize: 15, fontWeight: 500, color: "#1e293b", transition: "color .15s", flex: 1 }}>{p.title}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>→</span>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 36, height: 36, borderRadius: 6, border: "1px solid",
                        borderColor: page === n ? ACCENT : "#e2e8f0",
                        background: page === n ? ACCENT : "transparent",
                        color: page === n ? "#fff" : "#64748b",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
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
