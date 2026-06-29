/**
 * 메시지 발송 API 라우트 — 템플릿 CRUD + SMS/이메일 발송 + 이력 조회
 * - 알리고(Aligo)로 문자 발송, Nodemailer로 이메일 발송
 * - 상담 고객 연락처 연동
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { handleError } = require("../lib/route-handler");
const { db, sqlite } = require("../db");
const { messageTemplates, messageLogs } = require("../db/schema");
const { eq, desc, sql, and } = require("drizzle-orm");
const { sendSMS } = require("../lib/sms-service");
const { sendEmail } = require("../lib/email-service");
const { sendFriendTalk } = require("../lib/kakao-friendtalk-service");
const { adminAuth, requireRole, requireMinRole } = require("../lib/auth");
const { auditMiddleware } = require("../lib/audit-log");
const clientService = require("../services/client-service");
const scheduleService = require("../services/schedule-service");
const {
  resolveUnsubscribeToken, buildUnsubscribeUrl,
  replacePlaceholders, appendEmailFooter, injectTrackingPixel,
} = require("../lib/message-render");
const { cleanPhone, normalizeMessageChannel } = require("../services/helpers");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const router = Router();

// =============================================
// 이미지 업로드 (메시지 첨부용)
// =============================================
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const MSG_IMG_DIR = path.join(STORAGE_PATH, "uploads", "messages");
if (!fs.existsSync(MSG_IMG_DIR)) fs.mkdirSync(MSG_IMG_DIR, { recursive: true });

const msgImgStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MSG_IMG_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `msg-${crypto.randomUUID()}${ext}`);
  },
});
const imgUpload = multer({
  storage: msgImgStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일(jpg/png/gif/webp)만 업로드 가능합니다"));
    }
  },
});

/** POST /upload-image — 메시지 첨부 이미지 업로드 */
router.post("/upload-image", adminAuth, imgUpload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ data: null, error: "이미지 파일이 필요합니다", meta: null });
  }
  const url = `/uploads/messages/${req.file.filename}`;
  const baseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  res.json({ data: { url, fullUrl: baseUrl ? `${baseUrl}${url}` : url }, error: null, meta: null });
});

// 메시지 발송·템플릿·로그 변경은 모두 감사 로그에 기록.
// 단, 공개 추적 픽셀(track/open, track/click)은 GET이라 auditMiddleware가 무시한다.
router.use(auditMiddleware("messages"));

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeRecipient(recipient, channel) {
  const contact = channel === "email"
    ? String(recipient.contact || "").trim().toLowerCase()
    : cleanPhone(String(recipient.contact || ""));
  return { ...recipient, contact };
}

function channelUsesPhone(channel) {
  return channel === "sms" || channel === "kakao";
}

// =============================================
// 열람 추적 (공개 — 인증 없이 이메일 클라이언트가 호출)
// =============================================

/** 1x1 투명 GIF (base64 디코딩) */
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=",
  "base64"
);

/**
 * GET /track/open/:id.gif — 이메일 열람 추적 픽셀
 * - id: message_logs.id (.gif 확장자는 일부 메일 클라이언트 호환용)
 * - 항상 1x1 GIF을 반환하고, 유효한 ID라면 opened_at/open_count를 갱신
 */
router.get("/track/open/:id.gif", async (req, res) => {
  // 이미지 응답은 항상 성공시킨다 — 이메일 렌더링에 영향을 주지 않도록
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const { id } = req.params;
    if (UUID_REGEX.test(id)) {
      // 최초 열람일 때만 opened_at을 기록, 이후 open_count만 증가
      await db.update(messageLogs)
        .set({
          openedAt: sql`COALESCE(opened_at, datetime('now'))`,
          openCount: sql`open_count + 1`,
        })
        .where(eq(messageLogs.id, id));
    }
  } catch (e) {
    logger.error({ err: e }, "[tracking]");
  }
  res.status(200).end(TRACKING_PIXEL);
});

// =============================================
// 템플릿 CRUD
// =============================================

/** GET /templates — 템플릿 목록 */
router.get("/templates", adminAuth, async (req, res) => {
  try {
    const { channel } = req.query;
    let query = db.select().from(messageTemplates);
    if (channel) {
      query = query.where(eq(messageTemplates.channel, channel));
    }
    const rows = await query.orderBy(messageTemplates.sortOrder);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /templates — 템플릿 생성 */
router.post("/templates", adminAuth, async (req, res) => {
  try {
    const { name, channel, subject, content, isActive, sortOrder } = req.body;
    if (!name?.trim() || !content?.trim()) {
      return res.status(400).json({ data: null, error: "이름과 내용은 필수입니다", meta: null });
    }
    const normalizedChannel = normalizeMessageChannel(channel || "sms");
    if (channel && !["sms", "email", "kakao"].includes(normalizedChannel)) {
      return res.status(400).json({ data: null, error: "채널은 sms, email 또는 kakao이어야 합니다", meta: null });
    }

    const [inserted] = await db.insert(messageTemplates).values({
      name: name.trim(),
      channel: normalizedChannel,
      subject: subject?.trim() || null,
      content: content.trim(),
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
      sortOrder: sortOrder || 0,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PATCH /templates/:id — 템플릿 수정 */
router.patch("/templates/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    }

    const { name, channel, subject, content, isActive, sortOrder } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };
    if (name !== undefined) updateData.name = name.trim();
    if (channel !== undefined) {
      const normalizedChannel = normalizeMessageChannel(channel);
      if (!["sms", "email", "kakao"].includes(normalizedChannel)) {
        return res.status(400).json({ data: null, error: "채널은 sms 또는 email이어야 합니다", meta: null });
      }
      updateData.channel = normalizedChannel;
    }
    if (subject !== undefined) updateData.subject = subject?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updated] = await db.update(messageTemplates)
      .set(updateData)
      .where(eq(messageTemplates.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** DELETE /templates/:id — 템플릿 삭제 */
// 템플릿 영구 삭제 — admin만 (실수로 자주 쓰는 템플릿 사라지면 발송 흐름 마비).
router.delete("/templates/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    }

    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 메시지 발송
// =============================================

/**
 * POST /send — 메시지 발송
 * body: { channel, recipients: [{ name, contact, consultationId?, category? }], templateId?, subject?, content }
 */
// 실제 메시지 발송(SMS/이메일) — 외부 비용 + 고객 노출. manager 이상.
router.post("/send", adminAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const { recipients, templateId, subject, content, skipConsentFilter } = req.body;
    const channel = normalizeMessageChannel(req.body.channel);

    if (!channel || !["sms", "email", "kakao"].includes(channel)) {
      return res.status(400).json({ data: null, error: "채널은 sms, email 또는 kakao이어야 합니다", meta: null });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ data: null, error: "수신자를 1명 이상 지정해주세요", meta: null });
    }
    if (!content?.trim()) {
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    }
    if (channel === "email" && !subject?.trim()) {
      return res.status(400).json({ data: null, error: "이메일 제목을 입력해주세요", meta: null });
    }

    // 수신거부 고객 제외 (skipConsentFilter=true 이면 트랜잭셔널 메시지 발송으로 간주해 건너뜀)
    let blockedRecipients = [];
    let targetRecipients = recipients.map((recipient) => normalizeRecipient(recipient, channel));
    if (!skipConsentFilter) {
      const { allowed, blocked } = await clientService.filterByConsent(targetRecipients, channel);
      targetRecipients = allowed;
      blockedRecipients = blocked;
    }

    if (targetRecipients.length === 0) {
      return res.json({
        data: { total: 0, sent: 0, failed: 0, results: [], blocked: blockedRecipients },
        error: null,
        meta: { message: "모든 수신자가 수신거부 상태입니다" },
      });
    }

    const results = [];
    for (const recipient of targetRecipients) {
      // 수신거부 URL 조회 (플레이스홀더 치환 + 이메일 푸터용)
      const token = await resolveUnsubscribeToken(recipient.contact);
      const unsubscribeUrl = buildUnsubscribeUrl(token);

      const renderedContent = replacePlaceholders(content, {
        name: recipient.name, category: recipient.category, unsubscribeUrl,
      });
      const renderedSubject = subject ? replacePlaceholders(subject, {
        name: recipient.name, category: recipient.category, unsubscribeUrl,
      }) : null;

      // 이메일: log row 먼저 생성 → logId로 추적 픽셀 URL 생성 → HTML 완성 → 발송
      let finalEmailHtml = null;
      let log;
      if (channel === "email") {
        const bodyWithFooter = appendEmailFooter(renderedContent, unsubscribeUrl);
        [log] = await db.insert(messageLogs).values({
          channel,
          recipientName: recipient.name || null,
          recipientContact: recipient.contact,
          consultationId: recipient.consultationId || null,
          templateId: templateId || null,
          subject: renderedSubject,
          content: bodyWithFooter,
          status: "pending",
        }).returning();
        finalEmailHtml = injectTrackingPixel(bodyWithFooter, log.id);
      }

      let sendResult;
      if (channel === "sms") {
        sendResult = await sendSMS(recipient.contact, renderedContent);
      } else if (channel === "email") {
        sendResult = await sendEmail(recipient.contact, renderedSubject, finalEmailHtml);
      } else {
        // kakao — imageUrl은 req.body.imageUrl 또는 recipient.imageUrl로 전달
        const imageUrl = req.body.imageUrl || recipient.imageUrl || undefined;
        sendResult = await sendFriendTalk(recipient.contact, renderedContent, {
          name: recipient.name,
          imageUrl,
        });
      }

      const now = new Date().toISOString().replace("T", " ").slice(0, 19);

      if (channel === "sms" || channel === "kakao") {
        [log] = await db.insert(messageLogs).values({
          channel,
          recipientName: recipient.name || null,
          recipientContact: recipient.contact,
          consultationId: recipient.consultationId || null,
          templateId: templateId || null,
          subject: null,
          content: renderedContent,
          status: sendResult.success ? "sent" : "failed",
          errorMessage: sendResult.error || null,
          sentAt: sendResult.success ? now : null,
        }).returning();
      } else {
        // 이메일은 pending으로 생성했으니 최종 상태로 갱신
        await db.update(messageLogs)
          .set({
            status: sendResult.success ? "sent" : "failed",
            errorMessage: sendResult.error || null,
            sentAt: sendResult.success ? now : null,
          })
          .where(eq(messageLogs.id, log.id));
      }

      // 발송 성공 시 고객의 lastContactedAt 갱신 (실패해도 결과에 영향 없음)
      if (sendResult.success) {
        await clientService.touchLastContacted(recipient.contact);
      }

      results.push({
        recipientContact: recipient.contact,
        success: sendResult.success,
        messageId: sendResult.messageId,
        error: sendResult.error,
        logId: log.id,
        sentAt: sendResult.success ? now : null,
      });
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      data: { total: results.length, sent, failed, results, blocked: blockedRecipients },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /check-duplicates — 최근 발송 이력 기반 중복 수신자 검출
 * body: { contacts: string[], withinHours?: number(기본 24) }
 * - 지정 시간 내에 동일 연락처로 sent 상태의 이력이 있으면 중복으로 표시
 * - 동일 메시지 중복 발송 방지용
 */
router.post("/check-duplicates", adminAuth, async (req, res) => {
  try {
    const { contacts, withinHours = 24 } = req.body || {};
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.json({ data: { duplicates: [] }, error: null, meta: null });
    }
    const hours = Math.max(1, Math.min(720, parseInt(withinHours, 10) || 24));

    // 최근 N시간 이내 sent 상태 이력 조회
    const rows = await db.select({
      recipientContact: messageLogs.recipientContact,
      sentAt: messageLogs.sentAt,
      channel: messageLogs.channel,
    }).from(messageLogs)
      .where(and(
        eq(messageLogs.status, "sent"),
        sql`${messageLogs.sentAt} >= datetime('now', '-' || ${hours} || ' hours')`,
      ))
      .orderBy(desc(messageLogs.sentAt));

    // 요청받은 contacts 중 이력에 포함된 것만 반환
    const contactSet = new Set(contacts);
    const seen = new Map();
    rows.forEach((r) => {
      if (contactSet.has(r.recipientContact) && !seen.has(r.recipientContact)) {
        seen.set(r.recipientContact, { contact: r.recipientContact, lastSentAt: r.sentAt, channel: r.channel });
      }
    });

    res.json({ data: { duplicates: Array.from(seen.values()), withinHours: hours }, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e });
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// =============================================
// 예약 발송
// =============================================

/**
 * POST /schedule — 예약 메시지 생성
 * body: { channel, recipients, templateId?, subject?, content, scheduledAt }
 */
// 예약 발송 — 향후 자동 발송이라 더 위험. manager 이상.
router.post("/schedule", adminAuth, requireMinRole("manager"), async (req, res) => {
  try {
    const item = await scheduleService.createSchedule(req.body || {});
    res.json({ data: item, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e });
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/** GET /scheduled — 예약 목록 */
router.get("/scheduled", adminAuth, async (req, res) => {
  try {
    const result = await scheduleService.listSchedules(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    logger.error({ err: e });
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/** DELETE /scheduled/:id — 예약 취소 */
router.delete("/scheduled/:id", adminAuth, async (req, res) => {
  try {
    const result = await scheduleService.cancelSchedule(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e });
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// =============================================
// 발송 이력
// =============================================

/** GET /logs — 발송 이력 목록 (페이지네이션) */
router.get("/logs", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { channel, status } = req.query;

    const conditions = [];
    if (channel) conditions.push(eq(messageLogs.channel, channel));
    if (status) conditions.push(eq(messageLogs.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(messageLogs);
    let countQuery = db.select({ total: sql`count(*)` }).from(messageLogs);

    if (whereClause) {
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const rows = await query.orderBy(desc(messageLogs.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await countQuery;

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
 * GET /stats — 발송 통계 (기간·채널별 집계)
 * - ?from=YYYY-MM-DD&to=YYYY-MM-DD (기본: 최근 30일)
 * - 반환: total / sent / failed / opened (이메일 only) + 채널별 breakdown + 일별 추이
 */
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

    // 기본 기간: 최근 30일
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const fromDate = DATE_RE.test(from) ? from : defaultFrom;
    const toDate = DATE_RE.test(to) ? to : today;

    // SQLite는 text 비교로 YYYY-MM-DD 범위를 처리 — created_at은 'YYYY-MM-DD HH:MM:SS'
    const rangeCond = sql`date(${messageLogs.createdAt}) BETWEEN ${fromDate} AND ${toDate}`;

    // 전체 요약
    const [summary] = await db.select({
      total: sql`count(*)`,
      sent: sql`sum(case when status='sent' then 1 else 0 end)`,
      failed: sql`sum(case when status='failed' then 1 else 0 end)`,
      opened: sql`sum(case when opened_at is not null then 1 else 0 end)`,
      emailSent: sql`sum(case when channel='email' and status='sent' then 1 else 0 end)`,
      smsSent: sql`sum(case when channel='sms' and status='sent' then 1 else 0 end)`,
    }).from(messageLogs).where(rangeCond);

    // 채널별 세부
    const byChannel = await db.select({
      channel: messageLogs.channel,
      sent: sql`sum(case when status='sent' then 1 else 0 end)`,
      failed: sql`sum(case when status='failed' then 1 else 0 end)`,
      opened: sql`sum(case when opened_at is not null then 1 else 0 end)`,
    }).from(messageLogs).where(rangeCond).groupBy(messageLogs.channel);

    // 일별 추이 — better-sqlite3로 직접 쿼리 (drizzle raw sql보다 간명)
    const daily = sqlite.prepare(`
      SELECT
        date(created_at) as day,
        channel,
        sum(case when status='sent' then 1 else 0 end) as sent,
        sum(case when status='failed' then 1 else 0 end) as failed,
        sum(case when opened_at is not null then 1 else 0 end) as opened
      FROM message_logs
      WHERE date(created_at) BETWEEN ? AND ?
      GROUP BY day, channel
      ORDER BY day ASC
    `).all(fromDate, toDate);

    const emailSentNum = Number(summary.emailSent || 0);
    const openedNum = Number(summary.opened || 0);

    res.json({
      data: {
        range: { from: fromDate, to: toDate },
        total: Number(summary.total || 0),
        sent: Number(summary.sent || 0),
        failed: Number(summary.failed || 0),
        opened: openedNum,
        emailSent: emailSentNum,
        smsSent: Number(summary.smsSent || 0),
        openRate: emailSentNum > 0 ? Math.round((openedNum / emailSentNum) * 1000) / 10 : 0,
        byChannel: byChannel.map((r) => ({
          channel: r.channel,
          sent: Number(r.sent || 0),
          failed: Number(r.failed || 0),
          opened: Number(r.opened || 0),
        })),
        daily: daily.map((r) => ({
          day: r.day,
          channel: r.channel,
          sent: Number(r.sent || 0),
          failed: Number(r.failed || 0),
          opened: Number(r.opened || 0),
        })),
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    logger.error({ err: e });
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/** DELETE /logs/:id — 이력 삭제 */
// 발송 로그 삭제 — 컴플라이언스 흔적 제거에 해당. admin 전용.
router.delete("/logs/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageLogs).where(eq(messageLogs.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "이력을 찾을 수 없습니다", meta: null });
    }

    await db.delete(messageLogs).where(eq(messageLogs.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
