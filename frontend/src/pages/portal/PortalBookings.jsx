/**
 * 포털 예약 관리 — 내부 구성원(변호사·직원) 전용
 * 예약된 상담 슬롯 조회 및 취소
 */
import { useState, useEffect, useCallback } from "react";
import { portalApi } from "../../utils/api";
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";

const COLORS = {
  accent: "#1a3a6b",
  muted: "#94a3b8",
  border: "#e2e8f0",
  danger: "#ef4444",
  text: "#0f172a",
  bg: "#f8fafc",
  success: "#10b981",
};

/** HH:MM 포맷 시간 슬롯을 오전/오후 형식으로 */
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${period} ${hour}:${String(m).padStart(2, "0")}`;
}

/** YYYY-MM-DD 날짜를 한국어 형식으로 */
function formatKorDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function PortalBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [cancelling, setCancelling] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.get(`/bookings?page=${page}&limit=20`);
      setBookings(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      if (err.status === 403) {
        setError("내부 구성원만 이용할 수 있습니다.");
      } else {
        setError(err.message || "예약 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleCancel = async (id) => {
    if (!confirm("이 예약을 취소하시겠습니까? 슬롯이 다시 예약 가능 상태로 변경됩니다.")) return;
    setCancelling(id);
    try {
      await portalApi.post(`/bookings/cancel/${id}`);
      loadBookings();
    } catch (err) {
      alert(err.message || "예약 취소에 실패했습니다.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>예약 관리</h1>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 0" }}>
          예약 완료된 상담 슬롯 — 총 {meta.total}건
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: COLORS.danger, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              {["날짜", "시간", "슬롯 ID", "상담 ID", "상태", ""].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px", fontSize: 11, fontWeight: 600,
                  color: COLORS.muted, textAlign: "left", letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: COLORS.muted }}>불러오는 중...</td></tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 56, color: COLORS.muted }}>
                  <CalendarX size={32} style={{ display: "block", margin: "0 auto 12px", opacity: 0.4 }} />
                  예약된 슬롯이 없습니다
                </td>
              </tr>
            ) : bookings.map((slot) => (
              <tr key={slot.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.text }}>
                  {formatKorDate(slot.date)}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>
                  {formatTime(slot.startTime)} ~ {formatTime(slot.endTime)}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
                  {slot.id?.slice(0, 8)}…
                </td>
                <td style={{ padding: "12px 14px", fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
                  {slot.consultationId ? slot.consultationId.slice(0, 8) + "…" : "-"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500,
                    background: "#dcfce7", color: COLORS.success,
                  }}>예약 완료</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <button
                    onClick={() => handleCancel(slot.id)}
                    disabled={cancelling === slot.id}
                    style={{
                      padding: "4px 10px", fontSize: 11,
                      border: `1px solid #fca5a5`, borderRadius: 5,
                      background: "#fff", color: COLORS.danger,
                      cursor: cancelling === slot.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {cancelling === slot.id ? "취소 중..." : "예약 취소"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: COLORS.muted }}>{page} / {meta.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
