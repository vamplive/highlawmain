/** 미디어 관리 — 드래그 앤 드롭 파일 업로드 영역 */
import { useRef } from "react";
import { COLORS } from "../../../components/admin/styles";

/** 드래그 앤 드롭 + 클릭 업로드 영역 */
export default function MediaUpload({ dragging, uploading, onDragEnter, onDragLeave, onDragOver, onDrop, onFilePick }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    onFilePick(e);
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? COLORS.accent : COLORS.border}`,
        borderRadius: 10, padding: "32px 20px", textAlign: "center",
        background: dragging ? COLORS.accent + "0c" : COLORS.bgForm,
        cursor: "pointer", transition: "all 0.2s", marginBottom: 24,
      }}
    >
      <input ref={fileInputRef} type="file" hidden onChange={handleChange} />
      {uploading ? (
        <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>업로드 중...</p>
      ) : (
        <>
          <p style={{ margin: "0 0 6px", fontSize: 28, lineHeight: 1 }}>
            {dragging ? "+" : ""}
          </p>
          <p style={{
            margin: 0, fontSize: 14,
            color: dragging ? COLORS.accent : COLORS.textSecondary,
            fontWeight: dragging ? 600 : 400,
          }}>
            {dragging ? "여기에 파일을 놓으세요" : "파일을 드래그하거나 클릭하여 업로드"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: COLORS.textMuted }}>
            이미지, 영상, 문서 등 최대 50MB
          </p>
        </>
      )}
    </div>
  );
}
