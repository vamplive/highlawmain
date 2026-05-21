/**
 * 시간 기록(Time Entries) 서비스 — 변호사 시급제 청구 기반
 *
 * 도메인 규칙:
 *  - active 타이머는 ended_at IS NULL 인 행. 한 변호사당 최대 1개의 active 타이머만 허용.
 *  - duration_minutes 는 ended_at 시점에 (ended_at - started_at) 분으로 계산해 저장.
 *  - hourly_rate_krw 는 진행 시점의 변호사 시급 스냅샷 — 사후에 시급이 바뀌어도 청구액 유지.
 *  - billable=1 + billed=0 인 항목만 청구서에 끌어올 수 있다 (markBilled 로 0→1 전환).
 */
const crypto = require("crypto");
const { db, sqlite } = require("../db");
const { timeEntries, lawyers, TIME_ENTRY_ACTIVITY_TYPES } = require("../db/schema");
const { eq, and, desc, isNull, gte, lte, sql, inArray } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
} = require("./helpers");

/**
 * 변호사의 현재 시급(KRW) 을 조회한다. 기본 0.
 */
async function getLawyerHourlyRate(lawyerId) {
  const [row] = await db
    .select({ rate: lawyers.defaultHourlyRateKrw })
    .from(lawyers)
    .where(eq(lawyers.id, lawyerId))
    .limit(1);
  return row?.rate || 0;
}

/**
 * input 검증 — 새 entry 생성/수정 시 공통.
 */
function assertActivityType(activityType) {
  if (activityType && !TIME_ENTRY_ACTIVITY_TYPES.includes(activityType)) {
    throw new ServiceError(`activityType 은 ${TIME_ENTRY_ACTIVITY_TYPES.join(", ")} 중 하나여야 합니다`, 400);
  }
}

function diffMinutes(startedAt, endedAt) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 60000));
}

/**
 * 변호사의 현재 진행 중 타이머가 있는지 확인.
 */
async function getActiveTimer(lawyerId) {
  validateUUID(lawyerId);
  const [active] = await db
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.lawyerId, lawyerId), isNull(timeEntries.endedAt)))
    .limit(1);
  return active || null;
}

/**
 * 새로운 타이머 시작. 같은 변호사에게 active 타이머가 있으면 ServiceError.
 */
async function startTimer(input) {
  const {
    lawyerId, clientId = null, caseId = null, contractId = null,
    description = "", activityType = "work", billable = 1,
  } = input || {};
  validateUUID(lawyerId);
  if (!description || !description.trim()) {
    throw new ServiceError("작업 설명(description)은 필수입니다", 400);
  }
  assertActivityType(activityType);

  const existing = await getActiveTimer(lawyerId);
  if (existing) {
    throw new ServiceError("이미 진행 중인 타이머가 있습니다. 먼저 종료하세요.", 409);
  }

  const id = crypto.randomUUID();
  const now = nowTimestamp();
  const rate = await getLawyerHourlyRate(lawyerId);

  await db.insert(timeEntries).values({
    id,
    lawyerId,
    clientId: clientId || null,
    caseId: caseId || null,
    contractId: contractId || null,
    description: description.trim(),
    activityType,
    startedAt: now,
    hourlyRateKrw: rate,
    billable: billable ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  });
  return getById(id);
}

/**
 * 진행 중 타이머 종료. duration_minutes 자동 계산.
 */
async function stopTimer(lawyerId) {
  const active = await getActiveTimer(lawyerId);
  if (!active) throw new ServiceError("진행 중인 타이머가 없습니다", 404);
  const now = nowTimestamp();
  const minutes = diffMinutes(active.startedAt, now);
  await db.update(timeEntries)
    .set({ endedAt: now, durationMinutes: minutes, updatedAt: now })
    .where(eq(timeEntries.id, active.id));
  return getById(active.id);
}

/**
 * 수동 entry 생성 (이미 끝난 작업을 사후 입력).
 */
async function create(input) {
  const {
    lawyerId, clientId = null, caseId = null, contractId = null,
    description = "", activityType = "work",
    startedAt, endedAt, durationMinutes,
    hourlyRateKrw, billable = 1, memo = null,
  } = input || {};
  validateUUID(lawyerId);
  if (!description?.trim()) throw new ServiceError("description 은 필수입니다", 400);
  if (!startedAt) throw new ServiceError("startedAt 은 필수입니다", 400);
  assertActivityType(activityType);

  let computedMinutes = durationMinutes;
  if (computedMinutes == null && endedAt) {
    computedMinutes = diffMinutes(startedAt, endedAt);
  }
  if (computedMinutes != null && computedMinutes < 0) {
    throw new ServiceError("durationMinutes 는 0 이상이어야 합니다", 400);
  }

  const id = crypto.randomUUID();
  const now = nowTimestamp();
  const rate = hourlyRateKrw ?? await getLawyerHourlyRate(lawyerId);

  await db.insert(timeEntries).values({
    id, lawyerId,
    clientId: clientId || null, caseId: caseId || null, contractId: contractId || null,
    description: description.trim(), activityType,
    startedAt, endedAt: endedAt || null,
    durationMinutes: computedMinutes ?? null,
    hourlyRateKrw: rate,
    billable: billable ? 1 : 0,
    memo: memo || null,
    createdAt: now, updatedAt: now,
  });
  return getById(id);
}

/**
 * 기존 entry 갱신 — billed=1 인 항목은 수정 금지(invoice 회계 정합성).
 */
async function update(id, input) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("기록을 찾을 수 없습니다", 404);
  if (existing.billed === 1) {
    throw new ServiceError("이미 청구된 기록은 수정할 수 없습니다", 409);
  }
  const allowed = ["description", "activityType", "startedAt", "endedAt", "durationMinutes",
    "hourlyRateKrw", "billable", "clientId", "caseId", "contractId", "memo"];
  const next = { updatedAt: nowTimestamp() };
  for (const key of allowed) {
    if (input[key] !== undefined) next[key] = input[key];
  }
  if (next.activityType) assertActivityType(next.activityType);
  if (next.durationMinutes != null && next.durationMinutes < 0) {
    throw new ServiceError("durationMinutes 는 0 이상이어야 합니다", 400);
  }
  /* startedAt + endedAt 둘 다 있으면 duration 자동 재계산 */
  const startedAt = next.startedAt ?? existing.startedAt;
  const endedAt = next.endedAt ?? existing.endedAt;
  if (next.durationMinutes === undefined && startedAt && endedAt) {
    next.durationMinutes = diffMinutes(startedAt, endedAt);
  }
  await db.update(timeEntries).set(next).where(eq(timeEntries.id, id));
  return getById(id);
}

async function remove(id) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("기록을 찾을 수 없습니다", 404);
  if (existing.billed === 1) {
    throw new ServiceError("이미 청구된 기록은 삭제할 수 없습니다", 409);
  }
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
  return { id };
}

async function getById(id) {
  validateUUID(id);
  const [row] = await db.select().from(timeEntries).where(eq(timeEntries.id, id)).limit(1);
  return row || null;
}

/**
 * 목록 조회 + 필터링 (변호사/의뢰인/사건/날짜/청구상태).
 */
async function list(query = {}) {
  const { lawyerId, clientId, caseId, contractId, billable, billed, from, to } = query;
  const { page, limit, offset } = parsePagination(query, { maxLimit: 200 });

  const conditions = [];
  if (lawyerId) conditions.push(eq(timeEntries.lawyerId, lawyerId));
  if (clientId) conditions.push(eq(timeEntries.clientId, clientId));
  if (caseId) conditions.push(eq(timeEntries.caseId, caseId));
  if (contractId) conditions.push(eq(timeEntries.contractId, contractId));
  if (billable === "1" || billable === true) conditions.push(eq(timeEntries.billable, 1));
  if (billable === "0" || billable === false) conditions.push(eq(timeEntries.billable, 0));
  if (billed === "1" || billed === true) conditions.push(eq(timeEntries.billed, 1));
  if (billed === "0" || billed === false) conditions.push(eq(timeEntries.billed, 0));
  if (from) conditions.push(gte(timeEntries.startedAt, from));
  if (to) conditions.push(lte(timeEntries.startedAt, to));

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(timeEntries)
    .where(where);

  const rows = await db
    .select()
    .from(timeEntries)
    .where(where)
    .orderBy(desc(timeEntries.startedAt))
    .limit(limit)
    .offset(offset);

  return {
    data: rows,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 요약 — 총 시간, 청구 가능 시간, 미청구 금액, 청구 완료 금액 등.
 */
async function summary(query = {}) {
  const { lawyerId, clientId, caseId, from, to } = query;
  const conditions = [];
  if (lawyerId) conditions.push(eq(timeEntries.lawyerId, lawyerId));
  if (clientId) conditions.push(eq(timeEntries.clientId, clientId));
  if (caseId) conditions.push(eq(timeEntries.caseId, caseId));
  if (from) conditions.push(gte(timeEntries.startedAt, from));
  if (to) conditions.push(lte(timeEntries.startedAt, to));
  const where = conditions.length ? and(...conditions) : undefined;

  const [agg] = await db
    .select({
      totalEntries: sql`count(*)`.mapWith(Number),
      totalMinutes: sql`coalesce(sum(${timeEntries.durationMinutes}), 0)`.mapWith(Number),
      billableMinutes: sql`coalesce(sum(case when ${timeEntries.billable} = 1 then ${timeEntries.durationMinutes} else 0 end), 0)`.mapWith(Number),
      billedAmountKrw: sql`coalesce(sum(case when ${timeEntries.billed} = 1 then ${timeEntries.durationMinutes} * ${timeEntries.hourlyRateKrw} / 60 else 0 end), 0)`.mapWith(Number),
      unbilledAmountKrw: sql`coalesce(sum(case when ${timeEntries.billable} = 1 and ${timeEntries.billed} = 0 then ${timeEntries.durationMinutes} * ${timeEntries.hourlyRateKrw} / 60 else 0 end), 0)`.mapWith(Number),
    })
    .from(timeEntries)
    .where(where);

  return agg || {
    totalEntries: 0, totalMinutes: 0, billableMinutes: 0,
    billedAmountKrw: 0, unbilledAmountKrw: 0,
  };
}

/**
 * 활동 유형 한국어 라벨 — 인보이스 항목 description 에 사용.
 */
const ACTIVITY_LABELS = {
  work: "법률 업무",
  research: "조사·검색",
  meeting: "회의",
  court: "법정 출석",
  call: "전화 상담",
  email: "이메일 응대",
  travel: "이동 시간",
};

/**
 * 선택된 시간 기록을 송장(invoice)으로 변환한다.
 *
 * 도메인 규칙:
 *  - 모든 entry 는 같은 의뢰인이어야 한다.
 *  - billable=1, billed=0, ended_at IS NOT NULL 인 항목만 가능.
 *  - 한 거래로 entry 를 invoice_items 에 추가하고, time_entries 의 billed=1 + invoice_id 를 마킹.
 *  - 인보이스는 'draft' 상태로 생성되어 사용자가 검토 후 발행할 수 있도록 한다.
 *  - 항목별 금액 = duration_minutes × hourly_rate_krw / 60 (정수 KRW).
 *
 * @param {object} input
 * @param {string[]} input.timeEntryIds - 변환할 entry id 배열
 * @param {string} [input.dueDate] - 인보이스 만기일 (YYYY-MM-DD)
 * @param {string} [input.notes] - 메모
 * @param {number} [input.vatRate=10] - 부가세율
 * @param {string} [actor] - 작성자 (감사 로그용)
 * @returns {{ invoiceId: string, itemCount: number, subtotal: number, total: number }}
 */
async function createInvoiceFromEntries({ timeEntryIds, dueDate = null, notes = null, vatRate = 10 } = {}, actor) {
  if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
    throw new ServiceError("timeEntryIds 가 1개 이상 필요합니다", 400);
  }
  for (const id of timeEntryIds) validateUUID(id);

  /* 대상 entry 조회 + 검증 */
  const rows = await db
    .select()
    .from(timeEntries)
    .where(inArray(timeEntries.id, timeEntryIds));

  if (rows.length !== timeEntryIds.length) {
    throw new ServiceError("일부 시간 기록을 찾을 수 없습니다", 404);
  }

  const clientIds = new Set(rows.map((r) => r.clientId).filter(Boolean));
  if (clientIds.size === 0) {
    throw new ServiceError("의뢰인이 지정되지 않은 기록이 포함되어 있습니다", 400);
  }
  if (clientIds.size > 1) {
    throw new ServiceError("같은 의뢰인의 기록만 한 번에 송장으로 변환할 수 있습니다", 400);
  }
  const clientId = [...clientIds][0];

  for (const r of rows) {
    if (!r.billable) {
      throw new ServiceError(`청구 불가 항목 포함됨 (id: ${r.id.slice(0, 8)})`, 400);
    }
    if (r.billed) {
      throw new ServiceError(`이미 청구된 항목 포함됨 (id: ${r.id.slice(0, 8)})`, 409);
    }
    if (!r.endedAt) {
      throw new ServiceError(`아직 진행 중인 타이머 포함됨 (id: ${r.id.slice(0, 8)})`, 400);
    }
    if (!r.durationMinutes || r.durationMinutes <= 0) {
      throw new ServiceError(`지속 시간이 0 인 항목 포함됨 (id: ${r.id.slice(0, 8)})`, 400);
    }
  }

  /* 인보이스 항목 합산 */
  const items = rows
    .sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1))
    .map((r, idx) => {
      const hours = r.durationMinutes / 60;
      const amount = Math.round(r.durationMinutes * r.hourlyRateKrw / 60);
      const label = ACTIVITY_LABELS[r.activityType] || r.activityType;
      return {
        id: crypto.randomUUID(),
        position: idx,
        description: `[${label}] ${r.description}`,
        specification: `${r.startedAt?.slice(0, 16) || ""} · ${hours.toFixed(2)}h × ${r.hourlyRateKrw.toLocaleString("ko-KR")}원/h`,
        quantity: hours,
        unitPrice: r.hourlyRateKrw,
        amount,
        vatIncluded: 0,
      };
    });

  const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
  const vatAmount = Math.round((subtotal * vatRate) / 100);
  const total = subtotal + vatAmount;
  const invoiceId = crypto.randomUUID();
  const now = nowTimestamp();
  const issuedDate = now.slice(0, 10);

  /* 동기 트랜잭션 (better-sqlite3) — invoice + items + time_entries 마킹 원자적 처리 */
  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO invoices (
        id, type, status, client_id,
        issued_date, due_date,
        subtotal, vat_rate, vat_amount, total,
        notes, issued_by
      ) VALUES (?, 'simple', 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId, clientId,
      issuedDate, dueDate || null,
      subtotal, vatRate, vatAmount, total,
      notes || `${rows.length}건의 시간 기록으로부터 자동 생성`,
      actor || null,
    );

    const itemStmt = sqlite.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, position, description, specification,
        quantity, unit_price, amount, vat_included
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const it of items) {
      itemStmt.run(it.id, invoiceId, it.position, it.description, it.specification,
        it.quantity, it.unitPrice, it.amount, it.vatIncluded);
    }

    /* time_entries 마킹 */
    const updateStmt = sqlite.prepare(`
      UPDATE time_entries SET billed = 1, invoice_id = ?, updated_at = ? WHERE id = ?
    `);
    for (const id of timeEntryIds) updateStmt.run(invoiceId, now, id);

    /* invoice_activity_log 한 줄 (활동 추적용) */
    try {
      sqlite.prepare(`
        INSERT INTO invoice_activity_log (id, invoice_id, action, actor_id, details, created_at)
        VALUES (?, ?, 'created', ?, ?, ?)
      `).run(
        crypto.randomUUID(), invoiceId, actor || null,
        JSON.stringify({ source: "time_entries", timeEntryIds, count: rows.length }),
        now,
      );
    } catch {
      /* invoice_activity_log 테이블 없거나 다른 스키마면 무시 */
    }
  });
  tx();

  return {
    invoiceId,
    itemCount: items.length,
    subtotal,
    vatAmount,
    total,
    clientId,
  };
}

module.exports = {
  getById,
  list,
  create,
  update,
  remove,
  startTimer,
  stopTimer,
  getActiveTimer,
  summary,
  createInvoiceFromEntries,
  TIME_ENTRY_ACTIVITY_TYPES,
};
