/**
 * 법정 일정(Court Dates) 관리자 페이지 — 재판/조정/심문/선고/기한 일정.
 * 캘린더 대신 시간순 목록 + 다가오는 일정 강조 + 인라인 등록.
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, badgeStyle, fieldStyle, labelStyle, thStyle, tdStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";
import { formatDateTime } from "../../../utils/formatters";

const KINDS = [
  { value: "hearing", label: "변론기일", color: "#1d4ed8" },
  { value: "mediation", label: "조정기일", color: "#0891b2" },
  { value: "examination", label: "심문기일", color: "#7c3aed" },
  { value: "sentencing", label: "선고기일", color: "#dc2626" },
  { value: "deadline", label: "제출기한", color: "#ea580c" },
];
const STATUSES = [
  { value: "scheduled", label: "예정", color: COLORS.primary },
  { value: "completed", label: "완료", color: COLORS.success },
  { value: "postponed", label: "연기", color: COLORS.warning },
  { value: "cancelled", label: "취소", color: COLORS.muted },
];

function kindMeta(k) { return KINDS.find((x) => x.value === k) || KINDS[0]; }

function nowLocal() {
  return new Date().toISOString().slice(0, 16);
}

export default function CourtDatesPage() {
  const [dates, setDates] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [filterLawyer, setFilterLawyer] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [filterStatus, setFilterStatus] = useState("scheduled");
  const [filterUpcoming, setFilterUpcoming] = useState(true);

  const [creating, setCreating] = useState(false);
  const blankForm = {
    title: "", kind: "hearing", startsAt: nowLocal(), endsAt: "",
    courtName: "", courtRoom: "", caseNumber: "",
    lawyerId: "", clientId: "", reminderAt: "", memo: "",
  };
  const [form, setForm] = useState(blankForm);

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

  const loadDates = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterLawyer) params.set("lawyerId", filterLawyer);
      if (filterKind) params.set("kind", filterKind);
      if (filterStatus) params.set("status", filterStatus);
      if (filterUpcoming) params.set("upcoming", "true");
      const r = await api.get(`/court-dates?${params.toString()}`);
      setDates(r.data || []);
    } catch (e) { setErr(e.message); setDates([]); }
    finally { setLoading(false); }
  }, [filterLawyer, filterKind, filterStatus, filterUpcoming]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadDates(); }, [loadDates]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.startsAt) {
      setErr("제목과 시작 시각은 필수입니다.");
      return;
    }
    try {
      await api.post("/court-dates", {
        ...form,
        startsAt: form.startsAt.length === 16 ? `${form.startsAt}:00` : form.startsAt,
        endsAt: form.endsAt ? (form.endsAt.length === 16 ? `${form.endsAt}:00` : form.endsAt) : null,
        reminderAt: form.reminderAt ? `${form.reminderAt}:00` : null,
        lawyerId: form.lawyerId || null,
        clientId: form.clientId || null,
      });
      setForm(blankForm);
      setCreating(false);
      await loadDates();
    } catch (e) { setErr(e.message); }
  };

  const handleStatusChange = async (id, status) => {
    try { await api.put(`/court-dates/${id}`, { status }); await loadDates(); }
    catch (e) { setErr(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("일정을 삭제하시겠습니까?")) return;
    try { await api.del(`/court-dates/${id}`); await loadDates(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <PageHeader title="법정 일정" subtitle="재판·조정·심문·선고·서면 제출기한 통합 관리" />
      <RelatedLinks links={ERP_LINKS("/admin/court-dates")} label="빠른 이동" />
      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      {/* 필터 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
          <label style={labelStyle}>유형</label>
          <select style={fieldStyle} value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="">전체</option>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>상태</label>
          <select style={fieldStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">전체</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={filterUpcoming}
              onChange={(e) => setFilterUpcoming(e.target.checked)} />
            앞으로 다가올 일정만
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={() => setCreating(true)} style={btnStyle("primary")}>+ 일정 추가</button>
        </div>
      </div>

      {/* 신규 등록 폼 */}
      {creating && (
        <div style={{
          padding: 14, marginBottom: 16, background: "#fff",
          border: `1px solid ${COLORS.border}`, borderRadius: 8,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>제목 *</label>
              <input style={fieldStyle} placeholder="예: 김철수 vs 이영희 1차 변론기일"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>유형</label>
              <select style={fieldStyle} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>시작 *</label>
              <input style={fieldStyle} type="datetime-local"
                value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>종료</label>
              <input style={fieldStyle} type="datetime-local"
                value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>법원</label>
              <input style={fieldStyle} placeholder="서울중앙지방법원"
                value={form.courtName} onChange={(e) => setForm({ ...form, courtName: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>법정</label>
              <input style={fieldStyle} placeholder="제427호"
                value={form.courtRoom} onChange={(e) => setForm({ ...form, courtRoom: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>사건번호</label>
              <input style={fieldStyle} placeholder="2026가단123456"
                value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>담당 변호사</label>
              <select style={fieldStyle} value={form.lawyerId}
                onChange={(e) => setForm({ ...form, lawyerId: e.target.value })}>
                <option value="">선택 안함</option>
                {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>의뢰인</label>
              <select style={fieldStyle} value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">선택 안함</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>리마인더</label>
              <input style={fieldStyle} type="datetime-local"
                value={form.reminderAt} onChange={(e) => setForm({ ...form, reminderAt: e.target.value })} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>메모</label>
              <textarea style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }}
                value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setCreating(false)} style={btnStyle("ghost")}>취소</button>
            <button onClick={handleCreate} style={btnStyle("primary")}>저장</button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>
      ) : dates.length === 0 ? (
        <EmptyState message="등록된 일정이 없습니다." />
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
          <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.bgHeader }}>
                <th style={thStyle}>일시</th>
                <th style={thStyle}>유형</th>
                <th style={thStyle}>제목</th>
                <th style={thStyle}>법원/법정</th>
                <th style={thStyle}>사건번호</th>
                <th style={thStyle}>변호사</th>
                <th style={thStyle}>의뢰인</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {dates.map((d) => {
                const km = kindMeta(d.kind);
                const lawyer = lawyers.find((l) => l.id === d.lawyerId);
                const client = clients.find((c) => c.id === d.clientId);
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td data-label="일시" style={tdStyle}>{formatDateTime(d.startsAt)}</td>
                    <td data-label="유형" style={tdStyle}>
                      <span style={badgeStyle(km.color)}>{km.label}</span>
                    </td>
                    <td data-label="제목" style={tdStyle}>{d.title}</td>
                    <td data-label="법원" style={tdStyle}>{[d.courtName, d.courtRoom].filter(Boolean).join(" / ") || "-"}</td>
                    <td data-label="사건번호" style={tdStyle}>{d.caseNumber || "-"}</td>
                    <td data-label="변호사" style={tdStyle}>{lawyer?.name || "-"}</td>
                    <td data-label="의뢰인" style={tdStyle}>{client?.name || "-"}</td>
                    <td data-label="상태" style={tdStyle}>
                      <select style={{ ...fieldStyle, fontSize: 11, padding: "3px 6px", height: 26 }}
                        value={d.status} onChange={(e) => handleStatusChange(d.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDelete(d.id)}
                        style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 8px", color: COLORS.danger }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
