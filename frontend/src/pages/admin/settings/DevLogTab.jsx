/** 개발 이력 탭 — 개발 로그 목록 조회 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { EmptyState, COLORS } from "../../../components/admin";

/** 개발 이력 개별 항목 */
function DevLogItem({ log }) {
  return (
    <div style={{
      padding: "16px 20px", background: COLORS.bgPage,
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600 }}>{log.date || "-"}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{log.title}</span>
      </div>
      {log.summary && (
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 }}>{log.summary}</p>
      )}
    </div>
  );
}

export default function DevLogTab() {
  const [devLogs, setDevLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dev-logs")
      .then((json) => setDevLogs(json.data ?? []))
      .catch(() => setDevLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>개발 이력</h2>

      {loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : devLogs.length === 0 ? (
        <EmptyState icon="📝" message="기록된 개발 이력이 없습니다" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {devLogs.map((log, i) => (
            <DevLogItem key={log.id ?? i} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
