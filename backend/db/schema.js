/**
 * Drizzle ORM 스키마 정의
 * - documents, tags, categories, collections 등 12개 테이블
 */
const { sqliteTable, text, integer, real, primaryKey } = require("drizzle-orm/sqlite-core");
const { sql } = require("drizzle-orm");
const crypto = require("crypto");

// =============================================
// 문서 유형 & 상태 enum 값
// =============================================
const DOCUMENT_TYPES = [
  "statute",    // 법령
  "case_law",   // 판례
  "textbook",   // 교과서
  "book",       // 일반서적
  "paper",      // 논문
  "news",       // 뉴스
  "note",       // 메모/노트
];

const DOCUMENT_STATUSES = ["unread", "reading", "completed", "archived"];
const FILE_TYPES = ["pdf", "markdown", "text", "html"];
const RELATION_TYPES = ["relates_to", "cites", "cited_by", "contradicts", "supplements"];

// =============================================
// documents — 핵심 통합 테이블
// =============================================
const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  author: text("author"),
  source: text("source"),
  publishedDate: text("published_date"),
  contentMarkdown: text("content_markdown"),
  contentHtml: text("content_html"),
  contentPlain: text("content_plain"),
  summary: text("summary"),
  status: text("status").notNull().default("unread"),
  importance: integer("importance").notNull().default(3),
  filePath: text("file_path"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// categories — 계층형 카테고리
// =============================================
const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: text("parent_id"),
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// document_categories — 문서-카테고리 N:N
// =============================================
const documentCategories = sqliteTable("document_categories", {
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.categoryId] }),
]);

// =============================================
// collections — 사용자 정의 컬렉션
// =============================================
const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// document_collections — 문서-컬렉션 N:N
// =============================================
const documentCollections = sqliteTable("document_collections", {
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  addedAt: text("added_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  primaryKey({ columns: [table.documentId, table.collectionId] }),
]);

// =============================================
// document_relations — 문서 간 관계
// =============================================
const documentRelations = sqliteTable("document_relations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceId: text("source_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// highlights — 문서 내 하이라이트
// =============================================
const highlights = sqliteTable("highlights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  positionStart: integer("position_start").notNull(),
  positionEnd: integer("position_end").notNull(),
  highlightText: text("highlight_text").notNull(),
  note: text("note"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});


// =============================================
// hero_videos — 히어로 배경 영상 관리
// =============================================
const HERO_VIDEO_CATEGORIES = [
  "manhattan",   // 맨하탄
  "nyc",         // 뉴욕시
  "cityscape",   // 도시 풍경
  "office",      // 오피스/비즈니스
  "nature",      // 자연
  "abstract",    // 추상
];

const heroVideos = sqliteTable("hero_videos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("manhattan"),
  isActive: integer("is_active").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// lawyers — 변호사 소개
// =============================================
const LAWYER_POSITIONS = [
  "대표변호사",
  "변호사",
  "전문위원",
  "직원",
];

const lawyers = sqliteTable("lawyers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  nameHanja: text("name_hanja"),
  position: text("position").notNull().default("변호사"),
  team: text("team"),
  photoUrl: text("photo_url"),
  photoFocus: text("photo_focus"),
  tagline: text("tagline"),
  education: text("education"),
  career: text("career"),
  specialties: text("specialties"),
  qualifications: text("qualifications"),
  publications: text("publications"),
  books: text("books"),
  media: text("media"),
  columns: text("columns"),
  cases: text("cases"),
  memberships: text("memberships"),
  consultHours: text("consult_hours"),
  blogUrl: text("blog_url"),
  introduction: text("introduction"),
  email: text("email"),
  phone: text("phone"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// lectures — 변호사 강의 활동
// =============================================
const lectures = sqliteTable("lectures", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id").notNull().references(() => lawyers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date"),
  venue: text("venue"),
  organizer: text("organizer"),
  thumbnailUrl: text("thumbnail_url"),
  materialUrl: text("material_url"),
  materialName: text("material_name"),
  isPublished: integer("is_published").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// consultations — 상담 신청
// =============================================
const CONSULTATION_CATEGORIES = [
  "general",    // 일반 상담
  "civil",      // 민사
  "criminal",   // 형사
  "family",     // 가사
  "admin",      // 행정
  "tax",        // 조세
  "realestate", // 부동산
  "corporate",  // 기업법무
  "other",      // 기타
];

const CONSULTATION_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const MEETING_TYPES = ["in_person", "phone", "video"];
const SCHEDULE_MODES = ["slot", "request"];

const consultations = sqliteTable("consultations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  category: text("category").notNull().default("general"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  // 개인정보 동의 서명 레코드 연결 (Phase 3 전자서명 시스템)
  consentId: text("consent_id"),
  // 초대 링크 기반 신청인 경우 해당 invitation 연결 (Phase 4.5)
  invitationId: text("invitation_id"),
  meetingType: text("meeting_type").default("in_person"),
  meetingLink: text("meeting_link"),
  scheduleMode: text("schedule_mode").default("slot"),
  bookingSlotId: text("booking_slot_id"),
  preferredDate1: text("preferred_date_1"),
  preferredTime1: text("preferred_time_1"),
  preferredDate2: text("preferred_date_2"),
  preferredTime2: text("preferred_time_2"),
  preferredDate3: text("preferred_date_3"),
  preferredTime3: text("preferred_time_3"),
  attachmentUrls: text("attachment_urls"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// blog_posts — 블로그/법률 칼럼
// =============================================
const BLOG_CATEGORIES = ["construction_realestate", "case_analysis", "law_guide"];

const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("construction_realestate"),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  author: text("author"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  geoSummary: text("geo_summary"),
  geoFaq: text("geo_faq"),
  geoKeywords: text("geo_keywords"),
  footnotes: text("footnotes"),
  practiceArea: text("practice_area"),
  isPublished: integer("is_published").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: text("published_at"),
  scheduledPublishAt: text("scheduled_publish_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const blogPostVersions = sqliteTable("blog_post_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  versionNo: integer("version_no").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  category: text("category").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  author: text("author"),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  geoSummary: text("geo_summary"),
  geoFaq: text("geo_faq"),
  geoKeywords: text("geo_keywords"),
  footnotes: text("footnotes"),
  isPublished: integer("is_published").notNull().default(0),
  publishedAt: text("published_at"),
  scheduledPublishAt: text("scheduled_publish_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  createdBy: text("created_by").default("admin"),
});

const blogViewEvents = sqliteTable("blog_view_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  visitorId: text("visitor_id").notNull(),
  eventKey: text("event_key").notNull().unique(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipMasked: text("ip_masked"),
  ipHash: text("ip_hash"),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// case_results — 성공 사례
// =============================================
const CASE_CATEGORIES = ["civil", "criminal", "family", "administrative", "tax", "real_estate", "corporate"];

const caseResults = sqliteTable("case_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  category: text("category").notNull().default("civil"),
  result: text("result").notNull(),
  summary: text("summary").notNull(),
  detail: text("detail"),
  isPublished: integer("is_published").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// clients — 고객 DB (상담 신청 시 자동 등록)
// =============================================
const CLIENT_SOURCES = ["consultation", "referral", "manual", "other"];

const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  category: text("category"),
  memo: text("memo"),
  source: text("source").notNull().default("manual"),
  consultationId: text("consultation_id"),
  isActive: integer("is_active").notNull().default(1),
  // 고객 세그먼트용 태그 목록 (JSON 배열 문자열로 저장, 예: '["VIP","민사진행중"]')
  tags: text("tags"),
  // 마지막 연락(메시지 발송 성공) 시각 — 세그먼트/정렬에 활용
  lastContactedAt: text("last_contacted_at"),
  // 수신동의 — 기본 1(동의). 0이면 해당 채널로 마케팅성 메시지 발송 제외
  smsConsent: integer("sms_consent").notNull().default(1),
  emailConsent: integer("email_consent").notNull().default(1),
  // 공개 수신거부 페이지용 토큰 (클라이언트별 단일 토큰)
  unsubscribeToken: text("unsubscribe_token").$defaultFn(() => crypto.randomUUID()),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// client_cases — 고객별 법률 사건 (1:N)
// =============================================
const clientCases = sqliteTable("client_cases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  caseNumber: text("case_number"),
  jurisdiction: text("jurisdiction"),
  memo: text("memo"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// client_related_persons — 고객별 관련자 (1:N)
// role: '수사관' | '판사' | '상대방측' | '우리측'
// =============================================
const clientRelatedPersons = sqliteTable("client_related_persons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// message_templates — 메시지 템플릿 (SMS/이메일)
// =============================================
const MESSAGE_CHANNELS = ["sms", "email"];

const messageTemplates = sqliteTable("message_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("sms"),
  subject: text("subject"),
  content: text("content").notNull(),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// message_logs — 메시지 발송 이력
// =============================================
const MESSAGE_STATUSES = ["pending", "sent", "failed"];

const messageLogs = sqliteTable("message_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: text("channel").notNull(),
  recipientName: text("recipient_name"),
  recipientContact: text("recipient_contact").notNull(),
  consultationId: text("consultation_id"),
  templateId: text("template_id"),
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: text("sent_at"),
  // 이메일 열람 추적 — 1x1 픽셀 로드 시각
  openedAt: text("opened_at"),
  openCount: integer("open_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// scheduled_messages — 예약 메시지 (특정 시각에 발송)
// =============================================
const SCHEDULED_MESSAGE_STATUSES = ["pending", "processing", "sent", "failed", "cancelled"];
const SCHEDULED_SOURCES = ["manual", "trigger"];

const scheduledMessages = sqliteTable("scheduled_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: text("channel").notNull(),
  // recipients: JSON 배열 [{ name, contact, consultationId?, category? }]
  recipients: text("recipients").notNull(),
  templateId: text("template_id"),
  subject: text("subject"),
  content: text("content").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("manual"),
  // 자동 트리거로 생성된 경우 origin 참조 (예: "consultation:abc-123")
  originRef: text("origin_ref"),
  errorMessage: text("error_message"),
  // result: JSON { total, sent, failed, results: [...] }
  result: text("result"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// auto_triggers — 조건 기반 자동 메시지 발송 규칙
// =============================================
const TRIGGER_TYPES = [
  "consultation_received",  // 상담 접수 직후
  "consultation_confirmed", // 상담 확정 시
  "booking_reminder",       // 예약 D-1 리마인더
  "reengagement",           // 장기 미연락 재연결
];

const autoTriggers = sqliteTable("auto_triggers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  triggerType: text("trigger_type").notNull(),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("sms"),
  templateId: text("template_id"),
  subject: text("subject"),
  content: text("content").notNull(),
  // 이벤트 발생 시점으로부터 지연 (분). booking_reminder는 이벤트 "이전" 분을 음수로 저장 가능하도록 둠
  delayMinutes: integer("delay_minutes").notNull().default(0),
  // reengagement 전용 — 마지막 연락 이후 경과 일수 임계값 (기본 90일)
  thresholdDays: integer("threshold_days").notNull().default(90),
  isEnabled: integer("is_enabled").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// site_settings — 홈페이지 콘텐츠 설정 (JSON)
// =============================================
const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// site_settings_history — 설정 변경 이력
// =============================================
const siteSettingsHistory = sqliteTable("site_settings_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  previousContent: text("previous_content"),
  changedBy: text("changed_by").default("admin"),
  changedAt: text("changed_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// announcements — 공지/배너/팝업
// =============================================
const ANNOUNCEMENT_TYPES = ["banner", "popup", "notice"];
const ANNOUNCEMENT_POSITIONS = ["top", "bottom", "center"];

const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull().default("banner"),
  title: text("title").notNull(),
  content: text("content"),
  linkUrl: text("link_url"),
  bgColor: text("bg_color").default("#b08d57"),
  textColor: text("text_color").default("#ffffff"),
  isActive: integer("is_active").notNull().default(1),
  startDate: text("start_date"),
  endDate: text("end_date"),
  position: text("position").default("top"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// scheduled_changes — 예약 발행
// =============================================
const SCHEDULE_STATUSES = ["pending", "applied", "cancelled"];

const scheduledChanges = sqliteTable("scheduled_changes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page").notNull(),
  section: text("section").notNull(),
  content: text("content").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("pending"),
  createdBy: text("created_by").default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// media_files — 미디어 파일 관리
// =============================================
const mediaFiles = sqliteTable("media_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  alt: text("alt"),
  folder: text("folder").default("general"),
  uploadedBy: text("uploaded_by").default("admin"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// admin_users — 관리자 계정
// =============================================
const ADMIN_ROLES = ["admin", "editor", "viewer"];

const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"),
  email: text("email"),
  isActive: integer("is_active").notNull().default(1),
  totpSecret: text("totp_secret"),
  // 비밀번호 재설정 토큰 (SHA-256 hex 해시) — reset link 1회용 만료 토큰
  resetTokenHash: text("reset_token_hash"),
  // 만료 시각 (밀리초 epoch). 만료 후 검증 거부.
  resetTokenExpiresAt: integer("reset_token_expires_at"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// page_views — 페이지 방문 로그
// =============================================
const pageViews = sqliteTable("page_views", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: text("page"),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_users — 포털 계정 (직원/의뢰인 공용)
// isActive: 0=승인대기, 1=활성, -1=거절
// =============================================
const portalUsers = sqliteTable("portal_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active").notNull().default(0),
  role: text("role"),
  // 구글 캘린더 OAuth2 토큰 (포털 사용자 개인 캘린더 연동)
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiresAt: integer("google_token_expires_at"),
  hireDate: text("hire_date"),
  departmentId: text("department_id"),
  position: text("position"),
  // 비밀번호 재설정 토큰 (SHA-256 hex 해시) — 30분 만료 일회용
  resetTokenHash: text("reset_token_hash"),
  resetTokenExpiresAt: integer("reset_token_expires_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// case_files — 사건 관리
// =============================================
const CASE_STATUSES = ["접수", "진행", "완료"];

const caseFilesTable = sqliteTable("case_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("접수"),
  lawyerId: text("lawyer_id").references(() => lawyers.id, { onDelete: "set null" }),
  description: text("description"),
  // 전자소송 호환 필드 — 의뢰인 포털에서 자기 사건의 기록을 조회할 때 노출된다.
  caseNumber: text("case_number"),       // 사건번호 (예: 2024가합12345)
  court: text("court"),                  // 재판부/관할법원 (예: 서울중앙지방법원 제1민사부)
  caseType: text("case_type"),           // 사건유형 (민사/형사/가사/행정 등)
  plaintiff: text("plaintiff"),          // 원고
  defendant: text("defendant"),          // 피고
  filedAt: text("filed_at"),             // 제소일 (YYYY-MM-DD)
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const caseDocuments = sqliteTable("case_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseFileId: text("case_file_id").notNull().references(() => caseFilesTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").default("admin"),
  // 전자소송 스타일 사건 기록 메타데이터
  documentType: text("document_type"),     // 문서 종류 (소장/답변서/준비서면/판결문 등)
  submitter: text("submitter"),            // 제출자 (원고/피고/법원/우리측)
  submissionDate: text("submission_date"), // 제출일자 (YYYY-MM-DD)
  description: text("description"),        // 문서 설명/요지 — 우측 탭에 표시
  fileSize: integer("file_size"),          // 바이트 단위
  mimeType: text("mime_type"),
  originalName: text("original_name"),     // 사용자가 업로드한 원본 파일명
  isVisibleToClient: integer("is_visible_to_client").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const caseMessages = sqliteTable("case_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseFileId: text("case_file_id").notNull().references(() => caseFilesTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id"),
  senderType: text("sender_type").notNull().default("lawyer"),
  content: text("content").notNull(),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// booking — 상담 예약 시스템
// =============================================
const bookingSlots = sqliteTable("booking_slots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id").references(() => lawyers.id, { onDelete: "set null" }),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: integer("is_available").notNull().default(1),
  consultationId: text("consultation_id").references(() => consultations.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const bookingSettings = sqliteTable("booking_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id").references(() => lawyers.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull().default("09:00"),
  endTime: text("end_time").notNull().default("18:00"),
  slotDuration: integer("slot_duration").notNull().default(60),
  isActive: integer("is_active").notNull().default(1),
});

// =============================================
// chatbot — 챗봇 Q&A
// =============================================
const chatbotQa = sqliteTable("chatbot_qa", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").default("일반"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  messages: text("messages"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// reviews — 의뢰인 후기
// =============================================
const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull().default(5),
  content: text("content").notNull(),
  category: text("category"),
  isPublished: integer("is_published").notNull().default(0),
  isAnonymous: integer("is_anonymous").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// qna_categories — 법률 Q&A 카테고리 (자기참조, 3단계)
// =============================================
// depth: 0 = 대분류(건설/부동산), 1 = 중분류, 2 = 소분류
// slug는 URL-safe 한글 허용 (e.g. "건설", "공사대금")

const qnaCategories = sqliteTable("qna_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: text("parent_id"),
  depth: integer("depth").notNull().default(0),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// qna_questions — Q&A 질문 + 답변 (통합 레코드)
// =============================================
// 승인 워크플로우: pending → published / rejected
// 익명 티어: 0=실명, 1=닉네임, 2=완전 익명(자동 생성 표시명)

const QNA_STATUSES = ["pending", "published", "rejected", "hidden"];
const QNA_ANONYMITY_TIERS = [0, 1, 2];

const qnaQuestions = sqliteTable("qna_questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  // 표시 이름 (실명/닉네임/자동 생성). 실제 이름은 submitterName에만 저장
  displayName: text("display_name"),
  anonymityTier: integer("anonymity_tier").notNull().default(2),
  // 관리자 전용 — 실제 제출자 정보 (PII)
  submitterName: text("submitter_name"),
  submitterContact: text("submitter_contact"),
  submitterRegion: text("submitter_region"),
  // 답변 (마크다운/HTML)
  answer: text("answer"),
  answeredBy: text("answered_by"),
  answeredAt: text("answered_at"),
  status: text("status").notNull().default("pending"),
  rejectReason: text("reject_reason"),
  // 대표 Q&A (홈페이지 노출)
  isFeatured: integer("is_featured").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  // SEO
  metaDescription: text("meta_description"),
  // 비밀글
  isPrivate: integer("is_private").notNull().default(0),
  passwordHash: text("password_hash"),
  kakaoUserId: text("kakao_user_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  publishedAt: text("published_at"),
});

// =============================================
// kakao_users — 카카오 로그인 사용자
// =============================================
const kakaoUsers = sqliteTable("kakao_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  kakaoId: text("kakao_id").notNull().unique(),
  nickname: text("nickname"),
  profileImage: text("profile_image"),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  lastLoginAt: text("last_login_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// newsletter_subscribers — 뉴스레터 구독
// =============================================
// =============================================
// invoices — 인보이스(수임료 청구서 / 세금계산서) 헤더
// =============================================
/** 인보이스 종류 */
const INVOICE_TYPES = [
  "simple", // 단순 청구서
  "tax",    // 세금계산서
];

/**
 * 인보이스 상태 머신
 *   draft      — 임시 저장 (번호 미할당)
 *   issued     — 발행 (번호 확정, 고객·공급자 스냅샷 고정)
 *   sent       — 이메일/메시지로 발송 완료
 *   partial    — 부분 결제 완료
 *   paid       — 완납
 *   overdue    — 지급기한 초과 (스케줄러가 자동 설정)
 *   cancelled  — 발행 취소 (번호 보존, 재사용 금지 — 감사 추적)
 *   refunded   — 환불 처리
 */
const INVOICE_STATUSES = [
  "draft", "issued", "sent", "partial",
  "paid", "overdue", "cancelled", "refunded",
];

const INVOICE_PAYMENT_METHODS = ["bank", "card", "cash", "other"];

const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNo: text("invoice_no"), // 발행 시점에 할당 (draft 동안 NULL)
  type: text("type").notNull().default("simple"),
  status: text("status").notNull().default("draft"),
  clientId: text("client_id").notNull(),
  caseId: text("case_id"),
  // 발행 시점의 공급자/공급받는자 정보 스냅샷 (JSON 문자열)
  // → 나중에 사무소·고객 정보가 바뀌어도 과거 인보이스 내용 불변
  supplierInfo: text("supplier_info"),
  customerInfo: text("customer_info"),
  issuedDate: text("issued_date"), // 발행일 (YYYY-MM-DD)
  dueDate: text("due_date"),       // 지급기한
  paymentMethod: text("payment_method"),
  // 금액은 모두 원 단위 정수(부동소수점 회피)
  subtotal: integer("subtotal").notNull().default(0),
  vatRate: integer("vat_rate").notNull().default(10),
  vatAmount: integer("vat_amount").notNull().default(0),
  total: integer("total").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  notes: text("notes"),
  currency: text("currency").notNull().default("KRW"),
  issuedBy: text("issued_by"), // admin_users.id
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// invoice_items — 라인 아이템(품목)
// =============================================
const invoiceItems = sqliteTable("invoice_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  description: text("description").notNull(),   // 품명
  specification: text("specification"),          // 규격
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  amount: integer("amount").notNull().default(0), // quantity × unit_price
  vatIncluded: integer("vat_included").notNull().default(0),
});

// =============================================
// invoice_payments — 결제 이력
// =============================================
const invoicePayments = sqliteTable("invoice_payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  paidAt: text("paid_at").notNull(),
  amount: integer("amount").notNull(),
  method: text("method"),
  reference: text("reference"), // 이체 메모, 카드 승인번호 등
  notes: text("notes"),
  recordedBy: text("recorded_by"), // admin_users.id
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// invoice_sequences — 연도·종류별 순번 (원자적 번호 할당)
// =============================================
const invoiceSequences = sqliteTable("invoice_sequences", {
  year: integer("year").notNull(),
  type: text("type").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.year, t.type] }),
}));

// =============================================
// invoice_activity_log — 감사 로그 (발행/취소/결제 이벤트)
// =============================================
const invoiceActivityLog = sqliteTable("invoice_activity_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull(),
  action: text("action").notNull(), // issued|cancelled|payment_added|payment_removed|sent|refunded
  actorId: text("actor_id"),         // admin_users.id
  at: text("at").notNull().default(sql`(datetime('now'))`),
  details: text("details"),          // JSON 문자열 (변경 전/후 값 등)
});

const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  name: text("name"),
  isActive: integer("is_active").notNull().default(1),
  unsubscribeToken: text("unsubscribe_token").$defaultFn(() => crypto.randomUUID()),
  subscribedAt: text("subscribed_at").notNull().default(sql`(datetime('now'))`),
  unsubscribedAt: text("unsubscribed_at"),
});

// =============================================
// ERP — Time Tracking / Tasks / Court Dates
// =============================================
const TIME_ENTRY_ACTIVITY_TYPES = ["work", "research", "meeting", "court", "call", "email", "travel"];

const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lawyerId: text("lawyer_id").notNull(),
  clientId: text("client_id"),
  caseId: text("case_id"),
  contractId: text("contract_id"),
  description: text("description").notNull(),
  activityType: text("activity_type").notNull().default("work"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  durationMinutes: integer("duration_minutes"),
  hourlyRateKrw: integer("hourly_rate_krw").notNull().default(0),
  billable: integer("billable").notNull().default(1),
  billed: integer("billed").notNull().default(0),
  invoiceId: text("invoice_id"),
  memo: text("memo"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
const TASK_STATUSES = ["open", "in_progress", "blocked", "done", "archived"];

const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  assigneeLawyerId: text("assignee_lawyer_id"),
  clientId: text("client_id"),
  caseId: text("case_id"),
  contractId: text("contract_id"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  dueDate: text("due_date"),
  reminderAt: text("reminder_at"),
  completedAt: text("completed_at"),
  completedBy: text("completed_by"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const TRUST_TRANSACTION_TYPES = ["deposit", "withdrawal", "adjustment"];
const TRUST_REFERENCE_TYPES = ["invoice", "receipt", "manual", "refund"];

const trustTransactions = sqliteTable("trust_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull(),
  transactionType: text("transaction_type").notNull(),
  amountKrw: integer("amount_krw").notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  occurredAt: text("occurred_at").notNull(),
  recordedBy: text("recorded_by"),
  memo: text("memo"),
  voidedAt: text("voided_at"),
  voidedBy: text("voided_by"),
  voidReason: text("void_reason"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const COURT_DATE_KINDS = ["hearing", "mediation", "examination", "sentencing", "deadline"];
const COURT_DATE_STATUSES = ["scheduled", "completed", "postponed", "cancelled"];

const courtDates = sqliteTable("court_dates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  courtName: text("court_name"),
  courtRoom: text("court_room"),
  caseNumber: text("case_number"),
  caseId: text("case_id"),
  clientId: text("client_id"),
  lawyerId: text("lawyer_id"),
  kind: text("kind").notNull().default("hearing"),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at"),
  reminderAt: text("reminder_at"),
  reminded: integer("reminded").notNull().default(0),
  memo: text("memo"),
  status: text("status").notNull().default("scheduled"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_time_entries — 포털 사용자 사건별 시간 기록
// =============================================
const portalTimeEntries = sqliteTable("portal_time_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  caseId: text("case_id").references(() => caseFilesTable.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  durationMinutes: integer("duration_minutes"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// recruit_posts — 채용 공고
// =============================================
const RECRUIT_CATEGORIES = ["new_lawyer", "experienced_lawyer", "military_lawyer", "staff"];
const RECRUIT_STATUSES = ["open", "closed"];

const recruitPosts = sqliteTable("recruit_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text("category").notNull().default("new_lawyer"),
  title: text("title").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  applicationDeadline: text("application_deadline"),
  applicationFileUrl: text("application_file_url"),
  applicationFileName: text("application_file_name"),
  status: text("status").notNull().default("open"),
  isPublished: integer("is_published").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_posts — 포털 게시판 게시글
// =============================================
const portalPosts = sqliteTable("portal_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("free"), // 'notice' (공지사항), 'manual' (업무 매뉴얼), 'free' (자유게시판), 'template' (양식)
  title: text("title").notNull(),
  content: text("content").notNull(),
  viewCount: integer("view_count").notNull().default(0),
  isPinned: integer("is_pinned").notNull().default(0), // 필독
  isImportant: integer("is_important").notNull().default(0), // 중요
  attachments: text("attachments"), // JSON array of {name, url, size, mime}
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_board_categories — 포털 게시판 카테고리 (대표변호사가 추가 가능)
// =============================================
const portalBoardCategories = sqliteTable("portal_board_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#64748b"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by").references(() => portalUsers.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_events — 포털 사용자 캘린더 일정
// =============================================
const portalEvents = sqliteTable("portal_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at"),
  isAllDay: integer("is_all_day").notNull().default(0),
  color: text("color").default("#6366f1"),
  attendeeIds: text("attendee_ids"),
  location: text("location"),
  videoConferenceUrl: text("video_conference_url"),
  attachmentUrls: text("attachment_urls"),
  category: text("category"),
  recurrenceRule: text("recurrence_rule"),
  reminderMinutes: integer("reminder_minutes"),
  reminded: integer("reminded").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_member_groups — 캘린더에서 함께 보고 싶은 구성원을 이름 지어 저장하는 그룹 (사용자별)
// =============================================
const portalMemberGroups = sqliteTable("portal_member_groups", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text("portal_user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  memberIds: text("member_ids").notNull(), // 변호사 ID를 콤마로 이어붙인 문자열 (attendee_ids와 동일한 저장 방식)
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// departments — 조직도 부서 정보
// =============================================
const departments = sqliteTable("departments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  managerUserId: text("manager_user_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// portal_approvals — 전자결재 문서
// =============================================
const portalApprovals = sqliteTable("portal_approvals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requesterId: text("requester_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'leave' | 'expense' | 'reimbursement'
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected' | 'draft'
  currentApproverId: text("current_approver_id"),
  approvalLine: text("approval_line").notNull(), // JSON: [{"userId", "status", "comment", "name", "position", "updatedAt"}]
  
  // 휴가 필드
  leaveType: text("leave_type"), // 'annual' | 'half_am' | 'half_pm' | 'hourly'
  leaveStart: text("leave_start"), // 'YYYY-MM-DD HH:MM'
  leaveEnd: text("leave_end"),
  leaveDuration: real("leave_duration"), // 사용 시간 (단위: 시간)

  // 지출/경비 필드
  expenseAmount: integer("expense_amount"),
  expenseCategory: text("expense_category"), // 'meals' | 'travel' | 'supplies' | 'other'
  expenseReceiptUrl: text("expense_receipt_url"),
  expenseDate: text("expense_date"),

  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// =============================================
// user_ai_configs — 구성원별 AI 연동 설정
// =============================================
// 각 구성원이 OpenAI, Anthropic, Google 등 여러 AI 서비스를 등록해두고
// 블로그 에디터에서 글쓰기 보조 및 이미지 생성 시 원하는 AI를 선택할 수 있도록 한다.
// API 키는 encryptSecret() 으로 암호화되어 저장된다.
const userAiConfigs = sqliteTable("user_ai_configs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),          // portalUsers.id (portal user)
  provider: text("provider").notNull(),        // 'openai' | 'anthropic' | 'google'
  modelId: text("model_id").notNull(),         // 'gpt-4o', 'claude-3-5-sonnet-20241022', 'gemini-2.0-flash' 등
  nickname: text("nickname").notNull(),        // 사용자가 붙이는 이름 (예: '내 GPT-4o', '하이로 Claude')
  encryptedApiKey: text("encrypted_api_key").notNull(), // AES-256-GCM 암호화된 API 키
  isDefaultPrompt: integer("is_default_prompt").notNull().default(0), // 기본 글쓰기 보조 AI
  isDefaultImage: integer("is_default_image").notNull().default(0),   // 기본 이미지 생성 AI
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─── 메신저 ───────────────────────────────────────────────────────────────────
const messengerRooms = sqliteTable("messenger_rooms", {
  id: text("id").primaryKey(),
  name: text("name"),
  type: text("type").notNull().default("direct"),
  createdBy: text("created_by"),
  createdByType: text("created_by_type").default("portal"),
  lastMessageAt: text("last_message_at"),
  lastMessagePreview: text("last_message_preview"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const messengerMembers = sqliteTable("messenger_members", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  userId: text("user_id").notNull(),
  userType: text("user_type").notNull().default("portal"),
  displayName: text("display_name"),
  lastReadAt: text("last_read_at"),
  joinedAt: text("joined_at").notNull().default(sql`(datetime('now'))`),
});

const messengerMessages = sqliteTable("messenger_messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderType: text("sender_type").notNull().default("portal"),
  senderName: text("sender_name"),
  content: text("content"),
  type: text("type").notNull().default("text"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  isDeleted: integer("is_deleted").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  FILE_TYPES,
  RELATION_TYPES,

  HERO_VIDEO_CATEGORIES,
  documents,
  categories,
  documentCategories,
  collections,
  documentCollections,
  documentRelations,
  highlights,

  heroVideos,
  LAWYER_POSITIONS,
  lawyers,
  lectures,
  CONSULTATION_CATEGORIES,
  CONSULTATION_STATUSES,
  MEETING_TYPES,
  SCHEDULE_MODES,
  consultations,
  BLOG_CATEGORIES,
  blogPosts,
  blogPostVersions,
  blogViewEvents,
  CASE_CATEGORIES,
  caseResults,
  CLIENT_SOURCES,
  clients,
  clientCases,
  clientRelatedPersons,
  MESSAGE_CHANNELS,
  MESSAGE_STATUSES,
  messageTemplates,
  messageLogs,
  SCHEDULED_MESSAGE_STATUSES,
  SCHEDULED_SOURCES,
  scheduledMessages,
  TRIGGER_TYPES,
  autoTriggers,
  siteSettings,
  siteSettingsHistory,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_POSITIONS,
  announcements,
  SCHEDULE_STATUSES,
  scheduledChanges,
  mediaFiles,
  ADMIN_ROLES,
  adminUsers,
  pageViews,
  portalUsers,
  CASE_STATUSES,
  caseFilesTable,
  caseDocuments,
  caseMessages,
  bookingSlots,
  bookingSettings,
  chatbotQa,
  chatSessions,
  reviews,
  qnaCategories,
  qnaQuestions,
  QNA_STATUSES,
  QNA_ANONYMITY_TIERS,
  kakaoUsers,
  newsletterSubscribers,

  INVOICE_TYPES,
  INVOICE_STATUSES,
  INVOICE_PAYMENT_METHODS,
  invoices,
  invoiceItems,
  invoicePayments,
  invoiceSequences,
  invoiceActivityLog,

  // ERP
  TIME_ENTRY_ACTIVITY_TYPES,
  timeEntries,
  TASK_PRIORITIES,
  TASK_STATUSES,
  tasks,
  COURT_DATE_KINDS,
  COURT_DATE_STATUSES,
  courtDates,
  TRUST_TRANSACTION_TYPES,
  TRUST_REFERENCE_TYPES,
  trustTransactions,

  portalTimeEntries,

  // 채용
  RECRUIT_CATEGORIES,
  RECRUIT_STATUSES,
  recruitPosts,
  portalPosts,
  portalBoardCategories,
  portalEvents,
  portalMemberGroups,

  // 조직도 및 결재
  departments,
  portalApprovals,

  // AI 연동 설정
  userAiConfigs,

  // 메신저
  messengerRooms,
  messengerMembers,
  messengerMessages,
};

