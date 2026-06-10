/** 조직/부서/결재설정 관리 API — /api/admin/organization */
const { Router } = require("express");
const crypto = require("crypto");
const { adminAuth } = require("../lib/auth");
const { sqlite } = require("../db");

const router = Router();
router.use(adminAuth);

function sendError(res, e, label) {
  console.error(`[organization ${label}]`, e.message);
  res.status(500).json({ data: null, error: "서버 오류가 발생했습니다", meta: null });
}

// 부서 목록
router.get("/departments", (req, res) => {
  try {
    const rows = sqlite.prepare("SELECT * FROM departments ORDER BY created_at ASC").all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { sendError(res, e, "GET departments"); }
});

// 부서 생성
router.post("/departments", (req, res) => {
  const { name, parentId, managerUserId } = req.body || {};
  if (!name) return res.status(400).json({ data: null, error: "name은 필수입니다", meta: null });
  try {
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO departments (id, name, parent_id, manager_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, name, parentId || null, managerUserId || null);
    const row = sqlite.prepare("SELECT * FROM departments WHERE id = ?").get(id);
    res.status(201).json({ data: row, error: null, meta: null });
  } catch (e) { sendError(res, e, "POST departments"); }
});

// 부서 수정
router.put("/departments/:id", (req, res) => {
  const { name, parentId, managerUserId } = req.body || {};
  try {
    const row = sqlite.prepare("SELECT id FROM departments WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "부서를 찾을 수 없습니다", meta: null });
    sqlite.prepare(`
      UPDATE departments SET name = ?, parent_id = ?, manager_user_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, parentId || null, managerUserId || null, row.id);
    const updated = sqlite.prepare("SELECT * FROM departments WHERE id = ?").get(row.id);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { sendError(res, e, "PUT departments/:id"); }
});

// 부서 삭제
router.delete("/departments/:id", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT id FROM departments WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "부서를 찾을 수 없습니다", meta: null });
    sqlite.prepare("DELETE FROM departments WHERE id = ?").run(row.id);
    res.json({ data: { id: row.id }, error: null, meta: null });
  } catch (e) { sendError(res, e, "DELETE departments/:id"); }
});

// 구성원(portal_users) 목록 — 조직 관리에서 사용
router.get("/users", (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT id, name, email, role, position, department_id, hire_date, is_active, created_at
      FROM portal_users ORDER BY name ASC
    `).all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { sendError(res, e, "GET users"); }
});

// 구성원 정보 수정 (부서/직급/입사일/역할)
router.put("/users/:id", (req, res) => {
  const { departmentId, position, hireDate, role } = req.body || {};
  try {
    const row = sqlite.prepare("SELECT id FROM portal_users WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    const updates = [];
    const params = [];
    if (departmentId !== undefined) { updates.push("department_id = ?"); params.push(departmentId || null); }
    if (position !== undefined) { updates.push("position = ?"); params.push(position || null); }
    if (hireDate !== undefined) { updates.push("hire_date = ?"); params.push(hireDate || null); }
    if (role !== undefined) { updates.push("role = ?"); params.push(role); }
    if (updates.length === 0) return res.status(400).json({ data: null, error: "수정할 항목이 없습니다", meta: null });
    params.push(row.id);
    sqlite.prepare(`UPDATE portal_users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    const updated = sqlite.prepare("SELECT id, name, email, role, position, department_id, hire_date, is_active FROM portal_users WHERE id = ?").get(row.id);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) { sendError(res, e, "PUT users/:id"); }
});

// 결재 설정 조회
router.get("/approval-settings", (req, res) => {
  try {
    const row = sqlite.prepare("SELECT content FROM site_settings WHERE page = 'system' AND section = 'approval_settings'").get();
    const defaults = {
      approvalLineType: "dept",
      fixedLine: [],
      leaveEnabled: true,
      leaveMinUnit: "hourly",
      expenseEnabled: true,
      expenseLimit: 5000000,
      reimbursementEnabled: true,
    };
    const data = row?.content ? { ...defaults, ...JSON.parse(row.content) } : defaults;
    res.json({ data, error: null, meta: null });
  } catch (e) { sendError(res, e, "GET approval-settings"); }
});

// 결재 설정 저장
router.post("/approval-settings", (req, res) => {
  try {
    const content = JSON.stringify(req.body || {});
    const existing = sqlite.prepare("SELECT id FROM site_settings WHERE page = 'system' AND section = 'approval_settings'").get();
    if (existing) {
      sqlite.prepare("UPDATE site_settings SET content = ?, updated_at = datetime('now') WHERE page = 'system' AND section = 'approval_settings'").run(content);
    } else {
      sqlite.prepare("INSERT INTO site_settings (id, page, section, content, updated_at) VALUES (?, 'system', 'approval_settings', ?, datetime('now'))").run(crypto.randomUUID(), content);
    }
    res.json({ data: req.body, error: null, meta: null });
  } catch (e) { sendError(res, e, "POST approval-settings"); }
});

// 변호사-구성원 연결 목록
router.get("/lawyers-link", (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT l.id, l.name_ko, l.name_en, l.role, l.position,
             pu.id as portal_user_id, pu.name as portal_user_name, pu.email as portal_user_email
      FROM lawyers l
      LEFT JOIN portal_users pu ON pu.email = l.email
      ORDER BY l.name_ko ASC
    `).all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) { sendError(res, e, "GET lawyers-link"); }
});

module.exports = router;
