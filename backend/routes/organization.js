const { Router } = require("express");
const { db } = require("../db");
const { departments, portalUsers, clients, siteSettings } = require("../db/schema");
const { eq, and, sql } = require("drizzle-orm");
const { adminAuth } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");
const { ServiceError, validateUUID, nowTimestamp } = require("../services/helpers");

const router = Router();

// =========================================================================
// 1. 부서 (Departments) CRUD
// =========================================================================

// ─── 부서 목록 조회 ───
router.get("/departments", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: departments.id,
        name: departments.name,
        parentId: departments.parentId,
        managerUserId: departments.managerUserId,
        managerName: clients.name,
        managerPosition: portalUsers.position,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .leftJoin(portalUsers, eq(departments.managerUserId, portalUsers.id))
      .leftJoin(clients, eq(portalUsers.clientId, clients.id));

    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 부서 등록 ───
router.post("/departments", adminAuth, async (req, res) => {
  try {
    const { name, parentId, managerUserId } = req.body;
    if (!name || !name.trim()) {
      throw new ServiceError("부서명을 입력해주세요", 400);
    }

    const [created] = await db
      .insert(departments)
      .values({
        name: name.trim(),
        parentId: parentId || null,
        managerUserId: managerUserId || null,
      })
      .returning();

    res.status(201).json({ data: created, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 부서 수정 ───
router.put("/departments/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    validateUUID(id);

    const { name, parentId, managerUserId } = req.body;
    if (!name || !name.trim()) {
      throw new ServiceError("부서명을 입력해주세요", 400);
    }

    // 순환 참조 방지 검증 (부모 부서가 자신이나 하위 부서가 되지 않도록 검증)
    if (parentId && parentId === id) {
      throw new ServiceError("자기 자신을 상위 부서로 지정할 수 없습니다", 400);
    }

    const [existing] = await db.select().from(departments).where(eq(departments.id, id));
    if (!existing) {
      throw new ServiceError("부서를 찾을 수 없습니다", 404);
    }

    const [updated] = await db
      .update(departments)
      .set({
        name: name.trim(),
        parentId: parentId || null,
        managerUserId: managerUserId || null,
        updatedAt: nowTimestamp(),
      })
      .where(eq(departments.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 부서 삭제 ───
router.delete("/departments/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    validateUUID(id);

    const [existing] = await db.select().from(departments).where(eq(departments.id, id));
    if (!existing) {
      throw new ServiceError("부서를 찾을 수 없습니다", 404);
    }

    // 하위 부서들의 상위 부서 지정을 삭제할 부서의 상위 부서로 업데이트하여 계층 구조 유지
    await db
      .update(departments)
      .set({ parentId: existing.parentId || null })
      .where(eq(departments.parentId, id));

    // 이 부서에 속한 사용자들의 부서 아이디 비우기
    await db
      .update(portalUsers)
      .set({ departmentId: null })
      .where(eq(portalUsers.departmentId, id));

    await db.delete(departments).where(eq(departments.id, id));

    res.json({ data: { deleted: true, id }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});


// =========================================================================
// 2. 사원 정보 관리 (인사부서 연동용)
// =========================================================================

// ─── 사원 목록 조회 ───
router.get("/users", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: portalUsers.id,
        email: portalUsers.email,
        name: clients.name,
        phone: clients.phone,
        role: portalUsers.role,
        isActive: portalUsers.isActive,
        position: portalUsers.position,
        hireDate: portalUsers.hireDate,
        departmentId: portalUsers.departmentId,
        departmentName: departments.name,
        createdAt: portalUsers.createdAt,
      })
      .from(portalUsers)
      .leftJoin(clients, eq(portalUsers.clientId, clients.id))
      .leftJoin(departments, eq(portalUsers.departmentId, departments.id))
      .orderBy(portalUsers.createdAt);

    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 사원 부서/직급/입사일 수정 ───
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    validateUUID(id);

    const { departmentId, position, hireDate, role } = req.body;

    const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
    if (!existing) {
      throw new ServiceError("사용자를 찾을 수 없습니다", 404);
    }

    const [updated] = await db
      .update(portalUsers)
      .set({
        departmentId: departmentId || null,
        position: position || null,
        hireDate: hireDate || null,
        role: role || existing.role,
        updatedAt: nowTimestamp(),
      })
      .where(eq(portalUsers.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =========================================================================
// 3. 결재 설정 (Approval Settings)
// =========================================================================

// ─── 결재 설정 조회 ───
router.get("/approval-settings", adminAuth, async (req, res) => {
  try {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.page, "portal"),
          eq(siteSettings.section, "approvals")
        )
      );

    const defaultSettings = {
      approvalLineType: "dept",
      fixedLine: [],
      leaveEnabled: true,
      leaveMinUnit: "hourly",
      expenseEnabled: true,
      expenseLimit: 5000000,
      reimbursementEnabled: true,
    };

    let data = defaultSettings;
    if (setting && setting.content) {
      try {
        data = { ...defaultSettings, ...JSON.parse(setting.content) };
      } catch (e) {
        // parsing error fallback
      }
    }

    res.json({ data, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 결재 설정 저장 ───
router.post("/approval-settings", adminAuth, async (req, res) => {
  try {
    const content = JSON.stringify(req.body);

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.page, "portal"),
          eq(siteSettings.section, "approvals")
        )
      );

    if (existing) {
      await db
        .update(siteSettings)
        .set({
          content,
        })
        .where(
          and(
            eq(siteSettings.page, "portal"),
            eq(siteSettings.section, "approvals")
          )
        );
    } else {
      await db
        .insert(siteSettings)
        .values({
          page: "portal",
          section: "approvals",
          content,
        });
    }

    res.json({ data: { success: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
