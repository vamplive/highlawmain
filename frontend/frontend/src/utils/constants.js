/**
 * 프로젝트 전역 공통 상수
 * - 여러 페이지에서 중복 정의되던 상수들을 한 곳에서 관리
 */

/** 문서 상태 라벨 매핑 */
export const STATUS_LABELS = {
  inbox: "수신함",
  reading: "읽는 중",
  completed: "완독",
  archived: "보관",
  reference: "참고",
};

/** 문서 상태 옵션 (Select 컴포넌트용 배열 형태) */
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

