const { Router } = require("express");
const { db } = require("../db");
const { portalApprovals, portalUsers, clients } = require("../db/schema");
const { eq, and, desc, or } = require("drizzle-orm");
const { portalAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const approvalService = require("../services/approval-service");
const { ServiceError } = require("../services/helpers");

const router = Router();

// ─── 1. 연차 현황 조회 ───
router.get("/leave-status", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const status = await approvalService.getUserLeaveStatus(userId);
    res.json({ data: status, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 2. 기안 상신 ───
router.post("/", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const created = await approvalService.submitApproval(userId, req.body);
    res.status(201).json({ data: created, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 3. 내가 상신한 기안 목록 (내 기안함) ───
router.get("/my-requests", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;

    const rows = await db
      .select({
        id: portalApprovals.id,
        requesterId: portalApprovals.requesterId,
        requesterName: clients.name,
        requesterPosition: portalUsers.position,
        type: portalApprovals.type,
        title: portalApprovals.title,
        status: portalApprovals.status,
        currentApproverId: portalApprovals.currentApproverId,
        approvalLine: portalApprovals.approvalLine,
        leaveType: portalApprovals.leaveType,
        leaveStart: portalApprovals.leaveStart,
        leaveEnd: portalApprovals.leaveEnd,
        leaveDuration: portalApprovals.leaveDuration,
        expenseAmount: portalApprovals.expenseAmount,
        expenseCategory: portalApprovals.expenseCategory,
        expenseReceiptUrl: portalApprovals.expenseReceiptUrl,
        expenseDate: portalApprovals.expenseDate,
        createdAt: portalApprovals.createdAt,
        updatedAt: portalApprovals.updatedAt,
      })
      .from(portalApprovals)
      .leftJoin(portalUsers, eq(portalApprovals.requesterId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .where(eq(portalApprovals.requesterId, userId))
      .orderBy(desc(portalApprovals.createdAt));

    // approvalLine 파싱
    const formatted = rows.map(row => ({
      ...row,
      approvalLine: JSON.parse(row.approvalLine || "[]"),
    }));

    res.json({ data: formatted, error: null, meta: { total: formatted.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 4. 내가 승인해야 할 결재 목록 (결재 대기함) ───
router.get("/pending-approvals", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;

    const rows = await db
      .select({
        id: portalApprovals.id,
        requesterId: portalApprovals.requesterId,
        requesterName: clients.name,
        requesterPosition: portalUsers.position,
        type: portalApprovals.type,
        title: portalApprovals.title,
        status: portalApprovals.status,
        currentApproverId: portalApprovals.currentApproverId,
        approvalLine: portalApprovals.approvalLine,
        leaveType: portalApprovals.leaveType,
        leaveStart: portalApprovals.leaveStart,
        leaveEnd: portalApprovals.leaveEnd,
        leaveDuration: portalApprovals.leaveDuration,
        expenseAmount: portalApprovals.expenseAmount,
        expenseCategory: portalApprovals.expenseCategory,
        expenseReceiptUrl: portalApprovals.expenseReceiptUrl,
        expenseDate: portalApprovals.expenseDate,
        createdAt: portalApprovals.createdAt,
        updatedAt: portalApprovals.updatedAt,
      })
      .from(portalApprovals)
      .leftJoin(portalUsers, eq(portalApprovals.requesterId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .where(
        and(
          eq(portalApprovals.currentApproverId, userId),
          eq(portalApprovals.status, "pending")
        )
      )
      .orderBy(desc(portalApprovals.createdAt));

    const formatted = rows.map(row => ({
      ...row,
      approvalLine: JSON.parse(row.approvalLine || "[]"),
    }));

    res.json({ data: formatted, error: null, meta: { total: formatted.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 5. 내가 참여한 결재 완료/진행 목록 (결재 수신/참조함) ───
router.get("/my-history", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;

    // 기안자가 아니면서 결재선에 자신이 포함된 문서를 가져오기 위해 전체 문서를 로드 후 필터링하거나
    // approvalLine LIKE '%userId%' 형태로 쿼리할 수 있습니다.
    // SQLite에서는 LIKE 검색이 가능하므로 1차로 필터링한 후 JS 단에서 검증합니다.
    const rows = await db
      .select({
        id: portalApprovals.id,
        requesterId: portalApprovals.requesterId,
        requesterName: clients.name,
        requesterPosition: portalUsers.position,
        type: portalApprovals.type,
        title: portalApprovals.title,
        status: portalApprovals.status,
        currentApproverId: portalApprovals.currentApproverId,
        approvalLine: portalApprovals.approvalLine,
        leaveType: portalApprovals.leaveType,
        leaveStart: portalApprovals.leaveStart,
        leaveEnd: portalApprovals.leaveEnd,
        leaveDuration: portalApprovals.leaveDuration,
        expenseAmount: portalApprovals.expenseAmount,
        expenseCategory: portalApprovals.expenseCategory,
        expenseReceiptUrl: portalApprovals.expenseReceiptUrl,
        expenseDate: portalApprovals.expenseDate,
        createdAt: portalApprovals.createdAt,
        updatedAt: portalApprovals.updatedAt,
      })
      .from(portalApprovals)
      .leftJoin(portalUsers, eq(portalApprovals.requesterId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .orderBy(desc(portalApprovals.createdAt));

    const formatted = rows
      .map(row => ({
        ...row,
        approvalLine: JSON.parse(row.approvalLine || "[]"),
      }))
      .filter(row => {
        // 기안자 본인이 아니고 결재선에 포함되어 있으며 본인의 승인 단계가 진행되었거나 pending이 아닌 경우
        const inLine = row.approvalLine.some(item => item.userId === userId);
        return inLine && row.requesterId !== userId;
      });

    res.json({ data: formatted, error: null, meta: { total: formatted.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 6. 단건 결재 상세 조회 ───
router.get("/:id", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const { id } = req.params;

    const [row] = await db
      .select({
        id: portalApprovals.id,
        requesterId: portalApprovals.requesterId,
        requesterName: clients.name,
        requesterPosition: portalUsers.position,
        type: portalApprovals.type,
        title: portalApprovals.title,
        status: portalApprovals.status,
        currentApproverId: portalApprovals.currentApproverId,
        approvalLine: portalApprovals.approvalLine,
        leaveType: portalApprovals.leaveType,
        leaveStart: portalApprovals.leaveStart,
        leaveEnd: portalApprovals.leaveEnd,
        leaveDuration: portalApprovals.leaveDuration,
        expenseAmount: portalApprovals.expenseAmount,
        expenseCategory: portalApprovals.expenseCategory,
        expenseReceiptUrl: portalApprovals.expenseReceiptUrl,
        expenseDate: portalApprovals.expenseDate,
        createdAt: portalApprovals.createdAt,
        updatedAt: portalApprovals.updatedAt,
      })
      .from(portalApprovals)
      .leftJoin(portalUsers, eq(portalApprovals.requesterId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .where(eq(portalApprovals.id, id));

    if (!row) {
      throw new ServiceError("결재 문서를 찾을 수 없습니다", 404);
    }

    const approvalLine = JSON.parse(row.approvalLine || "[]");
    
    // 기안자 또는 결재선 포함자만 조회 가능하도록 제한
    const inLine = approvalLine.some(item => item.userId === userId);
    if (row.requesterId !== userId && !inLine) {
      throw new ServiceError("해당 문서를 볼 권한이 없습니다", 403);
    }

    res.json({
      data: {
        ...row,
        approvalLine,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 7. 승인 처리 ───
router.post("/:id/approve", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const { id } = req.params;
    const { comment } = req.body;

    const updated = await approvalService.approveApproval(id, userId, comment);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 8. 반려 처리 ───
router.post("/:id/reject", portalAuth, async (req, res) => {
  try {
    const { userId } = req.portalUser;
    const { id } = req.params;
    const { comment } = req.body;

    const updated = await approvalService.rejectApproval(id, userId, comment);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
