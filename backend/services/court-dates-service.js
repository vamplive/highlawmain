/**
 * 법정 일정(Court Dates) 서비스 — 재판/조정/심문 등 일정 관리.
 *
 * 도메인 규칙:
 *  - kind: hearing(변론기일), mediation(조정기일), examination(심문기일),
 *          sentencing(선고기일), deadline(서면 제출기한 등)
 *  - status: scheduled / completed / postponed / cancelled
 *  - reminderAt 이 도래하면 리마인더 시스템(별도 cron) 이 reminded=1 마킹.
 */
const crypto = require("crypto");
const { db } = require("../db");
const { courtDates, COURT_DATE_KINDS, COURT_DATE_STATUSES } = require("../db/schema");
const { eq, and, gte, lte, asc, desc, sql, inArray } = require("drizzle-orm");
const {
  ServiceError, validateUUID, parsePagination, buildPaginationMeta, nowTimestamp,
} = require("./helpers");

function assertEnums({ kind, status }) {
  if (kind && !COURT_DATE_KINDS.includes(kind)) {
    throw new ServiceError(`kind 는 ${COURT_DATE_KINDS.join(", ")} 중 하나여야 합니다`, 400);
  }
  if (status && !COURT_DATE_STATUSES.includes(status)) {
    throw new ServiceError(`status 는 ${COURT_DATE_STATUSES.join(", ")} 중 하나여야 합니다`, 400);
  }
}

async function getById(id) {
  validateUUID(id);
  const [row] = await db.select().from(courtDates).where(eq(courtDates.id, id)).limit(1);
  return row || null;
}

async function list(query = {}) {
  const { lawyerId, clientId, caseId, kind, status, from, to, upcoming } = query;
  const { page, limit, offset } = parsePagination(query, { maxLimit: 200 });

  const conditions = [];
  if (lawyerId) conditions.push(eq(courtDates.lawyerId, lawyerId));
  if (clientId) conditions.push(eq(courtDates.clientId, clientId));
  if (caseId) conditions.push(eq(courtDates.caseId, caseId));
  if (kind) conditions.push(eq(courtDates.kind, kind));
  if (status) {
    const statuses = String(status).split(",").map((s) => s.trim()).filter(Boolean);
    conditions.push(inArray(courtDates.status, statuses));
  }
  if (from) conditions.push(gte(courtDates.startsAt, from));
  if (to) conditions.push(lte(courtDates.startsAt, to));
  if (upcoming === "true" || upcoming === true) {
    conditions.push(gte(courtDates.startsAt, nowTimestamp()));
    conditions.push(eq(courtDates.status, "scheduled"));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(courtDates)
    .where(where);

  const upcomingFilter = upcoming === "true" || upcoming === true;
  const rows = await db
    .select()
    .from(courtDates)
    .where(where)
    .orderBy(upcomingFilter ? asc(courtDates.startsAt) : desc(courtDates.startsAt))
    .limit(limit)
    .offset(offset);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

async function create(input) {
  const {
    title, courtName = null, courtRoom = null, caseNumber = null,
    caseId = null, clientId = null, lawyerId = null,
    kind = "hearing", startsAt, endsAt = null,
    reminderAt = null, memo = null, status = "scheduled",
  } = input || {};
  if (!title?.trim()) throw new ServiceError("title 은 필수입니다", 400);
  if (!startsAt) throw new ServiceError("startsAt 은 필수입니다", 400);
  assertEnums({ kind, status });

  const id = crypto.randomUUID();
  const now = nowTimestamp();
  await db.insert(courtDates).values({
    id, title: title.trim(),
    courtName, courtRoom, caseNumber,
    caseId: caseId || null, clientId: clientId || null, lawyerId: lawyerId || null,
    kind, startsAt, endsAt: endsAt || null,
    reminderAt: reminderAt || null,
    memo, status,
    createdAt: now, updatedAt: now,
  });
  return getById(id);
}

async function update(id, input) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("일정을 찾을 수 없습니다", 404);
  assertEnums({ kind: input.kind, status: input.status });

  const allowed = ["title", "courtName", "courtRoom", "caseNumber",
    "caseId", "clientId", "lawyerId", "kind",
    "startsAt", "endsAt", "reminderAt", "memo", "status"];
  const next = { updatedAt: nowTimestamp() };
  for (const key of allowed) {
    if (input[key] !== undefined) next[key] = input[key];
  }
  /* reminderAt 이 변경되면 reminded 플래그 초기화 */
  if (input.reminderAt !== undefined) next.reminded = 0;

  await db.update(courtDates).set(next).where(eq(courtDates.id, id));
  return getById(id);
}

async function remove(id) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("일정을 찾을 수 없습니다", 404);
  await db.delete(courtDates).where(eq(courtDates.id, id));
  return { id };
}

module.exports = {
  getById, list, create, update, remove,
  COURT_DATE_KINDS, COURT_DATE_STATUSES,
};
