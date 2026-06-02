/**
 * 업무(Tasks) API 라우트.
 * 모든 엔드포인트는 관리자 인증 필수.
 *
 *   GET    /api/tasks                 목록 (assigneeLawyerId/clientId/caseId/status/priority/overdue 필터)
 *   GET    /api/tasks/count?lawyerId  변호사별 미완료 카운트
 *   GET    /api/tasks/:id
 *   POST   /api/tasks
 *   PUT    /api/tasks/:id
 *   DELETE /api/tasks/:id
 */
const { Router } = require("express");
const { adminAuth, getSession } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const service = require("../services/tasks-service");

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

router.get("/count", async (req, res) => {
  try {
    const lawyerId = req.query.lawyerId;
    if (!lawyerId) {
      return res.status(400).json({ data: null, error: "lawyerId 가 필요합니다", meta: null });
    }
    const data = await service.countByLawyer(lawyerId);
    res.json({ data, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await service.getById(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "업무를 찾을 수 없습니다", meta: null });
    res.json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.post("/", async (req, res) => {
  try {
    const row = await service.create({ ...req.body, createdBy: actorOf(req) });
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { handleError(res, e); }
});

router.put("/:id", async (req, res) => {
  try {
    const row = await service.update(req.params.id, req.body, actorOf(req));
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
