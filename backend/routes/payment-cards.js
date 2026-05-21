/**
 * 결제 카드 사전 등록 라우트 — 관리자 전용
 *
 * 운영자가 보유한 카드(법인·개인·체크 등)를 미리 등록해 두면
 * 영수증 OCR 결과의 last4 + 카드사로 매칭해 별칭·색상으로 표기한다.
 *
 *  - GET    /                : 활성 카드 목록
 *  - POST   /                : 신규 등록
 *  - PATCH  /:id             : 수정
 *  - DELETE /:id             : 삭제 (하드 삭제)
 */
const { Router } = require("express");
const crypto = require("crypto");
const { sqlite } = require("../db");
const { adminAuth, requireRole, requireMinRole } = require("../lib/auth");
const { auditMiddleware } = require("../lib/audit-log");

const router = Router();

// 카드 등록·수정·삭제는 모두 감사 로그에 기록 (회계 매칭 변경 추적)
router.use(auditMiddleware("payment_cards"));

function fail(res, status, msg) {
  return res.status(status).json({ data: null, error: msg, meta: null });
}

function rowToDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    first4: row.first4,
    last4: row.last4,
    issuer: row.issuer,
    label: row.label,
    color: row.color,
    memo: row.memo,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 입력값 검증
//  - last4 / first4 중 최소 하나는 숫자 4자리여야 한다
//    (영수증마다 마스킹 위치가 달라 둘 다 매칭에 사용)
//  - label 은 필수
function validate(body) {
  const last4  = String(body.last4  || "").trim();
  const first4 = String(body.first4 || "").trim();
  const label  = String(body.label  || "").trim();
  if (last4  && !/^\d{4}$/.test(last4))  return "카드번호 끝 4자리는 숫자 4자리여야 합니다";
  if (first4 && !/^\d{4}$/.test(first4)) return "카드번호 앞 4자리는 숫자 4자리여야 합니다";
  if (!last4 && !first4) return "카드 앞 4자리 또는 끝 4자리 중 하나는 입력해야 합니다";
  if (!label) return "카드 별칭(label)은 필수입니다";
  return null;
}

/** GET /api/payment-cards — 카드 목록 (활성+비활성 모두, is_active 정렬) */
router.get("/", adminAuth, (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT * FROM payment_cards
      ORDER BY is_active DESC, issuer ASC, last4 ASC
    `).all();
    res.json({ data: rows.map(rowToDto), error: null, meta: { count: rows.length } });
  } catch (err) {
    console.error("[payment-cards] 목록 실패:", err.message);
    fail(res, 500, "카드 목록을 불러오지 못했습니다");
  }
});

/** POST /api/payment-cards — 신규 카드 등록 (manager 이상) */
router.post("/", adminAuth, requireMinRole("manager"), (req, res) => {
  const error = validate(req.body);
  if (error) return fail(res, 400, error);
  try {
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO payment_cards (id, first4, last4, issuer, label, color, memo, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      req.body.first4 ? String(req.body.first4).trim() : null,
      req.body.last4  ? String(req.body.last4).trim()  : null,
      req.body.issuer ? String(req.body.issuer).trim() : null,
      req.body.label.trim(),
      req.body.color || null,
      req.body.memo || null,
    );
    const row = sqlite.prepare("SELECT * FROM payment_cards WHERE id = ?").get(id);
    res.json({ data: rowToDto(row), error: null, meta: null });
  } catch (err) {
    console.error("[payment-cards] 등록 실패:", err.message);
    fail(res, 500, "카드 등록에 실패했습니다");
  }
});

/** PATCH /api/payment-cards/:id — 카드 수정 (manager 이상) */
router.patch("/:id", adminAuth, requireMinRole("manager"), (req, res) => {
  const existing = sqlite.prepare("SELECT id FROM payment_cards WHERE id = ?").get(req.params.id);
  if (!existing) return fail(res, 404, "카드를 찾을 수 없습니다");

  // 부분 업데이트: 보내진 필드만 검증
  // last4·first4는 빈 문자열("")이면 NULL 처리 가능 (한쪽만 등록한 카드 지원)
  const last4In  = req.body.last4;
  const first4In = req.body.first4;
  if (last4In  !== undefined && last4In  !== "" && !/^\d{4}$/.test(String(last4In).trim())) {
    return fail(res, 400, "카드번호 끝 4자리는 숫자 4자리여야 합니다");
  }
  if (first4In !== undefined && first4In !== "" && !/^\d{4}$/.test(String(first4In).trim())) {
    return fail(res, 400, "카드번호 앞 4자리는 숫자 4자리여야 합니다");
  }
  if (req.body.label !== undefined && !String(req.body.label || "").trim()) {
    return fail(res, 400, "카드 별칭은 비울 수 없습니다");
  }

  const fieldMap = {
    first4: "first4", last4: "last4", issuer: "issuer", label: "label",
    color: "color", memo: "memo", isActive: "is_active",
  };
  const set = [];
  const params = [];
  for (const [k, col] of Object.entries(fieldMap)) {
    if (req.body[k] === undefined) continue;
    if (k === "isActive") {
      set.push(`${col} = ?`);
      params.push(req.body[k] ? 1 : 0);
    } else {
      set.push(`${col} = ?`);
      params.push(req.body[k] === "" ? null : req.body[k]);
    }
  }
  if (set.length === 0) return fail(res, 400, "수정할 필드가 없습니다");
  set.push("updated_at = datetime('now')");
  params.push(req.params.id);
  sqlite.prepare(`UPDATE payment_cards SET ${set.join(", ")} WHERE id = ?`).run(...params);
  const row = sqlite.prepare("SELECT * FROM payment_cards WHERE id = ?").get(req.params.id);
  res.json({ data: rowToDto(row), error: null, meta: null });
});

// 카드 하드 삭제: 영수증과의 매칭 끊김 → 결제 추적성 손상이므로 super-admin 전용.
// 일반 운영자는 isActive=false (비활성화)로 PATCH 하면 됨.
router.delete("/:id", adminAuth, requireRole("admin"), (req, res) => {
  const row = sqlite.prepare("SELECT id FROM payment_cards WHERE id = ?").get(req.params.id);
  if (!row) return fail(res, 404, "카드를 찾을 수 없습니다");
  sqlite.prepare("DELETE FROM payment_cards WHERE id = ?").run(req.params.id);
  res.json({ data: { deleted: true }, error: null, meta: null });
});

module.exports = router;
