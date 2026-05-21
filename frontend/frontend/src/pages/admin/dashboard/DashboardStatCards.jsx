/**
 * DashboardStatCards — 대시보드 통계 카드 그리드
 * 전체 문서 수, 금주 신규, 열람 중, 완독 처리 등 주요 지표를 카드 형태로 표시
 */
import { COLORS } from "../../../components/admin";

/**
 * 단일 통계 카드 — 라벨과 숫자 값을 표시한다.
 * @param {{ label: string, value: number|string, accent?: boolean }} props
 */
function StatCard({ label, value, accent = false }) {
  const bgStyle = accent
    ? { background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2a2a4e 100%)` }
    : { background: "#fff", border: `1px solid ${COLORS.border}` };

  return (
    <div
      style={{
        ...bgStyle,
        borderRadius: 12,
        padding: "22px 26px",
        boxShadow: accent
          ? "0 8px 32px rgba(26,26,46,0.2)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = accent
          ? "0 12px 40px rgba(26,26,46,0.3)"
          : "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = accent
          ? "0 8px 32px rgba(26,26,46,0.2)"
          : "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <p style={{
        fontSize: 10, fontWeight: 600,
        color: accent ? "rgba(255,255,255,0.75)" : COLORS.textMuted,
        letterSpacing: "0.14em", textTransform: "uppercase",
        marginBottom: 12,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 38, fontWeight: 200,
        color: accent ? "#ffffff" : COLORS.text,
        lineHeight: 1, fontFamily: "'Inter', sans-serif",
      }}>
        {value}
      </p>
    </div>
  );
}

/**
 * 통계 카드 그리드
 * @param {{ stats: Array<{ label: string, value: number, accent?: boolean }> }} props
 */
export default function DashboardStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 40 }}>
      {stats.map((s, i) => (
        <StatCard key={i} label={s.label} value={s.value} accent={s.accent} />
      ))}
    </div>
  );
}
