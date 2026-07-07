/**
 * 블로그 상세 페이지 — 의뢰인이 글을 편안히 읽도록 설계된 본문 페이지
 * - 본문 콘텐츠는 HTML(에디터 산출물) 또는 마크다운(과거 글) 양쪽 모두 지원
 * - 가독성 개선: 큰 타이포 + 좁은 컬럼(720px) + 충분한 줄간격 + 적당한 단락 여백
 * - 부가 기능: 상단 읽기 진행률 바 / 자동 목차(ToC) / 글자크기 토글 / 공유 / 인쇄
 */
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Type, Printer, Share2, ArrowLeft, Calendar, Eye, User } from "lucide-react";
import { api } from "../../utils/api";
import { safeHttpUrl } from "../../utils/safeUrl";
import Seo from "../../components/Seo";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "../../lib/seo";
import { CATEGORY_LABELS, extractToc, htmlToPlainText, toBlogContentHtml, parseTags } from "./blogContent";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

function parseGeoFaq(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item?.question && item?.answer)
      .map((item) => ({ question: String(item.question), answer: String(item.answer) }))
      .slice(0, 8);
  } catch {
    return [];
  }
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const ref = useRef();
  const articleRef = useRef();
  const footnoteOverlayRef = useRef(null);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  // 글자 크기 단계 (0=기본 17px, +/-2px 단위)
  const [fontStep, setFontStep] = useState(0);
  const [shareToast, setShareToast] = useState("");
  const [footnoteOverlay, setFootnoteOverlay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/blog/${slug}`);
        if (!cancelled) setPost(res.data);
      } catch (e) {
        if (!cancelled) setError(e.message || "게시글을 불러올 수 없습니다");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPost();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!post?.slug) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        const res = await api.post(`/blog/${post.slug}/view`, {});
        const nextViewCount = res.data?.viewCount;
        if (!cancelled && typeof nextViewCount === "number") {
          setPost((current) => current ? { ...current, viewCount: nextViewCount } : current);
        }
      } catch {
        // 조회수 집계 실패는 독서 흐름을 막지 않는다.
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [post?.slug]);

  // reveal 애니메이션 재관찰
  useLayoutEffect(() => {
    if (!ref.current || !post) return;
    const targets = ref.current.querySelectorAll(".reveal:not(.visible)");
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
      { threshold: 0.05 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [post]);

  // 읽기 진행률 — 본문 영역 기준
  useEffect(() => {
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const ratio = total > 0 ? Math.min(scrolled / total, 1) : 0;
      setProgress(ratio);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [post]);

  // 본문 HTML — content가 HTML이면 그대로, 마크다운이면 marked 변환
  const { contentHtml, toc } = useMemo(() => {
    if (!post) return { contentHtml: "", toc: [] };
    const safe = toBlogContentHtml(post.content || "");
    return { contentHtml: safe, toc: extractToc(safe) };
  }, [post]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const handleClick = (event) => {
      const refLink = event.target.closest?.(".blog-footnote-ref");
      if (!refLink || !article.contains(refLink)) return;
      const href = refLink.getAttribute("href") || "";
      if (!href.startsWith("#fn-content-")) return;
      const item = article.querySelector(href);
      if (!item) return;
      event.preventDefault();
      const clone = item.cloneNode(true);
      clone.querySelectorAll(".blog-footnote-backref").forEach((node) => node.remove());
      const rect = refLink.getBoundingClientRect();
      setFootnoteOverlay({
        number: refLink.textContent || "",
        text: (clone.textContent || "").trim(),
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 320),
        top: Math.min(rect.bottom + 8, window.innerHeight - 140),
      });
    };

    article.addEventListener("click", handleClick);
    return () => article.removeEventListener("click", handleClick);
  }, [contentHtml]);

  useEffect(() => {
    if (!footnoteOverlay) return undefined;
    footnoteOverlayRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setFootnoteOverlay(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [footnoteOverlay]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post?.title, url }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setShareToast("링크가 복사되었습니다");
      setTimeout(() => setShareToast(""), 1800);
    });
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        불러오는 중...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 16, color: "#999" }}>{error || "게시글을 찾을 수 없습니다"}</p>
        <Link to="/blog" style={{ color: "var(--accent-gold)", fontSize: 14 }}>목록으로 돌아가기</Link>
      </div>
    );
  }

  const plainText = htmlToPlainText(post.content || "").replace(/[#*`_>-]/g, " ").replace(/\s+/g, " ").trim();
  const metaDescription = post.seoDescription || post.summary || post.excerpt || plainText.slice(0, 160);
  const seoTitle = post.seoTitle || post.title;
  const seoImage = safeHttpUrl(post.ogImageUrl || post.thumbnailUrl);
  const heroImage = safeHttpUrl(post.thumbnailUrl);
  const heroCssImage = heroImage.replace(/["\\\n\r\f]/g, "");
  const tags = parseTags(post.tags);
  const geoKeywords = parseTags(post.geoKeywords);
  const geoFaq = parseGeoFaq(post.geoFaq);

  // 본문 폰트 크기 — 단계별 (15 / 17 / 19 / 21)
  const baseFontSize = 17 + fontStep * 2;

  return (
    <div ref={ref}>
      <Seo
        path={`/blog/${slug}`}
        canonicalUrl={post.canonicalUrl}
        title={seoTitle}
        description={metaDescription}
        image={seoImage}
        type="article"
        jsonLd={[
          buildArticleJsonLd({
            title: seoTitle,
            description: post.geoSummary || metaDescription,
            slug,
            image: seoImage,
            author: post.author || "법무법인 하이로",
            datePublished: post.publishedAt || post.createdAt,
            dateModified: post.updatedAt || post.publishedAt || post.createdAt,
          }),
          geoFaq.length > 0 ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: geoFaq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          } : null,
          geoKeywords.length > 0 ? {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: `${post.title} 핵심 키워드`,
            hasDefinedTerm: geoKeywords.map((keyword) => ({ "@type": "DefinedTerm", name: keyword })),
          } : null,
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "블로그", path: "/blog" },
            { name: post.title, path: `/blog/${slug}` },
          ]),
        ]}
      />

      {/* 읽기 진행률 바 */}
      <div className="blog-progress" aria-hidden="true" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 3,
        background: "transparent", zIndex: 50, pointerEvents: "none",
      }}>
        <div style={{
          height: "100%", width: `${progress * 100}%`,
          background: "var(--accent-gold)", transition: "width 0.1s linear",
        }} />
      </div>

      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: 360,
          padding: "100px 24px 80px",
          background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)",
        }}
      >
        <div className="relative text-center" style={{ maxWidth: 800, width: "100%", zIndex: 2 }}>
          <Link
            to="/blog"
            className="reveal inline-flex items-center gap-2"
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.65)", textDecoration: "none",
              marginBottom: 28, letterSpacing: "0.05em",
            }}
          >
            <ArrowLeft size={14} /> 블로그 목록
          </Link>
          <p className="reveal" style={{
            fontSize: 11, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)",
            fontWeight: 500, marginBottom: 16, textTransform: "uppercase",
          }}>
            BLOG
          </p>
          <h1
            className="font-serif-kr reveal"
            style={{
              fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)", fontWeight: 500,
              color: "#fff", lineHeight: 1.5, marginBottom: 20,
              wordBreak: "keep-all",
            }}
          >
            블로그
          </h1>
          <p className="reveal" style={{
            fontSize: 14, color: "rgba(255,255,255,0.65)", letterSpacing: "0.04em",
            fontWeight: 300,
          }}>
            {CATEGORY_LABELS[post.category] || "블로그"}
          </p>
        </div>
      </section>

      {/* ==================== 본문 영역 — 좌측 ToC + 본문 + 도구 모음 ==================== */}
      <section style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 0 0" }}>
          {/* 브레드크럼 */}
          <nav style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>홈</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <Link to="/blog" style={{ color: "inherit", textDecoration: "none" }}>블로그</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "var(--text-primary)" }}>{post.title}</span>
          </nav>
        </div>

        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 48,
          padding: "32px 0 80px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", justifyItems: "center" }}>
            <div style={{ width: "100%", maxWidth: 720, position: "relative" }}>

              {/* 포스트 제목 + 메타 정보 */}
              <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    display: "inline-block", padding: "4px 14px", fontSize: 11,
                    background: "#eff6ff", color: "#1d4ed8",
                    border: "1px solid #bfdbfe", borderRadius: 2,
                    letterSpacing: "0.08em", fontWeight: 500,
                  }}>
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                </div>
                <h2 style={{
                  fontSize: "clamp(1.35rem, 3vw, 2rem)", fontWeight: 600,
                  color: "#1a1a1a", lineHeight: 1.5, marginBottom: 16,
                  wordBreak: "keep-all",
                }}>
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, marginBottom: 16, wordBreak: "keep-all" }}>
                    {post.excerpt}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 20px", fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><User size={13} />{post.author || "법무법인 하이로"}</span>
                  <span style={{ width: 1, height: 12, background: "#e2e8f0" }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={13} />{formatDate(post.publishedAt || post.createdAt)}</span>
                  <span style={{ width: 1, height: 12, background: "#e2e8f0" }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Eye size={13} />조회 {post.viewCount || 0}</span>
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                    {tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 12, color: "#64748b", border: "1px solid #e2e8f0", padding: "3px 9px", borderRadius: 999 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 도구 모음 (글자크기/공유/인쇄) */}
              <div className="blog-tools" style={{
                display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 8,
                marginBottom: 16, paddingBottom: 16,
                borderBottom: "1px solid var(--border-subtle)",
              }}>
                <ToolButton title="글자 작게" onClick={() => setFontStep((s) => Math.max(s - 1, -1))}>
                  <Type size={14} /><span style={{ fontSize: 11 }}>작게</span>
                </ToolButton>
                <ToolButton title="글자 크게" onClick={() => setFontStep((s) => Math.min(s + 1, 2))}>
                  <Type size={16} /><span style={{ fontSize: 11 }}>크게</span>
                </ToolButton>
                <ToolButton title="공유" onClick={handleShare}>
                  <Share2 size={14} /><span style={{ fontSize: 11 }}>공유</span>
                </ToolButton>
                <ToolButton title="인쇄" onClick={handlePrint}>
                  <Printer size={14} /><span style={{ fontSize: 11 }}>인쇄</span>
                </ToolButton>
              </div>

              {/* 모바일/좁은 화면용 ToC (h2가 2개 이상일 때만) */}
              {toc.filter((t) => t.level === 2).length >= 2 && (
                <details className="blog-toc-mobile" style={{
                  marginBottom: 28, padding: "14px 18px",
                  background: "#faf9f7", border: "1px solid var(--border-subtle)",
                  borderRadius: 4,
                }}>
                  <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    이 글의 목차
                  </summary>
                  <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
                    {toc.map((h) => (
                      <li key={h.slug} style={{ marginBottom: 6, paddingLeft: h.level === 3 ? 16 : 0 }}>
                        <a href={`#${h.slug}`} style={{
                          fontSize: 13, color: "var(--gray-600)", textDecoration: "none",
                          lineHeight: 1.6,
                        }}>{h.text}</a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* 본문 */}
              <article
                ref={articleRef}
                className="blog-prose"
                style={{
                  fontSize: baseFontSize,
                  lineHeight: 1.9,
                  color: "#2a2a2a",
                  wordBreak: "keep-all",
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
              {footnoteOverlay && (
                <div
                  ref={footnoteOverlayRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="각주"
                  tabIndex={-1}
                  className="blog-footnote-overlay"
                  style={{ left: footnoteOverlay.left, top: footnoteOverlay.top }}
                >
                  <button type="button" aria-label="각주 닫기" onClick={() => setFootnoteOverlay(null)}>×</button>
                  <strong>{footnoteOverlay.number}</strong>
                  <p>{footnoteOverlay.text}</p>
                </div>
              )}

              {/* 글 끝 메타 + 목록으로 */}
              <div className="reveal" style={{
                marginTop: 56, paddingTop: 28,
                borderTop: "1px solid var(--border-subtle)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16,
              }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ marginRight: 12 }}>{post.author || "법무법인 하이로"}</span>
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                <Link
                  to="/blog"
                  className="font-en transition-colors hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    color: "var(--gray-600)",
                    padding: "10px 28px", fontSize: 12,
                    letterSpacing: "0.15em", textDecoration: "none",
                  }}
                >
                  ← 목록으로
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 상담 안내 CTA ===== */}
      <section style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "72px 24px" }}>
          <div className="reveal">
            <div className="sep mx-auto" style={{ marginBottom: 28 }} />
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 300, color: "#fff", marginBottom: 12 }}>
              본 글의 사안을 직접 상담받고 싶다면
            </h2>
            <p style={{ fontSize: 14, color: "var(--white-40)", marginBottom: 32, lineHeight: 1.8, fontWeight: 300 }}>
              개별 사건은 사실관계에 따라 결론이 달라집니다.<br />
              전문 변호사와 직접 상담하여 정확한 법률 전략을 받아보세요.
            </p>
            <Link
              to="/consultation"
              style={{
                display: "inline-block", padding: "14px 44px", fontSize: 13,
                letterSpacing: "0.15em", color: "#fff",
                border: "1px solid var(--accent-gold)",
                background: "var(--accent-gold)",
                textDecoration: "none", transition: "all 0.3s",
              }}
            >
              상담 신청하기
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .blog-prose .footnote-ref {
          font-size: 0.72em;
          vertical-align: super;
          line-height: 0;
        }
        .blog-prose .blog-footnote-ref {
          color: var(--accent-gold);
          text-decoration: none;
          cursor: pointer;
          padding: 0 1px;
        }
        .blog-prose .blog-footnotes {
          margin-top: 56px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.88em;
          line-height: 1.75;
          color: #4b5563;
        }
        .blog-prose .blog-footnotes h2 {
          font-size: 1.05em;
          margin: 0 0 12px;
          font-family: 'Noto Serif KR', 'Nanum Myeongjo', serif;
          color: #111827;
        }
        .blog-prose .blog-footnotes ol {
          margin: 0;
          padding-left: 1.2em;
        }
        .blog-prose .blog-footnote-item {
          margin: 0.45em 0;
        }
        .blog-prose .blog-footnote-backref {
          color: var(--accent-gold);
          text-decoration: none;
          margin-left: 4px;
        }
        .blog-footnote-overlay {
          position: fixed;
          z-index: 55;
          width: min(320px, calc(100vw - 32px));
          background: #fff;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 16px 44px rgba(10, 22, 40, 0.22);
          padding: 14px 38px 14px 16px;
          border-radius: 4px;
          color: #2a2a2a;
          font-size: 14px;
          line-height: 1.7;
        }
        .blog-footnote-overlay button {
          position: absolute;
          top: 6px;
          right: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #64748b;
          font-size: 18px;
        }
        .blog-footnote-overlay strong {
          display: inline-block;
          color: var(--accent-gold);
          margin-bottom: 4px;
        }
        .blog-footnote-overlay p {
          margin: 0;
        }
      `}</style>

      {/* 공유 토스트 */}
      {shareToast && (
        <div role="status" style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "#0a1628", color: "#fff", padding: "10px 22px",
          fontSize: 13, borderRadius: 4, zIndex: 60,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}>
          {shareToast}
        </div>
      )}
      {footnoteOverlay && (
        <div
          aria-hidden="true"
          onClick={() => setFootnoteOverlay(null)}
          style={{ position: "fixed", inset: 0, zIndex: 54, background: "transparent" }}
        />
      )}
    </div>
  );
}

/** 본문 상단 도구 버튼 */
function ToolButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "6px 12px", fontSize: 12,
        background: "transparent", border: "1px solid var(--border-subtle)",
        borderRadius: 4, cursor: "pointer", color: "var(--gray-600)",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-gold)"; e.currentTarget.style.color = "var(--accent-gold)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--gray-600)"; }}
    >
      {children}
    </button>
  );
}
