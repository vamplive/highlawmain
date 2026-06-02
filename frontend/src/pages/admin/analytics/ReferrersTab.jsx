/** 방문 분석 — 유입 경로 테이블 */
import { COLORS, EmptyState, thStyle, tdStyle } from "../../../components/admin";
import {
  PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS, CHART_COLORS,
  cardWrapper, sectionTitle, formatNumber,
} from "./analyticsConstants";

/** 유입 경로 테이블 전용 헤더 스타일 */
const referrerThStyle = {
  ...thStyle,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: `2px solid ${COLORS.border}`,
};

/** 유입 경로 테이블 */
function ReferrerTable({ data }) {
  if (!data?.length) {
    return <EmptyState icon="🔗" message="유입 경로 데이터가 없습니다" />;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={referrerThStyle}>유입 경로</th>
          <th style={{ ...referrerThStyle, textAlign: "right", width: 80 }}>방문수</th>
          <th style={{ ...referrerThStyle, width: "40%" }}>비율</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <td style={tdStyle}>
              <span style={{ color: COLORS.text, fontWeight: 500 }}>
                {item.referrer || "(직접 방문)"}
              </span>
            </td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: COLORS.accent }}>
              {formatNumber(item.count)}
            </td>
            <td style={tdStyle}>
              <div style={{
                height: PROGRESS_BAR_HEIGHT, borderRadius: PROGRESS_BAR_RADIUS,
                background: CHART_COLORS.barBgLight, overflow: "hidden",
              }}>
                <div style={{
                  width: `${(item.count / maxCount) * 100}%`, height: "100%",
                  borderRadius: PROGRESS_BAR_RADIUS,
                  background: `linear-gradient(90deg, ${CHART_COLORS.barGradientStart}, ${CHART_COLORS.barGradientEnd})`,
                  transition: "width .3s ease",
                }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 유입 경로 탭 */
export default function ReferrersTab({ referrers }) {
  return (
    <div style={cardWrapper}>
      <h2 style={sectionTitle}>유입 경로 (Top 10)</h2>
      <ReferrerTable data={referrers} />
    </div>
  );
}
