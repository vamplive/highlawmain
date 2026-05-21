/**
 * useCrudForm 커스텀 훅 단위 테스트
 * - 초기 상태, 폼 열기/닫기, 필드 수정, 검색, 에러 상태 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useCrudForm from "../../hooks/useCrudForm.js";

// api 모듈을 모킹
vi.mock("../../utils/api.js", () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [{ id: "1", title: "Test" }], meta: { total: 1, totalPages: 1 } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const emptyForm = { title: "", content: "" };
const endpoint = "/test-items";

describe("useCrudForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 상태: items 빈 배열, loading true", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    // 초기 로딩 시작 시 items는 빈 배열
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("로딩 완료 후 items가 채워진다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("1");
  });

  it("openNew: editing이 'new'로 설정된다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openNew();
    });

    expect(result.current.editing).toBe("new");
    expect(result.current.isNew).toBe(true);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.form).toEqual(emptyForm);
  });

  it("openNew: 초기값 오버라이드를 지원한다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openNew({ title: "새 문서" });
    });

    expect(result.current.form.title).toBe("새 문서");
    expect(result.current.form.content).toBe("");
  });

  it("openEdit: 항목 데이터로 폼을 채운다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openEdit({ id: "item-1", title: "기존 제목", content: "기존 내용" });
    });

    expect(result.current.editing).toBe("item-1");
    expect(result.current.isNew).toBe(false);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.title).toBe("기존 제목");
    expect(result.current.form.content).toBe("기존 내용");
  });

  it("openEdit: mapToForm 옵션이 있으면 변환 함수를 사용한다", async () => {
    const mapToForm = (item) => ({
      title: item.title.toUpperCase(),
      content: item.content,
    });

    const { result } = renderHook(() =>
      useCrudForm(endpoint, emptyForm, { mapToForm })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openEdit({ id: "item-1", title: "hello", content: "world" });
    });

    expect(result.current.form.title).toBe("HELLO");
  });

  it("setField: 개별 필드를 업데이트한다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openNew();
    });

    act(() => {
      result.current.setField("title", "새 제목");
    });

    expect(result.current.form.title).toBe("새 제목");
    expect(result.current.form.content).toBe("");
  });

  it("cancelEdit: editing을 null로 초기화한다", async () => {
    const { result } = renderHook(() => useCrudForm(endpoint, emptyForm));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openNew();
    });
    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.cancelEdit();
    });

    expect(result.current.editing).toBeNull();
    expect(result.current.isEditing).toBe(false);
  });

  it("updateSearch: 검색어를 설정하고 페이지를 1로 리셋한다", async () => {
    const { result } = renderHook(() =>
      useCrudForm(endpoint, emptyForm, { paginated: true })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(3);
    });

    act(() => {
      result.current.updateSearch("검색어");
    });

    expect(result.current.search).toBe("검색어");
    expect(result.current.page).toBe(1);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("API 실패 시 error 상태가 설정되고 자동 해제된다", async () => {
    const { api } = await import("../../utils/api.js");
    api.get.mockRejectedValueOnce(new Error("네트워크 오류"));

    const { result } = renderHook(() => useCrudForm("/failing-endpoint", emptyForm));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain("목록 조회 실패");
    expect(result.current.items).toEqual([]);
  });
});
