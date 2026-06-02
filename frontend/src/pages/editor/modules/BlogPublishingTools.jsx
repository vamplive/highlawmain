import { useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Monitor, Smartphone, Check, Eye, Send, X } from "lucide-react";
import { safeHttpUrl } from "../../../utils/safeUrl";
import { parseTags, toBlogContentHtml } from "../../blog/blogContent";
import { BLOG_CATEGORY_LABELS } from "./blogPublishingUtils";

export function BlogReadyBadge({ status, darkMode = false }) {
  const ready = status.ready;
  return (
    <span
      title={ready ? "필수 게시 준비 항목 완료" : "필수 게시 준비 항목 미완료"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 7px",
        border: `1px solid ${ready ? "#bbf7d0" : "#fed7aa"}`,
        borderRadius: 3,
        background: ready
          ? (darkMode ? "rgba(22,101,52,0.22)" : "#dcfce7")
          : (darkMode ? "rgba(194,65,12,0.2)" : "#ffedd5"),
        color: ready ? (darkMode ? "#bbf7d0" : "#166534") : (darkMode ? "#fed7aa" : "#9a3412"),
        fontSize: 10,
        lineHeight: "14px",
        whiteSpace: "nowrap",
      }}
    >
      {ready ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      게시 준비 {status.requiredDone}/{status.requiredTotal}
    </span>
  );
}

export function BlogPrePublishChecklist({ status, compact = false }) {
  return (
    <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
      {status.checks.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            fontSize: compact ? 11 : 12,
            color: "#374151",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            {item.done ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <AlertCircle size={14} color={item.required ? "#dc2626" : "#d97706"} />
            )}
            {item.label}
          </span>
          <span style={{ color: item.required ? "#6b7280" : "#9ca3af", fontSize: 10 }}>
            {item.required ? "필수" : "권장"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BlogPreviewButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="실제 블로그 발행 화면 미리보기"
      style={{
        height: 28,
        padding: "0 10px",
        border: "1px solid #cbd5e1",
        borderRadius: 3,
        background: "#fff",
        color: "#1f2937",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
      }}
    >
      <Eye size={13} />
      발행 미리보기
    </button>
  );
}

export function BlogPreviewModal({ doc, html, status, onClose, onPublish, publishing = false }) {
  const [viewport, setViewport] = useState("desktop");
  const thumbnailUrl = safeHttpUrl(doc.thumbnailUrl || doc.ogImageUrl || "");
  const thumbnailCssUrl = thumbnailUrl.replace(/["\\\n\r\f]/g, "");
  const safeHtml = toBlogContentHtml(html || "<p></p>");
  const categoryLabel = BLOG_CATEGORY_LABELS[doc.blogCategory || doc.category] || doc.blogCategory || doc.category || "블로그";
  const excerpt = doc.summary || doc.excerpt || "";
  const author = doc.author || "법무법인 하이로";
  const previewDate = (doc.publishedDate || new Date().toISOString()).slice(0, 10).replace(/-/g, ".");
  const tags = parseTags(doc.tags);
  const publicUrl = doc._blogSlug ? `/blog/${doc._blogSlug}` : "";
  const readyToPublish = status.ready && !publishing;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="블로그 미리보기"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(10,22,40,0.48)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: 28,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(1080px, 100%)",
          background: "#fff",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px 0 18px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}>
          <strong style={{ fontSize: 13, color: "#1f2937", fontWeight: 600 }}>블로그 미리보기</strong>
          <BlogReadyBadge status={status} />
          <span style={{ fontSize: 11, color: "#64748b" }}>실제 공개 페이지에 가까운 발행 전 미리보기입니다.</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "inline-flex", border: "1px solid #cbd5e1", borderRadius: 3, overflow: "hidden" }}>
            {[
              ["desktop", <Monitor size={13} />, "데스크톱"],
              ["mobile", <Smartphone size={13} />, "모바일"],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                title={`${label} 미리보기`}
                style={{
                  height: 28,
                  padding: "0 9px",
                  border: "none",
                  borderRight: key === "desktop" ? "1px solid #cbd5e1" : "none",
                  background: viewport === key ? "#e0f2fe" : "#fff",
                  color: viewport === key ? "#075985" : "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          {publicUrl && (
            <button
              type="button"
              onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
              title="공개 글 새 탭에서 보기"
              style={{
                height: 28,
                padding: "0 10px",
                border: "1px solid #cbd5e1",
                borderRadius: 3,
                background: "#fff",
                color: "#334155",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
              }}
            >
              <ExternalLink size={13} />
              공개 글
            </button>
          )}
          <button
            type="button"
            onClick={onPublish}
            disabled={!readyToPublish}
            title={status.ready ? "이 내용으로 블로그 게시글 발행" : "필수 항목을 먼저 입력해 주세요"}
            style={{
              height: 28,
              padding: "0 10px",
              border: "1px solid #60a5fa",
              borderRadius: 3,
              background: readyToPublish ? "#2563eb" : "#dbeafe",
              color: readyToPublish ? "#fff" : "#64748b",
              cursor: readyToPublish ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
            }}
          >
            {publishing ? <Check size={13} /> : <Send size={13} />}
            {publishing ? "처리 중" : "발행"}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="닫기"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ overflow: "auto", background: viewport === "mobile" ? "#e5e7eb" : "#fff", display: "flex", justifyContent: "center" }}>
          <div style={{
            width: viewport === "mobile" ? 390 : "100%",
            maxWidth: "100%",
            background: "#fff",
            minHeight: "100%",
          }}>
          <section style={{
            minHeight: viewport === "mobile" ? 280 : 320,
            padding: viewport === "mobile" ? "56px 20px 46px" : "82px 24px 68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: thumbnailUrl
              ? `linear-gradient(rgba(10,22,40,0.78), rgba(10,22,40,0.92)), url("${thumbnailCssUrl}") center/cover`
              : "linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)",
          }}>
            <div style={{ maxWidth: 800, textAlign: "center" }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  display: "inline-block",
                  padding: "5px 18px",
                  fontSize: 11,
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  letterSpacing: "0.12em",
                  fontWeight: 500,
                }}>
                  {categoryLabel}
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif",
                fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)",
                fontWeight: 500,
                color: "#fff",
                lineHeight: 1.5,
                margin: "0 0 28px",
                wordBreak: "keep-all",
              }}>
                {doc.title || "제목 없음"}
              </h1>
              {excerpt && (
                <p style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.9,
                  fontWeight: 300,
                  maxWidth: 640,
                  margin: "0 auto 30px",
                  wordBreak: "keep-all",
                }}>
                  {excerpt}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                <span>{author}</span>
                <span>{previewDate}</span>
                <span>조회 0</span>
              </div>
              {tags.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                  {tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 12, color: "rgba(255,255,255,0.64)", border: "1px solid rgba(255,255,255,0.22)", padding: "4px 9px", borderRadius: 999 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section style={{ padding: viewport === "mobile" ? "24px 18px 56px" : "32px 24px 80px" }}>
            <article
              className="editor-blog-preview-prose"
              style={{
                maxWidth: 720,
                margin: "0 auto",
                fontSize: 17,
                lineHeight: 1.9,
                color: "#2a2a2a",
                wordBreak: "keep-all",
              }}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          </section>
          </div>
        </div>

        <style>{`
          .editor-blog-preview-prose p { margin: 0 0 1.25em; }
          .editor-blog-preview-prose h1,
          .editor-blog-preview-prose h2,
          .editor-blog-preview-prose h3 {
            font-family: 'Noto Serif KR', 'Nanum Myeongjo', serif;
            color: #111827;
            line-height: 1.45;
            font-weight: 600;
            margin: 2.1em 0 0.8em;
          }
          .editor-blog-preview-prose h1 { font-size: 1.75em; }
          .editor-blog-preview-prose h2 { font-size: 1.45em; }
          .editor-blog-preview-prose h3 { font-size: 1.18em; }
          .editor-blog-preview-prose ul,
          .editor-blog-preview-prose ol { margin: 0 0 1.4em 1.4em; padding: 0; }
          .editor-blog-preview-prose li { margin: 0.35em 0; }
          .editor-blog-preview-prose blockquote {
            margin: 1.8em 0;
            padding: 0.9em 1.2em;
            border-left: 3px solid #b08d57;
            background: #faf9f7;
            color: #4b5563;
          }
          .editor-blog-preview-prose img { max-width: 100%; height: auto; display: block; margin: 1.8em auto; }
          .editor-blog-preview-prose table { width: 100%; border-collapse: collapse; margin: 1.8em 0; font-size: 0.92em; }
          .editor-blog-preview-prose th,
          .editor-blog-preview-prose td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
          .editor-blog-preview-prose th { background: #f8fafc; font-weight: 600; }
          .editor-blog-preview-prose a { color: #9a6b27; text-decoration: underline; text-underline-offset: 3px; }
        `}</style>
      </div>
    </div>
  );
}
