/**
 * 법률 Q&A 허브 — 대분류 탭 필터 + 카테고리 네비 + 대표 Q&A + 전체 목록
 * 법률 전 분야를 포괄하는 Q&A 게시판의 진입 페이지
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import useReveal from "../../hooks/useReveal";
import { findNodeBySlug, qnaDetailUrl, qnaCategoryUrl, formatKoreanDate, truncate } from "./qnaUtils";

export default function QnaHubPage() {
  const ref = useReveal();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [tree, setTree] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  // 대분류 탭 — slug가 없을 때 전체 or 대분류별 필터
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const currentNav = useMemo(() => (slug ? findNodeBySlug(tree, slug) : { node: null, path: [] }), [tree, slug]);

  // 탭 변경 시 또는 slug 변경 시 질문 목록 재로드
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // slug가 있으면 해당 카테고리로, 없으면 탭 기준
    const categorySlug = slug || (activeTab !== "all" ? activeTab : null);
    const params = new URLSearchParams({ limit: 30 });
    if (categorySlug) params.set("categorySlug", categorySlug);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const listUrl = `/qna/questions?${params}`;

    Promise.all([
      api.get("/qna/categories"),
      api.get(listUrl),
      !slug ? api.get("/qna/questions?limit=10&featured=true") : Promise.resolve({ data: [] }),
    ])
      .then(([t, q, f]) => {
        if (cancelled) return;
        setTree(t.data || []);
        setQuestions(q.data || []);
        setFeatured(f.data || []);
      })
      .catch(() => { if (!cancelled) { setTree([]); setQuestions([]); setFeatured([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, activeTab, searchActive]);

  useEffect(() => {
    const title = currentNav.node
      ? `${currentNav.node.name} Q&A | 법무법인 하이로`
      : "Q&A | 법무법인 하이로";
    document.title = title;
  }, [currentNav.node]);

  // slug 진입 시 탭 동기화
  useEffect(() => {
    if (slug && tree.length) {
      const found = findNodeBySlug(tree, slug);
      const topSlug = found.path[0]?.slug;
      if (topSlug) setActiveTab(topSlug);
    } else if (!slug) {
      setActiveTab("all");
    }
  }, [slug, tree]);

  function handleTabClick(tabSlug) {
    if (slug) {
      // URL 카테고리 모드에서 탭 클릭 시 URL 변경
      navigate(tabSlug === "all" ? "/qna" : qnaCategoryUrl(tabSlug));
    } else {
      setActiveTab(tabSlug);
    }
  }

  // 현재 선택된 대분류의 중분류 목록
  const activeTopCat = tree.find((t) => t.slug === activeTab);

  return (
    <div ref={ref}>
      {/* 히어로 */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: "55vh", minHeight: 400 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url(/construction-hero3.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,15,20,0.90) 0%, rgba(17,29,42,0.80) 40%, rgba(22,36,51,0.82) 70%, rgba(13,21,32,0.92) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 120, background: "linear-gradient(to top, #fff, transparent)" }} />

        <div className="relative text-center" style={{ maxWidth: 760, padding: "0 24px", zIndex: 2 }}>
          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="font-en inline-block" style={{ fontSize: 11, letterSpacing: "0.35em", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8 }}>
              LEGAL Q&A
            </span>
          </div>
          <h1 className="font-serif-kr reveal" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 300, color: "#fff", lineHeight: 1.4, marginBottom: 20 }}>
            {currentNav.node ? currentNav.node.name : <><span style={{ fontWeight: 500 }}>Q&amp;A</span></>}
          </h1>
          <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.9, fontWeight: 300, maxWidth: 560, margin: "0 auto" }}>
            {currentNav.node?.description || "전문 변호사가 답변하는 법률 질의응답입니다."}
          </p>
        </div>
      </section>

      {/* 브레드크럼 + 검색 + 질문하기 */}
      <section style={{ background: "#f7f8fa", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: 1080, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Breadcrumb path={currentNav.path} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <form onSubmit={(e) => { e.preventDefault(); setSearchActive((v) => !v); }} style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="질문 검색..."
                style={{
                  padding: "8px 12px", fontSize: 13, border: "1px solid var(--border-color)",
                  borderRadius: 3, width: 180, fontFamily: "inherit",
                }}
              />
              <button type="submit" style={{
                padding: "8px 14px", fontSize: 12, background: "var(--text-primary)", color: "#fff",
                border: "none", borderRadius: 3, cursor: "pointer",
              }}>검색</button>
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); setSearchActive((v) => !v); }} style={{
                  padding: "8px 10px", fontSize: 12, background: "none", color: "var(--text-muted)",
                  border: "1px solid var(--border-color)", borderRadius: 3, cursor: "pointer",
                }}>초기화</button>
              )}
            </form>
          <button
            onClick={() => navigate("/qna/ask", { state: { categorySlug: slug } })}
            style={{
              padding: "10px 24px", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em",
              background: "var(--accent-gold)", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer",
            }}
          >
            + 질문 남기기
          </button>
          </div>
        </div>
      </section>

      {/* 대분류 탭 바 */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--border-subtle)", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="container" style={{ maxWidth: 1080, padding: "0 24px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
            <TabButton active={activeTab === "all"} onClick={() => handleTabClick("all")}>
              전체
            </TabButton>
            {tree.map((top) => (
              <TabButton key={top.id} active={activeTab === top.slug} onClick={() => handleTabClick(top.slug)}>
                {top.name}
              </TabButton>
            ))}
          </div>
        </div>
      </section>

      {/* 중분류 서브 네비 (대분류 선택 시) */}
      {activeTopCat && activeTopCat.children?.length > 0 && (
        <section style={{ background: "#f7f8fa", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="container" style={{ maxWidth: 1080, padding: "10px 24px", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Link
                to={qnaCategoryUrl(activeTopCat.slug)}
                style={{
                  padding: "6px 14px", fontSize: 12, borderRadius: 16,
                  textDecoration: "none", fontWeight: slug === activeTopCat.slug ? 600 : 400,
                  background: slug === activeTopCat.slug ? "var(--accent-gold)" : "#fff",
                  color: slug === activeTopCat.slug ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                전체
              </Link>
              {activeTopCat.children.map((mid) => (
                <Link
                  key={mid.id}
                  to={qnaCategoryUrl(mid.slug)}
                  style={{
                    padding: "6px 14px", fontSize: 12, borderRadius: 16,
                    textDecoration: "none", fontWeight: slug === mid.slug ? 600 : 400,
                    background: slug === mid.slug ? "var(--accent-gold)" : "#fff",
                    color: slug === mid.slug ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {mid.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 본문 */}
      <section className="section" style={{ background: "#fff", paddingTop: 32, paddingBottom: 48 }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          {!slug && activeTab === "all" && featured.length > 0 && (
            <FeaturedSection featured={featured} />
          )}
          <QuestionList
            questions={questions}
            loading={loading}
            emptyMessage={currentNav.node ? "이 카테고리에는 아직 공개된 질문이 없습니다." : "아직 공개된 질문이 없습니다."}
          />
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 18px", fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? "var(--accent-gold)" : "var(--text-secondary)",
        background: "none", border: "none", cursor: "pointer",
        borderBottom: active ? "2px solid var(--accent-gold)" : "2px solid transparent",
        whiteSpace: "nowrap", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Breadcrumb({ path }) {
  return (
    <nav aria-label="경로" style={{ fontSize: 12, color: "var(--text-muted)" }}>
      <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>홈</Link>
      <span style={{ margin: "0 8px" }}>›</span>
      <Link to="/qna" style={{ color: path.length > 0 ? "inherit" : "var(--text-primary)", textDecoration: "none", fontWeight: path.length > 0 ? 400 : 500 }}>
        Q&A
      </Link>
      {path.map((n, i) => (
        <span key={n.id}>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link
            to={qnaCategoryUrl(n.slug)}
            style={{
              color: i === path.length - 1 ? "var(--text-primary)" : "inherit",
              textDecoration: "none", fontWeight: i === path.length - 1 ? 500 : 400,
            }}
          >
            {n.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

/** 대표 질문 무한 스크롤 캐러셀 — 끝에 도달하면 처음으로 이어짐 */
function FeaturedSection({ featured }) {
  const scrollRef = useRef(null);
  // 원본 x3 복제해서 가운데 세트에서 시작 → 양쪽 끝 도달 시 중앙으로 점프
  const tripled = useMemo(() => [...featured, ...featured, ...featured], [featured]);
  const cardWidth = 316; // 300px + 16px gap

  // 마운트 시 가운데 세트 위치로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !featured.length) return;
    el.scrollLeft = featured.length * cardWidth;
  }, [featured]);

  // 스크롤 끝 감지 → 무한 루프 점프
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !featured.length) return;
    const oneSetWidth = featured.length * cardWidth;
    // 오른쪽 끝 도달 → 가운데 세트로 점프
    if (el.scrollLeft >= oneSetWidth * 2) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft -= oneSetWidth;
      el.style.scrollBehavior = "";
    }
    // 왼쪽 끝 도달 → 가운데 세트로 점프
    if (el.scrollLeft <= 0) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft += oneSetWidth;
      el.style.scrollBehavior = "";
    }
  }, [featured, cardWidth]);

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 16, letterSpacing: "0.05em" }}>
        대표 질문
      </h2>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex", gap: 16, overflowX: "auto",
          paddingBottom: 8, WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
      >
        {tripled.map((q, i) => (
          <Link key={`${q.id}-${i}`} to={qnaDetailUrl(q)} style={{
            flex: "0 0 300px", padding: 20, background: "#fff",
            border: "1px solid var(--accent-gold)", borderRadius: 4,
            textDecoration: "none", color: "inherit",
          }}>
            <p className="font-en" style={{ fontSize: 10, color: "var(--accent-gold)", letterSpacing: "0.2em", marginBottom: 8 }}>FEATURED</p>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 10 }}>{q.title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{truncate(q.body, 100)}</p>
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
              조회 {q.viewCount?.toLocaleString() || 0}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuestionList({ questions, loading, emptyMessage }) {
  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>불러오는 중...</div>;
  }
  if (questions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
        <p style={{ fontSize: 14 }}>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 16, letterSpacing: "0.05em" }}>
        질문 목록
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--border-subtle)" }}>
        {questions.map((q) => (
          <li key={q.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <Link to={qnaDetailUrl(q)} style={{
              display: "block", padding: "20px 4px", textDecoration: "none", color: "inherit",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 8 }}>
                {q.isPrivate ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    비밀글입니다
                  </span>
                ) : q.title}
              </h3>
              {!q.isPrivate && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 10 }}>
                  {truncate(q.body, 160)}
                </p>
              )}
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
                <span>{q.displayName || "익명"}</span>
                {q.publishedAt && <span>{formatKoreanDate(q.publishedAt)}</span>}
                <span>조회 {q.viewCount?.toLocaleString() || 0}</span>
                {q.answer && <span style={{ color: "var(--accent-gold)", fontWeight: 500 }}>변호사 답변</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaBanner() {
  return (
    <section style={{ background: "var(--bg-dark)", color: "#fff", padding: "60px 24px", textAlign: "center" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 300, letterSpacing: "0.1em", marginBottom: 14 }}>
          내 사건도 상담받고 싶다면
        </h2>
        <p style={{ fontSize: 14, color: "var(--white-60)", lineHeight: 1.9, marginBottom: 28 }}>
          Q&A는 일반적 안내이며, 개별 사건은 구체적 사실관계에 따라 결론이 달라집니다.<br />
          전문 변호사와 직접 상담하세요.
        </p>
        <Link to="/consultation" className="font-en" style={{
          display: "inline-block", padding: "14px 44px", fontSize: 13,
          letterSpacing: "0.15em", color: "#fff",
          border: "1px solid var(--accent-gold)", background: "var(--accent-gold)",
          textDecoration: "none",
        }}>
          상담 예약하기
        </Link>
      </div>
    </section>
  );
}
