/**
 * AI 모델 선택 — localStorage 기반 사용자 마지막 선택값 보관 + 백엔드 ai-config 캐시.
 *
 * 운영자가 AI 패널에서 모델을 한 번 고르면 같은 단말의 같은 종류 작업에서는 같은 모델이
 * 다음에도 기본 선택되도록 한다. 백엔드 기본값(.env) 은 ai-config 로 미리 받아 두고,
 * 사용자가 따로 고른 게 없을 때 그 기본값을 사용.
 */
const PROMPT_MODEL_KEY = "yj-editor-blog-prompt-model";
const IMAGE_MODEL_KEY = "yj-editor-blog-image-model";

let configCache = null;
let configPromise = null;

/**
 * 백엔드의 ai-config 를 한 번만 로드 — 같은 페이지 라이프타임 동안 캐시.
 * @returns {Promise<{ prompt: { defaultModel, allowedModels, keyConfigured }, image: {...} }|null>}
 */
export async function loadAiConfig() {
  if (configCache) return configCache;
  if (configPromise) return configPromise;
  configPromise = (async () => {
    try {
      const res = await fetch("/api/media/ai-config", { credentials: "include" });
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

function readLocalStorage(key) {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeLocalStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(key, value); } catch { /* quota */ }
}

const PROMPT_AI_CONFIG_KEY = "yj-editor-prompt-ai-config-id";
const IMAGE_AI_CONFIG_KEY = "yj-editor-image-ai-config-id";

export function getStoredPromptModel() { return readLocalStorage(PROMPT_MODEL_KEY); }
export function setStoredPromptModel(model) { writeLocalStorage(PROMPT_MODEL_KEY, model); }
export function getStoredImageModel() { return readLocalStorage(IMAGE_MODEL_KEY); }
export function setStoredImageModel(model) { writeLocalStorage(IMAGE_MODEL_KEY, model); }
export function getStoredPromptAiConfigId() { return readLocalStorage(PROMPT_AI_CONFIG_KEY); }
export function setStoredPromptAiConfigId(id) { writeLocalStorage(PROMPT_AI_CONFIG_KEY, id); }
export function getStoredImageAiConfigId() { return readLocalStorage(IMAGE_AI_CONFIG_KEY); }
export function setStoredImageAiConfigId(id) { writeLocalStorage(IMAGE_AI_CONFIG_KEY, id); }

/** 사용자에게 보여줄 모델 라벨 — 기술명 그대로보다 친근하게. */
export const PROMPT_MODEL_LABELS = {
  "claude-haiku-4-5": "Claude Haiku 4.5 (빠름·저렴)",
  "claude-sonnet-4-6": "Claude Sonnet 4.6 (균형)",
  "claude-opus-4-7": "Claude Opus 4.7 (최고 품질·느림)",
};

export const IMAGE_MODEL_LABELS = {
  "dall-e-3": "DALL-E 3 (권장·1792×1024)",
  "dall-e-2": "DALL-E 2 (저렴·1024만)",
  "gpt-image-1": "GPT Image 1 (최신)",
};
