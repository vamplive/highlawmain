/**
 * CRUD 폼 상태 관리 커스텀 훅
 * — Admin 페이지에서 반복되는 생성/수정/삭제/목록 로직을 통합
 *
 * @param {string} endpoint - API 경로 (예: "/lawyers")
 * @param {object} emptyForm - 빈 폼 초기값
 * @param {object} options - 추가 옵션
 * @param {function} options.mapToForm - DB 레코드 → 폼 값 변환 함수
 * @param {function} options.validate - 저장 전 유효성 검사 (에러 메시지 반환, 없으면 null)
 * @param {string} options.queryParams - 목록 조회 시 추가 쿼리 파라미터 (예: "?all=true")
 * @param {boolean} options.paginated - 페이지네이션 사용 여부
 * @param {number} options.pageSize - 페이지당 항목 수
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../utils/api";

const DEFAULT_PAGE_SIZE = 20;
/** 에러 메시지 자동 해제 시간 (ms) */
const ERROR_DISMISS_MS = 5000;

export default function useCrudForm(endpoint, emptyForm, options = {}) {
  const {
    mapToForm,
    validate,
    queryParams = "",
    paginated = false,
    pageSize = DEFAULT_PAGE_SIZE,
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const errorTimer = useRef(null);

  /** 에러 설정 (일정 시간 후 자동 해제) */
  const setErrorWithDismiss = useCallback((msg) => {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), ERROR_DISMISS_MS);
  }, []);

  /** 에러 수동 해제 */
  const clearError = useCallback(() => {
    setError(null);
    if (errorTimer.current) clearTimeout(errorTimer.current);
  }, []);

  /** 목록 조회 */
  const load = useCallback(() => {
    setLoading(true);

    let url = endpoint;
    const params = new URLSearchParams();

    if (paginated) {
      params.set("page", page);
      params.set("limit", pageSize);
    }
    if (search) params.set("q", search);

    const paramStr = params.toString();
    const separator = queryParams ? "&" : "?";
    if (queryParams && paramStr) {
      url += queryParams + separator + paramStr;
    } else if (queryParams) {
      url += queryParams;
    } else if (paramStr) {
      url += "?" + paramStr;
    }

    api.get(url)
      .then((json) => {
        setItems(json.data ?? []);
        if (json.meta) setMeta(json.meta);
      })
      .catch((err) => {
        setItems([]);
        setErrorWithDismiss("목록 조회 실패: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [endpoint, page, search, queryParams, paginated, pageSize, setErrorWithDismiss]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, [load]);

  /** 새 항목 생성 모드 */
  const openNew = (overrides = {}) => {
    clearError();
    setEditing("new");
    setForm({ ...emptyForm, ...overrides });
  };

  /** 기존 항목 수정 모드 */
  const openEdit = (item) => {
    clearError();
    setEditing(item.id);
    if (mapToForm) {
      setForm(mapToForm(item));
    } else {
      const mapped = {};
      for (const key of Object.keys(emptyForm)) {
        mapped[key] = item[key] ?? emptyForm[key];
      }
      setForm(mapped);
    }
  };

  /** 저장 (생성 또는 수정) */
  const save = async () => {
    if (validate) {
      const errMsg = validate(form);
      if (errMsg) { setErrorWithDismiss(errMsg); return; }
    }
    try {
      if (editing === "new") {
        await api.post(endpoint, form);
      } else {
        await api.patch(`${endpoint}/${editing}`, form);
      }
      setEditing(null);
      clearError();
      load();
    } catch (err) {
      setErrorWithDismiss("저장 실패: " + err.message);
    }
  };

  /** 삭제 */
  const remove = async (id, confirmMsg = "정말 삭제하시겠습니까?") => {
    if (!confirm(confirmMsg)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      clearError();
      load();
    } catch (err) {
      setErrorWithDismiss("삭제 실패: " + err.message);
    }
  };

  /** 부분 업데이트 (토글 등) */
  const patchItem = async (id, data) => {
    try {
      await api.patch(`${endpoint}/${id}`, data);
      clearError();
      load();
    } catch (err) {
      setErrorWithDismiss("변경 실패: " + err.message);
    }
  };

  /** 편집 취소 */
  const cancelEdit = () => { setEditing(null); clearError(); };

  /** 폼 필드 변경 헬퍼 */
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  /** 검색 + 페이지 리셋 */
  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  return {
    // 데이터
    items, loading, meta,
    // 에러 상태
    error, clearError,
    // 폼 상태
    editing, form, setForm, setField,
    // 페이지네이션
    page, setPage, search, updateSearch,
    // 액션
    openNew, openEdit, save, remove, cancelEdit, patchItem, load,
    // 파생값
    isNew: editing === "new",
    isEditing: editing !== null,
    totalPages: meta.totalPages || 0,
  };
}
