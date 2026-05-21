/** 문서 유형 설정 — 유형별 라벨, 색상 매핑 */
export const TYPE_CONFIG = {
  statute: { label: "법령", color: "#3498db" },
  case_law: { label: "판례", color: "#e74c3c" },
  textbook: { label: "교과서", color: "#9b59b6" },
  book: { label: "서적", color: "#4CAF50" },
  paper: { label: "논문", color: "#e67e22" },
  news: { label: "뉴스", color: "#2ecc71" },
  note: { label: "메모", color: "#95a5a6" },
};

export const ALL_DOCUMENT_TYPES = Object.keys(TYPE_CONFIG);

/**
 * 문서 유형 코드를 한국어 라벨로 변환한다.
 * @param {string} type - 문서 유형 코드 (예: "statute", "case_law")
 * @returns {string} 한국어 라벨 (예: "법령", "판례") 또는 코드 그대로
 */
export function getTypeLabel(type) {
  return TYPE_CONFIG[type]?.label ?? type;
}

/**
 * 문서 유형 코드에 대응하는 색상을 반환한다.
 * @param {string} type - 문서 유형 코드
 * @returns {string} hex 색상 코드
 */
export function getTypeColor(type) {
  return TYPE_CONFIG[type]?.color ?? "#95a5a6";
}
