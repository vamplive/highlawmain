/**
 * 정적 HTML 마크업에 대한 axe-core 스모크 테스트.
 *
 * 공개 페이지의 실제 컴포넌트 렌더 대신 대표적인 마크업 패턴을 axe로 검증해
 * 접근성 회귀를 빠르게 잡는다. 의존성 부하가 적고, CI에서 초 단위로 실행된다.
 *
 * 실 페이지 전체 렌더 + 인터랙션은 별도 Playwright 시나리오로 분리(후속 PR).
 */
import { describe, it, expect } from "vitest";
import axe from "axe-core";

/**
 * jsdom 환경에서 안정적으로 돌아가는 룰만 검사한다.
 * color-contrast는 jsdom의 getComputedStyle 한계로 부정확하고,
 * document-title 등 html 레벨 룰은 테스트 픽스처와 무관하므로 제외한다.
 * 실제 대비·문서 제목 등은 Playwright 기반 후속 테스트에서 검증한다.
 */
const JSDOM_SAFE_RULES = [
  "image-alt",
  "label",
  "button-name",
  "link-name",
  "aria-required-attr",
  "aria-dialog-name",
  "landmark-unique",
  "duplicate-id-aria",
];

async function checkHtml(html) {
  document.body.innerHTML = html;
  const results = await axe.run(document.body, {
    resultTypes: ["violations"],
    runOnly: { type: "rule", values: JSDOM_SAFE_RULES },
  });
  return results.violations;
}

describe("정적 마크업 a11y 스모크", () => {
  it("기본 버튼/링크 구조에 위반이 없다", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>법무법인 하이로</h1>
        <p>전문 변호사가 직접 상담합니다.</p>
        <nav aria-label="주요 메뉴">
          <a href="/about">사무소 소개</a>
          <a href="/lawyers">변호사</a>
          <a href="/consultation">상담 신청</a>
        </nav>
        <button type="button">문의하기</button>
      </main>
    `);
    expect(violations).toEqual([]);
  });

  it("이미지에 alt 누락 시 violation을 잡는다 (감지력 검증)", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>상담 안내</h1>
        <img src="/hero.jpg" />
      </main>
    `);
    const ids = violations.map((v) => v.id);
    expect(ids).toContain("image-alt");
  });

  it("폼 필드에 라벨이 있으면 위반이 없다", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>상담 신청</h1>
        <form>
          <label for="name">성함</label>
          <input id="name" type="text" />
          <label for="phone">연락처</label>
          <input id="phone" type="tel" />
          <button type="submit">신청</button>
        </form>
      </main>
    `);
    expect(violations).toEqual([]);
  });

  it("빈 버튼은 button-name 위반을 잡는다", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>페이지</h1>
        <button type="button"></button>
      </main>
    `);
    const ids = violations.map((v) => v.id);
    expect(ids).toContain("button-name");
  });

  it("빈 링크는 link-name 위반을 잡는다", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>페이지</h1>
        <a href="/somewhere"></a>
      </main>
    `);
    const ids = violations.map((v) => v.id);
    expect(ids).toContain("link-name");
  });

  it("다이얼로그에 aria-modal + 라벨이 있으면 위반이 없다", async () => {
    const violations = await checkHtml(`
      <main>
        <h1>페이지</h1>
        <div role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <h2 id="dlg-title">개인정보 동의서</h2>
          <button type="button">닫기</button>
        </div>
      </main>
    `);
    expect(violations).toEqual([]);
  });
});
