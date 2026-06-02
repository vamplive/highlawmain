/**
 * 시간 기록(Time Tracking) 관리자 페이지
 *
 * - 활성 타이머 위젯 (변호사 선택 후 시작/종료, 1초 단위 라이브 카운터)
 * - 수동 entry 입력 폼 (이미 끝난 작업 사후 입력)
 * - 필터(변호사/의뢰인/사건/날짜/청구상태) + 목록 테이블
 * - 요약 카드(총 시간 / 청구 가능 / 미청구 금액 / 청구 완료 금액)
 *
 * 시급은 변호사 프로필의 default_hourly_rate_krw 가 진행 시점에 스냅샷으로 저장된다.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, badgeStyle, thStyle, tdStyle, fieldStyle, labelStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";
import { formatDateTime } from "../../../utils/formatters";

const ACTIVITY_TYPES = [
  { value: "work", label: "업무" },
  { value: "research", label: "조사·검색" },
  { value: "meeting", label: "회의" },
  { value: "court", label: "법정" },
  { value: "call", label: "전화" },
  { value: "email", label: "이메일" },
  { value: "travel", label: "이동" },
];

function formatMinutes(minutes) {
  if (minutes == null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatKrw(value) {
  if (value == null) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function nowSqlString() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

/**
 * 활성 타이머 위젯 — 진행 중 타이머가 있으면 라이브 카운트 표시.
 */
function TimerWidget({ lawyers, clients, onChange }) {
  const [lawyerId, setLawyerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("work");
  const [active, setActive] = useState(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const loadActive = useCallback(async () => {
    if (!lawyerId) { setActive(null); return; }
    try {
      const r = await api.get(`/time-entries/active?lawyerId=${lawyerId}`);
      setActive(r.data || null);
    } catch (e) {
      setErr(e.message || "활성 타이머 조회 실패");
    }
  }, [lawyerId]);

  useEffect(() => { loadActive(); }, [loadActive]);

  /* 1초마다 라이브 카운터 갱신 */
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const elapsedSeconds = useMemo(() => {
    if (!active?.startedAt) return 0;
    const start = new Date(active.startedAt.replace(" ", "T") + "Z").getTime();
    return Math.max(0, Math.floor((Date.now() - start) / 1000)) + (tick * 0);
    // tick 으로 React 렌더만 트리거. 실제 elapsed 는 Date.now 기반.
  }, [active, tick]);

  const handleStart = async () => {
    if (!lawyerId || !description.trim()) {
      setErr("변호사와 작업 설명을 입력해주세요.");
      return;
    }
    setBusy(true); setErr(null);
    try {
      await api.post("/time-entries/timer/start", {
        lawyerId, clientId: clientId || null,
        description: description.trim(), activityType,
      });
      setDescription("");
      await loadActive();
      onChange?.();
    } catch (e) {
      setErr(e.message || "타이머 시작 실패");
    } finally { setBusy(false); }
  };

  const handleStop = async () => {
    if (!lawyerId) return;
    setBusy(true); setErr(null);
    try {
      await api.post("/time-entries/timer/stop", { lawyerId });
      setActive(null);
      onChange?.();
    } catch (e) {
      setErr(e.message || "타이머 종료 실패");
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      padding: 18, marginBottom: 20,
      background: active ? "#fff7ed" : COLORS.bgForm,
      border: `1px solid ${active ? "#f59e0b" : COLORS.border}`,
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.text }}>
          ⏱ 타이머 {active && <span style={{ marginLeft: 8, color: "#c2410c" }}>(진행 중)</span>}
        </h3>
        {active && (
          <div style={{ fontSize: 22, fontWeight: 700, color: "#c2410c", fontFamily: "monospace" }}>
            {formatElapsed(elapsedSeconds)}
          </div>
        )}
      </div>
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div>
          <label style={labelStyle}>변호사 *</label>
          <select style={fieldStyle} value={lawyerId} onChange={(e) => setLawyerId(e.target.value)}>
            <option value="">선택...</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.defaultHourlyRateKrw ? `(${(l.defaultHourlyRateKrw).toLocaleString()}원/h)` : "(시급 미설정)"}
              </option>
            ))}
          </select>
        </div>

        {!active && (
          <>
            <div>
              <label style={labelStyle}>의뢰인</label>
              <select style={fieldStyle} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">선택 안함</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>활동 유형</label>
              <select style={fieldStyle} value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                {ACTIVITY_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>작업 설명 *</label>
              <input style={fieldStyle} placeholder="예: 답변서 초안 작성"
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </>
        )}

        {active && (
          <div style={{ gridColumn: "span 3", padding: "8px 12px", background: "#fff", borderRadius: 6, border: "1px solid #fed7aa" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{active.description}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
              시작: {formatDateTime(active.startedAt)} · 시급: {formatKrw(active.hourlyRateKrw)}/h
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        {!active && (
          <button onClick={handleStart} disabled={busy} style={btnStyle("primary")}>
            ▶ 타이머 시작
          </button>
        )}
        {active && (
          <button onClick={handleStop} disabled={busy} style={btnStyle("danger")}>
            ■ 종료
          </button>
        )}
      </div>
    </div>
  );
}

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 수동 entry 입력 폼 (이미 끝난 작업 사후 입력)
 */
function ManualEntryForm({ lawyers, clients, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    lawyerId: "", clientId: "", description: "", activityType: "work",
    startedAt: nowSqlString().slice(0, 16), durationMinutes: 30, billable: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!form.lawyerId || !form.description.trim()) {
      setErr("변호사와 작업 설명을 입력해주세요.");
      return;
    }
    setBusy(true); setErr(null);
    try {
      const startedAt = `${form.startedAt}:00`;
      const endedAt = (() => {
        const start = new Date(startedAt.replace(" ", "T")).getTime();
        const end = new Date(start + Number(form.durationMinutes) * 60000);
        return end.toISOString().replace("T", " ").slice(0, 19);
      })();
      await api.post("/time-entries", {
        lawyerId: form.lawyerId,
        clientId: form.clientId || null,
        description: form.description.trim(),
        activityType: form.activityType,
        startedAt, endedAt,
        durationMinutes: Number(form.durationMinutes),
        billable: form.billable ? 1 : 0,
      });
      setForm((f) => ({ ...f, description: "" }));
      onAdded?.();
      setOpen(false);
    } catch (e) {
      setErr(e.message || "추가 실패");
    } finally { setBusy(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...btnStyle("ghost"), marginBottom: 16 }}>
        + 수동 입력
      </button>
    );
  }

  return (
    <div style={{
      padding: 16, marginBottom: 16, background: COLORS.bgForm,
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
    }}>
      <h3 style={{ margin: 0, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>이전 작업 수동 입력</h3>
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div>
          <label style={labelStyle}>변호사 *</label>
          <select style={fieldStyle} value={form.lawyerId} onChange={(e) => setForm({ ...form, lawyerId: e.target.value })}>
            <option value="">선택...</option>
            {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>의뢰인</label>
          <select style={fieldStyle} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">선택 안함</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>활동 유형</label>
          <select style={fieldStyle} value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>
            {ACTIVITY_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>시작 시각</label>
          <input style={fieldStyle} type="datetime-local"
            value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>지속 시간(분) *</label>
          <input style={fieldStyle} type="number" min="1"
            value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={labelStyle}>작업 설명 *</label>
          <input style={fieldStyle} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })} />
            청구 가능
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button onClick={() => setOpen(false)} style={btnStyle("ghost")}>취소</button>
        <button onClick={submit} disabled={busy} style={btnStyle("primary")}>{busy ? "저장 중..." : "추가"}</button>
      </div>
    </div>
  );
}

export default function TimeEntriesPage() {
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  /* 필터 */
  const [filterLawyer, setFilterLawyer] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterBilled, setFilterBilled] = useState(""); // ""|"0"|"1"

  /* 송장 변환 — 선택된 entry id 집합 */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [converting, setConverting] = useState(false);

  const loadMeta = useCallback(async () => {
    try {
      const [lws, cls] = await Promise.all([
        api.get("/lawyers?all=true"),
        api.get("/clients?limit=200"),
      ]);
      setLawyers(lws.data || []);
      setClients(cls.data || []);
    } catch (e) {
      setErr(e.message || "변호사/의뢰인 목록을 불러오지 못했습니다");
    }
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterLawyer) params.set("lawyerId", filterLawyer);
      if (filterClient) params.set("clientId", filterClient);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      if (filterBilled !== "") params.set("billed", filterBilled);

      const [list, sum] = await Promise.all([
        api.get(`/time-entries?${params.toString()}`),
        api.get(`/time-entries/summary?${params.toString()}`),
      ]);
      setEntries(list.data || []);
      setSummary(sum.data || null);
    } catch (e) {
      setErr(e.message || "시간 기록을 불러오지 못했습니다");
      setEntries([]);
    } finally { setLoading(false); }
  }, [filterLawyer, filterClient, filterFrom, filterTo, filterBilled]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleDelete = async (id) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;
    try {
      await api.del(`/time-entries/${id}`);
      await loadEntries();
    } catch (e) {
      setErr(e.message || "삭제 실패");
    }
  };

  /* 선택 가능 여부 — billable=1, billed=0, ended_at != null 만 변환 가능 */
  const isSelectable = (entry) =>
    entry.billable === 1 && entry.billed === 0 && !!entry.endedAt;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const selectable = entries.filter(isSelectable).map((e) => e.id);
      const allSelected = selectable.length > 0 && selectable.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(selectable);
    });
  };

  /* 선택된 entries 의 통계 — 같은 client 인지 + 합계 */
  const selectionInfo = useMemo(() => {
    const selected = entries.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) return null;
    const clientIds = new Set(selected.map((e) => e.clientId));
    const sameClient = clientIds.size === 1 && [...clientIds][0];
    const totalMinutes = selected.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const totalAmount = selected.reduce((s, e) => s + Math.round((e.durationMinutes || 0) * e.hourlyRateKrw / 60), 0);
    return {
      count: selected.length,
      clientId: sameClient || null,
      hasMultipleClients: !sameClient && clientIds.size > 1,
      totalMinutes,
      totalAmount,
    };
  }, [entries, selectedIds]);

  const handleConvertToInvoice = async () => {
    if (!selectionInfo) return;
    if (selectionInfo.hasMultipleClients) {
      setErr("같은 의뢰인의 기록만 한 번에 송장으로 변환할 수 있습니다.");
      return;
    }
    if (!selectionInfo.clientId) {
      setErr("의뢰인이 지정되지 않은 기록은 송장으로 변환할 수 없습니다.");
      return;
    }
    if (!window.confirm(
      `${selectionInfo.count}건의 기록을 송장으로 변환합니다.\n` +
      `합계: ${formatMinutes(selectionInfo.totalMinutes)} = ${formatKrw(selectionInfo.totalAmount)}\n` +
      `(부가세 별도, draft 상태로 생성됩니다)`,
    )) return;

    setConverting(true); setErr(null);
    try {
      const result = await api.post("/time-entries/to-invoice", {
        timeEntryIds: [...selectedIds],
      });
      setSelectedIds(new Set());
      await loadEntries();
      window.alert(
        `송장이 생성되었습니다 (draft).\n` +
        `합계 ${formatKrw(result.data.total)} (소계 ${formatKrw(result.data.subtotal)} + VAT ${formatKrw(result.data.vatAmount)})\n\n` +
        `발행하려면 /admin/contracts 또는 송장 관리 페이지로 이동하세요.`,
      );
    } catch (e) {
      setErr(e.message || "송장 변환 실패");
    } finally { setConverting(false); }
  };

  const handleToggleBillable = async (entry) => {
    try {
      await api.put(`/time-entries/${entry.id}`, { billable: entry.billable ? 0 : 1 });
      await loadEntries();
    } catch (e) {
      setErr(e.message || "수정 실패");
    }
  };

  return (
    <div>
      <PageHeader
        title="시간 기록"
        subtitle="변호사 시급제 청구 기반 — 작업 시간 추적 / 청구 가능 시간 집계"
      />
      <RelatedLinks links={ERP_LINKS("/admin/time-entries")} label="빠른 이동" />

      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      <TimerWidget lawyers={lawyers} clients={clients} onChange={loadEntries} />
      <ManualEntryForm lawyers={lawyers} clients={clients} onAdded={loadEntries} />

      {/* 요약 카드 */}
      {summary && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: "총 기록 수", value: `${summary.totalEntries}건` },
            { label: "총 시간", value: formatMinutes(summary.totalMinutes) },
            { label: "청구 가능 시간", value: formatMinutes(summary.billableMinutes) },
            { label: "미청구 금액", value: formatKrw(summary.unbilledAmountKrw), color: "#c2410c" },
            { label: "청구 완료 금액", value: formatKrw(summary.billedAmountKrw), color: "#15803d" },
          ].map((card) => (
            <div key={card.label} style={{
              flex: 1, minWidth: 140, padding: "14px 18px",
              background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
            }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {card.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color || COLORS.text }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10, marginBottom: 16, padding: 14, background: COLORS.bgForm,
        border: `1px solid ${COLORS.border}`, borderRadius: 8,
      }}>
        <div>
          <label style={labelStyle}>변호사</label>
          <select style={fieldStyle} value={filterLawyer} onChange={(e) => setFilterLawyer(e.target.value)}>
            <option value="">전체</option>
            {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>의뢰인</label>
          <select style={fieldStyle} value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
            <option value="">전체</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>시작일</label>
          <input style={fieldStyle} type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>종료일</label>
          <input style={fieldStyle} type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>청구 상태</label>
          <select style={fieldStyle} value={filterBilled} onChange={(e) => setFilterBilled(e.target.value)}>
            <option value="">전체</option>
            <option value="0">미청구</option>
            <option value="1">청구 완료</option>
          </select>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>
      ) : entries.length === 0 ? (
        <EmptyState message="기록된 시간이 없습니다." />
      ) : (
        <>
          {/* 송장 변환 액션 바 — 선택된 항목이 있을 때만 보임 */}
          {selectionInfo && (
            <div style={{
              padding: "10px 14px", marginBottom: 12,
              background: selectionInfo.hasMultipleClients ? "#fef2f2" : "#ecfdf5",
              border: `1px solid ${selectionInfo.hasMultipleClients ? "#fecaca" : "#a7f3d0"}`,
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ fontSize: 13 }}>
                <strong>{selectionInfo.count}건 선택</strong>
                {" · "}
                {formatMinutes(selectionInfo.totalMinutes)}
                {" · "}
                <span style={{ fontWeight: 600, color: "#15803d" }}>{formatKrw(selectionInfo.totalAmount)}</span>
                {selectionInfo.hasMultipleClients && (
                  <span style={{ marginLeft: 8, color: COLORS.danger, fontSize: 12 }}>
                    ⚠ 의뢰인이 다른 기록이 섞여 있습니다 — 같은 의뢰인끼리만 가능
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setSelectedIds(new Set())}
                  style={btnStyle("ghost")}>
                  선택 해제
                </button>
                <button onClick={handleConvertToInvoice}
                  disabled={converting || selectionInfo.hasMultipleClients || !selectionInfo.clientId}
                  style={btnStyle("primary")}>
                  {converting ? "변환 중..." : "📄 송장 만들기"}
                </button>
              </div>
            </div>
          )}

        <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
          <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.bgHeader }}>
                <th style={{ ...thStyle, width: 32 }}>
                  <input type="checkbox"
                    checked={(() => {
                      const sel = entries.filter(isSelectable);
                      return sel.length > 0 && sel.every((e) => selectedIds.has(e.id));
                    })()}
                    onChange={toggleSelectAll}
                    title="청구 가능 항목 모두 선택" />
                </th>
                <th style={thStyle}>시작</th>
                <th style={thStyle}>변호사</th>
                <th style={thStyle}>의뢰인</th>
                <th style={thStyle}>설명</th>
                <th style={thStyle}>유형</th>
                <th style={thStyle}>시간</th>
                <th style={thStyle}>시급</th>
                <th style={thStyle}>금액</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const lawyer = lawyers.find((l) => l.id === e.lawyerId);
                const client = clients.find((c) => c.id === e.clientId);
                const amount = e.durationMinutes != null
                  ? Math.round((e.durationMinutes * e.hourlyRateKrw) / 60)
                  : null;
                const isActive = !e.endedAt;
                const selectable = isSelectable(e);
                const checked = selectedIds.has(e.id);
                return (
                  <tr key={e.id} style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    background: isActive ? "#fff7ed" : checked ? "#ecfdf5" : "transparent",
                  }}>
                    <td style={{ ...tdStyle, width: 32 }}>
                      {selectable && (
                        <input type="checkbox" checked={checked}
                          onChange={() => toggleSelect(e.id)} />
                      )}
                    </td>
                    <td data-label="시작" style={tdStyle}>{formatDateTime(e.startedAt)}</td>
                    <td data-label="변호사" style={tdStyle}>{lawyer?.name || "-"}</td>
                    <td data-label="의뢰인" style={tdStyle}>{client?.name || "-"}</td>
                    <td data-label="설명" style={{ ...tdStyle, maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      title={e.description}>
                      {e.description}
                    </td>
                    <td data-label="유형" style={tdStyle}>{ACTIVITY_TYPES.find((a) => a.value === e.activityType)?.label || e.activityType}</td>
                    <td data-label="시간" style={tdStyle}>{isActive ? <span style={{ color: "#c2410c", fontWeight: 600 }}>진행 중</span> : formatMinutes(e.durationMinutes)}</td>
                    <td data-label="시급" style={tdStyle}>{formatKrw(e.hourlyRateKrw)}</td>
                    <td data-label="금액" style={tdStyle}>{amount != null ? formatKrw(amount) : "-"}</td>
                    <td data-label="상태" style={tdStyle}>
                      {e.billed ? <span style={badgeStyle(COLORS.success)}>청구완료</span>
                        : e.billable ? <span style={badgeStyle(COLORS.warning)}>청구가능</span>
                        : <span style={badgeStyle(COLORS.muted)}>비청구</span>}
                    </td>
                    <td style={tdStyle}>
                      {!e.billed && !isActive && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleToggleBillable(e)}
                            style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 8px" }}>
                            {e.billable ? "청구해제" : "청구가능"}
                          </button>
                          <button onClick={() => handleDelete(e.id)}
                            style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 8px", color: COLORS.danger }}>
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
