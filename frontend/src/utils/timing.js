/**
 * UI 타이밍 상수 — setTimeout 매직넘버를 상수로 통일
 * 토스트, 애니메이션, 레이아웃 재측정 등의 딜레이 값을 한곳에서 관리한다.
 */

/** 토스트 알림 표시 시간 (ms) */
export const TOAST_DURATION_MS = 2500;

/** 토스트 페이드아웃 트랜지션 (ms) */
export const TOAST_FADEOUT_MS = 300;

/** 플래시 하이라이트 애니메이션 (ms) */
export const FLASH_DURATION_MS = 1500;

/** 자동저장 딜레이 — 로컬 저장 후 서버 전송까지 (ms) */
export const AUTOSAVE_SERVER_DELAY_MS = 2000;

/** UI 레이아웃 재측정 딜레이 (ms) */
export const LAYOUT_MEASURE_DELAY_MS = 150;

/** 복사 완료 피드백 표시 시간 (ms) */
export const COPY_FEEDBACK_MS = 2000;
