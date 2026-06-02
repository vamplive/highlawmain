/**
 * AR Aging — 미수금 연령 분석.
 *
 * 발행되었지만 paid/cancelled/refunded 가 아닌 인보이스를 due_date(없으면 issued_date)
 * 기준 경과일에 따라 5개 버킷으로 분류.
 *  - current: 만기 미도래
 *  - 1-30일 / 31-60일 / 61-90일 / 91일+
 *
 * 표시:
 *  - 버킷별 합계 카드 (위험도 색상)
 *  - 의뢰인별 매수금 표 (각 버킷 + 합계)
 *  - 인보이스 단위 미수금 목록 (가장 오래된 순)
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, thStyle, tdStyle, badgeStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";

function formatKrw(value) {
  if (!value) return "0";
  return Math.round(value).toLocaleString("ko-KR");
}

const BUCKETS = [
  { key: "current", label: "만기 미도래", color: COLORS.success },
  { key: "b30", label: "1-30일", color: "#f59e0b" },
  { key: "b60", label: "31-60일", color: "#ea580c" },
  { key: "b90", label: "61-90일", color: "#dc2626" },
  { key: "bOver", label: "91일+", color: "#7f1d1d" },
];

function bucketLabel(bucket) {
  return BUCKETS.find((b) => b.key === bucket)?.label || bucket;
}
function bucketColor(bucket) {
  return BUCKETS.find((b) => b.key === bucket)?.color || COLORS.muted;
}

export default function ArAgingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [filterBucket, setFilterBucket] = useState("");

  useEffect(() => {
    let cancelled = false;
    /* effect 시작 시 setState 직접 호출은 cascading render 유발 — 다음 microtask 로 미룸 */
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    api.get("/dashboard/ar-aging")
      .then((r) => { if (!cancelled) setData(r.data); })
      .catch((e) => { if (!cancelled) setErr(e.message || "AR 분석을 불러오지 못했습니다"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>;
  }
  if (err) {
    return <ErrorBanner message={err} onDismiss={() => setErr(null)} />;
  }
  if (!data) return null;

  const { totals, clients, invoices } = data;
  const filteredInvoices = filterBucket ? invoices.filter((i) => i.bucket === filterBucket) : invoices;

  return (
    <div>
      <PageHeader
        title="미수금(AR) 연령 분석"
        subtitle="발행되었지만 결제되지 않은 인보이스를 경과일에 따라 분류"
      />
      <RelatedLinks links={ERP_LINKS("/admin/ar-aging")} label="빠른 이동" />

      {totals.totalOutstanding === 0 ? (
        <EmptyState message="현재 미수금이 없습니다. ✓" />
      ) : (
        <>
          {/* 버킷별 합계 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
            <Card label="총 미수금" value={`${formatKrw(totals.totalOutstanding)}원`}
              sub={`${totals.invoiceCount}건`} accent={COLORS.text} large
              onClick={() => setFilterBucket("")} active={!filterBucket} />
            {BUCKETS.map((b) => (
              <Card key={b.key} label={b.label} value={`${formatKrw(totals[b.key])}원`}
                accent={b.color}
                onClick={() => setFilterBucket(filterBucket === b.key ? "" : b.key)}
                active={filterBucket === b.key} />
            ))}
          </div>

          {/* 의뢰인별 표 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
              의뢰인별 미수금
            </h3>
            <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
              <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.bgHeader }}>
                    <th style={thStyle}>의뢰인</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>인보이스</th>
                    {BUCKETS.map((b) => (
                      <th key={b.key} style={{ ...thStyle, textAlign: "right", color: b.color }}>{b.label}</th>
                    ))}
                    <th style={{ ...thStyle, textAlign: "right" }}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.clientId} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td data-label="의뢰인" style={{ ...tdStyle, fontWeight: 600 }}>
                        <Link to={`/admin/clients/${c.clientId}`} style={{ color: COLORS.primary, textDecoration: "none" }}>
                          {c.clientName || "(미상)"}
                        </Link>
                      </td>
                      <td data-label="인보이스" style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>{c.invoiceCount}건</td>
                      {BUCKETS.map((b) => (
                        <td key={b.key} data-label={b.label} style={{ ...tdStyle, textAlign: "right", color: c[b.key] > 0 ? b.color : COLORS.muted, fontWeight: c[b.key] > 0 ? 600 : 400 }}>
                          {c[b.key] > 0 ? formatKrw(c[b.key]) : "-"}
                        </td>
                      ))}
                      <td data-label="합계" style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                        {formatKrw(c.totalOutstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 인보이스 목록 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>
                미수금 인보이스 ({filteredInvoices.length}건)
              </h3>
              {filterBucket && (
                <button onClick={() => setFilterBucket("")} style={btnStyle("ghost")}>
                  필터 해제 ({bucketLabel(filterBucket)})
                </button>
              )}
            </div>
            <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
              <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: COLORS.bgHeader }}>
                    <th style={thStyle}>인보이스</th>
                    <th style={thStyle}>의뢰인</th>
                    <th style={thStyle}>발행일</th>
                    <th style={thStyle}>만기일</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>총액</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>결제</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>미수금</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>경과일</th>
                    <th style={thStyle}>버킷</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td data-label="인보이스" style={tdStyle}>
                        <Link to={`/admin/contracts/${inv.id}`} style={{ color: COLORS.primary, textDecoration: "none" }}>
                          {inv.invoiceNo || inv.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td data-label="의뢰인" style={tdStyle}>
                        <Link to={`/admin/clients/${inv.clientId}`} style={{ color: COLORS.text, textDecoration: "none" }}>
                          {inv.clientName || "-"}
                        </Link>
                      </td>
                      <td data-label="발행일" style={tdStyle}>{inv.issuedDate || "-"}</td>
                      <td data-label="만기일" style={tdStyle}>{inv.dueDate || "-"}</td>
                      <td data-label="총액" style={{ ...tdStyle, textAlign: "right" }}>{formatKrw(inv.total)}</td>
                      <td data-label="결제" style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>{formatKrw(inv.paidAmount)}</td>
                      <td data-label="미수금" style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: bucketColor(inv.bucket) }}>
                        {formatKrw(inv.outstanding)}
                      </td>
                      <td data-label="경과일" style={{ ...tdStyle, textAlign: "right", color: inv.daysOverdue > 0 ? COLORS.danger : COLORS.textMuted }}>
                        {inv.daysOverdue > 0 ? `${inv.daysOverdue}일` : "-"}
                      </td>
                      <td data-label="버킷" style={tdStyle}>
                        <span style={badgeStyle(bucketColor(inv.bucket))}>{bucketLabel(inv.bucket)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ label, value, sub, accent, large, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      padding: large ? "16px 20px" : "12px 16px",
      background: active ? "#f0fdfa" : "#fff",
      border: `1px solid ${active ? accent : COLORS.border}`,
      borderLeft: `4px solid ${accent || COLORS.primary}`,
      borderRadius: 6,
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.1s",
    }}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={(e) => { if (onClick) e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: large ? 22 : 16, fontWeight: 700, color: accent || COLORS.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
