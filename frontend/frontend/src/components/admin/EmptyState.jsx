/**
 * 관리자 페이지 빈 상태 표시 컴포넌트
 * — "등록된 항목이 없습니다" 패턴을 통합
 */
export default function EmptyState({ icon = "📋", message = "등록된 항목이 없습니다" }) {
  return (
    <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>{icon}</p>
      <p>{message}</p>
    </div>
  );
}
