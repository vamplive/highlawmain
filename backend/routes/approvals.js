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

function parseApproval(row) {
  if (!row) return null;
  return {
    ...row,
    approvalLine: row.approval_line ? JSON.parse(row.approval_line) : [],
    leaveDuration: row.leave_duration,
    expenseAmount: row.expense_amount,
  };
}

// 연차 현황 — 올해 사용일수 집계 + 입사일 기반 발생 연차 계산
router.get("/leave-status", (req, res) => {
  try {
    const uid = userId(req);
    const year = new Date().getFullYear();

    // 입사일 조회
    const userRow = sqlite.prepare("SELECT hire_date FROM portal_users WHERE id = ?").get(uid);
    const hireDate = userRow?.hire_date;

    // 근로기준법 제60조 기준 연차 계산
    let totalAnnual = 15;
    if (hireDate) {
      const hire = new Date(hireDate);
      const today = new Date();
      const daysWorked = (today - hire) / (1000 * 60 * 60 * 24);
      const yearsWorked = daysWorked / 365.25;

      if (yearsWorked < 1) {
        // 1년 미만: 만 1개월 당 1일 (최대 11일)
        totalAnnual = Math.min(Math.floor(daysWorked / 30.44), 11);
      } else {
        // 1년 이상: 15일 + 2년마다 1일 추가 (최대 25일)
        totalAnnual = Math.min(15 + Math.floor((yearsWorked - 1) / 2), 25);
      }
    }

    // leave_duration은 시간(hour) 단위: 하루=8, 반차=4, 시간단위=1
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
        totalAccruedHours: totalAccruedHours,
        totalUsedDays: +(usedHours / 8).toFixed(2),
        totalUsedHours: usedHours,
        availableDays: +(availableHours / 8).toFixed(2),
        availableHours: availableHours,
        details: hireDate ? '입사일 기준 자동 계산' : '입사일 미설정 — 기본 15일 적용',
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
    res.json({ data: rows.map(parseApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "my-requests"); }
});

// 내가 결재해야 하는 목록
router.get("/pending-approvals", (req, res) => {
  try {
    const rows = sqlite.prepare(
      "SELECT * FROM portal_approvals WHERE current_approver_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 50"
    ).all(userId(req));
    res.json({ data: rows.map(parseApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "pending-approvals"); }
});

// 결재 처리 이력 (내가 결재자로 포함된 완료 건)
router.get("/my-history", (req, res) => {
  try {
    const uid = userId(req);
    const rows = sqlite.prepare(
      "SELECT * FROM portal_approvals WHERE (requester_id = ? OR current_approver_id = ?) AND status != 'pending' ORDER BY updated_at DESC LIMIT 50"
    ).all(uid, uid);
    res.json({ data: rows.map(parseApproval), error: null, meta: null });
  } catch (e) { sendError(res, e, "my-history"); }
});

// 결재 상세
router.get("/:id", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "결재를 찾을 수 없습니다", meta: null });
    res.json({ data: parseApproval(row), error: null, meta: null });
  } catch (e) { sendError(res, e, "/:id"); }
});

// 결재 기안
router.post("/", (req, res) => {
  const { type, title, leaveType, leaveStart, leaveEnd, leaveDuration, expenseAmount, expenseCategory, expenseReceiptUrl, expenseDate, reason } = req.body || {};
  if (!type || !title) return res.status(400).json({ data: null, error: "type과 title은 필수입니다", meta: null });
  try {
    const uid = userId(req);
    // 결재선: 조직 설정에서 관리자 결재자를 가져오거나, 없으면 자기 자신이 단독 결재
    const approvalSettings = sqlite.prepare(
      "SELECT content FROM site_settings WHERE page = 'system' AND section = 'approval_settings'"
    ).get();
    let approverId = null;
    let approvalLine = [];
    if (approvalSettings?.content) {
      const s = JSON.parse(approvalSettings.content);
      if (s.fixedLine?.length) {
        approvalLine = s.fixedLine;
        approverId = s.fixedLine[0];
      }
    }
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO portal_approvals
        (id, requester_id, type, title, status, current_approver_id, approval_line,
         leave_type, leave_start, leave_end, leave_duration,
         expense_amount, expense_category, expense_receipt_url, expense_date,
         created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    `).run(
      id, uid, type, title, approverId ? "pending" : "approved", approverId,
      JSON.stringify(approvalLine),
      leaveType || null, leaveStart || null, leaveEnd || null, leaveDuration || null,
      expenseAmount || null, expenseCategory || null, expenseReceiptUrl || null, expenseDate || null
    );
    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ?").get(id);
    res.status(201).json({ data: parseApproval(row), error: null, meta: null });
  } catch (e) { sendError(res, e, "POST /"); }
});

// 결재 승인/반려
router.patch("/:id/approve", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ? AND current_approver_id = ?").get(req.params.id, userId(req));
    if (!row) return res.status(404).json({ data: null, error: "결재를 찾을 수 없거나 권한이 없습니다", meta: null });
    sqlite.prepare(
      "UPDATE portal_approvals SET status = 'approved', updated_at = datetime('now') WHERE id = ?"
    ).run(row.id);
    res.json({ data: { id: row.id, status: "approved" }, error: null, meta: null });
  } catch (e) { sendError(res, e, "approve"); }
});

router.patch("/:id/reject", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM portal_approvals WHERE id = ? AND current_approver_id = ?").get(req.params.id, userId(req));
    if (!row) return res.status(404).json({ data: null, error: "결재를 찾을 수 없거나 권한이 없습니다", meta: null });
    sqlite.prepare(
      "UPDATE portal_approvals SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
    ).run(row.id);
    res.json({ data: { id: row.id, status: "rejected" }, error: null, meta: null });
  } catch (e) { sendError(res, e, "reject"); }
});

// 영수증 업로드 URL 반환 (media 라우트에 위임)
router.post("/receipt-upload", (req, res) => {
  res.json({ data: { uploadUrl: "/api/media/upload" }, error: null, meta: null });
});

module.exports = router;
