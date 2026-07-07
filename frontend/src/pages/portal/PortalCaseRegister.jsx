/**
 * 포털 사건 등록 — 방문루트 / 수임조건(착수금·성공보수) / 파일첨부 포함
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";

const COURT_TYPES = ["민사", "형사", "가사", "행정", "특허", "선거", "헌법", "기타"];
const POSITION_ORDER = ["대표변호사","전문위원","부장","차장","과장","대리","주임","사원"];
const DEPT_ORDER = ["법무법인 하이로","전문위원","송무팀","기획팀","관리부"];
const sortMembers = (arr) => [...arr].sort((a, b) => {
  const ai = POSITION_ORDER.indexOf(a.position ?? ""), bi = POSITION_ORDER.indexOf(b.position ?? "");
  const po = (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  return po !== 0 ? po : (a.name || "").localeCompare(b.name || "", "ko");
});
const sortDepts = (arr) => [...arr].sort((a, b) => {
  const ai = DEPT_ORDER.indexOf(a.name ?? ""), bi = DEPT_ORDER.indexOf(b.name ?? "");
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
});
const STATUSES    = ["접수/상담", "진행", "완료", "상담종결"];
const ROUTES      = ["지인", "네이버", "인스타", "유튜브", "군돌이", "기타"];

const INITIAL_FORM = {
  client: "", caseName: "", status: "접수/상담",
  consultantId: "", consultantName: "",
  visitRoute: "", referrerId: "", referrerName: "",
  retainerFee: "", retainerInstallments: "", retainerDay: "",
  paymentMethod: "",
  successFee: "",  successInstallments: "",  successDay: "",
  caseNumber: "", court: "", caseType: "",
  plaintiff: "", defendant: "", filedAt: "", description: "",
  registeredAt: new Date().toISOString().slice(0, 10),
};

const fmtKRW = (n) => n ? Math.round(Number(n)).toLocaleString("ko-KR") : "";

/** 구성원 검색 선택기 */
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
          x
        </button>
      )}
      {open && (
        <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.10)", maxHeight: 180, overflowY: "auto" }}>
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

/** 수임료 필드 (착수금 or 성공보수) */
function FeeField({ label, feeKey, installKey, dayKey, form, onChange, isReferral }) {
  const [showInstall, setShowInstall] = useState(false);
  const rawFee = Number(form[feeKey]) || 0;
  const discounted = isReferral ? Math.round(rawFee * 0.8) : rawFee;

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

/** 섹션 제목 */
const SecTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, marginBottom: 10, marginTop: 20 }}>
    {children}
  </div>
);

export default function PortalCaseRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedLitFiles, setSelectedLitFiles] = useState([]);

  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedLawyers, setSelectedLawyers] = useState([]);
  const [selectedConsultants, setSelectedConsultants] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [referrerType, setReferrerType] = useState("member"); // "member" | "external"

  useEffect(() => {
    portalApi.get("/me").then(res => {
      const u = res.data?.user;
      setUserRole(u?.role);
      if (u?.role) {  // 내부 구성원 = role이 있는 사용자
        Promise.all([
          portalApi.get("/internal/lawyers"),
          portalApi.get("/internal/departments"),
        ]).then(([lRes, dRes]) => {
          setMembers(lRes.data || []);
          setDepartments(dRes.data || []);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const fld = (key) => (e) => setField(key, e.target.value);

  const toggleLawyer = (lawyer) => {
    setSelectedLawyers(prev =>
      prev.some(l => l.id === lawyer.id)
        ? prev.filter(l => l.id !== lawyer.id)
        : [...prev, lawyer]
    );
  };

  const toggleConsultant = (member) => {
    setSelectedConsultants(prev =>
      prev.some(c => c.id === member.id)
        ? prev.filter(c => c.id !== member.id)
        : [...prev, { id: member.id, name: member.name }]
    );
  };

  const toggleDept = (id) => {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
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
      };
      if (userRole === "internal") {
        payload.members = selectedLawyers.map(l => ({ id: l.id, name: l.name }));
        payload.departmentIds = selectedDeptIds;
      }
      const result = await portalApi.post("/cases", payload);
      const caseId = result.data?.data?.id || result.data?.id;
      if (selectedFiles.length > 0 && caseId) {
        const fd = new FormData();
        selectedFiles.forEach(f => fd.append("files", f));
        try { await portalApi.upload(`/cases/${caseId}/documents`, fd); } catch (uploadErr) {
          showToast("파일 업로드 중 일부 오류: " + uploadErr.message, "warning");
        }
      }
      if (selectedLitFiles.length > 0 && caseId) {
        const fd2 = new FormData();
        selectedLitFiles.forEach(f => fd2.append("files", f));
        fd2.append("documentType", "litigation_agreement");
        try { await portalApi.upload(`/cases/${caseId}/documents`, fd2); } catch (uploadErr) {
          showToast("소송위임계약서 업로드 중 일부 오류: " + uploadErr.message, "warning");
        }
      }
      showToast("사건이 등록되었습니다", "success");
      navigate(`/portal/cases/${caseId}`);
    } catch (err) {
      setError(err.message || "사건 등록에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", margin: "0 0 6px" }}>사건 등록</h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>사건 정보를 입력하고 관련 파일을 첨부해 주세요.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 28 }}>

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
                    border: sel ? "2px solid #6366f1" : "1px solid #d1d5db",
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
              {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>수임일</label>
            <input type="date" style={fieldStyle} value={form.registeredAt} onChange={fld("registeredAt")} />
          </div>
        </div>

        {/* 지인 선택 */}
        {form.visitRoute === "지인" && (
          <div style={{ marginBottom: 12, padding: 12, background: "#f5f3ff", border: "1px solid #e9d5ff", borderRadius: 8 }}>
            <label style={{ ...labelStyle, color: "#7c3aed", marginBottom: 8 }}>소개자</label>
            <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
              {["member", "external"].map((type) => (
                <label key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer", color: "#7c3aed" }}>
                  <input
                    type="radio"
                    name="referrerType"
                    value={type}
                    checked={referrerType === type}
                    onChange={() => {
                      setReferrerType(type);
                      setField("referrerId", "");
                      setField("referrerName", "");
                    }}
                  />
                  {type === "member" ? "구성원 중 선택" : "외부인 직접 입력"}
                </label>
              ))}
            </div>
            {referrerType === "member" ? (
              <MemberPicker
                members={members}
                value={form.referrerId}
                onSelect={(id, name) => { setField("referrerId", id); setField("referrerName", name); }}
              />
            ) : (
              <input
                style={fieldStyle}
                value={form.referrerName}
                onChange={e => { setField("referrerName", e.target.value); setField("referrerId", ""); }}
                placeholder="소개자 이름 입력 (예: 홍길동)"
              />
            )}
            {isReferral && userRole === "대표변호사" && (
              <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 6 }}>
                지인 소개 건: 착수금·성공보수 20% 할인이 통계에 반영됩니다
              </div>
            )}
          </div>
        )}

        {/* 기타 루트 상세 */}
        {form.visitRoute === "기타" && (
          <div style={{ marginBottom: 12, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <label style={{ ...labelStyle, color: "#475569", marginBottom: 6, display: "block" }}>루트 상세 (선택)</label>
            <input
              style={fieldStyle}
              value={form.referrerName}
              onChange={e => setField("referrerName", e.target.value)}
              placeholder="예: 네이버 블로그, 지인 소개, 현수막 등"
            />
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
          <FeeField label="착수금" feeKey="retainerFee" installKey="retainerInstallments" dayKey="retainerDay"
            form={form} onChange={setField} isReferral={isReferral} />
          <FeeField label="성공보수" feeKey="successFee" installKey="successInstallments" dayKey="successDay"
            form={form} onChange={setField} isReferral={isReferral} />
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

        {/* 담당자 — 내부 사용자 전용 */}
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

        {/* 일반 파일 첨부 */}
        <SecTitle>관련 파일 첨부 (선택)</SecTitle>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="caseFiles" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", border: `2px dashed ${T.border}`, borderRadius: 8, cursor: "pointer", background: "#fafafa", fontSize: 13, color: T.textSec }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 20 }}>📎</span>
            <span>클릭하여 파일 선택 (PDF, HWP, HWPX 등 최대 20개, 각 50MB)</span>
          </label>
          <input id="caseFiles" type="file" multiple accept=".pdf,.hwp,.hwpx,.docx,.xlsx,.jpg,.jpeg,.png,.txt,.zip" style={{ display: "none" }} onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
          {selectedFiles.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: 5, marginTop: 4, fontSize: 12 }}>
              <span>📄 {f.name}</span>
              <button type="button" onClick={() => setSelectedFiles(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>

        {/* 소송위임계약서 첨부 */}
        <SecTitle>소송위임계약서 첨부 (선택)</SecTitle>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="litFiles" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", border: `2px dashed #bae6fd`, borderRadius: 8, cursor: "pointer", background: "#f0f9ff", fontSize: 13, color: "#0369a1" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#38bdf8"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#bae6fd"}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span>소송위임계약서 선택 (PDF, HWP, HWPX, DOC, DOCX)</span>
          </label>
          <input id="litFiles" type="file" multiple accept=".pdf,.hwp,.hwpx,.doc,.docx" style={{ display: "none" }} onChange={e => setSelectedLitFiles(Array.from(e.target.files || []))} />
          {selectedLitFiles.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#e0f2fe", borderRadius: 5, marginTop: 4, fontSize: 12, border: "1px solid #bae6fd" }}>
              <span style={{ color: "#0369a1" }}>📋 {f.name}</span>
              <button type="button" onClick={() => setSelectedLitFiles(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: 13, color: "#c62828", marginBottom: 14, textAlign: "center" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => navigate("/portal/dashboard")} style={{ flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, color: T.textSec, background: "#f5f5f5", border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}>
            취소
          </button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#fff", background: T.accent, border: "none", borderRadius: 6, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "등록 중..." : "사건 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
