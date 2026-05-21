/**
 * 챗봇 API 라우트 — Q&A 관리(관리자) + 키워드 매칭 채팅(공개)
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { chatbotQa, chatSessions } = require("../db/schema");
const { eq, sql } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");
const { isWithinLength } = require("../lib/sanitize");

const router = Router();

/** Q&A 필드 길이 제한 */
const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;
const MAX_CHAT_MESSAGE_LENGTH = 1000;

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 매칭 실패 시 기본 응답 */
const FALLBACK_ANSWER = "더 자세한 상담이 필요하시면 [상담 신청](/consultation)을 해주세요.";

/** 키워드 매칭에서 무시할 최소 토큰 길이 */
const MIN_TOKEN_LENGTH = 2;

/**
 * GET /api/chatbot/qa — Q&A 목록 (관리자)
 * - sortOrder 오름차순
 */
router.get("/qa", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(chatbotQa).orderBy(chatbotQa.sortOrder);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/chatbot/qa — Q&A 생성 (관리자)
 * - category, question, answer, keywords, sortOrder
 */
router.post("/qa", adminAuth, async (req, res) => {
  try {
    const { category, question, answer, keywords, sortOrder } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ data: null, error: "질문을 입력해주세요", meta: null });
    }
    if (!answer || !answer.trim()) {
      return res.status(400).json({ data: null, error: "답변을 입력해주세요", meta: null });
    }
    if (!isWithinLength(question, MAX_QUESTION_LENGTH)) {
      return res.status(400).json({ data: null, error: `질문은 ${MAX_QUESTION_LENGTH}자 이내여야 합니다`, meta: null });
    }
    if (!isWithinLength(answer, MAX_ANSWER_LENGTH)) {
      return res.status(400).json({ data: null, error: `답변은 ${MAX_ANSWER_LENGTH}자 이내여야 합니다`, meta: null });
    }

    const [inserted] = await db.insert(chatbotQa).values({
      category: category || "일반",
      question: question.trim(),
      answer: answer.trim(),
      keywords: keywords || null,
      sortOrder: sortOrder || 0,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * PATCH /api/chatbot/qa/:id — Q&A 수정 (관리자)
 */
router.patch("/qa/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(chatbotQa).where(eq(chatbotQa.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Q&A를 찾을 수 없습니다", meta: null });
    }

    const { category, question, answer, keywords, sortOrder, isActive } = req.body;
    const updateData = {};

    if (category !== undefined) updateData.category = category;
    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (keywords !== undefined) updateData.keywords = keywords;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

    const [updated] = await db.update(chatbotQa).set(updateData).where(eq(chatbotQa.id, id)).returning();
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /api/chatbot/qa/:id — Q&A 삭제 (관리자)
 */
router.delete("/qa/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(chatbotQa).where(eq(chatbotQa.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Q&A를 찾을 수 없습니다", meta: null });
    }

    await db.delete(chatbotQa).where(eq(chatbotQa.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/chatbot/chat — 챗봇 메시지 처리 (공개)
 * - body: { message, sessionId }
 * - 키워드 매칭으로 가장 적합한 Q&A 답변 반환
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ data: null, error: "메시지를 입력해주세요", meta: null });
    }
    if (!isWithinLength(message, MAX_CHAT_MESSAGE_LENGTH)) {
      return res.status(400).json({ data: null, error: `메시지는 ${MAX_CHAT_MESSAGE_LENGTH}자 이내여야 합니다`, meta: null });
    }

    // 활성 Q&A 전체 조회
    const allQa = await db
      .select()
      .from(chatbotQa)
      .where(eq(chatbotQa.isActive, 1));

    // 사용자 메시지를 토큰으로 분리 (짧은 단어 제외)
    const userTokens = message
      .trim()
      .split(/\s+/)
      .filter(t => t.length >= MIN_TOKEN_LENGTH)
      .map(t => t.toLowerCase());

    // 각 Q&A의 키워드와 사용자 토큰 매칭 점수 계산
    let bestMatch = null;
    let bestScore = 0;

    for (const qa of allQa) {
      if (!qa.keywords) continue;

      const qaKeywords = qa.keywords
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);

      let score = 0;
      for (const keyword of qaKeywords) {
        for (const token of userTokens) {
          if (token.includes(keyword) || keyword.includes(token)) {
            score++;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = qa;
      }
    }

    // 최소 1개 이상 매칭되어야 답변 반환
    const answer = (bestScore >= 1 && bestMatch)
      ? bestMatch.answer
      : FALLBACK_ANSWER;

    // 세션 기록 저장 (선택)
    if (sessionId) {
      try {
        const [session] = await db
          .select()
          .from(chatSessions)
          .where(eq(chatSessions.sessionId, sessionId));

        const newMessage = { role: "user", content: message.trim(), at: new Date().toISOString() };
        const botMessage = { role: "bot", content: answer, at: new Date().toISOString() };

        if (session) {
          const existing = session.messages ? JSON.parse(session.messages) : [];
          existing.push(newMessage, botMessage);
          await db
            .update(chatSessions)
            .set({ messages: JSON.stringify(existing), updatedAt: sql`(datetime('now'))` })
            .where(eq(chatSessions.sessionId, sessionId));
        } else {
          await db.insert(chatSessions).values({
            sessionId,
            messages: JSON.stringify([newMessage, botMessage]),
          });
        }
      } catch {
        // 세션 저장 실패는 무시 (채팅 응답은 정상 반환)
      }
    }

    res.json({ data: { answer, matched: bestScore >= 1 }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
