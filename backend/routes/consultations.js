/**
 * 상담 신청 API 라우트 — 상담 CRUD (공개 생성 + 관리자 조회/수정/삭제)
 * - 비즈니스 로직은 services/consultation-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const consultationService = require("../services/consultation-service");
const triggerService = require("../services/trigger-service");
const { handleError } = require("../lib/route-handler");

const router = Router();

/**
 * POST /api/consultations — 상담 신청 생성 (공개)
 */
router.post("/", async (req, res) => {
  try {
    const inserted = await consultationService.createConsultation(req.body);
    // 상담 접수 자동 트리거 (실패해도 접수는 성공 응답)
    triggerService.fireTrigger("consultation_received", {
      recipient: {
        name: inserted.name,
        phone: inserted.phone,
        email: inserted.email,
        category: inserted.category,
        consultationId: inserted.id,
      },
      originRef: `consultation_received:${inserted.id}`,
    });
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/consultations — 상담 목록 조회 (관리자)
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await consultationService.listConsultations(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * PATCH /api/consultations/:id — 상담 상태/메모 수정 (관리자)
 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await consultationService.updateConsultation(req.params.id, req.body);
    // 상담이 confirmed로 전이될 때 확정 트리거 발동
    if (req.body && req.body.status === "confirmed") {
      triggerService.fireTrigger("consultation_confirmed", {
        recipient: {
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          category: updated.category,
          consultationId: updated.id,
        },
        originRef: `consultation_confirmed:${updated.id}`,
      });
    }
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * POST /api/consultations/:id/confirm — 상담 확정 (관리자)
 * - 화상 상담이면 Google Meet 링크 자동 생성 시도 (env 미설정 시 수동 입력값 사용)
 * - 확정 트리거 발동으로 의뢰인에게 SMS/이메일 자동 발송
 */
router.post("/:id/confirm", adminAuth, async (req, res) => {
  try {
    const updated = await consultationService.confirmConsultation(req.params.id, {
      meetingLink: req.body?.meetingLink,
      adminNote: req.body?.adminNote,
    });
    triggerService.fireTrigger("consultation_confirmed", {
      recipient: {
        name: updated.name, phone: updated.phone, email: updated.email,
        category: updated.category, consultationId: updated.id,
        meetingLink: updated.meetingLink,
        meetingType: updated.meetingType,
      },
      originRef: `consultation_confirmed:${updated.id}`,
    });
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * DELETE /api/consultations/:id — 상담 삭제 (관리자)
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await consultationService.deleteConsultation(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
