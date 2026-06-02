/**
 * 업무(Tasks) 서비스 — 사건/계약/일반 업무 단위 관리.
 *
 * 도메인 규칙:
 *  - status 변경 시 'done' 으로 가면 completed_at, completed_by 자동 기록.
 *  - status 가 'open'/'in_progress'/'blocked' 로 다시 돌아가면 completed_at 초기화.
 *  - dueDate 가 과거인데 status 가 미완료면 별도 분류 가능 (overdue).
 */
const crypto = require("crypto");
const { db } = require("../db");
const { tasks, TASK_PRIORITIES, TASK_STATUSES } = require("../db/schema");
const { eq, and, desc, asc, lt, isNotNull, sql, inArray } = require("drizzle-orm");
const {
  ServiceError, validateUUID, parsePagination, buildPaginationMeta, nowTimestamp,
} = require("./helpers");

function assertEnums({ priority, status }) {
  if (priority && !TASK_PRIORITIES.includes(priority)) {
    throw new ServiceError(`priority 는 ${TASK_PRIORITIES.join(", ")} 중 하나여야 합니다`, 400);
  }
  if (status && !TASK_STATUSES.includes(status)) {
    throw new ServiceError(`status 는 ${TASK_STATUSES.join(", ")} 중 하나여야 합니다`, 400);
  }
}

async function getById(id) {
  validateUUID(id);
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row || null;
}

async function list(query = {}) {
  const { assigneeLawyerId, clientId, caseId, contractId, status, priority, overdue } = query;
  const { page, limit, offset } = parsePagination(query, { maxLimit: 200 });

  const conditions = [];
  if (assigneeLawyerId) conditions.push(eq(tasks.assigneeLawyerId, assigneeLawyerId));
  if (clientId) conditions.push(eq(tasks.clientId, clientId));
  if (caseId) conditions.push(eq(tasks.caseId, caseId));
  if (contractId) conditions.push(eq(tasks.contractId, contractId));
  if (status) {
    const statuses = String(status).split(",").map((s) => s.trim()).filter(Boolean);
    conditions.push(inArray(tasks.status, statuses));
  }
  if (priority) conditions.push(eq(tasks.priority, priority));
  if (overdue === "true" || overdue === true) {
    conditions.push(and(
      isNotNull(tasks.dueDate),
      lt(tasks.dueDate, nowTimestamp().slice(0, 10)),
      inArray(tasks.status, ["open", "in_progress", "blocked"]),
    ));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(tasks)
    .where(where);

  /* 정렬: 기본 due_date 빠른 순 → 우선순위 → 생성일 */
  const rows = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(
      sql`case ${tasks.status} when 'in_progress' then 0 when 'open' then 1 when 'blocked' then 2 when 'done' then 3 else 4 end`,
      asc(tasks.dueDate),
      desc(tasks.createdAt),
    )
    .limit(limit)
    .offset(offset);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

async function create(input) {
  const {
    title, description = null, assigneeLawyerId = null,
    clientId = null, caseId = null, contractId = null,
    priority = "medium", status = "open",
    dueDate = null, reminderAt = null, createdBy = null,
  } = input || {};
  if (!title || !title.trim()) throw new ServiceError("title 은 필수입니다", 400);
  assertEnums({ priority, status });

  const id = crypto.randomUUID();
  const now = nowTimestamp();
  await db.insert(tasks).values({
    id, title: title.trim(), description,
    assigneeLawyerId: assigneeLawyerId || null,
    clientId: clientId || null, caseId: caseId || null, contractId: contractId || null,
    priority, status,
    dueDate: dueDate || null, reminderAt: reminderAt || null,
    createdBy: createdBy || null,
    createdAt: now, updatedAt: now,
  });
  return getById(id);
}

async function update(id, input, actor) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("업무를 찾을 수 없습니다", 404);

  assertEnums({ priority: input.priority, status: input.status });
  const allowed = ["title", "description", "assigneeLawyerId", "clientId", "caseId",
    "contractId", "priority", "status", "dueDate", "reminderAt"];
  const next = { updatedAt: nowTimestamp() };
  for (const key of allowed) {
    if (input[key] !== undefined) next[key] = input[key];
  }

  /* status 변경 시 completedAt/completedBy 자동 관리 */
  if (next.status && next.status !== existing.status) {
    if (next.status === "done") {
      next.completedAt = next.updatedAt;
      next.completedBy = actor || null;
    } else {
      next.completedAt = null;
      next.completedBy = null;
    }
  }

  await db.update(tasks).set(next).where(eq(tasks.id, id));
  return getById(id);
}

async function remove(id) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("업무를 찾을 수 없습니다", 404);
  await db.delete(tasks).where(eq(tasks.id, id));
  return { id };
}

/**
 * 변호사별 미완료 업무 카운트 — 대시보드용.
 */
async function countByLawyer(lawyerId) {
  validateUUID(lawyerId);
  const [row] = await db
    .select({
      open: sql`coalesce(sum(case when ${tasks.status} = 'open' then 1 else 0 end), 0)`.mapWith(Number),
      inProgress: sql`coalesce(sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end), 0)`.mapWith(Number),
      blocked: sql`coalesce(sum(case when ${tasks.status} = 'blocked' then 1 else 0 end), 0)`.mapWith(Number),
      overdue: sql`coalesce(sum(case when ${tasks.dueDate} < date('now') and ${tasks.status} in ('open','in_progress','blocked') then 1 else 0 end), 0)`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.assigneeLawyerId, lawyerId));
  return row || { open: 0, inProgress: 0, blocked: 0, overdue: 0 };
}

module.exports = {
  getById, list, create, update, remove, countByLawyer,
  TASK_PRIORITIES, TASK_STATUSES,
};
