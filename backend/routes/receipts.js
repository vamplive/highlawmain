/**
 * 영수증 관리 라우트 — 관리자 전용
 * - POST /upload : 파일 업로드 → OCR → 메타 자동 추출 후 저장
 * - GET   /      : 목록 (날짜·카드 필터)
 * - GET   /summary : 카드별 합계
 * - GET/PATCH/DELETE /:id : 상세·수정·삭제
 */
const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");
const multer = require("multer");
const { sqlite } = require("../db");
const { adminAuth, requireRole } = require("../lib/auth");
const { auditMiddleware } = require("../lib/audit-log");
const { processReceiptFile } = require("../services/receipt-ocr");
const aiOcr = require("../services/receipt-ai-ocr");

const router = Router();

// 영수증 = 결제 흔적. 업로드·수정·삭제·재처리 모두 감사 로그에 기록.
router.use(auditMiddleware("receipts"));

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const RECEIPT_DIR = path.join(STORAGE_PATH, "uploads", "receipts");
if (!fs.existsSync(RECEIPT_DIR)) fs.mkdirSync(RECEIPT_DIR, { recursive: true });

// 확장자 ↔ 안전 MIME 매핑. 다운로드 시 DB에 저장된 클라이언트 mimetype을 신뢰하지 않고
// 이 표를 통해서만 Content-Type을 결정한다 (MIME confusion 방어).
const SAFE_MIME_BY_EXT = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
};
// 클라이언트가 보낸 mimetype 검증용 화이트리스트 — 이 set에 없으면 업로드 거부.
const ALLOWED_UPLOAD_MIME = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  // 일부 브라우저/OS는 image/heic 대신 application/octet-stream으로 전송하므로 허용.
  // 단, 확장자 검증으로 .heic만 통과되므로 위험은 제한적이다.
  "application/octet-stream",
]);
const ALLOWED = /\.(pdf|jpg|jpeg|png|webp|heic)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fsp.mkdir(RECEIPT_DIR, { recursive: true })
      .then(() => cb(null, RECEIPT_DIR))
      .catch(cb);
  },
  filename: (req, file, cb) => {
    // 확장자도 정규화해서 저장 — originalname을 그대로 신뢰하지 않는다.
    const rawExt = (path.extname(file.originalname) || "").toLowerCase();
    const ext = SAFE_MIME_BY_EXT[rawExt] ? rawExt : "";
    cb(null, `receipt-${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    // 1) 파일명 확장자 검증 — receipts 디렉토리에 .html/.svg/.js 등이 저장되지 않도록.
    if (!ALLOWED.test(file.originalname)) {
      return cb(new Error("지원하지 않는 파일 형식입니다 (pdf, jpg, png, webp, heic 만 가능)"));
    }
    // 2) 클라이언트 신고 MIME 검증 — confusion 공격 차단.
    const mt = (file.mimetype || "").toLowerCase();
    if (!ALLOWED_UPLOAD_MIME.has(mt)) {
      return cb(new Error("MIME 타입이 허용 목록에 없습니다"));
    }
    cb(null, true);
  },
});

function fail(res, status, msg) {
  return res.status(status).json({ data: null, error: msg, meta: null });
}

function rowToDto(row) {
  if (!row) return null;
  let items = [];
  if (row.items_json) {
    try { items = JSON.parse(row.items_json) || []; } catch { items = []; }
  }
  const baseName = path.basename(row.file_path || "");
  return {
    id: row.id,
    fileUrl: baseName ? `/uploads/receipts/${baseName}` : null,
    downloadUrl: `/api/receipts/${row.id}/download`,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    vendor: row.vendor,
    amount: row.amount,
    paidAt: row.paid_at,
    cardName: row.card_name,
    cardFirst4: row.card_first4,
    cardLast4: row.card_last4,
    paymentCardId: row.payment_card_id,
    category: row.category,
    notes: row.notes,
    ocrText: row.ocr_text,
    ocrStatus: row.ocr_status,
    items,
    aiModel:        row.ai_model,
    aiInputTokens:  row.ai_input_tokens,
    aiOutputTokens: row.ai_output_tokens,
    aiCostUsd:      row.ai_cost_usd,
    aiCostKrw:      row.ai_cost_krw,
    aiConfidence:   row.ai_confidence,
    createdByAdminId: row.created_by_admin_id,
    uploaderName:     row.uploader_name || null,     // LEFT JOIN 결과 (없으면 null)
    uploaderUsername: row.uploader_username || null,
    uploaderRole:     row.uploader_role || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 본인 영수증만 조회/수정 가능하도록 하는 필터.
 *  - admin 역할: 전체 영수증 접근
 *  - 그 외 (editor 등): created_by_admin_id 가 본인 id 인 행만
 *  WHERE 절에 안전하게 끼워 넣을 수 있도록 { sql, params } 형식으로 반환.
 */
function ownershipClause(req) {
  if (req.adminUser?.role === "admin") return { sql: "", params: [] };
  return { sql: "created_by_admin_id = ?", params: [req.adminUser?.userId || "__none__"] };
}

// 업로더 정보 join — 목록·상세 모두 동일 SELECT 사용
const RECEIPT_SELECT = `
  SELECT r.*,
         au.name     AS uploader_name,
         au.username AS uploader_username,
         au.role     AS uploader_role
    FROM receipts r
    LEFT JOIN admin_users au ON au.id = r.created_by_admin_id
`;

/** 등록된 카드 중 영수증의 first4·last4·issuer로 자동 매칭.
 *  영수증마다 마스킹 위치가 다르므로 first4 또는 last4 어느 한쪽으로 매칭한다.
 *  1) (first4 또는 last4 일치) + issuer 일치 → 그 카드
 *  2) (first4 또는 last4 일치)이 1건뿐 → 그 카드
 *  3) 모호하거나 매칭 실패 → null (사용자 수동 지정)
 */
function autoMatchCard(first4, last4, issuer) {
  if (!first4 && !last4) return null;
  const conds = [];
  const args = [];
  if (last4)  { conds.push("last4  = ?"); args.push(last4);  }
  if (first4) { conds.push("first4 = ?"); args.push(first4); }
  const candidates = sqlite.prepare(
    `SELECT id, issuer FROM payment_cards WHERE (${conds.join(" OR ")}) AND is_active = 1`
  ).all(...args);
  if (candidates.length === 0) return null;
  if (issuer) {
    const exact = candidates.find((c) => (c.issuer || "").trim() === issuer.trim());
    if (exact) return exact.id;
  }
  return candidates.length === 1 ? candidates[0].id : null;
}

/** POST /api/receipts/upload — 단일 영수증 업로드 + OCR */
router.post("/upload", adminAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return fail(res, 400, "파일이 첨부되지 않았습니다");
  const id = crypto.randomUUID();
  const filePath = req.file.path;

  let ocr = { ocrText: "", ocrStatus: "manual", vendor: null, amount: null, paidAt: null, cardName: null, cardFirst4: null, cardLast4: null };
  const mt = (req.file.mimetype || "").toLowerCase();
  const ext = (req.file.originalname || "").toLowerCase();
  const isAiSupported = mt.startsWith("image/") || mt === "application/pdf" || ext.endsWith(".pdf");
  let _aiAttempted = false;
  let aiSucceeded = false;

  let aiMeta = null;
  // 1) AI OCR 우선 시도 (이미지·PDF + API 키 있을 때)
  console.log(`[receipts] 업로드 수신: name=${req.file.originalname}, mime=${mt}, aiAvailable=${aiOcr.isAvailable()}, aiSupported=${isAiSupported}`);
  if (isAiSupported && aiOcr.isAvailable()) {
    _aiAttempted = true;
    try {
      const aiResult = await aiOcr.processReceiptWithAI({ filePath, mimeType: req.file.mimetype });
      ocr = {
        ocrText:   aiResult.ocrText,
        ocrStatus: aiResult.ocrStatus,
        vendor:    aiResult.vendor,
        amount:    aiResult.amount,
        paidAt:    aiResult.paidAt,
        cardName:  aiResult.cardName,
        cardFirst4:aiResult.cardFirst4,
        cardLast4: aiResult.cardLast4,
      };
      aiMeta = {
        model:        aiResult.model,
        inputTokens:  aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        costUsd:      aiResult.costUsd,
        costKrw:      aiResult.costKrw,
        confidence:   aiResult.confidence,
        items:        aiResult.items || [],
      };
      aiSucceeded = true;
      console.log(`[receipts] ✓ AI OCR 성공 (${aiResult.model}, conf=${aiResult.confidence}, in=${aiResult.inputTokens}, out=${aiResult.outputTokens}, cost≈${aiResult.costKrw?.toFixed(2)}원, items=${aiMeta.items.length}) → vendor="${ocr.vendor}", amount=${ocr.amount}`);
    } catch (err) {
      console.error(`[receipts] ✗ AI OCR 실패, tesseract로 폴백: code=${err.code || ""} status=${err.status || ""} msg=${err.message}`);
    }
  }

  // 2) AI 미시도 또는 AI 실패 시에만 tesseract 휴리스틱 폴백 (AI가 성공했는데 값이 비어있다면 그건 영수증 자체에 정보가 없는 것)
  if (!aiSucceeded) {
    console.log("[receipts] tesseract 휴리스틱 OCR 사용");
    try {
      ocr = await processReceiptFile({ filePath, mimeType: req.file.mimetype });
    } catch (err) {
      console.error("[receipts] tesseract OCR 실패:", err.message);
      ocr.ocrStatus = "failed";
    }
  }

  try {
    // 등록된 카드와 자동 매칭 (first4/last4 + issuer 기반). 모호하면 null.
    const autoCardId = autoMatchCard(ocr.cardFirst4, ocr.cardLast4, ocr.cardName);
    sqlite.prepare(`
      INSERT INTO receipts
        (id, file_path, file_name, mime_type, file_size,
         vendor, amount, paid_at, card_name, card_first4, card_last4, payment_card_id,
         category, notes, ocr_text, ocr_status, created_by_admin_id,
         ai_model, ai_input_tokens, ai_output_tokens, ai_cost_usd, ai_cost_krw,
         ai_confidence, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, filePath, req.file.originalname, req.file.mimetype, req.file.size,
      ocr.vendor, ocr.amount, ocr.paidAt, ocr.cardName, ocr.cardFirst4, ocr.cardLast4, autoCardId,
      null, null, ocr.ocrText, ocr.ocrStatus, req.adminUser?.userId || null,
      aiMeta?.model || null,
      aiMeta?.inputTokens ?? null,
      aiMeta?.outputTokens ?? null,
      aiMeta?.costUsd ?? null,
      aiMeta?.costKrw ?? null,
      aiMeta?.confidence ?? null,
      aiMeta?.items ? JSON.stringify(aiMeta.items) : null,
    );
    if (autoCardId) console.log(`[receipts] 등록 카드 자동 매칭: id=${id} → card=${autoCardId}`);
    const row = sqlite.prepare("SELECT * FROM receipts WHERE id = ?").get(id);
    res.json({ data: rowToDto(row), error: null, meta: null });
  } catch (err) {
    console.error("[receipts] insert 실패:", err.message);
    fail(res, 500, "영수증 저장에 실패했습니다");
  }
});

/** GET /api/receipts — 목록 (?from=YYYY-MM-DD&to=YYYY-MM-DD&card=신한카드)
 *  - admin: 전체
 *  - 그 외: 본인이 업로드한 영수증만
 */
router.get("/", adminAuth, (req, res) => {
  try {
    const where = [];
    const params = [];
    if (req.query.from) { where.push("r.paid_at >= ?"); params.push(`${req.query.from} 00:00:00`); }
    if (req.query.to)   { where.push("r.paid_at <= ?"); params.push(`${req.query.to} 23:59:59`); }
    if (req.query.card) { where.push("r.card_name = ?"); params.push(req.query.card); }
    const own = ownershipClause(req);
    if (own.sql) { where.push(`r.${own.sql}`); params.push(...own.params); }
    const sql = `${RECEIPT_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY COALESCE(r.paid_at, r.created_at) DESC LIMIT 500`;
    const rows = sqlite.prepare(sql).all(...params);
    res.json({ data: rows.map(rowToDto), error: null, meta: { count: rows.length } });
  } catch (err) {
    console.error("[receipts] 목록 실패:", err.message);
    fail(res, 500, "영수증 목록을 불러오지 못했습니다");
  }
});

/** GET /api/receipts/summary — 카드별 합계 + 전체 합계 (본인 범위) */
router.get("/summary", adminAuth, (req, res) => {
  try {
    const where = [];
    const params = [];
    if (req.query.from) { where.push("paid_at >= ?"); params.push(`${req.query.from} 00:00:00`); }
    if (req.query.to)   { where.push("paid_at <= ?"); params.push(`${req.query.to} 23:59:59`); }
    const own = ownershipClause(req);
    if (own.sql) { where.push(own.sql); params.push(...own.params); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    const byCard = sqlite.prepare(`
      SELECT COALESCE(card_name, '미지정') AS card_name,
             COUNT(*) AS count,
             COALESCE(SUM(amount), 0) AS total
      FROM receipts ${whereSql}
      GROUP BY COALESCE(card_name, '미지정')
      ORDER BY total DESC
    `).all(...params);
    const overall = sqlite.prepare(`
      SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM receipts ${whereSql}
    `).get(...params);

    res.json({ data: { byCard, overall }, error: null, meta: null });
  } catch (err) {
    console.error("[receipts] 합계 실패:", err.message);
    fail(res, 500, "합계 정보를 불러오지 못했습니다");
  }
});

/** GET /api/receipts/:id — admin이 아니면 본인 업로드 건만 접근 */
router.get("/:id", adminAuth, (req, res) => {
  const row = sqlite.prepare(`${RECEIPT_SELECT} WHERE r.id = ?`).get(req.params.id);
  if (!row) return fail(res, 404, "영수증을 찾을 수 없습니다");
  if (req.adminUser?.role !== "admin" && row.created_by_admin_id !== req.adminUser?.userId) {
    return fail(res, 404, "영수증을 찾을 수 없습니다");
  }
  res.json({ data: rowToDto(row), error: null, meta: null });
});

/** 다운로드용 체계적 파일명 생성
 *  형식: YYYY-MM-DD_가맹점_금액원.확장자
 *  예:   2026-05-01_커피빈코리아_10000원.pdf
 *  누락된 필드는 안전한 기본값으로 대체 (날짜→업로드일, 가맹점→영수증, 금액 생략).
 *  파일시스템·HTTP 헤더 안전을 위해 경로 구분자·예약문자·연속 공백을 제거.
 */
function buildDownloadFileName(row) {
  const original = row.file_name || path.basename(row.file_path || "");
  let ext = path.extname(original).toLowerCase();
  if (!ext) {
    const mt = (row.mime_type || "").toLowerCase();
    if (mt === "application/pdf") ext = ".pdf";
    else if (mt === "image/jpeg") ext = ".jpg";
    else if (mt === "image/png")  ext = ".png";
    else if (mt === "image/webp") ext = ".webp";
    else if (mt === "image/heic") ext = ".heic";
    else ext = ".bin";
  }

  // 날짜: paid_at(YYYY-MM-DD HH:mm:ss) 또는 created_at fallback → YYYY-MM-DD
  const dateSrc = row.paid_at || row.created_at || "";
  const datePart = (dateSrc.match(/\d{4}-\d{2}-\d{2}/) || [""])[0] || "날짜미상";

  // 가맹점: 파일시스템 금지문자 / 제어문자 / 연속 공백 제거 후 40자 제한
  const vendorRaw = (row.vendor || "영수증").trim();
  const vendor = vendorRaw
    // eslint-disable-next-line no-control-regex -- 파일명 안전화: 제어문자 제거 의도
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 40) || "영수증";

  // 금액: 정수 원 단위. 없으면 생략.
  const amountPart = row.amount != null ? `_${Number(row.amount)}원` : "";

  return `${datePart}_${vendor}${amountPart}${ext}`;
}

/** GET /api/receipts/:id/download — 체계적 파일명으로 원본 파일 다운로드 */
router.get("/:id/download", adminAuth, (req, res) => {
  const row = sqlite.prepare("SELECT * FROM receipts WHERE id = ?").get(req.params.id);
  if (!row) return fail(res, 404, "영수증을 찾을 수 없습니다");
  if (req.adminUser?.role !== "admin" && row.created_by_admin_id !== req.adminUser?.userId) {
    return fail(res, 404, "영수증을 찾을 수 없습니다");
  }
  if (!row.file_path || !fs.existsSync(row.file_path)) return fail(res, 404, "파일이 존재하지 않습니다");

  const fileName = buildDownloadFileName(row);
  const encoded = encodeURIComponent(fileName);
  // ASCII 폴백명 — 비ASCII 브라우저용. RFC 5987 filename* 가 우선 사용됨
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_");
  // Content-Type은 DB에 저장된 클라이언트 신고 MIME(`row.mime_type`)을 신뢰하지 않고,
  // 디스크 파일 확장자 기반 화이트리스트로 결정한다. 업로드 단계에서 확장자도 정규화되어
  // .pdf/.jpg/.jpeg/.png/.webp/.heic 외의 값은 저장될 수 없다. 매칭 실패 시 octet-stream
  // 으로 다운로드만 가능하게 하여 브라우저 렌더 가능성(text/html 등)을 차단한다.
  const ext = path.extname(row.file_path || "").toLowerCase();
  const safeMime = SAFE_MIME_BY_EXT[ext] || "application/octet-stream";
  res.setHeader("Content-Type", safeMime);
  // 브라우저가 응답 본문으로 MIME sniffing을 통해 다른 타입으로 해석하지 못하도록.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition",
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`);
  fs.createReadStream(row.file_path).pipe(res);
});

/** POST /api/receipts/:id/reprocess — 저장된 파일로 AI OCR 재실행
 *  - 기존 업로드 영수증의 items_json/aiCost 등이 비어있을 때 다시 채우는 용도
 *  - vendor/amount/paid_at 등은 사용자가 수동 보정했을 수 있으므로 덮어쓰지 않고,
 *    items_json·ai_* 컬럼만 갱신한다 (단, ocr_status/ocr_text는 갱신).
 */
router.post("/:id/reprocess", adminAuth, async (req, res) => {
  const row = sqlite.prepare("SELECT * FROM receipts WHERE id = ?").get(req.params.id);
  if (!row) return fail(res, 404, "영수증을 찾을 수 없습니다");
  if (req.adminUser?.role !== "admin" && row.created_by_admin_id !== req.adminUser?.userId) {
    return fail(res, 404, "영수증을 찾을 수 없습니다");
  }
  if (!row.file_path || !fs.existsSync(row.file_path)) return fail(res, 404, "원본 파일이 존재하지 않습니다");
  if (!aiOcr.isAvailable()) return fail(res, 400, "ANTHROPIC_API_KEY가 설정되지 않았습니다");
  try {
    const aiResult = await aiOcr.processReceiptWithAI({ filePath: row.file_path, mimeType: row.mime_type });
    sqlite.prepare(`
      UPDATE receipts SET
        ai_model = ?, ai_input_tokens = ?, ai_output_tokens = ?,
        ai_cost_usd = ?, ai_cost_krw = ?, ai_confidence = ?,
        items_json = ?, ocr_text = ?, ocr_status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      aiResult.model,
      aiResult.inputTokens ?? null,
      aiResult.outputTokens ?? null,
      aiResult.costUsd ?? null,
      aiResult.costKrw ?? null,
      aiResult.confidence ?? null,
      aiResult.items ? JSON.stringify(aiResult.items) : null,
      aiResult.ocrText,
      aiResult.ocrStatus,
      req.params.id,
    );
    console.log(`[receipts] ↻ AI 재추출: id=${req.params.id}, items=${(aiResult.items || []).length}, conf=${aiResult.confidence}`);
    const updated = sqlite.prepare(`${RECEIPT_SELECT} WHERE r.id = ?`).get(req.params.id);
    res.json({ data: rowToDto(updated), error: null, meta: null });
  } catch (err) {
    console.error("[receipts] 재추출 실패:", err.message);
    fail(res, 500, `재추출 실패: ${err.message}`);
  }
});

/** POST /api/receipts/backfill-card-matches — 미연결 영수증을 일괄 자동 매칭
 *  사용자가 새 카드를 등록한 후, 그 카드로 결제했던 과거 영수증을 한 번에 연결한다.
 *  payment_card_id가 NULL인 행만 대상으로 하므로, 사용자가 수동 지정한 영수증은 보존된다.
 */
router.post("/backfill-card-matches", adminAuth, (req, res) => {
  try {
    // admin이 아니면 본인 업로드 건만 대상으로 한다
    const own = ownershipClause(req);
    const ownSql = own.sql ? `AND ${own.sql}` : "";
    const unlinked = sqlite.prepare(
      `SELECT id, card_first4, card_last4, card_name FROM receipts
        WHERE payment_card_id IS NULL
          AND (card_last4 IS NOT NULL OR card_first4 IS NOT NULL)
          ${ownSql}`
    ).all(...own.params);
    let matched = 0;
    const update = sqlite.prepare("UPDATE receipts SET payment_card_id = ?, updated_at = datetime('now') WHERE id = ?");
    for (const r of unlinked) {
      const cardId = autoMatchCard(r.card_first4, r.card_last4, r.card_name);
      if (cardId) { update.run(cardId, r.id); matched++; }
    }
    console.log(`[receipts] 카드 일괄 매칭: ${matched}/${unlinked.length}건 연결`);
    res.json({ data: { scanned: unlinked.length, matched }, error: null, meta: null });
  } catch (err) {
    console.error("[receipts] 카드 일괄 매칭 실패:", err.message);
    fail(res, 500, "카드 일괄 매칭에 실패했습니다");
  }
});

/** PATCH /api/receipts/:id — 수동 보정 (admin 또는 본인 업로드 건만) */
router.patch("/:id", adminAuth, (req, res) => {
  const existing = sqlite.prepare("SELECT id, created_by_admin_id FROM receipts WHERE id = ?").get(req.params.id);
  if (!existing) return fail(res, 404, "영수증을 찾을 수 없습니다");
  if (req.adminUser?.role !== "admin" && existing.created_by_admin_id !== req.adminUser?.userId) {
    return fail(res, 404, "영수증을 찾을 수 없습니다");
  }

  const fieldMap = {
    vendor: "vendor", amount: "amount", paidAt: "paid_at",
    cardName: "card_name", cardFirst4: "card_first4", cardLast4: "card_last4",
    paymentCardId: "payment_card_id",
    category: "category", notes: "notes", ocrStatus: "ocr_status",
  };
  const set = [];
  const params = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      set.push(`${col} = ?`);
      params.push(req.body[key] === "" ? null : req.body[key]);
    }
  }
  // 업로더 재지정은 admin 전용. 빈 값은 NULL(미지정)로 허용.
  if (req.body.createdByAdminId !== undefined) {
    if (req.adminUser?.role !== "admin") {
      return fail(res, 403, "업로더 변경은 관리자만 가능합니다");
    }
    set.push("created_by_admin_id = ?");
    params.push(req.body.createdByAdminId === "" ? null : req.body.createdByAdminId);
  }
  if (set.length === 0) return fail(res, 400, "수정할 필드가 없습니다");
  set.push("updated_at = datetime('now')");
  params.push(req.params.id);
  sqlite.prepare(`UPDATE receipts SET ${set.join(", ")} WHERE id = ?`).run(...params);
  const row = sqlite.prepare(`${RECEIPT_SELECT} WHERE r.id = ?`).get(req.params.id);
  res.json({ data: rowToDto(row), error: null, meta: null });
});

/** DELETE /api/receipts/:id — 파일까지 함께 제거 (super-admin 전용)
 *  영수증 = 결제 흔적. 본인이 올린 것이라도 회계 감사 무결성 때문에 admin 승인 필요.
 *  실수 등록 정정은 admin에게 요청해 처리. 일반 editor는 PATCH로 메모/카테고리 수정만 가능.
 */
router.delete("/:id", adminAuth, requireRole("admin"), (req, res) => {
  const row = sqlite.prepare("SELECT * FROM receipts WHERE id = ?").get(req.params.id);
  if (!row) return fail(res, 404, "영수증을 찾을 수 없습니다");
  try {
    if (row.file_path && fs.existsSync(row.file_path)) fs.unlinkSync(row.file_path);
  } catch (err) {
    console.warn("[receipts] 파일 삭제 실패(무시):", err.message);
  }
  sqlite.prepare("DELETE FROM receipts WHERE id = ?").run(req.params.id);
  res.json({ data: { deleted: true }, error: null, meta: null });
});

module.exports = router;
