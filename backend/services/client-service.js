/**
 * 고객 서비스 — 고객 CRUD 비즈니스 로직
 * - 상담 신청 시 자동 등록되거나 관리자가 직접 등록
 */
const { db } = require("../db");
const {
  clients, consultations, messageLogs,
  bookingSlots, caseFilesTable,
} = require("../db/schema");
const { eq, desc, sql, and, like, or, inArray, gte, lte } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  cleanPhone,
} = require("./helpers");

/**
 * tags 필드 정규화 — 입력이 배열/문자열 어느 쪽이어도 JSON 문자열로 변환한다.
 * 빈 배열, null, undefined는 null로 저장해 DB에서 구분한다.
 * @param {any} tags
 * @returns {string|null}
 */
function normalizeTags(tags) {
  if (tags === null || tags === undefined) return null;
  let arr = tags;
  if (typeof tags === "string") {
    try { arr = JSON.parse(tags); } catch { arr = [tags]; }
  }
  if (!Array.isArray(arr)) return null;
  const cleaned = arr
    .map((t) => (typeof t === "string" ? t.trim() : String(t || "").trim()))
    .filter(Boolean)
    .slice(0, 20); // 태그 최대 20개
  if (cleaned.length === 0) return null;
  // 중복 제거
  return JSON.stringify([...new Set(cleaned)]);
}

/**
 * DB에서 꺼낸 client 레코드의 tags 문자열을 배열로 변환한다.
 * @param {object} row
 * @returns {object} tags가 배열로 파싱된 객체
 */
function hydrateClient(row) {
  if (!row) return row;
  let tags = [];
  if (row.tags) {
    try { tags = JSON.parse(row.tags); } catch { tags = []; }
  }
  return { ...row, tags: Array.isArray(tags) ? tags : [] };
}

/**
 * 고객 목록 조회 (페이지네이션 + 검색/필터)
 * @param {object} filters - { page, limit, q, source, active }
 * @returns {{ items: Array, meta: object }}
 */
async function listClients(filters) {
  const { page, limit, offset } = parsePagination(filters);

  const conditions = [];
  if (filters.source) {
    conditions.push(eq(clients.source, filters.source));
  }
  if (filters.active !== undefined) {
    conditions.push(eq(clients.isActive, filters.active === "true" ? 1 : 0));
  }
  const { escapeLike } = require("../lib/sanitize");

  if (filters.q) {
    const escaped = escapeLike(filters.q);
    conditions.push(
      or(
        like(clients.name, `%${escaped}%`),
        like(clients.phone, `%${escaped}%`),
        like(clients.email, `%${escaped}%`),
      )
    );
  }

  // 태그 필터 — JSON 배열 문자열 안에서 LIKE 검색 (SQLite가 JSON1 없이도 작동)
  // whereClause 빌드 전에 추가해야 실제 쿼리에 반영된다. 큰따옴표 + LIKE 와일드카드 모두 이스케이프.
  if (filters.tag) {
    const safeTag = escapeLike(String(filters.tag).replace(/"/g, ""));
    conditions.push(like(clients.tags, `%"${safeTag}"%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select().from(clients);
  let countQuery = db.select({ total: sql`count(*)` }).from(clients);

  if (whereClause) {
    query = query.where(whereClause);
    countQuery = countQuery.where(whereClause);
  }

  const rows = await query.orderBy(desc(clients.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await countQuery;

  return {
    items: rows.map(hydrateClient),
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 고객 등록
 * @param {object} data - { name, phone, email?, category?, memo?, source? }
 * @returns {object} 생성된 고객 레코드
 */
async function createClient(data) {
  const { name, phone, email, category, memo, source, tags } = data;

  if (!name?.trim() || !phone?.trim()) {
    throw new ServiceError("이름과 전화번호는 필수입니다", 400);
  }

  const phoneDigits = cleanPhone(phone.trim());

  // 전화번호 중복 체크
  const [existing] = await db.select().from(clients)
    .where(eq(clients.phone, phoneDigits));
  if (existing) {
    throw new ServiceError("이미 등록된 전화번호입니다", 409);
  }

  const [inserted] = await db.insert(clients).values({
    name: name.trim(),
    phone: phoneDigits,
    email: email?.trim() || null,
    category: category || null,
    memo: memo?.trim() || null,
    source: source || "manual",
    tags: normalizeTags(tags),
  }).returning();

  return hydrateClient(inserted);
}

/**
 * 고객 정보 수정
 * @param {string} id - 고객 UUID
 * @param {object} data - 수정할 필드
 * @returns {object} 수정된 고객 레코드
 */
async function updateClient(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) {
    throw new ServiceError("고객을 찾을 수 없습니다", 404);
  }

  const { name, phone, email, category, memo, isActive, tags, smsConsent, emailConsent } = data;
  const updateData = { updatedAt: sql`(datetime('now'))` };
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = cleanPhone(phone.trim());
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (category !== undefined) updateData.category = category;
  if (memo !== undefined) updateData.memo = memo?.trim() || null;
  if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
  if (tags !== undefined) updateData.tags = normalizeTags(tags);
  if (smsConsent !== undefined) updateData.smsConsent = smsConsent ? 1 : 0;
  if (emailConsent !== undefined) updateData.emailConsent = emailConsent ? 1 : 0;

  const [updated] = await db.update(clients)
    .set(updateData)
    .where(eq(clients.id, id))
    .returning();

  return hydrateClient(updated);
}

/**
 * 고객 삭제
 * @param {string} id - 고객 UUID
 * @returns {{ deleted: true }}
 */
async function deleteClient(id) {
  validateUUID(id);

  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) {
    throw new ServiceError("고객을 찾을 수 없습니다", 404);
  }

  await db.delete(clients).where(eq(clients.id, id));
  return { deleted: true };
}

/**
 * 단일 고객 조회
 * @param {string} id - 고객 UUID
 * @returns {object} 고객 레코드
 */
async function getClientById(id) {
  validateUUID(id);
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) {
    throw new ServiceError("고객을 찾을 수 없습니다", 404);
  }
  return hydrateClient(client);
}

/**
 * 고객 통합 타임라인 조회
 * - 상담 신청 + 메시지 발송 + 상담 예약 + 사건을 시간 역순으로 병합
 * - phone·email·consultationId 매칭으로 관련 기록 수집
 * @param {string} id - 고객 UUID
 * @returns {{ client, summary, events }}
 */
async function getClientTimeline(id) {
  const client = await getClientById(id);

  // 1) 관련 상담신청 — 동일 phone/email 또는 consultationId 연결
  const consultationConditions = [eq(consultations.phone, client.phone)];
  if (client.email) {
    consultationConditions.push(eq(consultations.email, client.email));
  }
  if (client.consultationId) {
    consultationConditions.push(eq(consultations.id, client.consultationId));
  }
  const consultationRows = await db.select().from(consultations)
    .where(or(...consultationConditions))
    .orderBy(desc(consultations.createdAt));

  // 2) 메시지 이력 — recipientContact가 phone 또는 email과 일치
  const messageConditions = [eq(messageLogs.recipientContact, client.phone)];
  if (client.email) {
    messageConditions.push(eq(messageLogs.recipientContact, client.email));
  }
  const messageRows = await db.select().from(messageLogs)
    .where(or(...messageConditions))
    .orderBy(desc(messageLogs.createdAt));

  // 3) 상담 예약 — consultationId 기반
  const consultationIds = consultationRows.map((c) => c.id);
  let bookingRows = [];
  if (consultationIds.length > 0) {
    bookingRows = await db.select().from(bookingSlots)
      .where(inArray(bookingSlots.consultationId, consultationIds));
  }

  // 4) 사건 — clientId 기반
  const caseRows = await db.select().from(caseFilesTable)
    .where(eq(caseFilesTable.clientId, client.id));

  // 통합 타임라인 이벤트 생성 (시간 역순 정렬)
  const events = [];
  consultationRows.forEach((c) => events.push({
    type: "consultation",
    id: c.id,
    at: c.createdAt,
    status: c.status,
    title: "상담 신청",
    payload: {
      category: c.category, message: c.message, name: c.name,
      phone: c.phone, email: c.email, adminNote: c.adminNote,
    },
  }));
  messageRows.forEach((m) => events.push({
    type: "message",
    id: m.id,
    at: m.sentAt || m.createdAt,
    status: m.status,
    title: m.channel === "sms" ? "SMS 발송" : "이메일 발송",
    payload: {
      channel: m.channel, subject: m.subject, content: m.content,
      errorMessage: m.errorMessage, recipientContact: m.recipientContact,
    },
  }));
  bookingRows.forEach((b) => events.push({
    type: "booking",
    id: b.id,
    at: b.createdAt,
    status: b.isAvailable ? "available" : "booked",
    title: "상담 예약",
    payload: { date: b.date, startTime: b.startTime, endTime: b.endTime },
  }));
  caseRows.forEach((c) => events.push({
    type: "case",
    id: c.id,
    at: c.createdAt,
    status: c.status,
    title: "사건",
    payload: { title: c.title, description: c.description },
  }));

  events.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));

  const lastMessage = events.find((e) => e.type === "message");

  return {
    client,
    summary: {
      consultationCount: consultationRows.length,
      messageCount: messageRows.length,
      bookingCount: bookingRows.length,
      caseCount: caseRows.length,
      lastContactedAt: lastMessage ? lastMessage.at : null,
    },
    events,
  };
}

/**
 * 세그먼트 조건으로 고객을 매칭한다.
 * - categories: 분야 배열 (OR)
 * - sources: 출처 배열 (OR)
 * - tags: 태그 배열 (AND — 모두 포함해야 매칭)
 * - consultationStatuses: 최신 상담 신청 상태 배열 (OR)
 * - lastContactedBefore / lastContactedAfter: 마지막 연락 시점 범위
 * - hasPhone / hasEmail: 연락처 존재 여부
 * - isActive: 활성 고객만 (기본 true)
 * @param {object} criteria
 * @returns {{ items, count, criteria }}
 */
async function findClientsBySegment(criteria = {}) {
  const {
    categories, sources, tags, consultationStatuses,
    lastContactedBefore, lastContactedAfter,
    hasPhone, hasEmail,
    isActive = true,
  } = criteria;

  const conditions = [];

  if (isActive !== null && isActive !== undefined) {
    conditions.push(eq(clients.isActive, isActive ? 1 : 0));
  }
  if (Array.isArray(categories) && categories.length > 0) {
    conditions.push(inArray(clients.category, categories));
  }
  if (Array.isArray(sources) && sources.length > 0) {
    conditions.push(inArray(clients.source, sources));
  }
  // 태그는 AND — 모든 태그를 포함한 고객만 매칭
  if (Array.isArray(tags) && tags.length > 0) {
    tags.forEach((t) => {
      const cleaned = String(t).replace(/"/g, '');
      conditions.push(like(clients.tags, `%"${cleaned}"%`));
    });
  }
  if (lastContactedBefore) {
    conditions.push(lte(clients.lastContactedAt, lastContactedBefore));
  }
  if (lastContactedAfter) {
    conditions.push(gte(clients.lastContactedAt, lastContactedAfter));
  }
  if (hasPhone === true) {
    conditions.push(sql`${clients.phone} IS NOT NULL AND ${clients.phone} != ''`);
  }
  if (hasEmail === true) {
    conditions.push(sql`${clients.email} IS NOT NULL AND ${clients.email} != ''`);
  }
  // 수신동의 필터 — 특정 채널 발송 대상자 좁히기 (true/false/undefined)
  if (criteria.smsConsent === true) {
    conditions.push(eq(clients.smsConsent, 1));
  } else if (criteria.smsConsent === false) {
    conditions.push(eq(clients.smsConsent, 0));
  }
  if (criteria.emailConsent === true) {
    conditions.push(eq(clients.emailConsent, 1));
  } else if (criteria.emailConsent === false) {
    conditions.push(eq(clients.emailConsent, 0));
  }

  let query = db.select().from(clients);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  let rows = await query.orderBy(desc(clients.createdAt)).limit(500);

  // consultationStatuses 필터 — clients.consultationId로 연결된 상담 상태 매칭
  // (조인 대신 2단계 쿼리 — 고객 수가 보통 수백 건이라 성능 이슈 없음)
  if (Array.isArray(consultationStatuses) && consultationStatuses.length > 0) {
    const consultationIds = rows.map((r) => r.consultationId).filter(Boolean);
    if (consultationIds.length === 0) {
      rows = [];
    } else {
      const matched = await db.select({ id: consultations.id })
        .from(consultations)
        .where(and(
          inArray(consultations.id, consultationIds),
          inArray(consultations.status, consultationStatuses),
        ));
      const matchedSet = new Set(matched.map((m) => m.id));
      rows = rows.filter((r) => r.consultationId && matchedSet.has(r.consultationId));
    }
  }

  const items = rows.map(hydrateClient);
  return { items, count: items.length, criteria };
}

/**
 * 메시지 발송 성공 시 고객의 마지막 연락 시각을 갱신한다.
 * contact (전화번호 또는 이메일)으로 고객을 찾아 lastContactedAt 업데이트.
 * 실패해도 발송에 영향 없도록 에러를 삼킨다.
 * @param {string} contact - 전화번호(숫자만) 또는 이메일
 */
async function touchLastContacted(contact) {
  if (!contact) return;
  try {
    const cleaned = contact.includes("@") ? contact : cleanPhone(contact);
    const condition = contact.includes("@")
      ? eq(clients.email, cleaned)
      : eq(clients.phone, cleaned);
    await db.update(clients)
      .set({ lastContactedAt: sql`(datetime('now'))` })
      .where(condition);
  } catch (err) {
    console.error("[lastContactedAt 갱신 오류]", err.message);
  }
}

/**
 * 수신동의 필터 — 발송 대상 목록에서 해당 채널 수신거부 고객을 제외한다.
 * 미등록 연락처(clients에 없음)는 "동의"로 간주해 통과시킨다. (관리자 수동 발송은 합법적 동의 기반이므로)
 * @param {Array<{contact:string}>} recipients - 발송 대상 목록
 * @param {"sms"|"email"} channel
 * @returns {Promise<{allowed: Array, blocked: Array}>}
 */
async function filterByConsent(recipients, channel) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { allowed: [], blocked: [] };
  }

  const contactField = channel === "email" ? clients.email : clients.phone;
  const consentField = channel === "email" ? clients.emailConsent : clients.smsConsent;

  const normalizedContacts = recipients
    .map((r) => r.contact)
    .filter(Boolean)
    .map((c) => (channel === "email" ? c.trim().toLowerCase() : cleanPhone(c)));

  if (normalizedContacts.length === 0) {
    return { allowed: recipients, blocked: [] };
  }

  // 수신거부(0) 고객만 조회 — 기본값이 1이므로 거부 목록이 훨씬 짧음
  const blockedRows = await db
    .select({ contact: contactField })
    .from(clients)
    .where(and(inArray(contactField, normalizedContacts), eq(consentField, 0)));

  const blockedSet = new Set(
    blockedRows.map((r) => (channel === "email" ? String(r.contact || "").toLowerCase() : cleanPhone(r.contact || "")))
  );

  const allowed = [];
  const blocked = [];
  for (const r of recipients) {
    if (!r.contact) continue;
    const normalized = channel === "email" ? r.contact.trim().toLowerCase() : cleanPhone(r.contact);
    if (blockedSet.has(normalized)) {
      blocked.push(r);
    } else {
      allowed.push(r);
    }
  }
  return { allowed, blocked };
}

/**
 * unsubscribe_token으로 고객 조회 — 공개 수신거부 페이지에서 사용
 * @param {string} token
 * @returns {object|null}
 */
async function findClientByUnsubscribeToken(token) {
  if (!token || typeof token !== "string") return null;
  const [row] = await db.select().from(clients).where(eq(clients.unsubscribeToken, token));
  return row ? hydrateClient(row) : null;
}

/**
 * unsubscribe_token으로 수신동의 업데이트 (공개 페이지)
 * @param {string} token
 * @param {{ smsConsent?: boolean, emailConsent?: boolean }} changes
 * @returns {object|null} 수정된 고객 또는 null
 */
async function updateClientConsentByToken(token, changes) {
  if (!token) return null;
  const updateData = { updatedAt: sql`(datetime('now'))` };
  if (changes.smsConsent !== undefined) updateData.smsConsent = changes.smsConsent ? 1 : 0;
  if (changes.emailConsent !== undefined) updateData.emailConsent = changes.emailConsent ? 1 : 0;
  if (Object.keys(updateData).length === 1) return null; // updatedAt만 있으면 변경 없음

  const [updated] = await db.update(clients)
    .set(updateData)
    .where(eq(clients.unsubscribeToken, token))
    .returning();
  return updated ? hydrateClient(updated) : null;
}

module.exports = {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  getClientById,
  getClientTimeline,
  findClientsBySegment,
  touchLastContacted,
  filterByConsent,
  findClientByUnsubscribeToken,
  updateClientConsentByToken,
};
