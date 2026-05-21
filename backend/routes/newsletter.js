/**
 * 뉴스레터 구독 API 라우트 — 구독/수신거부(공개) + 구독자 관리/발송(관리자)
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { newsletterSubscribers } = require("../db/schema");
const { eq, desc, sql } = require("drizzle-orm");
const { sendEmail } = require("../lib/email-service");
const { adminAuth } = require("../lib/auth");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 이메일 형식 검증 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter/subscribe — 뉴스레터 구독 (공개)
 * - email 필수, name 선택
 * - 중복 이메일 체크
 */
router.post("/subscribe", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ data: null, error: "올바른 이메일 주소를 입력해주세요", meta: null });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 중복 체크
    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail));

    if (existing) {
      // 이전에 구독 취소한 경우 재구독 처리
      if (!existing.isActive) {
        const [reactivated] = await db
          .update(newsletterSubscribers)
          .set({ isActive: 1, unsubscribedAt: null })
          .where(eq(newsletterSubscribers.id, existing.id))
          .returning();
        return res.json({ data: reactivated, error: null, meta: null });
      }
      return res.status(409).json({ data: null, error: "이미 구독 중인 이메일입니다", meta: null });
    }

    const [inserted] = await db.insert(newsletterSubscribers).values({
      email: normalizedEmail,
      name: name ? name.trim() : null,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/newsletter/unsubscribe/:token — 수신 거부 (공개)
 * - unsubscribeToken으로 구독자 검색 후 비활성화
 */
router.get("/unsubscribe/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.unsubscribeToken, token));

    if (!subscriber) {
      return res.status(404).json({ data: null, error: "유효하지 않은 수신거부 링크입니다", meta: null });
    }

    await db
      .update(newsletterSubscribers)
      .set({ isActive: 0, unsubscribedAt: sql`(datetime('now'))` })
      .where(eq(newsletterSubscribers.id, subscriber.id));

    res.json({ data: { message: "수신 거부가 완료되었습니다" }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/newsletter — 구독자 목록 (관리자)
 * - 쿼리: page, limit
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.subscribedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`count(*)` })
      .from(newsletterSubscribers);

    res.json({
      data: rows,
      error: null,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/newsletter/send — 뉴스레터 일괄 발송 (관리자)
 * - body: { subject, html }
 * - 활성 구독자 전체에게 이메일 발송
 */
router.post("/send", adminAuth, async (req, res) => {
  try {
    const { subject, html } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ data: null, error: "제목을 입력해주세요", meta: null });
    }
    if (!html || !html.trim()) {
      return res.status(400).json({ data: null, error: "본문 내용을 입력해주세요", meta: null });
    }

    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, 1));

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      try {
        const result = await sendEmail(sub.email, subject.trim(), html.trim());
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    res.json({
      data: { sent, failed, total: subscribers.length },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /api/newsletter/:id — 구독자 삭제 (관리자)
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "구독자를 찾을 수 없습니다", meta: null });
    }

    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
