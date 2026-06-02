/**
 * 관리자 사건 관리 페이지.
 *
 * - 사건 기본 정보 (사건명/의뢰인/담당 변호사/상태) 와
 *   전자소송 메타데이터 (사건번호/재판부/원고/피고/사건유형/제소일) 를 관리한다.
 * - 상세 패널에서는 3개 탭으로 분리:
 *     1) 기본 정보 (상태 변경)
 *     2) 사건 기록  — PDF 업로드 + 메타데이터 관리 (CaseRecordsPanel)
 *     3) 메시지     — 의뢰인 ↔ 변호사 채팅 스레드
 * - 백엔드 엔드포인트: /api/portal/admin/cases
 *   사건 기록 업로드/조회: /api/case-records/admin/*
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { formatDate } from "../../../utils/formatters";
import useCrudForm from "../../../hooks/useCrudForm";
import {
  PageHeader, EditPanel, FormField, EmptyState, ErrorBanner,
  COLORS, fieldStyle, labelStyle, btnStyle, outlineBtnStyle,
} from "../../../components/admin";
import { showToast } from "../../../utils/showToast";
import CaseRecordsPanel from "./CaseRecordsPanel";

/* ── 사건 상태 옵션 ── */
const STATUS_OPTIONS = [
  { value: "접수", label: "접수", color: "#1976d2", bg: "#e3f2fd" },
  { value: "진행", label: "진행", color: COLORS.accent, bg: "#fff8e1" },
  { value: "완료", label: "완료", color: "#2e7d32", bg: "#e8f5e9" },
];

const CASE_TYPE_OPTIONS = [
  { value: "", label: "선택" },
  { value: "민사", label: "민사" },
  { value: "형사", label: "형사" },
  { value: "가사", label: "가사" },
  { value: "행정", label: "행정" },
  { value: "조정/중재", label: "조정/중재" },
  { value: "비송", label: "비송" },
  { value: "기타", label: "기타" },
];

/** 폼 초기값 — useCrudForm 의 EMPTY_FORM */
const EMPTY_FORM = {
  title: "", description: "",
  clientId: "", lawyerId: "", status: "접수",
  caseNumber: "", court: "", caseType: "",
  plaintiff: "", defendant: "", filedAt: "",
};

/** 상태 배지 */
function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 8, background: opt.bg, color: opt.color, fontWeight: 500 }}>
      {opt.label}
    </span>
  );
}

/** 사건 목록 행 */
function CaseRow({ caseItem, onDetail, onEdit, onRemove }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{ padding: "14px 20px", background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{caseItem.title}</span>
          <StatusBadge status={caseItem.status} />
          {caseItem.caseNumber && (
            <span style={{ fontSize: 11, padding: "1px 8px", background: "#f0f4f8", color: COLORS.accent, borderRadius: 4, fontFamily: "monospace" }}>
              {caseItem.caseNumber}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: COLORS.textSecondary }}>
          {caseItem.clientName && <span>의뢰인: {caseItem.clientName}</span>}
          {caseItem.lawyerName && <span style={{ color: COLORS.textMuted }}> &middot; 담당: {caseItem.lawyerName}</span>}
          {caseItem.court && <span style={{ color: COLORS.textMuted }}> &middot; {caseItem.court}</span>}
          {caseItem.createdAt && <span style={{ color: COLORS.textMuted }}> &middot; {formatDate(caseItem.createdAt)}</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onDetail(caseItem)} style={outlineBtnStyle()}>상세</button>
        <button onClick={() => onEdit(caseItem)} style={outlineBtnStyle()}>수정</button>
        <button onClick={() => onRemove(caseItem.id)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
      </div>
    </div>
  );
}

/** 메시지 버블 (관리자 시점: 변호사 자기 메시지 = 우측) */
function MessageBubble({ message }) {
  const isLawyer = message.senderType === "lawyer";
  return (
    <div style={{ marginBottom: 10, display: "flex", justifyContent: isLawyer ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "70%", padding: "8px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
        background: isLawyer ? COLORS.accent : "#f0f0f0",
        color: isLawyer ? "#fff" : COLORS.text,
      }}>
        {message.content}
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>
          {message.createdAt ? new Date(message.createdAt).toLocaleString("ko-KR") : ""}
        </div>
      </div>
    </div>
  );
}

/** 사건 상세 — 3개 탭 (정보/기록/메시지) */
function CaseDetailPanel({ caseItem, onClose, onReload }) {
  const [tab, setTab] = useState("info");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/portal/admin/cases/${caseItem.id}/messages`);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    }
  }, [caseItem.id]);

  useEffect(() => {
    if (tab === "messages") loadMessages();
  }, [tab, loadMessages]);

  /** 상태 변경 — 곧바로 PATCH */
  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/portal/admin/cases/${caseItem.id}`, { status: newStatus });
      showToast("상태가 변경되었습니다");
      onReload();
    } catch (err) {
      showToast("상태 변경 실패: " + err.message);
    }
  };

  /** 변호사 메시지 전송 */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post(`/portal/admin/cases/${caseItem.id}/messages`, { content: newMessage });
      setNewMessage("");
      loadMessages();
    } catch (err) {
      showToast("전송 실패: " + err.message);
    }
  };

  const tabBtnStyle = (active) => ({
    padding: "10px 18px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? COLORS.accent : COLORS.textSecondary,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div style={{ marginBottom: 32, padding: 24, background: COLORS.bgForm, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            {caseItem.title}
            {caseItem.caseNumber && (
              <span style={{ fontSize: 12, marginLeft: 10, color: COLORS.textSecondary, fontFamily: "monospace" }}>
                {caseItem.caseNumber}
              </span>
            )}
          </h3>
          <StatusBadge status={caseItem.status} />
        </div>
        <button onClick={onClose} style={btnStyle(COLORS.muted)}>닫기</button>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
        <button onClick={() => setTab("info")} style={tabBtnStyle(tab === "info")}>기본 정보</button>
        <button onClick={() => setTab("records")} style={tabBtnStyle(tab === "records")}>사건 기록</button>
        <button onClick={() => setTab("messages")} style={tabBtnStyle(tab === "messages")}>메시지</button>
      </div>

      {tab === "info" && (
        <div>
          {/* 사건 메타 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ marginBottom: 20 }}>
            {[
              { label: "재판부", value: caseItem.court },
              { label: "사건유형", value: caseItem.caseType },
              { label: "제소일", value: caseItem.filedAt },
              { label: "원고", value: caseItem.plaintiff },
              { label: "피고", value: caseItem.defendant },
              { label: "담당 변호사", value: caseItem.lawyerName },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{row.label}</div>
                <div style={{ fontSize: 13, color: COLORS.text }}>{row.value || "—"}</div>
              </div>
            ))}
          </div>

          {/* 상태 변경 */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>상태 변경</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(s.value)}
                  style={{
                    padding: "6px 16px", fontSize: 12, borderRadius: 4, cursor: "pointer",
                    border: `1px solid ${caseItem.status === s.value ? s.color : "#ddd"}`,
                    background: caseItem.status === s.value ? s.bg : "#fff",
                    color: s.color, fontWeight: caseItem.status === s.value ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {caseItem.description && (
            <div>
              <label style={labelStyle}>사건 개요</label>
              <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {caseItem.description}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "records" && <CaseRecordsPanel caseFileId={caseItem.id} />}

      {tab === "messages" && (
        <div>
          <div style={{ maxHeight: 360, overflowY: "auto", marginBottom: 12, padding: 12, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
            {messages.length === 0 ? (
              <p style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", padding: 20 }}>메시지가 없습니다</p>
            ) : (
              messages.map((m, i) => <MessageBubble key={m.id || i} message={m} />)
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...fieldStyle, flex: 1 }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="의뢰인에게 보낼 메시지..."
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <button onClick={sendMessage} style={btnStyle(COLORS.accent)}>전송</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCases() {
  // 백엔드 사건관리 엔드포인트는 /api/portal/admin/cases.
  // /api/cases 는 마케팅용 "성공사례" 라서 다른 테이블이다 (혼동 주의).
  const crud = useCrudForm("/portal/admin/cases", EMPTY_FORM, {
    paginated: true,
    pageSize: 20,
    validate: (form) => {
      if (!form.title.trim()) return "사건명을 입력해주세요";
      if (!form.clientId) return "의뢰인을 선택해주세요";
      return null;
    },
  });

  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [detailCase, setDetailCase] = useState(null);

  useEffect(() => {
    api.get("/clients").then((j) => setClients(j.data ?? [])).catch(() => {});
    api.get("/lawyers").then((j) => setLawyers(j.data ?? [])).catch(() => {});
  }, []);

  /** 사건 상세 열기 (편집 패널 닫기) */
  const openDetail = useCallback((c) => {
    crud.cancelEdit();
    setDetailCase(c);
  }, [crud]);

  const openEditCase = (c) => {
    setDetailCase(null);
    crud.openEdit(c);
  };

  const openNewCase = () => {
    setDetailCase(null);
    crud.openNew();
  };

  const clientOptions = [{ value: "", label: "선택해주세요" }, ...clients.map((c) => ({ value: c.id, label: c.name }))];
  const lawyerOptions = [{ value: "", label: "선택해주세요" }, ...lawyers.map((l) => ({ value: l.id, label: l.name }))];

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader title="사건 관리" onAdd={openNewCase} addLabel="+ 사건 등록" />

      {/* 편집 폼 */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="사건" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <FormField label="사건명" required value={crud.form.title} onChange={(v) => crud.setField("title", v)} placeholder="예: 손해배상 청구의 소" />
            <FormField label="상태" type="select" value={crud.form.status} onChange={(v) => crud.setField("status", v)} options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
            <FormField label="의뢰인" required type="select" value={crud.form.clientId} onChange={(v) => crud.setField("clientId", v)} options={clientOptions} />
            <FormField label="담당 변호사" type="select" value={crud.form.lawyerId} onChange={(v) => crud.setField("lawyerId", v)} options={lawyerOptions} />
          </div>

          {/* 전자소송 메타데이터 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
            <FormField label="사건번호" value={crud.form.caseNumber} onChange={(v) => crud.setField("caseNumber", v)} placeholder="예: 2024가합12345" />
            <FormField label="재판부/관할법원" value={crud.form.court} onChange={(v) => crud.setField("court", v)} placeholder="예: 서울중앙지법 제1민사부" />
            <FormField label="사건유형" type="select" value={crud.form.caseType} onChange={(v) => crud.setField("caseType", v)} options={CASE_TYPE_OPTIONS} />
            <FormField label="원고" value={crud.form.plaintiff} onChange={(v) => crud.setField("plaintiff", v)} placeholder="원고 표시" />
            <FormField label="피고" value={crud.form.defendant} onChange={(v) => crud.setField("defendant", v)} placeholder="피고 표시" />
            <FormField label="제소일" type="date" value={crud.form.filedAt || ""} onChange={(v) => crud.setField("filedAt", v)} />
          </div>

          <FormField label="사건 개요" type="textarea" value={crud.form.description} onChange={(v) => crud.setField("description", v)} placeholder="사건 경위/쟁점 등" />
        </EditPanel>
      )}

      {/* 상세 패널 */}
      {detailCase && (
        <CaseDetailPanel
          caseItem={detailCase}
          onClose={() => setDetailCase(null)}
          onReload={() => {
            crud.load();
            // 상태 표시 즉시 갱신을 위해 메모리 객체도 재조회
            api.get(`/portal/admin/cases/${detailCase.id}`)
              .then((res) => setDetailCase(res.data))
              .catch(() => {});
          }}
        />
      )}

      {/* 목록 */}
      {crud.loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="&#x2696;&#xFE0F;" message="등록된 사건이 없습니다" />
      ) : (
        <div className="space-y-3">
          {crud.items.map((c) => (
            <CaseRow key={c.id} caseItem={c} onDetail={openDetail} onEdit={openEditCase} onRemove={crud.remove} />
          ))}
        </div>
      )}
    </div>
  );
}
