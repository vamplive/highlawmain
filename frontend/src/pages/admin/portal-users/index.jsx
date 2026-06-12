/**
 * 관리자 — 포털 사용자 관리
 * 회원가입 승인/거절 + 역할/입사일/포지션 편집 + 타임트래킹 전체 조회
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const TABS = ["pending", "active", "rejected"];
const TAB_LABELS = { pending: "승인 대기", active: "활성", rejected: "거절됨" };
const STATUS_BADGE = {
  0: { label: "승인 대기", color: "#e65100", bg: "#fff3e0" },
  1: { label: "활성", color: "#2e7d32", bg: "#e8f5e9" },
  "-1": { label: "거절", color: "#c62828", bg: "#ffebee" },
};
const ROLE_OPTIONS = [
  { value: "", label: "— 역할 선택 —" },
  { value: "대표변호사", label: "대표변호사" },
  { value: "변호사", label: "변호사" },
  { value: "전문위원", label: "전문위원" },
  { value: "직원", label: "직원" },
  { value: "인턴", label: "인턴" },
];

// ─── 타임트래킹 필터 컴포넌트 ───────────────────────────────────────────────
function TimeEntriesPanel() {
  const today = new Date().toISOString().substring(0, 10);
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({ from: today, to: today, caseId: "", portalUserId: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/portal/admin/users?status=active&limit=100")
      .then((r) => setUsers(r.data ?? []))
      .catch(() => {});
    api.get("/portal/admin/cases?limit=500")
      .then((r) => setCases(r.data ?? []))
      .catch(() => {});
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.caseId) params.set("caseId", filters.caseId);
      if (filters.portalUserId) params.set("portalUserId", filters.portalUserId);
      if (filters.description) params.set("description", filters.description);
      params.set("limit", "100");
      const res = await api.get(`/portal/admin/time-entries?${params}`);
      setEntries(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  function formatDuration(min) {
    if (!min) return "-";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);

  const fieldStyle = {
    padding: "8px 10px", fontSize: 13, border: "1px solid #d0d5dd",
    borderRadius: 6, background: "#fff",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>시작일</div>
          <input type="date" style={fieldStyle} value={filters.from} onChange={f("from")} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>종료일</div>
          <input type="date" style={fieldStyle} value={filters.to} onChange={f("to")} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>직원</div>
          <select style={{ ...fieldStyle, minWidth: 160 }} value={filters.portalUserId} onChange={f("portalUserId")}>
            <option value="">전체 직원</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.clientName || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>사건</div>
          <select style={{ ...fieldStyle, minWidth: 200, maxWidth: 300 }} value={filters.caseId} onChange={f("caseId")}>
            <option value="">전체 사건</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.caseNumber ? `(${c.caseNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", marginBottom: 4 }}>유형/작업내용 검색</div>
          <input type="text" style={fieldStyle} value={filters.description} onChange={f("description")} placeholder="예: 미팅, 준비서면, 통화..." />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={loadEntries}
            disabled={loading}
            style={{
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              color: "#fff", background: "#0b1f3a", border: "none",
              borderRadius: 6, cursor: "pointer",
            }}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
          총 <strong>{entries.length}</strong>건 · <strong>{Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분</strong>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              {["날짜", "직원", "사건", "작업 내용", "시간"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #e0e0e0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
                  조회 결과가 없습니다
                </td>
              </tr>
            ) : entries.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <td style={{ padding: "10px 14px", color: "#666" }}>
                  <div>{e.startedAt ? new Date(e.startedAt).toLocaleDateString("ko-KR") : "-"}</div>
                  {e.startedAt && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {new Date(e.startedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      {e.endedAt && ` ~ ${new Date(e.endedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 500 }}>{e.clientName || e.userEmail?.split("@")[0]}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{e.userEmail}</div>
                </td>
                <td style={{ padding: "10px 14px", color: "#555" }}>
                  {e.caseTitle || "-"}
                  {e.caseNumber && <div style={{ fontSize: 11, color: "#aaa" }}>{e.caseNumber}</div>}
                </td>
                <td style={{ padding: "10px 14px" }}>{e.description}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#c9a84c" }}>
                  {formatDuration(e.durationMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 사용자 편집 인라인 폼 ────────────────────────────────────────────────
function UserEditRow({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    role: user.role || "",
    position: user.position || "",
    hireDate: user.hireDate || "",
  });
  const [saving, setSaving] = useState(false);

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (form.role !== (user.role || "")) payload.role = form.role || null;
      if (form.position !== (user.position || "")) payload.position = form.position || null;
      if (form.hireDate !== (user.hireDate || "")) payload.hireDate = form.hireDate || null;
      // 변경사항 없어도 저장 허용 (role 초기화 목적)
      const updated = await api.patch(`/portal/admin/users/${user.id}`, {
        role: form.role || null,
        position: form.position || null,
        hireDate: form.hireDate || null,
      });
      onSave(updated.data || { ...user, ...form });
    } catch (err) {
      alert("저장 실패: " + (err.message || "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  };

  const inputSt = {
    padding: "5px 8px", fontSize: 12, border: "1px solid #d0d5dd",
    borderRadius: 4, background: "#fff", width: "100%",
  };

  return (
    <tr style={{ background: "#f0f7ff" }}>
      <td colSpan={6} style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>역할</div>
            <select style={inputSt} value={form.role} onChange={f("role")}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>직위 (표시명)</div>
            <input type="text" style={inputSt} value={form.position} onChange={f("position")} placeholder="예: 대표변호사, 팀장 등" />
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>입사일</div>
            <input type="date" style={inputSt} value={form.hireDate} onChange={f("hireDate")} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "6px 16px", fontSize: 12, fontWeight: 600,
                color: "#fff", background: "#0b1f3a",
                border: "none", borderRadius: 4, cursor: "pointer",
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: "6px 12px", fontSize: 12,
                color: "#555", background: "#fff",
                border: "1px solid #d0d5dd", borderRadius: 4, cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function AdminPortalUsers() {
  const [tab, setTab] = useState("pending");
  const [mainTab, setMainTab] = useState("users"); // "users" | "time-entries"
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/portal/admin/users?status=${tab}&limit=50`);
      setUsers(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [tab]);

  const handleApprove = async (id) => {
    setActionLoading(id + "_approve");
    try {
      await api.post(`/portal/admin/users/${id}/approve`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("이 사용자의 가입을 거절하시겠습니까?")) return;
    setActionLoading(id + "_reject");
    try {
      await api.post(`/portal/admin/users/${id}/reject`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 사용자를 삭제하시겠습니까?")) return;
    setActionLoading(id + "_delete");
    try {
      await api.delete(`/portal/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSave = (updatedUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
    setEditingId(null);
  };

  const S = {
    pageBg: "#f5f7fa",
    card: "#fff",
    border: "rgba(11,31,58,0.10)",
    accent: "#c9a84c",
    text: "#0b1f3a",
    textSec: "#4a5568",
    textMuted: "#8a97a8",
  };

  const mainTabStyle = (active) => ({
    padding: "10px 24px", fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? S.accent : S.textSec,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 4 }}>포털 사용자 관리</h1>
        <p style={{ fontSize: 14, color: S.textSec }}>회원가입 승인/거절 및 역할·입사일·포지션 편집, 타임트래킹 전체 조회</p>
      </div>

      {/* 메인 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, marginBottom: 24 }}>
        <button style={mainTabStyle(mainTab === "users")} onClick={() => setMainTab("users")}>회원 관리</button>
        <button style={mainTabStyle(mainTab === "time-entries")} onClick={() => setMainTab("time-entries")}>타임트래킹 조회</button>
      </div>

      {/* 회원 관리 탭 */}
      {mainTab === "users" && (
        <>
          <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#f0f0f0", borderRadius: 8, padding: 4, width: "fit-content" }}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 18px", fontSize: 13, fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "#fff" : S.textSec,
                  background: tab === t ? S.accent : "transparent",
                  border: "none", borderRadius: 6, cursor: "pointer",
                }}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: S.textMuted, padding: 40, textAlign: "center" }}>로딩 중...</p>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: S.textMuted, background: S.card, borderRadius: 10, border: `1px solid ${S.border}` }}>
              {TAB_LABELS[tab]} 사용자가 없습니다
            </div>
          ) : (
            <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8f8f8" }}>
                    {["이름", "이메일", "연락처", "역할 / 입사일", "가입일", "상태", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: S.textSec, borderBottom: `1px solid ${S.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const badge = STATUS_BADGE[String(u.isActive)] || STATUS_BADGE[0];
                    const isEditing = editingId === u.id;
                    return [
                      <tr key={u.id} style={{ borderBottom: (isEditing || i < users.length - 1) ? `1px solid ${S.border}` : "none", background: isEditing ? "#f7f9ff" : undefined }}>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{u.clientName || "-"}</td>
                        <td style={{ padding: "12px 16px", color: S.textSec }}>{u.email}</td>
                        <td style={{ padding: "12px 16px", color: S.textSec }}>{u.clientPhone || "-"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {u.role || u.position ? (
                            <div>
                              {u.role && <span style={{ fontSize: 12, fontWeight: 600, color: "#0b1f3a" }}>{u.role}</span>}
                              {u.position && u.position !== u.role && (
                                <span style={{ fontSize: 11, color: S.textMuted, marginLeft: 6 }}>({u.position})</span>
                              )}
                              {u.hireDate && (
                                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>
                                  입사 {u.hireDate}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: S.textMuted, fontSize: 12 }}>미설정</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: S.textMuted }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={() => setEditingId(isEditing ? null : u.id)}
                              style={{
                                padding: "5px 10px", fontSize: 12, fontWeight: 600,
                                color: isEditing ? "#555" : "#0b1f3a",
                                background: isEditing ? "#f0f0f0" : "#e8edf5",
                                border: "1px solid #c4d0e0", borderRadius: 4, cursor: "pointer",
                              }}
                            >
                              {isEditing ? "접기" : "편집"}
                            </button>
                            {u.isActive === 0 && (
                              <>
                                <button
                                  onClick={() => handleApprove(u.id)}
                                  disabled={actionLoading === u.id + "_approve"}
                                  style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#fff", background: "#2e7d32", border: "none", borderRadius: 4, cursor: "pointer" }}
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => handleReject(u.id)}
                                  disabled={actionLoading === u.id + "_reject"}
                                  style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#fff", background: "#c62828", border: "none", borderRadius: 4, cursor: "pointer" }}
                                >
                                  거절
                                </button>
                              </>
                            )}
                            {u.isActive === -1 && (
                              <button
                                onClick={() => handleApprove(u.id)}
                                style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#2e7d32", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 4, cursor: "pointer" }}
                              >
                                승인으로 변경
                              </button>
                            )}
                            {u.isActive === 1 && (
                              <button
                                onClick={() => handleReject(u.id)}
                                style={{ padding: "5px 12px", fontSize: 12, color: "#c62828", background: "transparent", border: "1px solid #ffcdd2", borderRadius: 4, cursor: "pointer" }}
                              >
                                비활성화
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(u.id)}
                              style={{ padding: "5px 8px", fontSize: 12, color: S.textMuted, background: "transparent", border: `1px solid ${S.border}`, borderRadius: 4, cursor: "pointer" }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>,
                      isEditing && (
                        <UserEditRow
                          key={u.id + "_edit"}
                          user={u}
                          onSave={handleEditSave}
                          onCancel={() => setEditingId(null)}
                        />
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 타임트래킹 조회 탭 */}
      {mainTab === "time-entries" && <TimeEntriesPanel />}
    </div>
  );
}
