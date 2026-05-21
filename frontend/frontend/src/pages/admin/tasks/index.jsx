/**
 * 업무(Tasks) 관리자 페이지 — 사건/계약/일반 업무 단위 관리.
 * 칸반 스타일 status 컬럼 + 필터(담당자/우선순위/마감일) + 인라인 생성/완료.
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, badgeStyle, fieldStyle, labelStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";

const STATUSES = [
  { value: "open", label: "대기", color: COLORS.muted },
  { value: "in_progress", label: "진행 중", color: COLORS.primary },
  { value: "blocked", label: "막힘", color: COLORS.danger },
  { value: "done", label: "완료", color: COLORS.success },
];
const PRIORITIES = [
  { value: "urgent", label: "🔥 긴급", color: "#dc2626" },
  { value: "high", label: "↑ 높음", color: "#ea580c" },
  { value: "medium", label: "보통", color: "#64748b" },
  { value: "low", label: "↓ 낮음", color: "#94a3b8" },
];

function priorityMeta(p) { return PRIORITIES.find((x) => x.value === p) || PRIORITIES[2]; }

function isOverdue(task) {
  if (!task.dueDate || ["done", "archived"].includes(task.status)) return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("open,in_progress,blocked");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "", priority: "medium", assigneeLawyerId: "", clientId: "", dueDate: "",
  });

  const loadMeta = useCallback(async () => {
    try {
      const [lws, cls] = await Promise.all([
        api.get("/lawyers?all=true"),
        api.get("/clients?limit=200"),
      ]);
      setLawyers(lws.data || []);
      setClients(cls.data || []);
    } catch (e) { setErr(e.message); }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterAssignee) params.set("assigneeLawyerId", filterAssignee);
      if (filterPriority) params.set("priority", filterPriority);
      if (filterStatus) params.set("status", filterStatus);
      if (filterOverdue) params.set("overdue", "true");
      const r = await api.get(`/tasks?${params.toString()}`);
      setTasks(r.data || []);
    } catch (e) { setErr(e.message); setTasks([]); }
    finally { setLoading(false); }
  }, [filterAssignee, filterPriority, filterStatus, filterOverdue]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleCreate = async () => {
    if (!newTask.title.trim()) { setErr("제목을 입력해주세요."); return; }
    try {
      await api.post("/tasks", {
        ...newTask,
        assigneeLawyerId: newTask.assigneeLawyerId || null,
        clientId: newTask.clientId || null,
        dueDate: newTask.dueDate || null,
      });
      setNewTask({ title: "", priority: "medium", assigneeLawyerId: "", clientId: "", dueDate: "" });
      setCreating(false);
      await loadTasks();
    } catch (e) { setErr(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try { await api.put(`/tasks/${id}`, { status }); await loadTasks(); }
    catch (e) { setErr(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("업무를 삭제하시겠습니까?")) return;
    try { await api.del(`/tasks/${id}`); await loadTasks(); }
    catch (e) { setErr(e.message); }
  };

  /* status 별 그룹핑 (칸반 컬럼) */
  const groups = STATUSES.reduce((acc, s) => {
    acc[s.value] = tasks.filter((t) => t.status === s.value);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="업무 관리" subtitle="사건·계약·일반 업무 — 담당자별 진행 상태 추적" />
      <RelatedLinks links={ERP_LINKS("/admin/tasks")} label="빠른 이동" />
      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      {/* 필터 + 신규 버튼 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10, marginBottom: 16, padding: 14, background: COLORS.bgForm,
        border: `1px solid ${COLORS.border}`, borderRadius: 8,
      }}>
        <div>
          <label style={labelStyle}>담당자</label>
          <select style={fieldStyle} value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="">전체</option>
            {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>우선순위</label>
          <select style={fieldStyle} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">전체</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>상태</label>
          <select style={fieldStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="open,in_progress,blocked">진행 중 (완료 제외)</option>
            <option value="open">대기</option>
            <option value="in_progress">진행 중</option>
            <option value="blocked">막힘</option>
            <option value="done">완료</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)} />
            기한 초과만
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={() => setCreating(true)} style={btnStyle("primary")}>+ 새 업무</button>
        </div>
      </div>

      {/* 신규 폼 */}
      {creating && (
        <div style={{
          padding: 14, marginBottom: 16,
          background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 8 }}>
            <input style={fieldStyle} placeholder="제목 *"
              value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            <select style={fieldStyle} value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select style={fieldStyle} value={newTask.assigneeLawyerId}
              onChange={(e) => setNewTask({ ...newTask, assigneeLawyerId: e.target.value })}>
              <option value="">미배정</option>
              {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select style={fieldStyle} value={newTask.clientId}
              onChange={(e) => setNewTask({ ...newTask, clientId: e.target.value })}>
              <option value="">의뢰인 없음</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input style={fieldStyle} type="date"
              value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleCreate} style={btnStyle("primary")}>저장</button>
              <button onClick={() => setCreating(false)} style={btnStyle("ghost")}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 칸반 컬럼 */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>
      ) : tasks.length === 0 ? (
        <EmptyState message="업무가 없습니다." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {STATUSES.map((s) => (
            <div key={s.value} style={{
              minHeight: 200, padding: 10, background: COLORS.bgForm,
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
                <span style={{ fontSize: 11, color: COLORS.muted }}>{groups[s.value].length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {groups[s.value].map((t) => {
                  const overdue = isOverdue(t);
                  const lawyer = lawyers.find((l) => l.id === t.assigneeLawyerId);
                  const client = clients.find((c) => c.id === t.clientId);
                  const pmeta = priorityMeta(t.priority);
                  return (
                    <div key={t.id} style={{
                      padding: 10, background: "#fff",
                      border: `1px solid ${overdue ? COLORS.danger : COLORS.border}`,
                      borderLeft: `4px solid ${pmeta.color}`,
                      borderRadius: 6, fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{t.title}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6 }}>
                        {lawyer?.name && `👤 ${lawyer.name}`}
                        {client?.name && ` · ${client.name}`}
                      </div>
                      {t.dueDate && (
                        <div style={{ fontSize: 10, color: overdue ? COLORS.danger : COLORS.textMuted, marginBottom: 6, fontWeight: overdue ? 600 : 400 }}>
                          📅 {t.dueDate} {overdue && "(지남)"}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={badgeStyle(pmeta.color)}>{pmeta.label}</span>
                        <select style={{ ...fieldStyle, fontSize: 10, padding: "2px 4px", height: 22 }}
                          value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}>
                          {STATUSES.map((s2) => <option key={s2.value} value={s2.value}>{s2.label}</option>)}
                        </select>
                        <button onClick={() => handleDelete(t.id)}
                          style={{ ...btnStyle("ghost"), fontSize: 10, padding: "2px 6px", color: COLORS.danger, marginLeft: "auto" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
