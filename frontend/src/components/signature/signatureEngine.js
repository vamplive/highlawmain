/**
 * SignatureEngine — perfect-freehand 기반 고성능 캔버스 서명 엔진
 *
 * 핵심 설계:
 *  - perfect-freehand 의 getStroke() 로 입력 점들을 자연스러운 outline 으로 변환
 *  - requestAnimationFrame 기반 렌더 루프로 vsync 정렬, 60–120Hz 모니터에서 매끄럽게
 *  - PointerEvent.getCoalescedEvents() 로 sub-frame 입력 캡처(120Hz 디스플레이 대응)
 *  - setPointerCapture 로 캔버스 밖으로 손가락이 나가도 stroke 끊김 없음
 *  - DPR 자동 보정 + ResizeObserver 로 캔버스 폭/높이 변경 시 자동 재렌더
 *  - 손가락/마우스: thinning=0 → 균일 굵기 (자연스러운 글씨)
 *  - 스타일러스: thinning=0.6 → 압력에 따라 굵기 변화
 *
 * 외부 의존성: perfect-freehand v1
 */
import { getStroke } from "perfect-freehand";

const DEFAULT_INK = "#1a1f2c";
const DEFAULT_BG = "transparent";
const MAX_DPR = 3;

/* 입력 종류별 stroke 옵션 — 대부분의 모바일 사용자는 손가락 입력 */
const FINGER_OPTIONS = {
  size: 3.6,
  thinning: 0,            // 굵기 일정 (필압 미반영)
  smoothing: 0.55,
  streamline: 0.55,
  start: { taper: 8, cap: true },
  end: { taper: 18, cap: true },
  simulatePressure: false,
};

const PEN_OPTIONS = {
  size: 3.4,
  thinning: 0.65,         // 압력에 따라 굵기 변화 (Apple Pencil / S Pen)
  smoothing: 0.5,
  streamline: 0.45,
  start: { taper: 4, cap: true },
  end: { taper: 14, cap: true },
  simulatePressure: false,
};

const MOUSE_OPTIONS = {
  ...FINGER_OPTIONS,
  size: 2.8,                // 마우스는 살짝 가늘게
};

function optionsForPointerType(pointerType) {
  if (pointerType === "pen") return PEN_OPTIONS;
  if (pointerType === "mouse") return MOUSE_OPTIONS;
  return FINGER_OPTIONS;
}

/**
 * SignatureEngine — DOM 캔버스에 부착되는 라이트한 그리기 엔진.
 * React 상태에 의존하지 않는 pure imperative 클래스로,
 * 훅(useSignaturePad)에서 ref 로 보관하며 사용한다.
 */
export class SignatureEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ inkColor?: string, backgroundColor?: string }} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.inkColor = options.inkColor || DEFAULT_INK;
    this.backgroundColor = options.backgroundColor || DEFAULT_BG;
    this.dpr = 1;

    /* 완료된 strokes 와 진행 중 stroke 분리 — 진행 중 stroke 만 매 프레임
       다시 그려도 충분 (부드러운 펜 끝 효과 위해) */
    this.strokes = [];          // [{ pointerType, points: [[x,y,p], ...] }]
    this.activeStroke = null;   // { pointerType, points }
    this.activePointerId = null;

    this.rafHandle = 0;
    this.dirty = true;
    this.onChange = options.onChange || (() => {});

    this._scheduleRender = this._scheduleRender.bind(this);
    this._render = this._render.bind(this);
  }

  /** DPR 보정 + 캔버스 픽셀 버퍼 크기 동기화 */
  resize() {
    const canvas = this.canvas;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.dpr = dpr;
    /* CSS 픽셀 좌표계로 그리기 위해 DPR 만큼 transform 스케일 */
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._scheduleRender();
  }

  /** 캔버스 → CSS 픽셀 좌표계로 PointerEvent 변환 */
  pointFromEvent(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    /* 압력 0 인 입력(주로 손가락)도 perfect-freehand 가 적절히 처리하도록 0.5 */
    const pressure = ev.pressure && ev.pressure > 0 ? ev.pressure : 0.5;
    return [x, y, pressure];
  }

  /** stroke 시작 */
  startStroke(ev) {
    const point = this.pointFromEvent(ev);
    this.activeStroke = {
      pointerType: ev.pointerType || "mouse",
      points: [point],
      startedAt: ev.timeStamp || performance.now(),
    };
    this.activePointerId = ev.pointerId;
    this._scheduleRender();
  }

  /** stroke 진행 — 단일 또는 coalesced events 처리 */
  addPoint(ev) {
    if (!this.activeStroke) return;
    if (ev.pointerId !== this.activePointerId) return;

    /* 120Hz+ 디스플레이를 위한 sub-frame 샘플 추출 */
    const native = ev.nativeEvent || ev;
    const coalesced =
      typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : null;
    const events = coalesced && coalesced.length > 0 ? coalesced : [ev];
    for (const e of events) {
      this.activeStroke.points.push(this.pointFromEvent(e));
    }
    this._scheduleRender();
  }

  /** stroke 종료 — 활성 stroke 를 완료 목록으로 옮긴다 */
  endStroke(ev) {
    if (!this.activeStroke) return null;
    if (ev && ev.pointerId !== this.activePointerId) return null;

    /* 마지막 점 한 번 더 추가 (perfect-freehand 의 last:true 효과) */
    if (ev) this.activeStroke.points.push(this.pointFromEvent(ev));
    const finished = this.activeStroke;
    finished.endedAt = ev?.timeStamp || performance.now();
    this.strokes.push(finished);
    this.activeStroke = null;
    this.activePointerId = null;
    this._scheduleRender();
    this.onChange();
    return finished;
  }

  cancelStroke() {
    this.activeStroke = null;
    this.activePointerId = null;
    this._scheduleRender();
  }

  clear() {
    this.strokes = [];
    this.activeStroke = null;
    this.activePointerId = null;
    this._scheduleRender();
    this.onChange();
  }

  isEmpty() {
    return this.strokes.length === 0 && !this.activeStroke;
  }

  hasInk() {
    return !this.isEmpty();
  }

  toDataURL(type = "image/png", quality) {
    /* RAF 가 아직 안 돌았다면 동기 렌더 한 번 */
    if (this.dirty) this._renderNow();
    return this.canvas.toDataURL(type, quality);
  }

  /** 압축된 stroke 배열 — 서버 저장용 */
  toData() {
    return this.strokes.map((s) => ({
      pointerType: s.pointerType,
      points: s.points.map(([x, y, p]) => [
        Number(x.toFixed(2)),
        Number(y.toFixed(2)),
        Number((p ?? 0.5).toFixed(3)),
      ]),
    }));
  }

  fromData(data) {
    if (!Array.isArray(data)) return;
    this.strokes = data.map((s) => ({
      pointerType: s.pointerType || "mouse",
      points: (s.points || []).map((p) => (Array.isArray(p) ? p : [p.x, p.y, p.pressure ?? 0.5])),
    }));
    this._scheduleRender();
  }

  _scheduleRender() {
    if (this.rafHandle) return;
    this.dirty = true;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = 0;
      this._renderNow();
    });
  }

  _renderNow() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const cssWidth = canvas.width / this.dpr;
    const cssHeight = canvas.height / this.dpr;

    /* 배경 클리어 */
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.backgroundColor === "transparent") {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
    } else {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
    }

    /* 모든 완료된 strokes */
    ctx.fillStyle = this.inkColor;
    for (const stroke of this.strokes) {
      this._drawStroke(stroke, false);
    }
    /* 진행 중 stroke 는 last:false 로 부드러운 펜 끝 */
    if (this.activeStroke) {
      this._drawStroke(this.activeStroke, true);
    }
    ctx.restore();
    this.dirty = false;
  }

  _drawStroke(stroke, isActive) {
    const points = stroke.points;
    if (!points.length) return;
    const opts = optionsForPointerType(stroke.pointerType);
    const outline = getStroke(points, { ...opts, last: !isActive });
    if (!outline.length) return;

    const ctx = this.ctx;
    ctx.beginPath();
    const [first, ...rest] = outline;
    ctx.moveTo(first[0], first[1]);
    for (const [x, y] of rest) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  destroy() {
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    this.rafHandle = 0;
  }
}

export default SignatureEngine;
