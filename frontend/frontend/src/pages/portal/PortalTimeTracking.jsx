/**
 * 포털 타임트래킹 — 사건별 시간 기록 + 타이머 + 취합 보기
 */
import { useState, useEffect, useRef } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
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

/** 경과 시간 표시용 훅 */
function useElapsedTime(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt)) / 1000));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 진행 중 타이머 패널 */
function ActiveTimerPanel({ timer, cases, onStop }) {
  const elapsed = useElapsedTime(timer?.startedAt);
  if (!timer) return null;

  const caseTitle = timer.caseTitle || "사건 미지정";

  return (
    <div style={{
      background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10,
      padding: 20, marginBottom: 24, display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>⏱ 타이머 진행 중</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{timer.description}</div>
        <div style={{ fontSize: 13, color: T.textSec }}>{caseTitle} · 시작: {formatDatetime(timer.startedAt)}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#2e7d32", fontFamily: "monospace" }}>{elapsed}</div>
        <button
          onClick={onStop}
          style={{
            padding: "10px 20px", fontSize: 14, fontWeight: 600,
            color: "#fff", background: "#c62828", border: "none", borderRadius: 6, cursor: "pointer",
          }}
        >
          타이머 종료
        </button>
      </div>
    </div>
  );
}

/** 타이머 시작 폼 */
function StartTimerForm({ cases, onStart }) {
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
    <form onSubmit={handleSubmit} style={{
      background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
      padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>타이머 시작</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <input
            style={fieldStyle}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="작업 내용 (예: 준비서면 작성)"
            required
          />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <select style={{ ...fieldStyle, appearance: "none" }} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            <option value="">사건 선택 (선택)</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px", fontSize: 14, fontWeight: 600,
            color: "#fff", background: "#2e7d32", border: "none", borderRadius: 6,
            cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "시작 중..." : "▶ 시작"}
        </button>
      </div>
    </form>
  );
}

/** 수동 입력 폼 */
function ManualEntryForm({ cases, onSubmit }) {
  const today = new Date().toISOString().substring(0, 10);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    description: "", caseId: "", startedAt: `${today}T09:00`,
    endedAt: `${today}T10:00`, note: "",
  });
  const [loading, setLoading] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          padding: "8px 16px", fontSize: 13, fontWeight: 500,
          color: T.accent, background: "transparent",
          border: `1px solid ${T.accent}`, borderRadius: 6, cursor: "pointer",
          marginBottom: 20,
        }}
      >
        + 수동 입력
      </button>
    );
  }

  const field = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setForm({ description: "", caseId: "", startedAt: `${today}T09:00`, endedAt: `${today}T10:00`, note: "" });
    setShow(false);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
      padding: 20, marginBottom: 20,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>시간 수동 입력</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>작업 내용 *</label>
          <input style={fieldStyle} value={form.description} onChange={field("description")} required placeholder="작업 내용" />
        </div>
        <div>
          <label style={labelStyle}>사건</label>
          <select style={{ ...fieldStyle, appearance: "none" }} value={form.caseId} onChange={field("caseId")}>
            <option value="">사건 선택</option>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>시작 시간 *</label>
          <input type="datetime-local" style={fieldStyle} value={form.startedAt} onChange={field("startedAt")} required />
        </div>
        <div>
          <label style={labelStyle}>종료 시간 *</label>
          <input type="datetime-local" style={fieldStyle} value={form.endedAt} onChange={field("endedAt")} required />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>메모</label>
        <input style={fieldStyle} value={form.note} onChange={field("note")} placeholder="메모 (선택)" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setShow(false)} style={{
          padding: "10px 16px", fontSize: 13, color: T.textSec,
          background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer",
        }}>취소</button>
        <button type="submit" disabled={loading} style={{
          padding: "10px 20px", fontSize: 13, fontWeight: 600,
          color: "#fff", background: T.accent, border: "none", borderRadius: 6,
          cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
        }}>{loading ? "저장 중..." : "저장"}</button>
      </div>
    </form>
  );
}

export default function PortalTimeTracking() {
  const [tab, setTab] = useState("list"); // "list" | "summary"
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [cases, setCases] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCaseId, setFilterCaseId] = useState("");

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

  const handleDelete = async (id) => {
    if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/time-entries/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("삭제되었습니다", "success");
    } catch (err) {
      showToast(err.message || "삭제 실패", "error");
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", marginBottom: 6 }}>
          타임트래킹
        </h1>
        <p style={{ fontSize: 14, color: T.textSec }}>사건별 작업 시간을 기록하고 관리합니다</p>
      </div>

      {/* 진행 중 타이머 */}
      <ActiveTimerPanel timer={activeTimer} cases={cases} onStop={handleStop} />

      {/* 타이머 시작 폼 */}
      {!activeTimer && <StartTimerForm cases={cases} onStart={handleStart} />}

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        <button style={tabStyle(tab === "list")} onClick={() => setTab("list")}>기록 목록</button>
        <button style={tabStyle(tab === "summary")} onClick={() => setTab("summary")}>사건별 취합</button>
      </div>

      {/* 기록 목록 탭 */}
      {tab === "list" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              style={{ ...fieldStyle, width: "auto", minWidth: 160 }}
              value={filterCaseId}
              onChange={(e) => setFilterCaseId(e.target.value)}
            >
              <option value="">전체 사건</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <span style={{ fontSize: 13, color: T.textSec }}>
              총 {formatDuration(totalMinutes)} 기록
            </span>
            <div style={{ marginLeft: "auto" }}>
              <ManualEntryForm cases={cases} onSubmit={handleManualEntry} />
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>로딩 중...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
              기록된 시간이 없습니다
            </div>
          ) : (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex", alignItems: "center", padding: "14px 20px",
                    borderBottom: i < entries.length - 1 ? `1px solid ${T.border}` : "none",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{e.description}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
                      {e.caseTitle && <span style={{ marginRight: 8 }}>📁 {e.caseTitle}</span>}
                      {formatDate(e.startedAt)}
                      {e.endedAt && ` ${formatDatetime(e.startedAt).split(" ")[1]} ~ ${formatDatetime(e.endedAt).split(" ")[1]}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.accent, minWidth: 60, textAlign: "right" }}>
                    {formatDuration(e.durationMinutes)}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    style={{
                      padding: "4px 8px", fontSize: 11, color: "#c62828",
                      background: "transparent", border: "1px solid #ffcdd2",
                      borderRadius: 4, cursor: "pointer",
                    }}
                  >삭제</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 사건별 취합 탭 */}
      {tab === "summary" && (
        <div>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>로딩 중...</p>
          ) : summary.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
              집계된 시간이 없습니다
            </div>
          ) : (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              {/* 헤더 */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 120px 80px",
                padding: "10px 20px", background: "#f8f8f8",
                fontSize: 12, fontWeight: 700, color: T.textSec,
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span>사건명</span>
                <span style={{ textAlign: "right" }}>총 시간</span>
                <span style={{ textAlign: "right" }}>기록 수</span>
              </div>
              {summary.map((s, i) => (
                <div
                  key={s.caseId || i}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 80px",
                    padding: "14px 20px",
                    borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>
                      {s.caseTitle || "(사건 미지정)"}
                    </div>
                    {s.caseNumber && (
                      <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>
                        {s.caseNumber}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.accent, textAlign: "right" }}>
                    {formatDuration(s.totalMinutes)}
                  </div>
                  <div style={{ fontSize: 13, color: T.textSec, textAlign: "right" }}>
                    {s.entryCount}건
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
