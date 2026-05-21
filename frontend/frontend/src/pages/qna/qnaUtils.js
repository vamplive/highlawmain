/** 법률 Q&A 공통 유틸 — 카테고리 네비, 날짜 포맷, 링크 생성 */

/**
 * 카테고리 트리에서 slug로 노드 탐색 (3단계까지).
 * 경로(조상 체인)를 함께 반환한다.
 * @param {Array} tree
 * @param {string} slug
 * @returns {{node: object|null, path: Array}}
 */
export function findNodeBySlug(tree, slug) {
  for (const top of tree) {
    if (top.slug === slug) return { node: top, path: [top] };
    for (const mid of top.children || []) {
      if (mid.slug === slug) return { node: mid, path: [top, mid] };
      for (const sub of mid.children || []) {
        if (sub.slug === slug) return { node: sub, path: [top, mid, sub] };
      }
    }
  }
  return { node: null, path: [] };
}

/** 질문 상세 URL 생성 */
export function qnaDetailUrl(question) {
  return `/qna/question/${question.slug}`;
}

/** 카테고리 URL 생성 */
export function qnaCategoryUrl(slug) {
  return `/qna/category/${slug}`;
}

/** ISO 문자열을 "2026년 4월 22일" 한국어 형식으로 */
export function formatKoreanDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 긴 텍스트 축약 */
export function truncate(text, length = 120) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? clean.slice(0, length) + "…" : clean;
}
