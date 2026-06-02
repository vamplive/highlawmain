/**
 * MediaPicker — 미디어 파일 선택 모달
 * - 다른 관리자 폼에서 이미지/파일을 선택할 때 사용
 * - Props: isOpen, onClose, onSelect(file), accept("image"|"video"|"all")
 */
import { useState, useEffect } from "react";
import { api } from "../utils/api";

/**
 * @param {{ isOpen: boolean, onClose: Function, onSelect: (file: object) => void, accept?: "image"|"video"|"all" }} props
 */
export default function MediaPicker({ isOpen, onClose, onSelect, accept = "all" }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      const params = new URLSearchParams({ limit: 50 });
      if (accept === "image") params.set("type", "image");
      if (accept === "video") params.set("type", "video");
      if (search) params.set("search", search);

      api.get(`/media?${params}`)
        .then((json) => { if (!cancelled) setFiles(json.data ?? []); })
        .catch(() => { if (!cancelled) setFiles([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [isOpen, accept, search]);

  if (!isOpen) return null;

  const handleSelect = (file) => {
    onSelect(file);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "90%", maxWidth: 800,
        maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid #e5e8ed",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, flex: 1, margin: 0 }}>미디어 선택</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="파일명 검색..."
            style={{
              padding: "6px 12px", fontSize: 13, border: "1px solid #d0d0d0",
              borderRadius: 4, outline: "none", width: 200,
            }} />
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999",
          }}>✕</button>
        </div>

        {/* 파일 그리드 */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>불러오는 중...</div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>파일이 없습니다</div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12,
            }}>
              {files.map((file) => (
                <div key={file.id} onClick={() => handleSelect(file)}
                  style={{
                    border: "1px solid #e5e8ed", borderRadius: 8, overflow: "hidden",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#1a3a6b"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e8ed"}
                >
                  {file.mimeType?.startsWith("image/") ? (
                    <img src={file.url} alt={file.alt || file.originalName}
                      style={{ width: "100%", height: 100, objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      height: 100, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#f8f9fb", color: "#999", fontSize: 24,
                    }}>
                      {file.mimeType?.startsWith("video/") ? "🎬" : "📄"}
                    </div>
                  )}
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{
                      fontSize: 11, color: "#333", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {file.originalName}
                    </div>
                    <div style={{ fontSize: 10, color: "#999" }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
