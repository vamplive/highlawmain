/**
 * 미디어 파일 관리 API 라우트
 * - 파일 업로드 (단일/다중), 목록 조회, 메타데이터 수정, 삭제
 * - 폴더별 분류 및 파일 타입 필터링 지원
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { handleError } = require("../lib/route-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const sharp = require("sharp");
const { db } = require("../db");
const { mediaFiles } = require("../db/schema");
const { eq, desc, and, like, count } = require("drizzle-orm");
const { adminAuth, adminOrPortalAuth } = require("../lib/auth");
const { getDecryptedAiKey } = require("./ai-configs");

// TODO: original_name 컬럼 PII 검토 — 의뢰인 이름·주소 등이 파일명에 포함되어 디스크/DB에 남을 수 있다.
//       정책 결정 후 익명화 또는 마스킹된 표시명으로 교체 필요.

// sharp로 EXIF/메타데이터를 strip할 이미지 mime 타입.
// SVG는 별도 sanitize 정책이 필요하므로 제외하고, 애니메이션 GIF는 sharp가
// 단일 프레임으로 변환할 수 있어 제외한다.
const EXIF_STRIPPABLE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const SHARP_FORMAT_BY_MIME = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * 업로드된 이미지에서 EXIF/메타데이터를 제거한다.
 * - sharp.rotate()로 EXIF orientation을 픽셀에 반영한 뒤
 *   toFormat(원본포맷)으로 다시 인코딩하여 메타데이터를 모두 제거한다.
 * - 처리 실패 시 경고만 남기고 원본을 그대로 둔다 (업로드 자체는 성공시킨다).
 *
 * @param {string} filePath - 디스크에 저장된 이미지 경로
 * @param {string} mimeType
 * @returns {Promise<void>}
 */
async function stripImageMetadata(filePath, mimeType) {
  if (!EXIF_STRIPPABLE_MIME.has(mimeType)) return;
  const format = SHARP_FORMAT_BY_MIME[mimeType];
  if (!format) return;

  try {
    const buffer = await fsp.readFile(filePath);
    const cleaned = await sharp(buffer).rotate().toFormat(format).toBuffer();
    await fsp.writeFile(filePath, cleaned);
  } catch (err) {
    logger.warn({ filePath, mimeType, errMsg: err.message }, "[Media] EXIF strip 실패 — 원본 유지");
  }
}

const router = Router();

// UUID 형식 검증 헬퍼
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(id, res) {
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    return false;
  }
  return true;
}

// 허용 파일 확장자
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4|webm)$/i;

// 스토리지 경로 설정
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const MEDIA_DIR = path.join(STORAGE_PATH, "uploads", "media");

// 미디어 디렉토리 생성
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

// 폴더명 검증 — 경로 탐색 공격 방지
function sanitizeFolder(folder) {
  return (folder || "general")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
    .slice(0, 50) || "general";
}

// Multer 디스크 스토리지 설정 (대상 디렉토리 생성은 비동기 fs API 사용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = sanitizeFolder(req.body.folder);
    const dir = path.join(MEDIA_DIR, folder);
    fsp.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `media-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTENSIONS.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("지원하지 않는 파일 형식입니다"));
    }
  },
});

// GET /api/media/folders — 폴더 목록 (고유값)
router.get("/folders", async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ folder: mediaFiles.folder })
      .from(mediaFiles)
      .orderBy(mediaFiles.folder);

    const folders = rows.map((r) => r.folder);
    res.json({ data: folders, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/media — 파일 목록 (페이지네이션, 필터)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;

    const folder = req.query.folder || null;
    const type = req.query.type || null;
    const search = req.query.search || null;

    const conditions = [];
    if (folder) conditions.push(eq(mediaFiles.folder, folder));
    if (type === "image") conditions.push(like(mediaFiles.mimeType, "image/%"));
    if (type === "video") conditions.push(like(mediaFiles.mimeType, "video/%"));
    if (type === "document") conditions.push(like(mediaFiles.mimeType, "application/%"));
    if (search) {
      const { escapeLike } = require("../lib/sanitize");
      conditions.push(like(mediaFiles.originalName, `%${escapeLike(search)}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(mediaFiles)
      .where(where);

    const rows = await db
      .select()
      .from(mediaFiles)
      .where(where)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows,
      error: null,
      meta: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// GET /api/media/:id — 단일 파일 상세
router.get("/:id", async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [row] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!row) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    res.json({ data: row, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/upload — 단일 파일 업로드
router.post("/upload", adminOrPortalAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const url = `/uploads/media/${folder}/${req.file.filename}`;

    // 이미지 EXIF/메타데이터 strip (GPS, 카메라 정보, 작성자 등 PII 제거).
    // 실패해도 업로드는 계속 진행한다.
    await stripImageMetadata(req.file.path, req.file.mimetype);
    // strip 결과 파일 크기가 변할 수 있으므로 stat으로 다시 확인.
    let finalSize = req.file.size;
    try {
      const stat = await fsp.stat(req.file.path);
      finalSize = stat.size;
    } catch (_e) { /* stat 실패 시 multer 보고값 사용 */ }

    const [record] = await db
      .insert(mediaFiles)
      .values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: finalSize,
        url,
        alt: req.body.alt || null,
        folder,
        uploadedBy: req.body.uploadedBy || "admin",
      })
      .returning();

    res.status(201).json({ data: record, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/upload-multiple — 다중 파일 업로드 (최대 10개)
router.post("/upload-multiple", adminOrPortalAuth, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const records = [];

    for (const file of req.files) {
      const url = `/uploads/media/${folder}/${file.filename}`;

      // 이미지 EXIF/메타데이터 strip (단일 업로드와 동일 정책).
      await stripImageMetadata(file.path, file.mimetype);
      let finalSize = file.size;
      try {
        const stat = await fsp.stat(file.path);
        finalSize = stat.size;
      } catch (_e) { /* stat 실패 시 multer 보고값 사용 */ }

      const [record] = await db
        .insert(mediaFiles)
        .values({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: finalSize,
          url,
          alt: req.body.alt || null,
          folder,
          uploadedBy: req.body.uploadedBy || "admin",
        })
        .returning();

      records.push(record);
    }

    res.status(201).json({ data: records, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// PATCH /api/media/:id — 메타데이터 수정 (alt, folder)
router.patch("/:id", adminOrPortalAuth, async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    const updates = {};
    if (req.body.alt !== undefined) updates.alt = req.body.alt;

    // 폴더 변경 시 물리적 파일 이동
    if (req.body.folder && req.body.folder !== existing.folder) {
      const newFolder = sanitizeFolder(req.body.folder);
      const oldPath = path.join(MEDIA_DIR, existing.folder, existing.filename);
      const newDir = path.join(MEDIA_DIR, newFolder);
      const newPath = path.join(newDir, existing.filename);

      await fsp.mkdir(newDir, { recursive: true });
      // 원본 파일이 없을 수 있으므로 존재 여부와 무관하게 예외만 안전 처리
      try {
        await fsp.rename(oldPath, newPath);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }

      updates.folder = newFolder;
      updates.url = `/uploads/media/${newFolder}/${existing.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ data: existing, error: null, meta: null });
    }

    const [updated] = await db
      .update(mediaFiles)
      .set(updates)
      .where(eq(mediaFiles.id, req.params.id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// DELETE /api/media/:id — 파일 삭제 (DB + 물리적 파일)
//
// 순서: DB 삭제 → 파일 삭제.
//   DB가 단일 트랜잭션 단위이고 재시도가 안전하므로 먼저 처리한다.
//   파일 삭제가 실패해도 DB 레코드가 사라진 후이므로 사용자 가시성에는 영향이 없고,
//   고아 파일은 별도 청소 작업으로 회수 가능하다 (재시도 시 ENOENT로 무시됨).
router.delete("/:id", adminOrPortalAuth, async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    // 1) DB 레코드 삭제 — 실패 시 클라이언트에 500을 반환하고 파일은 그대로 둔다(재시도 가능).
    await db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    // 2) 물리적 파일 삭제 — 실패해도 사용자 응답에는 영향 없음. 경고만 남기고 진행.
    const filePath = path.join(MEDIA_DIR, existing.folder, existing.filename);
    try {
      await fsp.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        logger.warn({ filePath, errCode: err.code }, "[Media] 파일 삭제 실패 (DB는 정리됨, 고아 파일)");
      }
    }

    res.json({ data: { id: req.params.id }, error: null, meta: null });
  } catch (err) {
    handleError(res, err);
  }
});

// AI 모델 설정 — 운영자가 .env / UI 에서 모델을 바꿀 수 있도록 한 곳에 모아둔다.
//
// 보안: 클라이언트가 임의의 model 문자열을 백엔드로 보낼 수 있는 만큼,
// 반드시 ALLOWED_*_MODELS allowlist 와 대조해 통과시킨다. 통과 못 하면 기본값으로 폴백.
const ALLOWED_PROMPT_MODELS = [
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-opus-4-7",
];
const DEFAULT_PROMPT_MODEL = process.env.BLOG_PROMPT_MODEL && ALLOWED_PROMPT_MODELS.includes(process.env.BLOG_PROMPT_MODEL)
  ? process.env.BLOG_PROMPT_MODEL
  : "claude-haiku-4-5";

const ALLOWED_IMAGE_MODELS = [
  "dall-e-3",
  "dall-e-2",
  "gpt-image-1",
];
const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL && ALLOWED_IMAGE_MODELS.includes(process.env.OPENAI_IMAGE_MODEL)
  ? process.env.OPENAI_IMAGE_MODEL
  : "dall-e-3";

function pickPromptModel(requested) {
  if (requested && ALLOWED_PROMPT_MODELS.includes(requested)) return requested;
  return DEFAULT_PROMPT_MODEL;
}

function pickImageModel(requested) {
  if (requested && ALLOWED_IMAGE_MODELS.includes(requested)) return requested;
  return DEFAULT_IMAGE_MODEL;
}

// GET /api/media/ai-config — UI 모델 드롭다운에서 표시할 메타데이터 + 사용자 등록 AI 목록
//
// 서버 기본 AI 설정과 함께, 현재 로그인 사용자의 등록된 AI 설정 목록도 반환한다.
router.get("/ai-config", adminOrPortalAuth, async (req, res) => {
  try {
    // 사용자 등록 AI 목록 조회
    const userId = req.portalUser?.userId || req.adminUser?.id;
    let userAiList = [];
    if (userId) {
      try {
        const { db: _db } = require("../db");
        const { userAiConfigs } = require("../db/schema");
        const { eq: _eq, and: _and } = require("drizzle-orm");
        const rows = await _db.select().from(userAiConfigs).where(
          _and(_eq(userAiConfigs.userId, userId), _eq(userAiConfigs.isActive, 1))
        );
        userAiList = rows.map((r) => ({
          id: r.id,
          provider: r.provider,
          modelId: r.modelId,
          nickname: r.nickname,
          isDefaultPrompt: Boolean(r.isDefaultPrompt),
          isDefaultImage: Boolean(r.isDefaultImage),
        }));
      } catch { /* 목록 조회 실패 무시 */ }
    }

    res.json({
      data: {
        prompt: {
          defaultModel: DEFAULT_PROMPT_MODEL,
          allowedModels: ALLOWED_PROMPT_MODELS,
          keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        },
        image: {
          defaultModel: DEFAULT_IMAGE_MODEL,
          allowedModels: ALLOWED_IMAGE_MODELS,
          keyConfigured: Boolean(process.env.OPENAI_API_KEY),
        },
        userAiConfigs: userAiList,
      },
      error: null,
      meta: null,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/suggest-prompts — Claude로 블로그 본문에 어울리는 DALL-E 프롬프트 제안
//
// 운영자가 블로그 글을 다 쓰고 나서 "AI 본문 이미지 자동 추가"를 누르면, Claude가 본문을 읽고
// (1) 본문에 어울리는 영문 DALL-E 프롬프트와 (2) 한국어 사용자 설명을 N개 만들어 돌려준다.
// 사용자는 이 결과를 그대로 쓰거나 편집·삭제한 뒤 /api/media/generate 로 실제 이미지를 만든다.
//
// 환경변수
//   ANTHROPIC_API_KEY — 필수. 미설정 시 503.
//
// 요청 body: { title?, body, count?, scope?: "cover"|"inline" }
// 응답: { data: [{ prompt, summary }], error, meta }
router.post("/suggest-prompts", adminOrPortalAuth, async (req, res) => {
  try {
    // 사용자 등록 AI 키 우선 사용 (userAiConfigId 제공 시)
    const requestingUserId = req.portalUser?.userId || req.adminUser?.id;
    const userAiConfigId = req.body?.userAiConfigId;
    let apiKey = null;
    let providerOverride = null;
    let modelOverride = null;

    if (userAiConfigId && requestingUserId) {
      const userAi = await getDecryptedAiKey(requestingUserId, userAiConfigId);
      if (userAi && userAi.provider === "anthropic") {
        apiKey = userAi.apiKey;
        providerOverride = "anthropic";
        modelOverride = userAi.modelId;
      }
    }

    // 사용자 키 없으면 서버 기본 키 사용
    if (!apiKey) apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        data: null,
        error: "프롬프트 추천 기능이 비활성화되어 있습니다. AI 설정에서 Anthropic API 키를 등록하거나 관리자에게 요청하세요.",
        meta: null,
      });
    }
    void providerOverride; // used via modelOverride below

    const title = String(req.body?.title || "").slice(0, 200);
    const body = String(req.body?.body || "").slice(0, 8000);
    const count = Math.min(5, Math.max(1, Number(req.body?.count) || 3));
    const scope = req.body?.scope === "cover" ? "cover" : "inline";

    if (body.trim().length < 30 && title.trim().length < 5) {
      return res.status(400).json({
        data: null,
        error: "프롬프트 추천을 위해 제목 또는 본문을 더 입력해주세요.",
        meta: null,
      });
    }

    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic.default({ apiKey });

    const scopeHint = scope === "cover"
      ? "이 글의 대표(썸네일) 이미지로 쓸 1장의 이미지 프롬프트를 작성하세요. 글 전체 분위기를 함축해야 합니다."
      : `본문 흐름에 자연스럽게 삽입할 ${count}장의 일러스트 프롬프트를 작성하세요. 각각 본문의 다른 단락/주제를 보조해야 합니다.`;

    const systemPrompt = `당신은 한국 법률사무소 블로그를 위한 일러스트 디렉터입니다.
주어진 블로그 글의 분위기와 핵심 내용을 분석해, DALL-E 3 가 이해할 수 있는 영문 프롬프트를 작성합니다.

원칙:
- 한국 법률·부동산·건설 분야의 신뢰감 있는 분위기
- 사람의 얼굴은 정면 클로즈업을 피하고 손·서류·풍경 위주
- 사진 스타일이 아니라 모던한 일러스트 / 플랫 디자인 지향 (직관적·전문적)
- 텍스트·로고·법원 마크 같은 글자 요소는 넣지 않음
- 폭력적·성적·차별적 묘사 금지

${scopeHint}

반드시 suggest_prompts 도구를 사용해 응답하세요. 자유 텍스트 응답 금지.`;

    const userMsg = `제목: ${title || "(없음)"}\n\n본문:\n${body || "(없음)"}\n\n위 글에 어울리는 ${count}장의 이미지 프롬프트를 만들어주세요.`;

    const tool = {
      name: "suggest_prompts",
      description: "블로그 글에 어울리는 DALL-E 3 영문 프롬프트와 한국어 요약을 N개 제안",
      input_schema: {
        type: "object",
        properties: {
          prompts: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                prompt: { type: "string", description: "DALL-E 3 영문 프롬프트 (60~250자)" },
                summary: { type: "string", description: "이 이미지가 무엇을 표현하는지 한국어 한 줄 설명 (40자 이내)" },
              },
              required: ["prompt", "summary"],
            },
          },
        },
        required: ["prompts"],
      },
    };

    const promptModel = modelOverride ? (ALLOWED_PROMPT_MODELS.includes(modelOverride) ? modelOverride : pickPromptModel(req.body?.model)) : pickPromptModel(req.body?.model);
    const completion = await client.messages.create({
      model: promptModel,
      max_tokens: 1500,
      system: systemPrompt,
      tools: [tool],
      tool_choice: { type: "tool", name: "suggest_prompts" },
      messages: [{ role: "user", content: userMsg }],
    });

    const toolUse = completion.content?.find((c) => c.type === "tool_use");
    const list = toolUse?.input?.prompts || [];
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(502).json({ data: null, error: "프롬프트 추천 결과가 비어 있습니다.", meta: null });
    }

    res.json({
      data: list.slice(0, count),
      error: null,
      meta: { scope, count: list.length, model: promptModel },
    });
  } catch (err) {
    handleError(res, err);
  }
});

// POST /api/media/generate — AI 이미지 생성 (DALL-E 3)
//
// 운영자가 입력한 한국어 프롬프트로 OpenAI DALL-E 3 호출 → 결과를 미디어 폴더에 저장하고
// 일반 업로드와 동일한 mediaFiles 레코드로 반영. 응답은 일반 업로드와 동일 형태.
//
// 환경변수
//   OPENAI_API_KEY — 필수. 미설정 시 503 반환.
//
// 요청 body: { prompt: string, size?: "1024x1024"|"1792x1024"|"1024x1792", folder?: string }
// 응답: { data: mediaFiles row, error, meta }
router.post("/generate", adminOrPortalAuth, async (req, res) => {
  try {
    // 사용자 등록 AI 키 우선 사용 (userAiConfigId 제공 시)
    const requestingUserIdG = req.portalUser?.userId || req.adminUser?.id;
    const userAiConfigIdG = req.body?.userAiConfigId;
    let apiKey = null;
    let imageModelOverride = null;

    if (userAiConfigIdG && requestingUserIdG) {
      const userAi = await getDecryptedAiKey(requestingUserIdG, userAiConfigIdG);
      if (userAi && userAi.provider === "openai") {
        apiKey = userAi.apiKey;
        imageModelOverride = userAi.modelId;
      } else if (userAi && userAi.provider === "google" && userAi.modelId === "imagen-3") {
        // Google Imagen 3 은 별도 API — 현재는 안내만
        return res.status(400).json({ data: null, error: "Google Imagen 3 이미지 생성은 현재 지원 준비 중입니다.", meta: null });
      }
    }

    // 사용자 키 없으면 서버 기본 키 사용
    if (!apiKey) apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        data: null,
        error: "AI 이미지 생성이 비활성화되어 있습니다. AI 설정에서 OpenAI API 키를 등록하거나 관리자에게 요청하세요.",
        meta: null,
      });
    }

    const prompt = String(req.body?.prompt || "").trim();
    if (prompt.length < 4 || prompt.length > 1000) {
      return res.status(400).json({
        data: null,
        error: "프롬프트는 4자 이상 1000자 이하로 입력해주세요.",
        meta: null,
      });
    }

    // DALL-E 3 가 허용하는 사이즈만 통과
    const ALLOWED_SIZES = new Set(["1024x1024", "1792x1024", "1024x1792"]);
    const size = ALLOWED_SIZES.has(req.body?.size) ? req.body.size : "1792x1024";
    const folder = sanitizeFolder(req.body?.folder || "blog");

    // OpenAI Images API 호출 — b64_json 으로 받아 외부 URL 만료 이슈 회피
    const imageModel = imageModelOverride ? (ALLOWED_IMAGE_MODELS.includes(imageModelOverride) ? imageModelOverride : pickImageModel(req.body?.model)) : pickImageModel(req.body?.model);
    // gpt-image-1 / dall-e-2 는 dall-e-3 와 파라미터가 일부 다르다.
    // dall-e-2: response_format 사용, quality 미지원, size 256/512/1024 만 허용
    // gpt-image-1: response_format 대신 항상 b64 반환, quality 'low'|'medium'|'high'|'auto'
    const requestBody = {
      model: imageModel,
      prompt,
      n: 1,
    };
    if (imageModel === "dall-e-3") {
      requestBody.size = size;
      requestBody.quality = "standard";
      requestBody.response_format = "b64_json";
    } else if (imageModel === "dall-e-2") {
      // dall-e-2 는 1792 미지원 — 1024 로 다운스케일
      requestBody.size = size === "1024x1024" ? "1024x1024" : "1024x1024";
      requestBody.response_format = "b64_json";
    } else if (imageModel === "gpt-image-1") {
      requestBody.size = size;
      requestBody.quality = "auto";
      // gpt-image-1 은 항상 b64_json 응답
    }

    const openaiResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text().catch(() => "");
      logger.warn({ status: openaiResp.status, errText: errText.slice(0, 500) }, "[Media] DALL-E 3 호출 실패");
      return res.status(502).json({
        data: null,
        error: "AI 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
        meta: null,
      });
    }

    const json = await openaiResp.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ data: null, error: "AI 이미지 응답이 비어 있습니다.", meta: null });
    }

    // 디스크에 저장 — 일반 업로드와 동일한 폴더 구조
    const dir = path.join(MEDIA_DIR, folder);
    await fsp.mkdir(dir, { recursive: true });
    const filename = `media-${crypto.randomUUID()}.png`;
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(b64, "base64");
    await fsp.writeFile(filePath, buffer);

    // PNG 도 EXIF strip 흐름을 그대로 적용 (DALL-E 결과는 메타가 거의 없지만 일관성 유지)
    await stripImageMetadata(filePath, "image/png");
    let finalSize = buffer.length;
    try {
      const stat = await fsp.stat(filePath);
      finalSize = stat.size;
    } catch (_e) { /* stat 실패 시 buffer 길이 사용 */ }

    const url = `/uploads/media/${folder}/${filename}`;
    const altText = prompt.slice(0, 200);
    const [record] = await db
      .insert(mediaFiles)
      .values({
        filename,
        originalName: `ai-generated.png`,
        mimeType: "image/png",
        size: finalSize,
        url,
        alt: altText,
        folder,
        uploadedBy: "admin-ai",
      })
      .returning();

    res.status(201).json({ data: record, error: null, meta: { source: imageModel, prompt, size } });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
