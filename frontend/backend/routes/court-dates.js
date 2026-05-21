/**
 * 법정 일정(Court Dates) API 라우트.
 * 모든 엔드포인트는 관리자 인증 필수.
 *
 *   GET    /api/court-dates          목록 (lawyerId/clientId/caseId/kind/status/from/to/upcoming)
 *   GET    /api/court-dates/:id
 *   POST   /api/court-dates
 *   PUT    /api/court-dates/:id
 *   DELETE /api/court-dates/:id
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const service = require("../services/court-dates-service");

const router = Router();
router.use(adminAuth);

router.get("/", async (req, res) => {
  try {
    const result = await service.list(req.query);
    res.json({ data: result.data, error: null, meta: result.meta });
  } catch (e) { handleError(res, e); }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "일정을 찾을 수 없습니다", meta: null });
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/", async (req, res) => {
  try {
    const row = await service.create(req.body);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.put("/:id", async (req, res) => {
  try {
    const row = await service.update(req.params.id, req.body);
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.delete("/:id", async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (e) { handleError(res, e); }
});

module.exports = router;
