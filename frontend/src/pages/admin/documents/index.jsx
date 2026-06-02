/**
 * AdminDocuments — 문서 CRUD 관리 페이지
 * 공유 인프라(useCrudForm, admin 컴포넌트, 공통 스타일)를 활용한 리팩토링 버전
 * + 다중 선택 → 일괄 수정/삭제 지원
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import useCrudForm from "../../../hooks/useCrudForm";
import { PageHeader, EmptyState, Pagination, COLORS, btnStyle, outlineBtnStyle } from "../../../components/admin";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import { ALL_DOCUMENT_TYPES, getTypeLabel } from "../../../utils/document-types";
import DocumentFilters from "./DocumentFilters";
import DocumentTable, { DocumentRow } from "./DocumentTable";
import DocumentFormModal, {
  DeleteConfirmModal, BulkEditModal, BulkDeleteConfirmModal,
} from "./DocumentFormModal";

/* ── 도메인 상수 ── */
const EMPTY_FORM = {
  title: "", documentType: "note", subtitle: "", author: "",
  source: "", publishedDate: "", contentMarkdown: "",
  summary: "", status: "inbox", importance: 3,
  categoryIds: [],
};

const TYPE_OPTIONS = ALL_DOCUMENT_TYPES.map((t) => ({ value: t, label: getTypeLabel(t) }));

/**
 * DB 레코드를 폼 객체로 변환
 * — useCrudForm의 mapToForm 옵션에 전달
 */
function mapDocToForm(doc) {
  return {
    title: doc.title || "",
    documentType: doc.documentType || "note",
    subtitle: doc.subtitle || "",
    author: typeof doc.author === "string"
      ? doc.author
      : Array.isArray(doc.author) ? doc.author.join(", ") : "",
    source: doc.source || "",
    publishedDate: doc.publishedDate ? doc.publishedDate.split("T")[0] : "",
    contentMarkdown: doc.contentMarkdown || "",
    summary: doc.summary || "",
    status: doc.status || "inbox",
    importance: doc.importance || 3,
    categoryIds: (doc.categories || [])
      .map((c) => (typeof c === "object" ? c.id : c))
      .filter(Boolean),
  };
}

/* ── 메인 컴포넌트 ── */
export default function AdminDocuments() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const buildQueryParams = useCallback(() => {
    const parts = [];
    if (typeFilter) parts.push(`document_type=${typeFilter}`);
    if (statusFilter) parts.push(`status=${statusFilter}`);
    return parts.length > 0 ? "?" + parts.join("&") : "";
  }, [typeFilter, statusFilter]);

  const crud = useCrudForm("/documents", EMPTY_FORM, {
    paginated: true,
    pageSize: 20,
    queryParams: buildQueryParams(),
    mapToForm: mapDocToForm,
    validate: (form) => !form.title.trim() ? "제목을 입력해주세요" : null,
  });

  const [allCategories, setAllCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 다중 선택 상태 — 현재 페이지 기준 doc.id 집합
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  /* 필터 변경 시 페이지 리셋 + 선택 해제 */
  /* eslint-disable react-hooks/exhaustive-deps */
  // crud는 매 렌더마다 새 객체 — deps에 넣으면 무한 루프
  useEffect(() => {
    crud.setPage(1);
    setSelectedIds(new Set());
  }, [typeFilter, statusFilter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // 검색어가 바뀌어도 선택 무효화
  useEffect(() => { setSelectedIds(new Set()); }, [crud.search]);

  /* 카테고리 목록 초기 로드 */
  useEffect(() => {
    api.get("/categories")
      .then((json) => setAllCategories(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
  }, []);

  /** 저장 — importance 등 형변환 후 useCrudForm.save 사용 */
  const handleSave = async () => {
    setSaving(true);
    try {
      crud.setForm((prev) => ({
        ...prev,
        importance: Number(prev.importance),
        author: prev.author || undefined,
        publishedDate: prev.publishedDate || undefined,
      }));
      await crud.save();
    } finally {
      setSaving(false);
    }
  };

  /** 삭제 확인 후 실행 */
  const handleDelete = async (id) => {
    try {
      await api.del(`/documents/${id}`);
      setDeleteId(null);
      crud.load();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  /** 파일 업로드로 본문 추출 */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload("/documents/upload", file);
      if (result.content || result.contentMarkdown) {
        crud.setField("contentMarkdown", result.content || result.contentMarkdown);
      }
      if (result.title) crud.setField("title", result.title);
      if (result.author) crud.setField("author", result.author);
    } catch (err) {
      showToast("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearchChange = (value) => {
    crud.updateSearch(value);
  };

  /* ── 다중 선택 헬퍼 ── */
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pageIds = useMemo(() => crud.items.map((d) => d.id), [crud.items]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const everySelected = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (everySelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [pageIds]);

  const clearSelection = () => setSelectedIds(new Set());

  // 일괄 작업 대상 — 현재 페이지 기준으로 모달 미리보기에 사용 (다른 페이지 선택은 ID만 유지)
  const selectedDocs = useMemo(
    () => crud.items.filter((d) => selectedIds.has(d.id)),
    [crud.items, selectedIds],
  );
  const selectedCount = selectedIds.size;

  /** 일괄 수정 적용 */
  const handleBulkUpdate = async ({ patch, addCategoryIds, removeCategoryIds }) => {
    if (selectedCount === 0) return;
    setBulkBusy(true);
    try {
      const res = await api.post("/documents/bulk/update", {
        ids: Array.from(selectedIds),
        patch, addCategoryIds, removeCategoryIds,
      });
      const updated = res?.data?.updated ?? selectedCount;
      showToast(`${updated}건이 일괄 수정되었습니다.`);
      setBulkEditOpen(false);
      clearSelection();
      crud.load();
    } catch (err) {
      showToast("일괄 수정 실패: " + err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  /** 일괄 삭제 적용 */
  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    setBulkBusy(true);
    try {
      const res = await api.post("/documents/bulk/delete", {
        ids: Array.from(selectedIds),
      });
      const { archived = 0, deleted = 0 } = res?.data || {};
      showToast(`보관 ${archived}건 / 영구 삭제 ${deleted}건 처리되었습니다.`);
      setBulkDeleteOpen(false);
      clearSelection();
      crud.load();
    } catch (err) {
      showToast("일괄 삭제 실패: " + err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="문서 관리"
        subtitle={`페이지 ${crud.page}/${crud.totalPages || 1}`}
        onAdd={() => crud.openNew()}
        addLabel="+ 새 문서 등록"
      />

      <DocumentFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={crud.search}
        setSearchQuery={handleSearchChange}
      />

      {/* ── 다중 선택 액션 바 ── */}
      {selectedCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", marginBottom: 12, borderRadius: 6,
          background: "#eef4fb", border: `1px solid ${COLORS.primary}`,
        }}>
          <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
            {selectedCount}건 선택됨
          </span>
          <div className="flex gap-2">
            <button onClick={clearSelection} style={outlineBtnStyle()}>선택 해제</button>
            <button onClick={() => setBulkEditOpen(true)} style={btnStyle()}>일괄 수정</button>
            <button onClick={() => setBulkDeleteOpen(true)} style={outlineBtnStyle(COLORS.danger)}>
              일괄 삭제
            </button>
          </div>
        </div>
      )}

      {crud.isEditing && (
        <DocumentFormModal
          isNew={crud.isNew}
          form={crud.form}
          setField={crud.setField}
          allCategories={allCategories}
          onSave={handleSave}
          onCancel={crud.cancelEdit}
          onFileUpload={handleFileUpload}
          uploading={uploading}
          saving={saving}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {bulkEditOpen && (
        <BulkEditModal
          count={selectedCount}
          allCategories={allCategories}
          allTypeOptions={TYPE_OPTIONS}
          onApply={handleBulkUpdate}
          onCancel={() => setBulkEditOpen(false)}
          busy={bulkBusy}
        />
      )}

      {bulkDeleteOpen && (
        <BulkDeleteConfirmModal
          docs={selectedDocs}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
          busy={bulkBusy}
        />
      )}

      {crud.loading ? (
        <p style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>문서 목록 조회 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="📄" message="검색 결과가 없습니다" />
      ) : (
        <DocumentTable
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleSelectAll={toggleSelectAll}
        >
          {crud.items.map((doc, i) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              index={i}
              selected={selectedIds.has(doc.id)}
              onToggleSelect={toggleSelect}
              onEdit={() => crud.openEdit(doc)}
              onDelete={() => setDeleteId(doc.id)}
            />
          ))}
        </DocumentTable>
      )}

      <Pagination
        page={crud.page}
        totalPages={crud.totalPages}
        onPageChange={crud.setPage}
      />
    </div>
  );
}
