/** API 오류 시 표시할 안내 + 재시도 버튼 — 리스트 페이지 공통 사용 */

/**
 * @param {{ title?: string, message?: string, onRetry?: () => void }} props
 */
export default function ErrorState({
  title = "콘텐츠를 불러오지 못했습니다",
  message = "잠시 후 다시 시도해 주세요.",
  onRetry,
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        textAlign: "center",
        padding: "64px 24px",
        color: "var(--text-secondary)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 16px",
          borderRadius: "50%",
          background: "rgba(26, 58, 107, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-gold)",
          fontSize: 24,
          fontWeight: 300,
        }}
      >
        !
      </div>
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: onRetry ? 24 : 0 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "10px 24px",
            minHeight: 44,
            fontSize: 13,
            fontWeight: 500,
            background: "var(--accent-gold)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
