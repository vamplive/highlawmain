/**
 * 전자서명 캔버스 — 정밀 메타 캡처판
 * - 마우스 / 터치 / 스타일러스(Apple Pencil, S Pen) 통합 입력 (Pointer Events)
 * - HiDPI 선명도, 모바일 회전 대응은 useSignaturePad 훅에서 처리
 * - 압력·기울기·속도·획 통계 메타를 함께 제출 (위변조 검증·법정 증거)
 * - 모바일 풀스크린 모드(`fullscreen`) 지원
 *
 * 제출 시 전달되는 페이로드:
 *   { imageData, strokes, pointerType, widthPx, heightPx,
 *     avgPressure, maxPressure, strokeCount, totalDurationMs,
 *     avgVelocity, screenDpi, orientation }
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { useSignaturePad } from "./useSignaturePad";

const MIN_STROKE_COUNT = 2;

export default function SignaturePad({
  height = 220,
  penColor = "#1a1f2c",
  helperText = "여기에 서명해주세요",
  onComplete,
  onChange,
  submitLabel = "서명 확정",
  clearLabel = "지우기",
  disableSubmit = false,
  fullscreen = false,
}) {
  const { canvasRef, canvasProps, clear, isEmpty, toDataURL, toData, getPointerType, getMeta, resizeCanvas } = useSignaturePad({ penColor });
  const [orientation, setOrientation] = useState(getOrientation());

  useEffect(() => {
    const onChangeOrientation = () => {
      setOrientation(getOrientation());
      // 회전 직후 캔버스 픽셀 비율 재조정
      setTimeout(() => resizeCanvas(), 100);
    };
    window.addEventListener("orientationchange", onChangeOrientation);
    return () => window.removeEventListener("orientationchange", onChangeOrientation);
  }, [resizeCanvas]);

  const handleClear = useCallback(() => {
    clear();
    onChange?.({ isEmpty: true });
  }, [clear, onChange]);

  const handleSubmit = useCallback(() => {
    if (isEmpty()) {
      alert("서명이 비어있습니다. 다시 시도해주세요.");
      return;
    }
    const strokes = toData();
    if (!strokes || strokes.length < MIN_STROKE_COUNT) {
      alert("서명이 너무 짧습니다. 성함을 써주세요.");
      return;
    }
    const imageData = toDataURL("image/png");
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect() ?? { width: 0, height: 0 };
    const meta = getMeta();
    onComplete?.({
      imageData,
      strokes: JSON.stringify(strokes),
      pointerType: getPointerType(),
      widthPx: Math.round(rect.width),
      heightPx: Math.round(rect.height),
      // 정밀 메타
      avgPressure: meta.avgPressure,
      maxPressure: meta.maxPressure,
      strokeCount: meta.strokeCount,
      totalDurationMs: meta.totalDurationMs,
      avgVelocity: meta.avgVelocity,
      screenDpi: meta.screenDpi,
      orientation: meta.orientation,
    });
  }, [canvasRef, getMeta, getPointerType, isEmpty, onComplete, toData, toDataURL]);

  const isMobilePortrait = fullscreen && orientation === "portrait";
  const [hasInk, setHasInk] = useState(false);

  /* 첫 stroke 가 들어오면 안내 메시지 숨김 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onFirstStroke = () => setHasInk(true);
    canvas.addEventListener("pointerdown", onFirstStroke, { once: true });
    return () => canvas.removeEventListener("pointerdown", onFirstStroke);
  }, [canvasRef]);

  const handleClearWithReset = useCallback(() => {
    handleClear();
    setHasInk(false);
  }, [handleClear]);

  const canvasStyle = useMemo(() => ({
    width: "100%",
    height: fullscreen ? "100%" : `${height}px`,
    /* 손가락 입력 시 브라우저의 팬/줌 동작을 완전히 차단 — 정확한 좌표 캡처 위해 */
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    /* iOS Safari 의 pull-to-refresh / 바운스 차단 */
    overscrollBehavior: "contain",
    cursor: "crosshair",
    background: "linear-gradient(180deg, #ffffff 0%, #fdfdfc 100%)",
  }), [height, fullscreen]);

  if (fullscreen) {
    return (
      <div className="flex h-[100dvh] w-full flex-col bg-white" style={{ overscrollBehavior: "contain" }}>
        {isMobilePortrait && (
          <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            📱 가로로 돌리시면 더 넓게 서명하실 수 있어요
          </div>
        )}
        <div className="relative flex-1" style={{ touchAction: "none" }}>
          <canvas
            {...canvasProps}
            style={canvasStyle}
            className="block h-full w-full"
            aria-label="전자서명 입력 영역"
          />
          {/* 서명선 — 캔버스 중앙 살짝 아래에 배치하여 터치를 가로막지 않음 */}
          <div className="pointer-events-none absolute inset-x-8 bottom-[35%] h-px border-b border-dashed border-gray-300" />
          {!hasInk && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[28%] text-center text-base font-medium text-gray-400">
              ✍️ 손가락으로 이름을 적어주세요
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <Button type="button" variant="ghost" size="lg" onClick={handleClearWithReset} className="min-h-[52px] flex-1 text-base">
            {clearLabel}
          </Button>
          <Button type="button" size="lg" onClick={handleSubmit} disabled={disableSubmit} className="min-h-[52px] flex-[2] text-base">
            {submitLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-color,#e5e7eb)] bg-white shadow-sm">
      <div className="relative">
        <canvas
          {...canvasProps}
          style={canvasStyle}
          className="block rounded-t-lg"
          aria-label="전자서명 입력 영역"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-gray-400">
            {helperText}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-10 h-px bg-gray-200" />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2 rounded-b-lg">
        <p className="text-[11px] text-gray-500">마우스 · 손가락 · 스타일러스 모두 지원</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleClearWithReset}>
            {clearLabel}
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit} disabled={disableSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getOrientation() {
  try {
    return window.screen?.orientation?.type?.startsWith("landscape") ? "landscape" : "portrait";
  } catch { return "portrait"; }
}
