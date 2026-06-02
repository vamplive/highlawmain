/** 방문 분석 — 상담 전환율 지표 (placeholder — 데이터 연결 시 확장) */
import { COLORS } from "../../../components/admin";
import { cardWrapper, sectionTitle, formatNumber, formatPercent } from "./analyticsConstants";

/** 전환율 메트릭 카드 */
function MetricRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0", borderBottom: `1px solid ${COLORS.border}`,
    }}>
      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{value}</span>
    </div>
  );
}

/** 상담 전환 지표 탭 */
export default function ConversionTab({ conversion }) {
  if (!conversion) {
    return (
      <div style={cardWrapper}>
        <h2 style={sectionTitle}>상담 전환 지표</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", padding: 40 }}>
          전환 데이터가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div style={cardWrapper}>
      <h2 style={sectionTitle}>상담 전환 지표</h2>
      <MetricRow label="총 상담 신청" value={formatNumber(conversion.totalConsultations)} />
      <MetricRow label="전환율" value={formatPercent(conversion.rate)} />
      <MetricRow label="총 페이지뷰" value={formatNumber(conversion.totalViews)} />
    </div>
  );
}
