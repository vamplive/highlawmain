/**
 * 모바일 발행 시트가 사용하는 SEO 점검 로직 (순수 함수).
 * 컴포넌트와 분리해 단위 테스트가 가능하도록 한다.
 *
 * 반환 구조: [{ id, level: "ok" | "warn" | "error", text }]
 */
export function evaluateSeo({ title = "", excerpt = "", html = "", thumbnailUrl = "" } = {}) {
  const checks = [];

  // 제목
  if (!title) {
    checks.push({ id: "title", level: "error", text: "제목이 비어 있습니다." });
  } else if (title.length < 12) {
    checks.push({ id: "title-short", level: "warn", text: `제목이 짧습니다 (${title.length}자, 권장 20~60자).` });
  } else if (title.length > 70) {
    checks.push({ id: "title-long", level: "warn", text: `제목이 너무 깁니다 (${title.length}자, 검색 미리보기에서 잘릴 수 있음).` });
  } else {
    checks.push({ id: "title-ok", level: "ok", text: `제목 길이 양호 (${title.length}자).` });
  }

  // 요약
  if (!excerpt) {
    checks.push({ id: "excerpt", level: "warn", text: "한 줄 요약(excerpt)이 비어 있습니다. SNS·검색 미리보기에서 노출됩니다." });
  } else if (excerpt.length < 60) {
    checks.push({ id: "excerpt-short", level: "warn", text: `요약이 짧습니다 (${excerpt.length}자, 권장 80~160자).` });
  } else if (excerpt.length > 200) {
    checks.push({ id: "excerpt-long", level: "warn", text: "요약이 200자를 초과합니다." });
  } else {
    checks.push({ id: "excerpt-ok", level: "ok", text: `요약 길이 양호 (${excerpt.length}자).` });
  }

  // 썸네일
  if (!thumbnailUrl) {
    checks.push({ id: "thumb", level: "warn", text: "썸네일이 없습니다. SNS 카드 노출이 단조로울 수 있습니다." });
  } else {
    checks.push({ id: "thumb-ok", level: "ok", text: "썸네일 등록됨." });
  }

  // 본문 분석 (DOMParser가 있는 환경에서만)
  if (typeof DOMParser !== "undefined" && html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const h1Count = doc.querySelectorAll("h1").length;
    const h2Count = doc.querySelectorAll("h2").length;
    const imgs = doc.querySelectorAll("img");
    const imgsNoAlt = [...imgs].filter((img) => !img.getAttribute("alt"));
    const text = doc.body?.textContent || "";
    const wordCount = (text.match(/\S+/g) || []).length;

    if (h1Count === 0) checks.push({ id: "h1-none", level: "warn", text: "H1 헤딩이 없습니다." });
    else if (h1Count > 1) checks.push({ id: "h1-many", level: "warn", text: `H1이 ${h1Count}개입니다. 1개 권장.` });
    else checks.push({ id: "h1-ok", level: "ok", text: "H1 1개." });

    if (h2Count === 0 && wordCount > 200) checks.push({ id: "h2-none", level: "warn", text: "H2가 없어 가독성이 떨어질 수 있습니다." });
    else if (h2Count > 0) checks.push({ id: "h2-ok", level: "ok", text: `H2 ${h2Count}개로 구성.` });

    if (imgs.length === 0) checks.push({ id: "img-none", level: "warn", text: "이미지가 없습니다. 시각 자료가 SEO와 가독성에 도움됩니다." });
    if (imgsNoAlt.length > 0) checks.push({ id: "img-alt", level: "warn", text: `alt 텍스트 누락 이미지 ${imgsNoAlt.length}개.` });

    if (wordCount < 300) checks.push({ id: "wc-short", level: "warn", text: `본문이 짧습니다 (${wordCount}단어, 권장 800단어+).` });
    else checks.push({ id: "wc-ok", level: "ok", text: `본문 단어 수 ${wordCount}.` });
  }

  return checks;
}
