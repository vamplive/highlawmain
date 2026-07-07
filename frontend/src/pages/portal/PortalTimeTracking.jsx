/**
 * 포털 타임트래킹 — 사건별 시간 기록 + 타이머 + 취합 보기
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle, pageHeaderStyle, pageHeaderIconStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function formatDatetime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDate(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("ko-KR");
}

function useElapsedTime(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startedAt)) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SORT_LABELS = [
  ["registered", "등록순"],
  ["recent_work", "최신작업순"],
  ["name", "이름순"],
];

/** 사건 검색 콤보박스 (드롭다운 내 정렬 포함) */
function CaseSearchPicker({ cases, value, onChange, placeholder = "사건 선택 (선택)", recentCaseIds = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState("registered");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = cases.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.caseNumber?.toLowerCase().includes(q) ||
        c.plaintiff?.toLowerCase().includes(q) ||
        c.defendant?.toLowerCase().includes(q)
    );
  }, [cases, query]);

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "name") {
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"));
    } else if (sortBy === "recent_work") {
      const order = Object.fromEntries(recentCaseIds.map((id, i) => [id, i]));
      arr.sort((a, b) => {
        const ai = order[a.id] ?? 9999;
        const bi = order[b.id] ?? 9999;
        if (ai !== bi) return ai - bi;
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      });
    } else {
      arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    return arr;
  }, [filtered, sortBy, recentCaseIds]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFocus = () => { setOpen(true); setQuery(""); };

  const handleInput = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange("");
  };

  const handleSelect = (c) => {
    onChange(c ? c.id : "");
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  const displayValue = open ? query : (selected?.title || "");

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          style={{
            ...fieldStyle,
            paddingRight: 32,
            ...(open ? {
              borderColor: T.accent,
              boxShadow: "0 0 0 3px rgba(201,168,76,0.13)",
            } : {}),
          }}
          value={displayValue}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={open ? "사건명 · 사건번호 · 당사자명으로 검색..." : placeholder}
          autoComplete="off"
        />
        {value && !open ? (
          <button
            type="button"
            onMouseDown={handleClear}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", fontSize: 16, padding: 0, lineHeight: 1,
            }}
          >×</button>
        ) : (
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            color: open ? T.accent : "#94a3b8",
            fontSize: open ? 15 : 11,
            pointerEvents: "none",
            userSelect: "none",
          }}>{open ? "⌕" : "∨"}</span>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", zIndex: 200, top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.10)", maxHeight: 260, overflowY: "auto",
        }}>
          {/* 정렬 컨트롤 */}
          <div style={{
            padding: "6px 10px", background: "#f8f9fa",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            position: "sticky", top: 0, zIndex: 1,
          }}>
            <span style={{ fontSize: 10, color: T.textMuted, marginRight: 4 }}>정렬</span>
            {SORT_LABELS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setSortBy(key); }}
                style={{
                  padding: "2px 8px", fontSize: 11, borderRadius: 4,
                  border: `1px solid ${sortBy === key ? T.accent : T.border}`,
                  background: sortBy === key ? "rgba(201,168,76,0.10)" : "transparent",
                  color: sortBy === key ? T.accent : T.textMuted,
                  cursor: "pointer", fontWeight: sortBy === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 사건 없음 옵션 */}
          <div
            onMouseDown={() => handleSelect(null)}
            style={{
              padding: "9px 12px", fontSize: 13, color: T.textMuted,
              cursor: "pointer", borderBottom: `1px solid ${T.border}`,
            }}
          >
            — 사건 없음
          </div>

          {sortedFiltered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: T.textMuted, textAlign: "center" }}>
              검색 결과 없음
            </div>
          ) : (
            sortedFiltered.map((c) => (
              <div
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                style={{
                  padding: "9px 12px", fontSize: 13, cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                  background: c.id === value ? "rgba(201,168,76,0.08)" : "#fff",
                }}
              >
                <div style={{ fontWeight: 500, color: T.text }}>{c.title}</div>
                {(c.caseNumber || c.plaintiff || c.defendant) && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                    {[c.caseNumber, c.plaintiff && `원고 ${c.plaintiff}`, c.defendant && `피고 ${c.defendant}`]
                      .filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }} onClick={onCancel}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "28px 32px", width: 340,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
          {title || "확인"}
        </div>
        <div style={{ fontSize: 14, color: "#475569", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "9px 20px", fontSize: 14, fontWeight: 500, color: "#475569",
            background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
          }}>아니오</button>
          <button onClick={onConfirm} style={{
            padding: "9px 20px", fontSize: 14, fontWeight: 700, color: "#fff",
            background: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer",
          }}>예</button>
        </div>
      </div>
    </div>
  );
}

function ActiveTimerPanel({ timer, onStop }) {
  const elapsed = useElapsedTime(timer?.startedAt);
  if (!timer) return null;
  return (
    <div style={{
      background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10,
      padding: 20, marginBottom: 24, display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>타이머 진행 중</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{timer.description}</div>
        <div style={{ fontSize: 13, color: T.textSec }}>{timer.caseTitle || "사건 미지정"} · 시작: {formatDatetime(timer.startedAt)}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#2e7d32", fontFamily: "monospace" }}>{elapsed}</div>
        <button onClick={onStop} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#c62828", border: "none", borderRadius: 6, cursor: "pointer" }}>
          타이머 종료
        </button>
      </div>
    </div>
  );
}

function StartTimerForm({ cases, onStart, recentCaseIds }) {
  const [desc, setDesc] = useState("");
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desc.trim()) return;
    setLoading(true);
    await onStart({ description: desc.trim(), caseId: caseId || null });
    setDesc("");
    setCaseId("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>타이머 시작</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr auto", gap: 8, alignItems: "end" }}>
        <input
          style={fieldStyle}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="작업 내용 (예: 준비서면 작성)"
          required
        />
        <CaseSearchPicker cases={cases} value={caseId} onChange={setCaseId} recentCaseIds={recentCaseIds} />
        <button type="submit" disabled={loading} style={{ padding: "12px 20px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#2e7d32", border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap" }}>
          {loading ? "시작 중..." : "▶ 시작"}
        </button>
      </div>
    </form>
  );
}

function ManualEntryForm({ cases, onSubmit, recentCaseIds }) {
  const today = new Date().toISOString().substring(0, 10);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ description: "", caseId: "", startedAt: `${today}T09:00`, endedAt: `${today}T10:00`, note: "" });
  const [loading, setLoading] = useState(false);

  if (!show) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => setShow(true)} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 500, color: T.accent, background: "transparent", border: `1px solid ${T.accent}`, borderRadius: 6, cursor: "pointer" }}>
          + 수동 입력
        </button>
      </div>
    );
  }

  const fld = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setForm({ description: "", caseId: "", startedAt: `${today}T09:00`, endedAt: `${today}T10:00`, note: "" });
    setShow(false);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>시간 수동 입력</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ gridColumn: "1 / 3" }}>
          <label style={labelStyle}>작업 내용 *</label>
          <input style={fieldStyle} value={form.description} onChange={fld("description")} required placeholder="작업 내용 (예: 준비서면 작성)" />
        </div>
        <div>
          <label style={labelStyle}>시작 시간 *</label>
          <input type="datetime-local" style={fieldStyle} value={form.startedAt} onChange={fld("startedAt")} required />
        </div>
        <div>
          <label style={labelStyle}>종료 시간 *</label>
          <input type="datetime-local" style={fieldStyle} value={form.endedAt} onChange={fld("endedAt")} required />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>사건</label>
          <CaseSearchPicker
            cases={cases}
            value={form.caseId}
            onChange={(id) => setForm((p) => ({ ...p, caseId: id }))}
            placeholder="사건 선택"
            recentCaseIds={recentCaseIds}
          />
        </div>
        <div>
          <label style={labelStyle}>메모</label>
          <input style={fieldStyle} value={form.note} onChange={fld("note")} placeholder="메모 (선택)" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setShow(false)} style={{ padding: "10px 16px", fontSize: 13, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}>취소</button>
        <button type="submit" disabled={loading} style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#fff", background: T.accent, border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "저장 중..." : "저장"}</button>
      </div>
    </form>
  );
}

function EditEntryModal({ entry, cases, recentCaseIds, onSave, onClose }) {
  const toLocalDT = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [form, setForm] = useState({
    description: entry.description || "",
    caseId: entry.caseId || "",
    startedAt: toLocalDT(entry.startedAt),
    endedAt: toLocalDT(entry.endedAt),
    note: entry.note || "",
  });
  const [loading, setLoading] = useState(false);
  const fld = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.startedAt || !form.endedAt) return;
    setLoading(true);
    const started = new Date(form.startedAt);
    const ended = new Date(form.endedAt);
    const durMin = ended > started ? Math.round((ended - started) / 60000) : 0;
    await onSave({
      description: form.description.trim(),
      caseId: form.caseId || null,
      startedAt: started.toISOString(),
      endedAt: ended.toISOString(),
      durationMinutes: durMin,
      note: form.note || null,
    });
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28, width: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>기록 편집</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>작업 내용 *</label>
            <input style={fieldStyle} value={form.description} onChange={fld("description")} required placeholder="작업 내용" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>사건</label>
            <CaseSearchPicker
              cases={cases} value={form.caseId}
              onChange={id => setForm(p => ({ ...p, caseId: id }))}
              placeholder="사건 선택 (선택)" recentCaseIds={recentCaseIds}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>시작 시간 *</label>
              <input type="datetime-local" style={fieldStyle} value={form.startedAt} onChange={fld("startedAt")} required />
            </div>
            <div>
              <label style={labelStyle}>종료 시간 *</label>
              <input type="datetime-local" style={fieldStyle} value={form.endedAt} onChange={fld("endedAt")} required />
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>메모</label>
            <input style={fieldStyle} value={form.note} onChange={fld("note")} placeholder="메모 (선택)" />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "9px 18px", fontSize: 13, color: "#475569",
              background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
            }}>취소</button>
            <button type="submit" disabled={loading} style={{
              padding: "9px 22px", fontSize: 13, fontWeight: 700, color: "#fff",
              background: T.accent, border: "none", borderRadius: 8,
              cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
            }}>{loading ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PortalTimeTracking() {
  const [tab, setTab] = useState("list");
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [cases, setCases] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCaseId, setFilterCaseId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const recentCaseIds = useMemo(
    () => [...new Set(entries.map((e) => e.caseId).filter(Boolean))],
    [entries]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, timerRes] = await Promise.all([
        portalApi.get("/cases"),
        portalApi.get("/time-entries/active"),
      ]);
      setCases(casesRes.data ?? []);
      setActiveTimer(timerRes.data || null);

      const params = new URLSearchParams();
      if (filterCaseId) params.set("caseId", filterCaseId);
      params.set("limit", "50");

      const [entriesRes, summaryRes] = await Promise.all([
        portalApi.get(`/time-entries?${params}`),
        portalApi.get("/time-entries/summary"),
      ]);
      setEntries(entriesRes.data ?? []);
      setSummary(summaryRes.data ?? []);
    } catch {
      showToast("데이터를 불러오지 못했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterCaseId]);

  const handleStart = async (data) => {
    try {
      const res = await portalApi.post("/time-entries/timer/start", data);
      setActiveTimer(res.data);
      showToast("타이머가 시작되었습니다", "success");
    } catch (err) {
      showToast(err.message || "타이머 시작 실패", "error");
    }
  };

  const handleStop = async () => {
    try {
      const res = await portalApi.post("/time-entries/timer/stop");
      setActiveTimer(null);
      setEntries((prev) => [res.data, ...prev.filter((e) => e.id !== res.data.id)]);
      showToast(`${formatDuration(res.data.durationMinutes)} 기록 완료`, "success");
      await loadData();
    } catch (err) {
      showToast(err.message || "타이머 종료 실패", "error");
    }
  };

  const handleManualEntry = async (data) => {
    try {
      await portalApi.post("/time-entries", data);
      showToast("시간이 기록되었습니다", "success");
      await loadData();
    } catch (err) {
      showToast(err.message || "저장 실패", "error");
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await portalApi.delete(`/time-entries/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("삭제되었습니다", "success");
    } catch (err) {
      showToast(err.message || "삭제 실패", "error");
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await portalApi.put(`/time-entries/${id}`, data);
      const updated = res.data;
      const caseTitle = cases.find(c => c.id === updated.caseId)?.title || null;
      setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updated, caseTitle } : e));
      setEditingEntry(null);
      showToast("수정되었습니다", "success");
    } catch (err) {
      showToast(err.message || "수정 실패", "error");
    }
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  const tabStyle = (active) => ({
    padding: "8px 20px", fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? T.accent : T.textSec,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div style={pageHeaderIconStyle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0", letterSpacing: -0.3 }}>타임트래킹</h1>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>사건별 작업 시간을 기록하고 관리합니다</p>
        </div>
      </div>

      <ActiveTimerPanel timer={activeTimer} onStop={handleStop} />

      {!activeTimer && <StartTimerForm cases={cases} onStart={handleStart} recentCaseIds={recentCaseIds} />}

      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        <button style={tabStyle(tab === "list")} onClick={() => setTab("list")}>기록 목록</button>
        <button style={tabStyle(tab === "summary")} onClick={() => setTab("summary")}>사건별 취합</button>
      </div>

      {tab === "list" && (
        <>
          <ManualEntryForm cases={cases} onSubmit={handleManualEntry} recentCaseIds={recentCaseIds} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 220 }}>
              <CaseSearchPicker
                cases={cases}
                value={filterCaseId}
                onChange={setFilterCaseId}
                placeholder="전체 사건"
                recentCaseIds={recentCaseIds}
              />
            </div>
            <span style={{ fontSize: 13, color: T.textSec }}>총 {formatDuration(totalMinutes)} 기록</span>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>로딩 중...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>기록된 시간이 없습니다</div>
          ) : (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              {entries.map((e, i) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < entries.length - 1 ? `1px solid ${T.border}` : "none", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{e.description}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
                      {e.caseTitle && <span style={{ marginRight: 8 }}>사건: {e.caseTitle}</span>}
                      {formatDate(e.startedAt)}
                      {e.endedAt && ` ${formatDatetime(e.startedAt).split(" ")[1]} ~ ${formatDatetime(e.endedAt).split(" ")[1]}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.accent, minWidth: 60, textAlign: "right" }}>
                    {formatDuration(e.durationMinutes)}
                  </div>
                  <button onClick={() => setEditingEntry(e)} style={{ padding: "4px 8px", fontSize: 11, color: "#1e40af", background: "transparent", border: "1px solid #bfdbfe", borderRadius: 4, cursor: "pointer" }}>수정</button>
                  <button onClick={() => handleDelete(e.id)} style={{ padding: "4px 8px", fontSize: 11, color: "#c62828", background: "transparent", border: "1px solid #ffcdd2", borderRadius: 4, cursor: "pointer" }}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "summary" && (
        <div>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>로딩 중...</p>
          ) : summary.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>집계된 시간이 없습니다</div>
          ) : (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px", padding: "10px 20px", background: "#f8f8f8", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>
                <span>사건명</span>
                <span style={{ textAlign: "right" }}>총 시간</span>
                <span style={{ textAlign: "right" }}>기록 수</span>
              </div>
              {summary.map((s, i) => (
                <div key={s.caseId || i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px", padding: "14px 20px", borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{s.caseTitle || "(사건 미지정)"}</div>
                    {s.caseNumber && <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>{s.caseNumber}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.accent, textAlign: "right" }}>{formatDuration(s.totalMinutes)}</div>
                  <div style={{ fontSize: 13, color: T.textSec, textAlign: "right" }}>{s.entryCount}건</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          title="삭제 확인"
          message="삭제하시겠습니까? 복구가 불가능합니다."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          cases={cases}
          recentCaseIds={recentCaseIds}
          onSave={(data) => handleUpdate(editingEntry.id, data)}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
