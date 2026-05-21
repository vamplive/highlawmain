/**
 * 자동 트리거 API 라우트 — CRUD
 * - 비즈니스 로직은 services/trigger-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const triggerService = require("../services/trigger-service");

const router = Router();

router.get("/", adminAuth, async (req, res) => {
  try {
    const items = await triggerService.listTriggers(req.query);
    res.json({ data: items, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const item = await triggerService.createTrigger(req.body || {});
    res.json({ data: item, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const item = await triggerService.updateTrigger(req.params.id, req.body || {});
    res.json({ data: item, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await triggerService.deleteTrigger(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
