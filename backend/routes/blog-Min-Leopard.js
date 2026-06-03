/**
 * 블로그/법률 칼럼 API 라우트 — 게시글 CRUD + 조회수 증가
 * - 비즈니스 로직은 services/blog-service.js에 위임
 */
const { Router } = require("express");
const crypto = require("crypto");
const { handleError } = require("../lib/route-handler");
const { adminAuth } = require("../lib/auth");
const blogService = require("../services/blog-service");

const router = Router();

/**
 * 조회수 중복 방지용 인메모리 캐시 (visitor:slug → 만료시각)
 * 같은 방문자의 같은 글은 24시간 내 재조회 시 증가하지 않음.
 */
const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const viewCache = new Map();
const VIEW_COOKIE = "yj_blog_visitor";
const VIEWED_COOKIE_PREFIX = "yj_blog_seen_";
const BOT_UA_RE = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|kakaotalk-scrap|twitterbot|linkedinbot|whatsapp|preview|lighthouse|pagespeed|headless|curl|wget/i;
const IP_HASH_SECRET = process.env.IP_HASH_SECRET || process.env.CSRF_SECRET || "development-ip-hash-secret";

function adminOnlyWhenAll(req, res, next) {
  if (req.query.all === "true") return adminAuth(req, res, next);
  return next();
}

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getOrSetVisitorId(req, res) {
  const existing = parseCookie(req.get("cookie"), VIEW_COOKIE);
  if (existing) return existing;

  const visitorId = crypto.randomUUID();
  res.cookie(VIEW_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return visitorId;
}

function viewCookieName(slug) {
  const hash = crypto.createHash("sha256").update(slug).digest("hex").slice(0, 16);
  return `${VIEWED_COOKIE_PREFIX}${hash}`;
}

function markSlugSeen(res, slug) {
  res.cookie(viewCookieName(slug), "1", {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VIEW_COOLDOWN_MS,
    path: "/",
  });
}

function shouldSkipView(req) {
  if (BOT_UA_RE.test(req.get("user-agent") || "")) return true;
  const referrer = req.get("referrer") || req.get("referer") || "";
  if (/\/admin(\/|$)|\/editor(\/|$)/.test(referrer)) return true;
  return false;
}

function normalizeIp(ip = "") {
  return String(ip || "").replace(/^::ffff:/, "");
}

function maskIp(ip = "") {
  const value = normalizeIp(ip);
  if (!value) return "";
  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }
  if (value.includes(":")) {
    return value.split(":").slice(0, 4).join(":") + ":*";
  }
  return `${value.slice(0, 6)}*`;
}

function hashIp(ip = "") {
  const value = normalizeIp(ip);
  if (!value) return "";
  return crypto.createHmac("sha256", IP_HASH_SECRET).update(value).digest("hex");
}

function getSessionId(ip = "", userAgent = "") {
  const date = new Date().toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${normalizeIp(ip)}:${userAgent}:${date}`).digest("hex").slice(0, 16);
}

// 만료된 캐시 엔트리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of viewCache) {
    if (now > expiresAt) viewCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

// GET /api/blog — 공개 게시글 목록 (관리자는 ?all=true로 비공개 포함)
router.get("/", adminOnlyWhenAll, async (req, res) => {
  try {
    const result = await blogService.listPosts(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/blog/:slug/view — 실제 읽기 이벤트가 발생한 뒤 조회수 증가
router.post("/:slug/view", async (req, res) => {
  try {
    const slug = req.params.slug;
    const visitorId = getOrSetVisitorId(req, res);
    const cacheKey = `${visitorId}:${slug}`;
    const seenCookie = parseCookie(req.get("cookie"), viewCookieName(slug));
    const duplicate = viewCache.has(cacheKey) && Date.now() < viewCache.get(cacheKey);
    const skipIncrement = Boolean(seenCookie) || duplicate || shouldSkipView(req);
    const ip = req.ip || req.socket.remoteAddress || "";
    const userAgent = req.get("user-agent") || "";

    const post = await blogService.registerView(slug, {
      skipIncrement,
      visitorId,
      referrer: req.get("referrer") || req.get("referer") || "",
      userAgent,
      ipMasked: maskIp(ip),
      ipHash: hashIp(ip),
      sessionId: getSessionId(ip, userAgent),
    });

    if (post._counted) {
      viewCache.set(cacheKey, Date.now() + VIEW_COOLDOWN_MS);
      markSlugSeen(res, slug);
    }

    res.json({
      data: {
        viewCount: post.viewCount,
        counted: Boolean(post._counted),
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/blog/:slug — 슬러그로 게시글 조회 (조회수는 별도 /view 이벤트에서만 증가)
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const post = await blogService.getPost(slug, { skipIncrement: true });

    res.json({ data: post, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/blog — 게시글 생성
router.post("/", adminAuth, async (req, res) => {
  try {
    const inserted = await blogService.createPost(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/blog/:id/versions — 게시글 버전 히스토리
router.get("/:id/versions", adminAuth, async (req, res) => {
  try {
    const versions = await blogService.listVersions(req.params.id);
    res.json({ data: versions, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/blog/:id/versions/:versionNo/restore — 특정 버전으로 복구
router.post("/:id/versions/:versionNo/restore", adminAuth, async (req, res) => {
  try {
    const restored = await blogService.restoreVersion(
      req.params.id,
      req.params.versionNo,
      req.adminUser?.userId || "admin"
    );
    res.json({ data: restored, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /api/blog/:id — 게시글 수정
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await blogService.updatePost(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /api/blog/:id — 게시글 삭제
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await blogService.deletePost(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
