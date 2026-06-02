/** 사이트 설정 로드/수정/저장 로직 커스텀 훅 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { DEFAULT_SETTINGS, deepClone } from "./constants";
import { showToast } from "../../../utils/showToast";
import { TOAST_DURATION_MS } from "../../../utils/timing";

export default function useSiteSettings() {
  const [settings, setSettings] = useState(() => deepClone(DEFAULT_SETTINGS));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  /* ─── 초기 로드 ─── */
  useEffect(() => {
    api.get("/site-settings")
      .then((json) => {
        const rows = json.data ?? [];
        const merged = deepClone(DEFAULT_SETTINGS);
        rows.forEach((row) => {
          const key = row.key || (row.page && row.section ? `${row.page}/${row.section}` : "");
          if (merged[key] !== undefined) {
            const parsed = typeof row.content === "string" ? safeParse(row.content) : row.content;
            if (parsed && typeof parsed === "object") {
              merged[key] = { ...merged[key], ...parsed };
            }
          }
        });
        setSettings(merged);
      })
      .catch(() => { /* API 없으면 기본값 사용 */ })
      .finally(() => setLoading(false));
  }, []);

  /* ─── 업데이트 헬퍼 ─── */
  const update = useCallback((sectionKey, field, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      if (field) { next[sectionKey][field] = value; } else { next[sectionKey] = value; }
      return next;
    });
    setDirty(true);
  }, []);

  const updateItem = useCallback((sectionKey, idx, field, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      // field === null → 문자열 배열 (home/cta items 등)
      if (field === null) {
        next[sectionKey].items[idx] = value;
      } else {
        next[sectionKey].items[idx][field] = value;
      }
      return next;
    });
    setDirty(true);
  }, []);

  const addItem = useCallback((sectionKey, template) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next[sectionKey].items.push(template);
      return next;
    });
    setDirty(true);
  }, []);

  const removeItem = useCallback((sectionKey, idx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next[sectionKey].items.splice(idx, 1);
      return next;
    });
    setDirty(true);
  }, []);

  const updateDetail = useCallback((idx, detailIdx, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details[detailIdx] = value;
      return next;
    });
    setDirty(true);
  }, []);

  const addDetail = useCallback((idx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details.push("");
      return next;
    });
    setDirty(true);
  }, []);

  const removeDetail = useCallback((idx, detailIdx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details.splice(detailIdx, 1);
      return next;
    });
    setDirty(true);
  }, []);

  /* ─── 저장 / 취소 ─── */
  const save = async () => {
    setSaving(true);
    try {
      await api.post("/site-settings/bulk", { settings: toBulkItems(settings) });
      setDirty(false);
      setToast("저장되었습니다");
      setTimeout(() => setToast(""), TOAST_DURATION_MS);
    } catch (err) {
      showToast("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setSettings(deepClone(DEFAULT_SETTINGS));
    setDirty(false);
  };

  return {
    settings, dirty, saving, loading, toast, setToast,
    update, updateItem, addItem, removeItem,
    updateDetail, addDetail, removeDetail,
    save, cancel,
  };
}

function safeParse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function toBulkItems(settings) {
  return Object.entries(settings).map(([key, content]) => {
    const [page, ...sectionParts] = key.split("/");
    return { page, section: sectionParts.join("/"), content };
  }).filter((item) => item.page && item.section);
}
