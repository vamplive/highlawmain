/**
 * 발송 이력 — 요약 카드 + 리스트 + 상세 팝오버
 * 리디자인: 테이블 대신 타임라인 스타일 리스트, 상세는 사이드 패널
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { COLORS } from "../../../components/admin";
import { formatDateTime, formatContact, maskName } from "../../../utils/formatters";
import { showToast } from "../../../utils/showToast";

const FILTER_CHANNELS = [
  { value: "", label: "전체" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "이메일" },
];

const FILTER_STATUSES = [
  { value: "", label: "전체" },
  { value: "sent", label: "성공" },
  { value: "failed", label: "실패" },
  { value: "pending", label: "대기" },
];

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [masked, setMasked] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterChannel) params.set("channel", filterChannel);
    if (filterStatus) params.set("status", filterStatus);
    api.get(`/messages/logs?${params}`)
      .then((j) => {
        setLogs(j.data ?? []);
        setMeta(j.meta ?? { total: 0, totalPages: 0 });
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, filterChannel, filterStatus]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    api.get(`/messages/stats?from=${fmt(from)}&to=${fmt(to)}`)
      .then((j) => setStats(j.data))
      .catch(() => {});
  }, []);

  const removeLog = async (id) => {
    if (!confirm("이 발송 이력을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/messages/logs/${id}`);
      setSelectedLog(null);
      load();
    } catch (err) { showToast("삭제 실패: " + err.message); }
  };

  const successRate = stats?.total > 0 ? Math.round((stats.sent / stats.total) * 100) : null;

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="최근 7일 발송" value={stats?.total ?? "-"} suffix="건" />
        <StatCard label="성공" value={stats?.sent ?? "-"} suffix="건" tone="success" />
        <StatCard label="실패" value={stats?.failed ?? "-"} suffix="건" tone={stats?.failed > 0 ? "danger" : "muted"} />
        <StatCard label="성공률" value={successRate ?? "-"} suffix={successRate !== null ? "%" : ""} />
      </div>

      {/* 필터 바 */}
      <div style={filterBarStyle}>
        <FilterGroup label="채널">
          {FILTER_CHANNELS.map((f) => (
            <Chip
              key={f.value}
              active={filterChannel === f.value}
              onClick={() => { setFilterChannel(f.value); setPage(1); }}
            >{f.label}</Chip>
          ))}
        </FilterGroup>

        <div style={{ width: 1, height: 22, background: COLORS.borderLight }} />

        <FilterGroup label="상태">
          {FILTER_STATUSES.map((f) => (
            <Chip
              key={f.value}
              active={filterStatus === f.value}
              onClick={() => { setFilterStatus(f.value); setPage(1); }}
            >{f.label}</Chip>
          ))}
        </FilterGroup>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>총 {meta.total}건</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSecondary, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={masked}
              onChange={(e) => setMasked(e.target.checked)}
              style={{ accentColor: COLORS.accent }}
            />
            마스킹
          </label>
        </div>
      </div>

      {/* 리스트 */}
      {loading ? (
        <Empty text="불러오는 중..." />
      ) : logs.length === 0 ? (
        <Empty text="발송 이력이 없습니다" />
      ) : (
        <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
          {logs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              masked={masked}
              active={selectedLog?.id === log.id}
              onClick={() => setSelectedLog(log)}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
          <PagerBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← 이전</PagerBtn>
          <span style={{ padding: "8px 14px", fontSize: 13, color: COLORS.textSecondary }}>
            {page} / {meta.totalPages}
          </span>
          <PagerBtn disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>다음 →</PagerBtn>
        </div>
      )}

      {/* 상세 사이드 패널 */}
      {selectedLog && (
        <DetailPanel
          log={selectedLog}
          masked={masked}
          onClose={() => setSelectedLog(null)}
          onRemove={() => removeLog(selectedLog.id)}
        />
      )}
    </div>
  );
}

/* ── 카드 ── */
function StatCard({ label, value, suffix = "", tone = "default" }) {
  const valueColor =
    tone === "success" ? COLORS.success :
    tone === "danger" ? COLORS.danger :
    tone === "muted" ? COLORS.muted :
    COLORS.text;
  return (
    <div style={{
      padding: "16px 18px", background: "#f7f8fa",
      border: `1px solid ${COLORS.borderLight}`, borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500, letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: valueColor, marginTop: 4, letterSpacing: -0.5 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2, color: COLORS.muted }}>{suffix}</span>
      </div>
    </div>
  );
}

/* ── 필터 ── */
function FilterGroup({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500, marginRight: 2 }}>{label}</span>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", fontSize: 12, fontWeight: active ? 600 : 500,
        color: active ? "#fff" : COLORS.textSecondary,
        background: active ? COLORS.text : "#f4f3f0",
        border: "none", borderRadius: 14, cursor: "pointer",
        transition: "background 0.15s",
      }}
    >{children}</button>
  );
}

/* ── 리스트 아이템 ── */
function LogItem({ log, masked, active, onClick }) {
  const displayName = masked ? maskName(log.recipientName) : (log.recipientName || "-");
  const displayContact = formatContact(log.recipientContact, masked);
  const statusColor = {
    sent: COLORS.success, failed: COLORS.danger, pending: COLORS.warning,
  }[log.status] || COLORS.muted;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", cursor: "pointer",
        borderBottom: `1px solid ${COLORS.borderLight}`,
        background: active ? "#faf8f3" : "#fff",
        transition: "background 0.1s",
      }}
    >
      {/* 상태 도트 */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: statusColor, flexShrink: 0,
      }} />

      {/* 채널 라벨 */}
      <span style={{
        fontSize: 10, fontWeight: 600, width: 46,
        color: COLORS.textSecondary, letterSpacing: 0.5,
      }}>
        {log.channel === "sms" ? "SMS" : "EMAIL"}
      </span>

      {/* 수신자 */}
      <div style={{ flex: "0 0 180px", minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayContact}
        </div>
      </div>

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {log.subject && (
          <div style={{ fontSize: 11, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {log.subject}
          </div>
        )}
        <div style={{ fontSize: 12, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.content}
        </div>
      </div>

      {/* 시각 */}
      <div style={{ fontSize: 11, color: COLORS.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
        {formatDateTime(log.sentAt || log.createdAt)}
      </div>
    </div>
  );
}

/* ── 상세 사이드 패널 ── */
function DetailPanel({ log, masked, onClose, onRemove }) {
  const displayName = masked ? maskName(log.recipientName) : (log.recipientName || "-");
  const displayContact = formatContact(log.recipientContact, masked);

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 100,
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420, zIndex: 101,
        background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
        overflowY: "auto", padding: "28px 28px 40px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>발송 상세</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22, color: COLORS.muted, cursor: "pointer",
          }}>×</button>
        </div>

        <DetailRow label="채널">
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
            {log.channel === "sms" ? "SMS 문자" : "이메일"}
          </span>
        </DetailRow>

        <DetailRow label="상태">
          <StatusPill status={log.status} />
          {log.errorMessage && (
            <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 6 }}>
              {log.errorMessage}
            </div>
          )}
        </DetailRow>

        <DetailRow label="수신자">
          <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{displayName}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{displayContact}</div>
        </DetailRow>

        {log.subject && (
          <DetailRow label="제목">
            <div style={{ fontSize: 13, color: COLORS.text }}>{log.subject}</div>
          </DetailRow>
        )}

        <DetailRow label="내용">
          <div style={{
            fontSize: 13, color: COLORS.text, whiteSpace: "pre-wrap",
            padding: 12, background: "#f7f8fa", borderRadius: 6,
            lineHeight: 1.6, border: `1px solid ${COLORS.borderLight}`,
          }}>
            {log.content}
          </div>
        </DetailRow>

        <DetailRow label="발송 시각">
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
            {formatDateTime(log.sentAt || log.createdAt)}
          </span>
        </DetailRow>

        {log.channel === "email" && log.openedAt && (
          <DetailRow label="열람">
            <span style={{ fontSize: 12, color: COLORS.success }}>
              {formatDateTime(log.openedAt)} · {log.openCount || 0}회
            </span>
          </DetailRow>
        )}

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${COLORS.borderLight}` }}>
          <button
            onClick={onRemove}
            style={{
              padding: "8px 14px", fontSize: 12, fontWeight: 500,
              color: COLORS.danger, background: "#fff",
              border: `1px solid ${COLORS.danger}`, borderRadius: 6, cursor: "pointer",
            }}
          >이력 삭제</button>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: COLORS.muted,
        letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase",
      }}>{label}</div>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const config = {
    sent: { label: "발송 완료", color: COLORS.success, bg: "#f0faf3" },
    failed: { label: "실패", color: COLORS.danger, bg: "#fff5f0" },
    pending: { label: "대기", color: COLORS.warning, bg: "#fff9ed" },
  }[status] || { label: status, color: COLORS.muted, bg: "#f5f5f5" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", fontSize: 12, fontWeight: 500,
      color: config.color, background: config.bg, borderRadius: 12,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.color }} />
      {config.label}
    </span>
  );
}

function Empty({ text }) {
  return (
    <div style={{
      padding: "60px 20px", textAlign: "center", fontSize: 13, color: COLORS.muted,
      border: `1px solid ${COLORS.borderLight}`, borderRadius: 10, background: "#f7f8fa",
    }}>{text}</div>
  );
}

function PagerBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "8px 14px", fontSize: 12, fontWeight: 500,
        color: disabled ? COLORS.textLight : COLORS.textSecondary,
        background: "#fff", border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
      }}
    >{children}</button>
  );
}

const filterBarStyle = {
  display: "flex", alignItems: "center", gap: 16,
  padding: "12px 16px", marginBottom: 16,
  background: "#f7f8fa", border: `1px solid ${COLORS.borderLight}`,
  borderRadius: 10,
};
