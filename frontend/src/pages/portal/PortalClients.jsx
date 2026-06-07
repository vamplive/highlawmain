/**
 * 포털 고객 관리 — 내부 구성원(변호사·직원) 전용
 * 고객 목록 조회, 검색, 등록, 수정, 삭제
 * 법률 사건 관련 정보(사건번호, 관할, 관련자) 포함
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

const JURISDICTION_OPTIONS = [
  "", "서울중앙지방법원", "서울동부지방법원", "서울서부지방법원", "서울남부지방법원", "서울북부지방법원",
  "수원지방법원", "인천지방법원", "의정부지방법원", "춘천지방법원", "대전지방법원",
  "청주지방법원", "대구지방법원", "부산지방법원", "울산지방법원", "창원지방법원",
  "광주지방법원", "전주지방법원", "제주지방법원", "기타",
];

const EMPTY_FORM = {
  name: "", phone: "", email: "", category: "", memo: "",
  caseNumber: "", jurisdiction: "", relatedPersonName: "", relatedPersonPhone: "",
};

const COLORS = {
  accent: "#1a3a6b",
  muted: "#94a3b8",
  border: "#e2e8f0",
  danger: "#ef4444",
  text: "#0f172a",
  bg: "#f8fafc",
  sectionBg: "#f8fafc",
  sectionLabel: "#64748b",
};

const inputStyle = {
  width: "100%", padding: "9px 11px", fontSize: 13,
  border: `1px solid ${COLORS.border}`, borderRadius: 6,
  outline: "none", boxSizing: "border-box", background: "#fff",
};

const labelStyle = {
  display: "block", fontSize: 11.5, fontWeight: 600,
  color: "#475569", marginBottom: 5,
};

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: COLORS.sectionLabel,
      textTransform: "uppercase", letterSpacing: "0.08em",
      margin: "18px 0 12px", paddingBottom: 6,
      borderBottom: `1px solid ${COLORS.border}`,
    }}>
      {children}
    </div>
  );
}

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client ? {
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
    category: client.category || "",
    memo: client.memo || "",
    caseNumber: client.caseNumber || "",
    jurisdiction: client.jurisdiction || "",
    relatedPersonName: client.relatedPersonName || "",
    relatedPersonPhone: client.relatedPersonPhone || "",
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
      padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "24px 28px",
        width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>
            {client ? "고객 정보 수정" : "신규 고객 등록"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={COLORS.muted} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── 기본 정보 ── */}
          <SectionTitle>기본 정보</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="홍길동" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>분야</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} style={inputStyle}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>전화번호 *</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="010-1234-5678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="example@email.com" style={inputStyle} />
            </div>
          </div>

          {/* ── 법률 사건 정보 ── */}
          <SectionTitle>법률 사건 정보</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>사건번호</label>
              <input
                value={form.caseNumber}
                onChange={(e) => update("caseNumber", e.target.value)}
                placeholder="예: 2024가단12345"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>관할 법원</label>
              <select value={form.jurisdiction} onChange={(e) => update("jurisdiction", e.target.value)} style={inputStyle}>
                {JURISDICTION_OPTIONS.map((j) => (
                  <option key={j} value={j}>{j || "미지정"}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 관련자 정보 ── */}
          <SectionTitle>관련자 정보</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>관련자 이름</label>
              <input
                value={form.relatedPersonName}
                onChange={(e) => update("relatedPersonName", e.target.value)}
                placeholder="상대방 또는 관련인 이름"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>관련자 전화번호</label>
              <input
                value={form.relatedPersonPhone}
                onChange={(e) => update("relatedPersonPhone", e.target.value)}
                placeholder="010-0000-0000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── 메모 ── */}
          <SectionTitle>메모</SectionTitle>
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={form.memo}
              onChange={(e) => update("memo", e.target.value)}
              placeholder="추가 메모 (사건 경위, 특이사항 등)"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical", minHeight: 72, lineHeight: 1.5,
              }}
            />
          </div>

          {/* 버튼 */}
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
                padding: "9px 24px", fontSize: 13, fontWeight: 600,
                background: saving ? "#93c5fd" : COLORS.accent,
                color: "#fff", border: "none", borderRadius: 6,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "저장 중..." : (client ? "수정 완료" : "등록")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** 목록에서 고객 행 클릭 시 상세 펼치기 */
function ClientRow({ client, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        style={{ borderBottom: expanded ? "none" : `1px solid ${COLORS.border}`, cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: COLORS.text }}>
          {client.name}
          {client.caseNumber && (
            <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
              {client.caseNumber}
            </span>
          )}
        </td>
        <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>
          {formatPhone(client.phone) || "-"}
        </td>
        <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>
          {client.jurisdiction || "-"}
        </td>
        <td style={{ padding: "12px 14px", fontSize: 12 }}>
          {client.category ? (
            <span style={{
              padding: "2px 8px", background: "#eff6ff", color: "#1d4ed8",
              borderRadius: 10, fontWeight: 500,
            }}>
              {CATEGORY_LABELS[client.category] || client.category}
            </span>
          ) : "-"}
        </td>
        <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onEdit(client)}
              style={{
                padding: "4px 10px", fontSize: 11, border: `1px solid ${COLORS.border}`,
                borderRadius: 5, background: "#fff", cursor: "pointer",
              }}
            >
              수정
            </button>
            <button
              onClick={() => onDelete(client.id)}
              style={{
                padding: "4px 10px", fontSize: 11, border: "1px solid #fca5a5",
                borderRadius: 5, background: "#fff", color: COLORS.danger, cursor: "pointer",
              }}
            >
              삭제
            </button>
          </div>
        </td>
      </tr>

      {/* 펼쳐진 상세 행 */}
      {expanded && (
        <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <td colSpan={5} style={{ padding: "0 14px 14px", background: COLORS.sectionBg }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, paddingTop: 12 }}>
              {[
                { label: "이메일", value: client.email },
                { label: "사건번호", value: client.caseNumber },
                { label: "관할 법원", value: client.jurisdiction },
                { label: "관련자", value: client.relatedPersonName ? `${client.relatedPersonName}${client.relatedPersonPhone ? ` (${formatPhone(client.relatedPersonPhone)})` : ""}` : null },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: COLORS.text }}>{value}</div>
                </div>
              ) : null)}
              {client.memo && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>메모</div>
                  <div style={{ fontSize: 12.5, color: COLORS.text, whiteSpace: "pre-wrap" }}>{client.memo}</div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
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
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>고객 관리</h1>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 0" }}>
            총 {meta.total}명 · 행 클릭 시 상세 정보 펼침
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
              {["이름 / 사건번호", "전화번호", "관할 법원", "분야", ""].map((h) => (
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
              <ClientRow
                key={c.id}
                client={c}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
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
