/**
 * 의뢰인 예치금(Trust Account) API 라우트.
 * 모든 엔드포인트 관리자 인증 필수.
 *
 *   GET  /api/trust-accounts/total                 전체 합계 (은행과 reconciliation)
 *   GET  /api/trust-accounts/balances              모든 의뢰인 잔액 (잔액≠0)
 *   GET  /api/trust-accounts/clients/:id/balance   특정 의뢰인 잔액
 *   GET  /api/trust-accounts/clients/:id/transactions  의뢰인 거래 목록 (running balance)
 *   POST /api/trust-accounts/transactions          거래 등록 (deposit/withdrawal/adjustment)
 *   POST /api/trust-accounts/transactions/:id/void 거래 취소(잔액 계산 제외)
 */
const { Router } = require("express");
const { adminAuth, getSession } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const service = require("../services/trust-accounts-service");

const router = Router();
router.use(adminAuth);

function actorOf(req) {
  const auth = req.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const session = token ? getSession(token) : null;
  return session?.username || session?.userId || null;
}

router.get("/total", async (req, res) => {
  try {
    const data = await service.getTotalBalance();
    res.json({ data, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/balances", async (req, res) => {
  try {
    const data = await service.getAllBalances();
    res.json({ data, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/clients/:id/balance", async (req, res) => {
  try {
    const data = await service.getClientBalance(req.params.id);
    res.json({ data, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/clients/:id/transactions", async (req, res) => {
  try {
    const result = await service.listByClient(req.params.id, req.query);
    res.json({ data: result.data, error: null, meta: result.meta });
  } catch (e) { handleError(res, e); }
});

router.post("/transactions", async (req, res) => {
  try {
    const row = await service.recordTransaction(req.body, actorOf(req));
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/transactions/:id/void", async (req, res) => {
  try {
    const row = await service.voidTransaction(req.params.id, actorOf(req), req.body?.reason);
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

module.exports = router;
