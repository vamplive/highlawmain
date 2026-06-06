import { useState } from "react";
import { CalendarClock, ExternalLink, Send, Sparkles, Tags, ImagePlus, Bot } from "lucide-react";
import { BLOG_CATEGORIES } from "./constants";
import { deriveBlogPublishMetadata, isValidFutureSchedule } from "./blogPublishingUtils";
import BlogCoverImagePicker from "./BlogCoverImagePicker";
import BlogAutoIllustrateDialog from "./BlogAutoIllustrateDialog";
import BlogAutoWriteDialog from "./BlogAutoWriteDialog";

const inputStyle = {
  height: 40,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "0 12px",
  fontSize: 14,
  background: "#fff",
  color: "#111827",
  fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
  minWidth: 0,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#475569",
  marginBottom: 6,
  whiteSpace: "nowrap",
};

function Field({ label, children, style }) {
  return (
    <label style={{ display: "grid", gap: 0, minWidth: 0, ...style }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export default function BlogComposerPanel({
  doc,
  setDoc,
  onPublish,
  onPreview,
  isPublishing = false,
  editorHtml = "",
  editor = null,
}) {
  const publicUrl = doc?._blogSlug ? `/blog/${doc._blogSlug}` : "";
  const update = (patch) => setDoc((d) => ({ ...d, ...patch }));
  const isScheduled = doc.status === "scheduled";
  const scheduleReady = !isScheduled || isValidFutureSchedule(doc.scheduledPublishAt);
  const [autoIllustrateOpen, setAutoIllustrateOpen] = useState(false);
  const [autoWriteOpen, setAutoWriteOpen] = useState(false);

  return (
    <section
      aria-label="블로그 작성 설정"
      style={{
        flexShrink: 0,
        borderBottom: "1px solid #dbe3ef",
        background: "#f8fafc",
        padding: "20px 22px 18px",
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>
        <Field label="블로그 제목" style={{ minWidth: 260, gridColumn: "span 2" }}>
          <input
            value={doc.title || ""}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="게시글 제목을 입력하세요"
            style={{ ...inputStyle, height: 48, fontSize: 20, fontWeight: 600 }}
          />
        </Field>
        <Field label="게시판">
          <select
            value={doc.blogCategory || "construction_realestate"}
            onChange={(e) => update({ blogCategory: e.target.value, documentType: "blog" })}
            style={inputStyle}
          >
            {BLOG_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </Field>
        <Field label="공개 상태">
          <select
            value={doc.status || "draft"}
            onChange={(e) => update({ status: e.target.value })}
            style={inputStyle}
          >
            <option value="draft">초안 저장</option>
            <option value="published">즉시 발행</option>
            <option value="scheduled">예약 발행</option>
          </select>
        </Field>
        <Field label="예약 일시">
          <input
            type="datetime-local"
            value={doc.scheduledPublishAt || ""}
            onChange={(e) => update({ scheduledPublishAt: e.target.value, status: e.target.value ? "scheduled" : doc.status })}
            disabled={!isScheduled}
            style={{ ...inputStyle, opacity: isScheduled ? 1 : 0.48 }}
          />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onPreview}
          style={{ ...inputStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: "0 18px" }}
        >
          미리보기
        </button>
        <button
          type="button"
          onClick={() => update(deriveBlogPublishMetadata(doc, editorHtml))}
          title="본문 기준으로 요약, SEO 설명, GEO 키워드, 슬러그를 채웁니다"
          style={{ ...inputStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, padding: "0 18px" }}
        >
          <Sparkles size={16} />
          SEO/GEO
        </button>
        {publicUrl && (
          <button
            type="button"
            onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
            title="공개 글 보기"
            style={{ ...inputStyle, width: 44, padding: 0, cursor: "pointer", justifyContent: "center", display: "inline-flex", alignItems: "center" }}
          >
            <ExternalLink size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || !scheduleReady}
          title={!scheduleReady ? "예약 발행에는 미래 예약 일시가 필요합니다" : undefined}
          style={{
            ...inputStyle,
            borderColor: "#2563eb",
            background: isPublishing || !scheduleReady ? "#93c5fd" : "#2563eb",
            color: "#fff",
            cursor: isPublishing || !scheduleReady ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            padding: "0 22px",
          }}
        >
          <Send size={16} />
          {isPublishing ? "처리 중" : isScheduled ? "예약" : "발행"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Field label="태그">
          <div style={{ position: "relative" }}>
            <Tags size={16} style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
            <input
              value={doc.tags || ""}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="건설, 하자, 계약"
              style={{ ...inputStyle, width: "100%", paddingLeft: 36 }}
            />
          </div>
        </Field>
        <Field label="URL 슬러그">
          <input
            value={doc.slug || ""}
            onChange={(e) => update({ slug: e.target.value })}
            placeholder="비워두면 제목으로 자동 생성"
            style={{ ...inputStyle, width: "100%" }}
          />
        </Field>
      </div>

      <Field label="대표 이미지">
        <BlogCoverImagePicker
          value={doc.thumbnailUrl || ""}
          onChange={(url) => update({
            thumbnailUrl: url,
            // OG 이미지가 비어있을 때만 동기화 — 사용자가 다른 OG를 지정한 경우는 보존
            ogImageUrl: doc.ogImageUrl ? doc.ogImageUrl : url,
          })}
          docContext={{ title: doc.title }}
          getEditorHtml={() => editorHtml || editor?.getHTML?.() || ""}
        />
      </Field>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setAutoWriteOpen(true)}
          disabled={!editor}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 12px", fontSize: 12,
            border: "1px solid #6366f1", borderRadius: 4,
            background: "#fff", color: "#6366f1", cursor: editor ? "pointer" : "not-allowed",
            opacity: editor ? 1 : 0.5,
          }}
          title={editor ? "AI 도우미를 이용해 새로운 글을 작성합니다" : "에디터 로드 후 사용 가능"}
        >
          <Bot size={13} />
          AI 글쓰기
        </button>
        <button
          type="button"
          onClick={() => setAutoIllustrateOpen(true)}
          disabled={!editor}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 12px", fontSize: 12,
            border: "1px solid #1a3a6b", borderRadius: 4,
            background: "#fff", color: "#1a3a6b", cursor: editor ? "pointer" : "not-allowed",
            opacity: editor ? 1 : 0.5,
          }}
          title={editor ? "본문을 분석해 어울리는 이미지 3개를 AI로 만들어 본문에 삽입" : "에디터 로드 후 사용 가능"}
        >
          <ImagePlus size={13} />
          AI 본문 이미지 자동 추가
        </button>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          추천 프롬프트를 수정·삭제·재생성 가능합니다.
        </span>
      </div>

      <BlogAutoIllustrateDialog
        open={autoIllustrateOpen}
        onClose={() => setAutoIllustrateOpen(false)}
        editor={editor}
        doc={doc}
      />

      <BlogAutoWriteDialog
        open={autoWriteOpen}
        onClose={() => setAutoWriteOpen(false)}
        editor={editor}
        doc={doc}
        setDoc={setDoc}
      />

      {isScheduled && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#075985" }}>
          <CalendarClock size={13} />
          예약 일시가 지나면 서버가 자동으로 공개 상태로 전환합니다.
        </div>
      )}
    </section>
  );
}
