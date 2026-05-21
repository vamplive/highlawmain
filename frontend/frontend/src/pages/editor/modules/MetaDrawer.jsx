/**
 * MetaDrawer — 문서 속성 편집 서랍 패널
 * - 에디터 우측에 슬라이드 오버레이로 표시
 * - 부제, 저자, 출처, 날짜, 유형, 상태, 중요도 편집
 */
import { BLOG_CATEGORIES, DOC_TYPES } from "./constants";
import { BlogPrePublishChecklist } from "./BlogPublishingTools";
import { deriveBlogPublishMetadata, getBlogPublishStatus } from "./blogPublishingUtils";

export function MetaDrawer({ doc, setDoc, open, onClose, editorHtml = "" }) {
  if (!open) return null;
  const isBlogDoc = doc.documentType === "blog";
  const publishStatus = isBlogDoc ? getBlogPublishStatus(doc, editorHtml) : null;

  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #d5d0ca",
    borderRadius: 3,
    fontSize: 13,
    boxSizing: "border-box",
    background: "#fff",
    color: "#333",
  };

  const sectionStyle = {
    padding: "0 0 16px",
    marginBottom: 16,
    borderBottom: "1px solid #e5e1dc",
  };

  const sectionTitleStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 12,
  };

  const field = (label, key, type) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={doc[key] || ""}
          onChange={(e) => setDoc((d) => ({ ...d, [key]: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          type={type || "text"}
          value={doc[key] || ""}
          onChange={(e) => setDoc((d) => ({ ...d, [key]: e.target.value }))}
          style={inputStyle}
        />
      )}
    </div>
  );

  const selectField = (label, value, onChange, options) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={onChange} style={inputStyle}>
        {options}
      </select>
    </div>
  );

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 340, height: "100vh",
      background: "#f8f6f3", borderLeft: "1px solid #d5d0ca", zIndex: 1000,
      overflowY: "auto", padding: "20px 16px", boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>문서 속성</span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999" }}>✕</button>
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>문서 정보</div>
        {selectField(
          "문서 유형",
          doc.documentType || "article",
          (e) => setDoc((d) => ({ ...d, documentType: e.target.value })),
          DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)
        )}
        {field("부제", "subtitle")}
        {field("저자", "author")}
        {field("출처", "source")}
        {field("요약", "summary", "textarea")}
      </div>

      {isBlogDoc && (
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>게시 준비</span>
            <span style={{
              fontSize: 10,
              color: publishStatus.ready ? "#166534" : "#9a3412",
              background: publishStatus.ready ? "#dcfce7" : "#ffedd5",
              border: `1px solid ${publishStatus.ready ? "#bbf7d0" : "#fed7aa"}`,
              padding: "2px 6px",
              borderRadius: 3,
            }}>
              필수 {publishStatus.requiredDone}/{publishStatus.requiredTotal}
            </span>
          </div>
          <BlogPrePublishChecklist status={publishStatus} />
        </div>
      )}

      {isBlogDoc && (
        <div style={sectionStyle}>
          <div style={{ ...sectionTitleStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span>블로그 SEO/GEO</span>
            <button
              type="button"
              onClick={() => setDoc((d) => ({ ...d, ...deriveBlogPublishMetadata(d, editorHtml) }))}
              style={{
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#1d4ed8",
                borderRadius: 3,
                padding: "4px 7px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              자동 채우기
            </button>
          </div>
          {field("URL 슬러그", "slug")}
          {field("태그", "tags")}
          {field("SEO 제목", "seoTitle")}
          {field("SEO 설명", "seoDescription", "textarea")}
          {field("Canonical URL", "canonicalUrl")}
          {field("대표 이미지 URL", "thumbnailUrl")}
          {field("OG 이미지 URL", "ogImageUrl")}
          {field("GEO 핵심 요약", "geoSummary", "textarea")}
          {field("GEO FAQ JSON", "geoFaq", "textarea")}
          {field("GEO 키워드", "geoKeywords")}
        </div>
      )}

      <div style={{ ...sectionStyle, borderBottom: "none", marginBottom: 0 }}>
        <div style={sectionTitleStyle}>발행 설정</div>
        {selectField(
          "상태",
          doc.status || "draft",
          (e) => setDoc((d) => ({ ...d, status: e.target.value })),
          <>
            <option value="draft">초안</option>
            <option value="published">발행</option>
            <option value="scheduled">예약</option>
            <option value="archived">보관</option>
          </>
        )}
        {field("발행일", "publishedDate", "date")}
        {isBlogDoc && field("예약 발행 일시", "scheduledPublishAt", "datetime-local")}
        {isBlogDoc && selectField(
          "블로그 카테고리",
          doc.blogCategory || "construction_realestate",
          (e) => setDoc((d) => ({ ...d, blogCategory: e.target.value })),
          BLOG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>중요도 (1~5)</label>
          <input type="number" min={1} max={5} value={doc.importance || 3}
            onChange={(e) => setDoc((d) => ({ ...d, importance: parseInt(e.target.value) || 3 }))}
            style={{ ...inputStyle, width: 60 }}
          />
        </div>
      </div>
    </div>
  );
}
