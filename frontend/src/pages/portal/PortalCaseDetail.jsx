/**
 * 포털 사건 상세 / 편집 — 방문루트 / 수임조건 포함
 * Left: 항상 편집 가능한 폼 (register와 동일 UI)
 * Right: 서류 / 메시지 탭
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";
import { STATUS_MAP } from "./portalConstants";

const COURT_TYPES = ["민사", "형사", "가사", "행정", "특허", "선거", "헌법", "기타"];
const STATUSES    = ["접수/상담", "진행", "완료", "상담종결"];
const ROUTES      = ["지인", "네이버", "인스타", "유튜브", "군돌이", "기타"];

/* ---------- helpers ---------- */
function splitTitle(title) {
  if (!title) return { client: "", caseName: "" };
  const idx = title.indexOf("_");
  if (idx < 0) return { client: "", caseName: title };
  return { client: title.slice(0, idx), caseName: title.slice(idx + 1) };
}

function formFromCase(c) {
  const { client, caseName } = splitTitle(c.title);
  return {
    client,
    caseName,
    status:               c.status        || "접수/상담",
    consultantId:         c.consultantId   || "",
    consultantName:       c.consultantName || "",
    visitRoute:           c.visitRoute     || "",
    referrerId:           c.referrerId     || "",
    referrerName:         c.referrerName   || "",
    retainerFee:          c.retainerFee    != null ? String(c.retainerFee)    : "",
    retainerInstallments: c.retainerInstallments != null ? String(c.retainerInstallments) : "",
    retainerDay:          c.retainerDay    != null ? String(c.retainerDay)    : "",
    successFee:           c.successFee     != null ? String(c.successFee)     : "",
    successInstallments:  c.successInstallments  != null ? String(c.successInstallments)  : "",
    successDay:           c.successDay     != null ? String(c.successDay)     : "",
    paymentMethod:        c.paymentMethod   || "",
    caseNumber:           c.caseNumber     || "",
    court:                c.court          || "",
    caseType:             c.caseType       || "",
    plaintiff:            c.plaintiff      || "",
    defendant:            c.defendant      || "",
    filedAt:              c.filedAt        || "",
    description:          c.description    || "",
    registeredAt:         c.registeredAt   || "",
  };
}

const fmtKRW = (n) => n ? Math.round(Number(n)).toLocaleString("ko-KR") : "";

/* ---------- MemberPicker ---------- */
function MemberPicker({ members, value, onSelect }) {
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
        <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.10)", maxHeight: 180, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div style={{ padding: 12, fontSize: 13, color: T.textMuted, textAlign: "center" }}>검색 결과 없음</div>
            : filtered.map(m => (
              <div key={m.id} onMouseDown={() => { onSelect(m.id, m.name); setOpen(false); setQ(""); }}
                style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${T.border}`, background: m.id === value ? "rgba(201,168,76,0.08)" : "#fff" }}>
                <span style={{ fontWeight: 500 }}>{m.name}</span>
                {m.position && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6 }}>{m.position}</span>}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ---------- FeeField ---------- */
function FeeField({ label, feeKey, installKey, dayKey, form, onChange, isReferral }) {
  const [showInstall, setShowInstall] = useState(false);
  const rawFee = Number(form[feeKey]) || 0;
  const discounted = isReferral ? Math.round(rawFee * 0.8) : rawFee;

  useEffect(() => {
    if (form[installKey] || form[dayKey]) setShowInstall(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: "#fafafa", border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
      <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="number" min="0" step="10000" style={{ ...fieldStyle, flex: 1, textAlign: "right" }}
          value={form[feeKey]} onChange={e => onChange(feeKey, e.target.value)} placeholder="0" />
        <span style={{ fontSize: 13, color: T.textSec, flexShrink: 0 }}>원</span>
      </div>
      {rawFee > 0 && (
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, textAlign: "right" }}>
          {fmtKRW(rawFee)}원

        </div>
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
                  <input type="radio" name={`pm_${feeKey}`} value={pm}
                    checked={form.paymentMethod === pm}
                    onChange={() => onChange("paymentMethod", pm)} />
                  {pm}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <input type="number" min="1" max="60" style={{ ...fieldStyle, width: 64 }}
              value={form[installKey]} onChange={e => onChange(installKey, e.target.value)} placeholder="3" />
            <span style={{ fontSize: 13, color: T.textSec }}>개월, 매월</span>
            <input type="number" min="1" max="31" style={{ ...fieldStyle, width: 54 }}
              value={form[dayKey]} onChange={e => onChange(dayKey, e.target.value)} placeholder="15" />
            <span style={{ fontSize: 13, color: T.textSec }}>일</span>
          </div>
        </>
      )}
    </div>
  );
}

const SecTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>
    {children}
  </div>
);

/* ---------- DocumentTab ---------- */
function DocumentTab({ caseId }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(() => {
    portalApi.get(`/cases/${caseId}/documents`).then(r => setDocs(r.data?.data || [])).catch(() => {});
  }, [caseId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    try {
      await portalApi.upload(`/cases/${caseId}/documents`, fd);
      showToast("업로드 완료", "success");
      loadDocs();
    } catch (err) {
      showToast("업로드 실패: " + err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/cases/${caseId}/documents/${docId}`);
      loadDocs();
    } catch (err) {
      showToast("삭제 실패: " + err.message, "error");
    }
  };

  return (
    <div>
      <label htmlFor={`upload-${caseId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer", background: "#fafafa", fontSize: 13, color: T.textSec, marginBottom: 12 }}>
        📎 {uploading ? "업로드 중..." : "파일 첨부"}
      </label>
      <input id={`upload-${caseId}`} type="file" multiple style={{ display: "none" }} onChange={handleUpload} />
      {docs.length === 0
        ? <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "24px 0" }}>첨부된 서류가 없습니다</p>
        : docs.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, background: "#f8fafc", marginBottom: 6, border: `1px solid ${T.border}` }}>
            <a href={d.url || d.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: T.accent, textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📄 {d.fileName || d.name || "파일"}
            </a>
            <button onClick={() => handleDelete(d.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, padding: "0 4px", flexShrink: 0 }}>✕</button>
          </div>
        ))
      }
    </div>
  );
}

/* ---------- MessageTab ---------- */
function LitAgreementTab({ caseId }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(() => {
    portalApi.get(`/cases/litigation-agreements?caseId=${caseId}`)
      .then(r => setDocs(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, [caseId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    fd.append("documentType", "litigation_agreement");
    try {
      await portalApi.upload(`/cases/${caseId}/documents`, fd);
      showToast("소송위임계약서 업로드 완료", "success");
      loadDocs();
    } catch (err) {
      showToast("업로드 실패: " + err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("소송위임계약서를 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/cases/documents/${docId}`);
      loadDocs();
    } catch (err) {
      showToast("삭제 실패: " + err.message, "error");
    }
  };

  const download = async (item) => {
    try {
      const res = await portalApi.get(`/cases/documents/${item.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = item.originalName || item.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast("다운로드 실패", "error"); }
  };

  return (
    <div>
      <label htmlFor={`lit-upload-${caseId}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer", background: "#f0f9ff", fontSize: 13, color: T.accent, marginBottom: 12 }}>
        📋 {uploading ? "업로드 중..." : "소송위임계약서 첨부"}
      </label>
      <input id={`lit-upload-${caseId}`} type="file" accept=".pdf,.hwp,.hwpx,.doc,.docx" style={{ display: "none" }} onChange={handleUpload} />
      {docs.length === 0
        ? <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", margin: "24px 0" }}>첨부된 소송위임계약서가 없습니다</p>
        : docs.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ flex: 1, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.originalName || d.filename}</span>
            <span style={{ fontSize: 11, color: T.textMuted, whiteSpace: "nowrap" }}>{d.createdAt?.slice(0, 10) || ""}</span>
            <button onClick={() => download(d)} style={{ background: "#f0f9ff", border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>다운</button>
            <button onClick={() => handleDelete(d.id)} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>삭제</button>
          </div>
        ))
      }
    </div>
  );
}


function MessageTab({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(() => {
    portalApi.get(`/cases/${caseId}/messages`).then(r => setMessages(r.data?.data || [])).catch(() => {});
  }, [caseId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await portalApi.post(`/cases/${caseId}/messages`, { content: text.trim() });
      setText("");
      loadMessages();
    } catch (err) {
      showToast("전송 실패: " + err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 10, minHeight: 80, maxHeight: 320 }}>
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

/* ========== Main Component ========== */
export default function PortalCaseDetail() {
  const { id: caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(null);
  const [rightTab, setRightTab] = useState("docs");
  const [showBlogPrompt, setShowBlogPrompt] = useState(false);

  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [referrerType, setReferrerType] = useState("member");

  useEffect(() => {
    portalApi.get("/me").then(res => {
      const u = res.data?.user;
      setUserRole(u?.role);
      // 내부 사용자: clientId 없음(내부 구성원)
      if (u?.role) {  // 내부 구성원 = role이 있는 사용자
        portalApi.get("/internal/lawyers").then(r => setMembers(r.data || [])).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    portalApi.get(`/cases/${caseId}`)
      .then(res => {
        const c = res.data?.data || res.data;
        setCaseData(c);
        setFormData(formFromCase(c));
        setReferrerType(!c.referrerId && c.referrerName ? "external" : "member");
      })
      .catch(err => setError(err.message || "사건 정보를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [caseId]);

  const setField = useCallback((key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  }, []);

  const isReferral = formData?.visitRoute === "지인";

  const handleSave = async () => {
    if (!formData) return;
    if (!formData.caseName.trim()) { showToast("사건명을 입력해주세요", "error"); return; }
    setSaving(true);
    const prevStatus = caseData?.status;
    try {
      const composedTitle = formData.client.trim()
        ? `${formData.client.trim()}_${formData.caseName.trim()}`
        : formData.caseName.trim();
      const payload = {
        title: composedTitle,
        status: formData.status,
        consultantId: formData.consultantId || null,
        consultantName: formData.consultantName || null,
        visitRoute: formData.visitRoute || null,
        referrerId: formData.visitRoute === "지인" ? (formData.referrerId || null) : null,
        referrerName: (formData.visitRoute === "지인" || formData.visitRoute === "기타") ? (formData.referrerName || null) : null,
        retainerFee: formData.retainerFee ? parseInt(formData.retainerFee) : null,
        retainerInstallments: formData.retainerInstallments ? parseInt(formData.retainerInstallments) : null,
        retainerDay: formData.retainerDay ? parseInt(formData.retainerDay) : null,
        successFee: formData.successFee ? parseInt(formData.successFee) : null,
        successInstallments: formData.successInstallments ? parseInt(formData.successInstallments) : null,
        successDay: formData.successDay ? parseInt(formData.successDay) : null,
        paymentMethod: formData.paymentMethod || null,
        caseNumber: formData.caseNumber.trim() || null,
        court: formData.court.trim() || null,
        caseType: formData.caseType || null,
        plaintiff: formData.plaintiff.trim() || null,
        defendant: formData.defendant.trim() || null,
        filedAt: formData.filedAt || null,
        description: formData.description.trim() || null,
        registeredAt: formData.registeredAt || null,
      };
      await portalApi.patch(`/cases/${caseId}`, payload);
      setCaseData(prev => ({ ...prev, ...payload, title: composedTitle, registeredAt: formData.registeredAt || prev.registeredAt }));
      showToast("저장되었습니다", "success");
      if (formData.status === "완료" && prevStatus !== "완료") {
        setShowBlogPrompt(true);
      }
    } catch (err) {
      showToast("저장 실패: " + (err.message || "알 수 없는 오류"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (caseData) setFormData(formFromCase(caseData));
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14 }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "#c62828", fontSize: 14 }}>{error}</div>;
  if (!caseData || !formData) return null;

  const statusInfo = STATUS_MAP[caseData.status] || {};

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", margin: 0 }}>
              {caseData.title || "사건 상세"}
            </h1>
            {statusInfo.color && (
              <span style={{ fontSize: 12, fontWeight: 600, color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.color}33`, borderRadius: 20, padding: "3px 10px" }}>
                {caseData.status}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
            등록일: {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString("ko-KR") : ""}
          </p>
        </div>
        <button onClick={() => navigate("/portal/dashboard")} style={{ padding: "8px 16px", fontSize: 13, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}>
          목록
        </button>
      </div>

      {/* 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, alignItems: "start" }}>

        {/* LEFT — 편집 폼 */}
        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>사건 정보 편집</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleReset} style={{ padding: "6px 14px", fontSize: 12, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer" }}>
                초기화
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "6px 18px", fontSize: 12, fontWeight: 700, color: "#fff", background: T.accent, border: "none", borderRadius: 5, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />

          {/* 기본 정보 */}
          <SecTitle>기본 정보</SecTitle>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>의뢰인</label>
            <input style={fieldStyle} value={formData.client} onChange={e => setField("client", e.target.value)} placeholder="예: 홍길동, (주)대한건설" />
          </div>
          {members.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>상담자</label>
              <MemberPicker
                members={members}
                value={formData.consultantId}
                onSelect={(id, name) => { setField("consultantId", id); setField("consultantName", name); }}
              />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>사건명 *</label>
            <input style={fieldStyle} value={formData.caseName} onChange={e => setField("caseName", e.target.value)} placeholder="예: 부당이득금 반환청구" />
            {formData.client.trim() && formData.caseName.trim() && (
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                저장될 사건명: <strong style={{ color: T.text }}>{formData.client.trim()}_{formData.caseName.trim()}</strong>
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>진행 상태</label>
              <select style={{ ...fieldStyle, appearance: "none" }} value={formData.status} onChange={e => setField("status", e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>방문 루트</label>
              <select style={{ ...fieldStyle, appearance: "none" }} value={formData.visitRoute} onChange={e => setField("visitRoute", e.target.value)}>
                <option value="">선택 안 함</option>
                {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>등록일</label>
              <input type="date" style={fieldStyle} value={formData.registeredAt || ""} onChange={e => setField("registeredAt", e.target.value)} />
            </div>
          </div>

          {/* 지인 선택 */}
          {formData.visitRoute === "지인" && (
            <div style={{ marginBottom: 12, padding: 12, background: "#f5f3ff", border: "1px solid #e9d5ff", borderRadius: 8 }}>
              <label style={{ ...labelStyle, color: "#7c3aed", marginBottom: 6 }}>소개자</label>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                {[["member", "구성원 중 선택"], ["external", "외부인 직접 입력"]].map(([v, label]) => (
                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#7c3aed", cursor: "pointer" }}>
                    <input type="radio" name="referrerType" value={v} checked={referrerType === v}
                      onChange={() => { setReferrerType(v); setField("referrerId", null); setField("referrerName", ""); }} />
                    {label}
                  </label>
                ))}
              </div>
              {referrerType === "member" ? (
                <MemberPicker
                  members={members}
                  value={formData.referrerId}
                  onSelect={(id, name) => { setField("referrerId", id); setField("referrerName", name); }}
                />
              ) : (
                <input
                  style={{ ...fieldStyle, borderColor: "#c4b5fd" }}
                  placeholder="소개자 성명 (외부인)"
                  value={formData.referrerName || ""}
                  onChange={e => { setField("referrerName", e.target.value); setField("referrerId", null); }}
                />
              )}
            </div>
          )}

          {/* 기타 루트 상세 */}
          {formData.visitRoute === "기타" && (
            <div style={{ marginBottom: 12, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <label style={{ ...labelStyle, color: "#475569", marginBottom: 6, display: "block" }}>루트 상세 (선택)</label>
              <input
                style={fieldStyle}
                value={formData.referrerName || ""}
                onChange={e => setField("referrerName", e.target.value)}
                placeholder="예: 네이버 블로그, 지인 소개, 현수막 등"
              />
            </div>
          )}

          {/* 사건번호 */}
          <SecTitle>사건번호 (선택)</SecTitle>
          <div style={{ marginBottom: 12 }}>
            <input style={fieldStyle} value={formData.caseNumber} onChange={e => setField("caseNumber", e.target.value)} placeholder="예: 2024가합12345" />
          </div>

          {/* 수임 조건 */}
          <SecTitle>수임 조건</SecTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <FeeField label="착수금" feeKey="retainerFee" installKey="retainerInstallments" dayKey="retainerDay"
              form={formData} onChange={setField} isReferral={isReferral} />
            <FeeField label="성공보수" feeKey="successFee" installKey="successInstallments" dayKey="successDay"
              form={formData} onChange={setField} isReferral={isReferral} />
          </div>

          {/* 법원 정보 */}
          <SecTitle>법원 정보</SecTitle>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>법원명</label>
            <input style={fieldStyle} value={formData.court} onChange={e => setField("court", e.target.value)} placeholder="예: 서울중앙지방법원 제1민사부" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>사건 유형</label>
              <select style={{ ...fieldStyle, appearance: "none" }} value={formData.caseType} onChange={e => setField("caseType", e.target.value)}>
                <option value="">선택</option>
                {COURT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>제소일</label>
              <input type="date" style={fieldStyle} value={formData.filedAt} onChange={e => setField("filedAt", e.target.value)} />
            </div>
          </div>

          {/* 당사자 */}
          <SecTitle>당사자</SecTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>원고</label>
              <input style={fieldStyle} value={formData.plaintiff} onChange={e => setField("plaintiff", e.target.value)} placeholder="원고 성명/법인명" />
            </div>
            <div>
              <label style={labelStyle}>피고</label>
              <input style={fieldStyle} value={formData.defendant} onChange={e => setField("defendant", e.target.value)} placeholder="피고 성명/법인명" />
            </div>
          </div>

          {/* 메모 */}
          <SecTitle>메모</SecTitle>
          <div style={{ marginBottom: 8 }}>
            <textarea style={{ ...fieldStyle, height: 80, resize: "vertical" }}
              value={formData.description} onChange={e => setField("description", e.target.value)}
              placeholder="사건에 대한 메모나 특이사항을 입력하세요" />
          </div>
        </div>

        {/* RIGHT — 서류 / 메시지 탭 */}
        <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          {/* 탭 헤더 */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
            {[["docs", "📁 서류"], ["lit", "📋 위임계약서"], ["messages", "💬 메시지"]].map(([key, label]) => (
              <button key={key} onClick={() => setRightTab(key)} style={{
                flex: 1, padding: "14px 0", fontSize: 13, fontWeight: 600,
                color: rightTab === key ? T.accent : T.textSec,
                background: rightTab === key ? "#fff" : "#f9fafb",
                border: "none", borderBottom: rightTab === key ? `2px solid ${T.accent}` : "2px solid transparent",
                cursor: "pointer",
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ padding: 20 }}>
            {rightTab === "docs"     && <DocumentTab caseId={caseId} />}
            {rightTab === "lit"      && <LitAgreementTab caseId={caseId} />}
            {rightTab === "messages" && <MessageTab  caseId={caseId} />}
          </div>
        </div>
      </div>

      {/* 블로그 프롬프트 모달 */}
      {showBlogPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 32, maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🎉</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 10px", fontFamily: "'Noto Serif KR', serif" }}>사건이 완료되었습니다</h3>
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, margin: "0 0 24px" }}>
              블로그 &gt; 하이로 뉴스에<br />성공사례 글을 작성하시겠습니까?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowBlogPrompt(false)} style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 600, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer" }}>
                다음에 작성하기
              </button>
              <button onClick={() => { setShowBlogPrompt(false); navigate("/portal/editor?mode=blog"); }} style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 700, color: "#fff", background: T.accent, border: "none", borderRadius: 8, cursor: "pointer" }}>
                예, 작성하기
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .case-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
