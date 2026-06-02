/**
 * MobileMetaSheet — 블로그 모드에서 메타데이터를 빠르게 편집하는 바텀 시트
 *
 * 데스크톱 BlogComposerPanel/MetaDrawer는 모바일에서 너무 많은 필드를 한 번에 보여줘
 * 좁은 화면에서 다루기 어렵다. 이 시트는 발행 직전 핵심 항목만 노출:
 * - 카테고리 (chip group)
 * - 슬러그
 * - 한 줄 요약 (excerpt)
 * - 태그
 * - 썸네일 URL/업로드
 * - 발행 액션
 */
import { memo, useState } from "react";
import { X, Send, Eye, Image as ImageIcon } from "lucide-react";
import { BLOG_CATEGORIES } from "../constants";
import { api } from "../../../../utils/api";
import { showEditorAlert } from "../editorToast";

export const MobileMetaSheet = memo(function MobileMetaSheet({
  open, onClose, doc, setDoc,
  onPublish, isPublishing, onPreview,
}) {
  const [uploading, setUploading] = useState(false);

  if (!open || !doc) return null;
  const isBlog = doc.documentType === "blog";

  const update = (patch) => setDoc((d) => ({ ...d, ...patch }));
  const setTags = (raw) => {
    const tags = raw.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
    update({ tags });
  };

  const handleThumbnailFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const json = await api.upload("/media/upload", file);
      const url = json?.data?.url;
      if (!url) throw new Error("업로드 URL 누락");
      update({ thumbnailUrl: url });
    } catch (err) {
      showEditorAlert(`썸네일 업로드 실패: ${err?.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={onClose} />
      <div className="editor-msheet editor-mmeta editor-mobile-only" role="dialog" aria-label="블로그 메타">
        <div className="editor-msheet-handle" />
        <div className="editor-msheet-header">
          <div className="editor-msheet-title">{isBlog ? "블로그 메타" : "문서 속성"}</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ width: 36, height: 36, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>
        <div className="editor-msheet-body">
          {isBlog && (
            <>
              <section className="mmeta-section">
                <label>카테고리</label>
                <div className="mmeta-chips">
                  {BLOG_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`mmeta-chip${(doc.blogCategory || doc.category) === c.value ? " active" : ""}`}
                      onClick={() => update({ blogCategory: c.value, category: c.value })}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mmeta-section">
                <label htmlFor="mmeta-slug">슬러그 (URL)</label>
                <input
                  id="mmeta-slug"
                  type="text"
                  className="mmeta-input"
                  value={doc.slug || ""}
                  placeholder="auto-generated"
                  onChange={(e) => update({ slug: e.target.value })}
                />
              </section>

              <section className="mmeta-section">
                <label htmlFor="mmeta-excerpt">한 줄 요약</label>
                <textarea
                  id="mmeta-excerpt"
                  className="mmeta-input"
                  rows={3}
                  value={doc.excerpt || ""}
                  placeholder="검색·SNS 공유 시 노출되는 한두 문장"
                  onChange={(e) => update({ excerpt: e.target.value })}
                />
              </section>

              <section className="mmeta-section">
                <label htmlFor="mmeta-tags">태그 (쉼표 구분)</label>
                <input
                  id="mmeta-tags"
                  type="text"
                  className="mmeta-input"
                  value={(doc.tags || []).join(", ")}
                  placeholder="민사, 손해배상"
                  onChange={(e) => setTags(e.target.value)}
                />
              </section>

              <section className="mmeta-section">
                <label>썸네일</label>
                {doc.thumbnailUrl ? (
                  <div className="mmeta-thumb">
                    <img src={doc.thumbnailUrl} alt="썸네일" />
                    <button type="button" className="mmeta-thumb-clear" onClick={() => update({ thumbnailUrl: "" })}>제거</button>
                  </div>
                ) : (
                  <label className={`mmeta-thumb-upload${uploading ? " uploading" : ""}`}>
                    <ImageIcon size={20} />
                    <span>{uploading ? "업로드 중..." : "썸네일 선택"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleThumbnailFile(e.target.files?.[0])}
                    />
                  </label>
                )}
              </section>
            </>
          )}

          {!isBlog && (
            <>
              <section className="mmeta-section">
                <label htmlFor="mmeta-author">작성자</label>
                <input id="mmeta-author" type="text" className="mmeta-input"
                  value={doc.author || ""} onChange={(e) => update({ author: e.target.value })} />
              </section>
              <section className="mmeta-section">
                <label htmlFor="mmeta-summary">요약</label>
                <textarea id="mmeta-summary" className="mmeta-input" rows={3}
                  value={doc.summary || ""} onChange={(e) => update({ summary: e.target.value })} />
              </section>
            </>
          )}

          {isBlog && (
            <div className="mmeta-actions">
              <button type="button" className="mmeta-secondary" onClick={onPreview}>
                <Eye size={16} /> 미리보기
              </button>
              <button
                type="button"
                className="mmeta-primary"
                disabled={isPublishing}
                onClick={onPublish}
              >
                <Send size={16} />
                {isPublishing ? "발행 중..." : "발행하기"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default MobileMetaSheet;
