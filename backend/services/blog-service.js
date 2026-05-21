/**
 * 블로그 서비스 — 블로그/법률 칼럼 CRUD 비즈니스 로직
 */
const crypto = require("crypto");
const { db, sqlite } = require("../db");
const { blogPosts, blogPostVersions } = require("../db/schema");
const { eq, desc, and, count, max, lte } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
} = require("./helpers");
const { syncPublishedBlogStaticArtifacts } = require("./blog-static-renderer");
const { sanitizeRichHtml } = require("../lib/htmlSanitizer");

// 본문 HTML은 DB 저장 전에 화이트리스트 기반 살균기로 통과시켜
// 저장 시점부터 안전한 HTML만 보관한다. (정적 SEO 페이지·React 클라이언트 양쪽에서
// 동일한 결과를 보장하고, 정규식 우회 페이로드를 원천 차단한다.)
function sanitizePostContent(content) {
  if (content === undefined || content === null) return content;
  return sanitizeRichHtml(content);
}

function syncBlogStaticArtifacts(reason) {
  if (process.env.NODE_ENV === "test" && process.env.SYNC_BLOG_STATIC_IN_TEST !== "1") {
    return;
  }
  try {
    const result = syncPublishedBlogStaticArtifacts(sqlite);
    if (!result.skipped) {
      console.log(`[blog-static] ${reason}: ${result.posts} blog pages, sitemap.xml, llms.txt synced`);
    }
  } catch (e) {
    console.warn(`[blog-static] ${reason} failed:`, e.message);
  }
}

/**
 * 제목에서 URL-safe 슬러그를 생성한다.
 * 한글은 유지하고 특수문자만 제거, 타임스탬프 접미사를 붙여 유일성 보장.
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

function normalizeSlug(slug) {
  if (!slug) return null;
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || null;
}

const BLOG_SLUG_ALIASES = {
  "construction-defect-liability": "construction-defect-liability-strategy",
  "contract-cancellation-damages": "real-estate-sale-contract-cancellation",
  "inheritance-disclaim-vs-limited": "inheritance-renunciation-limited-approval",
  "search-seizure-response": "criminal-complaint-guide",
};

function resolveBlogSlug(slug) {
  const normalized = normalizeSlug(slug);
  return BLOG_SLUG_ALIASES[normalized] || normalized;
}

function normalizeTags(tags) {
  if (tags === undefined) return undefined;
  if (tags === null || tags === "") return null;
  let arr = tags;
  if (typeof tags === "string") {
    try {
      arr = JSON.parse(tags);
    } catch {
      arr = tags.split(",");
    }
  }
  if (!Array.isArray(arr)) arr = [arr];
  const cleaned = [...new Set(arr
    .map((tag) => String(tag || "").trim())
    .filter(Boolean))]
    .slice(0, 20)
    .map((tag) => tag.slice(0, 40));
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function normalizeFootnotes(footnotes) {
  if (footnotes === undefined) return undefined;
  if (footnotes === null || footnotes === "") return null;
  let value = footnotes;
  if (typeof footnotes === "string") {
    try {
      value = JSON.parse(footnotes);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .filter((item) => item && typeof item === "object" && item.id)
    .map((item, index) => ({
      id: String(item.id).slice(0, 80),
      number: Number.isFinite(Number(item.number)) ? Number(item.number) : index + 1,
      content: String(item.content || "").slice(0, 4000),
    }));
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function normalizeGeoFaq(faq) {
  if (faq === undefined) return undefined;
  if (faq === null || faq === "") return null;
  let value = faq;
  if (typeof faq === "string") {
    try {
      value = JSON.parse(faq);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .filter((item) => item && typeof item === "object" && item.question && item.answer)
    .map((item) => ({
      question: String(item.question || "").trim().slice(0, 240),
      answer: String(item.answer || "").trim().slice(0, 1200),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 8);
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function normalizeGeoKeywords(keywords) {
  if (keywords === undefined) return undefined;
  if (keywords === null || keywords === "") return null;
  let arr = keywords;
  if (typeof keywords === "string") {
    try {
      arr = JSON.parse(keywords);
    } catch {
      arr = keywords.split(",");
    }
  }
  if (!Array.isArray(arr)) arr = [arr];
  const cleaned = [...new Set(arr
    .map((keyword) => String(keyword || "").trim())
    .filter(Boolean))]
    .slice(0, 30)
    .map((keyword) => keyword.slice(0, 80));
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function isFutureTimestamp(value, now = nowTimestamp()) {
  return Boolean(value && value > now);
}

async function publishDueScheduledPosts() {
  const now = nowTimestamp();
  const dueRows = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(
      eq(blogPosts.isPublished, 0),
      lte(blogPosts.scheduledPublishAt, now),
    ));

  if (dueRows.length === 0) return { published: 0 };

  await db
    .update(blogPosts)
    .set({
      isPublished: 1,
      publishedAt: now,
      scheduledPublishAt: null,
      updatedAt: now,
    })
    .where(and(
      eq(blogPosts.isPublished, 0),
      lte(blogPosts.scheduledPublishAt, now),
    ));

  syncBlogStaticArtifacts("publishDueScheduledPosts");
  return { published: dueRows.length };
}

/**
 * 게시글 목록 조회 (페이지네이션 + 카테고리 필터)
 * @param {object} filters - { page, limit, category, all }
 * @returns {{ items: Array, meta: object }}
 */
async function listPosts(filters) {
  await publishDueScheduledPosts();
  const includeUnpublished = filters.all === "true";
  const paginationFilters = includeUnpublished && !filters.limit
    ? { ...filters, limit: 500 }
    : filters;
  const { page, limit, offset } = parsePagination(paginationFilters, { maxLimit: includeUnpublished ? 500 : 50 });

  const conditions = [];
  if (!includeUnpublished) {
    conditions.push(eq(blogPosts.isPublished, 1));
  }
  if (filters.category) {
    conditions.push(eq(blogPosts.category, filters.category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ total: count() })
    .from(blogPosts)
    .where(where);

  let rows;
  if (includeUnpublished) {
    rows = await db
      .select()
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        category: blogPosts.category,
        excerpt: blogPosts.excerpt,
        author: blogPosts.author,
        thumbnailUrl: blogPosts.thumbnailUrl,
        tags: blogPosts.tags,
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription,
        canonicalUrl: blogPosts.canonicalUrl,
        ogImageUrl: blogPosts.ogImageUrl,
        isPublished: blogPosts.isPublished,
        viewCount: blogPosts.viewCount,
        publishedAt: blogPosts.publishedAt,
        scheduledPublishAt: blogPosts.scheduledPublishAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return {
    items: rows,
    meta: buildPaginationMeta(totalResult.total, page, limit),
  };
}

function viewEventDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function countViewEvents(postId) {
  const row = sqlite
    .prepare("SELECT COUNT(*) AS c FROM blog_view_events WHERE post_id = ?")
    .get(postId);
  return row?.c || 0;
}

function effectiveViewCount(post) {
  return Math.max(post.viewCount || 0, countViewEvents(post.id));
}

/**
 * 슬러그로 게시글을 조회한다. 조회수 증가는 registerView에서만 처리한다.
 * @param {string} slug
 * @param {{ includeUnpublished?: boolean }} options - 비공개 포함 여부
 * @returns {object} 게시글
 */
async function getPost(slug, options = {}) {
  await publishDueScheduledPosts();
  const resolvedSlug = resolveBlogSlug(slug);
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, resolvedSlug));

  if (!post) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }
  if (!options.includeUnpublished && !post.isPublished) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  return { ...post, viewCount: effectiveViewCount(post) };
}

async function registerView(slug, options = {}) {
  const resolvedSlug = resolveBlogSlug(slug);
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, resolvedSlug));

  if (!post) throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  if (!post.isPublished) throw new ServiceError("게시글을 찾을 수 없습니다", 404);

  let counted = false;
  if (!options.skipIncrement) {
    const dateKey = viewEventDateKey();
    const eventKey = `${post.id}:${options.visitorId || "unknown"}:${dateKey}`;
    const result = sqlite.prepare(`
      INSERT OR IGNORE INTO blog_view_events (
        id, post_id, slug, visitor_id, event_key, referrer, user_agent, ip_masked, ip_hash, session_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      crypto.randomUUID(),
      post.id,
      post.slug,
      options.visitorId || "unknown",
      eventKey,
      options.referrer || null,
      options.userAgent || null,
      options.ipMasked || null,
      options.ipHash || null,
      options.sessionId || null,
    );
    counted = result.changes > 0;
  }

  const nextViewCount = effectiveViewCount(post);
  if (nextViewCount > (post.viewCount || 0)) {
    await db
      .update(blogPosts)
      .set({ viewCount: nextViewCount })
      .where(eq(blogPosts.id, post.id));
  }

  return { ...post, viewCount: nextViewCount, _counted: counted };
}

/**
 * 게시글 생성
 * @param {object} data - { title, content, slug?, category?, excerpt?, author?, thumbnailUrl?, isPublished? }
 * @returns {object} 생성된 게시글
 */
async function createPost(data) {
  const {
    title, category, excerpt, content, author, thumbnailUrl,
    seoTitle, seoDescription, canonicalUrl, ogImageUrl, footnotes,
    geoSummary, geoFaq, geoKeywords,
    isPublished, slug: customSlug, tags,
    scheduledPublishAt,
  } = data;

  if (!title || !content) {
    throw new ServiceError("title과 content는 필수입니다", 400);
  }

  const slug = normalizeSlug(customSlug) || generateSlug(title);
  const now = nowTimestamp();
  const normalizedScheduledAt = normalizeTimestamp(scheduledPublishAt);
  const shouldSchedule = isFutureTimestamp(normalizedScheduledAt, now);
  const shouldPublish = Boolean(isPublished) && !shouldSchedule;
  const sanitizedContent = sanitizePostContent(content);

  try {
    const [inserted] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        category: category ?? "construction_realestate",
        excerpt: excerpt ?? null,
        content: sanitizedContent,
        author: author ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        tags: normalizeTags(tags) ?? null,
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        canonicalUrl: canonicalUrl ?? null,
        ogImageUrl: ogImageUrl ?? null,
        geoSummary: geoSummary ?? null,
        geoFaq: normalizeGeoFaq(geoFaq) ?? null,
        geoKeywords: normalizeGeoKeywords(geoKeywords) ?? null,
        footnotes: normalizeFootnotes(footnotes) ?? null,
        isPublished: shouldPublish ? 1 : 0,
        publishedAt: shouldPublish ? now : null,
        scheduledPublishAt: shouldSchedule ? normalizedScheduledAt : null,
      })
      .returning();

    syncBlogStaticArtifacts("createPost");
    return inserted;
  } catch (e) {
    if (e.message?.includes("UNIQUE constraint")) {
      throw new ServiceError("이미 존재하는 슬러그입니다", 409);
    }
    throw e;
  }
}

async function snapshotPostVersion(post, createdBy = "admin") {
  const [latest] = await db
    .select({ versionNo: max(blogPostVersions.versionNo) })
    .from(blogPostVersions)
    .where(eq(blogPostVersions.postId, post.id));
  const versionNo = (latest?.versionNo || 0) + 1;

  const [version] = await db
    .insert(blogPostVersions)
    .values({
      postId: post.id,
      versionNo,
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt ?? null,
      content: post.content,
      author: post.author ?? null,
      thumbnailUrl: post.thumbnailUrl ?? null,
      tags: post.tags ?? null,
      seoTitle: post.seoTitle ?? null,
      seoDescription: post.seoDescription ?? null,
      canonicalUrl: post.canonicalUrl ?? null,
      ogImageUrl: post.ogImageUrl ?? null,
      geoSummary: post.geoSummary ?? null,
      geoFaq: post.geoFaq ?? null,
      geoKeywords: post.geoKeywords ?? null,
      footnotes: post.footnotes ?? null,
      isPublished: post.isPublished ? 1 : 0,
      publishedAt: post.publishedAt ?? null,
      scheduledPublishAt: post.scheduledPublishAt ?? null,
      createdBy,
    })
    .returning();

  return version;
}

/**
 * 게시글 수정
 * @param {string} id - 게시글 UUID
 * @param {object} data - 수정할 필드
 * @returns {object} 수정된 게시글
 */
async function updatePost(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  const updateData = {};
  await snapshotPostVersion(existing, data.updatedBy || "admin");

  const allowedFields = [
    "title", "slug", "category", "excerpt", "content", "author", "thumbnailUrl",
    "tags", "seoTitle", "seoDescription", "canonicalUrl", "ogImageUrl", "isPublished",
    "scheduledPublishAt", "footnotes", "geoSummary", "geoFaq", "geoKeywords",
  ];
  for (const key of allowedFields) {
    if (key in data) updateData[key] = data[key];
  }
  if ("slug" in updateData) updateData.slug = normalizeSlug(updateData.slug) || existing.slug;
  if ("tags" in updateData) updateData.tags = normalizeTags(updateData.tags);
  if ("footnotes" in updateData) updateData.footnotes = normalizeFootnotes(updateData.footnotes);
  if ("geoFaq" in updateData) updateData.geoFaq = normalizeGeoFaq(updateData.geoFaq);
  if ("geoKeywords" in updateData) updateData.geoKeywords = normalizeGeoKeywords(updateData.geoKeywords);
  if ("scheduledPublishAt" in updateData) updateData.scheduledPublishAt = normalizeTimestamp(updateData.scheduledPublishAt);
  if ("content" in updateData) updateData.content = sanitizePostContent(updateData.content);

  // 발행 상태 변경 시 publishedAt 설정
  if ("isPublished" in data || "scheduledPublishAt" in data) {
    const scheduledAt = "scheduledPublishAt" in updateData ? updateData.scheduledPublishAt : existing.scheduledPublishAt;
    const shouldSchedule = isFutureTimestamp(scheduledAt);
    const shouldPublish = Boolean(data.isPublished) && !shouldSchedule;
    updateData.isPublished = shouldPublish ? 1 : 0;
    updateData.scheduledPublishAt = shouldSchedule ? scheduledAt : null;
    if (shouldPublish && !existing.publishedAt) {
      updateData.publishedAt = nowTimestamp();
    }
  }

  updateData.updatedAt = nowTimestamp();

  const [updated] = await db
    .update(blogPosts)
    .set(updateData)
    .where(eq(blogPosts.id, id))
    .returning();

  syncBlogStaticArtifacts("updatePost");
  return updated;
}

async function listVersions(postId) {
  validateUUID(postId);
  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, postId));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  const rows = await db
    .select()
    .from(blogPostVersions)
    .where(eq(blogPostVersions.postId, postId))
    .orderBy(desc(blogPostVersions.versionNo));

  return rows;
}

async function restoreVersion(postId, versionNo, restoredBy = "admin") {
  validateUUID(postId);
  const parsedVersionNo = parseInt(versionNo, 10);
  if (!Number.isInteger(parsedVersionNo) || parsedVersionNo < 1) {
    throw new ServiceError("유효하지 않은 버전 번호입니다", 400);
  }

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, postId));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  const [version] = await db
    .select()
    .from(blogPostVersions)
    .where(and(eq(blogPostVersions.postId, postId), eq(blogPostVersions.versionNo, parsedVersionNo)));

  if (!version) {
    throw new ServiceError("버전을 찾을 수 없습니다", 404);
  }

  await snapshotPostVersion(existing, restoredBy);

  const [restored] = await db
    .update(blogPosts)
    .set({
      title: version.title,
      slug: version.slug,
      category: version.category,
      excerpt: version.excerpt ?? null,
      content: sanitizePostContent(version.content),
      author: version.author ?? null,
      thumbnailUrl: version.thumbnailUrl ?? null,
      tags: version.tags ?? null,
      seoTitle: version.seoTitle ?? null,
      seoDescription: version.seoDescription ?? null,
      canonicalUrl: version.canonicalUrl ?? null,
      ogImageUrl: version.ogImageUrl ?? null,
      geoSummary: version.geoSummary ?? null,
      geoFaq: version.geoFaq ?? null,
      geoKeywords: version.geoKeywords ?? null,
      footnotes: version.footnotes ?? null,
      isPublished: version.isPublished ? 1 : 0,
      publishedAt: version.publishedAt ?? null,
      scheduledPublishAt: version.scheduledPublishAt ?? null,
      updatedAt: nowTimestamp(),
    })
    .where(eq(blogPosts.id, postId))
    .returning();

  syncBlogStaticArtifacts("restoreVersion");
  return restored;
}

/**
 * 게시글 삭제
 * @param {string} id - 게시글 UUID
 * @returns {{ deleted: true }}
 */
async function deletePost(id) {
  validateUUID(id);

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!existing) {
    throw new ServiceError("게시글을 찾을 수 없습니다", 404);
  }

  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  syncBlogStaticArtifacts("deletePost");
  return { deleted: true };
}

module.exports = {
  generateSlug,
  listPosts,
  getPost,
  registerView,
  createPost,
  updatePost,
  deletePost,
  listVersions,
  restoreVersion,
  publishDueScheduledPosts,
  normalizeTags,
  normalizeFootnotes,
  normalizeGeoFaq,
  normalizeGeoKeywords,
  normalizeSlug,
  resolveBlogSlug,
  BLOG_SLUG_ALIASES,
};
