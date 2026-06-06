/**
 * AI 모델 선택 — localStorage 기반 사용자 마지막 선택값 보관 + 백엔드 ai-config 캐시.
 *
 * 운영자가 AI 패널에서 모델을 한 번 고르면 같은 단말의 같은 종류 작업에서는 같은 모델이
 * 다음에도 기본 선택되도록 한다. 백엔드 기본값(.env) 은 ai-config 로 미리 받아 두고,
 * 사용자가 따로 고른 게 없을 때 그 기본값을 사용.
 *
 * 2026-06 추가: 구성원이 등록한 사용자 AI 설정(userAiConfigs) 지원.
 * 등록된 AI 중 선택한 configId 도 localStorage 에 유지한다.
 */
const PROMPT_MODEL_KEY = "yj-editor-blog-prompt-model";
const IMAGE_MODEL_KEY = "yj-editor-blog-image-model";
const PROMPT_AI_CONFIG_KEY = "yj-editor-blog-prompt-ai-config";
const IMAGE_AI_CONFIG_KEY = "yj-editor-blog-image-ai-config";

let configCache = null;
let configPromise = null;

/**
 * 백엔드의 ai-config 를 한 번만 로드 — 같은 페이지 라이프타임 동안 캐시.
 * @returns {Promise<{
 *   prompt: { defaultModel, allowedModels, keyConfigured },
 *   image: { defaultModel, allowedModels, keyConfigured },
 *   userAiConfigs: Array<{ id, provider, modelId, nickname, isDefaultPrompt, isDefaultImage }>
 * }|null>}
 */
export async function loadAiConfig() {
  if (configCache) return configCache;
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const token = localStorage.getItem("portal_token") || localStorage.getItem("admin_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/media/ai-config", { credentials: "include", headers });
      if (!res.ok) return null;
      const json = await res.json();
      configCache = json?.data || null;
      return configCache;
    } catch {
      return null;
    } finally {
      configPromise = null;
    }
  })();
  return configPromise;
}

/** 캐시를 강제로 리셋 (AI 설정 변경 후 호출) */
export function resetAiConfigCache() {
  configCache = null;
  configPromise = null;
}

function readLocalStorage(key) {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeLocalStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(key, value); } catch { /* quota */ }
}

// 서버 기본 모델 선택 유지
export function getStoredPromptModel() { return readLocalStorage(PROMPT_MODEL_KEY); }
export function setStoredPromptModel(model) { writeLocalStorage(PROMPT_MODEL_KEY, model); }
export function getStoredImageModel() { return readLocalStorage(IMAGE_MODEL_KEY); }
export function setStoredImageModel(model) { writeLocalStorage(IMAGE_MODEL_KEY, model); }

// 사용자 등록 AI config ID 선택 유지
export function getStoredPromptAiConfigId() { return readLocalStorage(PROMPT_AI_CONFIG_KEY); }
export function setStoredPromptAiConfigId(id) { writeLocalStorage(PROMPT_AI_CONFIG_KEY, id || ""); }
export function getStoredImageAiConfigId() { return readLocalStorage(IMAGE_AI_CONFIG_KEY); }
export function setStoredImageAiConfigId(id) { writeLocalStorage(IMAGE_AI_CONFIG_KEY, id || ""); }

/** 사용자에게 보여줄 모델 라벨 — 기술명 그대로보다 친근하게. */
export const PROMPT_MODEL_LABELS = {
  "claude-haiku-4-5": "Claude Haiku 4.5 (빠름·저렴)",
  "claude-sonnet-4-5": "Claude Sonnet 4.5 (균형·추천)",
  "claude-sonnet-4-6": "Claude Sonnet 4.6 (균형)",
  "claude-opus-4-5": "Claude Opus 4.5 (최고 품질·느림)",
  "claude-opus-4-7": "Claude Opus 4.7 (최고 품질·느림)",
  "gpt-4o": "GPT-4o (추천·균형)",
  "gpt-4o-mini": "GPT-4o mini (빠름·저렴)",
  "gpt-4-turbo": "GPT-4 Turbo (고품질)",
  "o1-mini": "o1-mini (추론 특화)",
  "gemini-2.5-pro": "Gemini 2.5 Pro (최고 품질)",
  "gemini-2.0-flash": "Gemini 2.0 Flash (빠름·저렴)",
  "gemini-1.5-pro": "Gemini 1.5 Pro (안정적)",
};

export const IMAGE_MODEL_LABELS = {
  "dall-e-3": "DALL-E 3 (권장·1792×1024)",
  "dall-e-2": "DALL-E 2 (저렴·1024만)",
  "gpt-image-1": "GPT Image 1 (최신)",
  "imagen-3": "Imagen 3 (Google·최신)",
};
