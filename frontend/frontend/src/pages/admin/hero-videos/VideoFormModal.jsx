/**
 * 영상 추가/수정 폼 모달
 */
import { useRef } from "react";
import {
  COLORS, FormField, btnStyle, outlineBtnStyle,
} from "../../../components/admin";
import { CATEGORY_OPTIONS } from "./constants";
import Overlay from "./Overlay";

export default function VideoFormModal({
  editingId, form, setField, uploadMode, setUploadMode,
  saving, onSubmit, onClose,
}) {
  const fileRef = useRef(null);

  return (
    <Overlay onClose={onClose}>
      <div style={{ background: "#fff", maxWidth: 520, width: "95%" }}>
        <div style={{ background: COLORS.primary, padding: "16px 28px" }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.18em", marginBottom: 4 }}>
            {editingId ? "EDIT" : "ADD NEW"}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 500, color: "#fff" }}>
            {editingId ? "영상 수정" : "새 영상 추가"}
          </h3>
        </div>

        <form onSubmit={(e) => onSubmit(e, fileRef)} style={{ padding: "24px 28px" }}>
          {/* URL/업로드 모드 전환 (신규만) */}
          {!editingId && (
            <div style={{ display: "flex", marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
              {[false, true].map((m) => (
                <button
                  key={String(m)}
                  type="button"
                  onClick={() => setUploadMode(m)}
                  style={{
                    padding: "8px 20px",
                    fontSize: 11,
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: uploadMode === m ? COLORS.primary : COLORS.textMuted,
                    borderBottom: uploadMode === m ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                  }}
                >
                  {m ? "파일 업로드" : "URL 입력"}
                </button>
              ))}
            </div>
          )}

          <FormField
            label="제목"
            required
            value={form.title}
            onChange={(v) => setField("title", v)}
            placeholder="영상 제목"
          />
          <div style={{ height: 16 }} />

          {uploadMode && !editingId ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" }}>
                영상 파일 <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <div
                style={{
                  border: `2px dashed ${COLORS.border}`,
                  padding: 24,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files[0] && !form.title) {
                      setField("title", e.target.files[0].name.replace(/\.[^.]+$/, ""));
                    }
                  }}
                />
                <div style={{ fontSize: 20, color: COLORS.textMuted, marginBottom: 6 }}>⬆</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>클릭하여 파일 선택</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>MP4, WebM (최대 100MB)</div>
              </div>
            </div>
          ) : (
            <FormField
              label="영상 URL"
              required
              value={form.url}
              onChange={(v) => setField("url", v)}
              placeholder="/videos/example.mp4"
            />
          )}

          <div style={{ height: 16 }} />
          <FormField
            label="카테고리"
            type="select"
            value={form.category}
            onChange={(v) => setField("category", v)}
            options={CATEGORY_OPTIONS}
          />

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 28 }}>
            <button type="button" onClick={onClose} style={outlineBtnStyle()}>
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...btnStyle(COLORS.primary), opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "저장 중..." : editingId ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}
