/**
 * ImageEditDialog — 본문에 삽입된 이미지 편집 대화상자
 *
 * 지원 기능:
 *  - 회전 (90°/180°/270°)
 *  - 좌우/상하 반전
 *  - 자르기 (드래그로 영역 선택)
 *  - 밝기 / 대비 조절 (CSS filter 미리보기 → 캔버스에 영구 적용)
 *
 * 편집 결과는 캔버스로 렌더링 후 PNG/JPEG로 인코딩하고, 원본 이미지가
 * 업로드된 미디어라면 새 파일로 업로드하여 src를 교체한다.
 * (원본 보존을 원할 수 있어 별도 파일로 저장)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { DialogShell } from "./DialogShell";
import { DialogFooter } from "./DialogField";

const PREVIEW_MAX_W = 560;
const PREVIEW_MAX_H = 420;

/**
 * @param {object} props
 * @param {{ src: string, alt?: string, width?: number|null }} props.image - 편집 대상 이미지 속성
 * @param {function} props.onApply - (newAttrs) => void — 편집 결과를 적용한다
 * @param {function} props.onClose - 다이얼로그 닫기
 */
export function ImageEditDialog({ image, onApply, onClose }) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [crop, setCrop] = useState(null); // {x,y,w,h} in natural pixel coords
  const [dragging, setDragging] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const imgRef = useRef(null);
  const stageRef = useRef(null);

  /* 이미지 로드 시 자연 크기 캐시 */
  const handleImgLoad = useCallback(() => {
    if (!imgRef.current) return;
    setNaturalSize({
      w: imgRef.current.naturalWidth,
      h: imgRef.current.naturalHeight,
    });
  }, []);

  useEffect(() => {
    if (imgRef.current?.complete) handleImgLoad();
  }, [handleImgLoad]);

  /* 미리보기 영역의 표시 크기 (가로세로 비율 유지하며 PREVIEW_MAX 안에 맞춤) */
  const displaySize = (() => {
    const ratio = naturalSize.h / Math.max(naturalSize.w, 1);
    const w = Math.min(PREVIEW_MAX_W, naturalSize.w || PREVIEW_MAX_W);
    const h = Math.min(PREVIEW_MAX_H, w * ratio || PREVIEW_MAX_H);
    if (h >= PREVIEW_MAX_H) {
      const w2 = PREVIEW_MAX_H / Math.max(ratio, 0.0001);
      return { w: w2, h: PREVIEW_MAX_H };
    }
    return { w, h };
  })();

  /* 자르기 영역 드래그 — 디스플레이 좌표 → 자연 좌표 변환 후 저장 */
  const handleStageMouseDown = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragging({ startX: x, startY: y });
    setCrop(null);
  };

  const handleStageMouseMove = (e) => {
    if (!dragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newCrop = {
      x: Math.min(dragging.startX, x),
      y: Math.min(dragging.startY, y),
      w: Math.abs(x - dragging.startX),
      h: Math.abs(y - dragging.startY),
    };
    setCrop(newCrop);
  };

  const handleStageMouseUp = () => {
    if (crop && (crop.w < 8 || crop.h < 8)) setCrop(null);
    setDragging(null);
  };

  const resetAll = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCrop(null);
  };

  /* 캔버스에 모든 변환을 합성하여 최종 결과 Blob 생성 */
  const renderToBlob = async () => {
    const img = imgRef.current;
    if (!img || !naturalSize.w) throw new Error("이미지가 아직 로드되지 않았습니다.");

    /* crop 좌표를 자연 좌표로 변환 */
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const sx = crop ? crop.x * scaleX : 0;
    const sy = crop ? crop.y * scaleY : 0;
    const sw = crop ? crop.w * scaleX : naturalSize.w;
    const sh = crop ? crop.h * scaleY : naturalSize.h;

    /* 회전 후 출력 캔버스 크기 결정 */
    const isRot90 = rotation % 180 !== 0;
    const outW = isRot90 ? sh : sw;
    const outH = isRot90 ? sw : sh;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(outW);
    canvas.height = Math.round(outH);
    const ctx = canvas.getContext("2d");

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("이미지 인코딩 실패"))),
        "image/jpeg",
        0.92,
      );
    });
  };

  const handleApply = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await renderToBlob();
      const file = new File([blob], `edited-${Date.now()}.jpg`, { type: "image/jpeg" });
      const json = await api.upload("/media/upload", file);
      const media = json?.data;
      if (!media?.url) throw new Error("업로드 응답에 URL이 없습니다.");
      onApply({
        src: media.url,
        alt: image.alt || media.alt || media.originalName || "",
      });
      onClose();
    } catch (err) {
      setError(err.message || "편집 결과 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const previewFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const previewTransform = `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`;

  return (
    <DialogShell title="사진 편집" onClose={onClose} width={640}>
      <div className="word-dialog-body" style={{ padding: 12 }}>
        {/* 미리보기 + 자르기 영역 */}
        <div
          ref={stageRef}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
          style={{
            width: displaySize.w,
            height: displaySize.h,
            margin: "0 auto 12px",
            position: "relative",
            background: "#1f2937",
            cursor: "crosshair",
            overflow: "hidden",
          }}
        >
          <img
            ref={imgRef}
            src={image.src}
            alt={image.alt || ""}
            onLoad={handleImgLoad}
            crossOrigin="anonymous"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: previewFilter,
              transform: previewTransform,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
          {crop && (
            <div
              style={{
                position: "absolute",
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
                border: "2px dashed #fef08a",
                background: "rgba(254,240,138,0.12)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* 버튼 그룹 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <ToolButton onClick={() => setRotation((r) => (r + 270) % 360)}>↶ 90° 좌</ToolButton>
          <ToolButton onClick={() => setRotation((r) => (r + 90) % 360)}>↷ 90° 우</ToolButton>
          <ToolButton onClick={() => setFlipH((v) => !v)} active={flipH}>좌우 반전</ToolButton>
          <ToolButton onClick={() => setFlipV((v) => !v)} active={flipV}>상하 반전</ToolButton>
          <ToolButton onClick={() => setCrop(null)} disabled={!crop}>자르기 취소</ToolButton>
          <ToolButton onClick={resetAll}>모두 초기화</ToolButton>
        </div>

        {/* 슬라이더 */}
        <Slider label="밝기" value={brightness} setValue={setBrightness} min={20} max={200} />
        <Slider label="대비" value={contrast} setValue={setContrast} min={20} max={200} />
        <Slider label="채도" value={saturation} setValue={setSaturation} min={0} max={200} />

        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
          미리보기 위에서 드래그하여 자를 영역을 선택할 수 있습니다.
        </div>
        {error && <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 8 }}>{error}</div>}
      </div>
      <DialogFooter
        onOk={handleApply}
        onCancel={onClose}
        okLabel={busy ? "저장 중…" : "적용"}
        disableOk={busy || !naturalSize.w}
      />
    </DialogShell>
  );
}

function ToolButton({ children, onClick, active = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="word-dialog-btn"
      style={{
        fontSize: 12,
        padding: "6px 10px",
        background: active ? "var(--editor-accent-bg-active, #dbeafe)" : "#fff",
        border: "1px solid #d5d5d5",
        borderRadius: 3,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Slider({ label, value, setValue, min = 0, max = 200 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ width: 48, fontSize: 12, color: "#444" }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ width: 36, fontSize: 11, color: "#666", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default ImageEditDialog;
