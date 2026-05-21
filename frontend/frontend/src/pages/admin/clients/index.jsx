/**
 * 관리자 고객 관리 — 고객 DB CRUD
 * - 상담 신청 시 자동 등록된 고객 + 직접 등록 고객
 * - 메시지 발송 시 수신자 목록으로 활용
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useCrudForm from "../../../hooks/useCrudForm";
import {
  PageHeader, EditPanel, FormField, EmptyState, Pagination, ErrorBanner, TagInput,
  COLORS, smallBtnStyle, badgeStyle, thStyle, tdStyle, fieldStyle, labelStyle,
} from "../../../components/admin";
import { formatDate, formatPhone, truncate } from "../../../utils/formatters";
import QuickSendDialog from "../messages/QuickSendDialog";

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** select 옵션 배열 */
const CATEGORY_OPTIONS = [
  { value: "", label: "미지정" },
  ...["civil", "criminal", "family", "admin", "tax", "realestate", "corporate", "other"]
    .map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
];

/** 고객 출처 라벨 + 배지 색상 */
const SOURCE_LABELS = { consultation: "상담 신청", referral: "소개", manual: "직접 등록", other: "기타" };
const SOURCE_COLORS = { consultation: "#3498db", referral: COLORS.success, manual: "#95a5a6", other: "#95a5a6" };

const EMPTY_FORM = { name: "", phone: "", email: "", category: "", memo: "", tags: [] };

export default function AdminClients() {
  // 태그 필터 (선택된 태그로 목록 필터링 — 서버 쿼리 파라미터로 전달)
  const [tagFilter, setTagFilter] = useState("");
  const crud = useCrudForm("/clients", EMPTY_FORM, {
    paginated: true,
    queryParams: tagFilter ? `?tag=${encodeURIComponent(tagFilter)}` : "",
    validate: (form) => {
      if (!form.name.trim()) return "이름을 입력해주세요";
      if (!form.phone.trim()) return "전화번호를 입력해주세요";
      return null;
    },
  });

  // 원클릭 발송 다이얼로그 대상 고객 (null이면 닫힘)
  const [quickSendTarget, setQuickSendTarget] = useState(null);

  /** 현재 목록에서 사용 중인 태그 집계 (추천용 + 필터 칩) */
  const allTags = useMemo(() => {
    const set = new Set();
    crud.items.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [crud.items]);

  /** 활성/비활성 토글 */
  const toggleActive = (client) => {
    crud.patchItem(client.id, { isActive: client.isActive ? 0 : 1 });
  };

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader
        title="고객 관리"
        subtitle={`총 ${crud.meta.total ?? 0}명 · 상담 신청 시 자동 등록됩니다`}
        onAdd={crud.openNew}
        addLabel="+ 고객 등록"
      />

      {/* 검색 + 태그 필터 */}
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          style={{ ...fieldStyle, maxWidth: 360 }}
          value={crud.search}
          onChange={(e) => crud.updateSearch(e.target.value)}
          placeholder="이름, 전화번호, 이메일 검색..."
        />
        {tagFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>태그 필터:</span>
            <span style={{ ...badgeStyle(COLORS.accent), display: "inline-flex", alignItems: "center", gap: 4 }}>
              #{tagFilter}
              <button
                type="button"
                onClick={() => setTagFilter("")}
                style={{ border: "none", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 14, padding: 0 }}
                aria-label="태그 필터 해제"
              >×</button>
            </span>
          </div>
        )}
        {!tagFilter && allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>태그:</span>
            {allTags.slice(0, 10).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTagFilter(t)}
                style={{ padding: "2px 8px", fontSize: 11, color: COLORS.textSecondary, background: "#fff", border: `1px dashed ${COLORS.border}`, borderRadius: 10, cursor: "pointer" }}
              >#{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* 편집 폼 */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="고객" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <FormField label="이름" value={crud.form.name} onChange={(v) => crud.setField("name", v)} required placeholder="홍길동" />
            <FormField label="전화번호" value={crud.form.phone} onChange={(v) => crud.setField("phone", v)} required placeholder="010-1234-5678" />
            <FormField label="이메일" value={crud.form.email} onChange={(v) => crud.setField("email", v)} placeholder="client@example.com" />
            <FormField label="상담 분야" value={crud.form.category} onChange={(v) => crud.setField("category", v)} type="select" options={CATEGORY_OPTIONS} />
          </div>
          <FormField label="메모" value={crud.form.memo} onChange={(v) => crud.setField("memo", v)} type="textarea" minHeight={60} placeholder="특이사항, 참고사항 등..." />
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>태그</label>
            <TagInput
              value={crud.form.tags || []}
              onChange={(next) => crud.setField("tags", next)}
              placeholder="예: VIP, 재방문, 소개"
              suggestions={allTags}
            />
          </div>
        </EditPanel>
      )}

      {/* 목록 */}
      {crud.loading ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.muted }}>불러오는 중...</div>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="👤" message="등록된 고객이 없습니다" />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
              <th style={thStyle}>이름</th>
              <th style={thStyle}>전화번호</th>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>분야</th>
              <th style={thStyle}>출처</th>
              <th style={thStyle}>등록일</th>
              <th style={{ ...thStyle, width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {crud.items.map((c) => (
              <ClientRow
                key={c.id}
                client={c}
                onEdit={() => crud.openEdit(c)}
                onQuickSend={() => setQuickSendTarget(c)}
                onToggleActive={() => toggleActive(c)}
                onRemove={() => crud.remove(c.id, "이 고객을 삭제하시겠습니까?")}
              />
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={crud.page} totalPages={crud.totalPages} onPageChange={crud.setPage} />

      {/* 원클릭 발송 다이얼로그 */}
      {quickSendTarget && (
        <QuickSendDialog
          client={quickSendTarget}
          onClose={() => setQuickSendTarget(null)}
        />
      )}
    </div>
  );
}

/** 고객 테이블 행 — 단일 항목 렌더링 */
function ClientRow({ client, onEdit, onQuickSend, onToggleActive, onRemove }) {
  const sourceColor = SOURCE_COLORS[client.source] || "#95a5a6";

  return (
    <tr style={{ borderBottom: "1px solid #f0f0f0", opacity: client.isActive ? 1 : 0.45 }}>
      <td style={{ ...tdStyle, fontWeight: 500 }}>
        {/* 이름 클릭 시 CRM 허브(고객 상세) 페이지로 이동 */}
        <Link to={`/admin/clients/${client.id}`}
          style={{ color: COLORS.text, textDecoration: "none", borderBottom: "1px dashed transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = COLORS.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
        >
          {client.name}
        </Link>
        {client.memo && (
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
            {truncate(client.memo, 30)}
          </div>
        )}
        {Array.isArray(client.tags) && client.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
            {client.tags.map((t) => (
              <span key={t} style={{ fontSize: 10, padding: "1px 6px", background: "#f0e9dd", color: COLORS.accent, borderRadius: 8 }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </td>
      <td data-label="전화번호" style={{ ...tdStyle, color: COLORS.textSecondary }}>{formatPhone(client.phone)}</td>
      <td data-label="이메일" style={{ ...tdStyle, color: COLORS.textSecondary }}>{client.email || "-"}</td>
      <td data-label="분야" style={tdStyle}>
        {client.category ? (
          <span style={{ fontSize: 12, color: "#666" }}>{CATEGORY_LABELS[client.category] || client.category}</span>
        ) : "-"}
      </td>
      <td data-label="출처" style={tdStyle}>
        <span style={badgeStyle(sourceColor)}>{SOURCE_LABELS[client.source] || client.source}</span>
      </td>
      <td data-label="등록일" style={{ ...tdStyle, color: COLORS.muted, fontSize: 12 }}>{formatDate(client.createdAt)}</td>
      <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
        <button
          onClick={onQuickSend}
          disabled={!client.phone && !client.email}
          style={{
            ...smallBtnStyle(COLORS.accent),
            opacity: (!client.phone && !client.email) ? 0.4 : 1,
          }}
          title="문자/이메일 보내기"
        >
          💬 발송
        </button>
        <button onClick={onEdit} style={smallBtnStyle(COLORS.textSecondary)}>수정</button>
        <button onClick={onToggleActive} style={smallBtnStyle(client.isActive ? COLORS.warning : COLORS.success)}>
          {client.isActive ? "비활성" : "활성"}
        </button>
        <button onClick={onRemove} style={smallBtnStyle(COLORS.danger)}>삭제</button>
      </td>
    </tr>
  );
}
