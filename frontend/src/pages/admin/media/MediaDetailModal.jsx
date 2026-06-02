/** 미디어 관리 — 상세 정보/편집 모달 */
import { COLORS, fieldStyle, labelStyle, btnStyle, outlineBtnStyle } from "../../../components/admin/styles";
import { formatDate } from "../../../utils/formatters";
import { fileIcon, formatSize, isImage } from "./mediaUtils";

/** 미디어 상세 정보 모달 */
export default function MediaDetailModal({
  detail, detailAlt, detailFolder, copied,
  onAltChange, onFolderChange, onSave, onDelete, onCopy, onClose,
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: "90%", maxWidth: 600,
          maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* 미리보기 */}
        <div style={{
          background: COLORS.bgInactive, display: "flex", alignItems: "center",
          justifyContent: "center", minHeight: 200, maxHeight: 360, overflow: "hidden",
          borderRadius: "12px 12px 0 0",
        }}>
          {isImage(detail.filename) && detail.url ? (
            <img
              src={detail.url}
              alt={detail.alt || detail.filename}
              style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 72 }}>{fileIcon(detail.filename)}</span>
          )}
        </div>

        {/* 정보 + 편집 */}
        <div style={{ padding: "20px 24px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: COLORS.text, wordBreak: "break-all" }}>
            {detail.filename}
          </h3>

          {/* 파일 메타 */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px",
            marginBottom: 20, fontSize: 13, color: COLORS.textSecondary,
          }}>
            <div><span style={{ color: COLORS.textMuted }}>크기: </span>{formatSize(detail.size)}</div>
            <div><span style={{ color: COLORS.textMuted }}>타입: </span>{detail.mimeType || "-"}</div>
            <div><span style={{ color: COLORS.textMuted }}>업로드: </span>{formatDate(detail.createdAt)}</div>
            <div><span style={{ color: COLORS.textMuted }}>폴더: </span>{detail.folder || "없음"}</div>
          </div>

          {/* URL 복사 */}
          {detail.url && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                readOnly
                value={detail.url}
                style={{ ...fieldStyle, fontSize: 12, color: COLORS.textSecondary, background: COLORS.bgForm }}
              />
              <button onClick={onCopy} style={btnStyle(copied ? COLORS.success : COLORS.accent)}>
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          )}

          {/* Alt 텍스트 */}
          <label style={labelStyle}>대체 텍스트 (alt)</label>
          <input
            value={detailAlt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="이미지 설명 입력..."
            style={{ ...fieldStyle, marginBottom: 14 }}
          />

          {/* 폴더 변경 */}
          <label style={labelStyle}>폴더</label>
          <input
            value={detailFolder}
            onChange={(e) => onFolderChange(e.target.value)}
            placeholder="폴더명 (비우면 미분류)"
            style={{ ...fieldStyle, marginBottom: 20 }}
          />

          {/* 액션 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onDelete} style={btnStyle(COLORS.danger)}>삭제</button>
            <button onClick={onSave} style={btnStyle(COLORS.accent)}>저장</button>
            <button onClick={onClose} style={outlineBtnStyle(COLORS.textSecondary)}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
