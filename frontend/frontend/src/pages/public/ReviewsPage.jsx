/** 의뢰인 후기 페이지 — 공개 리뷰 목록, 별점, 카테고리 필터, 페이지네이션 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useReveal from "../../hooks/useReveal";
import { api } from "../../utils/api";
import { SkeletonReviewCard } from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";

const T = { accent: "var(--accent-gold)", accentDim: "rgba(26,58,107,0.08)", text: "var(--text-primary)", textSec: "var(--text-secondary)", textMuted: "var(--text-muted)", border: "var(--gray-100)", card: "#ffffff" };

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
];

const ITEMS_PER_PAGE = 6;

/** 별점 렌더링 (filled/empty) */
function Stars({ rating, size = 18, color = T.accent }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? color : "var(--gray-100)", lineHeight: 1 }}>
          {i <= rating ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

/** 카테고리 라벨 변환 */
function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

export default function ReviewsPage() {
  const ref = useReveal();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (category) params.set("category", category);
      const json = await api.get(`/reviews?${params}`);
      setReviews(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
      setTotalCount(json.meta?.total ?? 0);
      if (json.meta?.averageRating != null) {
        setAverageRating(json.meta.averageRating);
      }
    } catch {
      setReviews([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => { load(); }, [load]);

  /** 카테고리 변경 시 첫 페이지로 초기화 */
  const handleCategory = (val) => {
    setCategory(val);
    setPage(1);
  };

  return (
    <div ref={ref}>
      <Seo
        path="/reviews"
        title="고객 후기"
        description="법무법인 하이로를 거쳐간 의뢰인들의 실제 후기와 평가를 확인하세요."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "고객 후기", path: "/reviews" },
        ])}
      />
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="reveal" style={{ opacity: 0, transform: "translateY(30px)", transition: "all 0.8s ease" }}>
          <p style={{ fontSize: 13, letterSpacing: 4, color: T.accent, marginBottom: 16, fontWeight: 500 }}>
            CLIENT REVIEWS
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 300, fontFamily: "'Noto Serif KR', serif", lineHeight: 1.3, marginBottom: 16 }}>
            의뢰인 후기
          </h1>
          <div style={{ width: 48, height: 1, background: T.accent, margin: "0 auto 24px" }} />
          <p style={{ fontSize: 15, color: "var(--white-60)", maxWidth: 500, margin: "0 auto" }}>
            법무법인 하이로를 경험하신 의뢰인의 생생한 후기입니다
          </p>
        </div>
      </section>

      {/* ==================== 평균 별점 ==================== */}
      <section style={{ background: "#faf9f6", padding: "48px 24px", textAlign: "center" }}>
        <div className="reveal" style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.6s ease" }}>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>평균 만족도</p>
          <div style={{ fontSize: 42, fontWeight: 300, color: T.text, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
            {averageRating ? averageRating.toFixed(1) : "-"}
          </div>
          <Stars rating={Math.round(averageRating)} size={24} />
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>총 {totalCount}건의 후기</p>
        </div>
      </section>

      {/* ==================== 카테고리 필터 ==================== */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 0" }}>
        <div role="radiogroup" aria-label="후기 카테고리 선택" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {CATEGORIES.map((c) => {
            const selected = category === c.value;
            return (
              <button
                key={c.value}
                role="radio"
                aria-checked={selected}
                onClick={() => handleCategory(c.value)}
                style={{
                  padding: "10px 20px",
                  minHeight: 44,
                  fontSize: 13,
                  fontWeight: selected ? 600 : 400,
                  color: selected ? "#fff" : T.textSec,
                  background: selected ? T.accent : "transparent",
                  border: `1px solid ${selected ? T.accent : T.border}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================== 리뷰 카드 ==================== */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 60px" }}>
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 20 }}
          >
            <span className="sr-only">후기를 불러오는 중입니다</span>
            {Array.from({ length: 6 }, (_, i) => <SkeletonReviewCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState
            title="후기를 불러오지 못했습니다"
            message="네트워크 상태를 확인하신 후 다시 시도해 주세요."
            onRetry={load}
          />
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: T.textMuted }}>
            <p style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">&#x1F4DD;</p>
            <p>등록된 후기가 없습니다</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 20 }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                className="reveal"
                style={{
                  opacity: 0,
                  transform: "translateY(20px)",
                  transition: "all 0.5s ease",
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: 28,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Stars rating={r.rating} />
                  {r.category && (
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 10,
                      background: T.accentDim, color: T.accent, fontWeight: 500,
                    }}>
                      {categoryLabel(r.category)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, marginBottom: 16, minHeight: 60 }}>
                  {r.content}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.textSec }}>
                    {r.isAnonymous ? "익명" : r.clientName}
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ko-KR") : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== 페이지네이션 ==================== */}
        {totalPages > 1 && (
          <nav aria-label="페이지 이동" style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40, flexWrap: "wrap" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="이전 페이지"
              style={{
                padding: "10px 16px", minHeight: 44, fontSize: 13, border: `1px solid ${T.border}`,
                borderRadius: 4, background: "#fff", cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              &#8592; 이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const current = p === page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`${p}페이지로 이동`}
                  aria-current={current ? "page" : undefined}
                  style={{
                    minWidth: 44, minHeight: 44, padding: "10px 14px", fontSize: 13,
                    border: `1px solid ${current ? T.accent : T.border}`,
                    borderRadius: 4, background: current ? T.accent : "#fff",
                    color: current ? "#fff" : T.text, cursor: "pointer", fontWeight: current ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="다음 페이지"
              style={{
                padding: "10px 16px", minHeight: 44, fontSize: 13, border: `1px solid ${T.border}`,
                borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "default" : "pointer",
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              다음 &#8594;
            </button>
          </nav>
        )}
      </section>

      {/* ===== 상담 안내 ===== */}
      <section style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px" }}>
          <div className="reveal">
            <div className="sep mx-auto" style={{ marginBottom: 28 }} />
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 300, color: "#fff", marginBottom: 12, letterSpacing: "0.05em" }}>
              법률 문제, 전문가와 상담하세요
            </h2>
            <p style={{ fontSize: 14, color: "var(--white-40)", marginBottom: 36, lineHeight: 1.8, fontWeight: 300 }}>
              사건의 초기 단계부터 전문 변호사의 정확한 분석과 전략을 확인하세요
            </p>
            <Link
              to="/consultation"
              style={{
                display: "inline-block", padding: "14px 48px", fontSize: 13,
                letterSpacing: "0.15em", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent", textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#0a1628"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}
            >
              상담 신청하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
