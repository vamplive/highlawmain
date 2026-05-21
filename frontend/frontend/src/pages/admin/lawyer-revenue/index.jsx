/**
 * 변호사별 매출 / 생산성 분석 — 시간기록 기반.
 *
 * 표시:
 *  - 기간 필터 (default: 최근 30일)
 *  - 변호사별 통계 테이블: 총 시간 / 청구 가능 / 청구 완료 금액 / 미청구 금액 /
 *    가용성(billable ratio %) / 항목 수
 *  - 합계 행
 *  - 막대 차트(실시간 SVG) — 청구완료 + 미청구 stacked
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, fieldStyle, labelStyle, thStyle, tdStyle, btnStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";

function formatKrw(value) {
  if (!value) return "0";
  return Math.round(value).toLocaleString("ko-KR");
}

function formatHours(minutes) {
  if (!minutes) return "0";
  return (minutes / 60).toFixed(1);
}

/**
 * 변호사 매출 막대 차트 — billed (녹색) + unbilled (주황) stacked.
 */
function RevenueBarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.billedAmountKrw + d.unbilledAmountKrw), 1);
  const barHeight = 22;
  const labelWidth = 100;
  const valueWidth = 110;
  const chartWidth = 320;

  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>매출 (청구완료 + 미청구)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((d) => {
          const total = d.billedAmountKrw + d.unbilledAmountKrw;
          const billedW = total > 0 ? (d.billedAmountKrw / max) * chartWidth : 0;
          const unbilledW = total > 0 ? (d.unbilledAmountKrw / max) * chartWidth : 0;
          return (
            <div key={d.lawyerId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <div style={{ width: labelWidth, color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.name}>
                {d.name}
              </div>
              <div style={{ flex: 1, position: "relative", height: barHeight, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                {billedW > 0 && (
                  <div title={`청구완료 ${formatKrw(d.billedAmountKrw)}원`}
                    style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: billedW, background: "#10b981" }} />
                )}
                {unbilledW > 0 && (
                  <div title={`미청구 ${formatKrw(d.unbilledAmountKrw)}원`}
                    style={{ position: "absolute", left: billedW, top: 0, bottom: 0, width: unbilledW, background: "#f59e0b" }} />
                )}
              </div>
              <div style={{ width: valueWidth, textAlign: "right", color: COLORS.text, fontWeight: 600 }}>
                {formatKrw(total)}원
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: COLORS.textMuted }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#10b981", marginRight: 4, verticalAlign: "middle", borderRadius: 2 }} /> 청구완료</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f59e0b", marginRight: 4, verticalAlign: "middle", borderRadius: 2 }} /> 미청구</span>
      </div>
    </div>
  );
}

export default function LawyerRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = (() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await api.get(`/dashboard/lawyer-revenue?from=${from}&to=${to}`);
      setData(r.data);
    } catch (e) {
      setErr(e.message || "분석 데이터를 불러오지 못했습니다");
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const setRange = (days) => {
    const d = new Date();
    const end = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() - days);
    const start = d.toISOString().slice(0, 10);
    setFrom(start); setTo(end);
  };

  const lawyers = data?.lawyers || [];
  const totals = lawyers.reduce((acc, l) => ({
    totalMinutes: acc.totalMinutes + l.totalMinutes,
    billableMinutes: acc.billableMinutes + l.billableMinutes,
    billedAmountKrw: acc.billedAmountKrw + l.billedAmountKrw,
    unbilledAmountKrw: acc.unbilledAmountKrw + l.unbilledAmountKrw,
    entryCount: acc.entryCount + l.entryCount,
  }), { totalMinutes: 0, billableMinutes: 0, billedAmountKrw: 0, unbilledAmountKrw: 0, entryCount: 0 });

  return (
    <div>
      <PageHeader
        title="변호사별 매출 분석"
        subtitle="시간 기록 기반 매출·생산성 지표 — 누가 얼마 일했고 얼마를 청구했는지"
      />
      <RelatedLinks links={ERP_LINKS("/admin/lawyer-revenue")} label="빠른 이동" />
      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      {/* 기간 필터 */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap",
        marginBottom: 16, padding: 12, background: COLORS.bgForm,
        border: `1px solid ${COLORS.border}`, borderRadius: 8,
      }}>
        <div>
          <label style={labelStyle}>시작일</label>
          <input style={fieldStyle} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>종료일</label>
          <input style={fieldStyle} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setRange(7)} style={btnStyle("ghost")}>최근 7일</button>
          <button onClick={() => setRange(30)} style={btnStyle("ghost")}>최근 30일</button>
          <button onClick={() => setRange(90)} style={btnStyle("ghost")}>최근 90일</button>
          <button onClick={() => setRange(365)} style={btnStyle("ghost")}>최근 1년</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>
      ) : lawyers.length === 0 ? (
        <EmptyState message="변호사가 없거나 해당 기간에 시간 기록이 없습니다." />
      ) : (
        <>
          {/* 합계 카드 */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Card label="총 변호사" value={`${lawyers.length}명`} />
            <Card label="총 기록 수" value={`${totals.entryCount}건`} />
            <Card label="총 시간" value={`${formatHours(totals.totalMinutes)}h`} />
            <Card label="청구 가능 시간" value={`${formatHours(totals.billableMinutes)}h`} accent="#0891b2" />
            <Card label="청구 완료 금액" value={`${formatKrw(totals.billedAmountKrw)}원`} accent={COLORS.success} />
            <Card label="미청구 금액" value={`${formatKrw(totals.unbilledAmountKrw)}원`} accent="#c2410c" />
          </div>

          {/* 차트 */}
          <div style={{ marginBottom: 16 }}>
            <RevenueBarChart data={lawyers.filter((l) => l.entryCount > 0)} />
          </div>

          {/* 표 */}
          <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
            <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.bgHeader }}>
                  <th style={thStyle}>변호사</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>시급(원)</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>총 시간</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>청구가능</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>가용률</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>청구완료</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>미청구</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>총 매출</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>기록 수</th>
                </tr>
              </thead>
              <tbody>
                {lawyers.map((l) => {
                  const total = l.billedAmountKrw + l.unbilledAmountKrw;
                  const ratio = (l.billableRatio * 100).toFixed(0);
                  const ratioColor = l.billableRatio >= 0.7 ? COLORS.success
                    : l.billableRatio >= 0.4 ? "#c2410c" : COLORS.danger;
                  return (
                    <tr key={l.lawyerId} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td data-label="변호사" style={{ ...tdStyle, fontWeight: 600 }}>{l.name}</td>
                      <td data-label="시급(원)" style={{ ...tdStyle, textAlign: "right", color: l.defaultHourlyRateKrw ? COLORS.text : COLORS.muted }}>
                        {l.defaultHourlyRateKrw ? formatKrw(l.defaultHourlyRateKrw) : "미설정"}
                      </td>
                      <td data-label="총 시간" style={{ ...tdStyle, textAlign: "right" }}>{formatHours(l.totalMinutes)}h</td>
                      <td data-label="청구가능" style={{ ...tdStyle, textAlign: "right", color: "#0891b2" }}>{formatHours(l.billableMinutes)}h</td>
                      <td data-label="가용률" style={{ ...tdStyle, textAlign: "right", color: ratioColor, fontWeight: 600 }}>
                        {l.totalMinutes > 0 ? `${ratio}%` : "-"}
                      </td>
                      <td data-label="청구완료" style={{ ...tdStyle, textAlign: "right", color: COLORS.success, fontWeight: 600 }}>
                        {formatKrw(l.billedAmountKrw)}
                      </td>
                      <td data-label="미청구" style={{ ...tdStyle, textAlign: "right", color: "#c2410c", fontWeight: 600 }}>
                        {formatKrw(l.unbilledAmountKrw)}
                      </td>
                      <td data-label="총 매출" style={{ ...tdStyle, textAlign: "right", color: COLORS.text, fontWeight: 700 }}>
                        {formatKrw(total)}
                      </td>
                      <td data-label="기록 수" style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>{l.entryCount}</td>
                    </tr>
                  );
                })}
                {/* 합계 행 */}
                <tr style={{ borderTop: `2px solid ${COLORS.border}`, background: "#f8fafc" }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>합계</td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatHours(totals.totalMinutes)}h</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#0891b2" }}>{formatHours(totals.billableMinutes)}h</td>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: COLORS.success }}>{formatKrw(totals.billedAmountKrw)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#c2410c" }}>{formatKrw(totals.unbilledAmountKrw)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatKrw(totals.billedAmountKrw + totals.unbilledAmountKrw)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{totals.entryCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div style={{
      flex: 1, minWidth: 130, padding: "12px 16px",
      background: "#fff", border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${accent || COLORS.primary}`,
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent || COLORS.text }}>{value}</div>
    </div>
  );
}
