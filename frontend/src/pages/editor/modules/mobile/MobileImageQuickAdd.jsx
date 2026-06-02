/**
 * MobileImageQuickAdd — 카메라/갤러리에서 이미지를 즉시 본문에 삽입.
 *
 * - 카메라: <input type="file" accept="image/*" capture="environment" />
 * - 갤러리: <input type="file" accept="image/*" />
 * - 다중 선택 가능. 업로드는 `/api/media/upload`로 순차 전송.
 *
 * 모바일에서 사진을 첨부하는 가장 빠른 동선을 제공한다.
 */
import { memo, useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { api } from "../../../../utils/api";
import { showEditorAlert } from "../editorToast";
import { useHapticFeedback } from "./mobileHooks";

async function uploadAndInsert(editor, file, setProgress) {
  setProgress((p) => ({ ...p, total: p.total + 1 }));
  try {
    const json = await api.upload("/media/upload", file);
    const media = json?.data;
    const url = media?.url;
    if (!url) throw new Error("업로드 URL 누락");
    editor?.chain().focus().setImage({ src: url, alt: media?.alt || "" }).run();
    setProgress((p) => ({ ...p, done: p.done + 1 }));
    return true;
  } catch (err) {
    setProgress((p) => ({ ...p, failed: p.failed + 1 }));
    showEditorAlert(`이미지 업로드 실패: ${err?.message || err}`);
    return false;
  }
}

export const MobileImageQuickAdd = memo(function MobileImageQuickAdd({ editor, open, onClose }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0 });
  const haptic = useHapticFeedback();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) { onClose?.(); return; }
    setProgress({ total: 0, done: 0, failed: 0 });
    haptic(10);
    for (const file of files) {
      await uploadAndInsert(editor, file, setProgress);
    }
    onClose?.();
  };

  if (!open) return null;
  const busy = progress.total > 0 && progress.done + progress.failed < progress.total;

  return (
    <>
      <div className="editor-mvoice-backdrop" onClick={() => !busy && onClose?.()} />
      <div className="editor-mimage editor-mobile-only" role="dialog" aria-label="이미지 추가">
        <div className="mvoice-header">
          <div className="mvoice-title">이미지 추가</div>
          <button type="button" onClick={() => !busy && onClose?.()} aria-label="닫기" disabled={busy}>
            <X size={20} />
          </button>
        </div>
        <div className="mimage-grid">
          <button
            type="button"
            className="mimage-card"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
          >
            <Camera size={36} />
            <span>카메라로 촬영</span>
            <small>새 사진을 즉시 첨부</small>
          </button>
          <button
            type="button"
            className="mimage-card"
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
          >
            <ImageIcon size={36} />
            <span>사진 라이브러리</span>
            <small>여러 장 선택 가능</small>
          </button>
        </div>
        {busy && (
          <div className="mimage-progress">
            업로드 중 {progress.done + progress.failed} / {progress.total}
            {progress.failed > 0 && <span className="failed"> · 실패 {progress.failed}</span>}
          </div>
        )}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
      </div>
    </>
  );
});

export default MobileImageQuickAdd;
