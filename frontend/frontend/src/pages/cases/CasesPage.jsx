/** 성공 사례 페이지 — 카테고리별 사례 목록, 결과 배지 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";

/** 사례 카테고리 필터 옵션 */
const CATEGORY_OPTIONS = [
  { key: null, label: "전체" },
  { key: "civil", label: "민사" },
  { key: "criminal", label: "형사" },
  { key: "family", label: "가사" },
  { key: "administrative", label: "행정" },
  { key: "tax", label: "조세" },
  { key: "real_estate", label: "부동산" },
  { key: "corporate", label: "기업법무" },
];

/** 카테고리 키를 한글 라벨로 변환 */
function getCategoryLabel(key) {
  const found = CATEGORY_OPTIONS.find((c) => c.key === key);
  return found ? found.label : key;
}

/** 결과 배지 색상 매핑 — 결과 텍스트에 따라 배경색 반환 */
const RESULT_COLORS = {
  "승소": "#1a3a6b",
  "일부승소": "#3b6fa0",
  "합의": "#2d7d6b",
  "불기소": "#3b6fa0",
  "무죄": "#1a3a6b",
  "감형": "#4a7ab5",
  "기각": "#94a3b8",
  "조정성립": "#2d7d6b",
  "인용": "#1a3a6b",
};

function getResultColor(result) {
  return RESULT_COLORS[result] || "#64748b";
}

export default function CasesPage() {
  const ref = useReveal();
  const [cases, setCases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  /** 사례 목록 불러오기 */
  const fetchCases = useCallback(async (category = selectedCategory) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (category) params.set("category", category);

      const res = await api.get(`/cases?${params}`);
      setCases(res.data || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCases(selectedCategory);
  }, [selectedCategory, fetchCases]);

  return (
    <div ref={ref}>
      <Seo
        path="/cases"
        title="성공 사례"
        description="법무법인 하이로가 다룬 주요 사건과 결과 — 건설·부동산·민사·형사 분야의 성공 사례를 확인하세요."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "성공 사례", path: "/cases" },
        ])}
      />
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        <div className="relative text-center" style={{ maxWidth: 700, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 40 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 16 }}
          >
            성공 사례
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "var(--white-40)", marginBottom: 24 }}>
            SUCCESS CASES
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", fontWeight: 300, lineHeight: 1.9 }}>
            법무법인 하이로의 주요 성공 사례를 소개합니다.
          </p>
        </div>
      </section>

      {/* ==================== 카테고리 필터 + 사례 목록 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          {/* 카테고리 필터 칩 */}
          <div className="flex flex-wrap justify-center gap-3 reveal" style={{ marginBottom: 48 }}>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.key ?? "all"}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: "8px 24px",
                  minHeight: 44,
                  fontSize: 13,
                  fontWeight: 400,
                  border: "1px solid",
                  borderColor: selectedCategory === cat.key ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                  borderRadius: 24,
                  background: selectedCategory === cat.key ? "var(--accent-gold)" : "transparent",
                  color: selectedCategory === cat.key ? "#fff" : "var(--gray-500)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  letterSpacing: "0.05em",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 사례 목록 */}
          {loading ? (
            <div className="text-center" style={{ padding: "80px 0", color: "var(--text-muted)" }}>
              불러오는 중...
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center reveal" style={{ padding: "80px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15 }}>등록된 성공 사례가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cases.map((item) => (
                <article
                  key={item.id}
                  className="reveal hover:shadow-lg"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 4,
                    padding: "28px 28px 24px",
                    background: "#fff",
                    transition: "all 0.3s",
                  }}
                >
                  {/* 상단: 카테고리 + 결과 배지 */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: getResultColor(item.result),
                        color: "#fff",
                        borderRadius: 2,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.result}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 12 }}>
                    {item.title}
                  </h3>

                  {/* 요약 */}
                  <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8 }}>
                    {item.summary}
                  </p>

                  {/* 상세 내용 (있을 경우) */}
                  {item.detail && (
                    <details style={{ marginTop: 16 }}>
                      <summary
                        style={{
                          fontSize: 13,
                          color: "var(--accent-gold)",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        상세 내용 보기
                      </summary>
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.8, marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--accent-gold)" }}>
                        {item.detail}
                      </p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
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
