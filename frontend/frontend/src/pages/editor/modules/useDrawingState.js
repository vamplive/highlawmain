/** useDrawingState — 드로잉 캔버스 스트로크 상태 관리 훅 */
import { useState, useCallback } from "react";

/** 포인트 배열을 SVG path d 문자열로 변환 */
function buildPathData(points) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

/**
 * 드로잉 캔버스의 스트로크 상태를 관리하는 커스텀 훅
 * - 스트로크 배열, 실행취소/다시실행 스택 관리
 * - 현재 진행 중인 스트로크 추적
 */
export function useDrawingState() {
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

  const startStroke = useCallback((strokeConfig) => {
    setCurrentStroke({ ...strokeConfig, points: [] });
  }, []);

  const addPoint = useCallback((point) => {
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, point] };
    });
  }, []);

  const finishStroke = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length === 0) return null;
      setStrokes((s) => [...s, prev]);
      setRedoStack([]);
      return null;
    });
  }, []);

  const undo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  }, []);

  const eraseAt = useCallback((x, y, radius = 10) => {
    setStrokes((prev) => {
      const remaining = prev.filter((stroke) => {
        return !stroke.points.some(
          (p) => Math.abs(p.x - x) < radius && Math.abs(p.y - y) < radius
        );
      });
      if (remaining.length < prev.length) {
        setRedoStack([]);
      }
      return remaining;
    });
  }, []);

  const hydrateDrawings = useCallback((nextStrokes = []) => {
    setStrokes(Array.isArray(nextStrokes) ? nextStrokes : []);
    setRedoStack([]);
    setCurrentStroke(null);
  }, []);

  const resetDrawings = useCallback(() => {
    setStrokes([]);
    setRedoStack([]);
    setCurrentStroke(null);
  }, []);

  const toSvgString = useCallback((width, height) => {
    const paths = strokes.map((s) => {
      const d = buildPathData(s.points);
      const opacity = s.opacity != null ? s.opacity : 1;
      return `<path d="${d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join("\n  ");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n  ${paths}\n</svg>`;
  }, [strokes]);

  return {
    strokes,
    currentStroke,
    redoStack,
    startStroke,
    addPoint,
    finishStroke,
    undo,
    redo,
    eraseAt,
    hydrateDrawings,
    resetDrawings,
    toSvgString,
    canUndo: strokes.length > 0,
    canRedo: redoStack.length > 0,
  };
}
