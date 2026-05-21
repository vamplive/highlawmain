/**
 * 대시보드 API 라우트 — 문서 통계, 유형별/상태별 집계
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { adminAuth } = require("../lib/auth");
const {
  documents,
  categories,
  documentCategories,
} = require("../db/schema");
const { eq, desc, sql, gte, count } = require("drizzle-orm");

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

module.exports = router;
