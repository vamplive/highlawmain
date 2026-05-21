/**
 * 히어로 영상 관리 도메인 상수 + 에디터 다크 테마 토큰
 */

/* ── 영상 카테고리 ── */
export const CATEGORIES = {
  manhattan: "맨하탄",
  nyc: "뉴욕시",
  cityscape: "도시 풍경",
  office: "오피스",
  nature: "자연",
  abstract: "추상",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(
  ([value, label]) => ({ value, label })
);

export const PER_PAGE = 12;

/* ── 에디터 다크 테마 토큰 (비디오 에디터 전용) ── */
export const D = {
  bg: "#1a1a2e",
  surface: "#232340",
  surfaceLight: "#2d2d4a",
  border: "#3a3a5c",
  text: "#e0e0f0",
  textDim: "#8888aa",
  accent: "#6c63ff",
  accentHover: "#7f78ff",
  timeline: "#0d0d1a",
  waveform: "#4a4a6a",
  red: "#ff4757",
  green: "#2ed573",
  blue: "#3742fa",
  orange: "#ffa502",
};

/* ── 에디터 전용 스타일 헬퍼 ── */
export const topBtn = {
  background: D.surfaceLight,
  color: D.text,
  border: `1px solid ${D.border}`,
  padding: "5px 14px",
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 500,
};

export const ctrlBtn = {
  background: "none",
  border: "none",
  color: D.text,
  fontSize: 14,
  cursor: "pointer",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
};

export const flipBtn = {
  padding: "7px 12px",
  fontSize: 10,
  fontWeight: 600,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  flex: 1,
  textAlign: "center",
};

/** 비디오 카드 액션 버튼 스타일 */
export function cardActionBtn(color) {
  return {
    flex: 1,
    padding: "6px 0",
    fontSize: 10,
    fontWeight: 600,
    background: "transparent",
    border: `1px solid ${color}25`,
    color,
    cursor: "pointer",
  };
}

/* ── 컬러 프리셋 ── */
export const PRESETS = [
  { name: "원본", filters: { brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: 0, vignette: 0 } },
  { name: "시네마틱", filters: { brightness: 95, contrast: 120, saturate: 80, hueRotate: -5, sepia: 10, blur: 0, opacity: 100, temperature: -10, vignette: 30 } },
  { name: "빈티지", filters: { brightness: 105, contrast: 90, saturate: 60, hueRotate: 15, sepia: 30, blur: 0, opacity: 100, temperature: 20, vignette: 20 } },
  { name: "네온", filters: { brightness: 110, contrast: 130, saturate: 150, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: -20, vignette: 0 } },
  { name: "B&W", filters: { brightness: 105, contrast: 110, saturate: 0, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: 0, vignette: 10 } },
  { name: "따뜻한", filters: { brightness: 102, contrast: 105, saturate: 110, hueRotate: 10, sepia: 15, blur: 0, opacity: 100, temperature: 30, vignette: 0 } },
  { name: "차가운", filters: { brightness: 100, contrast: 105, saturate: 90, hueRotate: -15, sepia: 0, blur: 0, opacity: 100, temperature: -30, vignette: 0 } },
  { name: "드라마틱", filters: { brightness: 90, contrast: 140, saturate: 70, hueRotate: 0, sepia: 5, blur: 0, opacity: 100, temperature: -5, vignette: 40 } },
];

export const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
export const WAVEFORM_BAR_COUNT = 120;

/** CSS filter 문자열 생성 */
export function buildCssFilter(filters) {
  return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hueRotate + filters.temperature}deg) sepia(${filters.sepia}%) blur(${filters.blur}px) opacity(${filters.opacity}%)`;
}

/** CSS transform 문자열 생성 */
export function buildCssTransform(transform) {
  return `scale(${transform.scale / 100}) rotate(${transform.rotate}deg) translate(${transform.translateX}px, ${transform.translateY}px) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`;
}

/** 타임코드 포맷 (mm:ss.ms) */
export function formatTimecode(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}
