/**
 * useSiteSettings — 사이트 설정 API에서 페이지별 설정을 로드하는 훅
 * - 모듈 레벨 캐시로 중복 API 호출 방지
 * - 실시간 미리보기 지원 (postMessage)
 * - 다국어 지원 (ko/en)
 */
import { useState, useEffect } from "react";
import { api } from "../utils/api";

/** @type {Map<string, Record<string, unknown>>} 페이지별 설정 캐시 */
const cache = new Map();

/** 현재 미리보기 모드 여부 */
const isPreviewMode = () => {
  try { return window.location.search.includes("preview=1"); } catch { return false; }
};

/**
 * localStorage에서 현재 언어 읽기
 * @returns {"ko"|"en"}
 */
export function getLanguage() {
  try { return localStorage.getItem("lang") || "ko"; } catch { return "ko"; }
}

/**
 * 언어 설정을 변경하고 이벤트를 발생시킨다
 * @param {"ko"|"en"} lang
 */
export function setLanguage(lang) {
  localStorage.setItem("lang", lang);
  window.dispatchEvent(new Event("languagechange"));
}

/**
 * 현재 언어를 반환하는 훅 (변경 시 리렌더링)
 * @returns {"ko"|"en"}
 */
export function useLanguage() {
  const [lang, setLang] = useState(getLanguage);

  useEffect(() => {
    const handler = () => setLang(getLanguage());
    const storageHandler = (e) => { if (e.key === "lang") handler(); };
    window.addEventListener("languagechange", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("languagechange", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return lang;
}

/**
 * 페이지별 사이트 설정을 로드하는 훅
 *
 * @param {string} page - 페이지 식별자
 * @param {Record<string, unknown>} defaults - 섹션별 기본값
 * @param {string} [language="ko"] - 언어 코드 (en이면 _en 섹션도 병합)
 * @returns {{ settings: Record<string, unknown>, loading: boolean }}
 */
export function useSiteSettingsPage(page, defaults, language = "ko") {
  const cacheKey = `${page}_${language}`;

  const [settings, setSettings] = useState(() => {
    if (cache.has(cacheKey)) return mergeWithDefaults(cache.get(cacheKey), defaults);
    return defaults;
  });
  const [loading, setLoading] = useState(() => !cache.has(cacheKey));

  // API에서 설정 로드
  useEffect(() => {
    if (cache.has(cacheKey)) return;

    let cancelled = false;

    async function fetchSettings() {
      try {
        const res = await api.get(`/site-settings?page=${page}`);
        const rows = res.data || [];

        const bySection = {};
        for (const row of rows) {
          bySection[row.section] = row.content;
        }

        // 영어 설정이면 _en 섹션으로 오버라이드
        if (language === "en") {
          for (const key of Object.keys(defaults)) {
            if (bySection[`${key}_en`]) {
              bySection[key] = { ...(bySection[key] || {}), ...bySection[`${key}_en`] };
            }
          }
        }

        cache.set(cacheKey, bySection);

        if (!cancelled) {
          setSettings(mergeWithDefaults(bySection, defaults));
        }
      } catch {
        // API 실패 시 defaults 유지
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSettings();
    return () => { cancelled = true; };
    // cacheKey는 [page, language]에서 파생되고, defaults는 호출자가 모듈 상수로 전달하는 것이 계약
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, language]);

  // 실시간 미리보기: postMessage 리스너
  useEffect(() => {
    if (!isPreviewMode()) return;

    function handleMessage(event) {
      // 같은 출처의 메시지만 허용하여 외부 조작 방지
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "preview-settings" && event.data.page === page) {
        setSettings(mergeWithDefaults(event.data.settings, defaults));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // defaults는 모듈 상수 계약 — deps에 넣으면 매 렌더마다 리스너 재설치
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { settings, loading };
}

/**
 * API 응답을 defaults와 병합
 */
function mergeWithDefaults(apiData, defaults) {
  const merged = {};
  for (const key of Object.keys(defaults)) {
    merged[key] = apiData[key] !== undefined ? apiData[key] : defaults[key];
  }
  return merged;
}
