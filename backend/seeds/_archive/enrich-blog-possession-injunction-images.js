const crypto = require("crypto");

const TARGET_TITLE = "점유이전금지가처분과 명도단행가처분, 무엇이 어떻게 다른가";
const UPDATED_BY = "image-enrichment-2026-05-04";
const MARKER_PAGE = "system";
const MARKER_SECTION = "possession_injunction_blog_images_version";
const VERSION = "possession-injunction-blog-images-2026-05-04-v1";

const FIGURES = [
  {
    src: "/blog-images/possession-transfer-prohibition-injunction.png",
    alt: "점유이전금지가처분으로 현재 점유 상태를 보전하는 장면",
    caption: "점유이전금지가처분은 본안판결 전 점유자가 바뀌는 위험을 막기 위해 현재 점유 상태를 고정하는 절차입니다.",
    before: ["<hr><h2>Ⅰ. 두 가처분의 개념과 법적 성격</h2>", "<h2>Ⅰ. 두 가처분의 개념과 법적 성격</h2>"],
  },
  {
    src: "/blog-images/provisional-injunction-comparison.png",
    alt: "점유이전금지가처분과 명도단행가처분의 효과를 비교한 법률 일러스트",
    caption: "두 가처분은 모두 명도 분쟁에서 쓰이지만, 현상 보전과 실제 인도라는 효과가 다릅니다.",
    before: ["<hr><h2>Ⅲ. 신청서 작성 실무", "<h2>Ⅲ. 신청서 작성 실무"],
  },
  {
    src: "/blog-images/eviction-provisional-disposition-strategy.png",
    alt: "명도단행가처분 신청에서 급박성과 소명자료를 검토하는 법률 전략 장면",
    caption: "명도단행가처분은 본안판결과 사실상 같은 효과가 있어 피보전권리와 보전의 필요성을 훨씬 충실하게 소명해야 합니다.",
    before: ["<hr><h2>Ⅳ. 실무상 활용", "<h2>Ⅳ. 실무상 활용"],
  },
];

function figureHtml({ src, alt, caption }) {
  return `<figure class="blog-figure"><img src="${src}" alt="${alt}" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;
}

function insertBeforeAny(content, needles, html) {
  for (const needle of needles) {
    const index = content.indexOf(needle);
    if (index !== -1) {
      return `${content.slice(0, index)}${html}${content.slice(index)}`;
    }
  }
  return `${content}${html}`;
}

function enrichContent(content) {
  let next = String(content || "");
  let changed = false;

  for (const figure of FIGURES) {
    if (next.includes(figure.src)) continue;
    next = insertBeforeAny(next, figure.before, figureHtml(figure));
    changed = true;
  }

  return { content: next, changed };
}

function snapshotPost(sqlite, post) {
  const latest = sqlite
    .prepare("SELECT COALESCE(MAX(version_no), 0) + 1 AS version_no FROM blog_post_versions WHERE post_id = ?")
    .get(post.id);

  sqlite.prepare(`
    INSERT INTO blog_post_versions (
      id, post_id, version_no, title, slug, category, excerpt, content, author,
      thumbnail_url, tags, seo_title, seo_description, canonical_url, og_image_url,
      geo_summary, geo_faq, geo_keywords, footnotes, is_published, published_at,
      scheduled_publish_at, created_by
    ) VALUES (
      @id, @post_id, @version_no, @title, @slug, @category, @excerpt, @content, @author,
      @thumbnail_url, @tags, @seo_title, @seo_description, @canonical_url, @og_image_url,
      @geo_summary, @geo_faq, @geo_keywords, @footnotes, @is_published, @published_at,
      @scheduled_publish_at, @created_by
    )
  `).run({
    id: crypto.randomUUID(),
    post_id: post.id,
    version_no: latest.version_no,
    title: post.title,
    slug: post.slug,
    category: post.category,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    thumbnail_url: post.thumbnail_url,
    tags: post.tags,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    canonical_url: post.canonical_url,
    og_image_url: post.og_image_url,
    geo_summary: post.geo_summary,
    geo_faq: post.geo_faq,
    geo_keywords: post.geo_keywords,
    footnotes: post.footnotes,
    is_published: post.is_published,
    published_at: post.published_at,
    scheduled_publish_at: post.scheduled_publish_at,
    created_by: UPDATED_BY,
  });
}

function hasMarker(sqlite) {
  const marker = sqlite
    .prepare("SELECT content FROM site_settings WHERE page = ? AND section = ?")
    .get(MARKER_PAGE, MARKER_SECTION);
  return marker?.content === VERSION;
}

function writeMarker(sqlite) {
  sqlite.prepare(`
    INSERT INTO site_settings (id, page, section, content, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
  `).run(crypto.randomUUID(), MARKER_PAGE, MARKER_SECTION, VERSION);
}

function enrichPossessionInjunctionBlogImages(sqlite) {
  if (hasMarker(sqlite)) return { updated: false, reason: "already-marked" };

  const post = sqlite
    .prepare("SELECT * FROM blog_posts WHERE title = ? LIMIT 1")
    .get(TARGET_TITLE);

  if (!post) return { updated: false, reason: "target-not-found" };

  const result = enrichContent(post.content);
  if (!result.changed) {
    writeMarker(sqlite);
    return { updated: false, reason: "already-enriched" };
  }

  const transaction = sqlite.transaction(() => {
    snapshotPost(sqlite, post);
    sqlite.prepare(`
      UPDATE blog_posts
      SET
        content = ?,
        thumbnail_url = COALESCE(thumbnail_url, ?),
        og_image_url = COALESCE(og_image_url, ?),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(result.content, FIGURES[0].src, FIGURES[0].src, post.id);
    writeMarker(sqlite);
  });

  transaction();
  return { updated: true, title: TARGET_TITLE, figures: FIGURES.length };
}

module.exports = {
  enrichPossessionInjunctionBlogImages,
  enrichContent,
};
