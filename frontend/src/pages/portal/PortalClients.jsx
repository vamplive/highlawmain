/**
 * 포털 고객 관리 페이지
 * - 고객 목록 CRUD (기본 정보)
 * - 고객별 법률 사건 다중 관리 (추가/수정/삭제, 자유 입력)
 * - 고객별 관련자 다중 관리 (추가/수정/삭제, 역할 구분)
 */
import { useState, useEffect, useCallback } from "react";
import { portalApi } from "../../utils/api";
import { Search, X, Plus, Trash2, Pencil, Check, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader, Pagination } from "../../components/admin";

const CATEGORY_OPTIONS = [
  { value: "", label: "분야 선택" },
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
  { value: "other", label: "기타" },
];

const ROLE_OPTIONS = [
  { value: "", label: "역할 선택" },
  { value: "수사관", label: "담당 수사관" },
  { value: "판사", label: "담당 판사" },
  { value: "상대방측", label: "상대방측" },
  { value: "우리측", label: "우리측" },
];

const EMPTY_CLIENT_FORM = { name: "", phone: "", email: "", category: "", memo: "" };

// =============================================
// 사건 섹션 컴포넌트
// =============================================
function CasesSection({ clientId }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalApi.get(`/clients/${clientId}/cases`);
      setCases(res.data?.data || []);
    } catch { /* 무시 */ }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  async function handleAdd() {
    if (!addForm?.caseNumber?.trim() && !addForm?.jurisdiction?.trim()) {
      alert("사건번호 또는 관할 법원을 입력해주세요.");
      return;
    }
    try {
      const res = await portalApi.post(`/clients/${clientId}/cases`, addForm);
      setCases((prev) => [...prev, res.data.data]);
      setAddForm(null);
    } catch (e) { alert(e.message || "저장에 실패했습니다."); }
  }

  async function handleEdit(id) {
    try {
      const res = await portalApi.patch(`/clients/${clientId}/cases/${id}`, editForm);
      setCases((prev) => prev.map((c) => c.id === id ? res.data.data : c));
      setEditingId(null);
    } catch (e) { alert(e.message || "수정에 실패했습니다."); }
  }

  async function handleDelete(id) {
    if (!confirm("이 사건 정보를 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/clients/${clientId}/cases/${id}`);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (e) { alert(e.message || "삭제에 실패했습니다."); }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ caseNumber: c.caseNumber || "", jurisdiction: c.jurisdiction || "", memo: c.memo || "" });
  }

  if (loading) return <div style={styles.sectionLoading}>불러오는 중...</div>;

  return (
    <div style={styles.subSection}>
      <div style={styles.subSectionHeader}>
        <span style={styles.subSectionTitle}>법률 사건</span>
        {!addForm && (
          <button style={styles.addBtn} onClick={() => setAddForm({ caseNumber: "", jurisdiction: "", memo: "" })}>
            <Plus size={13} /> 추가
          </button>
        )}
      </div>

      {cases.length === 0 && !addForm && (
        <div style={styles.emptyText}>등록된 사건이 없습니다.</div>
      )}

      {cases.map((c) => (
        <div key={c.id} style={styles.subRow}>
          {editingId === c.id ? (
            <div style={styles.inlineForm}>
              <input style={styles.inlineInput} placeholder="사건번호"
                value={editForm.caseNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, caseNumber: e.target.value }))} />
              <input style={styles.inlineInput} placeholder="관할 법원"
                value={editForm.jurisdiction}
                onChange={(e) => setEditForm((f) => ({ ...f, jurisdiction: e.target.value }))} />
              <input style={styles.inlineInput} placeholder="메모"
                value={editForm.memo}
                onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))} />
              <button style={styles.iconBtn} onClick={() => handleEdit(c.id)} title="저장"><Check size={14} /></button>
              <button style={styles.iconBtn} onClick={() => setEditingId(null)} title="취소"><X size={14} /></button>
            </div>
          ) : (
            <div style={styles.subRowContent}>
              <span style={styles.subRowMain}>{c.caseNumber || "—"}</span>
              <span style={styles.subRowSub}>{c.jurisdiction || ""}</span>
              {c.memo && <span style={styles.subRowMemo}>{c.memo}</span>}
              <div style={styles.subRowActions}>
                <button style={styles.iconBtn} onClick={() => startEdit(c)} title="수정"><Pencil size={13} /></button>
                <button style={styles.iconBtnDanger} onClick={() => handleDelete(c.id)} title="삭제"><Trash2 size={13} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addForm && (
        <div style={styles.inlineForm}>
          <input style={styles.inlineInput} placeholder="사건번호 (예: 2024가합12345)"
            value={addForm.caseNumber}
            onChange={(e) => setAddForm((f) => ({ ...f, caseNumber: e.target.value }))} />
          <input style={styles.inlineInput} placeholder="관할 법원 (예: 서울중앙지방법원)"
            value={addForm.jurisdiction}
            onChange={(e) => setAddForm((f) => ({ ...f, jurisdiction: e.target.value }))} />
          <input style={styles.inlineInput} placeholder="메모 (선택)"
            value={addForm.memo}
            onChange={(e) => setAddForm((f) => ({ ...f, memo: e.target.value }))} />
          <button style={styles.iconBtn} onClick={handleAdd} title="저장"><Check size={14} /></button>
          <button style={styles.iconBtn} onClick={() => setAddForm(null)} title="취소"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// =============================================
// 관련자 섹션 컴포넌트
// =============================================
function PersonsSection({ clientId }) {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchPersons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalApi.get(`/clients/${clientId}/persons`);
      setPersons(res.data?.data || []);
    } catch { /* 무시 */ }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  async function handleAdd() {
    if (!addForm?.name?.trim()) { alert("이름을 입력해주세요."); return; }
    try {
      const res = await portalApi.post(`/clients/${clientId}/persons`, addForm);
      setPersons((prev) => [...prev, res.data.data]);
      setAddForm(null);
    } catch (e) { alert(e.message || "저장에 실패했습니다."); }
  }

  async function handleEdit(id) {
    try {
      const res = await portalApi.patch(`/clients/${clientId}/persons/${id}`, editForm);
      setPersons((prev) => prev.map((p) => p.id === id ? res.data.data : p));
      setEditingId(null);
    } catch (e) { alert(e.message || "수정에 실패했습니다."); }
  }

  async function handleDelete(id) {
    if (!confirm("이 관련자 정보를 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/clients/${clientId}/persons/${id}`);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    } catch (e) { alert(e.message || "삭제에 실패했습니다."); }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({ name: p.name || "", phone: p.phone || "", role: p.role || "" });
  }

  const roleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "";

  if (loading) return <div style={styles.sectionLoading}>불러오는 중...</div>;

  return (
    <div style={styles.subSection}>
      <div style={styles.subSectionHeader}>
        <span style={styles.subSectionTitle}>관련자</span>
        {!addForm && (
          <button style={styles.addBtn} onClick={() => setAddForm({ name: "", phone: "", role: "" })}>
            <Plus size={13} /> 추가
          </button>
        )}
      </div>

      {persons.length === 0 && !addForm && (
        <div style={styles.emptyText}>등록된 관련자가 없습니다.</div>
      )}

      {persons.map((p) => (
        <div key={p.id} style={styles.subRow}>
          {editingId === p.id ? (
            <div style={styles.inlineForm}>
              <input style={styles.inlineInput} placeholder="이름"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              <input style={styles.inlineInput} placeholder="전화번호"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              <select style={styles.inlineSelect} value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button style={styles.iconBtn} onClick={() => handleEdit(p.id)} title="저장"><Check size={14} /></button>
              <button style={styles.iconBtn} onClick={() => setEditingId(null)} title="취소"><X size={14} /></button>
            </div>
          ) : (
            <div style={styles.subRowContent}>
              <span style={styles.subRowMain}>{p.name}</span>
              <span style={styles.subRowSub}>{p.phone || ""}</span>
              {p.role && <span style={styles.roleBadge}>{roleLabel(p.role)}</span>}
              <div style={styles.subRowActions}>
                <button style={styles.iconBtn} onClick={() => startEdit(p)} title="수정"><Pencil size={13} /></button>
                <button style={styles.iconBtnDanger} onClick={() => handleDelete(p.id)} title="삭제"><Trash2 size={13} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addForm && (
        <div style={styles.inlineForm}>
          <input style={styles.inlineInput} placeholder="이름 *"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
          <input style={styles.inlineInput} placeholder="전화번호"
            value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
          <select style={styles.inlineSelect} value={addForm.role}
            onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button style={styles.iconBtn} onClick={handleAdd} title="저장"><Check size={14} /></button>
          <button style={styles.iconBtn} onClick={() => setAddForm(null)} title="취소"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// =============================================
// 고객 기본정보 모달 (등록 + 수정)
// =============================================
function ClientModal({ client, onClose, onSaved }) {
  const isNew = !client?.id;
  const [form, setForm] = useState(
    isNew ? EMPTY_CLIENT_FORM : {
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      category: client.category || "",
      memo: client.memo || "",
    }
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      alert("이름과 전화번호를 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await portalApi.post("/clients", form);
        onSaved(res.data.data, "create");
      } else {
        const res = await portalApi.patch(`/clients/${client.id}`, form);
        onSaved(res.data.data, "update");
      }
    } catch (e) { alert(e.message || "저장에 실패했습니다."); }
    finally { setSaving(false); }
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{isNew ? "고객 등록" : `${client.name} 수정`}</h3>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.section}>
            <div style={styles.sectionLabel}>기본 정보</div>
            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <label style={styles.label}>이름 *</label>
                <input style={styles.input} value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>전화번호 *</label>
                <input style={styles.input} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>이메일</label>
                <input style={styles.input} type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>분야</label>
                <select style={styles.input} value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>메모</label>
              <textarea style={{ ...styles.input, height: 64, resize: "vertical" }}
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
            </div>
          </div>

          {/* 사건/관련자는 고객 생성 후 편집 모달에서만 표시 */}
          {!isNew && (
            <>
              <CasesSection clientId={client.id} />
              <PersonsSection clientId={client.id} />
            </>
          )}
        </div>

        <div style={styles.modalFooter}>
          {isNew && <span style={styles.footerNote}>등록 후 사건 및 관련자를 추가할 수 있습니다.</span>}
          <div style={styles.footerBtns}>
            <button style={styles.cancelBtn} onClick={onClose}>취소</button>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : isNew ? "등록" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 메인 페이지
// =============================================
export default function PortalClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [modal, setModal] = useState(null);   // null | { client: null } | { client: obj }
  const [expandedId, setExpandedId] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("q", search);
      const res = await portalApi.get(`/clients?${params}`);
      setClients(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (e) {
      if (e.status === 403) setError("내부 구성원만 이용할 수 있습니다.");
      else setError(e.message || "오류가 발생했습니다.");
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleSaved(savedClient, mode) {
    if (mode === "create") {
      setClients((prev) => [savedClient, ...prev]);
      // 등록 직후 수정 모달로 전환 → 사건/관련자 바로 추가 가능
      setModal({ client: savedClient });
    } else {
      setClients((prev) => prev.map((c) => c.id === savedClient.id ? savedClient : c));
      setModal(null);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`"${name}" 고객을 삭제하시겠습니까?`)) return;
    try {
      await portalApi.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) { alert(e.message || "삭제에 실패했습니다."); }
  }

  const categoryLabel = (val) => CATEGORY_OPTIONS.find((o) => o.value === val)?.label || val || "—";

  return (
    <div style={styles.page}>
      <PageHeader
        title="고객 관리"
        subtitle="의뢰인 정보, 법률 사건, 관련자를 통합 관리합니다"
        onAdd={() => setModal({ client: null })}
        addLabel="+ 고객 등록"
      />

      <div style={styles.searchBar}>
        <Search size={15} style={{ color: "#94a3b8" }} />
        <input
          style={styles.searchInput}
          placeholder="이름, 전화번호, 이메일 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && <button style={styles.clearBtn} onClick={() => setSearch("")}><X size={14} /></button>}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>불러오는 중...</div>
      ) : clients.length === 0 ? (
        <div style={styles.empty}>등록된 고객이 없습니다.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>전화번호</th>
                <th style={styles.th}>분야</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <>
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}>
                      <button
                        style={styles.expandBtn}
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      >
                        {expandedId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {c.name}
                      </button>
                    </td>
                    <td style={styles.td}>{c.phone}</td>
                    <td style={styles.td}>{categoryLabel(c.category)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button style={styles.editBtn} onClick={() => setModal({ client: c })}>수정</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(c.id, c.name)}>삭제</button>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={4} style={styles.expandedCell}>
                        <div style={styles.expandedContent}>
                          {c.email && <div style={styles.detailRow}><span style={styles.detailLabel}>이메일</span>{c.email}</div>}
                          {c.memo && <div style={styles.detailRow}><span style={styles.detailLabel}>메모</span>{c.memo}</div>}
                          <CasesSection clientId={c.id} />
                          <PersonsSection clientId={c.id} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      {modal && (
        <ClientModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// =============================================
// 스타일
// =============================================
const styles = {
  page: { padding: "24px", maxWidth: 960, margin: "0 auto" },
  primaryBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#1e3a5f", color: "#fff", border: "none",
    borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer",
  },
  searchBar: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
    padding: "8px 12px", marginBottom: 16,
  },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: 14 },
  clearBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8" },
  errorBanner: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
    borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 14,
  },
  loading: { textAlign: "center", color: "#94a3b8", padding: 40 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 40 },
  tableWrap: { background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 14px", textAlign: "left", fontSize: 12,
    color: "#64748b", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: 600,
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 14px", fontSize: 13, color: "#1e293b", verticalAlign: "middle" },
  expandBtn: {
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", cursor: "pointer",
    fontSize: 13, color: "#1e293b", fontWeight: 500, padding: 0,
  },
  editBtn: {
    background: "none", border: "1px solid #e2e8f0", borderRadius: 5,
    padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#475569", marginRight: 6,
  },
  deleteBtn: {
    background: "none", border: "1px solid #fca5a5", borderRadius: 5,
    padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#dc2626",
  },
  expandedCell: { padding: 0, background: "#f8fafc", borderBottom: "2px solid #e2e8f0" },
  expandedContent: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
  detailRow: { display: "flex", gap: 8, fontSize: 13, color: "#374151" },
  detailLabel: { color: "#94a3b8", minWidth: 60 },

  // 사건/관련자 서브 섹션
  subSection: { border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", overflow: "hidden" },
  sectionLoading: { padding: "10px 14px", color: "#94a3b8", fontSize: 13 },
  subSectionHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "8px 14px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
  },
  subSectionTitle: { fontSize: 12, fontWeight: 600, color: "#475569" },
  addBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "none", border: "1px solid #cbd5e1", borderRadius: 5,
    padding: "3px 8px", fontSize: 12, cursor: "pointer", color: "#475569",
  },
  emptyText: { padding: "10px 14px", fontSize: 12, color: "#94a3b8" },
  subRow: { borderBottom: "1px solid #f1f5f9" },
  subRowContent: { display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13 },
  subRowMain: { fontWeight: 500, color: "#1e293b", minWidth: 120 },
  subRowSub: { color: "#64748b", flex: 1 },
  subRowMemo: { color: "#94a3b8", fontSize: 12, flex: 1 },
  subRowActions: { display: "flex", gap: 4, marginLeft: "auto" },
  roleBadge: {
    background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
    borderRadius: 10, padding: "1px 8px", fontSize: 11, whiteSpace: "nowrap",
  },
  inlineForm: { display: "flex", gap: 6, padding: "8px 14px", alignItems: "center", background: "#f8fafc" },
  inlineInput: {
    flex: 1, border: "1px solid #e2e8f0", borderRadius: 5,
    padding: "5px 8px", fontSize: 12, outline: "none", minWidth: 0,
  },
  inlineSelect: {
    border: "1px solid #e2e8f0", borderRadius: 5,
    padding: "5px 8px", fontSize: 12, outline: "none", background: "#fff",
  },
  iconBtn: {
    background: "none", border: "1px solid #e2e8f0", borderRadius: 5,
    padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", color: "#475569",
  },
  iconBtnDanger: {
    background: "none", border: "1px solid #fca5a5", borderRadius: 5,
    padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", color: "#dc2626",
  },

  // 모달
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 12, width: "min(680px, 96vw)",
    maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 24px", borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" },
  modalBody: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 },
  section: { display: "flex", flexDirection: "column", gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  fieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#64748b" },
  input: {
    border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px",
    fontSize: 13, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box",
  },
  modalFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 24px", borderTop: "1px solid #e2e8f0", gap: 10,
  },
  footerNote: { fontSize: 12, color: "#94a3b8" },
  footerBtns: { display: "flex", gap: 8 },
  cancelBtn: {
    background: "none", border: "1px solid #e2e8f0", borderRadius: 7,
    padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "#64748b",
  },
  saveBtn: {
    background: "#1e3a5f", color: "#fff", border: "none",
    borderRadius: 7, padding: "8px 20px", fontSize: 13, cursor: "pointer",
  },
};
