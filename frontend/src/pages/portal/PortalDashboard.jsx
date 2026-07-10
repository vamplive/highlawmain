/** 포털 대시보드 — 사건 목록, 사건 등록 버튼, 구글 캘린더 연동 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, pageHeaderStyle, pageHeaderIconStyle, fieldStyle, labelStyle } from "./portalStyles";
import { STATUS_MAP } from "./portalConstants";
import { showToast } from "../../utils/showToast";

// ── 정렬 헬퍼 ─────────────────────────────────────────────────────
const POSITION_ORDER = ["대표변호사","전문위원","부장","차장","과장","대리","주임","사원"];
const DEPT_ORDER = ["법무법인 하이로","전문위원","송무팀","기획팀","관리부"];
const sortMembers = (arr) => [...arr].sort((a, b) => {
  const ai = POSITION_ORDER.indexOf(a.position ?? ''), bi = POSITION_ORDER.indexOf(b.position ?? '');
  const po = (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  return po !== 0 ? po : (a.name || '').localeCompare(b.name || '', 'ko');
});
const sortDepts = (arr) => [...arr].sort((a, b) => {
  const ai = DEPT_ORDER.indexOf(a.name ?? ''), bi = DEPT_ORDER.indexOf(b.name ?? '');
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
});

// ── 할부 납입 예정 패널 (대표변호사 + 송무팀) ──────────────────────
const KANGMINKU = 'mingukang@highlaw.net';

function PaymentsPanel({ userRole, userEmail, userDeptId, sonmuDeptId }) {
  const [payments, setPayments] = React.useState([]);
  const [showCard, setShowCard] = React.useState(false);

  React.useEffect(() => {
    import('../../utils/api').then(({ portalApi }) => {
      portalApi.get('/cases/upcoming-payments')
        .then(r => {
          const data = Array.isArray(r.data) ? r.data : [];
          setPayments(data);
        })
        .catch(() => {});
    });
    setShowCard(userEmail === KANGMINKU);
  }, [userRole, userEmail]);

  const wire  = payments.filter(p => p.paymentMethod === '무통장입금' || !p.paymentMethod);
  const card  = payments.filter(p => p.paymentMethod === '카드');

  const fmtKRW = (n) => n ? Math.round(n).toLocaleString('ko-KR') : '0';

  if (!payments.length && !showCard) return (
    <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 18 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>할부 납입 예정</h4>
      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "12px 0" }}>예정 납입 없음</p>
    </div>
  );

  const TableBlock = ({ items, label }) => (
    <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 18 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
        {label === '무통장' ? '🏦' : '💳'} {label} 납입 예정
      </h4>
      {items.length === 0
        ? <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0", textAlign: "center" }}>해당 없음</p>
        : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>의뢰인</th>
                <th style={{ textAlign: "center", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>구분</th>
                <th style={{ textAlign: "center", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>납일</th>
                <th style={{ textAlign: "right", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>월납액</th>
                <th style={{ textAlign: "right", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>잔여</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "6px 0", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.clientName}>{p.clientName}</td>
                  <td style={{ padding: "6px 0", textAlign: "center", color: "#6b7280" }}>{p.type}</td>
                  <td style={{ padding: "6px 0", textAlign: "center", fontWeight: 600 }}>{p.dueDay}일</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, color: "#111827" }}>{fmtKRW(p.monthlyAmount)}원</td>
                  <td style={{ padding: "6px 0", textAlign: "right", color: "#6b7280" }}>{p.remainingCount}회</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );

  return (
    <>
      {wire.length > 0 && <TableBlock items={wire} label="무통장" />}
      {showCard && <TableBlock items={card} label="카드" />}
    </>
  );
}

// ── 편집 모달 공용 컴포넌트 ──────────────────────────────────────────
const COURT_TYPES = ["민사", "형사", "가사", "행정", "특허", "선거", "헌법", "기타"];
const STATUSES    = ["접수/상담", "진행", "완료", "상담종결"];
const EDIT_ROUTES = ["지인", "네이버", "인스타", "유튜브", "군돌이", "기타"];

const fmtKRW = (n) => n ? Math.round(Number(n)).toLocaleString("ko-KR") : "";

const SecTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>
    {children}
  </div>
);

function MemberPickerModal({ members, value, onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = members.find(m => m.id === value);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return lq ? members.filter(m => m.name?.toLowerCase().includes(lq) || m.position?.toLowerCase().includes(lq)) : members;
  }, [members, q]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={{ ...fieldStyle, paddingRight: 28 }}
        value={open ? q : (selected ? `${selected.name}${selected.position ? ` (${selected.position})` : ""}` : "")}
        onChange={e => { setQ(e.target.value); setOpen(true); if (!e.target.value) onSelect("", ""); }}
        onFocus={() => { setOpen(true); setQ(""); }}
        placeholder="구성원 검색..."
        autoComplete="off"
      />
      {value && (
        <button type="button" onMouseDown={e => { e.preventDefault(); onSelect("", ""); }}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 0 }}>
          ×
        </button>
      )}
      {open && (
        <div style={{ position: "absolute", zIndex: 300, top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.10)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13, color: T.textMuted, textAlign: "center" }}>검색 결과 없음</div>
          ) : filtered.map(m => (
            <div key={m.id} onMouseDown={() => { onSelect(m.id, m.name); setOpen(false); setQ(""); }}
              style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: m.id === value ? "rgba(201,168,76,0.08)" : "#fff" }}>
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              {m.position && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6 }}>{m.position}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeeFieldModal({ label, feeKey, installKey, dayKey, pmKey, form, onChange }) {
  const [showInstall, setShowInstall] = useState(Boolean(form[installKey]));
  const rawFee = Number(form[feeKey]) || 0;

  return (
    <div style={{ background: "#fafafa", border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
      <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" min="0" step="10000"
          style={{ ...fieldStyle, flex: 1, textAlign: "right" }}
          value={form[feeKey]}
          onChange={e => onChange(feeKey, e.target.value)}
          placeholder="0"
        />
        <span style={{ fontSize: 13, color: T.textSec, flexShrink: 0 }}>원</span>
      </div>
      {rawFee > 0 && (
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, textAlign: "right" }}>{fmtKRW(rawFee)}원</div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={showInstall} onChange={e => {
          setShowInstall(e.target.checked);
          if (!e.target.checked) { onChange(installKey, ""); onChange(dayKey, ""); }
        }} />
        할부 설정
      </label>
      {showInstall && (
        <>
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <label style={{ ...labelStyle, fontSize: 11 }}>결제 방식</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["무통장입금", "카드"].map(pm => (
                <label key={pm} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" name={`edit_pm_${feeKey}`} value={pm}
                    checked={form[pmKey] === pm}
                    onChange={() => onChange(pmKey, pm)} />
                  {pm}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <input type="number" min="1" max="60"
              style={{ ...fieldStyle, width: 88, paddingLeft: 10, paddingRight: 10, textAlign: "center" }}
              value={form[installKey]} onChange={e => onChange(installKey, e.target.value)} placeholder="3" />
            <span style={{ fontSize: 13, color: T.textSec }}>개월, 매월</span>
            <input type="number" min="1" max="31"
              style={{ ...fieldStyle, width: 78, paddingLeft: 10, paddingRight: 10, textAlign: "center" }}
              value={form[dayKey]} onChange={e => onChange(dayKey, e.target.value)} placeholder="15" />
            <span style={{ fontSize: 13, color: T.textSec }}>일</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── 사건 편집 모달 ─────────────────────────────────────────────────────
// ── 편집 모달 탭 컴포넌트 ─────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }} onClick={onCancel}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "28px 32px", width: 340,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>삭제 확인</div>
        <div style={{ fontSize: 14, color: "#475569", marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
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

function EditModalDocTab({ caseId }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const load = useCallback(() => {
    portalApi.get(`/cases/${caseId}/documents`).then(r => setDocs(r.data || [])).catch(() => {});
  }, [caseId]);
  useEffect(() => { load(); }, [load]);
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(file => fd.append("files", file));
    try {
      await portalApi.upload(`/cases/${caseId}/documents`, fd);
      showToast("업로드 완료", "success");
      load();
    } catch (err) {
      showToast("업로드 실패: " + err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const doDelete = async () => {
    const docId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await portalApi.delete(`/cases/documents/${docId}`);
      load();
    } catch (err) {
      showToast("삭제 실패: " + err.message, "error");
    }
  };
  return (
    <div>
      <label htmlFor={`modal-doc-${caseId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer", background: "#fafafa", fontSize: 13, color: T.textSec, marginBottom: 12 }}>
        📎 {uploading ? "업로드 중..." : "파일 첨부"}
      </label>
      <input id={`modal-doc-${caseId}`} type="file" multiple style={{ display: "none" }} onChange={handleUpload} />
      {docs.length === 0
        ? <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "24px 0" }}>첨부된 서류가 없습니다</p>
        : docs.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, background: "#f8fafc", marginBottom: 6, border: `1px solid ${T.border}` }}>
            <a href={`/api/portal/cases/documents/${d.id}/download`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: T.accent, textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📄 {d.originalName || d.filename || "파일"}
            </a>
            {d.uploadedBy === "portal" && (
              <button onClick={() => setConfirmDeleteId(d.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, padding: "0 4px", flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))
      }
      {confirmDeleteId && (
        <ConfirmDialog
          message="삭제하시겠습니까? 복구할 수 없습니다."
          onConfirm={doDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

function EditModalLitTab({ caseId }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const load = useCallback(() => {
    portalApi.get(`/cases/litigation-agreements?caseId=${caseId}`)
      .then(r => setDocs(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, [caseId]);
  useEffect(() => { load(); }, [load]);
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(file => fd.append("files", file));
    fd.append("documentType", "litigation_agreement");
    try {
      await portalApi.upload(`/cases/${caseId}/documents`, fd);
      showToast("소송위임계약서 업로드 완료", "success");
      load();
    } catch (err) {
      showToast("업로드 실패: " + err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const doDelete = async () => {
    const docId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await portalApi.delete(`/cases/documents/${docId}`);
      load();
    } catch (err) {
      showToast("삭제 실패: " + err.message, "error");
    }
  };
  return (
    <div>
      <label htmlFor={`modal-lit-${caseId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer", background: "#f0f9ff", fontSize: 13, color: T.accent, marginBottom: 12 }}>
        📋 {uploading ? "업로드 중..." : "소송위임계약서 첨부"}
      </label>
      <input id={`modal-lit-${caseId}`} type="file" accept=".pdf,.hwp,.hwpx,.doc,.docx" style={{ display: "none" }} onChange={handleUpload} />
      {docs.length === 0
        ? <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "24px 0" }}>첨부된 소송위임계약서가 없습니다</p>
        : docs.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ flex: 1, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.originalName || d.filename}</span>
            <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{d.createdAt?.slice(0, 10) || ""}</span>
            <button onClick={() => setConfirmDeleteId(d.id)} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>삭제</button>
          </div>
        ))
      }
      {confirmDeleteId && (
        <ConfirmDialog
          message="삭제하시겠습니까? 복구할 수 없습니다."
          onConfirm={doDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

function EditModalMsgTab({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const load = useCallback(() => {
    portalApi.get(`/cases/${caseId}/messages`).then(r => setMessages(r.data?.data || [])).catch(() => {});
  }, [caseId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await portalApi.post(`/cases/${caseId}/messages`, { content: text.trim() });
      setText("");
      load();
    } catch (err) {
      showToast("전송 실패: " + err.message, "error");
    } finally {
      setSending(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ overflowY: "auto", marginBottom: 10, minHeight: 80, maxHeight: 360 }}>
        {messages.length === 0
          ? <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "24px 0" }}>메시지가 없습니다</p>
          : messages.map((m, i) => (
            <div key={m.id || i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{m.senderName || "사용자"} · {m.createdAt ? new Date(m.createdAt).toLocaleString("ko-KR") : ""}</div>
              <div style={{ fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#f3f4f6", lineHeight: 1.5 }}>{m.content}</div>
            </div>
          ))
        }
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          style={{ ...fieldStyle, flex: 1 }} placeholder="메시지 입력 후 Enter" />
        <button onClick={send} disabled={sending || !text.trim()} style={{ padding: "0 16px", background: T.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: sending ? "default" : "pointer", opacity: (!text.trim() || sending) ? 0.5 : 1 }}>
          전송
        </button>
      </div>
    </div>
  );
}

function CaseEditModal({ caseId, members, departments, onSave, onClose }) {
  const INIT = {
    client: "", caseName: "", status: "접수/상담",
    consultantId: "", consultantName: "",
    visitRoute: "", referrerId: "", referrerName: "",
    retainerFee: "", retainerInstallments: "", retainerDay: "",
    paymentMethod: "",
    successFee: "", successInstallments: "", successDay: "",
    caseNumber: "", court: "", caseType: "",
    plaintiff: "", defendant: "", filedAt: "", description: "",
    registeredAt: "",
  };
  const [form, setForm] = useState(INIT);
  const [selectedLawyers, setSelectedLawyers] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referrerType, setReferrerType] = useState("external");
  const [selectedConsultants, setSelectedConsultants] = useState([]);
  const [modalTab, setModalTab] = useState("info");

  function splitTitle(title) {
    if (!title) return { client: "", caseName: "" };
    const idx = title.indexOf("_");
    if (idx < 0) return { client: "", caseName: title };
    return { client: title.slice(0, idx), caseName: title.slice(idx + 1) };
  }

  useEffect(() => {
    portalApi.get(`/cases/${caseId}`)
      .then(r => {
        const d = r.data?.data || r.data;
        const { client, caseName } = splitTitle(d.title || "");
        setForm({
          client: client || "",
          caseName: caseName || d.title || "",
          status: d.status || "접수/상담",
          consultantId: d.consultantId || "",
          consultantName: d.consultantName || "",
          visitRoute: d.visitRoute || "",
          referrerId: d.referrerId || "",
          referrerName: d.referrerName || "",
          retainerFee: d.retainerFee?.toString() || "",
          retainerInstallments: d.retainerInstallments?.toString() || "",
          retainerDay: d.retainerDay?.toString() || "",
          paymentMethod: d.paymentMethod || "",
          successFee: d.successFee?.toString() || "",
          successInstallments: d.successInstallments?.toString() || "",
          successDay: d.successDay?.toString() || "",
          caseNumber: d.caseNumber || "",
          court: d.court || "",
          caseType: d.caseType || "",
          plaintiff: d.plaintiff || "",
          defendant: d.defendant || "",
          filedAt: d.filedAt || "",
          description: d.description || "",
          registeredAt: d.registeredAt || (d.createdAt ? d.createdAt.slice(0, 10) : ""),
        });
        if (d.departmentIds) {
          try { setSelectedDeptIds(JSON.parse(d.departmentIds)); } catch { setSelectedDeptIds([]); }
        }
        if (d.memberIds) {
          try {
            const ids = JSON.parse(d.memberIds);
            // Will be populated once members list is available (passed as prop)
            setSelectedLawyers(ids.map(id => ({ id, name: id })));
          } catch { setSelectedLawyers([]); }
        }
        // consultantIds
        if (d.consultantIds) {
          try { const ids = JSON.parse(d.consultantIds); setSelectedConsultants(ids.map(id => ({ id, name: id }))); } catch {}
        } else if (d.consultantId) {
          setSelectedConsultants([{ id: d.consultantId, name: d.consultantName || d.consultantId }]);
        }
        if (d.referrerId) setReferrerType("member");
        else if (d.referrerName) setReferrerType("external");
      })
      .catch(() => setError("사건 정보를 불러올 수 없습니다"))
      .finally(() => setLoadingData(false));
  }, [caseId]);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const fld = (key) => (e) => setField(key, e.target.value);

  // Resolve IDs to names once members list is available
  const membersRef = JSON.stringify(members);
  useEffect(() => {
    if (!members || members.length === 0) return;
    setSelectedLawyers(prev =>
      prev.map(l => {
        const found = members.find(m => m.id === l.id);
        return found ? { id: l.id, name: found.name } : l;
      })
    );
    setSelectedConsultants(prev =>
      prev.map(c => {
        const found = members.find(m => m.id === c.id);
        return found ? { id: c.id, name: found.name } : c;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersRef]);

  const toggleLawyer = (lawyer) => {
    setSelectedLawyers(prev =>
      prev.some(l => l.id === lawyer.id)
        ? prev.filter(l => l.id !== lawyer.id)
        : [...prev, lawyer]
    );
  };

  const toggleDept = (id) => {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleConsultant = (member) => {
    setSelectedConsultants(prev =>
      prev.some(c => c.id === member.id)
        ? prev.filter(c => c.id !== member.id)
        : [...prev, { id: member.id, name: member.name }]
    );
  };

  const isReferral = form.visitRoute === "지인";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.caseName.trim()) return setError("사건명을 입력해주세요");
    setError("");
    setLoading(true);
    try {
      const composedTitle = form.client.trim()
        ? `${form.client.trim()}_${form.caseName.trim()}`
        : form.caseName.trim();
      const payload = {
        title: composedTitle,
        status: form.status,
        consultantIds: selectedConsultants.map(c => c.id),
        consultantId: selectedConsultants[0]?.id || null,
        consultantName: selectedConsultants[0]?.name || null,
        visitRoute: form.visitRoute || null,
        referrerId: form.visitRoute === "지인" ? (form.referrerId || null) : null,
        referrerName: (form.visitRoute === "지인" || form.visitRoute === "기타") ? (form.referrerName || null) : null,
        retainerFee: form.retainerFee ? parseInt(form.retainerFee) : null,
        retainerInstallments: form.retainerInstallments ? parseInt(form.retainerInstallments) : null,
        retainerDay: form.retainerDay ? parseInt(form.retainerDay) : null,
        successFee: form.successFee ? parseInt(form.successFee) : null,
        successInstallments: form.successInstallments ? parseInt(form.successInstallments) : null,
        successDay: form.successDay ? parseInt(form.successDay) : null,
        caseNumber: form.caseNumber.trim() || null,
        court: form.court.trim() || null,
        caseType: form.caseType || null,
        plaintiff: form.plaintiff.trim() || null,
        defendant: form.defendant.trim() || null,
        filedAt: form.filedAt || null,
        description: form.description.trim() || null,
        registeredAt: form.registeredAt || null,
        departmentIds: selectedDeptIds,
        members: selectedLawyers.map(l => ({ id: l.id, name: l.name })),
      };
      await portalApi.patch(`/cases/${caseId}`, payload);
      if (selectedFiles.length > 0) {
        const fd = new FormData();
        selectedFiles.forEach(f => fd.append("files", f));
        try {
          await portalApi.upload(`/cases/${caseId}/documents`, fd);
        } catch (uploadErr) {
          showToast("파일 업로드 중 일부 오류: " + uploadErr.message, "warning");
        }
      }
      showToast("사건이 수정되었습니다", "success");
      onSave();
    } catch (err) {
      setError(err.message || "사건 수정에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "32px 16px 60px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 960, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "16px 28px 0", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>사건 편집</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "0 4px" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { key: "info", label: "사건 정보" },
              { key: "docs", label: "📁 서류" },
              { key: "lit",  label: "📋 위임계약서" },
              { key: "msgs", label: "💬 메시지" },
            ].map(tb => {
              const on = modalTab === tb.key;
              return (
                <button key={tb.key} type="button" onClick={() => setModalTab(tb.key)} style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: on ? 700 : 500,
                  border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
                  background: on ? "#f9fafb" : "transparent",
                  color: on ? T.accent : "#9ca3af",
                  borderBottom: on ? `2px solid ${T.accent}` : "2px solid transparent",
                  marginBottom: -1,
                }}>
                  {tb.label}
                </button>
              );
            })}
          </div>
        </div>

        {loadingData ? (
          <div style={{ padding: 64, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>불러오는 중...</div>
        ) : (
          <>
          {modalTab === "info" && <form onSubmit={handleSubmit} style={{ padding: 28 }}>

            {/* 기본 정보 */}
            <SecTitle>기본 정보</SecTitle>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>의뢰인</label>
              <input style={fieldStyle} value={form.client} onChange={fld("client")} placeholder="예: 홍길동, (주)대한건설" />
            </div>
            {members.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>상담자</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sortMembers(members).map(m => {
                    const sel = selectedConsultants.some(c => c.id === m.id);
                    return (
                      <button key={m.id} type="button" onClick={() => toggleConsultant(m)} style={{
                        padding: "6px 12px", fontSize: 13, borderRadius: 20, cursor: "pointer",
                        border: sel ? `2px solid #6366f1` : "1px solid #d1d5db",
                        background: sel ? "#eef2ff" : "#fff",
                        color: sel ? "#6366f1" : "#374151", fontWeight: sel ? 600 : 400,
                      }}>
                        {m.name}{m.position && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{m.position}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>사건명 *</label>
              <input style={fieldStyle} value={form.caseName} onChange={fld("caseName")} placeholder="예: 부당이득금 반환청구" required />
              {form.client.trim() && form.caseName.trim() && (
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                  저장될 사건명: <strong style={{ color: T.text }}>{form.client.trim()}_{form.caseName.trim()}</strong>
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>진행 상태</label>
                <select style={{ ...fieldStyle, appearance: "none" }} value={form.status} onChange={fld("status")}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>방문 루트</label>
                <select style={{ ...fieldStyle, appearance: "none" }} value={form.visitRoute} onChange={fld("visitRoute")}>
                  <option value="">선택 안 함</option>
                  {EDIT_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>수임일</label>
                <input type="date" style={fieldStyle} value={form.registeredAt} onChange={fld("registeredAt")} />
              </div>
            </div>

            {/* 지인 소개자 */}
            {form.visitRoute === "지인" && (
              <div style={{ marginBottom: 12, padding: 12, background: "#f5f3ff", border: "1px solid #e9d5ff", borderRadius: 8 }}>
                <label style={{ ...labelStyle, color: "#7c3aed", marginBottom: 8 }}>소개자</label>
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  {["member", "external"].map(type => (
                    <label key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer", color: "#7c3aed" }}>
                      <input type="radio" name="edit_referrerType" value={type}
                        checked={referrerType === type}
                        onChange={() => { setReferrerType(type); setField("referrerId", ""); setField("referrerName", ""); }}
                      />
                      {type === "member" ? "구성원 중 선택" : "외부인 직접 입력"}
                    </label>
                  ))}
                </div>
                {referrerType === "member" ? (
                  <MemberPickerModal
                    members={members}
                    value={form.referrerId}
                    onSelect={(id, name) => { setField("referrerId", id); setField("referrerName", name); }}
                  />
                ) : (
                  <input style={fieldStyle} value={form.referrerName}
                    onChange={e => { setField("referrerName", e.target.value); setField("referrerId", ""); }}
                    placeholder="소개자 이름 입력 (예: 홍길동)" />
                )}
              </div>
            )}

            {/* 기타 루트 상세 */}
            {form.visitRoute === "기타" && (
              <div style={{ marginBottom: 12, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <label style={{ ...labelStyle, color: "#475569", marginBottom: 6, display: "block" }}>루트 상세 (선택)</label>
                <input style={fieldStyle} value={form.referrerName} onChange={e => setField("referrerName", e.target.value)}
                  placeholder="예: 네이버 블로그, 지인 소개, 현수막 등" />
              </div>
            )}

            {/* 사건번호 */}
            <SecTitle>사건번호 (선택)</SecTitle>
            <div style={{ marginBottom: 12 }}>
              <input style={fieldStyle} value={form.caseNumber} onChange={fld("caseNumber")} placeholder="예: 2024가합12345" />
            </div>

            {/* 수임 조건 */}
            <SecTitle>수임 조건</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <FeeFieldModal label="착수금" feeKey="retainerFee" installKey="retainerInstallments" dayKey="retainerDay" pmKey="paymentMethod" form={form} onChange={setField} />
              <FeeFieldModal label="성공보수" feeKey="successFee" installKey="successInstallments" dayKey="successDay" pmKey="paymentMethod" form={form} onChange={setField} />
            </div>

            {/* 법원 정보 */}
            <SecTitle>법원 정보</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>법원명</label>
                <input style={fieldStyle} value={form.court} onChange={fld("court")} placeholder="예: 서울중앙지방법원 제1민사부" />
              </div>
              <div>
                <label style={labelStyle}>사건 유형</label>
                <select style={{ ...fieldStyle, appearance: "none" }} value={form.caseType} onChange={fld("caseType")}>
                  <option value="">선택</option>
                  {COURT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>제소일</label>
                <input type="date" style={fieldStyle} value={form.filedAt} onChange={fld("filedAt")} />
              </div>
            </div>

            {/* 당사자 */}
            <SecTitle>당사자</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>원고</label>
                <input style={fieldStyle} value={form.plaintiff} onChange={fld("plaintiff")} placeholder="원고 성명/법인명" />
              </div>
              <div>
                <label style={labelStyle}>피고</label>
                <input style={fieldStyle} value={form.defendant} onChange={fld("defendant")} placeholder="피고 성명/법인명" />
              </div>
            </div>

            {/* 담당자 / 공유 부서 — 내부 사용자 전용 */}
            {members.length > 0 && (
              <>
                <SecTitle>담당자 / 공유 부서</SecTitle>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>주담당변호사</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sortMembers(members).map(m => {
                      const sel = selectedLawyers.some(l => l.id === m.id);
                      return (
                        <button key={m.id} type="button" onClick={() => toggleLawyer(m)} style={{
                          padding: "6px 12px", fontSize: 13, borderRadius: 20, cursor: "pointer",
                          border: sel ? `2px solid ${T.accent}` : "1px solid #d1d5db",
                          background: sel ? `${T.accent}15` : "#fff",
                          color: sel ? T.accent : "#374151", fontWeight: sel ? 600 : 400,
                        }}>
                          {m.name}{m.position && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{m.position}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>공유 부서 (복수 선택 가능)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sortDepts(departments).map(d => {
                      const sel = selectedDeptIds.includes(d.id);
                      return (
                        <button key={d.id} type="button" onClick={() => toggleDept(d.id)} style={{
                          padding: "6px 12px", fontSize: 13, borderRadius: 20, cursor: "pointer",
                          border: sel ? `2px solid ${T.accent}` : "1px solid #d1d5db",
                          background: sel ? `${T.accent}15` : "#fff",
                          color: sel ? T.accent : "#374151", fontWeight: sel ? 600 : 400,
                        }}>
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 메모 */}
            <SecTitle>메모</SecTitle>
            <div style={{ marginBottom: 20 }}>
              <textarea style={{ ...fieldStyle, height: 80, resize: "vertical" }} value={form.description} onChange={fld("description")} placeholder="사건에 대한 메모나 특이사항을 입력하세요" />
            </div>

            {/* 파일 첨부 */}
            <SecTitle>파일 첨부 (선택 — 기존 파일에 추가됩니다)</SecTitle>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="editCaseFiles" style={{
                display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
                border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer",
                background: "#fafafa", fontSize: 13, color: T.textSec,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <span style={{ fontSize: 20 }}>📎</span>
                <span>클릭하여 파일 선택 (PDF, HWP, HWPX, DOC, DOCX, PPT 등 최대 20개, 각 50MB)</span>
              </label>
              <input
                id="editCaseFiles" type="file" multiple
                accept=".pdf,.hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xlsx,.jpg,.jpeg,.png,.txt,.zip"
                style={{ display: "none" }}
                onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
              />
              {selectedFiles.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: 5, marginTop: 4, fontSize: 12 }}>
                  <span>📄 {f.name}</span>
                  <button type="button" onClick={() => setSelectedFiles(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>

            {error && <p style={{ fontSize: 13, color: "#c62828", marginBottom: 14, textAlign: "center" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}>
                취소
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#fff", background: T.accent, border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>}
          {modalTab === "docs" && <div style={{ padding: 28 }}><EditModalDocTab caseId={caseId} /></div>}
          {modalTab === "lit"  && <div style={{ padding: 28 }}><EditModalLitTab caseId={caseId} /></div>}
          {modalTab === "msgs" && <div style={{ padding: 28 }}><EditModalMsgTab caseId={caseId} /></div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── 사건 목록 테이블 ───────────────────────────────────────────────────
const ROUTES = ["지인", "네이버", "인스타", "유튜브", "기타"];

function splitTitle(title) {
  if (!title) return { client: "", caseName: "" };
  const idx = title.indexOf("_");
  if (idx < 0) return { client: "", caseName: title };
  return { client: title.slice(0, idx), caseName: title.slice(idx + 1) };
}

function CaseTable({ cases, googleConnected, syncingCaseId, deletingCaseId, userRole, handleSyncToCalendar, handleDeleteCase, onEdit, members }) {
  const idToName = {};
  (members || []).forEach(m => { if (m.id) idToName[m.id] = m.name; });
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
            {[["사건명", "left", 14], ["의뢰인", "left", 10], ["원고/피고", "left", 10], ["방문루트", "left", 10], ["상태", "left", 10], ["수임일", "left", 10], ["액션", "center", 10]].map(([label, align, px]) => (
              <th key={label} style={{ textAlign: align, padding: `9px ${px}px`, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", fontSize: 12 }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((c, idx) => {
            const statusStyle = STATUS_MAP[c.status] || STATUS_MAP["접수/상담"];
            const partyStr = [c.plaintiff, c.defendant].filter(Boolean).join(" / ");
            const routeLabel = c.visitRoute === "기타" && c.referrerName ? ("기타: " + c.referrerName) : c.visitRoute;
            const dateStr = (c.registeredAt || c.createdAt) ? new Date(c.registeredAt || c.createdAt).toLocaleDateString("ko-KR") : "—";
            const clientDisplay = splitTitle(c.title).client || "—";
            return (
              <tr key={c.id}
                style={{ borderBottom: idx < cases.length - 1 ? "1px solid #f3f4f6" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ padding: "9px 14px", maxWidth: 220 }}>
                  {userRole !== null ? (
                    <button type="button" onClick={() => onEdit(c.id)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: T.text, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", font: "inherit" }} title={c.title}>
                      {c.title}
                    </button>
                  ) : (
                    <Link to={`/portal/cases/${c.id}`} style={{ textDecoration: "none", color: T.text, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.title}>
                      {c.title}
                    </Link>
                  )}
                  {c.caseNumber && <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>{c.caseNumber}</span>}
                </td>
                <td style={{ padding: "9px 10px", color: T.textSec, whiteSpace: "nowrap" }}>{clientDisplay}</td>
                <td style={{ padding: "9px 10px", color: T.textSec, maxWidth: 160 }}>
                  {partyStr ? <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={partyStr}>{partyStr}</span> : "—"}
                </td>
                <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                  {c.visitRoute ? (
                    <span style={{ padding: "2px 7px", background: "#f1f5f9", borderRadius: 8, fontSize: 11 }}>{routeLabel}</span>
                  ) : "—"}
                </td>
                <td style={{ padding: "9px 10px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 8, background: statusStyle.bg, color: statusStyle.color, fontWeight: 500 }}>{c.status}</span>
                  {(() => {
                    let ids = [];
                    try { ids = JSON.parse(c.memberIds || '[]'); } catch {}
                    const names = ids.map(id => idToName[id]).filter(Boolean);
                    if (names.length === 0 && c.lawyerName) names.push(c.lawyerName);
                    return names.length > 0 ? (
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{names.join(', ')}</div>
                    ) : null;
                  })()}
                </td>
                <td style={{ padding: "9px 10px", color: T.textMuted, whiteSpace: "nowrap", fontSize: 12 }}>{dateStr}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {userRole !== null && (
                      <button onClick={() => onEdit(c.id)} title="편집"
                        style={{ padding: "3px 6px", fontSize: 12, color: T.accent, background: "transparent", border: `1px solid ${T.accent}40`, borderRadius: 4, cursor: "pointer" }}>
                        ✏️
                      </button>
                    )}
                    {googleConnected && (
                      <button onClick={() => handleSyncToCalendar(c.id, c.title)} disabled={syncingCaseId === c.id}
                        title="캘린더 추가" style={{ padding: "3px 6px", fontSize: 12, color: "#1a73e8", background: "transparent", border: "1px solid #c5d8f7", borderRadius: 4, cursor: "pointer", opacity: syncingCaseId === c.id ? 0.5 : 1 }}>
                        📅
                      </button>
                    )}
                    {userRole !== null && (
                      <button onClick={(e) => handleDeleteCase(c.id, c.title, e)} disabled={deletingCaseId === c.id}
                        title="삭제" style={{ padding: "3px 6px", fontSize: 12, color: "#ef4444", background: "transparent", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer", opacity: deletingCaseId === c.id ? 0.5 : 1 }}>
                        🗑
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


// ── 구성원별 담당 사건 통계 ────────────────────────────────────────────
const STAT_TABS = [
  { key: "진행",      label: "진행",      color: "#c9a84c", bg: "rgba(201,168,76,0.12)", filter: c => c.status === "진행" },
  { key: "접수/상담", label: "접수/상담", color: "#92400e", bg: "#fef3c7",               filter: c => ["접수/상담","접수","상담"].includes(c.status) },
  { key: "완료",      label: "완료",      color: "#15803d", bg: "#dcfce7",               filter: c => c.status === "완료" },
  { key: "상담종결",  label: "상담종결",  color: "#6b7280", bg: "#f3f4f6",               filter: c => c.status === "상담종결" },
  { key: "전체",      label: "전체",      color: "#2563eb", bg: "#eff6ff",               filter: () => true },
];

function buildMemberStats(filtered, idToName) {
  const countMap = {};
  filtered.forEach(c => {
    let ids = [];
    if (c.memberIds) { try { ids = JSON.parse(c.memberIds); } catch { ids = []; } }
    if (ids.length === 0 && c.lawyerName) {
      countMap[c.lawyerName] = (countMap[c.lawyerName] || 0) + 1;
      return;
    }
    ids.forEach(id => {
      const name = idToName[id] || id;
      countMap[name] = (countMap[name] || 0) + 1;
    });
  });
  return Object.entries(countMap).sort((a, b) => b[1] - a[1]);
}

function MemberCaseStats({ cases, members }) {
  const [activeTab, setActiveTab] = React.useState("진행");

  const idToName = {};
  (members || []).forEach(m => { if (m.id && m.name) idToName[m.id] = m.name; });

  const tab = STAT_TABS.find(tb => tb.key === activeTab) || STAT_TABS[0];
  const stats = buildMemberStats(cases.filter(tab.filter), idToName);
  const max = stats[0]?.[1] || 1;

  // 탭별 총 건수 (뱃지)
  const tabCounts = {};
  STAT_TABS.forEach(tb => {
    tabCounts[tb.key] = cases.filter(tb.filter).length;
  });

  if (cases.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, marginTop: 12, overflow: "hidden" }}>
      {/* 헤더 + 탭 */}
      <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f1f5f9" }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>구성원별 담당 사건</h4>
        <div style={{ display: "flex", gap: 2 }}>
          {STAT_TABS.map(tb => {
            const on = activeTab === tb.key;
            return (
              <button key={tb.key} onClick={() => setActiveTab(tb.key)} style={{
                padding: "5px 10px", fontSize: 11, fontWeight: on ? 700 : 500,
                border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
                background: on ? tb.bg : "transparent",
                color: on ? tb.color : "#9ca3af",
                borderBottom: on ? `2px solid ${tb.color}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tb.label}
                {tabCounts[tb.key] > 0 && (
                  <span style={{
                    marginLeft: 4, fontSize: 10, fontWeight: 700,
                    background: on ? tb.color : "#e5e7eb",
                    color: on ? "#fff" : "#6b7280",
                    borderRadius: 8, padding: "1px 5px",
                  }}>{tabCounts[tb.key]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 바 차트 */}
      <div style={{ padding: "14px 18px" }}>
        {stats.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "8px 0" }}>해당 상태의 사건이 없습니다</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {stats.map(([name, count]) => (
                <tr key={name} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "6px 8px 6px 0", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>{name}</td>
                  <td style={{ padding: "6px 0", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f3f4f6", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(count / max * 100)}%`, background: tab.color, borderRadius: 3, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontWeight: 700, color: tab.color, minWidth: 24, textAlign: "right" }}>{count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function PortalDashboard() {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncingCaseId, setSyncingCaseId] = useState(null);
  const [deletingCaseId, setDeletingCaseId] = useState(null);
  const [stats, setStats] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userDeptId, setUserDeptId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  // 상태별 페이지 (각 테이블 독립 페이지네이션)
  const [statusPages, setStatusPages] = useState({});

  // 편집 모달 상태
  const [editCaseId, setEditCaseId] = useState(null);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [statsMonth, setStatsMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    const googleConnectedParam = searchParams.get("googleConnected");
    const googleErrorParam = searchParams.get("googleError");
    if (googleConnectedParam === "1") {
      showToast("구글 캘린더가 연동되었습니다", "success");
      setGoogleConnected(true);
      window.history.replaceState({}, "", "/portal/dashboard");
    } else if (googleErrorParam) {
      showToast(`구글 캘린더 연동 실패: ${googleErrorParam}`, "error");
      window.history.replaceState({}, "", "/portal/dashboard");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      portalApi.get("/cases"),
      portalApi.get("/me"),
    ]).then(([casesRes, meRes]) => {
      if (cancelled) return;
      setCases(casesRes.data ?? []);
      const clientName = meRes.data?.client?.name;
      if (clientName) setUserName(clientName);
      setGoogleConnected(Boolean(meRes.data?.user?.googleConnected));
      const role = meRes.data?.user?.role || null;
      setUserRole(role);
      setUserEmail(meRes.data?.user?.email || "");
      setUserDeptId(meRes.data?.user?.departmentId || "");

      // 내부 구성원: 담당자/부서 목록 로드
      if (role) {
        Promise.all([
          portalApi.get("/internal/lawyers"),
          portalApi.get("/internal/departments"),
        ]).then(([lRes, dRes]) => {
          if (!cancelled) {
            setMembers(lRes.data || []);
            setDepartments(dRes.data || []);
          }
        }).catch(() => {});
      }
    }).catch(() => {
      if (!cancelled) setCases([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const fetchStats = useCallback(() => {
    portalApi.get(`/cases/stats?year=${statsMonth.year}&month=${statsMonth.month}`)
      .then(r => setStats(r))
      .catch(() => {});
  }, [statsMonth]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleGoogleConnect = async () => {
    try {
      const res = await portalApi.get("/google/auth-url");
      if (!res.data?.configured) {
        showToast("구글 캘린더 연동이 아직 설정되지 않았습니다", "error");
        return;
      }
      window.location.href = res.data.authUrl;
    } catch {
      showToast("구글 캘린더 연동 URL을 가져오지 못했습니다", "error");
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!window.confirm("구글 캘린더 연동을 해제하시겠습니까?")) return;
    try {
      await portalApi.delete("/google/disconnect");
      setGoogleConnected(false);
      showToast("구글 캘린더 연동이 해제되었습니다", "success");
    } catch {
      showToast("연동 해제에 실패했습니다", "error");
    }
  };

  const handleSyncToCalendar = async (caseId, caseTitle) => {
    setSyncingCaseId(caseId);
    try {
      await portalApi.post(`/google/sync-case/${caseId}`);
      showToast(`"${caseTitle}" 사건이 구글 캘린더에 추가되었습니다`, "success");
    } catch (err) {
      showToast(err.message || "캘린더 추가에 실패했습니다", "error");
    } finally {
      setSyncingCaseId(null);
    }
  };

  const handleDeleteCase = async (caseId, caseTitle, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(
      `"${caseTitle}" 사건을 삭제하시겠습니까?\n\n삭제된 사건은 복구할 수 없습니다.`
    )) return;
    setDeletingCaseId(caseId);
    try {
      await portalApi.delete(`/cases/${caseId}`);
      setCases(prev => prev.filter(c => c.id !== caseId));
      showToast(`"${caseTitle}" 사건이 삭제되었습니다`, "success");
    } catch (err) {
      showToast(err.message || "사건 삭제에 실패했습니다", "error");
    } finally {
      setDeletingCaseId(null);
    }
  };

  const handleEditSave = useCallback(() => {
    setEditCaseId(null);
    // 목록 새로고침
    portalApi.get("/cases").then(r => setCases(r.data ?? [])).catch(() => {});
  }, []);

  const uniqueRoutes = [...new Set([...ROUTES, ...cases.map(c => c.visitRoute).filter(Boolean)])];
  // 필터/정렬 변경 시 페이지 초기화 (전체 페이지 + 상태별 페이지 모두)
  useEffect(() => { setPage(1); setStatusPages({}); }, [searchText, filterRoute, filterDateFrom, filterDateTo, sortBy]);
  const filteredCases = cases.filter(c => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (![c.title, c.clientName, c.plaintiff, c.defendant].some(f => f && f.toLowerCase().includes(q))) return false;
    }
    if (filterRoute && c.visitRoute !== filterRoute) return false;
    if (filterDateFrom && ((c.registeredAt || c.createdAt || "") < filterDateFrom)) return false;
    if (filterDateTo && ((c.registeredAt || c.createdAt || "") > filterDateTo + "T23:59:59")) return false;
    return true;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    const da = new Date(a.registeredAt || a.createdAt || 0);
    const db = new Date(b.registeredAt || b.createdAt || 0);
    if (sortBy === "date_desc") return db - da;
    if (sortBy === "date_asc")  return da - db;
    if (sortBy === "name_asc")  return (a.title || "").localeCompare(b.title || "", "ko");
    if (sortBy === "name_desc") return (b.title || "").localeCompare(a.title || "", "ko");
    return db - da;
  });
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / PAGE_SIZE));
  const safePageNum = Math.min(page, totalPages);
  const pagedCases = sortedCases.slice((safePageNum - 1) * PAGE_SIZE, safePageNum * PAGE_SIZE);

  return (
    <div>
      {/* ==================== 페이지 헤더 배너 ==================== */}
      <div style={{ ...pageHeaderStyle, justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={pageHeaderIconStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0", letterSpacing: -0.3 }}>
              {userName ? `${userName}님, 안녕하세요` : "사건 목록"}
            </h1>
            <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>진행 중인 사건과 관련 문서를 확인하실 수 있습니다</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {googleConnected ? (
            <button onClick={handleGoogleDisconnect} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#555", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" }}>
              📅 구글 캘린더 연동 해제
            </button>
          ) : (
            <button onClick={handleGoogleConnect} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#1a73e8", background: "#e8f0fe", border: "1px solid #c5d8f7", borderRadius: 6, cursor: "pointer" }}>
              📅 구글 캘린더 연동
            </button>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/portal/cases/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, cursor: "pointer", textDecoration: "none" }}>
              + 사건 등록
            </Link>
            <Link to="/portal/litigation-agreements" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 10, cursor: "pointer", textDecoration: "none" }}>
              📋 소송위임계약서
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== 메인 컨텐츠 ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: ["대표변호사","대표","관리자"].includes(userRole) ? "1fr 300px" : "1fr", gap: 20, alignItems: "start" }}>
      <div>
      {/* 검색/필터 바 */}
      {!loading && cases.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="사건명, 의뢰인, 원고, 피고 검색..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 160, padding: "6px 12px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, outline: "none" }}
          />
          <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}>
            <option value="">방문루트 전체</option>
            {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            title="수임일 시작" style={{ padding: "6px 8px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>~</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            title="수임일 종료" style={{ padding: "6px 8px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}>
            <option value="date_desc">수임일 최신순</option>
            <option value="date_asc">수임일 오래된순</option>
            <option value="name_asc">사건명 오름차순</option>
            <option value="name_desc">사건명 내림차순</option>
          </select>
          {(searchText || filterRoute || filterDateFrom || filterDateTo) && (
            <button onClick={() => { setSearchText(""); setFilterRoute(""); setFilterDateFrom(""); setFilterDateTo(""); }}
              style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #fca5a5", borderRadius: 6, color: "#ef4444", background: "#fff", cursor: "pointer" }}>
              초기화
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: T.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>로딩 중...</p>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#x1F4C1;</p>
          <p style={{ fontSize: 15, color: T.textSec, marginBottom: 8 }}>등록된 사건이 없습니다</p>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>위의 "사건 등록" 버튼으로 사건을 추가하세요</p>
          <Link to="/portal/cases/register" style={{ display: "inline-block", padding: "10px 24px", fontSize: 13, fontWeight: 600, color: "#fff", background: T.accent, borderRadius: 6, textDecoration: "none" }}>
            사건 등록하기
          </Link>
        </div>
      ) : filteredCases.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 14, color: T.textSec }}>검색 결과가 없습니다</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.textMuted }}>총 {filteredCases.length}건</span>
          </div>
          {["접수/상담", "진행", "완료", "상담종결"].map(status => {
            const allStatusCases = sortedCases.filter(c => {
              if (status === "접수/상담") return ["접수/상담","접수","상담"].includes(c.status);
              return c.status === status;
            });
            if (allStatusCases.length === 0) return null;

            const STATUS_PAGE_SIZE = 5;
            const curPage = statusPages[status] || 1;
            const totalStatusPages = Math.ceil(allStatusCases.length / STATUS_PAGE_SIZE);
            const pagedStatusCases = allStatusCases.slice((curPage - 1) * STATUS_PAGE_SIZE, curPage * STATUS_PAGE_SIZE);

            const setStatusPage = (p) => setStatusPages(prev => ({ ...prev, [status]: p }));
            const st = STATUS_MAP[status] || {};

            return (
              <div key={status} style={{ marginBottom: 28 }}>
                {/* 상태 섹션 헤더 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, padding: "3px 12px", borderRadius: 12, background: st.bg, color: st.color, fontWeight: 700 }}>{status}</span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>{allStatusCases.length}건</span>
                  {totalStatusPages > 1 && (
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>{curPage} / {totalStatusPages} 페이지</span>
                  )}
                </div>

                {/* 사건 테이블 */}
                <CaseTable cases={pagedStatusCases} googleConnected={googleConnected} syncingCaseId={syncingCaseId} deletingCaseId={deletingCaseId} userRole={userRole} handleSyncToCalendar={handleSyncToCalendar} handleDeleteCase={handleDeleteCase} onEdit={setEditCaseId} members={members} />

                {/* 페이지네이션 (5건 초과 시) */}
                {totalStatusPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3, marginTop: 10 }}>
                    <button onClick={() => setStatusPage(1)} disabled={curPage === 1}
                      style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff", color: curPage === 1 ? "#d1d5db" : "#374151", cursor: curPage === 1 ? "default" : "pointer" }}>처음</button>
                    <button onClick={() => setStatusPage(p => Math.max(1, p - 1))} disabled={curPage === 1}
                      style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff", color: curPage === 1 ? "#d1d5db" : "#374151", cursor: curPage === 1 ? "default" : "pointer" }}>‹</button>
                    {Array.from({ length: totalStatusPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalStatusPages || Math.abs(p - curPage) <= 2)
                      .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push("…"); acc.push(p); return acc; }, [])
                      .map((p, i) => p === "…" ? (
                        <span key={"e"+i} style={{ padding: "4px 3px", fontSize: 11, color: "#9ca3af" }}>…</span>
                      ) : (
                        <button key={p} onClick={() => setStatusPage(p)}
                          style={{ padding: "4px 9px", fontSize: 11, border: `1px solid ${p === curPage ? st.color : "#e5e7eb"}`, borderRadius: 4, background: p === curPage ? st.bg : "#fff", color: p === curPage ? st.color : "#374151", cursor: "pointer", fontWeight: p === curPage ? 700 : 400 }}>
                          {p}
                        </button>
                      ))
                    }
                    <button onClick={() => setStatusPage(p => Math.min(totalStatusPages, p + 1))} disabled={curPage === totalStatusPages}
                      style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff", color: curPage === totalStatusPages ? "#d1d5db" : "#374151", cursor: curPage === totalStatusPages ? "default" : "pointer" }}>›</button>
                    <button onClick={() => setStatusPage(totalStatusPages)} disabled={curPage === totalStatusPages}
                      style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff", color: curPage === totalStatusPages ? "#d1d5db" : "#374151", cursor: curPage === totalStatusPages ? "default" : "pointer" }}>마지막</button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
      {/* 할부 납입 예정 */}
      {(["대표변호사","대표","관리자"].includes(userRole) || userDeptId === "1729c68c-b679-4c42-abb6-85bddfaee366") && (
        <div style={{ marginTop: 20 }}>
          <PaymentsPanel userRole={userRole} userEmail={userEmail} userDeptId={userDeptId} sonmuDeptId="1729c68c-b679-4c42-abb6-85bddfaee366" />
        </div>
      )}
      </div> {/* end case list */}

      {/* 통계 사이드바 — 대표변호사만 표시 */}
      {["대표변호사","대표","관리자"].includes(userRole) && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 월 선택기 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 8, padding: "10px 14px" }}>
          <button onClick={() => setStatsMonth(p => {
            const m = p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 };
            return m;
          })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: "0 4px" }}>‹</button>
          <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {statsMonth.year}년 {statsMonth.month}월
          </span>
          <button onClick={() => setStatsMonth(p => {
            const m = p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 };
            return m;
          })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: "0 4px" }}>›</button>
        </div>

        {/* 유입 경로 통계 */}
        <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 18 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 14px", display: "flex", justifyContent: "space-between" }}>
            유입 경로
            {stats && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>총 {stats.totalCases}건</span>}
          </h4>
          {!stats ? (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "12px 0" }}>로딩 중...</p>
          ) : stats.routes.length === 0 ? (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "12px 0" }}>이 달 등록 사건 없음</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "4px 0", color: "#6b7280", fontWeight: 500, fontSize: 11 }}>루트</th>
                  <th style={{ textAlign: "right", padding: "4px 0", color: "#6b7280", fontWeight: 500, fontSize: 11 }}>건수</th>
                  <th style={{ textAlign: "right", padding: "4px 0", color: "#6b7280", fontWeight: 500, fontSize: 11 }}>비율</th>
                </tr>
              </thead>
              <tbody>
                {stats.routes.map(({ route, count }) => (
                  <tr key={route} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "7px 0" }}>
                      {route === "지인" ? "👥 지인" : route === "네이버" ? "🔍 네이버" : route === "인스타" ? "📸 인스타" : route}
                    </td>
                    <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 600, color: "#111827" }}>{count}건</td>
                    <td style={{ padding: "7px 0", textAlign: "right", color: "#6b7280", fontSize: 12 }}>
                      {stats.totalCases ? Math.round(count / stats.totalCases * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 매출 통계 */}
        <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 18 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 14px" }}>
            이달 매출
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>외부 지인 소개 20% 할인 반영</span>
          </h4>
          {!stats ? (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "12px 0" }}>로딩 중...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {[
                  ["착수금", stats.revenue?.retainerTotal],
                  ["성공보수", stats.revenue?.successTotal],
                ].map(([label, amount]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "7px 0", color: "#6b7280" }}>{label}</td>
                    <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 600, color: "#111827" }}>
                      {amount != null ? `${(amount / 10000).toLocaleString("ko-KR")}만원` : "—"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: "10px 0 4px", fontWeight: 700, color: "#111827" }}>합계</td>
                  <td style={{ padding: "10px 0 4px", textAlign: "right", fontWeight: 800, color: "var(--accent-gold, #c9a84c)", fontSize: 15 }}>
                    {stats.revenue?.total != null ? `${(stats.revenue.total / 10000).toLocaleString("ko-KR")}만원` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* 외부 소개인 수수료 */}
        {stats && stats.externalReferrers && stats.externalReferrers.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 18 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>
              외부 소개인 수수료
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>착수금+성공보수 × 20%</span>
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>소개인</th>
                  <th style={{ textAlign: "center", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>건수</th>
                  <th style={{ textAlign: "right", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>착수 수수료</th>
                  <th style={{ textAlign: "right", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>성공 수수료</th>
                  <th style={{ textAlign: "right", padding: "3px 0", color: "#9ca3af", fontWeight: 500 }}>합계</th>
                </tr>
              </thead>
              <tbody>
                {stats.externalReferrers.map(ref => (
                  <tr key={ref.name} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "7px 0", fontWeight: 500 }}>{ref.name}</td>
                    <td style={{ padding: "7px 0", textAlign: "center", color: "#6b7280" }}>{ref.count}건</td>
                    <td style={{ padding: "7px 0", textAlign: "right", color: "#374151" }}>
                      {ref.retainerCommission ? `${(ref.retainerCommission / 10000).toLocaleString("ko-KR")}만원` : "—"}
                    </td>
                    <td style={{ padding: "7px 0", textAlign: "right", color: "#374151" }}>
                      {ref.successCommission ? `${(ref.successCommission / 10000).toLocaleString("ko-KR")}만원` : "—"}
                    </td>
                    <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 700, color: "var(--accent-gold, #c9a84c)" }}>
                      {ref.total ? `${(ref.total / 10000).toLocaleString("ko-KR")}만원` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MemberCaseStats cases={cases} members={members} />
      </div>}
      </div> {/* end main grid */}


      {/* 사건 편집 모달 */}
      {editCaseId && (
        <CaseEditModal
          caseId={editCaseId}
          members={members}
          departments={departments}
          onSave={handleEditSave}
          onClose={() => setEditCaseId(null)}
        />
      )}
    </div>
  );
}
