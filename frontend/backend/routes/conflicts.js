/**
 * 이해상충 검토(Conflict of Interest) API.
 *
 *   POST /api/conflicts/check
 *     Body: { name?, phone?, email?, birthdate?, clientId? }
 *     이름/전화/이메일 중 하나 이상으로 과거 계약서의 상대방을 검색.
 *
 *   GET /api/conflicts/clients/:id
 *     기존 의뢰인 정보로 자동 conflict 검토.
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const service = require("../services/conflict-check-service");

const router = Router();
router.use(adminAuth);

router.post("/check", (req, res) => {
  try {
    const result = service.checkConflict(req.body || {});
    res.json({ data: result, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/clients/:id", (req, res) => {
  try {
    const result = service.checkExistingClient(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

module.exports = router;
