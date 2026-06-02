/**
 * 개발 환경 전용 접근성 자동 검사.
 *
 * - axe-core를 dynamic import로 로드하여 프로덕션 번들 영향 없음
 *   (import.meta.env.DEV 가드 + dynamic import → 트리셰이킹으로 prod에서 제거)
 * - 라우트 전환 시점마다 디바운스로 axe.run 1회 실행
 * - 결과는 콘솔 그룹으로 출력 (critical/serious만 요약, moderate/minor는 접힘)
 * - 운영 환경에선 아무 일도 일어나지 않는다.
 *
 * 사용: main.jsx에서 `if (import.meta.env.DEV) import('./lib/a11yDevChecker').then(m => m.start());`
 */

let running = false;
let timer = null;

/** axe 결과에서 심각도별로 묶어 콘솔 그룹으로 출력 */
function printResults(violations) {
  if (!violations?.length) {
    console.log("%c[a11y] 위반 없음", "color:#0a7;");
    return;
  }

  const grouped = {
    critical: violations.filter((v) => v.impact === "critical"),
    serious: violations.filter((v) => v.impact === "serious"),
    moderate: violations.filter((v) => v.impact === "moderate"),
    minor: violations.filter((v) => v.impact === "minor"),
  };

  console.groupCollapsed(
    `%c[a11y] 위반 ${violations.length}건 ` +
    `(critical: ${grouped.critical.length}, serious: ${grouped.serious.length}, ` +
    `moderate: ${grouped.moderate.length}, minor: ${grouped.minor.length})`,
    "color:#c62828;font-weight:bold;"
  );
  for (const level of ["critical", "serious", "moderate", "minor"]) {
    if (!grouped[level].length) continue;
    console.groupCollapsed(`${level.toUpperCase()} (${grouped[level].length})`);
    for (const v of grouped[level]) {
      console.log(`• ${v.help}`, {
        id: v.id,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => n.target).flat(),
      });
    }
    console.groupEnd();
  }
  console.groupEnd();
}

/**
 * 개발 환경에서 a11y 자동 검사를 시작한다.
 * 라우트 변경 후 1초 디바운스로 axe를 실행해 콘솔에 결과를 출력한다.
 */
export async function start() {
  if (running) return;
  running = true;

  const axe = (await import("axe-core")).default || (await import("axe-core"));

  async function runCheck() {
    try {
      const results = await axe.run(document, {
        resultTypes: ["violations"],
        // 대규모 SPA에서 실행 시간 단축
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
      });
      printResults(results.violations);
    } catch (err) {
      console.warn("[a11y] 검사 실패:", err?.message || err);
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(runCheck, 1000);
  }

  // 초기 1회 + pushState/popstate 훅
  schedule();
  const origPush = history.pushState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args);
    schedule();
    return r;
  };
  window.addEventListener("popstate", schedule);
}
