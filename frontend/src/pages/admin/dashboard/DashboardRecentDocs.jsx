/**
 * DashboardRecentDocs — 최근 등록 문서 테이블
 * 대시보드에서 최근 등록된 문서를 유형, 제목, 날짜와 함께 테이블로 표시
 */
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { COLORS, EmptyState } from "../../../components/admin";
import { formatDate } from "../../../utils/formatters";
import { getTypeLabel, getTypeColor } from "../../../utils/document-types";

const RECENT_DOCS_LIMIT = 6;

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
 * 최근 등록 문서 테이블
 * @param {{ documents: Array }} props
 */
export default function DashboardRecentDocs({ documents }) {
  return (
    <DashboardCard>
      <SectionHeader title="최근 등록 문서" />
      {documents?.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.text}` }}>
              <DashboardTh>유형</DashboardTh>
              <DashboardTh>제목</DashboardTh>
              <DashboardTh align="right">날짜</DashboardTh>
            </tr>
          </thead>
          <tbody>
            {documents.slice(0, RECENT_DOCS_LIMIT).map((doc) => (
              <tr
                key={doc.id}
                style={{ borderBottom: `1px solid ${COLORS.borderLight}`, transition: "background 0.15s" }}
                {...rowHoverHandlers}
              >
                <td style={{ padding: "10px 8px 10px 0" }}>
                  <Badge style={{
                    backgroundColor: getTypeColor(doc.documentType),
                    color: "#fff", fontSize: 9, borderRadius: 4, padding: "3px 8px",
                  }}>
                    {getTypeLabel(doc.documentType)}
                  </Badge>
                </td>
                <td style={{ padding: "10px 0" }}>
                  <Link
                    to={`/admin/editor/${doc.id}`}
                    style={{
                      fontSize: 13, color: COLORS.text,
                      textDecoration: "none", fontWeight: 500, transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.text; }}
                  >
                    {doc.title}
                  </Link>
                </td>
                <td style={{
                  padding: "10px 0", textAlign: "right",
                  fontSize: 11, color: COLORS.textMuted,
                }}>
                  {formatDate(doc.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState icon="📄" message="등록된 문서가 없습니다." />
      )}
    </DashboardCard>
  );
}
