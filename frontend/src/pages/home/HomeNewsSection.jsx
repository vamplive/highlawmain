/** 홈 소식 섹션 — 섹션 헤더 + 좌측 CTA 카드 + 우측 탭별 기사 목록 */
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
    <section className="hp-section" style={{ background: "#f2f4f8" }}>
      <div className="hp-section-inner">

        {/* ── 섹션 헤더 ── */}
        <div className="hp-section-centered">
          <p className="hp-kicker">NEWS &amp; INSIGHT</p>
          <h2 className="hp-title" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
            하이로 뉴스 &amp; 법률 인사이트
          </h2>
          <p className="hp-copy">
            전문 변호사가 직접 분석한 최신 판례와 특화 분야 법률 정보를 제공합니다.
          </p>
        </div>

        {/* ── 2컬럼 본문 ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.65fr",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {/* 좌측: CTA 카드 2개 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 카카오톡 상담 */}
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
                background: "#ede8de",
                borderRadius: 10,
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                border: "1px solid rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.24em", color: "#8a7550", marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>
                  QUICK CONTACT
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  카카오톡 상담
                </h3>
                <p style={{ fontSize: 13, color: "#555", fontWeight: 300, lineHeight: 1.7 }}>
                  카카오톡으로 빠른 답변을 받아 보세요
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(138,117,80,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, color: "#8a7550",
                }}>→</span>
              </div>
            </a>

            {/* 상담 신청 */}
            <Link
              to="/consultation"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "32px 28px",
                background: "linear-gradient(150deg, #0b1f3a 0%, #1a3a6b 100%)",
                borderRadius: 10,
                textDecoration: "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                border: "1px solid rgba(201,168,76,0.18)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(11,31,58,0.32)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.24em", color: "rgba(201,168,76,0.75)", marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>
                  1:1 LEGAL CONSULTATION
                </p>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  상담 신청
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.58)", fontWeight: 300, lineHeight: 1.7 }}>
                  1:1 맞춤 법률 상담을 신청하세요
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "rgba(201,168,76,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, color: "var(--accent-gold)",
                }}>→</span>
              </div>
            </Link>
          </div>

          {/* 우측: 소식과 자료 패널 */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "28px 32px 24px",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e2e5ea",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            {/* 패널 헤더 + 탭 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--accent-gold)", fontWeight: 700, textTransform: "uppercase" }}>
                  LATEST
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0b0e14", margin: 0, letterSpacing: "-0.01em" }}>
                  소식과 자료
                </h3>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: "5px 14px",
                        fontSize: 11.5,
                        fontWeight: isActive ? 600 : 400,
                        borderRadius: 20,
                        border: "1px solid",
                        borderColor: isActive ? "#c9a84c" : "#dde1e8",
                        background: isActive ? "#fdf6e8" : "transparent",
                        color: isActive ? "#8a6520" : "#6b7280",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                        minHeight: 28,
                        lineHeight: 1,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 구분선 */}
            <div style={{ height: 1, background: "linear-gradient(to right, var(--accent-gold), transparent)", opacity: 0.4, marginBottom: 4 }} />

            {/* 기사 목록 */}
            <div style={{ flex: 1 }}>
              {filteredPosts.length === 0 ? (
                <p style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: "#ccc" }}>
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
                      padding: "13px 8px",
                      borderBottom: idx < filteredPosts.length - 1 ? "1px solid #f4f4f6" : "none",
                      textDecoration: "none",
                      borderRadius: 4,
                      transition: "background 0.15s, padding-left 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fafbfc"; e.currentTarget.style.paddingLeft = "14px"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.paddingLeft = "8px"; }}
                  >
                    {/* 날짜 */}
                    <span style={{ fontSize: 11, color: "#adb5bd", flexShrink: 0, letterSpacing: "0.01em", minWidth: 72 }}>
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    {/* 골드 구분 점 */}
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent-gold)", flexShrink: 0, opacity: 0.6 }} />
                    {/* 제목 */}
                    <span
                      style={{
                        fontSize: 13.5,
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
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 14, marginTop: "auto", borderTop: "1px solid #f0f2f5" }}>
              <Link
                to="/blog"
                style={{
                  fontSize: 12,
                  color: "#8a6520",
                  textDecoration: "none",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "gap 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.gap = "10px"; }}
                onMouseLeave={(e) => { e.currentTarget.style.gap = "5px"; }}
              >
                전체보기 <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
