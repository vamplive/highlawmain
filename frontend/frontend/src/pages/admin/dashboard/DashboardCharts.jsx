/**
 * DashboardCharts — 문서 유형 분포 차트 및 상태별 현황 테이블
 * 대시보드에서 문서 유형 분포를 바 차트로, 처리 현황을 테이블로 표시
 */
import { COLORS } from "../../../components/admin";
import { getTypeLabel, getTypeColor, ALL_DOCUMENT_TYPES } from "../../../utils/document-types";

const STATUS_LABELS = {
  inbox: "수신 대기",
  reading: "열람 중",
  completed: "처리 완료",
  archived: "보관 처리",
  reference: "참고 자료",
};

/* ── 섹션 헤더 ── */
function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 3, height: 16, borderRadius: 2,
        background: `linear-gradient(180deg, ${COLORS.primary} 0%, rgba(26,26,46,0.3) 100%)`,
      }} />
      <h3 style={{
        fontSize: 12, fontWeight: 600, color: COLORS.text,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        {title}
      </h3>
    </div>
  );
}

/* ── 카드 래퍼 ── */
function DashboardCard({ children }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "28px 30px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      {children}
    </div>
  );
}

/* ── 테이블 헤더 셀 ── */
function DashboardTh({ children, align = "left" }) {
  return (
    <th style={{
      textAlign: align, padding: "8px 0", fontSize: 9, fontWeight: 600,
      color: COLORS.textMuted, letterSpacing: "0.14em", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

/* ── 테이블 행 hover 핸들러 ── */
const rowHoverHandlers = {
  onMouseEnter: (e) => { e.currentTarget.style.background = "#f8f9fc"; },
  onMouseLeave: (e) => { e.currentTarget.style.background = "transparent"; },
};

/**
 * 문서 유형 분포 바 차트
 * @param {{ typeMap: Record<string, number> }} props
 */
export function TypeDistributionChart({ typeMap }) {
  const maxCount = Math.max(1, ...Object.values(typeMap).map(Number).filter(Boolean));

  return (
    <DashboardCard>
      <SectionHeader title="문서 유형 분포" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ALL_DOCUMENT_TYPES.map((type) => {
          const count = typeMap[type] || 0;
          const pct = (count / maxCount) * 100;
          return (
            <div key={type} className="flex items-center gap-3">
              <span style={{
                width: 56, fontSize: 11.5, color: COLORS.text,
                fontWeight: 500, letterSpacing: "0.02em",
              }}>
                {getTypeLabel(type)}
              </span>
              <div style={{
                flex: 1, height: 22, background: "#f3f5f8",
                borderRadius: 6, overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: `linear-gradient(90deg, ${getTypeColor(type)}, ${getTypeColor(type)}cc)`,
                  borderRadius: 6,
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }} />
              </div>
              <span style={{
                width: 32, fontSize: 12, color: COLORS.textSecondary,
                textAlign: "right", fontWeight: 600,
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

/**
 * 상태별 분포 테이블
 * @param {{ statusMap: Record<string, number>, totalDocuments: number }} props
 */
export function StatusDistributionTable({ statusMap, totalDocuments }) {
  const total = totalDocuments || 1;

  return (
    <DashboardCard>
      <SectionHeader title="처리 현황" />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.text}` }}>
            <DashboardTh>상태</DashboardTh>
            <DashboardTh align="right">건수</DashboardTh>
            <DashboardTh align="right">비율</DashboardTh>
          </tr>
        </thead>
        <tbody>
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = statusMap[key] || 0;
            const pct = ((count / total) * 100).toFixed(1);
            return (
              <tr
                key={key}
                style={{ borderBottom: `1px solid ${COLORS.borderLight}`, transition: "background 0.15s" }}
                {...rowHoverHandlers}
              >
                <td style={{ padding: "11px 0", fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                  {label}
                </td>
                <td style={{ padding: "11px 0", textAlign: "right", fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                  {count}
                </td>
                <td style={{ padding: "11px 0", textAlign: "right", fontSize: 12, color: COLORS.textMuted }}>
                  {pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardCard>
  );
}
