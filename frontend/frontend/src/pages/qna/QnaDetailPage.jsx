/**
 * 법률 Q&A 상세 페이지 — 질문/답변 + Schema.org QAPage JSON-LD + 상담 CTA
 * /qna/question/:slug 경로. 답변이 없으면 "답변 준비 중" 표시.
 */
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import useReveal from "../../hooks/useReveal";
import { qnaDetailUrl, qnaCategoryUrl, formatKoreanDate } from "./qnaUtils";

export default function QnaDetailPage() {
  const ref = useReveal();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 비밀글 비밀번호 게이트
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      api.get(`/qna/questions/${encodeURIComponent(slug)}`)
        .then((res) => {
          if (cancelled) return;
          setQuestion(res.data);
          // 같은 카테고리 관련 질문 3건 (본 질문 제외)
          const catSlug = res.data?.category?.slug;
          if (catSlug) {
            api.get(`/qna/questions?limit=4&categorySlug=${encodeURIComponent(catSlug)}`)
              .then((r) => {
                if (cancelled) return;
                setRelated((r.data || []).filter((q) => q.slug !== slug).slice(0, 3));
              })
              .catch(() => {});
          }
        })
        .catch((e) => { if (!cancelled) setError(e.message || "질문을 불러오지 못했습니다"); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [slug]);

  // 문서 제목 + Schema.org JSON-LD 주입
  useEffect(() => {
    if (!question) return;
    document.title = `${question.title} | 법무법인 하이로 Q&A`;

    const qaSchema = {
      "@context": "https://schema.org",
      "@type": "QAPage",
      mainEntity: {
        "@type": "Question",
        name: question.title,
        text: question.body,
        dateCreated: question.publishedAt || question.createdAt,
        author: { "@type": "Person", name: question.displayName || "익명" },
        ...(question.answer ? {
          acceptedAnswer: {
            "@type": "Answer",
            text: question.answer,
            dateCreated: question.answeredAt,
            author: { "@type": "Organization", name: "법무법인 하이로" },
          },
        } : {}),
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: window.location.origin + "/" },
        { "@type": "ListItem", position: 2, name: "Q&A", item: window.location.origin + "/qna" },
        ...(question.breadcrumb || []).map((b, i) => ({
          "@type": "ListItem",
          position: 3 + i,
          name: b.name,
          item: window.location.origin + qnaCategoryUrl(b.slug),
        })),
        {
          "@type": "ListItem",
          position: 3 + (question.breadcrumb?.length || 0),
          name: question.title,
          item: window.location.origin + qnaDetailUrl(question),
        },
      ],
    };

    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.text = JSON.stringify(qaSchema);
    script1.dataset.qnaJsonld = "qa";
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.text = JSON.stringify(breadcrumbSchema);
    script2.dataset.qnaJsonld = "breadcrumb";
    document.head.appendChild(script2);

    return () => {
      document.head.querySelectorAll('script[data-qna-jsonld]').forEach((s) => s.remove());
    };
  }, [question]);

  // 비밀글인데 내용이 마스킹된 상태인지 판정
  const isLocked = question?.isPrivate && question?.title === "비밀글입니다";

  async function handleVerifyPassword(e) {
    e.preventDefault();
    if (!pwInput.trim()) { setPwError("비밀번호를 입력해 주세요"); return; }
    setVerifying(true);
    setPwError(null);
    try {
      const res = await api.post(`/qna/questions/${encodeURIComponent(slug)}/verify`, { password: pwInput });
      setQuestion(res.data);
      setPwInput("");
    } catch (err) {
      setPwError(err.message || "비밀번호가 일치하지 않습니다");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return <LoadingView />;
  }
  if (error || !question) {
    return <ErrorView error={error} onBack={() => navigate("/qna")} />;
  }

  // 비밀글 잠김 상태 — 비밀번호 입력 게이트
  if (isLocked) {
    return (
      <div ref={ref}>
        <section style={{ background: "#f7f8fa", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="container" style={{ maxWidth: 880, padding: "16px 24px" }}>
            <Breadcrumb breadcrumb={question.breadcrumb || []} />
          </div>
        </section>
        <section style={{ padding: "80px 24px", textAlign: "center", minHeight: "50vh" }}>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h1 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 12 }}>비밀글입니다</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 28 }}>
              이 질문은 비밀글로 등록되었습니다.<br />비밀번호를 입력하면 내용을 확인할 수 있습니다.
            </p>
            <form onSubmit={handleVerifyPassword} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <input
                type="password"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                placeholder="비밀번호"
                maxLength={20}
                style={{
                  padding: "10px 14px", fontSize: 14, border: "1px solid var(--border-color)",
                  borderRadius: 3, width: 200, fontFamily: "inherit",
                }}
              />
              <button type="submit" disabled={verifying} style={{
                padding: "10px 20px", fontSize: 13, border: "none",
                background: "var(--accent-gold)", color: "#fff", borderRadius: 3,
                cursor: verifying ? "not-allowed" : "pointer", fontWeight: 500,
              }}>
                {verifying ? "확인 중..." : "확인"}
              </button>
            </form>
            {pwError && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#c0392b" }}>{pwError}</p>
            )}
            <div style={{ marginTop: 32 }}>
              <Link to="/qna" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "underline" }}>
                Q&A 목록으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div ref={ref}>
      {/* 브레드크럼 */}
      <section style={{ background: "#f7f8fa", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: 880, padding: "16px 24px" }}>
          <Breadcrumb breadcrumb={question.breadcrumb || []} />
        </div>
      </section>

      {/* 질문 본문 */}
      <article className="section" style={{ background: "#fff", paddingTop: 48, paddingBottom: 24 }}>
        <div className="container" style={{ maxWidth: 880 }}>
          {question.isFeatured ? (
            <p className="font-en reveal" style={{ fontSize: 10, color: "var(--accent-gold)", letterSpacing: "0.25em", marginBottom: 10 }}>
              FEATURED
            </p>
          ) : null}
          <h1 className="font-serif reveal" style={{
            fontSize: "clamp(22px, 3.2vw, 30px)",
            fontWeight: 500, lineHeight: 1.5, letterSpacing: "0.01em",
            color: "var(--text-primary)", marginBottom: 20,
          }}>
            Q. {question.title}
          </h1>
          <div className="reveal" style={{
            display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12,
            color: "var(--text-muted)", marginBottom: 32, paddingBottom: 20,
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            <span>{question.displayName || "익명"}</span>
            {question.publishedAt && <span>{formatKoreanDate(question.publishedAt)}</span>}
            <span>조회 {question.viewCount || 0}</span>
            {question.category && (
              <Link to={qnaCategoryUrl(question.category.slug)} style={{ color: "var(--accent-gold)", textDecoration: "none" }}>
                {question.category.name}
              </Link>
            )}
          </div>
          <div className="reveal" style={{
            fontSize: 15, lineHeight: 2, color: "var(--text-primary)",
            whiteSpace: "pre-wrap", wordBreak: "keep-all",
          }}>
            {question.body}
          </div>
        </div>
      </article>

      {/* 변호사 답변 */}
      <section style={{ background: "#f7f8fa", paddingTop: 48, paddingBottom: 48 }}>
        <div className="container" style={{ maxWidth: 880, padding: "0 24px" }}>
          <div style={{
            background: "#fff",
            border: "1px solid var(--border-color)",
            borderLeft: "3px solid var(--accent-gold)",
            padding: "32px 36px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span className="font-en" style={{
                fontSize: 10, letterSpacing: "0.25em", color: "var(--accent-gold)",
              }}>
                LAWYER ANSWER
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            </div>
            {question.answer ? (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                  A. 변호사 답변
                </h2>
                <div style={{
                  fontSize: 15, lineHeight: 2, color: "var(--text-primary)",
                  whiteSpace: "pre-wrap", wordBreak: "keep-all",
                }}>
                  {question.answer}
                </div>
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)" }}>
                  {question.answeredBy && <span>{question.answeredBy} · </span>}
                  {question.answeredAt && <span>{formatKoreanDate(question.answeredAt)}</span>}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.9 }}>
                현재 변호사 검토 중입니다. 답변이 등록되면 이 페이지에 공개됩니다.
              </p>
            )}
          </div>

          {/* 주의 문구 */}
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8, marginTop: 16, textAlign: "center" }}>
            ※ 본 답변은 일반적 법률 안내이며, 구체적 사실관계에 따라 결론이 달라질 수 있습니다. 개별 사건은 상담을 권장합니다.
          </p>
        </div>
      </section>

      {/* 상담 CTA */}
      <section style={{ background: "var(--bg-dark)", color: "#fff", padding: "56px 24px", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 300, letterSpacing: "0.1em", marginBottom: 12 }}>
            비슷한 상황이신가요?
          </h2>
          <p style={{ fontSize: 14, color: "var(--white-60)", lineHeight: 1.9, marginBottom: 28 }}>
            건설·부동산 전문 변호사가 사건 기록을 확인하고 구체적 해법을 제시합니다.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link to="/consultation" className="font-en" style={{
              display: "inline-block", padding: "14px 36px", fontSize: 13,
              letterSpacing: "0.15em", color: "#fff",
              border: "1px solid var(--accent-gold)", background: "var(--accent-gold)",
              textDecoration: "none",
            }}>
              상담 예약하기
            </Link>
            <Link to="/qna/ask" className="font-en" style={{
              display: "inline-block", padding: "14px 36px", fontSize: 13,
              letterSpacing: "0.15em", color: "#fff",
              border: "1px solid var(--white-40)", textDecoration: "none",
            }}>
              질문 남기기
            </Link>
          </div>
        </div>
      </section>

      {/* 관련 질문 */}
      {related.length > 0 && (
        <section className="section" style={{ background: "#fff", paddingTop: 48, paddingBottom: 64 }}>
          <div className="container" style={{ maxWidth: 880 }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, letterSpacing: "0.05em", marginBottom: 20 }}>
              같은 카테고리의 다른 질문
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--border-subtle)" }}>
              {related.map((q) => (
                <li key={q.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <Link to={qnaDetailUrl(q)} style={{
                    display: "block", padding: "16px 4px",
                    textDecoration: "none", color: "var(--text-primary)",
                    fontSize: 14, lineHeight: 1.6,
                  }}>
                    {q.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function Breadcrumb({ breadcrumb }) {
  return (
    <nav aria-label="경로" style={{ fontSize: 12, color: "var(--text-muted)" }}>
      <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>홈</Link>
      <span style={{ margin: "0 8px" }}>›</span>
      <Link to="/qna" style={{ color: "inherit", textDecoration: "none" }}>Q&A</Link>
      {breadcrumb.map((b) => (
        <span key={b.id}>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link to={qnaCategoryUrl(b.slug)} style={{ color: "inherit", textDecoration: "none" }}>{b.name}</Link>
        </span>
      ))}
    </nav>
  );
}

function LoadingView() {
  return (
    <div style={{ textAlign: "center", padding: "120px 24px", color: "var(--text-muted)" }}>
      불러오는 중...
    </div>
  );
}

function ErrorView({ error, onBack }) {
  return (
    <div style={{ textAlign: "center", padding: "120px 24px" }}>
      <p style={{ fontSize: 16, color: "var(--text-primary)", marginBottom: 20 }}>
        {error || "질문을 찾을 수 없습니다"}
      </p>
      <button onClick={onBack} className="font-en" style={{
        padding: "12px 28px", fontSize: 12, letterSpacing: "0.15em",
        border: "1px solid var(--accent-gold)", background: "transparent",
        color: "var(--accent-gold)", cursor: "pointer",
      }}>
        Q&A 목록으로
      </button>
    </div>
  );
}
