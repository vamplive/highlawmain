/**
 * 시간 기록 API 라우트 — 변호사 시급제 청구 기반.
 *
 * 모든 엔드포인트는 관리자 인증 필수.
 *
 *   GET    /api/time-entries                      목록 (필터: lawyerId, clientId, caseId, billable, billed, from, to)
 *   GET    /api/time-entries/active               변호사의 진행 중 타이머 (lawyerId 필수)
 *   GET    /api/time-entries/summary              집계 (총 시간 / 청구 / 미청구 등)
 *   GET    /api/time-entries/:id
 *   POST   /api/time-entries                      수동 entry 생성
 *   POST   /api/time-entries/timer/start          타이머 시작
 *   POST   /api/time-entries/timer/stop           진행 중 타이머 종료 (lawyerId 필수)
 *   PUT    /api/time-entries/:id
 *   DELETE /api/time-entries/:id
 */
const { Router } = require("express");
const { adminAuth, getSession } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const service = require("../services/time-entries-service");

const router = Router();
router.use(adminAuth);

function actorOf(req) {
  const auth = req.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const session = token ? getSession(token) : null;
  return session?.username || session?.userId || null;
}

router.get("/", async (req, res) => {
  try {
    const result = await service.list(req.query);
    res.json({ data: result.data, error: null, meta: result.meta });
  } catch (e) { handleError(res, e); }
});

router.get("/active", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    if (!lawyerId) {
      return res.status(400).json({ data: null, error: "lawyerId 가 필요합니다", meta: null });
    }
    const active = await service.getActiveTimer(lawyerId);
    res.json({ data: active, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/summary", async (req, res) => {
  try {
    const data = await service.summary(req.query);
    res.json({ data, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "기록을 찾을 수 없습니다", meta: null });
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/", async (req, res) => {
  try {
    const row = await service.create(req.body);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/timer/start", async (req, res) => {
  try {
    const row = await service.startTimer(req.body);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/timer/stop", async (req, res) => {
  try {
    const lawyerId = req.body?.lawyerId;
    if (!lawyerId) {
      return res.status(400).json({ data: null, error: "lawyerId 가 필요합니다", meta: null });
    }
    const row = await service.stopTimer(lawyerId);
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/to-invoice", async (req, res) => {
  try {
    const result = await service.createInvoiceFromEntries(req.body, actorOf(req));
    res.status(201).json({ data: result, error: null, meta: null });
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
