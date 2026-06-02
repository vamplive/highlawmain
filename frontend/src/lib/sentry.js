/**
 * 프론트엔드 Sentry 초기화 — DSN 환경변수가 있을 때만 활성화한다.
 *
 * - dev/test에서는 no-op으로 동작해 번들 크기 외 영향이 없다.
 *   (prod 번들에서 Sentry.init이 no-op이면 트리셰이킹 기대)
 * - ErrorBoundary가 fallback UI를 보여주는 사이 Sentry가 예외를 비동기 전송한다.
 */
import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    // 성능 트레이싱은 기본 비활성
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
    // 민감 정보 전송 방지 — 사용자 입력 폼 데이터는 Sentry가 기본 수집하지 않지만
    // URL 쿼리스트링 등이 예기치 않게 들어올 수 있어 방어적으로 제거한다.
    beforeSend(event) {
      if (event.request?.headers?.Cookie) event.request.headers.Cookie = "[REDACTED]";
      return event;
    },
  });
}

/**
 * 예외를 수동으로 Sentry에 보고한다. DSN 미설정 시 no-op.
 * @param {Error|unknown} err
 * @param {Record<string, unknown>} [context]
 */
export function captureException(err, context) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    }
    Sentry.captureException(err);
  });
}

export { Sentry };
