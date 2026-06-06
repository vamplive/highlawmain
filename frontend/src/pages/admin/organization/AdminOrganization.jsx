import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";

export default function AdminOrganization() {
  const [activeTab, setActiveTab] = useState("organization"); // "organization" | "approvals"
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
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
      const [deptRes, empRes, settingsRes] = await Promise.all([
        api.get("/admin/organization/departments"),
        api.get("/admin/organization/users"),
        api.get("/admin/organization/approval-settings"),
      ]);

      setDepartments(deptRes.data || []);
      setEmployees(empRes.data || []);
      if (settingsRes.data) {
        setApprovalSettings(settingsRes.data);
      }
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
        // 수정
        await api.put(`/admin/organization/departments/${selectedDept.id}`, deptForm);
        showToast("부서 정보가 수정되었습니다", "success");
      } else {
        // 등록
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

  return (
    <div style={{ padding: 24, background: "#fcfaf7", minHeight: "100vh" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1f2937", margin: "0 0 6px 0", fontFamily: "'Noto Serif KR', serif" }}>
            조직도 & 결재선 관리
          </h1>
          <p style={{ fontSize: 14, color: "#4b5563", margin: 0 }}>
            부서 구조를 세팅하고, 각 사원의 입사일 및 부서를 설정하여 결재선을 자동화합니다.
          </p>
        </div>
        {activeTab === "organization" && (
          <button
            onClick={() => openDeptModal()}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              color: "#fff", backgroundColor: "#b08d57", border: "none",
              borderRadius: 6, cursor: "pointer", boxShadow: "0 2px 8px rgba(176,141,87,0.3)"
            }}
          >
            + 부서 추가
          </button>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("organization")}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: activeTab === "organization" ? 700 : 500,
            color: activeTab === "organization" ? "#b08d57" : "#4b5563",
            background: "none",
            border: "none",
            borderBottom: activeTab === "organization" ? "2px solid #b08d57" : "none",
            cursor: "pointer",
          }}
        >
          조직도 & 인사 관리
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: activeTab === "approvals" ? 700 : 500,
            color: activeTab === "approvals" ? "#b08d57" : "#4b5563",
            background: "none",
            border: "none",
            borderBottom: activeTab === "approvals" ? "2px solid #b08d57" : "none",
            cursor: "pointer",
          }}
        >
          결재선 및 결재 기능 설정
        </button>
      </div>

      {/* 1. 조직도 & 인사 관리 탭 */}
      {activeTab === "organization" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24, alignItems: "start" }}>
          {/* 1. 부서 트리 / 목록 관리 카드 */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
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
                      padding: 12, border: "1px solid #e5e7eb", borderRadius: 8,
                      backgroundColor: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{dept.name}</div>
                        {dept.parentId && (
                          <div style={{ fontSize: 11, color: "#b08d57", marginTop: 2 }}>
                            상위: {departments.find(d => d.id === dept.parentId)?.name}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>
                          부서장: <span style={{ fontWeight: 600 }}>{dept.managerName ? `${dept.managerName} (${dept.managerPosition || "직급없음"})` : "미지정"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => openDeptModal(dept)}
                          style={{ padding: "4px 8px", fontSize: 11, background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}
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
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
              임직원 인사 설정 ({employees.length}명)
            </h3>
            {loading ? (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: 20 }}>로딩 중...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
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
                        <td style={{ padding: "14px 16px", color: "#b08d57", fontWeight: 500 }}>
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
                              color: "#fff", backgroundColor: "#b08d57", border: "none",
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

      {/* 2. 결재선 및 결재 기능 설정 탭 */}
      {activeTab === "approvals" && (
        <form onSubmit={handleSaveApprovalSettings} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          {/* 결재선 설정 카드 */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 10, color: "#111827" }}>
              결재선 설정
            </h3>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>결재선 생성 방식</label>
              <div style={{ display: "flex", gap: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "#374151" }}>
                  <input
                    type="radio"
                    name="approvalLineType"
                    value="dept"
                    checked={approvalSettings.approvalLineType === "dept"}
                    onChange={() => setApprovalSettings({ ...approvalSettings, approvalLineType: "dept" })}
                  />
                  조직도 트리 기반 자동 결재선
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "#374151" }}>
                  <input
                    type="radio"
                    name="approvalLineType"
                    value="fixed"
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
                
                {/* 현재 결재선 */}
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
                            padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6,
                            backgroundColor: "#fafafa"
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                            <span style={{ color: "#b08d57", fontWeight: 700, marginRight: 8 }}>{idx + 1}차 결재자</span>
                            {emp.name || emp.email} ({emp.position || "사원"})
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => moveApprover(idx, -1)}
                              disabled={idx === 0}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fff", border: "1px solid #d1d5db", borderRadius: 4 }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveApprover(idx, 1)}
                              disabled={idx === approvalSettings.fixedLine.length - 1}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fff", border: "1px solid #d1d5db", borderRadius: 4 }}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => removeApprover(fid)}
                              style={{ padding: "2px 6px", fontSize: 11, cursor: "pointer", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 4 }}
                            >
                              제거
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 사원 추가 dropdown */}
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    style={{ flex: 1, padding: "8px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6 }}
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
                    type="button"
                    onClick={addApprover}
                    style={{
                      padding: "8px 16px", fontSize: 12, fontWeight: 600,
                      color: "#fff", backgroundColor: "#b08d57", border: "none",
                      borderRadius: 6, cursor: "pointer"
                    }}
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 결재 기능 세부 설정 카드 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
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
                  <input
                    type="checkbox"
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.leaveEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, leaveEnabled: e.target.checked })}
                  />
                </div>
                {approvalSettings.leaveEnabled && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>최소 기안 신청 단위</label>
                    <select
                      style={{ padding: "6px 12px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, width: "100%", boxSizing: "border-box" }}
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
                  <input
                    type="checkbox"
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.expenseEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, expenseEnabled: e.target.checked })}
                  />
                </div>
                {approvalSettings.expenseEnabled && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>1회 지출 최대 신청 한도액 (원)</label>
                    <input
                      style={{ padding: "6px 12px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, width: "100%", boxSizing: "border-box" }}
                      type="number"
                      value={approvalSettings.expenseLimit || ""}
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
                  <input
                    type="checkbox"
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                    checked={approvalSettings.reimbursementEnabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, reimbursementEnabled: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={processing}
                style={{
                  padding: "12px 30px", fontSize: 14, fontWeight: 700,
                  color: "#fff", backgroundColor: "#b08d57", border: "none",
                  borderRadius: 6, cursor: "pointer", boxShadow: "0 2px 8px rgba(176,141,87,0.3)"
                }}
              >
                {processing ? "저장 중..." : "설정 저장"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================== 1. 부서 추가/수정 모달 ==================== */}
      {isDeptModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000
        }}>
          <div style={{ backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                {selectedDept ? "부서 수정" : "새 부서 등록"}
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDeptSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>부서명</label>
                <input
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="예) 인사과, 기획팀"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>상위 부서</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
                  value={deptForm.parentId}
                  onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
                >
                  <option value="">없음 (최상위 부서)</option>
                  {departments
                    .filter(d => !selectedDept || d.id !== selectedDept.id) // 본인 제외
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  }
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>부서장 (Manager)</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
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
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", background: "#fff" }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: "#b08d57", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  {processing ? "저장 중..." : "부서 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2. 사원 인사 정보 수정 모달 ==================== */}
      {isEmpModalOpen && selectedEmp && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000
        }}>
          <div style={{ backgroundColor: "#fff", width: "90%", maxWidth: 450, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                사원 인사 정보 관리: {selectedEmp.name}
              </h3>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEmpSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>소속 부서</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
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
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
                  type="text"
                  value={empForm.position}
                  onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                  placeholder="예) 대리, 변호사, 과장"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>입사일 (연차 자동 누적용)</label>
                <input
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
                  type="date"
                  value={empForm.hireDate}
                  onChange={(e) => setEmpForm({ ...empForm, hireDate: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 6 }}>포털 권한</label>
                <select
                  style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" }}
                  value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                >
                  <option value="employee">직원 (Employee)</option>
                  <option value="client">의뢰인 (Client)</option>
                  <option value="admin">관리자 (Admin)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", background: "#fff" }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: "#b08d57", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  {processing ? "저장 중..." : "인사 설정 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
