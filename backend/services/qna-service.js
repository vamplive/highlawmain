/**
 * Q&A 서비스 — 법률 질의응답 게시판 비즈니스 로직
 * - 카테고리 트리 (자기참조, 3단계: 대/중/소)
 * - 질문 제출(익명 3티어 + PII 마스킹), 관리자 승인/답변
 * - 공개 조회 시 민감정보(PII)는 반환하지 않는다
 */
const { db } = require("../db");
const { qnaCategories, qnaQuestions } = require("../db/schema");
const { eq, and, or, desc, count, inArray, like } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
} = require("./helpers");
const { sanitizeRichHtml } = require("../lib/htmlSanitizer");
const { hashPassword, verifyPassword } = require("../lib/auth");

/**
 * 자유 텍스트 필드 저장 전 정화.
 * Q&A 본문/답변/메타설명은 textarea 평문으로 들어오지만, API 직접 호출로
 * <script>·이벤트 핸들러·javascript: 스킴 등이 섞일 가능성이 있다.
 * 화면이 React 평문 렌더라 현재 XSS 노출 경로는 없지만, 향후 정적 HTML
 * 렌더러나 요약 카드에서 innerHTML로 쓰일 가능성을 대비한 defense-in-depth.
 * 빈 문자열/null은 그대로 통과시켜 비교 로직 영향 최소화.
 */
function safeText(value) {
  if (value === null || value === undefined || value === "") return value;
  return sanitizeRichHtml(String(value));
}

// =============================================
// 공개용 / 관리자용 필드 화이트리스트
// =============================================
/** 공개 응답에서 노출할 질문 필드 — submitterName/contact 같은 PII는 제외 */
const PUBLIC_QUESTION_FIELDS = [
  "id", "slug", "categoryId", "title", "body",
  "displayName", "anonymityTier",
  "answer", "answeredBy", "answeredAt",
  "isFeatured", "viewCount",
  "metaDescription",
  "isPrivate",
  "publishedAt", "createdAt",
];

// =============================================
// 익명/PII 처리
// =============================================

/** 완전 익명 표시명 — 커뮤니티 스타일 닉네임 자동 생성 */
const ANON_POOL = {
  "불법파견": ["파견근로자ㅇㅇ", "용역직원", "위장도급당함", "직접고용원해", "파견3년차", "현장파견인", "협력사직원"],
  "게임사기": ["게이머ㅇㅇ", "아이템사기당함", "계정도용당함", "현질날림", "게임머니털림", "랭커였는데", "운영자ㅠㅠ"],
  "노동": ["직장인ㅇㅇ", "퇴사예정", "월급안나옴", "부당해고당함", "야근중", "산재당함", "직장괴롭힘피해"],
  "군사건": ["군인ㅇㅇ", "예비역인데", "군징계받음", "병역분쟁중", "군형사상담", "현역복무중", "전역예정자"],
  default: ["익명ㅇㅇ", "법률상담", "질문있어요", "도와주세요", "궁금한사람"],
};

/**
 * 완전 익명 티어용 표시명 생성 — 커뮤니티 스타일.
 * @param {string} topCategoryName - 대분류명
 * @returns {string}
 */
function generateAnonymousDisplayName(topCategoryName) {
  const pool = ANON_POOL[topCategoryName] || ANON_POOL.default;
  const name = pool[Math.floor(Math.random() * pool.length)];
  // 숫자 서픽스로 고유성 확보
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `${name}${suffix}`;
}

/**
 * 질문 본문에서 PII 자동 마스킹.
 * - 주민등록번호: 전체 차단 (저장 거부)
 * - 휴대폰 번호: 뒤 4자리를 ****로 치환
 * - 사업자등록번호(10자리 숫자 3-2-5 패턴): 가운데 자리 마스킹
 * @param {string} text
 * @returns {{ text: string, blockedReason?: string }}
 */
function sanitizePII(text) {
  if (!text) return { text: "" };

  // 1) 주민등록번호 — 저장 자체 거부
  if (/\d{6}\s*-\s*\d{7}/.test(text)) {
    return { text, blockedReason: "주민등록번호는 입력할 수 없습니다. 해당 내용을 제거해 주세요." };
  }

  let out = text;
  // 2) 휴대폰 번호 마스킹
  out = out.replace(/(01[0-9])-?\d{3,4}-?(\d{4})/g, (m, p1, _p2) => `${p1}-****-****`);
  // 3) 사업자등록번호 마스킹 (123-45-67890 → 123-**-67890)
  out = out.replace(/(\d{3})-?(\d{2})-?(\d{5})/g, "$1-**-$3");
  return { text: out };
}

// =============================================
// Slug 생성
// =============================================

// =============================================
// 관리자 알림 (Apps Script 웹훅)
// =============================================

/**
 * 신규 Q&A 질문 접수 시 Apps Script 웹훅으로 관리자에게 알림.
 * 전송 실패는 로그만 남기고 질문 저장 자체에는 영향을 주지 않는다.
 * @param {object} data - { title, displayName, topCategory, subCategory, submitterContact, submitterRegion }
 */
async function notifyAdminOnNewQuestion(data) {
  const url = process.env.APPS_SCRIPT_WEBHOOK_URL;
  if (!url) return; // 미설정 시 조용히 스킵
  try {
    const payload = JSON.stringify({
      type: "qna_question",
      title: data.title,
      displayName: data.displayName,
      topCategory: data.topCategory || "",
      subCategory: data.subCategory || "",
      contact: data.submitterContact || "",
      region: data.submitterRegion || "",
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
      redirect: "follow",
    });
    await res.text();
    if (!res.ok) console.warn("[Q&A 알림] Apps Script 응답 오류:", res.status);
  } catch (err) {
    console.error("[Q&A 알림] Apps Script 전송 실패:", err.message);
  }
}

/** 제목에서 URL-safe 슬러그 생성 (한글 유지). */
function generateQuestionSlug(title) {
  const base = (title || "question")
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const suffix = Date.now().toString(36).slice(-6);
  return `${base}-${suffix}`;
}

// =============================================
// 카테고리 조회
// =============================================

/**
 * 전체 카테고리를 트리 구조로 반환.
 * 각 대분류에 children(중분류), children[].children(소분류) 배열이 포함된다.
 * @returns {Array<{id,name,slug,depth,children:Array}>}
 */
async function getCategoryTree() {
  const rows = await db
    .select()
    .from(qnaCategories)
    .where(eq(qnaCategories.isActive, 1))
    .orderBy(qnaCategories.depth, qnaCategories.sortOrder);

  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
  const tree = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else if (!node.parentId) {
      tree.push(node);
    }
  }
  return tree;
}

/** slug로 카테고리를 찾고, 없으면 null을 반환한다. */
async function findCategoryBySlug(slug) {
  const [row] = await db.select().from(qnaCategories).where(eq(qnaCategories.slug, slug));
  return row || null;
}

/**
 * 특정 카테고리의 조상 체인 반환 (root → self 순).
 * Breadcrumb 및 depth 확인용.
 */
async function getCategoryAncestors(categoryId) {
  const chain = [];
  let currentId = categoryId;
  let safety = 5;
  while (currentId && safety-- > 0) {
    const [row] = await db.select().from(qnaCategories).where(eq(qnaCategories.id, currentId));
    if (!row) break;
    chain.unshift(row);
    currentId = row.parentId;
  }
  return chain;
}

/**
 * 대상 카테고리의 자신 + 모든 하위 카테고리 ID 목록 반환.
 * 질문 목록 필터에 사용 (예: "불법파견" 대분류 클릭 시 하위 전부 포함).
 */
async function getDescendantCategoryIds(categoryId) {
  const all = await db.select().from(qnaCategories);
  const result = new Set([categoryId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      if (c.parentId && result.has(c.parentId) && !result.has(c.id)) {
        result.add(c.id);
        added = true;
      }
    }
  }
  return Array.from(result);
}

// =============================================
// 공개 질문 조회
// =============================================

/**
 * 공개 응답에서 PII를 제거한 질문 객체로 변환.
 * 비밀글이면 제목/본문/답변을 마스킹한다.
 * @param {object} row
 * @param {{ revealPrivate?: boolean }} opts
 * @returns {object}
 */
function toPublicQuestion(row, opts = {}) {
  const out = {};
  for (const f of PUBLIC_QUESTION_FIELDS) out[f] = row[f];
  // 비밀글 마스킹 — 작성자 본인이거나 관리자가 아니면 내용 가림
  if (row.isPrivate && !opts.revealPrivate) {
    out.title = "비밀글입니다";
    out.body = "";
    out.answer = null;
  }
  return out;
}

/**
 * 질문 목록 조회 (공개) — 상태=published, 카테고리 필터, 페이지네이션.
 * categorySlug가 주어지면 해당 카테고리와 하위 모든 카테고리 질문을 반환.
 * @param {object} filters - { page, limit, categorySlug, featured }
 */
async function listQuestions(filters) {
  const { page, limit, offset } = parsePagination(filters, { maxLimit: 30 });
  const conditions = [eq(qnaQuestions.status, "published")];

  if (filters.featured === "true") {
    conditions.push(eq(qnaQuestions.isFeatured, 1));
  }

  if (filters.categorySlug) {
    const cat = await findCategoryBySlug(filters.categorySlug);
    if (!cat) {
      return { items: [], meta: buildPaginationMeta(0, page, limit), category: null };
    }
    const descendantIds = await getDescendantCategoryIds(cat.id);
    conditions.push(inArray(qnaQuestions.categoryId, descendantIds));
  }

  // 키워드 검색 — 제목 또는 본문에 포함
  if (filters.search) {
    const keyword = `%${filters.search}%`;
    conditions.push(or(
      like(qnaQuestions.title, keyword),
      like(qnaQuestions.body, keyword),
    ));
  }

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(qnaQuestions).where(where);

  const rows = await db
    .select()
    .from(qnaQuestions)
    .where(where)
    .orderBy(desc(qnaQuestions.isFeatured), desc(qnaQuestions.publishedAt), desc(qnaQuestions.createdAt))
    .limit(limit)
    .offset(offset);

  const kakaoUserId = filters.kakaoUserId || null;
  return {
    items: rows.map((r) => toPublicQuestion(r, {
      revealPrivate: kakaoUserId && r.kakaoUserId === kakaoUserId,
    })),
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 슬러그로 질문 조회 + 조회수 증가.
 * @param {string} slug
 * @param {{ skipIncrement?: boolean, includePrivate?: boolean, kakaoUserId?: string }} options
 */
async function getQuestion(slug, options = {}) {
  const [row] = await db.select().from(qnaQuestions).where(eq(qnaQuestions.slug, slug));
  if (!row) throw new ServiceError("질문을 찾을 수 없습니다", 404);
  if (!options.includePrivate && row.status !== "published") {
    throw new ServiceError("질문을 찾을 수 없습니다", 404);
  }

  if (!options.skipIncrement && row.status === "published") {
    await db
      .update(qnaQuestions)
      .set({ viewCount: row.viewCount + 1 })
      .where(eq(qnaQuestions.id, row.id));
    row.viewCount = row.viewCount + 1;
  }

  const ancestors = await getCategoryAncestors(row.categoryId);
  const category = ancestors[ancestors.length - 1] || null;
  const breadcrumb = ancestors.map((a) => ({ id: a.id, name: a.name, slug: a.slug, depth: a.depth }));

  // 비밀글 접근 판정 — 관리자이거나 카카오 작성자 본인이면 전체 노출
  const isOwner = options.kakaoUserId && row.kakaoUserId === options.kakaoUserId;
  const publicRow = options.includePrivate
    ? row
    : toPublicQuestion(row, { revealPrivate: isOwner });
  return { ...publicRow, category, breadcrumb };
}

// =============================================
// 질문 제출 (공개, 승인 대기)
// =============================================

/**
 * 질문 제출 — 상태 pending으로 생성. 관리자 승인 후 published.
 * anonymityTier: 0=실명, 1=닉네임, 2=완전 익명(자동 닉네임)
 * @param {object} data
 */
async function submitQuestion(data) {
  const {
    categoryId, title, body,
    anonymityTier = 2, nickname,
    submitterName, submitterContact, submitterRegion,
    isPrivate, password, kakaoUserId,
  } = data;

  if (!categoryId || !title?.trim() || !body?.trim()) {
    throw new ServiceError("카테고리/제목/내용은 필수입니다", 400);
  }
  if (title.length > 120) {
    throw new ServiceError("제목은 120자 이하로 입력해 주세요", 400);
  }
  if (body.length > 5000) {
    throw new ServiceError("내용은 5000자 이하로 입력해 주세요", 400);
  }

  const tier = [0, 1, 2].includes(Number(anonymityTier)) ? Number(anonymityTier) : 2;

  // 카테고리 검증 — 소분류(depth=2)만 허용하여 분류 정확성 확보
  const [category] = await db.select().from(qnaCategories).where(eq(qnaCategories.id, categoryId));
  if (!category || category.isActive !== 1) {
    throw new ServiceError("유효하지 않은 카테고리입니다", 400);
  }
  if (category.depth !== 2) {
    throw new ServiceError("세부 카테고리(소분류)를 선택해 주세요", 400);
  }

  // PII 자동 마스킹
  const titleCheck = sanitizePII(title);
  if (titleCheck.blockedReason) throw new ServiceError(titleCheck.blockedReason, 400);
  const bodyCheck = sanitizePII(body);
  if (bodyCheck.blockedReason) throw new ServiceError(bodyCheck.blockedReason, 400);

  // 표시명 결정
  let displayName;
  if (tier === 0 && submitterName) displayName = submitterName;
  else if (tier === 1 && nickname) displayName = nickname.slice(0, 20);
  else {
    const ancestors = await getCategoryAncestors(categoryId);
    const top = ancestors[0]?.name || "";
    displayName = generateAnonymousDisplayName(top);
  }

  // 비밀글 검증 — 비밀번호 또는 카카오 로그인 필요
  const wantPrivate = isPrivate ? 1 : 0;
  let passwordHash = null;
  if (wantPrivate) {
    if (!password && !kakaoUserId) {
      throw new ServiceError("비밀글은 비밀번호를 설정하거나 카카오 로그인이 필요합니다", 400);
    }
    if (password) {
      if (password.length < 4 || password.length > 20) {
        throw new ServiceError("비밀번호는 4~20자로 입력해 주세요", 400);
      }
      passwordHash = hashPassword(password);
    }
  }

  const slug = generateQuestionSlug(title);
  const now = nowTimestamp();

  const [inserted] = await db
    .insert(qnaQuestions)
    .values({
      slug,
      categoryId,
      title: safeText(titleCheck.text),
      body: safeText(bodyCheck.text),
      displayName,
      anonymityTier: tier,
      submitterName: submitterName || null,
      submitterContact: submitterContact || null,
      submitterRegion: submitterRegion || null,
      isPrivate: wantPrivate,
      passwordHash,
      kakaoUserId: kakaoUserId || null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // 관리자 알림 — 웹훅 실패는 무시 (사용자 경험 보호)
  // submitQuestion 흐름에서 카테고리 계층을 이미 조회했으므로 재사용한다
  const ancestorsForNotify = await getCategoryAncestors(categoryId);
  notifyAdminOnNewQuestion({
    title: titleCheck.text,
    displayName,
    topCategory: ancestorsForNotify[0]?.name,
    subCategory: ancestorsForNotify[ancestorsForNotify.length - 1]?.name,
    submitterContact,
    submitterRegion,
  }).catch(() => {});

  // 공개용 응답 (승인 전이므로 slug만 먼저 알려주고 대기 메시지)
  return {
    id: inserted.id,
    slug: inserted.slug,
    status: inserted.status,
    message: "질문이 접수되었습니다. 검토 후 공개됩니다.",
  };
}

// =============================================
// 관리자 API
// =============================================

/**
 * 관리자용 질문 목록 — 모든 상태 포함, PII까지 반환.
 */
async function adminListQuestions(filters) {
  const { page, limit, offset } = parsePagination(filters, { maxLimit: 100 });
  const conditions = [];
  if (filters.status) conditions.push(eq(qnaQuestions.status, filters.status));
  if (filters.categoryId) {
    const descendants = await getDescendantCategoryIds(filters.categoryId);
    conditions.push(inArray(qnaQuestions.categoryId, descendants));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(qnaQuestions).where(where);
  const rows = await db
    .select()
    .from(qnaQuestions)
    .where(where)
    .orderBy(desc(qnaQuestions.createdAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * 관리자용 — 승인 + 답변 작성 (또는 수정).
 * @param {string} id
 * @param {object} data - { answer, answeredBy, status, categoryId?, title?, body?, isFeatured?, metaDescription?, displayName?, rejectReason? }
 */
async function adminUpdateQuestion(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(qnaQuestions).where(eq(qnaQuestions.id, id));
  if (!existing) throw new ServiceError("질문을 찾을 수 없습니다", 404);

  const updates = { updatedAt: nowTimestamp() };
  const allowed = [
    "title", "body", "categoryId", "displayName",
    "answer", "answeredBy", "status", "rejectReason",
    "isFeatured", "metaDescription",
  ];
  // 자유 텍스트 필드는 저장 전 sanitizeRichHtml로 정화 (defense-in-depth)
  const TEXT_FIELDS = new Set(["title", "body", "displayName", "answer", "answeredBy", "rejectReason", "metaDescription"]);
  for (const k of allowed) {
    if (k in data) updates[k] = TEXT_FIELDS.has(k) ? safeText(data[k]) : data[k];
  }

  // 답변이 처음 입력될 때 answeredAt 기록
  if ("answer" in data && data.answer && !existing.answeredAt) {
    updates.answeredAt = nowTimestamp();
  }
  // 최초 published로 전환될 때 publishedAt 기록
  if (data.status === "published" && existing.status !== "published") {
    updates.publishedAt = nowTimestamp();
  }

  const [updated] = await db
    .update(qnaQuestions)
    .set(updates)
    .where(eq(qnaQuestions.id, id))
    .returning();

  return updated;
}

/** 질문 삭제. */
async function adminDeleteQuestion(id) {
  validateUUID(id);
  await db.delete(qnaQuestions).where(eq(qnaQuestions.id, id));
  return { deleted: true };
}

/**
 * 관리자용 — 새 질문 생성 (직접 승인/답변/상태 포함).
 */
async function adminCreateQuestion(data) {
  const {
    categoryId, title, body, displayName,
    answer, answeredBy, status = "published",
    isPrivate = 0, isFeatured = 0, metaDescription,
  } = data;

  if (!categoryId || !title?.trim() || !body?.trim()) {
    throw new ServiceError("카테고리/제목/내용은 필수입니다", 400);
  }

  const slug = generateQuestionSlug(title);
  const now = nowTimestamp();

  const [category] = await db.select().from(qnaCategories).where(eq(qnaCategories.id, categoryId));
  if (!category) {
    throw new ServiceError("유효하지 않은 카테고리입니다", 400);
  }

  const insertData = {
    slug,
    categoryId,
    title: safeText(title),
    body: safeText(body),
    displayName: safeText(displayName || "관리자"),
    status: status || "published",
    isPrivate: isPrivate ? 1 : 0,
    isFeatured: isFeatured ? 1 : 0,
    metaDescription: safeText(metaDescription),
    createdAt: now,
    updatedAt: now,
  };

  if (answer?.trim()) {
    insertData.answer = safeText(answer);
    insertData.answeredBy = safeText(answeredBy || "법무법인 하이로");
    insertData.answeredAt = now;
  }

  if (status === "published") {
    insertData.publishedAt = now;
  }

  const [inserted] = await db
    .insert(qnaQuestions)
    .values(insertData)
    .returning();

  return inserted;
}


// =============================================
// 카테고리 관리 (관리자)
// =============================================

async function adminCreateCategory(data) {
  const { name, slug, parentId, depth, description, sortOrder = 0 } = data;
  if (!name || !slug) throw new ServiceError("이름/슬러그는 필수입니다", 400);
  try {
    const [inserted] = await db
      .insert(qnaCategories)
      .values({ name, slug, parentId: parentId || null, depth: Number(depth) || 0, description, sortOrder })
      .returning();
    return inserted;
  } catch (e) {
    if (e.message?.includes("UNIQUE")) throw new ServiceError("이미 존재하는 슬러그입니다", 409);
    throw e;
  }
}

async function adminUpdateCategory(id, data) {
  validateUUID(id);
  const updates = {};
  for (const k of ["name", "slug", "parentId", "depth", "description", "sortOrder", "isActive"]) {
    if (k in data) updates[k] = data[k];
  }
  const [updated] = await db.update(qnaCategories).set(updates).where(eq(qnaCategories.id, id)).returning();
  return updated;
}

async function adminDeleteCategory(id) {
  validateUUID(id);
  // 하위 카테고리/질문이 있으면 비활성화만 수행 (하드 삭제 방지)
  const [child] = await db.select().from(qnaCategories).where(eq(qnaCategories.parentId, id));
  const [question] = await db.select().from(qnaQuestions).where(eq(qnaQuestions.categoryId, id));
  if (child || question) {
    await db.update(qnaCategories).set({ isActive: 0 }).where(eq(qnaCategories.id, id));
    return { deactivated: true };
  }
  await db.delete(qnaCategories).where(eq(qnaCategories.id, id));
  return { deleted: true };
}

/**
 * 비밀글 비밀번호 검증 — 성공 시 전체 내용 반환.
 * @param {string} slug
 * @param {string} password
 */
async function verifyQuestionPassword(slug, password) {
  const [row] = await db.select().from(qnaQuestions).where(eq(qnaQuestions.slug, slug));
  if (!row || row.status !== "published") {
    throw new ServiceError("질문을 찾을 수 없습니다", 404);
  }
  if (!row.isPrivate) {
    // 비밀글이 아니면 그냥 반환
    return toPublicQuestion(row, { revealPrivate: true });
  }
  if (!row.passwordHash) {
    throw new ServiceError("이 비밀글은 비밀번호로 열람할 수 없습니다", 403);
  }
  if (!verifyPassword(password, row.passwordHash)) {
    throw new ServiceError("비밀번호가 일치하지 않습니다", 403);
  }
  const ancestors = await getCategoryAncestors(row.categoryId);
  const category = ancestors[ancestors.length - 1] || null;
  const breadcrumb = ancestors.map((a) => ({ id: a.id, name: a.name, slug: a.slug, depth: a.depth }));
  return { ...toPublicQuestion(row, { revealPrivate: true }), category, breadcrumb };
}

module.exports = {
  // 공개
  getCategoryTree,
  findCategoryBySlug,
  getCategoryAncestors,
  listQuestions,
  getQuestion,
  submitQuestion,
  verifyQuestionPassword,
  // 관리자
  adminListQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  // 유틸
  sanitizePII,
  generateAnonymousDisplayName,
  generateQuestionSlug,
};
