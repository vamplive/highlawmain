/**
 * 의뢰인 예치금(Trust Account) 서비스 — 변호사 사무실 회계 분리 원칙.
 *
 * 도메인 규칙:
 *  - 모든 입출금은 trust_transactions ledger 행으로 기록한다.
 *  - 잔액은 항상 (sum of amount_krw WHERE voided_at IS NULL) 로 도출 (저장하지 않음).
 *  - 출금이 잔액을 초과하면 거부 (overdraft 방지) — 의뢰인 자금을 다른 의뢰인에게
 *    돌려쓰는 commingling 을 SQL 레벨에서 차단.
 *  - 등록된 거래는 수정 금지 (감사 가치 보호) — 잘못 입력 시 void 처리하고 새 거래 추가.
 *  - 거래 유형(transaction_type) 과 amount 부호의 일관성을 강제한다:
 *      deposit  → amount_krw > 0
 *      withdrawal → amount_krw < 0
 *      adjustment → 양수/음수 모두 가능
 */
const crypto = require("crypto");
const { db } = require("../db");
const { trustTransactions, clients, TRUST_TRANSACTION_TYPES, TRUST_REFERENCE_TYPES } = require("../db/schema");
const { eq, and, isNull, sql } = require("drizzle-orm");
const {
  ServiceError, validateUUID, parsePagination, buildPaginationMeta, nowTimestamp,
} = require("./helpers");

function assertTransactionType(t) {
  if (t && !TRUST_TRANSACTION_TYPES.includes(t)) {
    throw new ServiceError(`transactionType 은 ${TRUST_TRANSACTION_TYPES.join(", ")} 중 하나여야 합니다`, 400);
  }
}
function assertReferenceType(t) {
  if (t && !TRUST_REFERENCE_TYPES.includes(t)) {
    throw new ServiceError(`referenceType 은 ${TRUST_REFERENCE_TYPES.join(", ")} 중 하나여야 합니다`, 400);
  }
}

/**
 * 의뢰인 잔액 — 활성(voidedAt IS NULL) 거래 합계.
 */
async function getClientBalance(clientId) {
  validateUUID(clientId);
  const [row] = await db
    .select({
      balance: sql`coalesce(sum(${trustTransactions.amountKrw}), 0)`.mapWith(Number),
      txCount: sql`count(*)`.mapWith(Number),
    })
    .from(trustTransactions)
    .where(and(eq(trustTransactions.clientId, clientId), isNull(trustTransactions.voidedAt)));
  return { balance: row?.balance || 0, transactionCount: row?.txCount || 0 };
}

/**
 * 모든 의뢰인 잔액 (관리 화면 전체 view 용).
 * 잔액이 0 이 아닌 의뢰인만 반환.
 */
async function getAllBalances() {
  const rows = await db
    .select({
      clientId: trustTransactions.clientId,
      balance: sql`coalesce(sum(${trustTransactions.amountKrw}), 0)`.mapWith(Number),
      txCount: sql`count(*)`.mapWith(Number),
      lastTxAt: sql`max(${trustTransactions.occurredAt})`,
    })
    .from(trustTransactions)
    .where(isNull(trustTransactions.voidedAt))
    .groupBy(trustTransactions.clientId);

  /* 클라이언트 이름 join */
  const allClients = await db.select({ id: clients.id, name: clients.name }).from(clients);
  const nameMap = new Map(allClients.map((c) => [c.id, c.name]));

  return rows
    .filter((r) => r.balance !== 0)
    .map((r) => ({
      clientId: r.clientId,
      clientName: nameMap.get(r.clientId) || "(삭제된 의뢰인)",
      balance: r.balance,
      transactionCount: r.txCount,
      lastTxAt: r.lastTxAt,
    }))
    .sort((a, b) => b.balance - a.balance);
}

/**
 * 전체 합계 — 사무실의 총 의뢰인 예치금 합계
 * (은행 잔액과 reconciliation 비교용)
 */
async function getTotalBalance() {
  const [row] = await db
    .select({
      total: sql`coalesce(sum(${trustTransactions.amountKrw}), 0)`.mapWith(Number),
      activeClients: sql`count(distinct ${trustTransactions.clientId})`.mapWith(Number),
    })
    .from(trustTransactions)
    .where(isNull(trustTransactions.voidedAt));
  return { totalKrw: row?.total || 0, activeClients: row?.activeClients || 0 };
}

async function getById(id) {
  validateUUID(id);
  const [row] = await db.select().from(trustTransactions).where(eq(trustTransactions.id, id)).limit(1);
  return row || null;
}

/**
 * 거래 등록 — overdraft 방지 (출금 시 잔액 검증).
 */
async function recordTransaction(input, actor) {
  const {
    clientId, transactionType, amountKrw, description,
    referenceType = null, referenceId = null,
    occurredAt = nowTimestamp(), memo = null,
  } = input || {};
  validateUUID(clientId);
  assertTransactionType(transactionType);
  assertReferenceType(referenceType);

  if (!description?.trim()) throw new ServiceError("description 은 필수입니다", 400);
  const amount = Number(amountKrw);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new ServiceError("amountKrw 는 0 이 아닌 정수여야 합니다", 400);
  }

  /* 부호 일관성 강제 */
  if (transactionType === "deposit" && amount <= 0) {
    throw new ServiceError("입금(deposit)은 양수 금액이어야 합니다", 400);
  }
  if (transactionType === "withdrawal" && amount >= 0) {
    throw new ServiceError("출금(withdrawal)은 음수 금액이어야 합니다 (예: -100000)", 400);
  }

  /* overdraft 방지 — 출금/조정으로 잔액이 음수 되면 거부 */
  if (amount < 0) {
    const { balance } = await getClientBalance(clientId);
    if (balance + amount < 0) {
      throw new ServiceError(
        `잔액 부족 — 현재 잔액 ${balance.toLocaleString("ko-KR")}원, 시도한 금액 ${Math.abs(amount).toLocaleString("ko-KR")}원`,
        409,
      );
    }
  }

  const id = crypto.randomUUID();
  const now = nowTimestamp();
  await db.insert(trustTransactions).values({
    id, clientId,
    transactionType,
    amountKrw: Math.round(amount),
    description: description.trim(),
    referenceType: referenceType || null,
    referenceId: referenceId || null,
    occurredAt,
    recordedBy: actor || null,
    memo,
    createdAt: now, updatedAt: now,
  });
  return getById(id);
}

/**
 * 거래 취소(void) — 잘못 입력된 거래를 잔액 계산에서 제외.
 * 원장 이력은 그대로 보존 (감사 추적 가치).
 */
async function voidTransaction(id, actor, reason) {
  validateUUID(id);
  const existing = await getById(id);
  if (!existing) throw new ServiceError("거래를 찾을 수 없습니다", 404);
  if (existing.voidedAt) throw new ServiceError("이미 취소된 거래입니다", 409);
  if (!reason?.trim()) throw new ServiceError("취소 사유(reason)는 필수입니다", 400);

  /* void 시 잔액이 음수가 되는지 확인 (이전에 이 deposit 으로 인해 사용된 경우 commingling) */
  if (existing.amountKrw > 0) {
    const { balance } = await getClientBalance(existing.clientId);
    if (balance - existing.amountKrw < 0) {
      throw new ServiceError(
        "이 입금을 취소하면 잔액이 음수가 됩니다. 먼저 후속 출금을 정리하세요.",
        409,
      );
    }
  }

  const now = nowTimestamp();
  await db
    .update(trustTransactions)
    .set({
      voidedAt: now,
      voidedBy: actor || null,
      voidReason: reason.trim(),
      updatedAt: now,
    })
    .where(eq(trustTransactions.id, id));
  return getById(id);
}

/**
 * 의뢰인별 거래 목록 (시간 역순) — running balance 포함.
 */
async function listByClient(clientId, query = {}) {
  validateUUID(clientId);
  const { page, limit, offset } = parsePagination(query, { maxLimit: 200 });

  const [{ total }] = await db
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(trustTransactions)
    .where(eq(trustTransactions.clientId, clientId));

  /* 오래된 순으로 가져와서 running balance 계산 후, 응답은 최신순으로 reverse */
  const rowsAsc = await db
    .select()
    .from(trustTransactions)
    .where(eq(trustTransactions.clientId, clientId))
    .orderBy(trustTransactions.occurredAt);

  let runningBalance = 0;
  const enriched = rowsAsc.map((r) => {
    if (!r.voidedAt) runningBalance += r.amountKrw;
    return { ...r, runningBalance };
  });

  /* 최신순 + 페이지네이션 */
  const sorted = enriched.reverse();
  const paginated = sorted.slice(offset, offset + limit);

  return {
    data: paginated,
    meta: buildPaginationMeta(total, page, limit),
  };
}

module.exports = {
  getById,
  getClientBalance,
  getAllBalances,
  getTotalBalance,
  recordTransaction,
  voidTransaction,
  listByClient,
  TRUST_TRANSACTION_TYPES,
  TRUST_REFERENCE_TYPES,
};
