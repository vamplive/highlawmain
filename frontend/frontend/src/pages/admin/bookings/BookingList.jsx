/** 예약 현황 리스트 — 예약 카드 목록 + 취소 기능 */
import { EmptyState } from "../../../components/admin";
import { COLORS, outlineBtnStyle } from "../../../components/admin/styles";

/** 예약 상태 -> 뱃지 스타일 매핑 */
const STATUS_MAP = {
  confirmed: { label: "확정", bg: "#e8f5e9", color: "#2e7d32" },
  cancelled: { label: "취소", bg: "#fce4ec", color: "#c62828" },
  pending: { label: "대기", bg: "#fff3e0", color: "#e65100" },
};

/** 개별 예약 항목 행 */
function BookingCard({ booking, onCancel }) {
  const status = STATUS_MAP[booking.status] || STATUS_MAP.pending;

  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "14px 20px", background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}
    >
      <div style={{ flex: 1 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
            {booking.date} {booking.time}
          </span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textSecondary }}>
          {booking.clientName || "상담 #" + (booking.consultationId || booking.id)}
          {booking.lawyerName && <span style={{ color: COLORS.textMuted }}> &middot; {booking.lawyerName}</span>}
        </p>
      </div>
      {booking.status !== "cancelled" && (
        <button onClick={() => onCancel(booking.id)} style={outlineBtnStyle(COLORS.danger)}>
          취소
        </button>
      )}
    </div>
  );
}

export default function BookingList({ bookings, loading, onCancel }) {
  if (loading) {
    return <p style={{ color: COLORS.muted, fontSize: 14 }}>로딩 중...</p>;
  }

  if (bookings.length === 0) {
    return <EmptyState icon="&#x1F4C5;" message="예정된 예약이 없습니다" />;
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} onCancel={onCancel} />
      ))}
    </div>
  );
}
