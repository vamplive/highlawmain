/**
 * 감사 로그 조회 — 일별 JSONL 파일을 화면에서 검색·필터·요약.
 *
 * admin 전용. 누가 언제 어떤 리소스에 무슨 행위를 했는지 추적.
 * - 날짜 셀렉터(최근 30일)
 * - resource/action/userName/free-text 필터
 * - 요약 카드(총건/액션별/리소스별/사용자별 상위 5)
 * - 결과 테이블(최신순, 200건 기본)
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, badgeStyle, thStyle, tdStyle, fieldStyle, labelStyle,
  PageHeader, EmptyState, ErrorBanner,
} from "../../../components/admin";
import { formatDateTime } from "../../../utils/formatters";

const RESOURCE_OPTIONS = [
  "", "invoices", "payment_cards", "receipts", "messages", "clients",
  "consultations", "contracts", "bookings", "admin_users", "security",
];
const ACTION_OPTIONS = [
  "", "create", "update", "delete", "login", "logout", "pii_access",
  "login_fail.bad_password", "login_fail.no_user", "csrf_reject",
];

function ActionBadge({ action }) {
  const color =
    action.startsWith("delete") ? COLORS.danger
    : action.startsWith("create") ? COLORS.success
    : action.startsWith("update") ? COLORS.warning
    : action.startsWith("login_fail") || action === "csrf_reject" ? COLORS.danger
    : COLORS.muted;
  return <span style={badgeStyle(color)}>{action}</span>;
}

function SummaryCards({ summary }) {
  if (!summary) return null;
  const topUsers = Object.entries(summary.byUser || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topResources = Object.entries(summary.byResource || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cardStyle = {
    flex: 1, minWidth: 180,
    padding: "14px 18px",
    background: "#fff",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  };
  const titleStyle = { fontSize: 11, color: COLORS.textMuted, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" };

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
      <div style={cardStyle}>
        <div style={titleStyle}>총 이벤트</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text }}>{summary.total}</div>
      </div>
      <div style={cardStyle}>
        <div style={titleStyle}>리소스 TOP 5</div>
        {topResources.length === 0 ? <span style={{ color: COLORS.muted }}>-</span> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
            {topResources.map(([k, v]) => (
              <li key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{k}</span><span style={{ color: COLORS.textMuted }}>{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={cardStyle}>
        <div style={titleStyle}>사용자 TOP 5</div>
        {topUsers.length === 0 ? <span style={{ color: COLORS.muted }}>-</span> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
            {topUsers.map(([k, v]) => (
              <li key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{k}</span><span style={{ color: COLORS.textMuted }}>{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailsCell({ details }) {
  if (!details) return <span style={{ color: COLORS.muted }}>-</span>;
  const text = typeof details === "string" ? details : JSON.stringify(details);
  return (
    <span title={text} style={{
      fontSize: 12, color: COLORS.textSecondary,
      display: "inline-block", maxWidth: 360,
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>{text}</span>
  );
}

export default function AuditLogsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [userName, setUserName] = useState("");
  const [q, setQ] = useState("");
  const [dates, setDates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ total: 0, returned: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const loadDates = useCallback(async () => {
    try {
      const r = await api.get("/audit-logs/dates");
      setDates(r.data || []);
    } catch (e) {
      // 권한 부족 등은 메인 fetch에서도 동일하게 잡힘
      setErr(e.message || "날짜 목록을 불러오지 못했습니다");
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ date });
      if (resource) params.set("resource", resource);
      if (action) params.set("action", action);
      if (userName) params.set("userName", userName);
      if (q) params.set("q", q);
      const [list, sum] = await Promise.all([
        api.get(`/audit-logs?${params.toString()}`),
        api.get(`/audit-logs/summary?date=${date}`),
      ]);
      setLogs(list.data || []);
      setMeta(list.meta || { total: 0, returned: 0 });
      setSummary(sum.data || null);
    } catch (e) {
      setErr(e.message || "로그를 불러오지 못했습니다");
      setLogs([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [date, resource, action, userName, q]);

  useEffect(() => { loadDates(); }, [loadDates]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <PageHeader
        title="감사 로그"
        subtitle="관리자 행위 추적 — 누가 언제 무엇을 했는지"
      />

      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      {/* 필터 영역 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12, marginBottom: 20,
        padding: 16,
        background: COLORS.bgForm,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
      }}>
        <div>
          <label style={labelStyle}>날짜</label>
          <select style={fieldStyle} value={date} onChange={(e) => setDate(e.target.value)}>
            {!dates.includes(date) && <option value={date}>{date}</option>}
            {dates.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>리소스</label>
          <select style={fieldStyle} value={resource} onChange={(e) => setResource(e.target.value)}>
            {RESOURCE_OPTIONS.map((r) => <option key={r} value={r}>{r || "전체"}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>액션</label>
          <select style={fieldStyle} value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a || "전체"}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>사용자</label>
          <input style={fieldStyle} placeholder="이름 부분일치" value={userName} onChange={(e) => setUserName(e.target.value)} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={labelStyle}>검색어 (IP/리소스ID/세부정보)</label>
          <input style={fieldStyle} placeholder="예: 192.168 / inv-12 / clientId" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={fetchLogs} style={btnStyle()}>{loading ? "조회 중..." : "조회"}</button>
        </div>
      </div>

      <SummaryCards summary={summary} />

      <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.textMuted }}>
        총 {meta.total}건 중 {meta.returned}건 표시 (최대 1000)
      </div>

      {logs.length === 0 ? (
        <EmptyState icon="📜" message={loading ? "로딩 중..." : "조건에 맞는 감사 로그가 없습니다"} />
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ ...thStyle, fontSize: 11, width: 165 }}>일시</th>
                <th style={{ ...thStyle, fontSize: 11, width: 130 }}>액션</th>
                <th style={{ ...thStyle, fontSize: 11, width: 120 }}>리소스</th>
                <th style={{ ...thStyle, fontSize: 11, width: 200 }}>리소스 ID</th>
                <th style={{ ...thStyle, fontSize: 11, width: 110 }}>사용자</th>
                <th style={{ ...thStyle, fontSize: 11, width: 120 }}>IP</th>
                <th style={{ ...thStyle, fontSize: 11 }}>세부</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((e, i) => (
                <tr key={`${e.timestamp}-${i}`} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                    {formatDateTime(e.timestamp)}
                  </td>
                  <td style={tdStyle}><ActionBadge action={e.action} /></td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{e.resource}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>
                    {e.resourceId || "-"}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{e.userName || <span style={{ color: COLORS.muted }}>-</span>}</td>
                  <td style={{ ...tdStyle, fontSize: 12, fontFamily: "monospace", color: COLORS.textSecondary }}>
                    {e.ip || "-"}
                  </td>
                  <td style={tdStyle}><DetailsCell details={e.details} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
