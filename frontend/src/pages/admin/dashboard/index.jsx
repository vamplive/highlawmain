/**
 * AdminDashboard — 관리자 대시보드
 * 데이터 로딩 및 하위 컴포넌트 조합 (통계 카드, 차트, 최근 문서)
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState, COLORS } from "../../../components/admin";
import { api } from "../../../utils/api";
import DashboardStatCards from "./DashboardStatCards";
import DashboardRecentDocs from "./DashboardRecentDocs";
import { TypeDistributionChart, StatusDistributionTable } from "./DashboardCharts";
import CommandCenter from "./CommandCenter";
import { Button } from "../../../components/ui/Button";
import InviteSendDialog from "../../../components/admin/InviteSendDialog";

/* ── 로딩 스피너 ── */
function LoadingSpinner() {
  return (
    <div style={{ padding: 100, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
      <div style={{
        width: 32, height: 32, border: `2px solid ${COLORS.border}`,
        borderTopColor: COLORS.primary, borderRadius: "50%",
        margin: "0 auto 16px",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      데이터를 불러오는 중...
    </div>
  );
}

/* ── 데이터를 통계 배열로 변환 ── */
function buildStatCards(data, statusMap) {
  return [
    { label: "전체 문서", value: data.totalDocuments ?? 0 },
    { label: "금주 신규", value: data.thisWeek ?? 0, accent: true },
    { label: "열람 중", value: statusMap.reading ?? 0 },
    { label: "완독 처리", value: statusMap.completed ?? 0 },
  ];
}

/* ── byStatus / byType 배열을 맵 객체로 변환 ── */
function arrayToMap(arr, keyField) {
  const map = {};
  if (Array.isArray(arr)) {
    arr.forEach((item) => { map[item[keyField]] = item.count; });
  }
  return map;
}

/* ── 메인 대시보드 컴포넌트 ── */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then((json) => setData(json.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!data) {
    return (
      <EmptyState icon="⚠️" message="대시보드 데이터를 불러올 수 없습니다" />
    );
  }

  const statusMap = arrayToMap(data.byStatus, "status");
  const typeMap = arrayToMap(data.byType, "documentType");
  const stats = buildStatCards(data, statusMap);

  return (
    <div>
      <PageHeader title="법무법인 하이로 운영 본부" subtitle="COMMAND CENTER" />

      <QuickActions />

      {/* 새 커맨드 센터 — 모든 모듈 한눈에 */}
      <CommandCenter />

      {/* 문서 통계 — 보조 영역 */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{
          fontSize: 12, fontWeight: 700, color: "var(--text-muted, #888)",
          letterSpacing: "0.18em", textTransform: "uppercase",
          margin: "0 0 10px",
        }}>
          문서 라이브러리 통계
        </h2>
        <DashboardStatCards stats={stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginTop: 16 }}>
          <TypeDistributionChart typeMap={typeMap} />
          <DashboardRecentDocs documents={data.recentDocuments} />
          <StatusDistributionTable statusMap={statusMap} totalDocuments={data.totalDocuments} />
        </div>
      </div>
    </div>
  );
}

/** 빠른 액션 — 상담 링크 빠른 발송 */
function QuickActions() {
  const [sendOpen, setSendOpen] = useState(false);
  return (
    <div className="mb-6 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">오늘 바로 처리할 업무</p>
          <p className="text-xs text-gray-600">초대 링크 발송, 전체 발송 현황, 일반 메시지 발송을 구분해서 시작합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSendOpen(true)}>초대 링크 발송</Button>
          <Button asChild variant="outline">
            <Link to="/admin/invitations">발송 링크 현황</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/messages">메시지 발송</Link>
          </Button>
        </div>
      </div>
      <InviteSendDialog open={sendOpen} onClose={() => setSendOpen(false)} defaultType="consultation" title="빠른 링크 발송" />
    </div>
  );
}
