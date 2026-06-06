/**
 * AI 연동 설정 라우트 — 구성원별 AI API 키 관리
 *
 * 포털 로그인 사용자가 OpenAI, Anthropic, Google 등의 AI 서비스 API 키를
 * 등록·관리할 수 있도록 한다. API 키는 AES-256-GCM 으로 암호화 저장되며,
 * 조회 시에는 마스킹 처리된 형태로 반환한다.
 *
 * GET  /api/ai-configs            — 내 AI 설정 목록
 * POST /api/ai-configs            — 새 AI 등록
 * PUT  /api/ai-configs/:id        — AI 설정 수정
 * DELETE /api/ai-configs/:id      — AI 설정 삭제
 * PATCH /api/ai-configs/:id/default-prompt — 글쓰기 기본 AI 지정
 * PATCH /api/ai-configs/:id/default-image  — 이미지 기본 AI 지정
 * GET  /api/ai-configs/providers  — 지원 공급사 + 모델 목록
 */
const { Router } = require("express");
const { db } = require("../db");
const { userAiConfigs } = require("../db/schema");
const { eq, and } = require("drizzle-orm");
const { encryptSecret, decryptSecret } = require("../lib/crypto-vault");
const { portalAuth, adminOrPortalAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const crypto = require("crypto");

const router = Router();

// ─── 지원 공급사 및 모델 정의 ───────────────────────────────────────────────
const PROVIDERS = {
  openai: {
    name: "OpenAI",
    description: "GPT 시리즈 + DALL-E 이미지 생성",
    keyPlaceholder: "sk-...",
    models: {
      prompt: [
        { id: "gpt-4o", label: "GPT-4o (추천·균형)", type: "prompt" },
        { id: "gpt-4o-mini", label: "GPT-4o mini (빠름·저렴)", type: "prompt" },
        { id: "gpt-4-turbo", label: "GPT-4 Turbo (고품질)", type: "prompt" },
        { id: "o1-mini", label: "o1-mini (추론 특화)", type: "prompt" },
      ],
      image: [
        { id: "dall-e-3", label: "DALL-E 3 (권장·1792×1024)", type: "image" },
        { id: "dall-e-2", label: "DALL-E 2 (저렴·1024×1024)", type: "image" },
        { id: "gpt-image-1", label: "GPT Image 1 (최신)", type: "image" },
      ],
    },
  },
  anthropic: {
    name: "Anthropic (Claude)",
    description: "Claude 시리즈 — 한국어 글쓰기 보조에 강함",
    keyPlaceholder: "sk-ant-...",
    models: {
      prompt: [
        { id: "claude-opus-4-5", label: "Claude Opus 4.5 (최고 품질·느림)", type: "prompt" },
        { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5 (균형·추천)", type: "prompt" },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (빠름·저렴)", type: "prompt" },
      ],
      image: [],
    },
  },
  google: {
    name: "Google (Gemini)",
    description: "Gemini 시리즈 — 다국어 처리 우수",
    keyPlaceholder: "AIza...",
    models: {
      prompt: [
        { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (최고 품질)", type: "prompt" },
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (빠름·저렴)", type: "prompt" },
        { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro (안정적)", type: "prompt" },
      ],
      image: [
        { id: "imagen-3", label: "Imagen 3 (최신 이미지 생성)", type: "image" },
      ],
    },
  },
};

const ALLOWED_PROVIDERS = Object.keys(PROVIDERS);
const ALLOWED_MODEL_IDS = new Set(
  Object.values(PROVIDERS).flatMap((p) =>
    [...p.models.prompt, ...p.models.image].map((m) => m.id)
  )
);

/** API 키를 마스킹 처리 — 앞 4자 + *** + 뒤 4자 */
function maskApiKey(key) {
  if (!key || key.length < 10) return "****";
  return key.slice(0, 4) + "***" + key.slice(-4);
}

/** DB 행을 클라이언트 응답 형태로 변환 (키 마스킹) */
function formatRow(row) {
  return {
    id: row.id,
    provider: row.provider,
    modelId: row.modelId,
    nickname: row.nickname,
    maskedApiKey: maskApiKey(row.encryptedApiKey ? (() => {
      try { return decryptSecret(row.encryptedApiKey); } catch { return ""; }
    })() : ""),
    isDefaultPrompt: Boolean(row.isDefaultPrompt),
    isDefaultImage: Boolean(row.isDefaultImage),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── GET /api/ai-configs/providers — 공급사 + 모델 메타 ───────────────────
router.get("/providers", adminOrPortalAuth, (req, res) => {
  res.json({ data: PROVIDERS, error: null, meta: null });
});

// ─── GET /api/ai-configs — 내 AI 설정 목록 ──────────────────────────────
router.get("/", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const rows = await db
      .select()
      .from(userAiConfigs)
      .where(and(eq(userAiConfigs.userId, userId), eq(userAiConfigs.isActive, 1)));

    res.json({ data: rows.map(formatRow), error: null, meta: { total: rows.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── POST /api/ai-configs — 새 AI 등록 ───────────────────────────────────
router.post("/", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const { provider, modelId, nickname, apiKey } = req.body;

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ data: null, error: "지원하지 않는 공급사입니다.", meta: null });
    }
    if (!modelId || !ALLOWED_MODEL_IDS.has(modelId)) {
      return res.status(400).json({ data: null, error: "지원하지 않는 모델입니다.", meta: null });
    }
    if (!nickname || nickname.trim().length < 1) {
      return res.status(400).json({ data: null, error: "닉네임을 입력해주세요.", meta: null });
    }
    if (!apiKey || apiKey.trim().length < 10) {
      return res.status(400).json({ data: null, error: "API 키를 정확히 입력해주세요.", meta: null });
    }

    const encryptedApiKey = encryptSecret(apiKey.trim());

    const [inserted] = await db
      .insert(userAiConfigs)
      .values({
        id: crypto.randomUUID(),
        userId,
        provider,
        modelId,
        nickname: nickname.trim(),
        encryptedApiKey,
        isDefaultPrompt: 0,
        isDefaultImage: 0,
        isActive: 1,
      })
      .returning();

    res.status(201).json({ data: formatRow(inserted), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── PUT /api/ai-configs/:id — AI 설정 수정 ─────────────────────────────
router.put("/:id", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const { id } = req.params;
    const { nickname, apiKey, modelId } = req.body;

    // 소유자 확인
    const [existing] = await db
      .select()
      .from(userAiConfigs)
      .where(and(eq(userAiConfigs.id, id), eq(userAiConfigs.userId, userId)));
    if (!existing) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다.", meta: null });

    const updates = { updatedAt: new Date().toISOString() };
    if (nickname && nickname.trim()) updates.nickname = nickname.trim();
    if (modelId && ALLOWED_MODEL_IDS.has(modelId)) updates.modelId = modelId;
    if (apiKey && apiKey.trim().length >= 10) updates.encryptedApiKey = encryptSecret(apiKey.trim());

    const [updated] = await db
      .update(userAiConfigs)
      .set(updates)
      .where(eq(userAiConfigs.id, id))
      .returning();

    res.json({ data: formatRow(updated), error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── DELETE /api/ai-configs/:id — AI 설정 삭제 ──────────────────────────
router.delete("/:id", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(userAiConfigs)
      .where(and(eq(userAiConfigs.id, id), eq(userAiConfigs.userId, userId)));
    if (!existing) return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다.", meta: null });

    // 물리 삭제 대신 비활성화
    await db
      .update(userAiConfigs)
      .set({ isActive: 0, updatedAt: new Date().toISOString() })
      .where(eq(userAiConfigs.id, id));

    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── PATCH /api/ai-configs/:id/default-prompt — 기본 글쓰기 AI 지정 ────
router.patch("/:id/default-prompt", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const { id } = req.params;

    // 기존 기본값 해제
    await db
      .update(userAiConfigs)
      .set({ isDefaultPrompt: 0 })
      .where(and(eq(userAiConfigs.userId, userId), eq(userAiConfigs.isDefaultPrompt, 1)));

    // 새 기본값 설정
    await db
      .update(userAiConfigs)
      .set({ isDefaultPrompt: 1, updatedAt: new Date().toISOString() })
      .where(and(eq(userAiConfigs.id, id), eq(userAiConfigs.userId, userId)));

    res.json({ data: { success: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── PATCH /api/ai-configs/:id/default-image — 기본 이미지 AI 지정 ─────
router.patch("/:id/default-image", adminOrPortalAuth, async (req, res) => {
  try {
    const userId = req.portalUser?.userId || req.adminUser?.id;
    if (!userId) return res.status(401).json({ data: null, error: "인증 필요", meta: null });

    const { id } = req.params;

    await db
      .update(userAiConfigs)
      .set({ isDefaultImage: 0 })
      .where(and(eq(userAiConfigs.userId, userId), eq(userAiConfigs.isDefaultImage, 1)));

    await db
      .update(userAiConfigs)
      .set({ isDefaultImage: 1, updatedAt: new Date().toISOString() })
      .where(and(eq(userAiConfigs.id, id), eq(userAiConfigs.userId, userId)));

    res.json({ data: { success: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 내부: AI 설정 ID로 복호화된 API 키 획득 (media.js 에서 사용) ─────────
/**
 * userId + configId 로 해당 AI 설정의 API 키를 복호화하여 반환.
 * media.js 의 suggest-prompts / generate 라우트에서 require 하여 사용한다.
 *
 * @param {string} userId
 * @param {string} configId
 * @returns {Promise<{ apiKey: string, provider: string, modelId: string }|null>}
 */
async function getDecryptedAiKey(userId, configId) {
  if (!userId || !configId) return null;
  try {
    const [row] = await db
      .select()
      .from(userAiConfigs)
      .where(
        and(
          eq(userAiConfigs.id, configId),
          eq(userAiConfigs.userId, userId),
          eq(userAiConfigs.isActive, 1)
        )
      );
    if (!row) return null;
    const apiKey = decryptSecret(row.encryptedApiKey);
    return { apiKey, provider: row.provider, modelId: row.modelId };
  } catch {
    return null;
  }
}

module.exports = router;
module.exports.getDecryptedAiKey = getDecryptedAiKey;
module.exports.PROVIDERS = PROVIDERS;
