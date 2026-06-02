/**
 * Express 서버 진입점
 * - API 라우트 등록, 정적 파일 서빙, 글로벌 에러 핸들러
 */
require("dotenv").config();

// 환경변수 검증 — 필수 변수 누락 시 경고
function validateEnv() {
  const warnings = [];
  const requiredInProduction = [
    "ALLOWED_ORIGINS",
    "CSRF_SECRET",
    "ENCRYPTION_KEY",
    "ADMIN_INITIAL_PASSWORD",
    "APP_URL",
    "PUBLIC_BASE_URL",
    "IP_HASH_SECRET",
  ];
  const missingRequired = process.env.NODE_ENV === "production"
    ? requiredInProduction.filter((name) => !process.env[name])
    : [];

  if (missingRequired.length > 0) {
    console.error(`[FATAL] 프로덕션 필수 환경변수가 누락되었습니다: ${missingRequired.join(", ")}`);
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && process.env.ENCRYPTION_KEY && !/^[0-9a-f]{64}$/i.test(process.env.ENCRYPTION_KEY)) {
    console.error("[FATAL] ENCRYPTION_KEY는 64자 hex 문자열이어야 합니다.");
    process.exit(1);
  }
  if (!process.env.ALLOWED_ORIGINS) warnings.push("ALLOWED_ORIGINS 미설정 — 개발 환경 기본값(localhost)만 허용됩니다");
  if (!process.env.APPS_SCRIPT_WEBHOOK_URL) warnings.push("APPS_SCRIPT_WEBHOOK_URL 미설정 — 상담 알림이 발송되지 않습니다");
  if (!process.env.APP_URL) warnings.push("APP_URL 미설정 — 수신거부/추적 링크 생성 시 http://localhost:5173 을 사용합니다");
  if (!process.env.PUBLIC_BASE_URL) warnings.push("PUBLIC_BASE_URL 미설정 — 공개 초대/서명 링크 생성 시 http://localhost:5173 을 사용합니다");
  if (!process.env.IP_HASH_SECRET) warnings.push("IP_HASH_SECRET 미설정 — 개발용 IP 해시 시크릿을 사용합니다");
  if (!process.env.ALIGO_API_KEY) warnings.push("ALIGO_API_KEY 미설정 — 문자 발송 서비스(SMS)가 제한됩니다");
  if (!process.env.ALIGO_USER_ID) warnings.push("ALIGO_USER_ID 미설정 — 문자 발송 서비스(SMS)가 제한됩니다");
  if (!process.env.ALIGO_SENDER) warnings.push("ALIGO_SENDER 미설정 — 문자 발송 서비스(SMS)가 제한됩니다");
  warnings.forEach(w => console.warn(`[ENV WARNING] ${w}`));
}
validateEnv();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const compression = require("compression");
const logger = require("./lib/logger");
const { sqlite } = require("./db");
const requestId = require("./lib/request-id");
const { logSecurityEvent } = require("./lib/audit-log");

/**
 * rate-limit 트립 시 보안 로그를 남기고 표준 메시지로 응답하는 handler 팩토리.
 * 동일 IP가 짧은 시간에 다수 트립을 일으키면 사후 분석으로 attack pattern을 잡을 수 있다.
 */
function rateLimitHandler(category, message) {
  return (req, res, _next, options) => {
    logSecurityEvent(req, `rate_limit_hit.${category}`, {
      windowMs: options.windowMs,
      max: options.max,
    });
    res.status(options.statusCode || 429).json({
      data: null,
      error: message,
      meta: null,
    });
  };
}
// Sentry는 DSN 환경변수가 있을 때만 활성화 (dev/test 환경 영향 없음)
const { Sentry, enabled: sentryEnabled } = require("./lib/sentry");

const app = express();
// Nginx 리버스 프록시 뒤에서 X-Forwarded-For 헤더를 신뢰.
// "loopback"은 connecting peer가 127.0.0.1/::1일 때만 X-Forwarded-For를
// 신뢰한다. 숫자 1은 connecting peer가 누구든 1홉을 트러스트하므로,
// 방화벽이 뚫려 외부에서 5001로 직접 들어오면 공격자가 X-Forwarded-For로
// 자기 IP를 위장해 IP-기반 rate-limit과 감사로그를 우회할 수 있다.
// Nginx가 같은 호스트에서 동작하는 우리 토폴로지에서는 "loopback"이 더 안전하다.
// (참고: Nginx는 반드시 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
//  를 사용해야 한다. 클라이언트가 보낸 XFF를 그대로 패스스루하면 위조 가능.)
app.set("trust proxy", "loopback");
// macOS의 AirPlay Receiver가 5000을 점유하므로 5001을 기본값으로 사용
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  res.locals.cspNonce = require("crypto").randomBytes(16).toString("base64");
  next();
});

// 모든 요청에 X-Request-Id 부착 (헬스체크/로그 상관관계용)
app.use(requestId);

// 보안 헤더 설정 (CSP 활성화)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https://script.google.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// API 요청 속도 제한
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // IP당 최대 200요청
  standardHeaders: true,
  validate: false,
  legacyHeaders: false,
  handler: rateLimitHandler("api", "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요."),
});
app.use("/api/", apiLimiter);

// 로그인 전용 속도 제한 (브루트포스 방지)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // IP당 최대 10회 로그인 시도
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: rateLimitHandler("login", "로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요."),
});
app.use("/api/admin-users/login", loginLimiter);
app.use("/api/portal/login", loginLimiter);

// 비밀번호 분실/재설정 전용 속도 제한 (이메일 폭탄 + 토큰 brute-force 방지).
// reset-password에도 동일 제한을 적용해, 토큰 brute-force 시도를 IP당 1시간 5회로 묶는다.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // IP당 1시간에 5회
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: rateLimitHandler("forgot_password", "임시 비밀번호 요청이 너무 많습니다. 1시간 후 다시 시도해주세요."),
});
app.use("/api/admin-users/forgot-password", forgotPasswordLimiter);
app.use("/api/admin-users/reset-password", forgotPasswordLimiter);

// 상담 신청 전용 속도 제한 (더 엄격)
const consultationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // IP당 최대 10요청
  validate: false,
  message: { data: null, error: "상담 신청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.", meta: null },
});
app.use("/api/consultations", consultationLimiter);

// 개인정보 동의/서명 저장 전용 속도 제한 (공개 엔드포인트 자원 소모 방지)
const privacyConsentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 20,
  validate: false,
  message: { data: null, error: "동의 저장 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.", meta: null },
});
app.use("/api/privacy-consents", privacyConsentLimiter);

// 메시지 발송 전용 속도 제한
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 50, // 시간당 최대 50건 발송
  validate: false,
  message: { data: null, error: "메시지 발송 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.", meta: null },
});
app.use("/api/messages/send", messageLimiter);

// 챗봇 메시지 속도 제한 (공개 엔드포인트 남용 방지)
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 60, // IP당 최대 60회
  validate: false,
  message: { data: null, error: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.", meta: null },
});
app.use("/api/chatbot/chat", chatbotLimiter);

// CORS 허용 출처 — 프로덕션에서는 ALLOWED_ORIGINS 필수
// 미설정 시 credentials:true + origin:true 조합은 브라우저가 거부하지만,
// 의도치 않은 자격증명 누출을 막기 위해 명시적으로 서버 시작을 차단한다.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()).filter(Boolean)
  : null;
if (!allowedOrigins || allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === "production") {
    console.error("[FATAL] ALLOWED_ORIGINS 환경변수가 필요합니다. 프로덕션에서는 반드시 설정하세요.");
    process.exit(1);
  }
  console.warn("[ENV WARNING] ALLOWED_ORIGINS 미설정 — 개발 환경 기본값(localhost)만 허용합니다");
}
const corsOrigins = allowedOrigins && allowedOrigins.length > 0
  ? allowedOrigins
  : ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(compression());

// JSON 본문 크기 제한 — 라우트 특성에 맞춰 분리한다.
//
// 왜 분리하나:
//  - 전역 10MB는 거의 모든 엔드포인트에 과도하다 (로그인, 예약, 메시지 발송 등은 1MB 이상 본문이
//    정상적이지 않음). 외부에서 큰 JSON을 던져 메모리를 압박하는 DoS 표면을 줄이기 위해
//    "기본 1MB, 진짜 필요한 컨텐츠 라우트만 10MB"로 좁힌다.
//  - 큰 본문이 정당한 라우트: 에디터(documents), 계약서/템플릿, 블로그, 사이트 설정,
//    Q&A 답변, 변호사 프로필(이력 JSON), 강의 본문 — TipTap HTML이라 KB~수MB까지 가능.
//  - 다른 라우트(인보이스 생성, 메시지 발송, 예약, 로그인 등)는 1MB로 충분.
//
// 동작: req.path 시작이 LARGE_BODY_PATHS의 한 항목과 일치하면 10MB parser를, 아니면 1MB parser를
// 적용한다. parser는 매 요청마다 단 하나만 실행되도록 path 분기로 처리.
const TIGHT_JSON = express.json({ limit: "1mb" });
const LARGE_JSON = express.json({ limit: "10mb" });
const LARGE_BODY_PATHS = [
  "/api/documents",
  "/api/contracts",
  "/api/contract-templates",
  "/api/blog",
  "/api/site-settings",
  "/api/inquiry",
  "/api/lawyers",
  "/api/lectures",
];
app.use((req, res, next) => {
  const isLarge = LARGE_BODY_PATHS.some((p) => req.path === p || req.path.startsWith(p + "/"));
  return (isLarge ? LARGE_JSON : TIGHT_JSON)(req, res, next);
});

// CSRF 보호 미들웨어 (더블 서브밋 쿠키 패턴)
app.use(require("./lib/csrf"));

// 업로드된 파일 정적 서빙 (STORAGE_PATH 환경변수로 외부 스토리지 지정 가능)
// 브라우저에서 인라인 실행될 수 있는 확장자는 강제 다운로드로 전환하여
// 사용자 업로드 파일을 통한 Stored XSS / 임의 코드 실행을 차단한다.
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "data");
const FORCE_DOWNLOAD_EXTS = new Set([
  ".html", ".htm", ".xhtml",        // 인라인 HTML
  ".svg", ".xml",                    // SVG/XML 안의 <script>
  ".js", ".mjs", ".cjs",             // JavaScript
  ".vbs", ".swf",                    // 레거시 스크립트/Flash
]);
const staticOptions = {
  setHeaders(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (FORCE_DOWNLOAD_EXTS.has(ext)) {
      res.setHeader("Content-Disposition", "attachment");
      res.setHeader("Content-Type", "application/octet-stream");
    }
    // 모든 업로드 파일에 X-Content-Type-Options 적용
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
};
app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads"), staticOptions));
app.use("/data/files", express.static(path.join(STORAGE_PATH, "files"), staticOptions));

// 페이지뷰 분석 미들웨어 (라우트 등록 전에 적용)
app.use(require("./lib/analytics-middleware"));

// ===== Second Brain API =====
app.use("/api/documents", require("./routes/documents"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/collections", require("./routes/collections"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use("/api/hero-videos", require("./routes/hero-videos"));
app.use("/api/lawyers", require("./routes/lawyers"));
app.use("/api/lectures", require("./routes/lectures"));
app.use("/api/consultations", require("./routes/consultations"));
app.use("/api/privacy-consents", require("./routes/privacy-consents"));
app.use("/api/invitations", require("./routes/invitations"));
app.use("/api/referral-links", require("./routes/referral-links"));
app.use("/api/auth/kakao", require("./routes/kakao-auth"));
// 짧은 레퍼럴 리다이렉트 — /r/:code → 클릭 추적 후 /consultation
app.get("/r/:code", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM referral_links WHERE code = ? AND is_active = 1").get(req.params.code);
    if (row) {
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
      const masked = ip.replace(/^::ffff:/, "").replace(/\.\d+$/, ".*");
      sqlite.prepare("INSERT INTO referral_clicks (id, referral_link_id, ip_masked, user_agent, referrer) VALUES (?, ?, ?, ?, ?)")
        .run(require("crypto").randomUUID(), row.id, masked, req.headers["user-agent"] || null, req.headers["referer"] || null);
      sqlite.prepare("UPDATE referral_links SET click_count = click_count + 1, updated_at = datetime('now') WHERE id = ?").run(row.id);
    }
  } catch (e) { logger.error({ err: e }, "referral click failed"); }
  res.redirect("/consultation");
});
app.use("/api/public/invite", require("./routes/public-invite"));
app.use("/api/contract-templates", require("./routes/contract-templates"));
app.use("/api/contracts", require("./routes/contracts"));
app.use("/api/public/sign", require("./routes/public-sign"));
app.use("/api/blog", require("./routes/blog"));
try {
  const { publishDueScheduledPosts } = require("./services/blog-service");
  publishDueScheduledPosts().catch((err) => logger.warn({ err }, "scheduled blog publish check failed"));
  setInterval(() => {
    publishDueScheduledPosts().catch((err) => logger.warn({ err }, "scheduled blog publish check failed"));
  }, 60 * 1000).unref();
} catch (err) {
  logger.warn({ err }, "scheduled blog publisher not started");
}
app.use("/api/cases", require("./routes/cases"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/triggers", require("./routes/triggers"));
app.use("/api/site-settings", require("./routes/site-settings"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/media", require("./routes/media"));
app.use("/api/admin-users", require("./routes/admin-users"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/dev-logs", require("./routes/dev-logs"));
app.use("/api/audit-logs", require("./routes/audit-logs"));

app.use("/api/recruit", require("./routes/recruit"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/newsletter", require("./routes/newsletter"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/receipts", require("./routes/receipts"));
app.use("/api/payment-cards", require("./routes/payment-cards"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/inquiry", require("./routes/qna"));
app.use("/api/portal", require("./routes/portal"));
app.use("/api/case-records", require("./routes/case-records"));

// ERP — 시간 기록 / 업무 / 법정 일정 / 의뢰인 예치금 / 이해상충
app.use("/api/time-entries", require("./routes/time-entries"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/court-dates", require("./routes/court-dates"));
app.use("/api/trust-accounts", require("./routes/trust-accounts"));
app.use("/api/conflicts", require("./routes/conflicts"));

/* 법정 일정 알림 cron — 매분 도래한 reminder_at 을 SMS/이메일로 발송 */
try {
  const { startCron: startCourtReminderCron } = require("./lib/court-date-reminder");
  startCourtReminderCron();
} catch (err) {
  logger.warn({ err }, "court date reminder cron not started");
}
app.use("/api/sitemap", require("./routes/sitemap"));
app.use("/sitemap.xml", require("./routes/sitemap"));
// API 문서 (Swagger UI + OpenAPI 스펙)
app.use("/api/docs", require("./routes/docs"));

// 프론트엔드 정적 파일 서빙 (프로덕션)
let frontendDist = path.resolve(__dirname, "..", "frontend", "dist").replace(/\\/g, "/");
const fs = require("fs");
const nestedFrontendDist = path.resolve(__dirname, "..", "frontend", "frontend", "dist").replace(/\\/g, "/");
if (fs.existsSync(nestedFrontendDist)) {
  frontendDist = nestedFrontendDist;
}
if (fs.existsSync(frontendDist)) {
  const indexPath = path.join(frontendDist, "index.html");
  const PUBLIC_SITE_URL = (process.env.APP_URL || "https://HIGHLAW.com").replace(/\/$/, "");
  const { db, sqlite } = require("./db");
  const { blogPosts, qnaQuestions } = require("./db/schema");
  const { resolveBlogSlug } = require("./services/blog-service");
  const { syncPublishedBlogStaticArtifacts, renderPostHtml } = require("./services/blog-static-renderer");
  const { and, eq } = require("drizzle-orm");

  try {
    const result = syncPublishedBlogStaticArtifacts(sqlite);
    if (!result.skipped) {
      logger.info({ posts: result.posts, dist: result.dist }, "blog static SEO artifacts synced");
    }
  } catch (err) {
    logger.warn({ err }, "blog static SEO artifact sync failed");
  }

  function escapeHtmlAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function safeDecodePathSegment(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function stripHtml(value) {
    return String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/[#*_`>~-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function truncateDescription(value, fallback) {
    const text = stripHtml(value) || fallback;
    return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text;
  }

  function routeSeo(pathname) {
    const routes = {
      "/": {
        title: "법무법인 하이로 | HIGH & LAW FIRM",
        description: "법무법인 하이로 - 불법파견·게임사기·노동·군사건 분야 전문 법률 서비스. 전문 변호사가 직접 상담합니다.",
      },
      "/about": {
        title: "사무소 소개 | 법무법인 하이로",
        description: "법무법인 하이로의 철학, 업무 방식, 의뢰인 중심 법률 서비스를 소개합니다.",
      },
      "/practice": {
        title: "업무분야 | 법무법인 하이로",
        description: "불법파견, 게임사기, 노동, 군사건 등 법무법인 하이로의 주요 법률 서비스 분야를 안내합니다.",
      },
      "/practice/construction": {
        title: "불법파견 법률 서비스 | 법무법인 하이로",
        description: "공사대금, 하자담보, 인허가, 재개발·재건축 분쟁에 대한 불법파견 법률 서비스를 제공합니다.",
      },
      "/practice/realestate": {
        title: "노동 법률 서비스 | 법무법인 하이로",
        description: "부동산 거래, 개발, 임대차, 등기·수용 분쟁에 대한 법률 자문과 소송대리를 제공합니다.",
      },
      "/lawyers": {
        title: "변호사 소개 | 법무법인 하이로",
        description: "법무법인 하이로 소속 변호사의 주요 경력과 전문 분야를 확인하세요.",
      },
      "/consultation": {
        title: "온라인 상담 신청 | 법무법인 하이로",
        description: "법무법인 하이로에 법률 상담을 신청하고 희망 상담 일정을 선택하세요.",
      },
      "/blog": {
        title: "법률칼럼 | 법무법인 하이로",
        description: "불법파견·게임사기·노동·군사건 분야의 실무 법률 칼럼과 최신 이슈를 확인하세요.",
      },
      "/inquiry": {
        title: "법률 Q&A | 법무법인 하이로",
        description: "자주 묻는 법률 질문과 실무 답변을 분야별로 확인하세요.",
      },
      "/reviews": {
        title: "의뢰인 후기 | 법무법인 하이로",
        description: "법무법인 하이로를 거쳐간 의뢰인들의 실제 후기와 평가를 확인하세요.",
      },
      "/privacy": {
        title: "개인정보처리방침 | 법무법인 하이로",
        description: "법무법인 하이로의 개인정보 수집·이용 동의서 및 처리방침 전문입니다.",
      },
      "/terms": {
        title: "이용약관 | 법무법인 하이로",
        description: "법무법인 하이로 홈페이지 이용약관과 서비스 범위, 권리·의무, 면책 사항을 안내합니다.",
      },
    };
    const exact = routes[pathname];
    if (exact) return exact;
    if (pathname.startsWith("/lawyers/")) return routes["/lawyers"];
    if (pathname.startsWith("/blog/")) return routes["/blog"];
    if (pathname.startsWith("/inquiry/")) return routes["/inquiry"];
    return routes["/"];
  }

  async function routeSeoForPath(pathname) {
    const fallback = routeSeo(pathname);
    const blogMatch = pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (blogMatch) {
      const slug = resolveBlogSlug(safeDecodePathSegment(blogMatch[1]));
      try {
        const [post] = await db
          .select({
            title: blogPosts.title,
            excerpt: blogPosts.excerpt,
            content: blogPosts.content,
          })
          .from(blogPosts)
          .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, 1)))
          .limit(1);
        if (post) {
          return {
            title: `${post.title} | 법무법인 하이로`,
            description: truncateDescription(post.excerpt || post.content, fallback.description),
          };
        }
      } catch (err) {
        logger.warn({ err, pathname }, "dynamic blog SEO fallback");
      }
      return fallback;
    }

    const qnaMatch = pathname.match(/^\/inquiry\/question\/([^/]+)\/?$/) || pathname.match(/^\/qna\/question\/([^/]+)\/?$/);
    if (qnaMatch) {
      const slug = safeDecodePathSegment(qnaMatch[1]);
      try {
        const [question] = await db
          .select({
            title: qnaQuestions.title,
            body: qnaQuestions.body,
            metaDescription: qnaQuestions.metaDescription,
          })
          .from(qnaQuestions)
          .where(and(eq(qnaQuestions.slug, slug), eq(qnaQuestions.status, "published")))
          .limit(1);
        if (question) {
          return {
            title: `Q. ${question.title} | 법률 Q&A | 법무법인 하이로`,
            description: truncateDescription(question.metaDescription || question.body, fallback.description),
          };
        }
      } catch (err) {
        logger.warn({ err, pathname }, "dynamic Q&A SEO fallback");
      }
      return fallback;
    }

    return fallback;
  }

  async function applyRouteSeo(html, reqPath) {
    const seo = await routeSeoForPath(reqPath);
    const canonical = `${PUBLIC_SITE_URL}${reqPath === "/" ? "/" : reqPath}`;
    const title = escapeHtmlAttr(seo.title);
    const description = escapeHtmlAttr(seo.description);
    const url = escapeHtmlAttr(canonical);
    return html
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
      .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${description}" />`);
  }

  async function renderBlogStaticHtmlIfPossible(html, reqPath) {
    const blogMatch = reqPath.match(/^\/blog\/([^/]+)\/?$/);
    if (!blogMatch) return null;
    const slug = resolveBlogSlug(safeDecodePathSegment(blogMatch[1]));
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, 1)))
      .limit(1);
    return post ? renderPostHtml(html, {
      ...post,
      thumbnail_url: post.thumbnailUrl,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      canonical_url: post.canonicalUrl,
      og_image_url: post.ogImageUrl,
      geo_summary: post.geoSummary,
      geo_faq: post.geoFaq,
      geo_keywords: post.geoKeywords,
      is_published: post.isPublished,
      published_at: post.publishedAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    }) : null;
  }

  function sendSpaIndex(req, res) {
    fs.readFile(indexPath, "utf8", async (err, html) => {
      if (err) return res.status(500).send("index.html not found");
      try {
        const nonce = res.locals.cspNonce;
        const staticBlogHtml = await renderBlogStaticHtmlIfPossible(html, req.path);
        const withSeo = staticBlogHtml || await applyRouteSeo(html, req.path);
        const withNonce = withSeo
          .replace("<head>", `<head>\n    <meta name="csp-nonce" content="${nonce}" />`)
          .replace(/<script type="application\/ld\+json">/g, `<script type="application/ld+json" nonce="${nonce}">`);
        res.type("html").send(withNonce);
      } catch (e) {
        logger.error({ err: e, path: req.path }, "SPA index render failed");
        res.status(500).send("index.html render failed");
      }
    });
  }

  app.use(express.static(frontendDist, { index: false }));
  // SPA 폴백 — API가 아닌 모든 GET 요청에 index.html 반환 (Express 5 호환)
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/uploads/") || req.path.startsWith("/data/")) return next();
    // 정적 파일 요청이면 스킵 (확장자가 있는 경우)
    if (path.extname(req.path)) return next();
    sendSpaIndex(req, res);
  });
  console.log("[Static] 프론트엔드 정적 파일 서빙:", frontendDist);
}

// 글로벌 에러 핸들러 (클라이언트에 민감 정보 노출 방지)
// reqId 부착으로 로그-사용자 응답 상관관계 추적이 가능하다.
// 5xx는 Sentry로도 전파하여 릴리즈 단위 회귀 감시가 가능하게 한다.
app.use((err, req, res, _next) => {
  const statusCode = err.status || 500;
  logger.error({
    reqId: req.id,
    method: req.method,
    path: req.path,
    status: statusCode,
    err: { message: err.message, stack: err.stack },
  }, "request error");
  if (sentryEnabled && statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag("reqId", req.id);
      scope.setTag("path", req.path);
      scope.setTag("method", req.method);
      Sentry.captureException(err);
    });
  }
  const clientMessage = statusCode >= 500
    ? "서버 내부 오류가 발생했습니다"
    : (err.message || "요청 처리 중 오류가 발생했습니다");
  res.status(statusCode).json({ data: null, error: clientMessage, meta: null });
});

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "server listening");
  require("./lib/scheduler").startScheduler();
});

// 그레이스풀 셧다운 — 진행 중인 요청 완료 후 종료
function gracefulShutdown(signal) {
  logger.info({ signal }, "graceful shutdown initiated");
  server.close(() => {
    logger.info("server closed");
    process.exit(0);
  });
  // 10초 내 종료되지 않으면 강제 종료
  setTimeout(() => {
    logger.error("forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
