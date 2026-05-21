/**
 * 사이트 설정 API 라우트 — 페이지별 섹션 콘텐츠 관리 (JSON)
 * - GET / : 전체 설정 목록 (page 필터 가능)
 * - GET /:page/:section : 특정 설정 조회
 * - PUT /:page/:section : 설정 생성/수정 (upsert) + 변경 이력 저장
 * - DELETE /:page/:section : 설정 삭제
 * - POST /bulk : 여러 설정 일괄 upsert + 변경 이력 저장
 * - GET /history : 설정 변경 이력 조회 (페이지네이션)
 * - GET /history/:id : 단건 변경 이력 조회
 * - POST /history/:id/restore : 변경 이력으로 설정 복원
 * - POST /reset/:page/:section : 설정 초기화 (기본값 복원)
 * - POST /schedule : 예약 변경 등록
 * - GET /schedule : 예약 변경 목록 조회
 * - DELETE /schedule/:id : 예약 변경 취소
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { db, sqlite } = require("../db");
const { siteSettings, siteSettingsHistory, scheduledChanges } = require("../db/schema");
const { eq, and, desc, sql } = require("drizzle-orm");
const crypto = require("crypto");
const { adminAuth } = require("../lib/auth");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * JSON content 문자열을 파싱하여 객체로 변환
 * @param {object} row - DB에서 조회한 행
 * @returns {object} content가 파싱된 행
 */
function parseContentField(row) {
  if (!row) return row;
  try {
    const key = `${row.page}/${row.section}`;
    return { ...row, key, content: JSON.parse(row.content) };
  } catch {
    return { ...row, key: `${row.page}/${row.section}` };
  }
}

function normalizeBulkSettings(settings) {
  if (Array.isArray(settings)) {
    return settings
      .map((item) => ({
        page: item.page,
        section: item.section,
        content: item.content,
      }))
      .filter((item) => item.page && item.section && item.content !== undefined && item.content !== null);
  }

  if (settings && typeof settings === "object") {
    return Object.entries(settings)
      .map(([key, content]) => {
        const [page, ...sectionParts] = key.split("/");
        return { page, section: sectionParts.join("/"), content };
      })
      .filter((item) => item.page && item.section && item.content !== undefined && item.content !== null);
  }

  return [];
}

/**
 * 변경 이력 행의 content/previousContent JSON을 파싱
 * @param {object} row - site_settings_history 행
 * @returns {object} content, previousContent가 파싱된 행
 */
function parseHistoryFields(row) {
  if (!row) return row;
  const parsed = { ...row };
  try { parsed.content = JSON.parse(parsed.content); } catch {}
  try { if (parsed.previousContent) parsed.previousContent = JSON.parse(parsed.previousContent); } catch {}
  return parsed;
}

// ─── GET /history — 설정 변경 이력 목록 (페이지네이션, 관리자만) ───
// 주의: /history는 /:page/:section보다 먼저 등록해야 라우트 충돌 방지
router.get("/history", adminAuth, async (req, res) => {
  try {
    const { page, section } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    const conditions = [];
    if (page) conditions.push(eq(siteSettingsHistory.page, page));
    if (section) conditions.push(eq(siteSettingsHistory.section, section));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(siteSettingsHistory);
    let countQuery = db.select({ total: sql`count(*)` }).from(siteSettingsHistory);

    if (whereClause) {
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const rows = await query.orderBy(desc(siteSettingsHistory.changedAt)).limit(limit).offset(offset);
    const [{ total }] = await countQuery;

    const parsed = rows.map(parseHistoryFields);
    res.json({ data: parsed, error: null, meta: { total, limit, offset } });
  } catch (err) {
    logger.error({ err }, "[site-settings] 이력 목록 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET /history/:id — 단건 변경 이력 조회 (관리자만) ───
router.get("/history/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const rows = await db.select().from(siteSettingsHistory).where(eq(siteSettingsHistory.id, id));
    if (rows.length === 0) {
      return res.status(404).json({ data: null, error: "변경 이력을 찾을 수 없습니다", meta: null });
    }

    res.json({ data: parseHistoryFields(rows[0]), error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 이력 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── POST /history/:id/restore — 변경 이력으로 설정 복원 ───
router.post("/history/:id/restore", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [historyRow] = await db.select().from(siteSettingsHistory).where(eq(siteSettingsHistory.id, id));
    if (!historyRow) {
      return res.status(404).json({ data: null, error: "변경 이력을 찾을 수 없습니다", meta: null });
    }

    // 트랜잭션: 현재 값을 이력에 저장 후 복원
    const restoreTransaction = sqlite.transaction(() => {
      // 현재 설정 조회
      const currentRows = sqlite.prepare(
        `SELECT content FROM site_settings WHERE page = ? AND section = ?`
      ).all(historyRow.page, historyRow.section);
      const previousContent = currentRows.length > 0 ? currentRows[0].content : null;

      // 복원 이력 기록
      sqlite.prepare(`
        INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?, 'admin', datetime('now'))
      `).run(crypto.randomUUID(), historyRow.page, historyRow.section, historyRow.content, previousContent);

      // 설정 복원 (upsert)
      sqlite.prepare(`
        INSERT INTO site_settings (id, page, section, content, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
      `).run(crypto.randomUUID(), historyRow.page, historyRow.section, historyRow.content);
    });

    restoreTransaction();

    // 복원된 설정 조회
    const rows = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.page, historyRow.page), eq(siteSettings.section, historyRow.section)));

    res.json({ data: parseContentField(rows[0]), error: null, meta: { restoredFrom: id } });
  } catch (err) {
    logger.error({ err }, "[site-settings] 이력 복원 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── POST /reset/:page/:section — 설정 초기화 (기본값 복원) ───
router.post("/reset/:page/:section", adminAuth, async (req, res) => {
  try {
    const { page, section } = req.params;

    // 현재 값 조회하여 이력에 기록
    const currentRows = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.page, page), eq(siteSettings.section, section)));

    if (currentRows.length === 0) {
      return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });
    }

    const resetTransaction = sqlite.transaction(() => {
      // 삭제 전 이력 기록 (content에 null, previousContent에 기존 값)
      sqlite.prepare(`
        INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at)
        VALUES (?, ?, ?, '{"_action":"reset"}', ?, 'admin', datetime('now'))
      `).run(crypto.randomUUID(), page, section, currentRows[0].content);

      // 설정 삭제 (기본값으로 복원)
      sqlite.prepare(`DELETE FROM site_settings WHERE page = ? AND section = ?`).run(page, section);
    });

    resetTransaction();

    res.json({ data: { reset: true, page, section }, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 설정 초기화 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── POST /schedule — 예약 변경 등록 ───
router.post("/schedule", adminAuth, async (req, res) => {
  try {
    const { page, section, content, scheduledAt } = req.body;

    if (!page || !section) {
      return res.status(400).json({ data: null, error: "page, section 필드는 필수입니다", meta: null });
    }
    if (content === undefined || content === null) {
      return res.status(400).json({ data: null, error: "content 필드는 필수입니다", meta: null });
    }
    if (!scheduledAt) {
      return res.status(400).json({ data: null, error: "scheduledAt 필드는 필수입니다", meta: null });
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    const [inserted] = await db
      .insert(scheduledChanges)
      .values({ page, section, content: contentStr, scheduledAt })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 예약 등록 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET /schedule — 예약 변경 목록 (관리자만) ───
router.get("/schedule", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(scheduledChanges)
      .where(eq(scheduledChanges.status, "pending"))
      .orderBy(scheduledChanges.scheduledAt);

    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (err) {
    logger.error({ err }, "[site-settings] 예약 목록 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── DELETE /schedule/:id — 예약 변경 취소 ───
router.delete("/schedule/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(scheduledChanges).where(eq(scheduledChanges.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "예약 변경을 찾을 수 없습니다", meta: null });
    }

    const [updated] = await db
      .update(scheduledChanges)
      .set({ status: "cancelled" })
      .where(eq(scheduledChanges.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 예약 취소 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET / — 전체 설정 목록 (선택적 page 필터) ───
router.get("/", async (req, res) => {
  try {
    const { page, key } = req.query;

    let rows;
    if (key && String(key).includes("/")) {
      const [keyPage, ...sectionParts] = String(key).split("/");
      rows = await db
        .select()
        .from(siteSettings)
        .where(and(eq(siteSettings.page, keyPage), eq(siteSettings.section, sectionParts.join("/"))));
    } else if (page) {
      rows = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.page, page));
    } else {
      rows = await db.select().from(siteSettings);
    }

    const parsed = rows.map(parseContentField);
    res.json({ data: parsed, error: null, meta: { total: parsed.length } });
  } catch (err) {
    logger.error({ err }, "[site-settings] 목록 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── GET /:page/:section — 특정 설정 조회 ───
router.get("/:page/:section", async (req, res) => {
  try {
    const { page, section } = req.params;

    const rows = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.page, page), eq(siteSettings.section, section)));

    if (rows.length === 0) {
      return res.status(404).json({ data: null, error: "설정을 찾을 수 없습니다", meta: null });
    }

    res.json({ data: parseContentField(rows[0]), error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 조회 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── PUT /:page/:section — 설정 upsert (변경 이력 저장 포함) ───
router.put("/:page/:section", adminAuth, async (req, res) => {
  try {
    const { page, section } = req.params;
    const { content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ data: null, error: "content 필드는 필수입니다", meta: null });
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    // 트랜잭션: 기존 값을 이력에 저장 후 upsert
    const upsertWithHistory = sqlite.transaction(() => {
      // 기존 설정 조회
      const currentRows = sqlite.prepare(
        `SELECT content FROM site_settings WHERE page = ? AND section = ?`
      ).all(page, section);
      const previousContent = currentRows.length > 0 ? currentRows[0].content : null;

      // 변경 이력 저장
      sqlite.prepare(`
        INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?, 'admin', datetime('now'))
      `).run(crypto.randomUUID(), page, section, contentStr, previousContent);

      // 설정 upsert
      sqlite.prepare(`
        INSERT INTO site_settings (id, page, section, content, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
      `).run(crypto.randomUUID(), page, section, contentStr);
    });

    upsertWithHistory();

    // 방금 upsert한 행 조회
    const rows = await db
      .select()
      .from(siteSettings)
      .where(and(eq(siteSettings.page, page), eq(siteSettings.section, section)));

    res.json({ data: parseContentField(rows[0]), error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] upsert 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── DELETE /:page/:section — 설정 삭제 ───
router.delete("/:page/:section", adminAuth, async (req, res) => {
  try {
    const { page, section } = req.params;

    await db
      .delete(siteSettings)
      .where(and(eq(siteSettings.page, page), eq(siteSettings.section, section)));

    res.json({ data: { deleted: true, page, section }, error: null, meta: null });
  } catch (err) {
    logger.error({ err }, "[site-settings] 삭제 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// ─── POST /bulk — 여러 설정 일괄 upsert (변경 이력 저장 포함) ───
router.post("/bulk", adminAuth, async (req, res) => {
  try {
    const { settings } = req.body;

    const items = normalizeBulkSettings(settings);

    if (items.length === 0) {
      return res.status(400).json({ data: null, error: "settings 항목이 필요합니다", meta: null });
    }

    const historyStmt = sqlite.prepare(`
      INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at)
      VALUES (?, ?, ?, ?, ?, 'admin', datetime('now'))
    `);

    const upsertStmt = sqlite.prepare(`
      INSERT INTO site_settings (id, page, section, content, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
    `);

    const fetchStmt = sqlite.prepare(
      `SELECT content FROM site_settings WHERE page = ? AND section = ?`
    );

    const upsertAllWithHistory = sqlite.transaction((items) => {
      for (const item of items) {
        const contentStr = typeof item.content === "string"
          ? item.content
          : JSON.stringify(item.content);

        // 기존 값 조회
        const currentRow = fetchStmt.get(item.page, item.section);
        const previousContent = currentRow ? currentRow.content : null;

        // 변경 이력 저장
        historyStmt.run(crypto.randomUUID(), item.page, item.section, contentStr, previousContent);

        // 설정 upsert
        upsertStmt.run(crypto.randomUUID(), item.page, item.section, contentStr);
      }
    });

    upsertAllWithHistory(items);

    res.json({
      data: { upserted: items.length },
      error: null,
      meta: null,
    });
  } catch (err) {
    logger.error({ err }, "[site-settings] bulk upsert 실패:");
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
