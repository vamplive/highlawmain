/**
 * 인라인 에러 배너 — alert() 대체
 * — useCrudForm의 error 상태를 화면에 표시
 */
import { COLORS } from "./styles";

/**
 * @param {{ message: string|null, onDismiss?: Function }} props
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        padding: "12px 16px",
        marginBottom: 16,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 6,
        color: COLORS.danger,
        fontSize: 13,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: COLORS.danger, padding: "0 4px" }}
          aria-label="에러 닫기"
        >
          ×
        </button>
      )}
    </div>
  );
}
