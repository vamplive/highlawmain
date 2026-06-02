/** 홈 소식 및 블로그 섹션 컴포넌트 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";

const CATEGORIES = {
  construction_realestate: "하이로 뉴스",
  case_analysis: "판례 분석",
  law_guide: "법률 가이드",
};

const FALLBACK_POSTS = [
  {
    id: "fb-1",
    slug: "illegal-dispatch-precedents",
    category: "case_analysis",
    title: "불법파견 소송에서의 주요 쟁점과 실무 요령",
    excerpt: "도급과 파견의 구별 기준에 관한 대법원 최신 판례를 통해, 사용사업주의 직접고용 의무 및 근로자 지위 확인 소송의 핵심 쟁점을 정밀하게 짚어봅니다.",
    author: "조덕재 대표변호사",
    publishedAt: "2026-05-28T00:00:00.000Z",
  },
  {
    id: "fb-2",
    slug: "game-fraud-legal-guide",
    category: "law_guide",
    title: "게임 아이템 및 계정 사기 형사고소 시 주의사항",
    excerpt: "디지털 재화 거래 사기 피해 발생 시 경찰 수사 단계에서 반드시 확보해야 하는 핵심 로그 기록과 계좌 이체 내역 등 증거 제출 요령에 대해 상세히 안내합니다.",
    author: "강민구 대표변호사",
    publishedAt: "2026-05-20T00:00:00.000Z",
  },
  {
    id: "fb-3",
    slug: "serious-accident-center",
    category: "construction_realestate",
    title: "법무법인 하이로, 중대재해 컴플라이언스 전담 지원 센터 출범",
    excerpt: "기업 및 경영책임자의 선제적 안전보건관리체계 구축과 산업재해 발생 시 골든타임 내 초동대응을 원스톱으로 조력하는 전문 센터를 가동합니다.",
    author: "하이로 뉴스",
    publishedAt: "2026-05-15T00:00:00.000Z",
  },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

export default function HomeNewsSection({ settings }) {
  const [posts, setPosts] = useState(FALLBACK_POSTS);

  useEffect(() => {
    let cancelled = false;
    api.get("/blog?limit=3")
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        if (rows.length > 0) {
          setPosts(rows.slice(0, 3));
        } else {
          setPosts(FALLBACK_POSTS);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts(FALLBACK_POSTS);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hp-section" style={{ background: "#ffffff" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{settings?.newsHeader?.kicker || "BLOG & NEWS"}</p>
          <h2 className="hp-title">{settings?.newsHeader?.title || "하이로 소식 & 법률 칼럼"}</h2>
          <p className="hp-copy">{settings?.newsHeader?.description || "전문 변호사들이 직접 분석한 최신 판례 분석과 특화 분야 법률 정보를 제공합니다."}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            marginTop: "48px",
            width: "100%",
          }}
        >
          {posts.map((post) => {
            const catLabel = CATEGORIES[post.category] || post.category || "하이로 칼럼";
            return (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="hp-lawyer-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* 썸네일 대용 배경 */}
                <div
                  style={{
                    position: "relative",
                    height: "160px",
                    background: "linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {post.thumbnailUrl ? (
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ color: "rgba(255, 255, 255, 0.15)", fontSize: "48px", fontWeight: 700 }}>
                      ⚖️
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      left: "16px",
                      bottom: "16px",
                      background: "var(--accent-gold)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "2px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {catLabel}
                  </span>
                </div>

                <div
                  className="hp-lawyer-body"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <h3
                    className="hp-lawyer-name"
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      lineHeight: "1.45",
                      marginBottom: "10px",
                      color: "#1a1a1a",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "44px",
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666666",
                      lineHeight: "1.6",
                      marginBottom: "20px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      fontWeight: 300,
                      flexGrow: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#999999",
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: "12px",
                      marginTop: "auto",
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>{post.author || "법무법인 하이로"}</span>
                    <span style={{ marginLeft: "auto" }}>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "56px" }}>
          <Link
            to="/blog"
            className="hp-hero-button hp-hero-button-secondary"
            style={{
              borderColor: "var(--accent-gold)",
              color: "var(--accent-gold)",
              background: "transparent",
              fontSize: "14px",
              padding: "12px 32px",
              minHeight: "44px",
            }}
          >
            소식 전체보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
