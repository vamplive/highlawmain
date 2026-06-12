/** 구성원별 AI 연동 설정 CRUD — /api/ai-configs */
const { Router } = require("express");
const crypto = require("crypto");
const { portalAuth } = require("../lib/auth");
const { encrypt, decrypt } = require("../lib/encryption");
const { sqlite } = require("../db");

const router = Router();
router.use(portalAuth);

// 지원 AI 공급사 및 모델 메타데이터
const PROVIDERS = {
  openai: {
    name: "OpenAI",
    description: "GPT-4o, DALL-E 3 등",
    keyPlaceholder: "sk-...",
    models: {
      prompt: [
        { id: "gpt-4o", label: "GPT-4o (최신·권장)", type: "prompt" },
        { id: "gpt-4o-mini", label: "GPT-4o mini (빠름·저렴)", type: "prompt" },
        { id: "gpt-4-turbo", label: "GPT-4 Turbo", type: "prompt" },
      ],
      image: [
        { id: "dall-e-3", label: "DALL-E 3 (권장·1792×1024)", type: "image" },
        { id: "dall-e-2", label: "DALL-E 2 (저렴·1024px)", type: "image" },
        { id: "gpt-image-1", label: "GPT Image 1 (최신)", type: "image" },
      ],
    },
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 4 Sonnet, Opus 등",
    keyPlaceholder: "sk-ant-...",
    models: {
      prompt: [
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (균형)", type: "prompt" },
        { id: "claude-opus-4-8", label: "Claude Opus 4.8 (최고 품질)", type: "prompt" },
        { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (빠름·저렴)", type: "prompt" },
      ],
      image: [],
    },
  },
  google: {
    name: "Google AI",
    description: "Gemini 2.0 등",
    keyPlaceholder: "AIza...",
    models: {
      prompt: [
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (빠름)", type: "prompt" },
        { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (고품질)", type: "prompt" },
      ],
      image: [
        { id: "imagen-3.0", label: "Imagen 3.0", type: "image" },
      ],
    },
  },
};

function maskKey(decrypted) {
  if (!decrypted || decrypted.length < 8) return "****";
  return decrypted.slice(0, 4) + "****" + decrypted.slice(-4);
}

function rowToConfig(row) {
  const decrypted = decrypt(row.encrypted_api_key, row.id);
  return {
    id: row.id,
    provider: row.provider,
    modelId: row.model_id,
    nickname: row.nickname,
    maskedApiKey: maskKey(decrypted),
    isDefaultPrompt: row.is_default_prompt === 1,
    isDefaultImage: row.is_default_image === 1,
    createdAt: row.created_at,
  };
}

// GET /api/ai-configs — 내 AI 설정 목록
router.get("/", (req, res) => {
  try {
    const rows = sqlite.prepare(
      "SELECT * FROM user_ai_configs WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC"
    ).all(req.portalUser.userId);
    res.json({ data: rows.map(rowToConfig), error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs GET /]", e.message);
    res.status(500).json({ data: null, error: "서버 오류가 발생했습니다", meta: null });
  }
});

// GET /api/ai-configs/providers — 지원 공급사 목록 (정적)
router.get("/providers", (req, res) => {
  res.json({ data: PROVIDERS, error: null, meta: null });
});

// POST /api/ai-configs — AI 설정 등록
router.post("/", (req, res) => {
  const { provider, modelId, nickname, apiKey } = req.body || {};
  if (!provider || !modelId || !nickname || !apiKey) {
    return res.status(400).json({ data: null, error: "provider, modelId, nickname, apiKey는 필수입니다", meta: null });
  }
  if (!PROVIDERS[provider]) {
    return res.status(400).json({ data: null, error: "지원하지 않는 공급사입니다", meta: null });
  }
  try {
    const id = crypto.randomUUID();
    const encryptedKey = encrypt(apiKey, id);
    sqlite.prepare(`
      INSERT INTO user_ai_configs (id, user_id, provider, model_id, nickname, encrypted_api_key, is_default_prompt, is_default_image, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, datetime('now'), datetime('now'))
    `).run(id, req.portalUser.userId, provider, modelId, nickname, encryptedKey);
    const row = sqlite.prepare("SELECT * FROM user_ai_configs WHERE id = ?").get(id);
    res.status(201).json({ data: rowToConfig(row), error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs POST /]", e.message);
    res.status(500).json({ data: null, error: "저장 중 오류가 발생했습니다", meta: null });
  }
});

// PUT /api/ai-configs/:id — AI 설정 수정
router.put("/:id", (req, res) => {
  const { nickname, modelId, apiKey } = req.body || {};
  try {
    const row = sqlite.prepare(
      "SELECT * FROM user_ai_configs WHERE id = ? AND user_id = ? AND is_active = 1"
    ).get(req.params.id, req.portalUser.userId);
    if (!row) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });

    const updates = [];
    const params = [];
    if (nickname) { updates.push("nickname = ?"); params.push(nickname); }
    if (modelId) { updates.push("model_id = ?"); params.push(modelId); }
    if (apiKey) {
      updates.push("encrypted_api_key = ?");
      params.push(encrypt(apiKey, row.id));
    }
    if (updates.length === 0) {
      return res.status(400).json({ data: null, error: "수정할 항목이 없습니다", meta: null });
    }
    updates.push("updated_at = datetime('now')");
    params.push(row.id);
    sqlite.prepare(`UPDATE user_ai_configs SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const updated = sqlite.prepare("SELECT * FROM user_ai_configs WHERE id = ?").get(row.id);
    res.json({ data: rowToConfig(updated), error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs PUT /:id]", e.message);
    res.status(500).json({ data: null, error: "수정 중 오류가 발생했습니다", meta: null });
  }
});

// DELETE /api/ai-configs/:id — AI 설정 삭제 (soft delete)
router.delete("/:id", (req, res) => {
  try {
    const row = sqlite.prepare(
      "SELECT id FROM user_ai_configs WHERE id = ? AND user_id = ? AND is_active = 1"
    ).get(req.params.id, req.portalUser.userId);
    if (!row) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });
    sqlite.prepare(
      "UPDATE user_ai_configs SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).run(row.id);
    res.json({ data: { id: row.id }, error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs DELETE /:id]", e.message);
    res.status(500).json({ data: null, error: "삭제 중 오류가 발생했습니다", meta: null });
  }
});

// PATCH /api/ai-configs/:id/default-prompt — 기본 글쓰기 AI 설정
router.patch("/:id/default-prompt", (req, res) => {
  try {
    const row = sqlite.prepare(
      "SELECT id FROM user_ai_configs WHERE id = ? AND user_id = ? AND is_active = 1"
    ).get(req.params.id, req.portalUser.userId);
    if (!row) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });
    sqlite.prepare(
      "UPDATE user_ai_configs SET is_default_prompt = 0 WHERE user_id = ?"
    ).run(req.portalUser.userId);
    sqlite.prepare(
      "UPDATE user_ai_configs SET is_default_prompt = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(row.id);
    res.json({ data: { id: row.id }, error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs PATCH default-prompt]", e.message);
    res.status(500).json({ data: null, error: "설정 중 오류가 발생했습니다", meta: null });
  }
});

// PATCH /api/ai-configs/:id/default-image — 기본 이미지 AI 설정
router.patch("/:id/default-image", (req, res) => {
  try {
    const row = sqlite.prepare(
      "SELECT id FROM user_ai_configs WHERE id = ? AND user_id = ? AND is_active = 1"
    ).get(req.params.id, req.portalUser.userId);
    if (!row) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });
    sqlite.prepare(
      "UPDATE user_ai_configs SET is_default_image = 0 WHERE user_id = ?"
    ).run(req.portalUser.userId);
    sqlite.prepare(
      "UPDATE user_ai_configs SET is_default_image = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(row.id);
    res.json({ data: { id: row.id }, error: null, meta: null });
  } catch (e) {
    console.error("[ai-configs PATCH default-image]", e.message);
    res.status(500).json({ data: null, error: "설정 중 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
