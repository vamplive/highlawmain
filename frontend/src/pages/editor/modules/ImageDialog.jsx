/**
 * ImageDialog — 그림 삽입 대화상자
 * URL, 관리자 미디어 라이브러리, 파일 업로드로 이미지를 에디터에 삽입한다.
 */
import { useState, useRef } from "react";
import MediaPicker from "../../../components/MediaPicker";
import { api } from "../../../utils/api";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

function isValidImageUrl(value) {
  if (value.startsWith("/")) return value.startsWith("/uploads/");
  try {
    const parsed = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function getImageAlt(file, fallbackAlt = "") {
  return fallbackAlt || file?.alt || file?.originalName || file?.name || undefined;
}

function notifyThumbnailUrl(url) {
  window.dispatchEvent(new CustomEvent("editor:thumbnail-url-change", {
    detail: { thumbnailUrl: url },
  }));
}

export function ImageDialog({ editor, onClose, onThumbnailUrlChange }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [setAsThumbnail, setSetAsThumbnail] = useState(false);
  const fileInputRef = useRef(null);

  const insertImage = (src, imageAlt) => {
    editor?.chain().focus().setImage({ src, alt: imageAlt || undefined }).run();
    if (setAsThumbnail) {
      onThumbnailUrlChange?.(src);
      notifyThumbnailUrl(src);
    }
    onClose();
  };

  const insertFromUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidImageUrl(trimmed)) {
      setError("http(s) URL 또는 업로드된 미디어 URL만 사용할 수 있습니다.");
      return;
    }
    insertImage(trimmed, alt.trim());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const json = await api.upload("/media/upload", file);
      const media = json.data;
      if (!media?.url) throw new Error("업로드된 파일 URL을 확인할 수 없습니다.");
      insertImage(media.url, getImageAlt(media, alt.trim()));
    } catch (err) {
      setError(err.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMediaSelect = (file) => {
    if (!file?.url) {
      setError("선택한 미디어 URL을 확인할 수 없습니다.");
      return;
    }
    insertImage(file.url, getImageAlt(file, alt.trim()));
  };

  return (
    <DialogShell title="그림 삽입" onClose={onClose} width={500}>
      <div className="word-dialog-body">
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">URL에서 삽입:</label>
          <input className="word-dialog-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">대체 텍스트:</label>
          <input className="word-dialog-input" value={alt} onChange={e => setAlt(e.target.value)} placeholder="이미지 설명" />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555", marginBottom: 16 }}>
          <input type="checkbox" checked={setAsThumbnail} onChange={(e) => setSetAsThumbnail(e.target.checked)} />
          블로그 썸네일 URL로도 사용
        </label>
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginBottom: 12 }}>
          <label className="word-dialog-label">미디어 라이브러리:</label>
          <button
            type="button"
            className="word-dialog-btn"
            onClick={() => setMediaPickerOpen(true)}
            style={{ fontSize: 12, padding: "6px 10px", marginTop: 4 }}
          >
            업로드된 이미지 선택
          </button>
        </div>
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginBottom: 12 }}>
          <label className="word-dialog-label">파일에서 업로드:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ fontSize: 11, marginTop: 4 }}
          />
          {uploading && <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>업로드 중...</div>}
        </div>
        {error && <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
        <div style={{ fontSize: 11, color: "#888" }}>
          새 파일은 관리자 미디어에 업로드한 뒤 URL로 삽입됩니다.
        </div>
      </div>
      <DialogFooter onOk={insertFromUrl} onCancel={onClose} okLabel="URL 삽입" disableOk={!url.trim() || uploading} />
      <MediaPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image"
      />
    </DialogShell>
  );
}
