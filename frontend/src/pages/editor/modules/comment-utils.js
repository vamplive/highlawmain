/** comment-utils — 댓글 관련 순수 유틸 함수 */

/** debounce — 마지막 호출 후 delay ms 만에 실행 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
