import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import Spinner from "../../components/ui/Spinner";

export default function HomeHero({ heroVideo, settings }) {
  const [videoReady, setVideoReady] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ lawyers: [], posts: [], questions: [] });

  // 검색 로직
  useEffect(() => {
    if (!query.trim()) {
      setResults({ lawyers: [], posts: [], questions: [] });
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);
      try {
        const [lawyersRes, blogRes, qnaRes] = await Promise.all([
          api.get("/lawyers").catch(() => ({ data: [] })),
          api.get("/blog").catch(() => ({ data: [] })),
          api.get("/qna/questions").catch(() => ({ data: [] })),
        ]);

        const lVal = query.toLowerCase();

        const filteredLawyers = (lawyersRes.data || []).filter((l) =>
          (l.name || "").toLowerCase().includes(lVal) ||
          (l.position || "").toLowerCase().includes(lVal) ||
          (l.expertise || "").toLowerCase().includes(lVal)
        );

        const filteredPosts = (blogRes.data || []).filter((p) =>
          (p.title || "").toLowerCase().includes(lVal) ||
          (p.body || "").toLowerCase().includes(lVal)
        );

        const filteredQuestions = (qnaRes.data || []).filter((q) =>
          (q.title || "").toLowerCase().includes(lVal) ||
          (q.body || "").toLowerCase().includes(lVal)
        );

        setResults({
          lawyers: filteredLawyers,
          posts: filteredPosts,
          questions: filteredQuestions,
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results.lawyers.length > 0 || results.posts.length > 0 || results.questions.length > 0;

  return (
    <section className="hp-hero" onClick={() => setShowResults(false)}>
      <video
        key={heroVideo}
        className={`hp-hero-video${videoReady ? " is-ready" : ""}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/og-image.png"
        src={heroVideo}
        onCanPlay={() => setVideoReady(true)}
      />

      <div className="hp-hero-overlay" />

      <div
        className="hp-hero-content"
        style={{
          transform: "translateY(24vh)", // 화면 중앙선보다 더 하단에 우아하게 안착
          transition: "transform 0.5s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 통합 검색창 영역 — 샴페인 골드 테두리 & 반투명 다크 스타일 */}
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            margin: "0 auto 36px",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(10, 12, 16, 0.75)",
              border: "1px solid var(--accent-gold)",
              borderRadius: 30,
              padding: "6px 20px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowResults(true)}
              placeholder="검색어를 입력해 주세요 (변호사, 소식, 상담 내역...)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                padding: "8px 0",
                letterSpacing: "0.05em",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {searching ? (
                <Spinner size={16} color="var(--accent-gold)" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent-gold)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </div>
          </div>

          {/* 실시간 검색 결과 패널 */}
          {showResults && (
            <div
              style={{
                position: "absolute",
                top: "115%",
                left: 0,
                right: 0,
                background: "rgba(12, 15, 20, 0.95)",
                border: "1px solid rgba(222, 197, 132, 0.3)",
                borderRadius: 12,
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                padding: "16px 20px",
                maxHeight: 400,
                overflowY: "auto",
                textAlign: "left",
                zIndex: 100,
                backdropFilter: "blur(12px)",
              }}
            >
              {searching && (
                <p style={{ color: "var(--accent-gold)", fontSize: 13, margin: "8px 0" }}>검색 중...</p>
              )}

              {!searching && !hasResults && (
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", margin: "16px 0" }}>
                  검색 결과가 존재하지 않습니다.
                </p>
              )}

              {!searching && hasResults && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* 변호사 결과 */}
                  {results.lawyers.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--accent-gold)", letterSpacing: "0.1em", fontWeight: 600, borderBottom: "1px solid rgba(222,197,132,0.15)", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
                        PARTNERS / 변호사 ({results.lawyers.length})
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {results.lawyers.map((l) => (
                          <Link
                            key={l.id}
                            to={`/lawyers/${l.id}`}
                            style={{ display: "block", color: "#fff", textDecoration: "none", fontSize: 13, padding: "4px 8px", borderRadius: 4, transition: "background 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(222, 197, 132, 0.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontWeight: 600, marginRight: 6 }}>{l.name}</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{l.position}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 블로그 결과 */}
                  {results.posts.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--accent-gold)", letterSpacing: "0.1em", fontWeight: 600, borderBottom: "1px solid rgba(222,197,132,0.15)", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
                        NEWS / 소식 ({results.posts.length})
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {results.posts.map((p) => (
                          <Link
                            key={p.id}
                            to={`/blog/${p.slug}`}
                            style={{ display: "block", color: "#fff", textDecoration: "none", fontSize: 13, padding: "4px 8px", borderRadius: 4, transition: "background 0.2s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(222, 197, 132, 0.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Q&A 결과 */}
                  {results.questions.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--accent-gold)", letterSpacing: "0.1em", fontWeight: 600, borderBottom: "1px solid rgba(222,197,132,0.15)", paddingBottom: 4, marginBottom: 8, textTransform: "uppercase" }}>
                        Q&A / 상담 내역 ({results.questions.length})
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {results.questions.map((q) => (
                          <Link
                            key={q.id}
                            to={`/qna/question/${q.slug}`}
                            style={{ display: "block", color: "#fff", textDecoration: "none", fontSize: 13, padding: "4px 8px", borderRadius: 4, transition: "background 0.2s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(222, 197, 132, 0.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {q.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 검색창 아래 여백을 20px로 가깝게 좁히고, 검색창의 560px 너비에 정합하여 반반 배치 */}
        <div 
          className="hp-cta-buttons" 
          style={{ 
            marginTop: 20, 
            width: "100%", 
            maxWidth: 560, 
            margin: "20px auto 0", 
            display: "flex", 
            gap: 12, 
            justifyContent: "space-between",
            flexWrap: "nowrap"
          }}
        >
          <Link
            to={settings?.hero?.ctaPrimaryLink || "/consultation"}
            className="hp-hero-button hp-hero-button-primary"
            style={{ flex: 1, minWidth: 0, fontSize: 12, padding: "12px 16px", letterSpacing: "0.15em", fontWeight: 500 }}
          >
            {settings?.hero?.ctaPrimary || "사건 진단"}
          </Link>
          <a
            href={settings?.hero?.ctaSecondaryLink || "tel:02-6925-6757"}
            className="hp-hero-button hp-hero-button-secondary"
            style={{ flex: 1, minWidth: 0, fontSize: 12, padding: "12px 16px", letterSpacing: "0.15em", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            {settings?.hero?.ctaSecondary || "전화 상담 02-6925-6757"}
          </a>
        </div>
      </div>

      <div className="hp-scroll-indicator" aria-hidden="true">
        <span>SCROLL</span>
      </div>
    </section>
  );
}
