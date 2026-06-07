import { useState, useEffect } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";
import useMediaQuery from "../../hooks/useMediaQuery";

// 영수증 URL 필드를 파싱하여 배열로 반환하는 헬퍼 함수
const parseReceiptUrls = (urlField) => {
  if (!urlField) return [];
  const trimmed = urlField.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return [trimmed];
    }
  }
  return [trimmed];
};

export default function PortalApprovals() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "my-requests" | "pending-approvals" | "history"
  const [leaveStatus, setLeaveStatus] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [historyApprovals, setHistoryApprovals] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);

  // 기안 폼 상태
  const [form, setForm] = useState({
    type: "leave", // "leave" | "expense" | "reimbursement"
    title: "",
    leaveType: "annual", // "annual" | "half_am" | "half_pm" | "hourly"
    leaveStart: "",
    leaveEnd: "",
    leaveDuration: 8,
    expenseAmount: "",
    expenseCategory: "meals",
    expenseReceiptUrl: "",
    expenseDate: "",
    reason: "",
  });

  // 결재 처리 상태
  const [actionComment, setActionComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, myReqsRes, pendingRes, historyRes, meRes] = await Promise.all([
        portalApi.get("/approvals/leave-status"),
        portalApi.get("/approvals/my-requests"),
        portalApi.get("/approvals/pending-approvals"),
        portalApi.get("/approvals/my-history"),
        portalApi.get("/me"),
      ]);

      setLeaveStatus(statusRes.data);
      setMyRequests(myReqsRes.data || []);
      setPendingApprovals(pendingRes.data || []);
      setHistoryApprovals(historyRes.data || []);
      setCurrentUserId(meRes.data?.user?.id || null);
    } catch (err) {
      showToast(err.message || "결재 데이터를 가져오는데 실패했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 폼 입력 핸들러
  const handleFormChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      
      // 휴가 기간 자동 설정 룰
      if (key === "leaveType") {
        if (value === "annual") updated.leaveDuration = 8;
        else if (value === "half_am" || value === "half_pm") updated.leaveDuration = 4;
        else if (value === "hourly") updated.leaveDuration = 1;
      }
      return updated;
    });
  };

  // 영수증 파일 로컬 업로드 핸들러 (다중 파일 지원)
  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 최대 10MB
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast("파일 크기가 10MB를 초과할 수 없습니다", "error");
      return;
    }

    // 허용 포맷
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      showToast("이미지 파일(JPG, PNG, WebP, GIF) 또는 PDF 파일만 업로드 가능합니다", "error");
      return;
    }

    setReceiptUploading(true);
    try {
      const res = await portalApi.upload("/upload-receipt", file);
      if (res.data && res.data.url) {
        const currentUrls = parseReceiptUrls(form.expenseReceiptUrl);
        const updatedUrls = [...currentUrls, res.data.url];
        handleFormChange("expenseReceiptUrl", JSON.stringify(updatedUrls));
        showToast("영수증 파일이 정상적으로 첨부되었습니다", "success");
      } else {
        throw new Error(res.error || "업로드 실패");
      }
    } catch (err) {
      showToast(err.message || "영수증 파일 업로드 중 오류가 발생했습니다", "error");
    } finally {
      setReceiptUploading(false);
      e.target.value = "";
    }
  };

  // 첨부된 영수증 제거 핸들러
  const handleRemoveReceipt = (urlToRemove) => {
    const currentUrls = parseReceiptUrls(form.expenseReceiptUrl);
    const updatedUrls = currentUrls.filter(url => url !== urlToRemove);
    handleFormChange("expenseReceiptUrl", updatedUrls.length > 0 ? JSON.stringify(updatedUrls) : "");
    showToast("첨부된 파일이 제거되었습니다", "success");
  };

  // 기안 제출
  const handleDraftSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("제목을 입력해주세요", "error");
      return;
    }

    if (form.type === "leave") {
      if (!form.leaveStart || !form.leaveEnd) {
        showToast("휴가 기간을 설정해주세요", "error");
        return;
      }
      if (form.leaveDuration <= 0) {
        showToast("올바른 휴가 시간을 설정해주세요", "error");
        return;
      }
      if (leaveStatus && leaveStatus.availableHours < form.leaveDuration) {
        showToast(`잔여 휴가 시간(${leaveStatus.availableHours}시간)이 부족합니다`, "error");
        return;
      }
    }

    if ((form.type === "expense" || form.type === "reimbursement") && !form.expenseAmount) {
      showToast("금액을 입력해주세요", "error");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        leaveType: form.type === "leave" ? form.leaveType : undefined,
        leaveStart: form.type === "leave" ? form.leaveStart : undefined,
        leaveEnd: form.type === "leave" ? form.leaveEnd : undefined,
        leaveDuration: form.type === "leave" ? Number(form.leaveDuration) : undefined,
        expenseAmount: (form.type === "expense" || form.type === "reimbursement") ? Number(form.expenseAmount) : undefined,
        expenseCategory: (form.type === "expense" || form.type === "reimbursement") ? form.expenseCategory : undefined,
        expenseReceiptUrl: (form.type === "expense" || form.type === "reimbursement") ? form.expenseReceiptUrl.trim() : undefined,
        expenseDate: (form.type === "expense" || form.type === "reimbursement") ? form.expenseDate : undefined,
        detail: form.reason.trim(), // 상세 사유
      };

      await portalApi.post("/approvals", payload);
      showToast("결재 기안이 상신되었습니다", "success");
      setIsDraftOpen(false);
      // 폼 초기화
      setForm({
        type: "leave",
        title: "",
        leaveType: "annual",
        leaveStart: "",
        leaveEnd: "",
        leaveDuration: 8,
        expenseAmount: "",
        expenseCategory: "meals",
        expenseReceiptUrl: "",
        expenseDate: "",
        reason: "",
      });
      loadData();
    } catch (err) {
      showToast(err.message || "기안 등록에 실패했습니다", "error");
    } finally {
      setProcessing(false);
    }
  };

  // 결재 상세 보기
  const handleViewDetail = async (id) => {
    try {
      const res = await portalApi.get(`/approvals/${id}`);
      setSelectedApproval(res.data);
      setActionComment("");
      setIsDetailOpen(true);
    } catch (err) {
      showToast(err.message || "결재 문서를 불러오지 못했습니다", "error");
    }
  };

  // 승인/반려 액션
  const handleApproveAction = async (id, type) => {
    // type: "approve" | "reject"
    if (type === "reject" && !actionComment.trim()) {
      showToast("반려 시 사유를 반드시 입력해주세요", "error");
      return;
    }

    setProcessing(true);
    try {
      const url = `/approvals/${id}/${type}`;
      await portalApi.post(url, { comment: actionComment.trim() });
      showToast(type === "approve" ? "승인 처리되었습니다" : "반려 처리되었습니다", "success");
      setIsDetailOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || "결재 처리에 실패했습니다", "error");
    } finally {
      setProcessing(false);
    }
  };

  // 공통 배지 렌더러
  const renderStatusBadge = (status) => {
    let bg = "#f3f4f6";
    let color = "#1f2937";
    let label = "대기";

    if (status === "approved") {
      bg = "#d1fae5";
      color = "#065f46";
      label = "승인완료";
    } else if (status === "rejected") {
      bg = "#fee2e2";
      color = "#991b1b";
      label = "반려";
    } else if (status === "pending") {
      bg = "#fef3c7";
      color = "#92400e";
      label = "진행중";
    }

    return (
      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 12, backgroundColor: bg, color }}>
        {label}
      </span>
    );
  };

  const renderTypeBadge = (type) => {
    let label = "기타";
    let color = "#555";
    let bg = "#eee";

    if (type === "leave") {
      label = "연가/휴가";
      color = "#1d4ed8";
      bg = "#dbeafe";
    } else if (type === "expense") {
      label = "지출결의";
      color = "#0369a1";
      bg = "#e0f2fe";
    } else if (type === "reimbursement") {
      label = "경비청구";
      color = "#047857";
      bg = "#d1fae5";
    }

    return (
      <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 8px", borderRadius: 4, backgroundColor: bg, color }}>
        {label}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ==================== 헤더 영역 ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, margin: "0 0 4px 0", fontFamily: "'Noto Serif KR', serif" }}>
            전자결재 시스템
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>
            휴가 신청 및 지출, 경비 결재를 진행할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setIsDraftOpen(true)}
          style={{
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            color: "#fff", background: T.accent, border: "none",
            borderRadius: 6, cursor: "pointer", boxShadow: "0 2px 8px rgba(176,141,87,0.3)"
          }}
        >
          + 새 기안 작성
        </button>
      </div>

      {/* ==================== 연가 대시보드 카드 (연가 탭 선택 혹은 대시보드에 항상 노출) ==================== */}
      {leaveStatus && (
        <div style={{
          background: "linear-gradient(135deg, #fbfaf8 0%, #f7f4ef 100%)",
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 30,
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)"
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <span>🌴</span> 근로기준법 연차 현황
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: 8, border: "1px solid #eaeaea" }}>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>입사일</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                {leaveStatus.hireDate ? leaveStatus.hireDate : "미입력"}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                {leaveStatus.details}
              </div>
            </div>

            <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: 8, border: "1px solid #eaeaea" }}>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>발생 연가</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a" }}>
                {leaveStatus.totalAccruedDays}일 <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>({leaveStatus.totalAccruedHours}시간)</span>
              </div>
            </div>

            <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: 8, border: "1px solid #eaeaea" }}>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>사용 연가</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c" }}>
                {leaveStatus.totalUsedDays}일 <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>({leaveStatus.totalUsedHours}시간)</span>
              </div>
            </div>

            <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: 8, border: "1px solid #eaeaea", borderLeft: "4px solid #b08d57" }}>
              <div style={{ fontSize: 12, color: "#b08d57", fontWeight: 600, marginBottom: 4 }}>잔여 연가</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#b08d57" }}>
                {leaveStatus.availableDays}일 <span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>({leaveStatus.availableHours}시간)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 탭 메뉴 ==================== */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        {[
          { id: "dashboard", label: "결재 대시보드" },
          { id: "my-requests", label: `내 기안함 (${myRequests.length})` },
          { id: "pending-approvals", label: `결재 대기함 (${pendingApprovals.length})` },
          { id: "history", label: `결재 완료/진행 수신함 (${historyApprovals.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? T.accent : T.textSec,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== 탭 내용 렌더러 ==================== */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>데이터 불러오는 중...</div>
      ) : (
        <div>
          {/* 1. 대시보드 탭 */}
          {activeTab === "dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              {/* 결재 대기 중인 문서 요약 */}
              <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px 0", display: "flex", justifyContent: "space-between" }}>
                  <span>⏳ 결재 대기 문서</span>
                  <span style={{ fontSize: 12, color: T.accent }}>{pendingApprovals.length}건</span>
                </h3>
                {pendingApprovals.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", padding: "30px 0" }}>결재 대기 문서가 없습니다.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {pendingApprovals.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleViewDetail(doc.id)}
                        style={{
                          padding: 12, border: "1px solid #f0f0f0", borderRadius: 6, cursor: "pointer",
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{doc.title}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                            기안자: {doc.requesterName} ({doc.requesterPosition}) | {doc.createdAt.slice(0, 10)}
                          </div>
                        </div>
                        {renderTypeBadge(doc.type)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 최근 내 기안 요약 */}
              <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px 0", display: "flex", justifyContent: "space-between" }}>
                  <span>📋 최근 기안 문서</span>
                  <span style={{ fontSize: 12, color: T.textMuted }}>최근 5건</span>
                </h3>
                {myRequests.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", padding: "30px 0" }}>상신한 기안 문서가 없습니다.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {myRequests.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleViewDetail(doc.id)}
                        style={{
                          padding: 12, border: "1px solid #f0f0f0", borderRadius: 6, cursor: "pointer",
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{doc.title}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                            신청일: {doc.createdAt.slice(0, 10)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {renderTypeBadge(doc.type)}
                          {renderStatusBadge(doc.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. 내 기안함 탭 */}
          {activeTab === "my-requests" && (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "12px 16px" }}>유형</th>
                    <th style={{ padding: "12px 16px" }}>제목</th>
                    <th style={{ padding: "12px 16px" }}>기안일시</th>
                    <th style={{ padding: "12px 16px" }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: 40, textAlign: "center", color: T.textMuted }}>상신한 문서가 없습니다.</td>
                    </tr>
                  ) : (
                    myRequests.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => handleViewDetail(doc.id)}
                        style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                      >
                        <td style={{ padding: "14px 16px" }}>{renderTypeBadge(doc.type)}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: T.text }}>{doc.title}</td>
                        <td style={{ padding: "14px 16px", color: T.textSec }}>{doc.createdAt}</td>
                        <td style={{ padding: "14px 16px" }}>{renderStatusBadge(doc.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. 결재 대기함 탭 */}
          {activeTab === "pending-approvals" && (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "12px 16px" }}>유형</th>
                    <th style={{ padding: "12px 16px" }}>제목</th>
                    <th style={{ padding: "12px 16px" }}>기안자</th>
                    <th style={{ padding: "12px 16px" }}>기안일시</th>
                    <th style={{ padding: "12px 16px" }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: 40, textAlign: "center", color: T.textMuted }}>결재 대기 중인 문서가 없습니다.</td>
                    </tr>
                  ) : (
                    pendingApprovals.map((doc) => (
                      <tr
                        key={doc.id}
                        style={{ borderBottom: "1px solid #f0f0f0" }}
                      >
                        <td style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => handleViewDetail(doc.id)}>{renderTypeBadge(doc.type)}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: T.text, cursor: "pointer" }} onClick={() => handleViewDetail(doc.id)}>{doc.title}</td>
                        <td style={{ padding: "14px 16px" }}>{doc.requesterName} ({doc.requesterPosition || "사원"})</td>
                        <td style={{ padding: "14px 16px", color: T.textSec }}>{doc.createdAt}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            onClick={() => handleViewDetail(doc.id)}
                            style={{
                              padding: "4px 10px", fontSize: 12, fontWeight: 600,
                              color: "#fff", background: T.accent, border: "none",
                              borderRadius: 4, cursor: "pointer"
                            }}
                          >
                            결재하기
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. 완료/진행 수신함 탭 */}
          {activeTab === "history" && (
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "12px 16px" }}>유형</th>
                    <th style={{ padding: "12px 16px" }}>제목</th>
                    <th style={{ padding: "12px 16px" }}>기안자</th>
                    <th style={{ padding: "12px 16px" }}>기안일시</th>
                    <th style={{ padding: "12px 16px" }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {historyApprovals.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: 40, textAlign: "center", color: T.textMuted }}>참여한 기안 문서가 없습니다.</td>
                    </tr>
                  ) : (
                    historyApprovals.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => handleViewDetail(doc.id)}
                        style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                      >
                        <td style={{ padding: "14px 16px" }}>{renderTypeBadge(doc.type)}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: T.text }}>{doc.title}</td>
                        <td style={{ padding: "14px 16px" }}>{doc.requesterName} ({doc.requesterPosition || "사원"})</td>
                        <td style={{ padding: "14px 16px", color: T.textSec }}>{doc.createdAt}</td>
                        <td style={{ padding: "14px 16px" }}>{renderStatusBadge(doc.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== 1. 기안 신규 등록 모달 ==================== */}
      {isDraftOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff", width: "90%", maxWidth: 600, borderRadius: 12,
            padding: 24, display: "flex", flexDirection: "column", maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>새 기안서 상신</h2>
              <button
                onClick={() => setIsDraftOpen(false)}
                style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDraftSubmit}>
              {/* 기안 유형 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>기안 구분</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { id: "leave", label: "연가 신청" },
                    { id: "expense", label: "지출 결의" },
                    { id: "reimbursement", label: "경비 청구" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleFormChange("type", btn.id)}
                      style={{
                        flex: 1, padding: "10px", fontSize: 13, fontWeight: 600,
                        border: `1px solid ${form.type === btn.id ? T.accent : "#ccc"}`,
                        borderRadius: 6,
                        color: form.type === btn.id ? T.accent : "#555",
                        backgroundColor: form.type === btn.id ? "#fdfbf7" : "#fff",
                        cursor: "pointer"
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>제목</label>
                <input
                  style={fieldStyle}
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="예) 6월 연차 휴가 신청의 건"
                  required
                />
              </div>

              {/* 1. 휴가형 필드 */}
              {form.type === "leave" && (
                <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px 0" }}>휴가 정보</h4>

                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>휴가 종류</label>
                    <select
                      style={fieldStyle}
                      value={form.leaveType}
                      onChange={(e) => handleFormChange("leaveType", e.target.value)}
                    >
                      <option value="annual">연차 (8시간)</option>
                      <option value="half_am">오전 반차 (4시간)</option>
                      <option value="half_pm">오후 반차 (4시간)</option>
                      <option value="hourly">시간차 (1시간 단위)</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>시작 일시</label>
                      <input
                        style={fieldStyle}
                        type="datetime-local"
                        value={form.leaveStart}
                        onChange={(e) => handleFormChange("leaveStart", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>종료 일시</label>
                      <input
                        style={fieldStyle}
                        type="datetime-local"
                        value={form.leaveEnd}
                        onChange={(e) => handleFormChange("leaveEnd", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {form.leaveType === "hourly" && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>신청 시간 (시간)</label>
                      <input
                        style={fieldStyle}
                        type="number"
                        min="1"
                        max="8"
                        value={form.leaveDuration}
                        onChange={(e) => handleFormChange("leaveDuration", Number(e.target.value))}
                        required
                      />
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>
                    💡 총 차감 연가: {form.leaveDuration}시간 ({(form.leaveDuration / 8).toFixed(2)}일)
                  </div>
                </div>
              )}

              {/* 2. 지출/경비형 필드 */}
              {(form.type === "expense" || form.type === "reimbursement") && (
                <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px 0" }}>지출 상세 정보</h4>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>지출 일자</label>
                      <input
                        style={fieldStyle}
                        type="date"
                        value={form.expenseDate}
                        onChange={(e) => handleFormChange("expenseDate", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>지출 카테고리</label>
                      <select
                        style={fieldStyle}
                        value={form.expenseCategory}
                        onChange={(e) => handleFormChange("expenseCategory", e.target.value)}
                      >
                        <option value="meals">식비</option>
                        <option value="travel">교통비 / 여비</option>
                        <option value="supplies">사무소 소모품</option>
                        <option value="other">기타 지출</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>지출 금액 (원)</label>
                    <input
                      style={fieldStyle}
                      type="number"
                      value={form.expenseAmount}
                      onChange={(e) => handleFormChange("expenseAmount", e.target.value)}
                      placeholder="예) 50000"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>영수증 파일 첨부 (다중 첨부 가능)</label>
                    
                    {parseReceiptUrls(form.expenseReceiptUrl).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                        {parseReceiptUrls(form.expenseReceiptUrl).map((url, idx) => (
                          <div key={idx} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            border: "1px solid var(--border-color)",
                            borderRadius: 6,
                            background: "#f9fafb"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                              {url.toLowerCase().endsWith(".pdf") ? (
                                <span style={{ fontSize: 16 }}>📄</span>
                              ) : (
                                <span style={{ fontSize: 16 }}>🖼️</span>
                              )}
                              <span style={{
                                fontSize: 13,
                                color: "var(--text-primary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 260
                              }}>
                                {url.split("/").pop()}
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, color: "#2563eb", textDecoration: "underline", flexShrink: 0 }}
                              >
                                보기
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveReceipt(url)}
                              style={{
                                border: "none",
                                background: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "4px 8px"
                              }}
                            >
                              제거
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "20px 14px",
                          border: "2px dashed var(--border-color)",
                          borderRadius: 6,
                          cursor: receiptUploading ? "not-allowed" : "pointer",
                          background: "#fff",
                          transition: "all 0.2s ease",
                          textAlign: "center"
                        }}
                      >
                        {receiptUploading ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div className="spinner" style={{
                              width: 20,
                              height: 20,
                              border: "2px solid #ccc",
                              borderTop: "2px solid var(--accent-gold)",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }} />
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>업로드 중...</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 24, marginBottom: 4 }}>📤</span>
                            <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                              클릭하여 추가 파일 선택
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              JPG, PNG, WebP, GIF, PDF (최대 10MB)
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptUpload}
                          disabled={receiptUploading}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 상세 내용 */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>신청 사유 / 상세 내용</label>
                <textarea
                  style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                  value={form.reason}
                  onChange={(e) => handleFormChange("reason", e.target.value)}
                  placeholder="결재권자가 확인할 상세 정보를 기재해 주세요"
                />
              </div>

              {/* 결재선 미리보기 */}
              <div style={{ marginBottom: 20, padding: 12, border: "1px dashed #ccc", borderRadius: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 8 }}>예상 결재선 (조직도 기준 자동생성)</label>
                {leaveStatus && leaveStatus.defaultApprovalLine && leaveStatus.defaultApprovalLine.length > 0 ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {leaveStatus.defaultApprovalLine.map((appr, idx) => (
                      <span key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 12, padding: "5px 10px", borderRadius: 6,
                          backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb"
                        }}>
                          {appr.name} ({appr.position})
                        </span>
                        {idx < leaveStatus.defaultApprovalLine.length - 1 && <span style={{ color: "#9ca3af" }}>➔</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.textMuted }}>
                    상위 조직도 및 부서장이 설정되지 않아, 기안 시 즉시 자동 승인됩니다.
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsDraftOpen(false)}
                  style={{
                    padding: "10px 16px", fontSize: 13, border: "1px solid #ccc",
                    borderRadius: 6, cursor: "pointer", background: "#fff"
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    padding: "10px 20px", fontSize: 13, fontWeight: 600,
                    color: "#fff", background: T.accent, border: "none",
                    borderRadius: 6, cursor: "pointer", opacity: processing ? 0.6 : 1
                  }}
                >
                  {processing ? "상신 중..." : "기안 상신"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2. 결재 상세 보기 모달 ==================== */}
      {isDetailOpen && selectedApproval && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff", width: "90%", maxWidth: 640, borderRadius: 12,
            padding: 24, display: "flex", flexDirection: "column", maxHeight: "95vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>결재 문서 상세 정보</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{ fontSize: 20, border: "none", background: "none", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {/* 결재 문서 메타 */}
            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                {renderTypeBadge(selectedApproval.type)}
                {renderStatusBadge(selectedApproval.status)}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px 0" }}>{selectedApproval.title}</h3>
              <div style={{ fontSize: 12, color: T.textSec, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6 }}>
                <div>기안자: {selectedApproval.requesterName} ({selectedApproval.requesterPosition || "사원"})</div>
                <div>기안일: {selectedApproval.createdAt}</div>
              </div>
            </div>

            {/* 본문 상세 */}
            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px 0" }}>기안 내용</h4>
              
              {/* 휴가 전용 */}
              {selectedApproval.type === "leave" && (
                <div style={{ backgroundColor: "#f9fafb", padding: 12, borderRadius: 6, fontSize: 13, display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  <div>• 구분: {selectedApproval.leaveType === "annual" ? "연차" : selectedApproval.leaveType === "half_am" ? "오전 반차" : selectedApproval.leaveType === "half_pm" ? "오후 반차" : "시간차"}</div>
                  <div>• 기간: {selectedApproval.leaveStart} ~ {selectedApproval.leaveEnd}</div>
                  <div>• 차감 시간: {selectedApproval.leaveDuration}시간 ({(selectedApproval.leaveDuration / 8).toFixed(2)}일)</div>
                </div>
              )}

              {/* 지출/경비 전용 */}
              {(selectedApproval.type === "expense" || selectedApproval.type === "reimbursement") && (
                <div style={{ backgroundColor: "#f9fafb", padding: 12, borderRadius: 6, fontSize: 13, display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  <div>• 카테고리: {selectedApproval.expenseCategory === "meals" ? "식비" : selectedApproval.expenseCategory === "travel" ? "교통/여비" : selectedApproval.expenseCategory === "supplies" ? "소모품" : "기타"}</div>
                  <div>• 금액: {selectedApproval.expenseAmount ? selectedApproval.expenseAmount.toLocaleString() : 0} 원</div>
                  {selectedApproval.expenseDate && <div>• 지출일자: {selectedApproval.expenseDate}</div>}
                  {selectedApproval.expenseReceiptUrl && (
                    <div style={{ marginTop: 8 }}>
                      <div>• 증빙 영수증:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                        {parseReceiptUrls(selectedApproval.expenseReceiptUrl).map((url, idx) => (
                          <div key={idx} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            padding: 12,
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            background: "#fff"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                                {url.toLowerCase().endsWith(".pdf") ? (
                                  <span style={{ fontSize: 20 }}>📄</span>
                                ) : (
                                  <span style={{ fontSize: 20 }}>🖼️</span>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                  <span style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    maxWidth: 280
                                  }}>
                                    {url.split("/").pop()}
                                  </span>
                                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                    {url.toLowerCase().endsWith(".pdf") ? "PDF 문서" : "이미지 파일"}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#fff",
                                  background: "var(--accent-gold)",
                                  padding: "6px 12px",
                                  borderRadius: 4,
                                  textDecoration: "none",
                                  display: "inline-block"
                                }}
                              >
                                파일 열기
                              </a>
                            </div>
                            
                            {!url.toLowerCase().endsWith(".pdf") && (
                              <div style={{
                                border: "1px solid var(--border-color)",
                                borderRadius: 6,
                                overflow: "hidden",
                                maxHeight: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyCenter: "center",
                                background: "#fff"
                              }}>
                                <img
                                  src={url}
                                  alt={`Receipt preview ${idx + 1}`}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 200,
                                    objectFit: "contain"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{
                fontSize: 13, whiteSpace: "pre-wrap", color: T.text, marginTop: 10,
                backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: 6, padding: 12
              }}>
                {selectedApproval.detail || "상세 사유가 기재되지 않았습니다."}
              </div>
            </div>

            {/* 결재선 정보 */}
            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px 0" }}>결재선 현황</h4>
              {selectedApproval.approvalLine && selectedApproval.approvalLine.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedApproval.approvalLine.map((appr, idx) => {
                    let badgeColor = "#e5e7eb";
                    let badgeText = "대기";
                    if (appr.status === "approved") { badgeColor = "#d1fae5"; badgeText = "승인"; }
                    else if (appr.status === "rejected") { badgeColor = "#fee2e2"; badgeText = "반려"; }

                    return (
                      <div key={idx} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: 10, border: "1px solid #f3f4f6", borderRadius: 6,
                        backgroundColor: selectedApproval.currentApproverId === appr.userId && selectedApproval.status === "pending" ? "#fffbeb" : "#fff"
                      }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{appr.name} ({appr.position})</span>
                          {appr.comment && (
                            <div style={{ fontSize: 12, color: "#d97706", marginTop: 4, fontStyle: "italic" }}>
                              💬 {appr.comment}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                            backgroundColor: badgeColor, marginRight: 6
                          }}>
                            {badgeText}
                          </span>
                          {appr.updatedAt && <span style={{ fontSize: 11, color: T.textMuted }}>{appr.updatedAt.slice(5, 16)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: T.textMuted }}>결재자 없음 (즉시 자동 승인)</div>
              )}
            </div>

            {/* 결재 처리 영역 (로그인 사용자가 현재 결재권자인 경우에만 노출) */}
            {selectedApproval.status === "pending" && selectedApproval.currentApproverId === currentUserId && (
              <div style={{ backgroundColor: "#fefbeb", border: "1px solid #fef3c7", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 10px 0" }}>결재 결정</h4>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>의견 (반려 시 필수 입력)</label>
                  <textarea
                    style={{ ...fieldStyle, minHeight: 60, resize: "none" }}
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="결재 의견을 기재하세요"
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleApproveAction(selectedApproval.id, "reject")}
                    disabled={processing}
                    style={{
                      padding: "8px 16px", fontSize: 13, fontWeight: 600,
                      color: "#b91c1c", backgroundColor: "#fee2e2", border: "1px solid #fca5a5",
                      borderRadius: 6, cursor: "pointer"
                    }}
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApproveAction(selectedApproval.id, "approve")}
                    disabled={processing}
                    style={{
                      padding: "8px 16px", fontSize: 13, fontWeight: 600,
                      color: "#065f46", backgroundColor: "#d1fae5", border: "1px solid #6ee7b7",
                      borderRadius: 6, cursor: "pointer"
                    }}
                  >
                    승인
                  </button>
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  padding: "10px 20px", fontSize: 13, fontWeight: 600,
                  color: "#555", background: "#f5f5f5", border: "1px solid #ccc",
                  borderRadius: 6, cursor: "pointer"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
