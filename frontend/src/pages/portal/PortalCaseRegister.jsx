/**
 * 포털 사건 등록 — 사건번호 입력 후 대법원 전자소송 연동 또는 수동 입력
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";

const COURT_TYPES = [
  "민사", "형사", "가사", "행정", "특허", "선거", "헌법", "기타",
];

const INITIAL_FORM = {
  title: "",
  caseNumber: "",
  court: "",
  caseType: "",
  plaintiff: "",
  defendant: "",
  filedAt: "",
  description: "",
};

function parseCaseNumberHint(caseNumber) {
  if (!caseNumber) return {};
  const match = caseNumber.match(/^(\d{4})(가합|가단|나|다|고합|고단|고독|구합|구단|헌가|헌마|행합|행단)(\d+)$/);
  if (!match) return {};

  const [, , code] = match;
  const codeMap = {
    "가합": { caseType: "민사", court: "지방법원" },
    "가단": { caseType: "민사", court: "지방법원" },
    "나": { caseType: "민사", court: "고등법원" },
    "다": { caseType: "민사", court: "대법원" },
    "고합": { caseType: "형사", court: "지방법원" },
    "고단": { caseType: "형사", court: "지방법원" },
    "구합": { caseType: "행정", court: "행정법원" },
    "구단": { caseType: "행정", court: "행정법원" },
  };

  return codeMap[code] || {};
}

export default function PortalCaseRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");

  // 내부 사용자 전용 상태
  const [userRole, setUserRole] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedLawyers, setSelectedLawyers] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  useEffect(() => {
    portalApi.get("/me").then(res => {
      const role = res.data?.user?.role;
      setUserRole(role);
      if (role === "internal") {
        Promise.all([
          portalApi.get("/internal/lawyers"),
          portalApi.get("/internal/departments"),
        ]).then(([lRes, dRes]) => {
          setLawyers(lRes.data?.data || []);
          setDepartments(dRes.data?.data || []);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const toggleLawyer = (lawyer) => {
    setSelectedLawyers(prev =>
      prev.some(l => l.id === lawyer.id)
        ? prev.filter(l => l.id !== lawyer.id)
        : [...prev, lawyer]
    );
  };

  const field = (key) => (e) => {
    const newForm = { ...form, [key]: e.target.value };
    if (key === "caseNumber") {
      const hint = parseCaseNumberHint(e.target.value.trim());
      if (hint.caseType && !form.caseType) newForm.caseType = hint.caseType;
    }
    setForm(newForm);
  };

  const handleLookup = async () => {
    if (!form.caseNumber.trim()) {
      setError("사건번호를 먼저 입력해주세요");
      return;
    }
    setLookupLoading(true);
    setError("");
    try {
      const hint = parseCaseNumberHint(form.caseNumber.trim());
      if (Object.keys(hint).length > 0) {
        setForm((prev) => ({ ...prev, caseType: hint.caseType || prev.caseType }));
        showToast("사건번호 형식에서 정보를 유추했습니다. 상세 정보는 직접 입력해주세요.", "info");
      } else {
        showToast("사건번호 형식을 인식하지 못했습니다. 직접 입력해주세요.", "warning");
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("사건명을 입력해주세요");

    setError("");
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        caseNumber: form.caseNumber.trim() || null,
        court: form.court.trim() || null,
        caseType: form.caseType || null,
        plaintiff: form.plaintiff.trim() || null,
        defendant: form.defendant.trim() || null,
        filedAt: form.filedAt || null,
        description: form.description.trim() || null,
      };
      if (userRole === "internal") {
        payload.members = selectedLawyers.map(l => ({ id: l.id, name: l.name }));
        payload.departmentId = selectedDeptId || null;
      }
      const result = await portalApi.post("/cases", payload);
      showToast("사건이 등록되었습니다", "success");
      navigate(`/portal/cases/${result.data.data?.id || result.data.id}`);
    } catch (err) {
      setError(err.message || "사건 등록에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const sectionTitle = (text) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: 1, marginBottom: 12, marginTop: 20 }}>
      {text}
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", marginBottom: 6 }}>
          사건 등록
        </h1>
        <p style={{ fontSize: 13, color: T.textSec }}>
          사건번호를 입력하면 정보를 자동으로 유추합니다. 상세 정보는 직접 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 28 }}>

        {/* 사건번호 조회 */}
        {sectionTitle("사건번호 (선택)")}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>사건번호</label>
            <input
              style={fieldStyle}
              value={form.caseNumber}
              onChange={field("caseNumber")}
              placeholder="예: 2024가합12345"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookupLoading}
              style={{
                padding: "12px 16px", fontSize: 13, fontWeight: 600,
                color: T.accent, background: "transparent",
                border: `1px solid ${T.accent}`, borderRadius: 6,
                cursor: lookupLoading ? "default" : "pointer",
                opacity: lookupLoading ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {lookupLoading ? "조회 중..." : "정보 가져오기"}
            </button>
          </div>
        </div>

        <div style={{ padding: "10px 14px", background: "#f0f4ff", borderRadius: 6, fontSize: 12, color: "#3a5a9e", marginBottom: 20 }}>
          💡 대법원 전자소송(ecfs.scourt.go.kr)에서 사건번호로 검색한 정보를 직접 입력하시면 정확합니다.
        </div>

        {/* 기본 정보 */}
        {sectionTitle("기본 정보 *")}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>사건명 *</label>
          <input
            style={fieldStyle}
            value={form.title}
            onChange={field("title")}
            placeholder="예: 부당이득금 반환청구"
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>사건 유형</label>
            <select style={{ ...fieldStyle, appearance: "none" }} value={form.caseType} onChange={field("caseType")}>
              <option value="">선택</option>
              {COURT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>제소일</label>
            <input type="date" style={fieldStyle} value={form.filedAt} onChange={field("filedAt")} />
          </div>
        </div>

        {/* 법원 정보 */}
        {sectionTitle("법원 정보")}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>법원명</label>
          <input
            style={fieldStyle}
            value={form.court}
            onChange={field("court")}
            placeholder="예: 서울중앙지방법원 제1민사부"
          />
        </div>

        {/* 당사자 */}
        {sectionTitle("당사자")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>원고</label>
            <input style={fieldStyle} value={form.plaintiff} onChange={field("plaintiff")} placeholder="원고 성명/법인명" />
          </div>
          <div>
            <label style={labelStyle}>피고</label>
            <input style={fieldStyle} value={form.defendant} onChange={field("defendant")} placeholder="피고 성명/법인명" />
          </div>
        </div>

        {/* 담당자/부서 — 내부 사용자 전용 */}
        {userRole === "internal" && (
          <>
            {sectionTitle("담당자 / 공유 부서")}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>담당 변호사</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {lawyers.map(lawyer => {
                  const selected = selectedLawyers.some(l => l.id === lawyer.id);
                  return (
                    <button
                      key={lawyer.id}
                      type="button"
                      onClick={() => toggleLawyer(lawyer)}
                      style={{
                        padding: "6px 12px", fontSize: 13, borderRadius: 20, cursor: "pointer",
                        border: selected ? `2px solid ${T.accent}` : "1px solid #d1d5db",
                        background: selected ? `${T.accent}15` : "#fff",
                        color: selected ? T.accent : "#374151",
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {lawyer.name}
                      {lawyer.position && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>{lawyer.position}</span>}
                    </button>
                  );
                })}
                {lawyers.length === 0 && <span style={{ fontSize: 13, color: "#9ca3af" }}>변호사 정보를 불러오는 중...</span>}
              </div>
              {selectedLawyers.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted }}>
                  선택: {selectedLawyers.map(l => l.name).join(", ")}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>공유 부서</label>
              <select
                style={{ ...fieldStyle, appearance: "none" }}
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* 메모 */}
        {sectionTitle("메모")}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>사건 메모</label>
          <textarea
            style={{ ...fieldStyle, height: 80, resize: "vertical" }}
            value={form.description}
            onChange={field("description")}
            placeholder="사건에 대한 메모나 특이사항을 입력하세요"
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#c62828", marginBottom: 16, textAlign: "center" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/portal/dashboard")}
            style={{
              flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600,
              color: T.textSec, background: "#f5f5f5",
              border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 2, padding: "12px 0", fontSize: 14, fontWeight: 600,
              color: "#fff", background: T.accent, border: "none",
              borderRadius: 6, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "등록 중..." : "사건 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
