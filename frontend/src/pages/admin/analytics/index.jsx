/** 관리자 방문 분석 대시보드 — 조회수, 방문자, 전환율 통계 및 차트 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { PageHeader, COLORS, btnStyle } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";
import { PERIODS } from "./analyticsConstants";
import OverviewTab from "./OverviewTab";
import PagesTab from "./PagesTab";
import ReferrersTab from "./ReferrersTab";

/* ── 기간 선택 버튼 그룹 ── */
function PeriodSelector({ period, onChange }) {
  return (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
      {PERIODS.map((p) => {
        const active = period === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: active ? 600 : 400,
              border: "none", cursor: "pointer",
              background: active ? COLORS.accent : "#fff",
              color: active ? "#fff" : COLORS.textSecondary,
              transition: "all .15s",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState(null);
  const [pages, setPages] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── 데이터 로드 ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, pgRes, refRes, cvRes] = await Promise.all([
        api.get(`/analytics/overview?period=${period}`),
        api.get(`/analytics/pages?period=${period}&limit=10`),
        api.get(`/analytics/referrers?period=${period}&limit=10`),
        api.get(`/analytics/consultations/conversion?period=${period}`),
      ]);
      setOverview(ovRes.data ?? null);
      setPages(pgRes.data ?? []);
      setReferrers(refRes.data ?? []);
      setConversion(cvRes.data ?? null);
    } catch {
      setOverview(null);
      setPages([]);
      setReferrers([]);
      setConversion(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── CSV 내보내기 ── */
  const downloadCSV = async () => {
    try {
      const res = await fetch(`/api/analytics/export?period=${period}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("CSV 다운로드에 실패했습니다.");
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader title="방문 분석" subtitle="사이트 트래픽 및 전환 지표를 확인합니다">
        <PeriodSelector period={period} onChange={setPeriod} />
        <button onClick={downloadCSV} style={btnStyle(COLORS.accent)}>CSV 내보내기</button>
      </PageHeader>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: COLORS.textMuted }}>
          데이터를 불러오는 중...
        </div>
      ) : (
        <>
          <OverviewTab overview={overview} conversion={conversion} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <PagesTab pages={pages} />
            <ReferrersTab referrers={referrers} />
          </div>
        </>
      )}
    </div>
  );
}
