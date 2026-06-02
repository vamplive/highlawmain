/** 활동 로그 탭 — 페이지네이션 기반 활동 이력 조회 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { formatDateTime } from "../../../utils/formatters";
import { EmptyState, Pagination, COLORS } from "../../../components/admin";

const LIMIT = 20;

/** 활동 로그 개별 항목 */
function ActivityLogItem({ log }) {
  return (
    <div style={{
      padding: "12px 16px", background: COLORS.bgPage,
      border: `1px solid ${COLORS.border}`, borderRadius: 6,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 130, flexShrink: 0 }}>
        {formatDateTime(log.createdAt)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, minWidth: 80 }}>
        {log.changedBy || "시스템"}
      </span>
      <span style={{ fontSize: 13, color: COLORS.textSecondary, flex: 1 }}>
        {log.section || log.action || "설정 변경"}
        {log.description && <span style={{ color: COLORS.textMuted }}> - {log.description}</span>}
      </span>
    </div>
  );
}

export default function ActivityTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = (p) => {
    setLoading(true);
    const offset = (p - 1) * LIMIT;
    api.get(`/site-settings/history?limit=${LIMIT}&offset=${offset}`)
      .then((json) => {
        setLogs(json.data ?? []);
        setTotal(json.meta?.total ?? 0);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load(page);
    });
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>최근 활동 로그</h2>

      {loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" message="기록된 활동이 없습니다" />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log, i) => (
              <ActivityLogItem key={log.id ?? i} log={log} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
