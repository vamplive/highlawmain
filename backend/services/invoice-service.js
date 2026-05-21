/**
 * 인보이스 비즈니스 로직 (수임료 청구서 / 세금계산서)
 * - 순번 할당: invoice_sequences 에 원자적 UPDATE
 * - 발행 시: 공급자·고객 정보 JSON 스냅샷 고정
 * - 모든 금액은 KRW 정수 원단위
 */
const { sqlite } = require("../db");
const crypto = require("crypto");

/* ─────────────── 상수 ─────────────── */
const INVOICE_TYPES = ["simple", "tax"];
const INVOICE_STATUSES = [
  "draft", "issued", "sent", "partial",
  "paid", "overdue", "cancelled", "refunded",
];
const INVOICE_PAYMENT_METHODS = ["bank", "card", "cash", "other"];
const EDITABLE_FIELDS_AFTER_ISSUE = new Set(["notes", "dueDate", "paymentMethod"]);

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ─────────────── 유틸 ─────────────── */
function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
/** 정수로 안전 변환 (NaN → 0) */
function toInt(v, defaultVal = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : defaultVal;
}

/** 품목 배열을 받아 subtotal/vat/total 재계산 — 정수 원단위 */
function recalculateTotals(items, vatRate) {
  const rate = toInt(vatRate, 10);
  let subtotal = 0;
  for (const item of items) {
    const qty = toInt(item.quantity, 1);
    const price = toInt(item.unitPrice, 0);
    // vat_included 인 품목은 단가에 VAT 가 포함된 것으로 간주 → 공급가액 역산
    const line = qty * price;
    if (item.vatIncluded) {
      subtotal += Math.round(line / (1 + rate / 100));
    } else {
      subtotal += line;
    }
  }
  const vatAmount = Math.round((subtotal * rate) / 100);
  return { subtotal, vatRate: rate, vatAmount, total: subtotal + vatAmount };
}

/** 품목 amount 필드 일관성 보장 */
function normalizeItemAmount(item) {
  const qty = toInt(item.quantity, 1);
  const price = toInt(item.unitPrice, 0);
  return {
    ...item,
    quantity: qty,
    unitPrice: price,
    amount: qty * price,
    vatIncluded: item.vatIncluded ? 1 : 0,
  };
}

/* ─────────────── 번호 할당 ─────────────── */
/**
 * 연도+타입별 순번을 원자적으로 증가시키고 포맷된 invoice_no 반환.
 * 트랜잭션 밖에서 호출 금지 — 호출 측에서 tx 로 감쌀 것.
 *
 * 형식:
 *   simple → YYYY-NNNN      (예: 2026-0001)
 *   tax    → YYYY-TAX-NNNN  (예: 2026-TAX-0001)
 */
function allocateInvoiceNumber(type) {
  if (!INVOICE_TYPES.includes(type)) {
    throw new ServiceError("잘못된 인보이스 종류입니다", 400);
  }
  const year = new Date().getFullYear();

  // UPSERT — 해당 연도/타입 행이 없으면 0으로 초기화 후 +1
  sqlite.prepare(`
    INSERT INTO invoice_sequences (year, type, last_number)
    VALUES (?, ?, 0)
    ON CONFLICT (year, type) DO NOTHING
  `).run(year, type);

  const row = sqlite.prepare(`
    UPDATE invoice_sequences
       SET last_number = last_number + 1
     WHERE year = ? AND type = ?
  RETURNING last_number
  `).get(year, type);

  const seq = String(row.last_number).padStart(4, "0");
  return type === "tax" ? `${year}-TAX-${seq}` : `${year}-${seq}`;
}

/** 다음 번호 미리보기 (실제 할당 안 함) */
function previewNextNumber(type) {
  if (!INVOICE_TYPES.includes(type)) return null;
  const year = new Date().getFullYear();
  const row = sqlite.prepare(`
    SELECT last_number FROM invoice_sequences WHERE year = ? AND type = ?
  `).get(year, type);
  const next = ((row && row.last_number) || 0) + 1;
  const seq = String(next).padStart(4, "0");
  return type === "tax" ? `${year}-TAX-${seq}` : `${year}-${seq}`;
}

/* ─────────────── 감사 로그 ─────────────── */
function logActivity(invoiceId, action, actorId, details) {
  sqlite.prepare(`
    INSERT INTO invoice_activity_log (id, invoice_id, action, actor_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    invoiceId,
    action,
    actorId || null,
    details ? JSON.stringify(details) : null,
  );
}

/* ─────────────── 조회 ─────────────── */
function getInvoiceOrThrow(id) {
  const row = sqlite.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  if (!row) throw new ServiceError("인보이스를 찾을 수 없습니다", 404);
  return row;
}
function getItems(invoiceId) {
  return sqlite.prepare(`
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position ASC
  `).all(invoiceId);
}
function getPayments(invoiceId) {
  return sqlite.prepare(`
    SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY paid_at DESC
  `).all(invoiceId);
}
function getActivity(invoiceId) {
  return sqlite.prepare(`
    SELECT * FROM invoice_activity_log WHERE invoice_id = ? ORDER BY at DESC
  `).all(invoiceId);
}

/**
 * 목록 (필터: status, clientId, caseId, year, type, q — 번호 부분 일치)
 */
function listInvoices(query = {}) {
  const where = [];
  const params = [];

  if (query.status) { where.push("status = ?"); params.push(query.status); }
  if (query.type) { where.push("type = ?"); params.push(query.type); }
  if (query.clientId) { where.push("client_id = ?"); params.push(query.clientId); }
  if (query.caseId) { where.push("case_id = ?"); params.push(query.caseId); }
  if (query.year) { where.push("substr(issued_date, 1, 4) = ?"); params.push(String(query.year)); }
  if (query.q) {
    where.push("invoice_no LIKE ?");
    params.push(`%${String(query.q).replace(/[%_]/g, "\\$&")}%`);
  }

  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 20)));
  const offset = (page - 1) * limit;

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = sqlite.prepare(`
    SELECT * FROM invoices ${whereSql}
    ORDER BY COALESCE(issued_date, created_at) DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const totalRow = sqlite.prepare(
    `SELECT COUNT(*) AS cnt FROM invoices ${whereSql}`,
  ).get(...params);

  return {
    items: rows,
    meta: {
      total: totalRow.cnt,
      page,
      limit,
      totalPages: Math.ceil(totalRow.cnt / limit),
    },
  };
}

function getInvoiceDetail(id) {
  const invoice = getInvoiceOrThrow(id);
  return {
    ...invoice,
    items: getItems(id),
    payments: getPayments(id),
    activity: getActivity(id),
  };
}

/* ─────────────── 생성 (draft) ─────────────── */
function createInvoice(body, actorId) {
  const {
    type = "simple",
    clientId,
    caseId,
    issuedDate,
    dueDate,
    paymentMethod,
    vatRate = 10,
    notes,
    items = [],
  } = body || {};

  if (!INVOICE_TYPES.includes(type)) {
    throw new ServiceError("잘못된 인보이스 종류입니다", 400);
  }
  if (!clientId) {
    throw new ServiceError("고객(clientId)은 필수입니다", 400);
  }

  const normalizedItems = items.map((it, i) => normalizeItemAmount({ ...it, position: i }));
  const totals = recalculateTotals(normalizedItems, vatRate);
  const id = crypto.randomUUID();

  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO invoices (
        id, type, status, client_id, case_id,
        issued_date, due_date, payment_method,
        subtotal, vat_rate, vat_amount, total,
        notes, issued_by
      ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, type, clientId, caseId || null,
      issuedDate || null, dueDate || null, paymentMethod || null,
      totals.subtotal, totals.vatRate, totals.vatAmount, totals.total,
      notes || null, actorId || null,
    );
    insertItems(id, normalizedItems);
    logActivity(id, "created", actorId, { type, clientId });
  });
  tx();

  return getInvoiceDetail(id);
}

function insertItems(invoiceId, items) {
  const stmt = sqlite.prepare(`
    INSERT INTO invoice_items (
      id, invoice_id, position, description, specification,
      quantity, unit_price, amount, vat_included
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const it of items) {
    stmt.run(
      crypto.randomUUID(),
      invoiceId,
      toInt(it.position, 0),
      it.description || "",
      it.specification || null,
      it.quantity,
      it.unitPrice,
      it.amount,
      it.vatIncluded || 0,
    );
  }
}

/* ─────────────── 수정 ─────────────── */
function updateInvoice(id, body, actorId) {
  const invoice = getInvoiceOrThrow(id);
  const isDraft = invoice.status === "draft";

  // 발행 후에는 일부 필드만 수정 허용
  if (!isDraft) {
    const forbidden = Object.keys(body).filter(
      (k) => !EDITABLE_FIELDS_AFTER_ISSUE.has(k),
    );
    if (forbidden.length) {
      throw new ServiceError(
        `발행된 인보이스는 ${[...EDITABLE_FIELDS_AFTER_ISSUE].join(", ")} 만 수정할 수 있습니다`,
        400,
      );
    }
  }

  const updates = [];
  const params = [];

  if (body.type !== undefined && isDraft) {
    if (!INVOICE_TYPES.includes(body.type)) {
      throw new ServiceError("잘못된 인보이스 종류입니다", 400);
    }
    updates.push("type = ?"); params.push(body.type);
  }
  if (body.clientId !== undefined && isDraft) { updates.push("client_id = ?"); params.push(body.clientId); }
  if (body.caseId !== undefined && isDraft) { updates.push("case_id = ?"); params.push(body.caseId || null); }
  if (body.issuedDate !== undefined && isDraft) { updates.push("issued_date = ?"); params.push(body.issuedDate || null); }
  if (body.dueDate !== undefined) { updates.push("due_date = ?"); params.push(body.dueDate || null); }
  if (body.paymentMethod !== undefined) { updates.push("payment_method = ?"); params.push(body.paymentMethod || null); }
  if (body.notes !== undefined) { updates.push("notes = ?"); params.push(body.notes || null); }

  // draft 상태에서 items 교체 시 재계산
  const tx = sqlite.transaction(() => {
    if (isDraft && Array.isArray(body.items)) {
      const normalized = body.items.map((it, i) => normalizeItemAmount({ ...it, position: i }));
      const vatRate = body.vatRate !== undefined ? toInt(body.vatRate, 10) : invoice.vat_rate;
      const totals = recalculateTotals(normalized, vatRate);

      sqlite.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
      insertItems(id, normalized);

      updates.push("subtotal = ?"); params.push(totals.subtotal);
      updates.push("vat_rate = ?"); params.push(totals.vatRate);
      updates.push("vat_amount = ?"); params.push(totals.vatAmount);
      updates.push("total = ?"); params.push(totals.total);
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?"); params.push(nowIso());
      sqlite.prepare(`
        UPDATE invoices SET ${updates.join(", ")} WHERE id = ?
      `).run(...params, id);
    }

    logActivity(id, "updated", actorId, { fields: Object.keys(body) });
  });
  tx();

  return getInvoiceDetail(id);
}

/* ─────────────── 발행 ─────────────── */
function issueInvoice(id, actorId, supplierSnapshot, customerSnapshot) {
  const invoice = getInvoiceOrThrow(id);
  if (invoice.status !== "draft") {
    throw new ServiceError("이미 발행된 인보이스입니다", 400);
  }
  if (!invoice.client_id) {
    throw new ServiceError("고객 정보가 없는 인보이스는 발행할 수 없습니다", 400);
  }
  const items = getItems(id);
  if (items.length === 0) {
    throw new ServiceError("품목이 1개 이상 있어야 발행할 수 있습니다", 400);
  }

  const tx = sqlite.transaction(() => {
    const invoiceNo = allocateInvoiceNumber(invoice.type);
    sqlite.prepare(`
      UPDATE invoices
         SET invoice_no = ?,
             status = 'issued',
             issued_date = COALESCE(issued_date, ?),
             supplier_info = ?,
             customer_info = ?,
             issued_by = COALESCE(issued_by, ?),
             updated_at = ?
       WHERE id = ?
    `).run(
      invoiceNo,
      today(),
      JSON.stringify(supplierSnapshot || {}),
      JSON.stringify(customerSnapshot || {}),
      actorId || null,
      nowIso(),
      id,
    );
    logActivity(id, "issued", actorId, { invoiceNo });
  });
  tx();

  return getInvoiceDetail(id);
}

/* ─────────────── 취소 ─────────────── */
function cancelInvoice(id, actorId, reason) {
  const invoice = getInvoiceOrThrow(id);
  if (invoice.status === "cancelled") {
    throw new ServiceError("이미 취소된 인보이스입니다", 400);
  }
  sqlite.prepare(`
    UPDATE invoices SET status = 'cancelled', updated_at = ? WHERE id = ?
  `).run(nowIso(), id);
  logActivity(id, "cancelled", actorId, { reason: reason || null });
  return getInvoiceDetail(id);
}

/* ─────────────── 결제 기록 ─────────────── */
function addPayment(invoiceId, body, actorId) {
  const invoice = getInvoiceOrThrow(invoiceId);
  if (["draft", "cancelled", "refunded"].includes(invoice.status)) {
    throw new ServiceError("이 상태에서는 결제를 기록할 수 없습니다", 400);
  }
  const amount = toInt(body.amount, 0);
  if (amount <= 0) {
    throw new ServiceError("결제 금액은 1원 이상이어야 합니다", 400);
  }
  const paidAt = body.paidAt || today();
  if (body.method && !INVOICE_PAYMENT_METHODS.includes(body.method)) {
    throw new ServiceError("잘못된 결제 방법입니다", 400);
  }

  const paymentId = crypto.randomUUID();

  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO invoice_payments (
        id, invoice_id, paid_at, amount, method, reference, notes, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId, invoiceId, paidAt, amount,
      body.method || null, body.reference || null, body.notes || null,
      actorId || null,
    );

    const newPaid = invoice.paid_amount + amount;
    let newStatus = invoice.status;
    if (newPaid >= invoice.total) newStatus = "paid";
    else if (newPaid > 0) newStatus = "partial";

    sqlite.prepare(`
      UPDATE invoices SET paid_amount = ?, status = ?, updated_at = ? WHERE id = ?
    `).run(newPaid, newStatus, nowIso(), invoiceId);

    logActivity(invoiceId, "payment_added", actorId, { paymentId, amount, newStatus });
  });
  tx();

  return getInvoiceDetail(invoiceId);
}

function removePayment(invoiceId, paymentId, actorId) {
  const invoice = getInvoiceOrThrow(invoiceId);
  const payment = sqlite.prepare(
    "SELECT * FROM invoice_payments WHERE id = ? AND invoice_id = ?",
  ).get(paymentId, invoiceId);
  if (!payment) throw new ServiceError("결제 기록을 찾을 수 없습니다", 404);

  const tx = sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM invoice_payments WHERE id = ?").run(paymentId);

    const newPaid = Math.max(0, invoice.paid_amount - payment.amount);
    let newStatus = invoice.status;
    if (newPaid === 0) newStatus = "issued";
    else if (newPaid < invoice.total) newStatus = "partial";

    sqlite.prepare(`
      UPDATE invoices SET paid_amount = ?, status = ?, updated_at = ? WHERE id = ?
    `).run(newPaid, newStatus, nowIso(), invoiceId);

    logActivity(invoiceId, "payment_removed", actorId, { paymentId, amount: payment.amount });
  });
  tx();

  return getInvoiceDetail(invoiceId);
}

/* ─────────────── 삭제 (draft만) ─────────────── */
function deleteInvoice(id, actorId) {
  const invoice = getInvoiceOrThrow(id);
  if (invoice.status !== "draft") {
    throw new ServiceError("발행된 인보이스는 삭제할 수 없습니다. 취소를 사용하세요.", 400);
  }
  const tx = sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
    sqlite.prepare("DELETE FROM invoice_activity_log WHERE invoice_id = ?").run(id);
    sqlite.prepare("DELETE FROM invoices WHERE id = ?").run(id);
  });
  tx();
  logActivity("deleted", "deleted", actorId, { deletedId: id });
  return { deleted: true };
}

/* ─────────────── 통계 ─────────────── */
function getStats(year) {
  const y = toInt(year, new Date().getFullYear());
  return sqlite.prepare(`
    SELECT
      status,
      COUNT(*) AS count,
      COALESCE(SUM(total), 0) AS total_amount,
      COALESCE(SUM(paid_amount), 0) AS paid_amount
    FROM invoices
    WHERE substr(COALESCE(issued_date, created_at), 1, 4) = ?
    GROUP BY status
  `).all(String(y));
}

module.exports = {
  INVOICE_TYPES,
  INVOICE_STATUSES,
  INVOICE_PAYMENT_METHODS,
  ServiceError,
  listInvoices,
  getInvoiceDetail,
  createInvoice,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  addPayment,
  removePayment,
  deleteInvoice,
  previewNextNumber,
  getStats,
};
