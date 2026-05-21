/**
 * useSignaturePad — perfect-freehand 기반 SignatureEngine 을 React 19 에서 사용하기 위한 훅
 *
 * - 손가락 입력에 최적화: 균일 굵기 + 부드러운 펜 끝(taper) + sub-frame coalesced events
 * - 스타일러스 입력은 자동으로 압력 가변 굵기 모드로 전환
 * - 위변조 검증·법정 증거용 메타(평균/최대 압력, 획수, 지속시간, 평균 속도, DPR, orientation)
 *   를 PointerEvent 로부터 누적하여 별도로 반환
 * - HiDPI 자동 보정 + ResizeObserver 로 모바일 회전 대응
 * - canvasProps 으로 PointerEvent 핸들러 일괄 노출 (캔버스 element 에 spread)
 *
 * 외부 API(이전 signature_pad 기반 훅과 호환):
 *   { canvasRef, isReady, clear, isEmpty, toDataURL, toData, fromData,
 *     getPointerType, getMeta, resizeCanvas, canvasProps }
 */
import { useCallback, useEffect, useRef, useState } from "react";
import SignatureEngine from "./signatureEngine";

export function useSignaturePad(options = {}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const pointerTypeRef = useRef(null);
  const metaRef = useRef(createEmptyMeta());
  const lastPointRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  /** 외부에서 호출할 수 있는 강제 리사이즈 */
  const resizeCanvas = useCallback(() => {
    engineRef.current?.resize();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SignatureEngine(canvas, {
      inkColor: options.penColor || "#1a1f2c",
      backgroundColor: "transparent",
    });
    engineRef.current = engine;
    engine.resize();
    setIsReady(true);

    /* 모바일 회전·뷰포트 변경 시 자동 리사이즈 */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* PointerEvent → 메타 누적 */
  const recordPointerMeta = useCallback((ev) => {
    const m = metaRef.current;
    const p = ev.pressure;
    if (typeof p === "number" && p > 0) {
      m.pressureSum += p;
      m.pressureCount += 1;
      if (p > m.maxPressure) m.maxPressure = p;
    }
    if (typeof ev.tiltX === "number") m.tiltXSamples.push(ev.tiltX);
    if (typeof ev.tiltY === "number") m.tiltYSamples.push(ev.tiltY);

    const now = ev.timeStamp || performance.now();
    const last = lastPointRef.current;
    if (last) {
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;
      const dt = Math.max(now - last.t, 1);
      const v = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms
      m.velocitySum += v;
      m.velocityCount += 1;
    }
    lastPointRef.current = { x: ev.clientX, y: ev.clientY, t: now };
    m.lastAt = now;
    if (!m.firstAt) m.firstAt = now;
  }, []);

  const handlePointerDown = useCallback((ev) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (ev.button !== undefined && ev.button !== 0) return; // 좌클릭/터치만
    ev.preventDefault();
    try {
      canvasRef.current?.setPointerCapture?.(ev.pointerId);
    } catch {
      // 일부 브라우저에서 pointer capture 실패 — 기능 정상 동작에는 영향 없음
    }
    pointerTypeRef.current = ev.pointerType || "mouse";
    metaRef.current.strokeCount += 1;
    lastPointRef.current = null;
    recordPointerMeta(ev);
    engine.startStroke(ev);
  }, [recordPointerMeta]);

  const handlePointerMove = useCallback((ev) => {
    const engine = engineRef.current;
    if (!engine || !engine.activeStroke) return;
    /* buttons===0 인 호버 이동은 무시 (펜 호버 등) */
    if (ev.buttons === 0 && ev.pointerType !== "pen") return;
    ev.preventDefault();
    recordPointerMeta(ev);
    engine.addPoint(ev);
  }, [recordPointerMeta]);

  const handlePointerUp = useCallback((ev) => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      canvasRef.current?.releasePointerCapture?.(ev.pointerId);
    } catch {
      // 이미 해제된 경우 무시
    }
    engine.endStroke(ev);
    lastPointRef.current = null;
  }, []);

  const handlePointerCancel = useCallback(() => {
    engineRef.current?.cancelStroke();
    lastPointRef.current = null;
  }, []);

  const clear = useCallback(() => {
    engineRef.current?.clear();
    pointerTypeRef.current = null;
    metaRef.current = createEmptyMeta();
    lastPointRef.current = null;
  }, []);

  const isEmpty = useCallback(() => engineRef.current?.isEmpty() ?? true, []);
  const toDataURL = useCallback((type = "image/png") => engineRef.current?.toDataURL(type) ?? null, []);
  const toData = useCallback(() => engineRef.current?.toData() ?? [], []);
  const fromData = useCallback((data) => engineRef.current?.fromData(data), []);
  const getPointerType = useCallback(() => pointerTypeRef.current || "mouse", []);

  const getMeta = useCallback(() => {
    const m = metaRef.current;
    return {
      avgPressure: m.pressureCount ? Number((m.pressureSum / m.pressureCount).toFixed(3)) : null,
      maxPressure: m.maxPressure || null,
      strokeCount: m.strokeCount,
      totalDurationMs: m.firstAt && m.lastAt ? Math.round(m.lastAt - m.firstAt) : null,
      avgVelocity: m.velocityCount ? Number((m.velocitySum / m.velocityCount).toFixed(3)) : null,
      screenDpi: window.devicePixelRatio || 1,
      orientation: getOrientation(),
      pointerType: pointerTypeRef.current || "mouse",
    };
  }, []);

  /** canvas element 에 spread 할 수 있는 props 묶음 */
  const canvasProps = {
    ref: canvasRef,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onLostPointerCapture: handlePointerCancel,
    onContextMenu: (e) => e.preventDefault(),
  };

  return {
    canvasRef,
    isReady,
    clear,
    isEmpty,
    toDataURL,
    toData,
    fromData,
    getPointerType,
    getMeta,
    resizeCanvas,
    canvasProps,
  };
}

function createEmptyMeta() {
  return {
    pressureSum: 0, pressureCount: 0, maxPressure: 0,
    tiltXSamples: [], tiltYSamples: [],
    velocitySum: 0, velocityCount: 0,
    strokeCount: 0,
    firstAt: 0, lastAt: 0,
  };
}

function getOrientation() {
  try {
    return window.screen?.orientation?.type
      || (window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait");
  } catch { return "unknown"; }
}
