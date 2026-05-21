/**
 * 본문 텍스트에서 needle 매치 위치 목록을 반환하는 순수 함수.
 * ProseMirror 위치는 텍스트 인덱스 + 1(루트 노드 진입 보정).
 *
 * @param {string} text - 대상 본문 텍스트(textBetween 결과)
 * @param {string} needle
 * @param {boolean} [caseSensitive]
 * @returns {Array<{ from: number, to: number }>}
 */
export function findMatchesInText(text, needle, caseSensitive = false) {
  if (!text || !needle) return [];
  const flags = caseSensitive ? "g" : "gi";
  let pattern;
  try {
    pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
  } catch {
    return [];
  }
  const out = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
    out.push({ from: m.index + 1, to: m.index + 1 + m[0].length });
  }
  return out;
}
