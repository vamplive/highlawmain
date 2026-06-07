/**
 * 포털 고객 관리 — 내부 구성원(변호사·직원) 전용
 * 고객 목록 조회, 검색, 등록, 수정, 삭제
 */
import { useState, useEffect, useCallback } from "react";
import { portalApi } from "../../utils/api";
import { formatPhone } from "../../utils/formatters";
import { Search, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

const CATEGORY_OPTIONS = [
  { value: "", label: "미지정" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const EMPTY_FORM = { name: "", phone: "", email: "", category: "", memo: "" };

const COLORS = {
  accent: "#1a3a6b",
  muted: "#94a3b8",
  border: "#e2e8f0",
  danger: "#ef4444",
  text: "#0f172a",
  bg: "#f8fafc",
};

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client ? {
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
    category: client.category || "",
    memo: client.memo || "",
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!form.phone.trim()) { alert("전화번호를 입력해주세요."); return; }
    setSaving(true);
    try {
      if (client) {
        await portalApi.patch(`/clients/${client.id}`, form);
      } else {
        await portalApi.post("/clients", form);
      }
      onSave();
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28,
        width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>
            {client ? "고객 정보 수정" : "신규 고객 등록"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} color={COLORS.muted} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {[
            { field: "name", label: "이름 *", placeholder: "홍길동" },
            { field: "phone", label: "전화번호 *", placeholder: "010-1234-5678" },
            { field: "email", label: "이메일", placeholder: "example@email.com" },
            { field: "memo", label: "메모", placeholder: "추가 메모" },
          ].map(({ field, label, placeholder }) => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                {label}
              </label>
              <input
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%", padding: "9px 11px", fontSize: 13,
                  border: `1px solid ${COLORS.border}`, borderRadius: 6,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
              분야
            </label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              style={{
                width: "100%", padding: "9px 11px", fontSize: 13,
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                outline: "none", background: "#fff",
              }}
            >
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 20px", fontSize: 13, border: `1px solid ${COLORS.border}`,
                borderRadius: 6, background: "#fff", cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "9px 20px", fontSize: 13, fontWeight: 600,
                background: saving ? "#93c5fd" : COLORS.accent,
                color: "#fff", border: "none", borderRadius: 6,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PortalClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set("q", search);
      const res = await portalApi.get(`/clients?${q.toString()}`);
      setClients(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "고객 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleDelete = async (id) => {
    if (!confirm("이 고객을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/clients/${id}`);
      loadClients();
    } catch (err) {
      alert(err.message || "삭제에 실패했습니다.");
    }
  };

  const openEdit = (client) => { setEditTarget(client); setShowModal(true); };
  const openNew = () => { setEditTarget(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTarget(null); };
  const afterSave = () => { closeModal(); loadClients(); };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>고객 관리</h1>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 0" }}>
            총 {meta.total}명
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", fontSize: 13, fontWeight: 600,
            background: COLORS.accent, color: "#fff", border: "none",
            borderRadius: 8, cursor: "pointer",
          }}
        >
          <Plus size={15} /> 고객 등록
        </button>
      </div>

      {/* 검색창 */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름, 전화번호, 이메일 검색"
          style={{
            width: "100%", padding: "10px 12px 10px 36px", fontSize: 13,
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {error && (
        <div style={{ padding: 14, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: COLORS.danger, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* 테이블 */}
      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              {["이름", "전화번호", "이메일", "분야", ""].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px", fontSize: 11, fontWeight: 600,
                  color: COLORS.muted, textAlign: "left", letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: COLORS.muted }}>불러오는 중...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: COLORS.muted }}>고객이 없습니다</td></tr>
            ) : clients.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.text }}>{c.name}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{formatPhone(c.phone) || "-"}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{c.email || "-"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12 }}>
                  {c.category ? (
                    <span style={{
                      padding: "2px 8px", background: "#eff6ff", color: "#1d4ed8",
                      borderRadius: 10, fontWeight: 500,
                    }}>
                      {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                  ) : "-"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => openEdit(c)}
                      style={{
                        padding: "4px 10px", fontSize: 11, border: `1px solid ${COLORS.border}`,
                        borderRadius: 5, background: "#fff", cursor: "pointer",
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: "4px 10px", fontSize: 11, border: `1px solid #fca5a5`,
                        borderRadius: 5, background: "#fff", color: COLORS.danger, cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: COLORS.muted }}>{page} / {meta.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            style={{ padding: "6px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editTarget}
          onSave={afterSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
