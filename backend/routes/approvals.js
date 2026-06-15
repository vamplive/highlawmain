/** 포털 전자결재 API — /api/portal/approvals */
const { Router } = require("express");
const crypto = require("crypto");
const { portalAuth } = require("../lib/auth");
const { sqlite } = require("../db");

const router = Router();
router.use(portalAuth);

function userId(req) { return req.portalUser.userId; }

function sendError(res, e, label) {
  console.error(`[approvals ${label}]`, e.message);
  res.status(500).json({ data: null, error: "서버 오류가 발생했습니다", meta: null });
}

// 포털 사용자 이름/직급 조회 (clients 테이블에서 이름, portal_users에서 직급)
function getPortalUserInfo(uid) {
  if (!uid) return { name: null, position: null, email: null };
  const row = sqlite.prepare(`
    SELECT pu.position, pu.email, c.name
    FROM portal_users pu
    LEFT JOIN clients c ON c.id = pu.client_id
    WHERE pu.id = ?
  `).get(uid);
  return { name: row?.name || row?.email || null, position: row?.position || null, email: row?.email || null };
}

// 결재선 파싱: 구형(userId 문자열 배열)과 신형(객체 배열) 모두 지원
function parseApprovalLine(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return arr.map((item) => {
      if (typeof item === "string") {
        return { userId: item, action: null, comment: null, actionAt: null };
      }
      return item;
    });
  } catch {
    return [];
  }
}

// 결재선에 이름/직급 보강
function enrichApprovalLine(parsedLine, currentApproverId, docStatus) {
  return parsedLine.map((item, idx) => {
    const info = getPortalUserInfo(item.userId);
    // 개별 결재자 상태 도출
    let status = "pending";
    if (item.action === "approved") status = "approved";
    else if (item.action === "rejected") status = "rejected";
    else if (docStatus === "approved") status = "approved";
    else if (item.userId === currentApproverId && docStatus === "pending") status = "pending";
    else {
      const currentIdx = parsedLine.findIndex((i) => i.userId === currentApproverId);
      if (currentIdx > -1 && idx < currentIdx) status = "approved";
    }
    return {
      userId: item.userId,
      name: info.name,
      position: info.position,
      status,
      comment: item.comment || null,
      updatedAt: item.actionAt || null,
    };
  });
}

// DB row → 프론트 camelCase 응답 변환
function formatApproval(row) {
  if (!row) return null;
  const requester = getPortalUserInfo(row.requester_id);
  const parsedLine = parseApprovalLine(row.approval_line);
  const enriched = enrichApprovalLine(parsedLine, row.current_approver_id, row.status);

  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: requester.name,
    requesterPosition: requester.position,
    type: row.type,
    title: row.title,
    status: row.status,
    detail: row.detail || null,
    currentApproverId: row.current_approver_id,
    approvalLine: enriched,
    leaveType: row.leave_type,
    leaveStart: row.leave_start,
    leaveEnd: row.leave_end,
    leaveDuration: row.leave_duration,
    expenseAmount: row.expense_amount,
    expenseCategory: row.expense_category,
    expenseReceiptUrl: row.expense_receipt_url,
    expenseDate: row.expense_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 연차 현황 — 올해 사용일수 집계 + 입사일 기반 발생 연차 계산
router.get("/leave-status", (req, res) => {
  try {
    const uid = userId(req);
    const year = new Date().getFullYear();

    const userRow = sqlite.prepare("SELECT hire_date FROM portal_users WHERE id = ?").get(uid);
    const hireDate = userRow?.hire_date;

    let totalAnnual = 15;
    if (hireDate) {
      const hire = new Date(hireDate);
      const today = new Date();
      const daysWorked = (today - hire) / (1000 * 60 * 60 * 24);
      const yearsWorked = daysWorked / 365.25;
      if (yearsWorked < 1) {
        totalAnnual = Math.min(Math.floor(daysWorked / 30.44), 11);
      } else {
        totalAnnual = Math.min(15 + Math.floor((yearsWorked - 1) / 2), 25);
      }
    }

    const used = sqlite.prepare(`
      SELECT COALESCE(SUM(leave_duration), 0) as used
      FROM portal_approvals
      WHERE requester_id = ? AND type = 'leave' AND status = 'approved'
        AND leave_start LIKE ?
    `).get(uid, `${year}%`);

    const totalAccruedHours = totalAnnual * 8;
    const usedHours = used.used || 0;
    const availableHours = Math.max(0, totalAccruedHours - usedHours);

    res.json({
      data: {
        hireDate: hireDate || null,
        totalAccruedDays: totalAnnual,
        totalAccruedHours,
        totalUsedDays: +(usedHours / 8).toFixed(2),
        totalUsedHours: usedHours,
        availableDays: +(availableHours / 8).toFixed(2),
        availableHours,
        details: hireDate ? "입사일 기준 자동 계산" : "입사일 미설정 — 기본 15일 적용",
      },
      error: null, meta: null,
    });
  } catch (e) { sendError(res, e, "leave-status"); }
});

// 내가 올린 결재 요청
router.get("/my-requests", (req, res) => {
  try {
    const rows = sqlite.prepare(
      "SELECT * FROM portal_approvals WHERE requester_id = ? ORDER BY created_at DESC LIMIT 50"
    ).all(userId(req));
    res.json({ data: rows.map(formatApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "my-requests"); }
});

// 내가 결재해야 하는 목록
router.get("/pending-approvals", (req, res) => {
  try {
    const rows = sqlite.prepare(
      "SELECT * FROM portal_approvals WHERE current_approver_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 50"
    ).all(userId(req));
    res.json({ data: rows.map(formatApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "pending-approvals"); }
});

// 결재 처리 이력
router.get("/my-history", (req, res) => {
  try {
    const uid = userId(req);
    const rows = sqlite.prepare(`
      SELECT * FROM portal_approvals
      WHERE (requester_id = ? OR current_approver_id = ? OR approval_line LIKE ?)
        AND status != 'pending'
      ORDER BY updated_at DESC LIMIT 50
    `).all(uid, uid, `%${uid}%`);
    res.json({ data: rows.map(formatApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "my-history"); }
});

// 결재 상세
router.get("/:id", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "결재를 찾을 수 없습니다", meta: null });
    res.json({ data: formatApproval(row), error: null, meta: null });
  } catch (e) { sendError(res, e, "/:id"); }
});

// 결재 기안 상신
router.post("/", (req, res) => {
  const {
    type, title, detail,
    leaveType, leaveStart, leaveEnd, leaveDuration,
    expenseAmount, expenseCategory, expenseReceiptUrl, expenseDate,
  } = req.body || {};

  if (!type || !title) {
    return res.status(400).json({ data: null, error: "type과 title은 필수입니다", meta: null });
  }

  try {
    const uid = userId(req);

    // 결재선 조회 (조직 설정의 fixedLine 우선)
    const approvalSettings = sqlite.prepare(
      "SELECT content FROM site_settings WHERE page = 'system' AND section = 'approval_settings'"
    ).get();

    let approverId = null;
    let approvalLineIds = [];

    if (approvalSettings?.content) {
      const s = JSON.parse(approvalSettings.content);
      if (s.fixedLine?.length) {
        approvalLineIds = s.fixedLine.filter((id) => id !== uid);
        approverId = approvalLineIds[0] || null;
      }
    }

    // 결재선을 객체 배열로 저장
    const approvalLineObjects = approvalLineIds.map((id) => ({
      userId: id,
      action: null,
      comment: null,
      actionAt: null,
    }));

    const id = crypto.randomUUID();
    const docStatus = approverId ? "pending" : "approved";

    sqlite.prepare(`
      INSERT INTO portal_approvals
        (id, requester_id, type, title, status, current_approver_id, approval_line,
         leave_type, leave_start, leave_end, leave_duration,
         expense_amount, expense_category, expense_receipt_url, expense_date,
         detail, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    `).run(
      id, uid, type, title, docStatus, approverId,
      JSON.stringify(approvalLineObjects),
      leaveType || null, leaveStart || null, leaveEnd || null, leaveDuration || null,
      expenseAmount || null, expenseCategory || null, expenseReceiptUrl || null, expenseDate || null,
      detail || null
    );

    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ?").get(id);
    res.status(201).json({ data: formatApproval(row), error: null, meta: null });
  } catch (e) { sendError(res, e, "POST /"); }
});

// 공통 결재 처리 핸들러 (승인/반려)
function handleApprovalAction(action) {
  return (req, res) => {
    try {
      const uid = userId(req);
      const { comment } = req.body || {};
      const { id } = req.params;

      const row = sqlite.prepare(
        "SELECT * FROM portal_approvals WHERE id = ? AND current_approver_id = ? AND status = 'pending'"
      ).get(id, uid);

      if (!row) {
        return res.status(404).json({ data: null, error: "결재를 찾을 수 없거나 권한이 없습니다", meta: null });
      }

      if (action === "reject" && !comment?.trim()) {
        return res.status(400).json({ data: null, error: "반려 시 사유를 입력해주세요", meta: null });
      }

      // 결재선 업데이트 (현재 결재자의 action/comment 기록)
      const parsedLine = parseApprovalLine(row.approval_line);
      const updatedLine = parsedLine.map((item) => {
        if (item.userId === uid) {
          return { ...item, action, comment: comment?.trim() || null, actionAt: new Date().toISOString() };
        }
        return item;
      });

      if (action === "approved") {
        // 다음 결재자 찾기
        const currentIdx = updatedLine.findIndex((i) => i.userId === uid);
        const nextApprover = updatedLine.slice(currentIdx + 1).find((i) => !i.action);
        const nextApproverId = nextApprover?.userId || null;

        if (nextApproverId) {
          // 다음 결재자로 넘기기
          sqlite.prepare(
            "UPDATE portal_approvals SET current_approver_id = ?, approval_line = ?, updated_at = datetime('now') WHERE id = ?"
          ).run(nextApproverId, JSON.stringify(updatedLine), id);
        } else {
          // 최종 승인
          sqlite.prepare(
            "UPDATE portal_approvals SET status = 'approved', current_approver_id = NULL, approval_line = ?, updated_at = datetime('now') WHERE id = ?"
          ).run(JSON.stringify(updatedLine), id);
        }
      } else {
        // 반려
        sqlite.prepare(
          "UPDATE portal_approvals SET status = 'rejected', approval_line = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(JSON.stringify(updatedLine), id);
      }

      const updated = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ?").get(id);
      res.json({ data: formatApproval(updated), error: null, meta: null });
    } catch (e) { sendError(res, e, `${action}`); }
  };
}

// PATCH + POST 둘 다 지원 (프론트가 POST 사용)
router.patch("/:id/approve", handleApprovalAction("approved"));
router.post("/:id/approve", handleApprovalAction("approved"));
router.patch("/:id/reject", handleApprovalAction("rejected"));
router.post("/:id/reject", handleApprovalAction("rejected"));

module.exports = router;
