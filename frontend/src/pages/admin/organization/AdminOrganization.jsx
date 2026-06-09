import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";

/* ── 브랜드 색상 ── */
const GOLD = "#b08d57";
const GOLD_LIGHT = "#f5eedf";
const GOLD_DARK = "#8a6c3e";
const GRAY = "#4b5563";
const BORDER = "#e5e7eb";
const BG = "#fcfaf7";

export default function AdminOrganization() {
  const [activeTab, setActiveTab] = useState("organization"); // "organization" | "approvals" | "chart"
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [lawyersLink, setLawyersLink] = useState([]);
  const [loading, setLoading] = useState(true);

  // 결재 설정 상태
  const [approvalSettings, setApprovalSettings] = useState({
    approvalLineType: "dept",
    fixedLine: [],
    leaveEnabled: true,
    leaveMinUnit: "hourly",
    expenseEnabled: true,
    expenseLimit: 5000000,
    reimbursementEnabled: true,
  });
  const [selectedApproverId, setSelectedApproverId] = useState("");

  // 부서 폼 상태
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    parentId: "",
    managerUserId: "",
  });

  // 사원 폼 상태
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empForm, setEmpForm] = useState({
    departmentId: "",
    position: "",
    hireDate: "",
    role: "employee",
  });

  const [processing, setProcessing] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes, settingsRes, lawyersRes] = await Promise.all([
        api.get("/admin/organization/departments"),
        api.get("/admin/organization/users"),
        api.get("/admin/organization/approval-settings"),
        api.get("/admin/organization/lawyers-link"),
      ]);

      setDepartments(deptRes.data || []);
      setEmployees(empRes.data || []);
      if (settingsRes.data) {
        setApprovalSettings(settingsRes.data);
      }
      setLawyersLink(lawyersRes.data || []);
    } catch (err) {
      showToast(err.message || "데이터를 가져오는데 실패했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addApprover = () => {
    if (!selectedApproverId) return;
    if (approvalSettings.fixedLine.includes(selectedApproverId)) {
      showToast("이미 결재선에 등록된 사원입니다", "error");
      return;
    }
    setApprovalSettings({
      ...approvalSettings,
      fixedLine: [...approvalSettings.fixedLine, selectedApproverId],
    });
    setSelectedApproverId("");
  };

  const removeApprover = (id) => {
    setApprovalSettings({
      ...approvalSettings,
      fixedLine: approvalSettings.fixedLine.filter((fid) => fid !== id),
    });
  };

  const moveApprover = (index, direction) => {
    const list = [...approvalSettings.fixedLine];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setApprovalSettings({
      ...approvalSettings,
      fixedLine: list,
    });
  };

  const handleSaveApprovalSettings = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.post("/admin/organization/approval-settings", approvalSettings);
      showToast("결재 설정이 저장되었습니다", "success");
      loadData();
    } catch (err) {
      showToast(err.message || "설정 저장에 실패했습니다", "error");
    } finally {
      setProcessing(false);
    }
  };

  // 부서 등록/수정 모달 열기
  const openDeptModal = (dept = null) => {
    if (dept) {
      setSelectedDept(dept);
      setDeptForm({
        name: dept.name,
        parentId: dept.parentId || "",
        managerUserId: dept.managerUserId || "",
      });
    } else {
      setSelectedDept(null);
      setDeptForm({
        name: "",
        parentId: "",
        managerUserId: "",
      });
    }
    setIsDeptModalOpen(true);
  };

  // 부서 저장 (등록/수정)
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      showToast("부서명을 입력해주세요", "error");
      return;
    }

    setProcessing(true);
    try {
      if (selectedDept) {
        await api.put(`/admin/organization/departments/${selectedDept.id}`, deptForm);
        showToast("부서 정보가 수정되었습니다", "success");
      } else {
        await api.post("/admin/organization/departments", deptForm);
        showToast("새 부서가 등록되었습니다", "success");
      }
      setIsDeptModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || "부서 저장에 실패했습니다", "error");
    } finally {
      setProcessing(false);
    }
  };

  // 부서 삭제
  const handleDeptDelete = async (id, name) => {
    if (!window.confirm(`"${name}" 부서를 삭제하시겠습니까?\n하위 부서는 상위 부서로 자동 재조정됩니다.`)) return;

    try {
      await api.delete(`/admin/organization/departments/${id}`);
      showToast("부서가 삭제되었습니다", "success");
      loadData();
    } catch (err) {
      showToast(err.message || "부서 삭제에 실패했습니다", "error");
    }
  };

  // 사원 수정 모달 열기
  const openEmpModal = (emp) => {
    setSelectedEmp(emp);
    setEmpForm({
      departmentId: emp.departmentId || "",
      position: emp.position || "",
      hireDate: emp.hireDate || "",
      role: emp.role || "employee",
    });
    setIsEmpModalOpen(true);
  };

  // 사원 정보 저장
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.put(`/admin/organization/users/${selectedEmp.id}`, empForm);
      showToast("사원 정보가 업데이트되었습니다", "success");
      setIsEmpModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || "사원 정보 저장에 실패했습니다", "error");
    } finally {
      setProcessing(false);
    }
  };

  // 트리형식의 부서 경로 계산용 헬퍼
  const getDeptPath = (deptId) => {
    const path = [];
    let current = departments.find(d => d.id === deptId);
    while (current) {
      path.unshift(current.name);
      current = departments.find(d => d.id === current.parentId);
    }
    return path.join(" > ");
  };

  const TABS = [
    { key: "organization", label: "조직도 & 인사 관리" },
    { key: "approvals", label: "결재선 및 결재 기능 설정" },
    { key: "chart", label: "📊 조직도 시각화" },
    { key: "lawyers", label: "🔗 구성원 포털 연동" },
  ];

  return (
    <div style={{ padding: 24, background: BG, minHeight: "100vh" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1f2937", margin: "0 0 6px 0", fontFamily: "'Noto Serif KR', serif" }}>
            조직도 & 결재선 관리
          </h1>
          <p style={{ fontSize: 14, color: GRAY, margin: 0 }}>
            부서 구조를 세팅하고, 각 사원의 입사일 및 부서를 설정하여 결재선을 자동화합니다.
          </p>
        </div>
        {activeTab === "organization" && (
          <button
            onClick={() => openDeptModal()}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              color: "#fff", backgroundColor: GOLD, border: "none",
              borderRadius: 6, cursor: "pointer", boxShadow: `0 2px 8px rgba(176,141,87,0.3)`
            }}
          >
            + 부서 추가
          </button>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "10px 18px", fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
              color: activeTab === t.key ? GOLD : GRAY, background: "none", border: "none",
              borderBottom: activeTab === t.key ? `2px solid ${GOLD}` : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== 탭 1: 조직도 & 인사 관리 ==================== */}
      {activeTab === "organization" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24, alignItems: "start" }}>
          {/* 1. 부서 트리 / 목록 관리 카드 */}
          <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: `1px solid #f3f4f6`, paddingBottom: 10 }}>
              부서 목록 ({departments.length})
            </h3>
            {loading ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>로딩 중...</p>
            ) : departments.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>등록된 부서가 없습니다.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      padding: 12, border: `1px solid ${BORDER}`, borderRadius: 8,
                      backgroundColor: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{dept.name}</div>
                        {dept.parentId && (
                          <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>
                            상위: {departments.find(d => d.id === dept.parentId)?.name}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>
                          부서장: <span style={{ fontWeight: 600 }}>{dept.managerName ? `${dept.managerName} (${dept.managerPosition || "직급없음"})` : "미지정"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => openDeptModal(dept)}
                          style={{ padding: "4px 8px", fontSize: 11, background: "#fff", border: `1px solid #d1d5db`, borderRadius: 4, cursor: "pointer" }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeptDelete(dept.id, dept.name)}
                          style={{ padding: "4px 8px", fontSize: 11, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 4, cursor: "pointer" }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 사원 정보 관리 테이블 */}
          <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
              임직원 인사 설정 ({employees.length}명)
            </h3>
            {loading ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>로딩 중...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ padding: "12px 16px" }}>이름</th>
                      <th style={{ padding: "12px 16px" }}>이메일 / 연락처</th>
                      <th style={{ padding: "12px 16px" }}>부서 경로</th>
                      <th style={{ padding: "12px 16px" }}>직급</th>
                      <th style={{ padding: "12px 16px" }}>입사일</th>
                      <th style={{ padding: "12px 16px" }}>권한</th>
                      <th style={{ padding: "12px 16px" }}>인사 관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827" }}>{emp.name || "미입력"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div>{emp.email}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{emp.phone || "연락처 없음"}</div>
                        </td>
                        <td style={{ padding: "14px 16px", color: GOLD, fontWeight: 500 }}>
                          {emp.departmentId ? getDeptPath(emp.departmentId) : <span style={{ color: "#9ca3af" }}>부서 없음</span>}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{emp.position || "사원"}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{emp.hireDate || <span style={{ color: "#9ca3af" }}>미설정</span>}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                            backgroundColor: emp.role === "admin" ? "#fee2e2" : emp.role === "employee" ? "#e0f2fe" : "#f3f4f6",
                            color: emp.role === "admin" ? "#991b1b" : emp.role === "employee" ? "#0369a1" : "#374151"
                          }}>
                            {emp.role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            onClick={() => openEmpModal(emp)}
                            style={{
                              padding: "6px 12px", fontSize: 12, fontWeight: 600,
                              color: "#fff", backgroundColor: GOLD, border: "none",
                              borderRadius: 4, cursor: "pointer"
                            }}
                          >
                            인사 설정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 탭 2: 결재선 및 결재 기능 설정 ==================== */}
      {activeTab === "approvals" && (
        <form onSubmit={handleSaveApprovalSettings} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          {/* 결재선 설정 카드 */}
          <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10, color: "#111827" }}>
              결재선 설정
            </h3>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>결재선 생성 방식</label>
              <div style={{ display: "flex", gap: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "#374151" }}>
                  <input
                    type="radio" name="approvalLineType" value="dept"
                    checked={approvalSettings.approvalLineType === "dept"}
                    onChange={() => setApprovalSettings({ ...approvalSettings, approvalLineType: "dept" })}
                  />
                  조직도 트리 기반 자동 결재선
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "#374151" }}>
                  <input
                    type="radio" name="approvalLineType" value="fixed"
                    checked={approvalSettings.approvalLineType === "fixed"}
                    onChange={() => setApprovalSettings({ ...approvalSettings, approvalLineType: "fixed" })}
                  />
                  고정 결재선 지정
                </label>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8, margin: 0, lineHeight: 1.4 }}>
                {approvalSettings.approvalLineType === "dept"
                  ? "기안자의 소속 부서 부서장부터 상위 부서 부서장들로 순서대로 결재선이 구성됩니다."
                  : "지정된 사원들이 모든 기안(휴가, 지출, 경비 등)의 1차, 2차... 순서대로 결재선이 고정 구성됩니다."}
              </p>
            </div>

            {approvalSettings.approvalLineType === "fixed" && (
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>고정 결재자 목록</label>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {approvalSettings.fixedLine.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, textAlign: "center", padding: 16, border: "1px dashed #d1d5db", borderRadius: 6 }}>
                      결재선을 구성할 사원을 아래에서 추가해주세요.
                    </p>
                  ) : (
                    approvalSettings.fixedLine.map((fid, idx) => {
                      const emp = employees.find(e => e.id === fid);
                      if (!emp) return null;
                      return (
                        <div
                          key={fid}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 12px", border: `1px solid ${BORDER}`, borderRadius: 6,
                            backgroundColor: "#fafafa"
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                            <span style={{ color: GOLD, fontWeight: 700, marginRight: 8 }}>{idx + 1}차 결재자</span>
                            {emp.name || emp.email} ({emp.position || "사원"})
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button type="button" onClick={() => moveApprover(idx, -1)} disabled={idx === 0}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fff", border: `1px solid #d1d5db`, borderRadius: 4 }}>▲</button>
                            <button type="button" onClick={() => moveApprover(idx, 1)} disabled={idx === approvalSettings.fixedLine.length - 1}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fff", border: `1px solid #d1d5db`, borderRadius: 4 }}>▼</button>
                            <button type="button" onClick={() => removeApprover(fid)}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 4 }}>제거</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    style={{ flex: 1, padding: "8px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6 }}
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                  >
                    <option value="">사원 선택</option>
                    {employees
                      .filter(emp => !approvalSettings.fixedLine.includes(emp.id))
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name || emp.email} ({emp.position || "사원"}) - {emp.email}
                        </option>
                      ))
                    }
                  </select>
                  <button
                    type="button" onClick={addApprover}
                    style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff", backgroundColor: GOLD, border: "none", borderRadius: 6, cursor: "pointer" }}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 결재 기능 세부 설정 카드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10, color: "#111827" }}>
                결재 기능 활성화 & 제한 조건
              </h3>
              
              {/* 1. 연가 기안 */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>🌴 연가(휴가) 신청 기안</label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>직원 포털에서 연차를 신청할 수 있습니다.</div>
                  </div>
                  <input type="checkbox" style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.leaveEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, leaveEnabled: e.target.checked })} />
                </div>
                {approvalSettings.leaveEnabled && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>최소 기안 신청 단위</label>
                    <select
                      style={{ padding: "6px 12px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, width: "100%", boxSizing: "border-box" }}
                      value={approvalSettings.leaveMinUnit}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, leaveMinUnit: e.target.value })}
                    >
                      <option value="hourly">1시간 단위 신청 가능</option>
                      <option value="half">반차(4시간) 단위 신청 가능</option>
                      <option value="daily">일차(8시간) 단위 신청 가능</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 2. 지출 결재 */}
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>💵 지출 기안</label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>포털에서 회사 지출 결재를 요청할 수 있습니다.</div>
                  </div>
                  <input type="checkbox" style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.expenseEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, expenseEnabled: e.target.checked })} />
                </div>
                {approvalSettings.expenseEnabled && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>1회 지출 최대 신청 한도액 (원)</label>
                    <input
                      style={{ padding: "6px 12px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, width: "100%", boxSizing: "border-box" }}
                      type="number" value={approvalSettings.expenseLimit || ""}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, expenseLimit: Number(e.target.value) })}
                      placeholder="예) 5000000"
                    />
                  </div>
                )}
              </div>

              {/* 3. 경비 결재 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>💳 경비 청구 기안</label>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>포털에서 사용한 법인 경비 청구를 진행할 수 있습니다.</div>
                  </div>
                  <input type="checkbox" style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.reimbursementEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, reimbursementEnabled: e.target.checked })} />
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit" disabled={processing}
                style={{
                  padding: "12px 30px", fontSize: 14, fontWeight: 700,
                  color: "#fff", backgroundColor: GOLD, border: "none",
                  borderRadius: 6, cursor: "pointer", boxShadow: `0 2px 8px rgba(176,141,87,0.3)`
                }}
              >
                {processing ? "저장 중..." : "설정 저장"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================== 탭 3: 조직도 시각화 ==================== */}
      {activeTab === "chart" && (
        <OrgChartView
          departments={departments}
          employees={employees}
          approvalSettings={approvalSettings}
          loading={loading}
          getDeptPath={getDeptPath}
        />
      )}

      {/* ==================== 탭 4: 구성원 포털 연동 ==================== */}
      {activeTab === "lawyers" && (
        <LawyersLinkView lawyersLink={lawyersLink} loading={loading} />
      )}

      {/* ==================== 부서 추가/수정 모달 ==================== */}
      {isDeptModalOpen && (
        <ModalOverlay>
          <div style={{ backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                {selectedDept ? "부서 수정" : "새 부서 등록"}
              </h3>
              <button onClick={() => setIsDeptModalOpen(false)} style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleDeptSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>부서명</label>
                <input
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  type="text" value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="예) 인사과, 기획팀" required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>상위 부서</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  value={deptForm.parentId}
                  onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                >
                  <option value="">없음 (최상위 부서)</option>
                  {departments
                    .filter(d => !selectedDept || d.id !== selectedDept.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  }
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>부서장 (Manager)</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  value={deptForm.managerUserId}
                  onChange={(e) => setDeptForm({ ...deptForm, managerUserId: e.target.value })}
                >
                  <option value="">미지정</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.email} ({emp.position || "사원"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setIsDeptModalOpen(false)}
                  style={{ padding: "8px 16px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, cursor: "pointer", background: "#fff" }}>
                  취소
                </button>
                <button type="submit" disabled={processing}
                  style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: GOLD, border: "none", borderRadius: 6, cursor: "pointer" }}>
                  {processing ? "저장 중..." : "부서 저장"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ==================== 사원 인사 정보 수정 모달 ==================== */}
      {isEmpModalOpen && selectedEmp && (
        <ModalOverlay>
          <div style={{ backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                사원 인사 정보 관리: {selectedEmp.name}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}>&times;</button>
            </div>

            <form onSubmit={handleEmpSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>소속 부서</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  value={empForm.departmentId}
                  onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
                >
                  <option value="">소속 없음</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{getDeptPath(d.id)}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>직급</label>
                <input
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  type="text" value={empForm.position}
                  onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                  placeholder="예) 대리, 변호사, 과장"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>입사일 (연차 자동 누적용)</label>
                <input
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  type="date" value={empForm.hireDate}
                  onChange={(e) => setEmpForm({ ...empForm, hireDate: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>포털 권한</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, boxSizing: "border-box" }}
                  value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                >
                  <option value="employee">직원 (Employee)</option>
                  <option value="client">의뢰인 (Client)</option>
                  <option value="admin">관리자 (Admin)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setIsEmpModalOpen(false)}
                  style={{ padding: "8px 16px", fontSize: 13, border: `1px solid #ccc`, borderRadius: 6, cursor: "pointer", background: "#fff" }}>
                  취소
                </button>
                <button type="submit" disabled={processing}
                  style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: GOLD, border: "none", borderRadius: 6, cursor: "pointer" }}>
                  {processing ? "저장 중..." : "인사 설정 저장"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* =========================================================
   조직도 시각화 컴포넌트 (SVG 트리 + 결재선 플로우)
   ========================================================= */
function OrgChartView({ departments, employees, approvalSettings, loading, getDeptPath }) {
  if (loading) return <p style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>조직도 로딩 중...</p>;

  // 조직도 트리 구축
  const buildTree = () => {
    const roots = departments.filter(d => !d.parentId);
    const getChildren = (parentId) => departments.filter(d => d.parentId === parentId);
    const getEmpsByDept = (deptId) => employees.filter(e => e.departmentId === deptId);

    return { roots, getChildren, getEmpsByDept };
  };

  const { roots, getChildren, getEmpsByDept } = buildTree();

  const approvers = approvalSettings.fixedLine.length > 0
    ? approvalSettings.fixedLine.map(id => employees.find(e => e.id === id)).filter(Boolean)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* 조직도 트리 */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px 0", color: "#111827" }}>🏢 조직도 (계층 구조)</h3>
        {departments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>
            부서가 없습니다. 먼저 부서를 추가해주세요.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <OrgTreeNode
              departments={roots}
              getChildren={getChildren}
              getEmpsByDept={getEmpsByDept}
              depth={0}
            />
          </div>
        )}
      </div>

      {/* 결재선 시각화 */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px 0", color: "#111827" }}>✅ 결재선 플로우</h3>
        <ApprovalFlowChart
          approvalSettings={approvalSettings}
          approvers={approvers}
          departments={departments}
          getDeptPath={getDeptPath}
        />
      </div>
    </div>
  );
}

/* 재귀 트리 노드 */
function OrgTreeNode({ departments, getChildren, getEmpsByDept, depth }) {
  if (!departments.length) return null;

  const colors = [GOLD, "#6366f1", "#0ea5e9", "#10b981", "#f59e0b"];
  const nodeColor = colors[depth % colors.length];

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 0, alignItems: "flex-start" }}>
      {departments.map((dept) => {
        const children = getChildren(dept.id);
        const emps = getEmpsByDept(dept.id);
        return (
          <div key={dept.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 8px" }}>
            {/* 연결선 위쪽 */}
            {depth > 0 && (
              <div style={{ width: 2, height: 24, background: "#d1d5db" }} />
            )}

            {/* 부서 박스 */}
            <div style={{
              background: `linear-gradient(135deg, ${nodeColor}15, ${nodeColor}05)`,
              border: `2px solid ${nodeColor}`,
              borderRadius: 10,
              padding: "10px 16px",
              minWidth: 130,
              maxWidth: 160,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              textAlign: "center",
              position: "relative",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{dept.name}</div>
              {dept.managerName && (
                <div style={{ fontSize: 10, color: nodeColor, fontWeight: 600 }}>
                  👤 {dept.managerName}
                </div>
              )}
              {emps.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px dashed #e5e7eb" }}>
                  {emps.map(emp => (
                    <div key={emp.id} style={{ fontSize: 10, color: "#6b7280", padding: "1px 0" }}>
                      {emp.name || emp.email} {emp.position && <span style={{ color: nodeColor }}>({emp.position})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 자식 부서로의 연결선 + 자식들 */}
            {children.length > 0 && (
              <>
                <div style={{ width: 2, height: 20, background: "#d1d5db" }} />
                <div style={{ width: Math.max(130 * children.length + 16 * (children.length - 1), 1), height: 2, background: "#d1d5db" }} />
                <OrgTreeNode
                  departments={children}
                  getChildren={getChildren}
                  getEmpsByDept={getEmpsByDept}
                  depth={depth + 1}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* 결재선 플로우 다이어그램 */
function ApprovalFlowChart({ approvalSettings, approvers, departments }) {
  const isDept = approvalSettings.approvalLineType === "dept";

  if (isDept) {
    // Build a realistic tree-based approval flow starting from a leaf department (e.g. 기획팀)
    const buildDeptFlow = () => {
      if (departments.length === 0) return [];

      // Find leaf departments (departments that are not a parent of any other department)
      const parentIds = new Set(departments.map(d => d.parentId).filter(Boolean));
      const leaves = departments.filter(d => !parentIds.has(d.id));

      // Let's choose the leaf department that has a parent (like 기획팀) to show a multi-level approval flow.
      // If there are no leaves with parents, fallback to leaves[0] or departments[0]
      const startDept = leaves.find(d => d.parentId) || leaves[0] || departments[0];

      const path = [];
      let current = startDept;
      const visited = new Set();

      while (current) {
        if (visited.has(current.id)) break;
        visited.add(current.id);
        path.push(current);

        const parent = departments.find(d => d.id === current.parentId);
        current = parent;
      }
      return path;
    };

    const flowDepts = buildDeptFlow();

    return (
      <div>
        <div style={{
          background: GOLD_LIGHT, border: `1px solid ${GOLD}30`,
          borderRadius: 8, padding: "12px 16px", marginBottom: 16,
          fontSize: 13, color: "#374151"
        }}>
          <strong style={{ color: GOLD }}>조직도 트리 기반 자동 결재선</strong> — 기안자의 부서장 → 상위 부서장 순으로 자동 결재선이 구성됩니다.
        </div>
        {departments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#9ca3af", fontSize: 13 }}>등록된 부서가 없어 결재선을 시각화할 수 없습니다.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: 16 }}>
            <FlowNode label="기안자" icon="✍️" color="#6366f1" />
            <FlowArrow />
            {flowDepts.map((dept, idx) => (
              <React.Fragment key={dept.id}>
                <FlowNode
                  label={dept.name}
                  sublabel={dept.managerName ? `부서장: ${dept.managerName}` : "부서장 미지정"}
                  icon="🏢"
                  color={GOLD}
                  step={idx + 1}
                />
                {idx < flowDepts.length - 1 && <FlowArrow />}
              </React.Fragment>
            ))}
            <FlowArrow />
            <FlowNode label="결재 완료" icon="✅" color="#10b981" />
          </div>
        )}
      </div>
    );
  }

  // 고정 결재선
  if (approvers.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>
        고정 결재선이 설정되지 않았습니다. '결재선 및 결재 기능 설정' 탭에서 결재자를 추가해주세요.
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: 8, padding: "12px 16px", marginBottom: 16,
        fontSize: 13, color: "#374151"
      }}>
        <strong style={{ color: "#16a34a" }}>고정 결재선</strong> — 아래 순서대로 결재가 진행됩니다.
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: 16 }}>
        <FlowNode label="기안자" icon="✍️" color="#6366f1" />
        <FlowArrow />
        {approvers.map((emp, idx) => (
          <React.Fragment key={emp.id}>
            <FlowNode
              label={emp.name || emp.email}
              sublabel={emp.position || "사원"}
              icon="👤"
              color={GOLD}
              step={idx + 1}
            />
            {idx < approvers.length - 1 && <FlowArrow />}
          </React.Fragment>
        ))}
        <FlowArrow />
        <FlowNode label="결재 완료" icon="✅" color="#10b981" />
      </div>
    </div>
  );
}

// React 참조 (ApprovalFlowChart에서 사용)
import React from "react";

function FlowNode({ label, sublabel, icon, color, step }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      background: `${color}10`, border: `2px solid ${color}`,
      borderRadius: 10, padding: "10px 16px", minWidth: 100, maxWidth: 130, textAlign: "center",
      position: "relative",
    }}>
      {step !== undefined && (
        <div style={{
          position: "absolute", top: -8, right: -8,
          width: 18, height: 18, borderRadius: "50%",
          background: color, color: "#fff", fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{step}</div>
      )}
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "#6b7280" }}>{sublabel}</div>}
    </div>
  );
}

function FlowArrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", color: "#d1d5db", fontSize: 20, fontWeight: 300 }}>
      →
    </div>
  );
}

/* =========================================================
   구성원 포털 연동 뷰
   ========================================================= */
function LawyersLinkView({ lawyersLink, loading }) {
  if (loading) return <p style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>데이터 로딩 중...</p>;

  const linked = lawyersLink.filter(l => l.isLinked);
  const unlinked = lawyersLink.filter(l => !l.isLinked);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 안내 배너 */}
      <div style={{
        background: GOLD_LIGHT, border: `1px solid ${GOLD}30`, borderRadius: 10,
        padding: "16px 20px", fontSize: 13, color: "#374151", lineHeight: 1.6,
      }}>
        <strong style={{ color: GOLD }}>구성원 ↔ 포털 계정 연동</strong><br />
        관리자 페이지의 변호사(구성원) 정보와 포털 사용자 계정은 <strong>이메일 주소</strong>를 기준으로 자동 연동됩니다.
        변호사 프로필과 포털 계정에 동일한 이메일이 등록되어 있으면 연동 상태로 표시됩니다.
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <SummaryCard icon="👥" label="전체 구성원" value={lawyersLink.length} color={GOLD} />
        <SummaryCard icon="🔗" label="포털 연동됨" value={linked.length} color="#10b981" />
        <SummaryCard icon="⚠️" label="연동 미완료" value={unlinked.length} color="#f59e0b" />
      </div>

      {/* 연동된 구성원 */}
      {linked.length > 0 && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px 0", color: "#10b981" }}>
            ✅ 포털 연동 완료 ({linked.length}명)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {linked.map(lw => (
              <LawyerCard key={lw.id} lawyer={lw} isLinked />
            ))}
          </div>
        </div>
      )}

      {/* 미연동 구성원 */}
      {unlinked.length > 0 && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px 0", color: "#b45309" }}>
            ⚠️ 포털 연동 미완료 ({unlinked.length}명)
          </h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
            해당 구성원의 이메일과 동일한 포털 계정이 없거나, 이메일이 등록되지 않았습니다.
            포털 계정을 생성하거나 이메일을 일치시켜 연동하세요.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {unlinked.map(lw => (
              <LawyerCard key={lw.id} lawyer={lw} isLinked={false} />
            ))}
          </div>
        </div>
      )}

      {lawyersLink.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          등록된 구성원이 없습니다. 관리자 페이지 &gt; 파트너스 메뉴에서 변호사를 등록하세요.
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function LawyerCard({ lawyer, isLinked }) {
  return (
    <div style={{
      border: `1px solid ${isLinked ? "#d1fae5" : "#fde68a"}`,
      borderRadius: 8, padding: "12px 14px",
      background: isLinked ? "#f0fdf4" : "#fffbeb",
      display: "flex", gap: 12, alignItems: "flex-start"
    }}>
      {lawyer.photoUrl ? (
        <img src={lawyer.photoUrl} alt={lawyer.name}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${isLinked ? "#10b981" : "#f59e0b"}` }} />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: isLinked ? "#d1fae5" : "#fde68a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, border: `2px solid ${isLinked ? "#10b981" : "#f59e0b"}`
        }}>
          {lawyer.name?.[0] || "?"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {lawyer.name}
          {lawyer.position && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>({lawyer.position})</span>}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          📧 {lawyer.email || "이메일 없음"}
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 12, fontWeight: 600,
            background: isLinked ? "#10b981" : "#f59e0b",
            color: "#fff"
          }}>
            {isLinked ? "🔗 포털 연동됨" : "⚠️ 연동 필요"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 공통 모달 오버레이 ── */
function ModalOverlay({ children }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
      alignItems: "center", zIndex: 1000
    }}>
      {children}
    </div>
  );
}
