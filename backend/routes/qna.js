/**
 * 법률 Q&A API 라우트 — 공개 조회 + 제출, 비밀글 검증, 관리자 승인/답변/카테고리 CRUD
 * 비즈니스 로직은 services/qna-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const qnaService = require("../services/qna-service");
const { wrap } = require("../lib/route-handler");

const router = Router();

/** 조회수 중복 방지용 인메모리 캐시 (IP:slug → 만료시각) */
const VIEW_COOLDOWN_MS = 10 * 60 * 1000;
const viewCache = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of viewCache) {
    if (now > expiresAt) viewCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * 카카오 세션에서 사용자 ID 추출 (선택적, 없으면 null).
 * kakao-auth 모듈이 로드 가능할 때만 동작한다.
 */
function extractKakaoUserId(req) {
  try {
    const { extractKakaoToken, getKakaoSession } = require("../lib/kakao-auth");
    const token = extractKakaoToken(req);
    if (!token) return null;
    const session = getKakaoSession(token);
    return session?.kakaoUserId || null;
  } catch {
    return null;
  }
}

// =============================================
// 공개 API
// =============================================

// GET /api/qna/categories — 카테고리 트리
router.get("/categories", wrap(async (req, res) => {
  const tree = await qnaService.getCategoryTree();
  res.json({ data: tree, error: null, meta: null });
}));

// GET /api/qna/questions — 공개 질문 목록 (카테고리/featured 필터)
router.get("/questions", wrap(async (req, res) => {
  const kakaoUserId = extractKakaoUserId(req);
  const result = await qnaService.listQuestions({ ...req.query, kakaoUserId });
  res.json({ data: result.items, error: null, meta: result.meta });
}));

// GET /api/qna/questions/:slug — 질문 상세 + 조회수 증가 (IP 중복 방지)
router.get("/questions/:slug", wrap(async (req, res) => {
  const { slug } = req.params;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const cacheKey = `${ip}:${slug}`;
  const skipIncrement = viewCache.has(cacheKey) && Date.now() < viewCache.get(cacheKey);
  const kakaoUserId = extractKakaoUserId(req);

  const question = await qnaService.getQuestion(slug, { skipIncrement, kakaoUserId });
  if (!skipIncrement) viewCache.set(cacheKey, Date.now() + VIEW_COOLDOWN_MS);

  res.json({ data: question, error: null, meta: null });
}));

// POST /api/qna/questions — 공개 질문 제출 (상태 pending)
router.post("/questions", wrap(async (req, res) => {
  const kakaoUserId = extractKakaoUserId(req);
  const result = await qnaService.submitQuestion({ ...req.body, kakaoUserId });
  res.json({ data: result, error: null, meta: null });
}));

// POST /api/qna/questions/:slug/verify — 비밀글 비밀번호 검증
router.post("/questions/:slug/verify", wrap(async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ data: null, error: "비밀번호를 입력해 주세요", meta: null });
  }
  const question = await qnaService.verifyQuestionPassword(req.params.slug, password);
  res.json({ data: question, error: null, meta: null });
}));

// =============================================
// 관리자 API
// =============================================

// GET /api/qna/admin/questions — 모든 상태 포함
router.get("/admin/questions", adminAuth, wrap(async (req, res) => {
  const result = await qnaService.adminListQuestions(req.query);
  res.json({ data: result.items, error: null, meta: result.meta });
}));

// POST /api/qna/admin/questions — 관리자 질문 직접 생성
router.post("/admin/questions", adminAuth, wrap(async (req, res) => {
  const inserted = await qnaService.adminCreateQuestion(req.body);
  res.json({ data: inserted, error: null, meta: null });
}));

// GET /api/qna/admin/questions/:id — 관리자 상세 (PII 포함)
router.get("/admin/questions/:id", adminAuth, wrap(async (req, res) => {
  const { db } = require("../db");
  const { qnaQuestions } = require("../db/schema");
  const { eq } = require("drizzle-orm");
  const [row] = await db.select().from(qnaQuestions).where(eq(qnaQuestions.id, req.params.id));
  if (!row) {
    return res.status(404).json({ data: null, error: "질문을 찾을 수 없습니다", meta: null });
  }
  res.json({ data: row, error: null, meta: null });
}));

// PATCH /api/qna/admin/questions/:id — 답변/상태/카테고리 수정
router.patch("/admin/questions/:id", adminAuth, wrap(async (req, res) => {
  const updated = await qnaService.adminUpdateQuestion(req.params.id, req.body);
  res.json({ data: updated, error: null, meta: null });
}));

// DELETE /api/qna/admin/questions/:id
router.delete("/admin/questions/:id", adminAuth, wrap(async (req, res) => {
  const result = await qnaService.adminDeleteQuestion(req.params.id);
  res.json({ data: result, error: null, meta: null });
}));

// POST /api/qna/admin/categories
router.post("/admin/categories", adminAuth, wrap(async (req, res) => {
  const inserted = await qnaService.adminCreateCategory(req.body);
  res.json({ data: inserted, error: null, meta: null });
}));

// PATCH /api/qna/admin/categories/:id
router.patch("/admin/categories/:id", adminAuth, wrap(async (req, res) => {
  const updated = await qnaService.adminUpdateCategory(req.params.id, req.body);
  res.json({ data: updated, error: null, meta: null });
}));

// DELETE /api/qna/admin/categories/:id
router.delete("/admin/categories/:id", adminAuth, wrap(async (req, res) => {
  const result = await qnaService.adminDeleteCategory(req.params.id);
  res.json({ data: result, error: null, meta: null });
}));

module.exports = router;
