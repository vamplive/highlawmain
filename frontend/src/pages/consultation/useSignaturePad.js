/**
 * useSignaturePad (개인정보 동의서 전용) — components/signature/signatureEngine 위임
 *
 * 기존엔 자체 캔버스 그리기 로직(quadraticCurveTo + 압력/속도 width)을 가지고
 * 있었으나, perfect-freehand 기반 SignatureEngine 으로 통일하여:
 *  - Catmull-Rom 수준 부드러움 (perfect-freehand 의 streamline + smoothing)
 *  - 손가락은 균일 굵기, 스타일러스만 압력 가변
 *  - sub-frame coalesced events + RAF 렌더로 120Hz 디스플레이 매끈
 * 를 모두 활용한다.
 *
 * 외부 API 는 PrivacyModal 이 사용하던 형태를 유지:
 *  { signatureData, canvasProps, clear, confirm, getSignaturePayload,
 *    undo, hasInk, isDrawing, canUndo }
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SignatureEngine from "../../components/signature/signatureEngine";

const MIN_HEIGHT = 220;          // 모바일 손가락 서명 최소 높이

export default function useSignaturePad() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const activePointerIdRef = useRef(null);

  const [signatureData, setSignatureData] = useState(null);
  const [hasInk, setHasInk] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [lastPointerType, setLastPointerType] = useState("mouse");

  /* 엔진 초기화 + 자동 리사이즈 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new SignatureEngine(canvas, {
      inkColor: "#111827",
      backgroundColor: "transparent",
      onChange: () => {
        setHasInk(engine.hasInk());
        setStrokeCount(engine.strokes.length);
        setSignatureData(null);
      },
    });
    engineRef.current = engine;
    engine.resize();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => engine.resize()) : null;
    if (ro) ro.observe(canvas);
    const onWinResize = () => engine.resize();
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    event.preventDefault();
    try {
      canvas.focus({ preventScroll: true });
    } catch {
      canvas.focus();
    }
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // pointer capture failure 는 그리기 동작에 영향 없음
    }

    activePointerIdRef.current = event.pointerId;
    setIsDrawing(true);
    setLastPointerType(event.pointerType || "mouse");
    engine.startStroke(event);
  }, []);

  const handlePointerMove = useCallback((event) => {
    const engine = engineRef.current;
    if (!engine || !engine.activeStroke) return;
    if (activePointerIdRef.current !== event.pointerId) return;
    if (event.buttons === 0 && event.pointerType !== "pen") return;
    event.preventDefault();
    engine.addPoint(event);
  }, []);

  const finishStroke = useCallback((event) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    activePointerIdRef.current = null;
    setIsDrawing(false);
    try {
      canvasRef.current?.releasePointerCapture?.(event.pointerId);
    } catch {
      // 이미 해제된 경우 무시
    }
    engine.endStroke(event);
  }, []);

  const clear = useCallback(() => {
    engineRef.current?.clear();
    activePointerIdRef.current = null;
    setSignatureData(null);
    setHasInk(false);
    setIsDrawing(false);
    setStrokeCount(0);
  }, []);

  const undo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.strokes.length === 0) return;
    engine.strokes = engine.strokes.slice(0, -1);
    engine._scheduleRender();
    setStrokeCount(engine.strokes.length);
    setHasInk(engine.hasInk());
    setSignatureData(null);
  }, []);

  const buildPayload = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine || engine.isEmpty()) return null;
    const imageData = engine.toDataURL("image/png");
    const rect = canvas.getBoundingClientRect();
    const payload = {
      imageData,
      strokes: engine.toData(),
      pointerType: lastPointerType,
      widthPx: Math.round(rect.width),
      heightPx: Math.round(rect.height),
    };
    setSignatureData(imageData);
    return payload;
  }, [lastPointerType]);

  const confirm = useCallback(() => buildPayload(), [buildPayload]);
  const getSignaturePayload = useCallback(() => buildPayload(), [buildPayload]);

  const canvasProps = useMemo(() => ({
    ref: canvasRef,
    role: "img",
    "aria-label": "서명 입력 영역",
    tabIndex: 0,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: finishStroke,
    onPointerCancel: finishStroke,
    onLostPointerCapture: finishStroke,
    onKeyDown: (event) => {
      const key = event.key?.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        undo();
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        clear();
      }
    },
    onContextMenu: (event) => event.preventDefault(),
    style: {
      display: "block",
      width: "100%",
      height: MIN_HEIGHT,
      background: "#fff",
      cursor: "crosshair",
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      overscrollBehavior: "contain",
    },
  }), [clear, finishStroke, handlePointerDown, handlePointerMove, undo]);

  /* 부모 컴포넌트가 캔버스 가시성 변경 후 명시적으로 호출할 수 있는 resize 트리거 */
  const forceResize = useCallback(() => {
    engineRef.current?.resize();
  }, []);

  return {
    signatureData,
    canvasProps,
    clear,
    confirm,
    getSignaturePayload,
    undo,
    hasInk,
    isDrawing,
    canUndo: strokeCount > 0,
    forceResize,
  };
}
