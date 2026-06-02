/**
 * 블로그 정적 SEO 아티팩트 생성기
 *
 * 운영 Nginx가 frontend/dist를 직접 서빙하는 구조에서도 검색봇이 글 제목,
 * 본문, canonical, Article JSON-LD, sitemap을 즉시 읽을 수 있도록 발행 글마다
 * /blog/:slug/index.html 과 /sitemap.xml, /llms.txt 를 생성한다.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sanitizeRichHtml } = require("../lib/htmlSanitizer");

const SITE_URL = (process.env.SITE_URL || process.env.APP_URL || "https://HIGHLAW.com").replace(/\/+$/, "");
const SITE_NAME = "법무법인 하이로";
const DEFAULT_DESCRIPTION = "법무법인 하이로 - 강남 테헤란로, 불법파견·게임사기·노동·군사건 사건을 변호사가 직접 상담합니다.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const STATIC_MARKER = "<!-- highlaw-static-blog-post -->";

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

function getFrontendDist() {
  return process.env.FRONTEND_DIST_PATH || path.resolve(__dirname, "..", "..", "frontend", "dist");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(value = "/") {
  const raw = String(value || "").trim();
  if (!raw) return SITE_URL;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || ""));
}

function blogPath(slug) {
  return `/blog/${encodePathSegment(slug)}`;
}

function blogUrl(slug) {
  return `${SITE_URL}${blogPath(slug)}`;
}

function dateOnly(value, fallback = new Date()) {
  if (!value) return fallback.toISOString().slice(0, 10);
  const normalized = String(value).replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function dateTime(value) {
  if (!value) return undefined;
  const parsed = new Date(String(value).replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return String(value);
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function descriptionForPost(post) {
  const text = stripHtml(post.seo_description || post.geo_summary || post.excerpt || post.content || DEFAULT_DESCRIPTION);
  return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text || DEFAULT_DESCRIPTION;
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function plainTextToHtml(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((block) => {
      const text = block.trim();
      if (!text) return "";
      const heading = text.match(/^#{1,3}\s+(.+)$/);
      if (heading) return `<h2>${escapeHtml(heading[1])}</h2>`;
      return `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

// 본문이 HTML이면 sanitize-html 화이트리스트로 통과시키고, 아니면 마크다운 비슷한 평문을 안전하게 escape 후 변환한다.
// 정적 HTML은 운영 Nginx가 CSP 없이 직접 서빙하므로, 정규식이 아닌 실제 HTML 파서 기반의 살균기로만 출력해야 한다.
function articleContentHtml(post) {
  const content = String(post.content || "");
  if (/<(?:p|h[1-6]|ul|ol|blockquote|figure|img|table|div|hr|article)\b/i.test(content)) {
    return sanitizeRichHtml(content);
  }
  return plainTextToHtml(content);
}

function normalizePost(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    thumbnail_url: row.thumbnail_url,
    tags: row.tags,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    canonical_url: row.canonical_url,
    og_image_url: row.og_image_url,
    geo_summary: row.geo_summary,
    geo_faq: row.geo_faq,
    geo_keywords: row.geo_keywords,
    is_published: row.is_published,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function postImage(post) {
  return absoluteUrl(post.og_image_url || post.thumbnail_url || DEFAULT_OG_IMAGE);
}

function postCanonical(post) {
  return post.canonical_url ? absoluteUrl(post.canonical_url) : blogUrl(post.slug);
}

function postTitle(post) {
  return `${post.seo_title || post.title} | ${SITE_NAME}`;
}

function articleJsonLd(post) {
  const node = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: descriptionForPost(post),
    image: postImage(post),
    datePublished: dateTime(post.published_at || post.created_at),
    dateModified: dateTime(post.updated_at || post.published_at || post.created_at),
    author: { "@type": "Person", name: post.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postCanonical(post) },
    url: postCanonical(post),
  };
  const keywords = parseJsonArray(post.geo_keywords || post.tags);
  if (keywords.length) node.keywords = keywords.join(", ");
  return node;
}

function breadcrumbJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postCanonical(post) },
    ],
  };
}

function faqJsonLd(post) {
  const faq = parseJsonArray(post.geo_faq)
    .filter((item) => item && item.question && item.answer)
    .slice(0, 8);
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: String(item.question),
      acceptedAnswer: { "@type": "Answer", text: String(item.answer) },
    })),
  };
}

function jsonLdScripts(post) {
  return [articleJsonLd(post), breadcrumbJsonLd(post), faqJsonLd(post)]
    .filter(Boolean)
    .map((node) => `<script type="application/ld+json">${escapeJsonForHtml(node)}</script>`)
    .join("\n    ");
}

function updateMeta(html, selector, tag) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta\\s+${escapedSelector}[^>]*>`, "i");
  return regex.test(html) ? html.replace(regex, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceCanonical(html, canonical) {
  const tag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  return /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, tag)
    : html.replace("</head>", `    ${tag}\n  </head>`);
}

function applyPostHead(html, post) {
  const title = escapeHtml(postTitle(post));
  const description = escapeHtml(descriptionForPost(post));
  const canonicalRaw = postCanonical(post);
  const canonical = escapeHtml(canonicalRaw);
  const image = escapeHtml(postImage(post));
  let next = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  next = replaceCanonical(next, canonicalRaw);
  next = updateMeta(next, 'name="description"', `<meta name="description" content="${description}" />`);
  next = updateMeta(next, 'property="og:title"', `<meta property="og:title" content="${title}" />`);
  next = updateMeta(next, 'property="og:description"', `<meta property="og:description" content="${description}" />`);
  next = updateMeta(next, 'property="og:type"', '<meta property="og:type" content="article" />');
  next = updateMeta(next, 'property="og:url"', `<meta property="og:url" content="${canonical}" />`);
  next = updateMeta(next, 'property="og:image"', `<meta property="og:image" content="${image}" />`);
  next = updateMeta(next, 'name="twitter:title"', `<meta name="twitter:title" content="${title}" />`);
  next = updateMeta(next, 'name="twitter:description"', `<meta name="twitter:description" content="${description}" />`);
  next = updateMeta(next, 'name="twitter:image"', `<meta name="twitter:image" content="${image}" />`);
  next = updateMeta(next, 'property="article:published_time"', `<meta property="article:published_time" content="${escapeHtml(dateTime(post.published_at || post.created_at) || "")}" />`);
  next = updateMeta(next, 'property="article:modified_time"', `<meta property="article:modified_time" content="${escapeHtml(dateTime(post.updated_at || post.published_at || post.created_at) || "")}" />`);
  return next.replace("</head>", `    ${jsonLdScripts(post)}\n  </head>`);
}

function renderStaticArticle(post) {
  const published = dateOnly(post.published_at || post.created_at);
  const tags = parseJsonArray(post.tags);
  const tagHtml = tags.length
    ? `<div class="seo-static-tags">${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  return `${STATIC_MARKER}
    <main class="seo-static-article" style="max-width: 760px; margin: 0 auto; padding: 80px 24px; color: #2a2a2a;">
      <article class="blog-prose" itemscope itemtype="https://schema.org/Article">
        <a href="/blog" style="color: #8c7448; font-size: 13px; text-decoration: none;">블로그 목록</a>
        <h1 itemprop="headline" style="font-size: clamp(2rem, 4vw, 3rem); line-height: 1.35; margin: 28px 0 16px; color: #111827;">${escapeHtml(post.title)}</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 28px;">${escapeHtml(post.author || SITE_NAME)} · ${escapeHtml(published)}</p>
        ${tagHtml}
        ${post.thumbnail_url ? `<figure><img src="${escapeHtml(post.thumbnail_url)}" alt="${escapeHtml(post.title)}" loading="eager" /></figure>` : ""}
        <div itemprop="articleBody">${articleContentHtml(post)}</div>
      </article>
    </main>`;
}

function renderPostHtml(template, post) {
  const withHead = applyPostHead(template, post);
  const article = renderStaticArticle(post);
  return withHead.replace(/<div id="root"><\/div>/i, `<div id="root">\n${article}\n    </div>`);
}

function getPublishedPosts(sqlite) {
  return sqlite.prepare(`
    SELECT *
    FROM blog_posts
    WHERE is_published = 1
    ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC
  `).all().map(normalizePost);
}

function getPublishedQna(sqlite) {
  const table = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'qna_questions'").get();
  if (!table) return [];
  return sqlite.prepare(`
    SELECT slug, updated_at
    FROM qna_questions
    WHERE status = 'published'
    ORDER BY COALESCE(updated_at, created_at) DESC
  `).all();
}

function getActiveQnaCategories(sqlite) {
  const table = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'qna_categories'").get();
  if (!table) return [];
  return sqlite.prepare("SELECT slug FROM qna_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC").all();
}

function removeGeneratedBlogPostPages(dist) {
  const blogDir = path.join(dist, "blog");
  if (!fs.existsSync(blogDir)) return;
  for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(blogDir, entry.name, "index.html");
    if (!fs.existsSync(indexPath)) continue;
    const html = fs.readFileSync(indexPath, "utf8");
    if (html.includes(STATIC_MARKER)) fs.rmSync(path.join(blogDir, entry.name), { recursive: true, force: true });
  }
}

// 정적 HTML 파일은 운영 Nginx가 helmet CSP 없이 직접 서빙한다.
// 디스크에 쓸 때만 per-file nonce + meta CSP를 부여해 — 만에 하나 살균기를 우회한
// 콘텐츠가 들어오더라도 임의 인라인 스크립트가 실행되지 않도록 다층 방어를 둔다.
function injectStaticCsp(html) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const withNonce = html.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://script.google.com",
    "media-src 'self' blob: data:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspDirectives}" />`;
  return withNonce.replace(/<head>/i, `<head>\n    ${cspMeta}`);
}

function writePostPages(dist, template, posts) {
  for (const post of posts) {
    const outDir = path.join(dist, "blog", post.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), injectStaticCsp(renderPostHtml(template, post)), "utf8");
  }
}

/**
 * /blog 허브 페이지를 dist/blog/index.html 로 생성한다.
 *
 * WHY: writePostPages 가 dist/blog/<slug>/ 디렉토리를 만들면서
 * dist/blog/ 디렉토리도 함께 생성된다. 그런데 Vite 빌드는 /blog 경로용
 * index.html 을 만들어주지 않아서 dist/blog/ 안에 index 가 없는 상태가 된다.
 * 이 상태에서 운영 Nginx 가 try_files $uri $uri/ /index.html 로 GET /blog 를
 * 처리하면, /blog/ 디렉토리가 매치되고 그 안의 index 를 찾다가 실패해
 * autoindex 가 꺼져 있는 기본 설정에서는 403 Forbidden 을 돌려준다.
 * (Google Search Console 의 "액세스 금지(403)로 인해 차단됨" 경고 원인)
 *
 * 빈 인덱스를 같이 깔아두면 Nginx 가 정상적으로 SPA 셸을 서빙한다.
 */
function writeBlogHubPage(dist, template) {
  const blogDir = path.join(dist, "blog");
  fs.mkdirSync(blogDir, { recursive: true });
  const seo = {
    title: `법률칼럼 | ${SITE_NAME}`,
    description: "불법파견·게임사기·노동·군사건 분야의 실무 법률 칼럼과 최신 이슈를 확인하세요.",
  };
  const url = `${SITE_URL}/blog`;
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const escapedUrl = escapeHtml(url);
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = replaceCanonical(html, url);
  html = updateMeta(html, 'name="description"', `<meta name="description" content="${description}" />`);
  html = updateMeta(html, 'property="og:title"', `<meta property="og:title" content="${title}" />`);
  html = updateMeta(html, 'property="og:description"', `<meta property="og:description" content="${description}" />`);
  html = updateMeta(html, 'property="og:url"', `<meta property="og:url" content="${escapedUrl}" />`);
  html = updateMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${title}" />`);
  html = updateMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${description}" />`);
  fs.writeFileSync(path.join(blogDir, "index.html"), injectStaticCsp(html), "utf8");
}

function writeSitemap(dist, posts, qnaCategories, qnaQuestions) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  function addUrl(loc, lastmod, changefreq, priority) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);
    lines.push(`    <lastmod>${escapeXml(lastmod || today)}</lastmod>`);
    lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
    lines.push(`    <priority>${escapeXml(priority)}</priority>`);
    lines.push("  </url>");
  }

  for (const page of STATIC_PAGES) {
    addUrl(`${SITE_URL}${page.path}`, today, page.changefreq, page.priority);
  }
  for (const post of posts) {
    addUrl(blogUrl(post.slug), dateOnly(post.updated_at || post.published_at || post.created_at), "monthly", "0.7");
  }
  for (const category of qnaCategories) {
    addUrl(`${SITE_URL}/qna/category/${encodePathSegment(category.slug)}`, today, "weekly", "0.7");
  }
  for (const question of qnaQuestions) {
    addUrl(`${SITE_URL}/qna/question/${encodePathSegment(question.slug)}`, dateOnly(question.updated_at), "monthly", "0.7");
  }

  lines.push("</urlset>");
  fs.writeFileSync(path.join(dist, "sitemap.xml"), `${lines.join("\n")}\n`, "utf8");
}

function writeLlmsTxt(dist, posts) {
  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> 서초역 인근 법률사무소의 건설, 부동산, 민사, 형사, 행정 분야 실무 해설과 법률 칼럼.",
    "",
    "## Core Pages",
    `- [홈](${SITE_URL}/): 법무법인 하이로 대표 페이지`,
    `- [업무분야](${SITE_URL}/practice): 주요 법률 서비스 분야`,
    `- [블로그](${SITE_URL}/blog): 법률 칼럼 목록`,
    "",
    "## Blog Articles",
  ];

  for (const post of posts) {
    lines.push(`- [${post.title}](${blogUrl(post.slug)}): ${descriptionForPost(post)}`);
  }

  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  fs.writeFileSync(path.join(dist, "llms.txt"), `${lines.join("\n")}\n`, "utf8");
}

function writeRenderManifest(dist, posts) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    blogPosts: posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      updatedAt: post.updated_at,
    })),
  };
  fs.writeFileSync(path.join(dist, "blog-static-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function syncPublishedBlogStaticArtifacts(sqlite) {
  const dist = getFrontendDist();
  const indexPath = path.join(dist, "index.html");
  if (!fs.existsSync(indexPath)) return { skipped: true, reason: "frontend-dist-missing" };

  const template = fs.readFileSync(indexPath, "utf8");
  const posts = getPublishedPosts(sqlite);
  const qnaCategories = getActiveQnaCategories(sqlite);
  const qnaQuestions = getPublishedQna(sqlite);

  removeGeneratedBlogPostPages(dist);
  writePostPages(dist, template, posts);
  // /blog 허브 인덱스 — nginx 가 dist/blog/ 디렉토리 진입 시 403 을 내지 않도록
  // 빈 SPA 셸을 같이 깔아둔다. (writePostPages 뒤에 호출해 디렉토리 생성을 보장)
  writeBlogHubPage(dist, template);
  writeSitemap(dist, posts, qnaCategories, qnaQuestions);
  writeLlmsTxt(dist, posts);
  writeRenderManifest(dist, posts);

  return {
    skipped: false,
    posts: posts.length,
    qnaCategories: qnaCategories.length,
    qnaQuestions: qnaQuestions.length,
    dist,
  };
}

module.exports = {
  syncPublishedBlogStaticArtifacts,
  renderPostHtml,
  descriptionForPost,
  articleContentHtml,
};
