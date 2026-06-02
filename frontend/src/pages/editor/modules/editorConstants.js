/**
 * 에디터 매직넘버 상수 — EditorPage에서 사용되는 하드코딩 값 모음
 */

/** px/cm 변환 계수 (CSS 기본 96dpi 기준: 96/2.54) */
export const PIXELS_PER_CM = 37.8;

/** 페이지당 추정 글자 수 (한국어 A4 기준) */
export const CHARS_PER_PAGE_ESTIMATE = 1800;

/** 줌 최소/최대 범위 */
export const ZOOM_MIN = 25;
export const ZOOM_MAX = 500;
export const ZOOM_STEP = 10;

/** 페이지 너비 맞춤 시 양쪽 여백 (px) */
export const FIT_PAGE_PADDING = 60;

/** 첫 페이지 최소 높이 (px) */
export const MIN_FIRST_PAGE_HEIGHT = 120;
