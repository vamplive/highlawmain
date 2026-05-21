/** 미디어 관리 — 파일 카드 그리드 */
import { COLORS } from "../../../components/admin/styles";
import { formatDate } from "../../../utils/formatters";
import { fileIcon, formatSize, isImage } from "./mediaUtils";

/** 개별 미디어 파일 카드 */
function MediaCard({ file, onClick }) {
  return (
    <div
      onClick={() => onClick(file)}
      style={{
        background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
        overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.accent}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* 썸네일 영역 */}
      <div style={{
        height: 120, display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.bgInactive, overflow: "hidden",
      }}>
        {isImage(file.filename) && file.url ? (
          <img
            src={file.url}
            alt={file.alt || file.filename}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>{fileIcon(file.filename)}</span>
        )}
      </div>
      {/* 파일 정보 */}
      <div style={{ padding: "10px 12px" }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500, color: COLORS.text,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {file.filename}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.textMuted }}>
          {formatSize(file.size)} · {formatDate(file.createdAt)}
        </p>
      </div>
    </div>
  );
}

/** 미디어 파일 그리드 */
export default function MediaGrid({ files, onSelect }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 16,
    }}>
      {files.map((file) => (
        <MediaCard key={file.id} file={file} onClick={onSelect} />
      ))}
    </div>
  );
}
