/** 블로그 목록 페이지 — 카테고리 필터, 페이지네이션 */
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import useReveal from "../../hooks/useReveal";
import { SkeletonGrid } from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";
import { PublicHero, SurfaceCard } from "../../components/public/PublicDesign";

/** 블로그 카테고리 라벨/키 매핑 */
const CATEGORY_OPTIONS = [
  { key: null, label: "전체" },
  { key: "construction_realestate", label: "하이로 뉴스" },
  { key: "case_analysis", label: "판례 분석" },
  { key: "law_guide", label: "법률 가이드" },
];

/** 카테고리 키를 한글 라벨로 변환 */
function getCategoryLabel(key) {
  const found = CATEGORY_OPTIONS.find((c) => c.key === key);
  return found ? found.label : key;
}

/** 날짜 포맷 (YYYY-MM-DD 또는 YYYY.MM.DD) */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

export default function BlogPage() {
  const ref = useReveal();
  const listRef = useRef();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /** 게시글 목록 불러오기 */
  const fetchPosts = useCallback(async (page = 1, category = selectedCategory) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (category) params.set("category", category);

      const res = await api.get(`/blog?${params}`);
      setPosts(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch {
      setPosts([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPosts(1, selectedCategory);
  }, [selectedCategory, fetchPosts]);

  // 게시글 로딩 완료 후 reveal 애니메이션 재적용
  useLayoutEffect(() => {
    if (!listRef.current || posts.length === 0) return;
    const targets = listRef.current.querySelectorAll(".reveal:not(.visible)");
    if (targets.length === 0) return;
    targets.forEach((t) => t.classList.add("reveal-pending"));
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
      }),
      { threshold: 0.1 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [posts]);

  function handleCategoryChange(key) {
    setSelectedCategory(key);
  }

  function handlePageChange(newPage) {
    fetchPosts(newPage, selectedCategory);
    window.scrollTo({ top: 400, behavior: "smooth" });
  }

  return (
    <div ref={ref}>
      <Seo
        path="/blog"
        title="블로그"
        description="법무법인 하이로 블로그 — 민사·형사·가사·행정·건설 분야의 핵심 이슈와 판례 해설."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "블로그", path: "/blog" },
        ])}
      />
      <PublicHero
        eyebrow="BLOG"
        title="블로그"
        description="법률 이슈와 판례 분석, 실무 가이드를 제공합니다."
      />

      {/* ==================== 카테고리 필터 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div role="radiogroup" aria-label="카테고리 선택" className="flex flex-wrap justify-center gap-3 reveal visible" style={{ marginBottom: 48 }}>
            {CATEGORY_OPTIONS.map((cat) => {
              const selected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key ?? "all"}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleCategoryChange(cat.key)}
                  style={{
                    padding: "10px 24px",
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: 400,
                    border: "1px solid",
                    borderColor: selected ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                    borderRadius: 24,
                    background: selected ? "var(--accent-gold)" : "transparent",
                    color: selected ? "#fff" : "var(--gray-500)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    letterSpacing: "0.05em",
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* ==================== 게시글 목록 ==================== */}
          {loading ? (
            <SkeletonGrid count={6} minColumnWidth={280} thumbnailHeight={180} />
          ) : error ? (
            <ErrorState
              title="칼럼 목록을 불러오지 못했습니다"
              message="네트워크 상태를 확인하신 후 다시 시도해 주세요."
              onRetry={() => fetchPosts(1, selectedCategory)}
            />
          ) : posts.length === 0 ? (
            <div className="text-center reveal visible" style={{ padding: "80px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15 }}>등록된 칼럼이 없습니다.</p>
            </div>
          ) : (
            <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="reveal visible group"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <SurfaceCard
                    as="article"
                    style={{
                      overflow: "hidden",
                      background: "#fff",
                    }}
                    className="hover:shadow-lg"
                  >
                    {/* 썸네일 영역 — <img loading="lazy">로 뷰포트 진입 시에만 다운로드 */}
                    <div
                      style={{
                        position: "relative",
                        height: 180,
                        background: "linear-gradient(135deg, #0f1d32 0%, #2a3a4f 100%)",
                        overflow: "hidden",
                      }}
                    >
                      {post.thumbnailUrl && (
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <span
                        style={{
                          position: "absolute",
                          left: 16,
                          bottom: 16,
                          display: "inline-block",
                          padding: "4px 12px",
                          fontSize: 11,
                          fontWeight: 500,
                          background: "var(--accent-gold)",
                          color: "#fff",
                          borderRadius: 2,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {getCategoryLabel(post.category)}
                      </span>
                    </div>

                    {/* 본문 영역 */}
                    <div style={{ padding: "20px 20px 24px" }}>
                      <h3
                        className="group-hover:text-[var(--accent-gold)] transition-colors"
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          lineHeight: 1.5,
                          marginBottom: 8,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "#888",
                            lineHeight: 1.7,
                            marginBottom: 16,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between" style={{ fontSize: 12, color: "#aaa" }}>
                        <span>{post.author || "법무법인 하이로"}</span>
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>
                  </SurfaceCard>
                </Link>
              ))}
            </div>
          )}

          {/* ==================== 페이지네이션 ==================== */}
          {meta.totalPages > 1 && (
            <nav aria-label="페이지 이동" className="flex flex-wrap justify-center gap-2" style={{ marginTop: 48 }}>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
                const current = p === meta.page;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    aria-label={`${p}페이지로 이동`}
                    aria-current={current ? "page" : undefined}
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 13,
                      border: "1px solid",
                      borderColor: current ? "var(--accent-gold)" : "rgba(0,0,0,0.1)",
                      borderRadius: 4,
                      background: current ? "var(--accent-gold)" : "transparent",
                      color: current ? "#fff" : "var(--gray-500)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
