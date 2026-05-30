/**
 * 사이트맵 XML 생성 라우트 — SEO용 동적 사이트맵
 * - 정적 페이지 + 블로그 글 + Q&A
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const { db } = require("../db");
const { blogPosts, qnaCategories, qnaQuestions } = require("../db/schema");
const { eq } = require("drizzle-orm");

const router = Router();

/**
 * 사이트 기본 URL (환경변수 또는 기본값).
 * 프론트엔드 lib/seo.js의 VITE_SITE_URL 기본값과 반드시 동일하게 유지.
 */
const SITE_URL = (process.env.SITE_URL || "https://highlaw.co.kr").replace(/\/+$/, "");

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || ""));
}

function buildLoc(path) {
  return escapeXml(`${SITE_URL}${path}`);
}

function dateOnly(value, fallback = new Date()) {
  if (!value) return fallback.toISOString().slice(0, 10);
  const parsed = new Date(String(value).replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** 정적 페이지 목록 (path, 변경 빈도, 우선순위) */
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/practice", changefreq: "monthly", priority: "0.8" },
  { path: "/practice/construction", changefreq: "monthly", priority: "0.8" },
  { path: "/practice/realestate", changefreq: "monthly", priority: "0.8" },
  { path: "/lawyers", changefreq: "monthly", priority: "0.7" },
  { path: "/consultation", changefreq: "monthly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/qna", changefreq: "weekly", priority: "0.8" },
  { path: "/qna/ask", changefreq: "monthly", priority: "0.6" },
  { path: "/reviews", changefreq: "monthly", priority: "0.6" },
];

/**
 * GET /api/sitemap — XML 사이트맵 생성
 */
router.get("/", async (req, res) => {
  try {
    // 공개된 블로그 글 조회
    const posts = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, 1));

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 정적 페이지
    for (const page of STATIC_PAGES) {
      xml += `  <url>\n`;
      xml += `    <loc>${buildLoc(page.path)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 블로그 글
    for (const post of posts) {
      const lastmod = dateOnly(post.updatedAt, new Date());
      xml += `  <url>\n`;
      xml += `    <loc>${buildLoc(`/blog/${encodePathSegment(post.slug)}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // Q&A 카테고리 (활성)
    const qnaCats = await db
      .select({ slug: qnaCategories.slug })
      .from(qnaCategories)
      .where(eq(qnaCategories.isActive, 1));
    for (const c of qnaCats) {
      xml += `  <url>\n`;
      xml += `    <loc>${buildLoc(`/qna/category/${encodePathSegment(c.slug)}`)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    // Q&A 공개 질문
    const qnaPublished = await db
      .select({ slug: qnaQuestions.slug, updatedAt: qnaQuestions.updatedAt })
      .from(qnaQuestions)
      .where(eq(qnaQuestions.status, "published"));
    for (const q of qnaPublished) {
      const lastmod = dateOnly(q.updatedAt, new Date());
      xml += `  <url>\n`;
      xml += `    <loc>${buildLoc(`/qna/question/${encodePathSegment(q.slug)}`)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
