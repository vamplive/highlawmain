/** 홈 소식 섹션 — 좌측 CTA 카드 + 우측 탭별 기사 목록 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const TABS = [
  { id: "construction_realestate", label: "하이로 뉴스" },
  { id: "case_analysis",           label: "판례 분석" },
  { id: "law_guide",               label: "법률 가이드" },
];

const FALLBACK_POSTS = [
  {
    id: "fb-1", slug: "highlaw-serious-accident",
    category: "construction_realestate",
    title: "법무법인 하이로, 중대재해 컴플라이언스 전담 지원 센터 출범",
    publishedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "fb-2", slug: "highlaw-military-defense",
    category: "construction_realestate",
    title: "방산·군사건 전문팀 신설, 국가안보 관련 법률 서비스 강화",
    publishedAt: "2026-04-20T00:00:00.000Z",
  },
  {
    id: "fb-3", slug: "illegal-dispatch-precedents",
    category: "case_analysis",
    title: "불법파견 소송에서의 주요 쟁점과 실무 요령",
    publishedAt: "2026-05-28T00:00:00.000Z",
  },
  {
    id: "fb-4", slug: "serious-accident-case-review",
    category: "case_analysis",
    title: "중대재해처벌법 첫 유죄 판결 분석 — 실형 기준과 시사점",
    publishedAt: "2026-05-10T00:00:00.000Z",
  },
  {
    id: "fb-5", slug: "game-fraud-legal-guide",
    category: "law_guide",
    title: "게임 아이템 및 계정 사기 형사고소 시 주의사항",
    publishedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "fb-6", slug: "labor-dispute-guide",
    category: "law_guide",
    title: "부당해고 구제신청부터 손해배상까지 — 노동분쟁 단계별 대응",
    publishedAt: "2026-04-15T00:00:00.000Z",
  },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

export default function HomeNewsSection() {
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [activeTab, setActiveTab] = useState("construction_realestate");

  useEffect(() => {
    let cancelled = false;
    api.get("/blog?limit=12")
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        if (rows.length > 0) setPosts(rows);
        else setPosts(FALLBACK_POSTS);
      })
      .catch(() => { if (!cancelled) setPosts(FALLBACK_POSTS); });
    return () => { cancelled = true; };
  }, []);

  const filteredPosts = posts.filter((p) => p.category === activeTab).slice(0, 5);

  return (
    <section className="hp-section" style={{ background: "#f4f6f9" }}>
      <div className="hp-section-inner">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.65fr",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          {/* ── 좌측: CTA 카드 2개 ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 카카오톡 상담 카드 */}
            <a
              href={KAKAO_CHANNEL_CHAT}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "32px 28px",
                background: "#f0ebe0",
                borderRadius: 12,
                textDecoration: "none",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.09)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.22em", color: "#9a8a68", marginBottom: 10, textTransform: "uppercase", fontWeight: 500 }}>
                  QUICK CONTACT
                </p>
                <h3 style={{ fontSize: 19, fontWeight: 600, color: "#1a1a1a", marginBottom: 8, lineHeight: 1.3 }}>
                  카카오톡 상담
                </h3>
                <p style={{ fontSize: 13, color: "#666", fontWeight: 300, lineHeight: 1.65 }}>
                  카카오톡으로 빠른 답변을 받아 보세요
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <span style={{ fontSize: 18, color: "#9a8a68", fontWeight: 300 }}>→</span>
              </div>
            </a>

            {/* 상담 신청 카드 */}
            <Link
              to="/consultation"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "32px 28px",
                background: "linear-gradient(145deg, #0b1f3a 0%, #163355 100%)",
                borderRadius: 12,
                textDecoration: "none",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(11,31,58,0.30)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(222,197,132,0.72)", marginBottom: 10, textTransform: "uppercase", fontWeight: 500 }}>
                  1:1 LEGAL CONSULTATION
                </p>
                <h3 style={{ fontSize: 19, fontWeight: 600, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>
                  상담 신청
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", fontWeight: 300, lineHeight: 1.65 }}>
                  1:1 맞춤 상담을 신청해 보세요
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <span style={{ fontSize: 18, color: "var(--accent-gold)", fontWeight: 300 }}>→</span>
              </div>
            </Link>
          </div>

          {/* ── 우측: 소식과 자료 패널 ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "32px 36px 28px",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e8eaed",
            }}
          >
            {/* 헤더 + 탭 필터 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <h2
                className="font-serif-kr"
                style={{ fontSize: 17, fontWeight: 600, color: "#0b0e14", margin: 0, letterSpacing: "-0.01em" }}
              >
                소식과 자료
              </h2>
              <div style={{ display: "flex", gap: 7 }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: "5px 15px",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        borderRadius: 20,
                        border: "1px solid",
                        borderColor: isActive ? "#c9a84c" : "#dde0e5",
                        background: isActive ? "#fdf6e8" : "transparent",
                        color: isActive ? "#8a6520" : "#7a8090",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                        lineHeight: 1,
                        minHeight: 30,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 구분선 */}
            <div style={{ height: 1, background: "#ececec", marginBottom: 4 }} />

            {/* 기사 목록 */}
            <div style={{ flex: 1 }}>
              {filteredPosts.length === 0 ? (
                <p style={{ padding: "48px 0", textAlign: "center", fontSize: 13, color: "#bbb" }}>
                  게시된 글이 없습니다.
                </p>
              ) : (
                filteredPosts.map((post, idx) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 0",
                      borderBottom: idx < filteredPosts.length - 1 ? "1px solid #f2f2f2" : "none",
                      textDecoration: "none",
                      borderRadius: 4,
                      transition: "padding-left 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "6px"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; }}
                  >
                    <span style={{ fontSize: 11.5, color: "#9ca3af", flexShrink: 0, letterSpacing: "0.01em" }}>
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#1a1a2e",
                        lineHeight: 1.45,
                        fontWeight: 400,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.title}
                    </span>
                  </Link>
                ))
              )}
            </div>

            {/* 전체보기 */}
            <div style={{ textAlign: "right", paddingTop: 16, marginTop: "auto", borderTop: "1px solid #f0f0f0" }}>
              <Link
                to="/blog"
                style={{
                  fontSize: 12.5,
                  color: "#c9a84c",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                전체보기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
