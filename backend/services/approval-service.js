const { db } = require("../db");
const { portalUsers, clients, departments, portalApprovals } = require("../db/schema");
const { eq, and, desc } = require("drizzle-orm");
const { ServiceError, validateUUID, nowTimestamp } = require("./helpers");

/**
 * 근로기준법에 따른 연차 휴가 일수(시간) 계산
 * @param {string} hireDateStr - 입사일 (YYYY-MM-DD)
 * @param {string} [targetDateStr] - 기준일 (기본값: 오늘)
 * @returns {{ accruedDays: number, accruedHours: number, details: string }}
 */
function calculateLeaveAllowance(hireDateStr, targetDateStr = null) {
  if (!hireDateStr) {
    return { accruedDays: 0, accruedHours: 0, details: "입사일 미지정" };
  }

  const hire = new Date(hireDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();

  // 날짜 파싱 오류 처리
  if (isNaN(hire.getTime())) {
    return { accruedDays: 0, accruedHours: 0, details: "올바르지 않은 입사일 형식" };
  }

  const hireYear = hire.getFullYear();
  const hireMonth = hire.getMonth();
  const hireDay = hire.getDate();
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();
  const targetDay = target.getDate();

  // 입사일로부터 몇 개월이 경과했는지 계산
  let monthsDiff = (targetYear - hireYear) * 12 + targetMonth - hireMonth;
  if (targetDay < hireDay) {
    monthsDiff--;
  }

  if (monthsDiff < 0) {
    return { accruedDays: 0, accruedHours: 0, details: "입사일 이전 대상자" };
  }

  let accruedDays = 0;
  let details = "";

  if (monthsDiff < 12) {
    // 1년 미만: 1달 만근 시 1일씩 부여 (최대 11일)
    accruedDays = monthsDiff;
    details = `입사 1년 미만: 매월 1일씩 총 ${monthsDiff}일 발생`;
  } else {
    // 1년 이상: 기본 15일 부여 + 최초 11일
    // 근로기준법에 따르면 1년 미만 기간 동안 매월 발생한 휴가(최대 11일)와
    // 1년 만근 시 발생하는 15일은 별개로 각각 보장받습니다.
    const years = Math.floor(monthsDiff / 12);
    let totalAnnualGrants = 0;

    for (let y = 1; y <= years; y++) {
      if (y === 1 || y === 2) {
        totalAnnualGrants += 15;
      } else {
        // 3년차부터는 2년마다 1일씩 가산 (최대 25일)
        const addedDays = Math.min(25, 15 + Math.floor((y - 1) / 2));
        totalAnnualGrants += addedDays;
      }
    }

    accruedDays = 11 + totalAnnualGrants;
    details = `입사 ${years}년 완료: 최초 1년 미만 ${11}일 + 연차 ${totalAnnualGrants}일 = 총 ${accruedDays}일 발생`;
  }

  const accruedHours = accruedDays * 8; // 1일 = 8시간 기준

  return { accruedDays, accruedHours, details };
}

/**
 * 포털 사용자의 휴가 현황 조회 (발생일수, 사용일수, 잔여일수)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{ hireDate: string, totalAccruedDays: number, totalUsedDays: number, availableDays: number, totalAccruedHours: number, totalUsedHours: number, availableHours: number, details: string }>}
 */
async function getUserLeaveStatus(userId) {
  validateUUID(userId);

  const [user] = await db
    .select({
      hireDate: portalUsers.hireDate,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, userId));

  if (!user) {
    throw new ServiceError("사용자를 찾을 수 없습니다", 404);
  }

  const allowance = calculateLeaveAllowance(user.hireDate);

  // 승인된(approved) 휴가 정보의 사용 시간 합계 조회
  const approvedLeaves = await db
    .select({
      leaveDuration: portalApprovals.leaveDuration,
    })
    .from(portalApprovals)
    .where(
      and(
        eq(portalApprovals.requesterId, userId),
        eq(portalApprovals.type, "leave"),
        eq(portalApprovals.status, "approved")
      )
    );

  const totalUsedHours = approvedLeaves.reduce((sum, item) => sum + (item.leaveDuration || 0), 0);
  const availableHours = allowance.accruedHours - totalUsedHours;

  const totalUsedDays = Number((totalUsedHours / 8).toFixed(2));
  const availableDays = Number((availableHours / 8).toFixed(2));

  const defaultApprovalLine = await buildApprovalLine(userId);

  return {
    hireDate: user.hireDate || null,
    totalAccruedDays: allowance.accruedDays,
    totalUsedDays,
    availableDays,
    totalAccruedHours: allowance.accruedHours,
    totalUsedHours,
    availableHours,
    details: allowance.details,
    defaultApprovalLine,
  };
}

/**
 * 부서장 및 상위 조직 계통에 따른 결재선 자동 구성
 * @param {string} requesterId - 기안자 ID
 * @returns {Promise<Array<{ userId: string, name: string, position: string, status: string, comment: string, updatedAt: string|null }>>}
 */
async function buildApprovalLine(requesterId) {
  validateUUID(requesterId);

  // 기안자 부서 정보 가져오기
  const [requester] = await db
    .select({
      departmentId: portalUsers.departmentId,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, requesterId));

  if (!requester || !requester.departmentId) {
    return []; // 소속 부서가 없으면 빈 결재선 리턴
  }

  const approvalLine = [];
  const visitedDeptIds = new Set();
  let currentDeptId = requester.departmentId;

  while (currentDeptId) {
    if (visitedDeptIds.has(currentDeptId)) {
      break; // 순환 참조 방지
    }
    visitedDeptIds.add(currentDeptId);

    const [dept] = await db
      .select({
        id: departments.id,
        name: departments.name,
        parentId: departments.parentId,
        managerUserId: departments.managerUserId,
      })
      .from(departments)
      .where(eq(departments.id, currentDeptId));

    if (!dept) break;

    // 부서장(managerUserId)이 존재하고 기안자 본인이 아닌 경우 결재선에 추가
    if (dept.managerUserId && dept.managerUserId !== requesterId) {
      const [manager] = await db
        .select({
          id: portalUsers.id,
          email: portalUsers.email,
          position: portalUsers.position,
          name: clients.name,
        })
        .from(portalUsers)
        .leftJoin(clients, eq(portalUsers.clientId, clients.id))
        .where(eq(portalUsers.id, dept.managerUserId));

      if (manager) {
        // 중복 방지
        const isDuplicate = approvalLine.some(item => item.userId === manager.id);
        if (!isDuplicate) {
          approvalLine.push({
            userId: manager.id,
            name: manager.name || manager.email,
            position: manager.position || "부서장",
            status: "pending",
            comment: "",
            updatedAt: null,
          });
        }
      }
    }

    // 상위 부서로 이동
    currentDeptId = dept.parentId;
  }

  return approvalLine;
}

/**
 * 전자결재 기안 등록
 * @param {string} requesterId - 기안자 ID
 * @param {object} data - 기안 정보
 * @returns {Promise<object>}
 */
async function submitApproval(requesterId, data) {
  validateUUID(requesterId);

  const {
    type, // 'leave' | 'expense' | 'reimbursement'
    title,
    leaveType, // 'annual' | 'half_am' | 'half_pm' | 'hourly'
    leaveStart,
    leaveEnd,
    leaveDuration,
    expenseAmount,
    expenseCategory,
    expenseReceiptUrl,
    expenseDate,
  } = data;

  if (!type || !title) {
    throw new ServiceError("기안 구분과 제목은 필수 항목입니다", 400);
  }

  // 휴가 기안 시 잔여 연차 차감 검증
  if (type === "leave") {
    if (!leaveType || !leaveStart || !leaveEnd || !leaveDuration) {
      throw new ServiceError("휴가 관련 정보가 누락되었습니다", 400);
    }
    const leaveStatus = await getUserLeaveStatus(requesterId);
    if (leaveStatus.availableHours < leaveDuration) {
      throw new ServiceError(`잔여 휴가 시간(${leaveStatus.availableHours}시간)이 신청 시간(${leaveDuration}시간)보다 부족합니다.`, 400);
    }
  }

  // 지출/경비 검증
  if ((type === "expense" || type === "reimbursement") && !expenseAmount) {
    throw new ServiceError("금액을 입력해주세요", 400);
  }

  // 결재선 자동 생성
  const approvalLine = await buildApprovalLine(requesterId);
  const isLineEmpty = approvalLine.length === 0;

  // 결재선이 비어있으면 즉시 승인(approved), 아니면 대기(pending) 상태로 생성
  const docStatus = isLineEmpty ? "approved" : "pending";
  const currentApproverId = isLineEmpty ? null : approvalLine[0].userId;

  const [created] = await db
    .insert(portalApprovals)
    .values({
      requesterId,
      type,
      title,
      status: docStatus,
      currentApproverId,
      approvalLine: JSON.stringify(approvalLine),
      leaveType: type === "leave" ? leaveType : null,
      leaveStart: type === "leave" ? leaveStart : null,
      leaveEnd: type === "leave" ? leaveEnd : null,
      leaveDuration: type === "leave" ? leaveDuration : null,
      expenseAmount: (type === "expense" || type === "reimbursement") ? expenseAmount : null,
      expenseCategory: (type === "expense" || type === "reimbursement") ? expenseCategory : null,
      expenseReceiptUrl: (type === "expense" || type === "reimbursement") ? expenseReceiptUrl : null,
      expenseDate: (type === "expense" || type === "reimbursement") ? expenseDate : null,
    })
    .returning();

  return created;
}

/**
 * 결재 승인
 * @param {string} approvalId - 결재 문서 ID
 * @param {string} approverId - 승인자 ID
 * @param {string} [comment] - 승인 의견
 * @returns {Promise<object>}
 */
async function approveApproval(approvalId, approverId, comment = "") {
  validateUUID(approvalId);
  validateUUID(approverId);

  const [doc] = await db
    .select()
    .from(portalApprovals)
    .where(eq(portalApprovals.id, approvalId));

  if (!doc) {
    throw new ServiceError("결재 문서를 찾을 수 없습니다", 404);
  }

  if (doc.status !== "pending") {
    throw new ServiceError("대기 중인 결재 문서가 아닙니다", 400);
  }

  if (doc.currentApproverId !== approverId) {
    throw new ServiceError("현재 결재 대상자가 아닙니다", 403);
  }

  const approvalLine = JSON.parse(doc.approvalLine);
  const currentIdx = approvalLine.findIndex(item => item.userId === approverId);

  if (currentIdx === -1) {
    throw new ServiceError("결재선에서 해당 사용자를 찾을 수 없습니다", 400);
  }

  // 결재선 업데이트
  approvalLine[currentIdx].status = "approved";
  approvalLine[currentIdx].comment = comment || "";
  approvalLine[currentIdx].updatedAt = nowTimestamp();

  let nextStatus = "pending";
  let nextApproverId = null;

  if (currentIdx === approvalLine.length - 1) {
    // 마지막 결재권자 승인완료 시 최종 승인 상태로 전환
    nextStatus = "approved";
  } else {
    // 다음 결재권자 지정
    nextApproverId = approvalLine[currentIdx + 1].userId;
  }

  const [updated] = await db
    .update(portalApprovals)
    .set({
      status: nextStatus,
      currentApproverId: nextApproverId,
      approvalLine: JSON.stringify(approvalLine),
      updatedAt: nowTimestamp(),
    })
    .where(eq(portalApprovals.id, approvalId))
    .returning();

  return updated;
}

/**
 * 결재 반려
 * @param {string} approvalId - 결재 문서 ID
 * @param {string} approverId - 반려자 ID
 * @param {string} [comment] - 반려 의견
 * @returns {Promise<object>}
 */
async function rejectApproval(approvalId, approverId, comment = "") {
  validateUUID(approvalId);
  validateUUID(approverId);

  const [doc] = await db
    .select()
    .from(portalApprovals)
    .where(eq(portalApprovals.id, approvalId));

  if (!doc) {
    throw new ServiceError("결재 문서를 찾을 수 없습니다", 404);
  }

  if (doc.status !== "pending") {
    throw new ServiceError("대기 중인 결재 문서가 아닙니다", 400);
  }

  if (doc.currentApproverId !== approverId) {
    throw new ServiceError("현재 결재 대상자가 아닙니다", 403);
  }

  const approvalLine = JSON.parse(doc.approvalLine);
  const currentIdx = approvalLine.findIndex(item => item.userId === approverId);

  if (currentIdx === -1) {
    throw new ServiceError("결재선에서 해당 사용자를 찾을 수 없습니다", 400);
  }

  // 결재선 업데이트
  approvalLine[currentIdx].status = "rejected";
  approvalLine[currentIdx].comment = comment || "";
  approvalLine[currentIdx].updatedAt = nowTimestamp();

  const [updated] = await db
    .update(portalApprovals)
    .set({
      status: "rejected",
      currentApproverId: null,
      approvalLine: JSON.stringify(approvalLine),
      updatedAt: nowTimestamp(),
    })
    .where(eq(portalApprovals.id, approvalId))
    .returning();

  return updated;
}

module.exports = {
  calculateLeaveAllowance,
  getUserLeaveStatus,
  buildApprovalLine,
  submitApproval,
  approveApproval,
  rejectApproval,
};
