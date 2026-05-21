/**
 * 대시보드 API 라우트 — 문서 통계, 유형별/상태별 집계 + ERP 요약
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { adminAuth } = require("../lib/auth");
const {
  documents,
  categories,
  documentCategories,
  timeEntries,
  tasks,
  courtDates,
  trustTransactions,
} = require("../db/schema");
const { eq, desc, sql, gte, lt, lte, isNull, isNotNull, and, count, inArray } = require("drizzle-orm");

const router = Router();

// GET /api/dashboard
router.get("/", adminAuth, async (req, res) => {
  try {
    const [totalResult] = await db
      .select({ total: count() })
      .from(documents)
      .where(sql`${documents.status} != 'archived'`);

    const byType = await db
      .select({ documentType: documents.documentType, count: count() })
      .from(documents)
      .where(sql`${documents.status} != 'archived'`)
      .groupBy(documents.documentType);

    const byStatus = await db
      .select({ status: documents.status, count: count() })
      .from(documents)
      .groupBy(documents.status);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    const [thisWeekResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(gte(documents.createdAt, sevenDaysAgo));

    const recentDocuments = await db
      .select()
      .from(documents)
      .where(sql`${documents.status} != 'archived'`)
      .orderBy(desc(documents.createdAt))
      .limit(5);

    const byCategory = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        count: count(documentCategories.documentId),
      })
      .from(categories)
      .leftJoin(documentCategories, eq(categories.id, documentCategories.categoryId))
      .groupBy(categories.id);

    res.json({
      data: {
        totalDocuments: totalResult.total,
        byType,
        byStatus,
        thisWeek: thisWeekResult.count,
        recentDocuments,
        byCategory,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/dashboard/erp — 변호사 사무실 운영 한눈 보기.
 * 활성 타이머, 미청구 시간/금액, 다가올 법정 일정, 미완료/기한 초과 업무,
 * 의뢰인 예치금 총액. 관리자가 로그인 직후 한눈에 보아야 할 핵심 지표.
 */
router.get("/erp", adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);

    /* 활성 타이머 수 */
    const [activeTimers] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(timeEntries)
      .where(isNull(timeEntries.endedAt));

    /* 미청구 시간 / 금액 (billable=1, billed=0, ended_at IS NOT NULL) */
    const [unbilled] = await db
      .select({
        minutes: sql`coalesce(sum(${timeEntries.durationMinutes}), 0)`.mapWith(Number),
        amountKrw: sql`coalesce(sum(${timeEntries.durationMinutes} * ${timeEntries.hourlyRateKrw} / 60), 0)`.mapWith(Number),
        entries: sql`count(*)`.mapWith(Number),
      })
      .from(timeEntries)
      .where(and(
        eq(timeEntries.billable, 1),
        eq(timeEntries.billed, 0),
        isNotNull(timeEntries.endedAt),
      ));

    /* 이번 주 청구 가능 시간 */
    const [thisWeek] = await db
      .select({
        minutes: sql`coalesce(sum(${timeEntries.durationMinutes}), 0)`.mapWith(Number),
      })
      .from(timeEntries)
      .where(and(
        gte(timeEntries.startedAt, thisWeekStart),
        eq(timeEntries.billable, 1),
        isNotNull(timeEntries.endedAt),
      ));

    /* 7일 내 다가올 법정 일정 */
    const upcomingCourtDates = await db
      .select()
      .from(courtDates)
      .where(and(
        gte(courtDates.startsAt, new Date().toISOString().replace("T", " ").slice(0, 19)),
        lte(courtDates.startsAt, sevenDaysLater),
        eq(courtDates.status, "scheduled"),
      ))
      .orderBy(courtDates.startsAt)
      .limit(10);

    /* 미완료 업무 / 기한 초과 */
    const [taskCounts] = await db
      .select({
        open: sql`coalesce(sum(case when ${tasks.status} = 'open' then 1 else 0 end), 0)`.mapWith(Number),
        inProgress: sql`coalesce(sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end), 0)`.mapWith(Number),
        blocked: sql`coalesce(sum(case when ${tasks.status} = 'blocked' then 1 else 0 end), 0)`.mapWith(Number),
        overdue: sql`coalesce(sum(case when ${tasks.dueDate} < ${today} and ${tasks.status} in ('open','in_progress','blocked') then 1 else 0 end), 0)`.mapWith(Number),
      })
      .from(tasks);

    /* 의뢰인 예치금 총액 */
    const [trustTotal] = await db
      .select({
        totalKrw: sql`coalesce(sum(${trustTransactions.amountKrw}), 0)`.mapWith(Number),
        activeClients: sql`count(distinct ${trustTransactions.clientId})`.mapWith(Number),
      })
      .from(trustTransactions)
      .where(isNull(trustTransactions.voidedAt));

    /* 기한 초과 업무 상위 5건 */
    const overdueTasks = await db
      .select()
      .from(tasks)
      .where(and(
        isNotNull(tasks.dueDate),
        lt(tasks.dueDate, today),
        inArray(tasks.status, ["open", "in_progress", "blocked"]),
      ))
      .orderBy(tasks.dueDate)
      .limit(5);

    res.json({
      data: {
        activeTimers: activeTimers.count,
        unbilled: {
          minutes: unbilled.minutes,
          amountKrw: unbilled.amountKrw,
          entryCount: unbilled.entries,
        },
        thisWeekBillableMinutes: thisWeek.minutes,
        upcomingCourtDates,
        tasks: taskCounts,
        overdueTasks,
        trustAccount: trustTotal,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/dashboard/lawyer-revenue?from=&to= — 변호사별 매출/생산성 분석.
 *
 * 반환:
 *   data.lawyers: [{ lawyerId, name, totalMinutes, billableMinutes,
 *                    billedAmountKrw, unbilledAmountKrw, entryCount }]
 *   data.range: { from, to }
 *
 * default 기간: 최근 30일
 */
router.get("/lawyer-revenue", adminAuth, async (req, res) => {
  try {
    const { lawyers: lawyersTable } = require("../db/schema");
    const { timeEntries: te } = require("../db/schema");

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = req.query.from || defaultFrom.toISOString().slice(0, 10);
    const to = req.query.to || now.toISOString().slice(0, 10);
    const fromTs = `${from} 00:00:00`;
    const toTs = `${to} 23:59:59`;

    /* 변호사별 집계 — 시간기록 기준 */
    const aggregates = await db
      .select({
        lawyerId: te.lawyerId,
        totalMinutes: sql`coalesce(sum(${te.durationMinutes}), 0)`.mapWith(Number),
        billableMinutes: sql`coalesce(sum(case when ${te.billable} = 1 then ${te.durationMinutes} else 0 end), 0)`.mapWith(Number),
        billedAmountKrw: sql`coalesce(sum(case when ${te.billed} = 1 then ${te.durationMinutes} * ${te.hourlyRateKrw} / 60 else 0 end), 0)`.mapWith(Number),
        unbilledAmountKrw: sql`coalesce(sum(case when ${te.billable} = 1 and ${te.billed} = 0 then ${te.durationMinutes} * ${te.hourlyRateKrw} / 60 else 0 end), 0)`.mapWith(Number),
        entryCount: sql`count(*)`.mapWith(Number),
      })
      .from(te)
      .where(and(
        gte(te.startedAt, fromTs),
        lte(te.startedAt, toTs),
        sql`${te.endedAt} IS NOT NULL`,
      ))
      .groupBy(te.lawyerId);

    /* 모든 활성 변호사 — 0건이라도 표시 */
    const allLawyers = await db
      .select({
        id: lawyersTable.id, name: lawyersTable.name,
        defaultHourlyRateKrw: lawyersTable.defaultHourlyRateKrw,
      })
      .from(lawyersTable)
      .where(eq(lawyersTable.isActive, 1));

    const aggMap = new Map(aggregates.map((a) => [a.lawyerId, a]));
    const merged = allLawyers
      .map((l) => {
        const a = aggMap.get(l.id) || {
          totalMinutes: 0, billableMinutes: 0,
          billedAmountKrw: 0, unbilledAmountKrw: 0, entryCount: 0,
        };
        return {
          lawyerId: l.id,
          name: l.name,
          defaultHourlyRateKrw: l.defaultHourlyRateKrw || 0,
          totalMinutes: a.totalMinutes,
          billableMinutes: a.billableMinutes,
          billedAmountKrw: a.billedAmountKrw,
          unbilledAmountKrw: a.unbilledAmountKrw,
          entryCount: a.entryCount,
          /* 가용 시간 = 청구가능 시간 / 총 시간 (생산성 지표) */
          billableRatio: a.totalMinutes > 0 ? a.billableMinutes / a.totalMinutes : 0,
        };
      })
      .sort((x, y) => (y.billedAmountKrw + y.unbilledAmountKrw) - (x.billedAmountKrw + x.unbilledAmountKrw));

    res.json({
      data: { lawyers: merged, range: { from, to } },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/dashboard/ar-aging — 미수금(AR) 연령 분석.
 *
 * 매수금 = 발행되었지만 paid/cancelled/refunded 가 아닌 인보이스의
 * (total - paid_amount).
 *
 * 버킷 (due_date 기준 — 없으면 issued_date):
 *   - current: 0일 이내 (아직 만기 도래 안함)
 *   - bucket_30: 1-30일 경과
 *   - bucket_60: 31-60일 경과
 *   - bucket_90: 61-90일 경과
 *   - bucket_over: 91일+ 경과
 *
 * 의뢰인별로 그룹핑하여 반환. 활성 미수금이 있는 의뢰인만.
 */
router.get("/ar-aging", adminAuth, async (req, res) => {
  try {
    const { sqlite } = require("../db");
    const today = new Date().toISOString().slice(0, 10);

    /* 미수금 인보이스 조회 + 의뢰인 정보 */
    const rows = sqlite.prepare(`
      SELECT
        i.id, i.client_id, i.invoice_no, i.issued_date, i.due_date,
        i.total, i.paid_amount, i.status,
        c.name AS client_name
      FROM invoices i
      LEFT JOIN clients c ON c.id = i.client_id
      WHERE i.status NOT IN ('draft', 'paid', 'cancelled', 'refunded')
        AND i.client_id IS NOT NULL
        AND (i.total - i.paid_amount) > 0
      ORDER BY COALESCE(i.due_date, i.issued_date) ASC
    `).all();

    /* 버킷 분류 + 의뢰인별 합산 */
    const todayMs = new Date(`${today}T00:00:00`).getTime();
    const byClient = new Map();
    const totals = { current: 0, b30: 0, b60: 0, b90: 0, bOver: 0, totalOutstanding: 0, invoiceCount: 0 };
    const invoices = [];

    for (const r of rows) {
      const refDate = r.due_date || r.issued_date;
      let daysOverdue = 0;
      if (refDate) {
        const refMs = new Date(`${refDate}T00:00:00`).getTime();
        daysOverdue = Math.floor((todayMs - refMs) / (24 * 60 * 60 * 1000));
      }
      const outstanding = Math.max(0, (r.total || 0) - (r.paid_amount || 0));
      let bucket = "current";
      if (daysOverdue > 90) bucket = "bOver";
      else if (daysOverdue > 60) bucket = "b90";
      else if (daysOverdue > 30) bucket = "b60";
      else if (daysOverdue > 0) bucket = "b30";

      const inv = {
        id: r.id, invoiceNo: r.invoice_no, clientId: r.client_id, clientName: r.client_name,
        issuedDate: r.issued_date, dueDate: r.due_date,
        total: r.total, paidAmount: r.paid_amount, outstanding,
        status: r.status, daysOverdue, bucket,
      };
      invoices.push(inv);

      if (!byClient.has(r.client_id)) {
        byClient.set(r.client_id, {
          clientId: r.client_id, clientName: r.client_name,
          current: 0, b30: 0, b60: 0, b90: 0, bOver: 0, totalOutstanding: 0, invoiceCount: 0,
        });
      }
      const c = byClient.get(r.client_id);
      c[bucket] += outstanding;
      c.totalOutstanding += outstanding;
      c.invoiceCount += 1;

      totals[bucket] += outstanding;
      totals.totalOutstanding += outstanding;
      totals.invoiceCount += 1;
    }

    /* 합계 내림차순 정렬 */
    const clients = [...byClient.values()].sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    res.json({
      data: { totals, clients, invoices },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/dashboard/overview — 모든 모듈 한눈 요약 (커맨드 센터용).
 *
 * 각 모듈별 카운트 + 오늘 액션 가능한 항목들을 한 번의 호출로 반환.
 * 새 대시보드 (/admin) 에서 메인 위젯으로 사용.
 */
router.get("/overview", adminAuth, async (req, res) => {
  try {
    const { sqlite } = require("../db");
    const today = new Date().toISOString().slice(0, 10);
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);
    const thisMonth = today.slice(0, 7);

    /* 가능한 한 단일 쿼리로 카운트 — 테이블별 count(*) */
    const counts = {};
    const safeCount = (sql) => {
      try { return sqlite.prepare(sql).get()?.n || 0; } catch { return 0; }
    };
    counts.clients = safeCount("SELECT COUNT(*) AS n FROM clients WHERE is_active = 1");
    counts.activeContracts = safeCount("SELECT COUNT(*) AS n FROM contracts WHERE status NOT IN ('cancelled', 'completed')");
    counts.completedContracts = safeCount("SELECT COUNT(*) AS n FROM contracts WHERE status = 'completed'");
    counts.openCases = safeCount("SELECT COUNT(*) AS n FROM case_results WHERE is_published = 0");
    counts.publishedCases = safeCount("SELECT COUNT(*) AS n FROM case_results WHERE is_published = 1");
    counts.publishedBlog = safeCount("SELECT COUNT(*) AS n FROM blog_posts WHERE is_published = 1");
    counts.draftBlog = safeCount("SELECT COUNT(*) AS n FROM blog_posts WHERE is_published = 0");
    counts.pendingConsultations = safeCount("SELECT COUNT(*) AS n FROM consultations WHERE status = 'pending'");
    counts.lawyers = safeCount("SELECT COUNT(*) AS n FROM lawyers WHERE is_active = 1");
    counts.publishedReviews = safeCount("SELECT COUNT(*) AS n FROM reviews WHERE is_published = 1");
    counts.documents = safeCount("SELECT COUNT(*) AS n FROM documents WHERE status != 'archived'");
    counts.unreadMessages = safeCount("SELECT COUNT(*) AS n FROM message_logs WHERE status = 'failed'");

    /* 오늘 일정 */
    const todayCourtDates = sqlite.prepare(`
      SELECT id, title, court_name AS courtName, court_room AS courtRoom,
             starts_at AS startsAt, kind, status, lawyer_id AS lawyerId,
             client_id AS clientId
        FROM court_dates
       WHERE starts_at BETWEEN ? AND ?
         AND status = 'scheduled'
       ORDER BY starts_at ASC
       LIMIT 10
    `).all(todayStart, todayEnd);

    /* 7일 내 다가올 일정 */
    const upcomingCourtDates = sqlite.prepare(`
      SELECT id, title, starts_at AS startsAt, kind, status
        FROM court_dates
       WHERE starts_at > ? AND starts_at <= ?
         AND status = 'scheduled'
       ORDER BY starts_at ASC
       LIMIT 5
    `).all(todayEnd, sevenDaysLater);

    /* 기한 초과 업무 */
    const overdueTasks = sqlite.prepare(`
      SELECT id, title, due_date AS dueDate, priority, assignee_lawyer_id AS assigneeLawyerId
        FROM tasks
       WHERE due_date IS NOT NULL
         AND due_date < ?
         AND status IN ('open', 'in_progress', 'blocked')
       ORDER BY due_date ASC
       LIMIT 5
    `).all(today);

    /* 활성 타이머 */
    const activeTimers = sqlite.prepare(`
      SELECT t.id, t.lawyer_id AS lawyerId, l.name AS lawyerName,
             t.description, t.started_at AS startedAt
        FROM time_entries t
        LEFT JOIN lawyers l ON l.id = t.lawyer_id
       WHERE t.ended_at IS NULL
       ORDER BY t.started_at DESC
       LIMIT 10
    `).all();

    /* ERP 핵심 금액 */
    const [unbilled] = sqlite.prepare(`
      SELECT
        COALESCE(SUM(duration_minutes * hourly_rate_krw / 60), 0) AS amountKrw,
        COUNT(*) AS entryCount
        FROM time_entries
       WHERE billable = 1 AND billed = 0 AND ended_at IS NOT NULL
    `).all();

    const [trustTotal] = sqlite.prepare(`
      SELECT COALESCE(SUM(amount_krw), 0) AS totalKrw,
             COUNT(DISTINCT client_id) AS activeClients
        FROM trust_transactions
       WHERE voided_at IS NULL
    `).all();

    const [arOutstanding] = sqlite.prepare(`
      SELECT COALESCE(SUM(total - paid_amount), 0) AS amountKrw,
             COUNT(*) AS invoiceCount
        FROM invoices
       WHERE status NOT IN ('draft', 'paid', 'cancelled', 'refunded')
         AND (total - paid_amount) > 0
    `).all();

    /* 이번 달 매출(완납 기준 — paid_amount of issued invoices issued this month) */
    const [monthRevenue] = sqlite.prepare(`
      SELECT COALESCE(SUM(paid_amount), 0) AS amountKrw,
             COUNT(*) AS invoiceCount
        FROM invoices
       WHERE substr(COALESCE(issued_date, created_at), 1, 7) = ?
    `).all(thisMonth);

    /* 최근 활동 (recent events 통합) — 의뢰인 등록 / 상담 신청 / 계약 발행 / 블로그 발행 */
    const recentActivity = [];
    try {
      const recents = sqlite.prepare(`
        SELECT 'consultation' AS type, id, name AS title, created_at AS at, status FROM consultations
         ORDER BY created_at DESC LIMIT 5
      `).all();
      recents.forEach((r) => recentActivity.push({ ...r, label: "상담 신청", href: "/admin/bookings" }));
    } catch { /* ignore */ }
    try {
      const recents = sqlite.prepare(`
        SELECT 'client' AS type, id, name AS title, created_at AS at FROM clients
         ORDER BY created_at DESC LIMIT 5
      `).all();
      recents.forEach((r) => recentActivity.push({ ...r, label: "신규 의뢰인", href: `/admin/clients/${r.id}` }));
    } catch { /* ignore */ }
    try {
      const recents = sqlite.prepare(`
        SELECT 'blog' AS type, id, title, published_at AS at FROM blog_posts
         WHERE is_published = 1
         ORDER BY published_at DESC LIMIT 5
      `).all();
      recents.forEach((r) => recentActivity.push({ ...r, label: "블로그 발행", href: "/admin/blog" }));
    } catch { /* ignore */ }
    try {
      const recents = sqlite.prepare(`
        SELECT 'contract' AS type, id, title, updated_at AS at, status FROM contracts
         ORDER BY updated_at DESC LIMIT 5
      `).all();
      recents.forEach((r) => recentActivity.push({ ...r, label: "계약서", href: `/admin/contracts/${r.id}` }));
    } catch { /* ignore */ }
    /* 시간순 정렬 후 상위 8건 */
    recentActivity.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
    const topActivity = recentActivity.slice(0, 8);

    res.json({
      data: {
        counts,
        todayCourtDates,
        upcomingCourtDates,
        overdueTasks,
        activeTimers,
        finance: {
          unbilledAmountKrw: unbilled?.amountKrw || 0,
          unbilledEntryCount: unbilled?.entryCount || 0,
          trustTotalKrw: trustTotal?.totalKrw || 0,
          trustActiveClients: trustTotal?.activeClients || 0,
          arOutstandingKrw: arOutstanding?.amountKrw || 0,
          arInvoiceCount: arOutstanding?.invoiceCount || 0,
          monthRevenueKrw: monthRevenue?.amountKrw || 0,
          monthInvoiceCount: monthRevenue?.invoiceCount || 0,
        },
        recentActivity: topActivity,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
