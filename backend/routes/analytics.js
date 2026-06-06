/**
 * 분석(Analytics) API 라우트 — 페이지뷰 통계, 상위 페이지, 리퍼러, 전환율, CSV 내보내기
 * - page_views 테이블 기반 집계 쿼리
 * - 기간 필터: 7d, 30d, 90d
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { sqlite } = require("../db");
const { adminAuth, adminOrPortalAuth } = require("../lib/auth");

const router = Router();

/** 기간 문자열을 SQLite date modifier로 변환 */
const PERIOD_MAP = {
  "7d": "-7 days",
  "30d": "-30 days",
  "90d": "-90 days",
};

/**
 * 기간 파라미터를 SQLite 날짜 modifier로 변환
 * @param {string} period - "7d" | "30d" | "90d"
 * @returns {string} SQLite date modifier (기본값: "-7 days")
 */
function getPeriodModifier(period) {
  return PERIOD_MAP[period] || PERIOD_MAP["7d"];
}

function parseSearchKeyword(referrer = "") {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "");
    const searchParamNames = ["q", "query", "p", "keyword", "search_query", "wd"];
    const keyword = searchParamNames
      .map((name) => url.searchParams.get(name))
      .find(Boolean);
    if (!keyword) return "";
    return `${keyword.trim()} (${host})`;
  } catch {
    return "";
  }
}

function describeUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const browser = ua.includes("Edg/") ? "Edge"
    : ua.includes("Chrome/") ? "Chrome"
      : ua.includes("Safari/") ? "Safari"
        : ua.includes("Firefox/") ? "Firefox"
          : "Unknown";
  const os = ua.includes("Windows") ? "Windows"
    : ua.includes("Mac OS") ? "macOS"
      : ua.includes("Android") ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
          : "Unknown";
  return `${browser} · ${os}`;
}

/**
 * GET /overview?period=7d — 전체 통계 개요
 * - totalViews: 총 페이지뷰
 * - uniqueVisitors: 고유 방문자 수 (session_id 기준)
 * - viewsPerDay: 일별 조회수 배열 [{date, count}]
 */
router.get("/overview", adminAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);

    const totals = sqlite.prepare(`
      SELECT
        COUNT(*) as totalViews,
        COUNT(DISTINCT session_id) as uniqueVisitors
      FROM page_views
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const viewsPerDay = sqlite.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(modifier);

    res.json({
      data: {
        totalViews: totals.totalViews,
        uniqueVisitors: totals.uniqueVisitors,
        viewsPerDay,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /pages?period=7d&limit=10 — 상위 페이지별 조회수
 */
router.get("/pages", adminAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const rows = sqlite.prepare(`
      SELECT
        page,
        path,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as uniqueViews
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      GROUP BY page, path
      ORDER BY views DESC
      LIMIT ?
    `).all(modifier, limit);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /referrers?period=7d&limit=10 — 상위 리퍼러 도메인
 */
router.get("/referrers", adminAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const rows = sqlite.prepare(`
      SELECT
        referrer,
        COUNT(*) as count
      FROM page_views
      WHERE created_at >= datetime('now', ?)
        AND referrer IS NOT NULL
        AND referrer != ''
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT ?
    `).all(modifier, limit);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /blog-posts/:id?period=30d — 특정 블로그 게시글 독자/검색어 분석
 * - 실제 실명은 공개 방문만으로 식별할 수 없으므로 세션, 마스킹 IP, UA 기준으로 표시
 */
router.get("/blog-posts/:id", adminOrPortalAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");
    const post = sqlite.prepare("SELECT id, title, slug, view_count FROM blog_posts WHERE id = ?").get(req.params.id);
    if (!post) {
      return res.status(404).json({ data: null, error: "게시글을 찾을 수 없습니다", meta: null });
    }

    const rows = sqlite.prepare(`
      SELECT id, slug, visitor_id, referrer, user_agent, ip_masked, ip_hash, session_id, created_at
      FROM blog_view_events
      WHERE post_id = ?
        AND created_at >= datetime('now', ?)
      ORDER BY created_at DESC
      LIMIT 500
    `).all(post.id, modifier);

    const readerMap = new Map();
    const keywordMap = new Map();
    const referrerMap = new Map();

    for (const row of rows) {
      const readerKey = row.visitor_id || row.session_id || `${row.ip_hash}:${row.user_agent}`;
      const keyword = parseSearchKeyword(row.referrer);
      const referrer = row.referrer || "";

      if (!readerMap.has(readerKey)) {
        readerMap.set(readerKey, {
          sessionId: row.session_id || "",
          visitorId: row.visitor_id || "",
          ip: row.ip_masked || "",
          ipHash: row.ip_hash || "",
          userAgent: describeUserAgent(row.user_agent),
          referrer,
          keyword,
          reads: 0,
          firstReadAt: row.created_at,
          lastReadAt: row.created_at,
        });
      }
      const reader = readerMap.get(readerKey);
      reader.reads += 1;
      reader.firstReadAt = row.created_at < reader.firstReadAt ? row.created_at : reader.firstReadAt;
      reader.lastReadAt = row.created_at > reader.lastReadAt ? row.created_at : reader.lastReadAt;
      if (!reader.keyword && keyword) reader.keyword = keyword;
      if (!reader.referrer && referrer) reader.referrer = referrer;

      if (keyword) keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
      if (referrer) referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
    }

    const toSortedList = (map, keyName) => [...map.entries()]
      .map(([value, count]) => ({ [keyName]: value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json({
      data: {
        post,
        path: `/blog/${post.slug}`,
        totalLoggedViews: rows.length,
        cumulativeViewCount: post.view_count || 0,
        uniqueReaders: readerMap.size,
        readers: [...readerMap.values()].slice(0, 100),
        searchKeywords: toSortedList(keywordMap, "keyword"),
        referrers: toSortedList(referrerMap, "referrer"),
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /blog-overview?period=30d — 전체 블로그 조회 분석
 */
router.get("/blog-overview", adminOrPortalAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");
    const posts = sqlite.prepare(`
      SELECT id, title, slug, category, view_count, published_at, created_at
      FROM blog_posts
      ORDER BY view_count DESC, published_at DESC, created_at DESC
    `).all();
    const rows = sqlite.prepare(`
      SELECT slug, visitor_id, referrer, user_agent, ip_hash, session_id, created_at
      FROM blog_view_events
      WHERE created_at >= datetime('now', ?)
      ORDER BY created_at DESC
      LIMIT 2000
    `).all(modifier);

    const postBySlug = new Map(posts.map((post) => [post.slug, post]));
    const postStats = new Map(posts.map((post) => [post.id, {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      cumulativeViewCount: post.view_count || 0,
      loggedViews: 0,
      uniqueReaders: new Set(),
    }]));
    const keywordMap = new Map();
    const referrerMap = new Map();
    const readerSet = new Set();

    for (const row of rows) {
      const post = postBySlug.get(row.slug);
      if (!post) continue;
      const readerKey = row.visitor_id || row.session_id || `${row.ip_hash}:${row.user_agent}`;
      const stats = postStats.get(post.id);
      stats.loggedViews += 1;
      stats.uniqueReaders.add(readerKey);
      readerSet.add(readerKey);

      const keyword = parseSearchKeyword(row.referrer);
      if (keyword) keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1);
      if (row.referrer) referrerMap.set(row.referrer, (referrerMap.get(row.referrer) || 0) + 1);
    }

    const toSortedList = (map, keyName) => [...map.entries()]
      .map(([value, count]) => ({ [keyName]: value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topPosts = [...postStats.values()]
      .map((item) => ({ ...item, uniqueReaders: item.uniqueReaders.size }))
      .sort((a, b) => b.cumulativeViewCount - a.cumulativeViewCount || b.loggedViews - a.loggedViews)
      .slice(0, 20);

    res.json({
      data: {
        totalPosts: posts.length,
        cumulativeViewCount: posts.reduce((sum, post) => sum + (post.view_count || 0), 0),
        totalLoggedViews: rows.length,
        uniqueReaders: readerSet.size,
        topPosts,
        searchKeywords: toSortedList(keywordMap, "keyword"),
        referrers: toSortedList(referrerMap, "referrer"),
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /consultations/conversion?period=30d — 페이지뷰 대비 상담 신청 전환율
 * - views: 기간 내 총 페이지뷰
 * - consultations: 기간 내 상담 신청 수
 * - conversionRate: 전환율 (%)
 */
router.get("/consultations/conversion", adminAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");

    const { totalViews } = sqlite.prepare(`
      SELECT COUNT(*) as totalViews
      FROM page_views
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const { totalConsultations } = sqlite.prepare(`
      SELECT COUNT(*) as totalConsultations
      FROM consultations
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const conversionRate = totalViews > 0
      ? Math.round((totalConsultations / totalViews) * 10000) / 100
      : 0;

    res.json({
      data: {
        views: totalViews,
        consultations: totalConsultations,
        conversionRate,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /export?period=30d — CSV 내보내기
 * - Content-Type: text/csv
 */
router.get("/export", adminAuth, (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");

    const rows = sqlite.prepare(`
      SELECT id, page, path, referrer, user_agent, ip, session_id, created_at
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      ORDER BY created_at DESC
    `).all(modifier);

    // CSV 헤더
    const headers = ["id", "page", "path", "referrer", "user_agent", "ip", "session_id", "created_at"];
    const csvLines = [headers.join(",")];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h] ?? "";
        // 쉼표나 따옴표 포함 시 이스케이프
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=page-views.csv");
    res.send(csvLines.join("\n"));
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
