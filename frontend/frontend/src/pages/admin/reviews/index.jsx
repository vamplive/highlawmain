/** 관리자 후기 관리 — 리뷰 CRUD, 승인/거절, 별점 관리 */
import useCrudForm from "../../../hooks/useCrudForm";
import { PageHeader, EditPanel, FormField, EmptyState, ErrorBanner, COLORS, outlineBtnStyle } from "../../../components/admin";
import { formatDate } from "../../../utils/formatters";

const CATEGORIES = [
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
];

const EMPTY_FORM = {
  clientName: "", rating: 5, content: "", category: "civil",
  isAnonymous: 0, isPublished: 0,
};

/** 카테고리 값 → 한글 라벨 변환 */
function categoryLabel(val) {
  const found = CATEGORIES.find((c) => c.value === val);
  return found ? found.label : val;
}

/** 클릭 가능한 별점 입력 */
function StarInput({ value, onChange }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          style={{ fontSize: 22, cursor: "pointer", color: i <= value ? COLORS.accent : "#ddd", lineHeight: 1 }}
        >
          {i <= value ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

/** 읽기전용 별점 표시 */
function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 14, color: i <= rating ? COLORS.accent : "#ddd" }}>
          {i <= rating ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const crud = useCrudForm("/reviews", EMPTY_FORM, {
    queryParams: "?all=true",
    validate: (form) => {
      if (!form.content.trim()) return "내용을 입력해주세요";
      if (!form.isAnonymous && !form.clientName.trim()) return "이름을 입력하거나 익명을 선택해주세요";
      return null;
    },
  });

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader title="후기 관리" onAdd={crud.openNew} addLabel="+ 후기 등록" />

      {/* ==================== 편집 폼 ==================== */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="후기" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <FormField
              label="의뢰인 이름"
              value={crud.form.clientName}
              onChange={(v) => crud.setField("clientName", v)}
              placeholder="홍길동"
              disabled={crud.form.isAnonymous}
            />
            <FormField
              label="카테고리"
              type="select"
              value={crud.form.category}
              onChange={(v) => crud.setField("category", v)}
              options={CATEGORIES}
            />
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" }}>
                별점
              </label>
              <StarInput value={crud.form.rating} onChange={(r) => crud.setField("rating", r)} />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={crud.form.isAnonymous === 1}
                  onChange={(e) => crud.setField("isAnonymous", e.target.checked ? 1 : 0)}
                />
                익명
              </label>
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={crud.form.isPublished === 1}
                  onChange={(e) => crud.setField("isPublished", e.target.checked ? 1 : 0)}
                />
                게시
              </label>
            </div>
          </div>

          <FormField
            label="후기 내용"
            required
            type="textarea"
            value={crud.form.content}
            onChange={(v) => crud.setField("content", v)}
            placeholder="의뢰인 후기를 입력하세요"
            minHeight={100}
          />
        </EditPanel>
      )}

      {/* ==================== 후기 목록 ==================== */}
      {crud.loading ? (
        <p style={{ color: COLORS.textLight, fontSize: 14 }}>로딩 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="📝" message="등록된 후기가 없습니다" />
      ) : (
        <div className="space-y-3">
          {crud.items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onToggle={() => crud.patchItem(review.id, { isPublished: review.isPublished ? 0 : 1 })}
              onEdit={() => crud.openEdit(review)}
              onRemove={() => crud.remove(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 개별 후기 카드 */
function ReviewCard({ review, onToggle, onEdit, onRemove }) {
  const isPublished = review.isPublished;

  return (
    <div
      style={{
        padding: "16px 20px",
        background: isPublished ? COLORS.bgPage : COLORS.bgInactive,
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 6,
        opacity: isPublished ? 1 : 0.7,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
            {review.isAnonymous ? "익명" : review.clientName}
          </span>
          <Stars rating={review.rating} />
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 8,
            background: "rgba(26,58,107,0.1)", color: COLORS.accent,
          }}>
            {categoryLabel(review.category)}
          </span>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 8,
            background: isPublished ? "#e8f5e9" : "#fce4ec",
            color: isPublished ? "#2e7d32" : "#c62828",
          }}>
            {isPublished ? "게시중" : "미게시"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: COLORS.textLight }}>
          {formatDate(review.createdAt)}
        </span>
      </div>

      <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
        {review.content?.length > 120 ? review.content.slice(0, 120) + "..." : review.content}
      </p>

      <div className="flex gap-2">
        <button onClick={onToggle} style={outlineBtnStyle(isPublished ? "#c62828" : "#2e7d32")}>
          {isPublished ? "게시 중단" : "승인(게시)"}
        </button>
        <button onClick={onEdit} style={outlineBtnStyle()}>수정</button>
        <button onClick={onRemove} style={outlineBtnStyle("#c00")}>삭제</button>
      </div>
    </div>
  );
}
