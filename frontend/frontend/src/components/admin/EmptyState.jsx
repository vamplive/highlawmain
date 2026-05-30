/**
 * 관리자 페이지 빈 상태 표시 컴포넌트
 */
import { COLORS } from "./styles";

export default function EmptyState({ icon = "📋", message = "등록된 항목이 없습니다" }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 32px",
      border: `1px dashed ${COLORS.border}`,
      borderRadius: 12,
      background: COLORS.bgForm,
    }}>
      <p style={{ fontSize: 36, marginBottom: 14, opacity: 0.5 }}>{icon}</p>
      <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0 }}>{message}</p>
    </div>
  );
}
