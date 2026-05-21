/** 전역 에러 바운더리 — 렌더 에러 발생 시 사용자 친화적 화면 표시 */
import { Component } from "react";
import { captureException } from "../lib/sentry";

/** 개발 환경에서만 상세 스택을 노출, 운영에서는 간결한 안내 메시지만 표시 */
const isDev = typeof import.meta !== "undefined" && import.meta?.env?.DEV;

// 운영 환경에서도 URL 쿼리에 ?debug=1 이 있으면 에러 상세를 화면에 노출.
// 모바일 단말처럼 콘솔이 안 보이는 환경에서 실제 에러를 운영자가 확인하기 위함.
function isDebugQueryEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "1";
  } catch {
    return false;
  }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Sentry 전송 — DSN 미설정이면 no-op
    captureException(error, { componentStack: errorInfo?.componentStack });
    if (isDev) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          fontFamily: "var(--font-sans-kr, 'Malgun Gothic', sans-serif)",
        }}
      >
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "rgba(26, 58, 107, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              color: "var(--accent-gold, #1a3a6b)",
            }}
            aria-hidden="true"
          >
            !
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary, #1a1a1a)", marginBottom: 12 }}>
            일시적인 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #555)", lineHeight: 1.8, marginBottom: 28 }}>
            페이지를 불러오는 중 문제가 발생했습니다.<br />
            잠시 후 다시 시도해 주시거나, 홈으로 돌아가 주세요.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: "12px 28px",
                minHeight: 44,
                fontSize: 14,
                fontWeight: 500,
                background: "var(--accent-gold, #1a3a6b)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                padding: "12px 28px",
                minHeight: 44,
                fontSize: 14,
                fontWeight: 500,
                background: "transparent",
                color: "var(--text-secondary, #555)",
                border: "1px solid var(--gray-100, #ddd)",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              홈으로 이동
            </button>
          </div>

          {(isDev || isDebugQueryEnabled()) && this.state.error && (
            <details open style={{ marginTop: 32, textAlign: "left", fontSize: 12, color: "#888" }}>
              <summary style={{ cursor: "pointer", marginBottom: 8 }}>개발자용 상세 정보</summary>
              <pre style={{ whiteSpace: "pre-wrap", padding: 12, background: "#f5f5f5", borderRadius: 4, overflow: "auto" }}>
                {this.state.error?.toString()}
                {"\n"}
                {this.state.error?.stack}
                {"\n"}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
