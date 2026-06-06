const { db } = require("../db");
const { portalUsers, clients, departments, portalApprovals, siteSettings } = require("../db/schema");
const { eq, and, desc } = require("drizzle-orm");
const { ServiceError, validateUUID, nowTimestamp } = require("./helpers");

/**
 * 날짜 문자열(YYYY-MM-DD 또는 YYYY-MM-DD HH:MM)을 로컬 시간대 기준으로 파싱
 */
function parseDate(str) {
  if (!str) return new Date();
  if (str instanceof Date) return str;
  const [datePart, timePart] = str.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  let hour = 0;
  let minute = 0;
  if (timePart) {
    const [h, m] = timePart.split(":").map(Number);
    hour = h;
    minute = m;
  }
  return new Date(year, month - 1, day, hour, minute);
}

/**
 * 로컬 시간대 기준 월 가산
 */
function addMonths(date, months) {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  if (d.getMonth() !== (targetMonth % 12 + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

/**
 * 로컬 시간대 기준 년 가산
 */
function addYears(date, years) {
  const d = new Date(date);
  const originalMonth = d.getMonth();
  d.setFullYear(d.getFullYear() + years);
  if (d.getMonth() !== originalMonth) {
    d.setDate(0);
  }
  return d;
}

/**
 * 입사일 기준으로 특정 대상일자까지 발생한 모든 월차/연차 항목(그랜트) 생성
 */
function generateLeaveGrants(hireDateStr, targetDate) {
  const hire = parseDate(hireDateStr);
  if (isNaN(hire.getTime())) return [];

  const grants = [];

  // 1. 근속 1년 미만 월차 (1개월 개근 시 1일, 최대 11일)
  for (let m = 1; m <= 11; m++) {
    const validFrom = addMonths(hire, m);
    if (validFrom > targetDate) break;

    const validTo = addYears(validFrom, 1);
    grants.push({
      type: "monthly",
      amountHours: 8,
      remainingHours: 8,
      validFrom,
      validTo,
      description: `입사 ${m}개월 완료 월차`,
    });
  }

  // 2. 근속 1년 완료 이후 연차 (매년 주기, 가산 적용)
  let y = 1;
  while (true) {
    const validFrom = addYears(hire, y);
    if (validFrom > targetDate) break;

    const validTo = addYears(validFrom, 1);
    const days = Math.min(25, 15 + Math.floor(y / 2));
    grants.push({
      type: "annual",
      amountHours: days * 8,
      remainingHours: days * 8,
      validFrom,
      validTo,
      description: `입사 ${y}년 완료 연차`,
    });
    y++;
  }

  // 선입선출(FIFO)을 위해 발생일 오름차순 정렬
  grants.sort((a, b) => a.validFrom - b.validFrom);
  return grants;
}

/**
 * 근로기준법에 따른 연차 휴가 일수(시간) 계산 (호환성 유지용)
 * @param {string} hireDateStr - 입사일 (YYYY-MM-DD)
 * @param {string} [targetDateStr] - 기준일 (기본값: 오늘)
 * @returns {{ accruedDays: number, accruedHours: number, details: string }}
 */
function calculateLeaveAllowance(hireDateStr, targetDateStr = null) {
  if (!hireDateStr) {
    return { accruedDays: 0, accruedHours: 0, details: "입사일 미지정" };
  }
  const hire = parseDate(hireDateStr);
  if (isNaN(hire.getTime())) {
    return { accruedDays: 0, accruedHours: 0, details: "올바르지 않은 입사일 형식" };
  }
  const target = targetDateStr ? parseDate(targetDateStr) : new Date();
  const grants = generateLeaveGrants(hireDateStr, target);
  const accruedHours = grants.reduce((sum, g) => sum + g.amountHours, 0);
  const accruedDays = Number((accruedHours / 8).toFixed(2));

  const monthlyCount = grants.filter((g) => g.type === "monthly").length;
  const annualCount = grants.filter((g) => g.type === "annual").length;
  const annualDaysSum = grants.filter((g) => g.type === "annual").reduce((sum, g) => sum + g.amountHours, 0) / 8;

  let details = `[근속 연가 총발생] `;
  if (monthlyCount > 0) {
    details += `1년 미만 월차 ${monthlyCount}일. `;
  }
  if (annualCount > 0) {
    details += `연차 가산 총 ${annualDaysSum}일 (${annualCount}회 부여). `;
  }
  if (grants.length === 0) {
    details += `발생 연차 없음.`;
  }

  return { accruedDays, accruedHours, details };
}


/**
 * 포털 사용자의 휴가 현황 조회 (발생일수, 사용일수, 잔여일수)
 * @param {string} userId - 사용자 ID
 * @param {string} [targetDateStr] - 기준일 (기본값: 오늘)
 * @returns {Promise<{ hireDate: string, totalAccruedDays: number, totalUsedDays: number, availableDays: number, totalAccruedHours: number, totalUsedHours: number, availableHours: number, details: string }>}
 */
async function getUserLeaveStatus(userId, targetDateStr = null) {
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

  const hireDateStr = user.hireDate;
  if (!hireDateStr) {
    return {
      hireDate: null,
      totalAccruedDays: 0,
      totalUsedDays: 0,
      availableDays: 0,
      totalAccruedHours: 0,
      totalUsedHours: 0,
      availableHours: 0,
      details: "입사일 미지정",
      defaultApprovalLine: await buildApprovalLine(userId),
    };
  }

  const targetDate = targetDateStr ? parseDate(targetDateStr) : new Date();

  // 1. 발생된 모든 휴가 항목 생성
  const grants = generateLeaveGrants(hireDateStr, targetDate);

  // 2. 승인된(approved) 휴가 정보 조회
  const approvedLeaves = await db
    .select({
      id: portalApprovals.id,
      leaveDuration: portalApprovals.leaveDuration,
      leaveStart: portalApprovals.leaveStart,
    })
    .from(portalApprovals)
    .where(
      and(
        eq(portalApprovals.requesterId, userId),
        eq(portalApprovals.type, "leave"),
        eq(portalApprovals.status, "approved")
      )
    );

  // 승인된 휴가를 시간 순서(오름차순)로 정렬
  approvedLeaves.sort((a, b) => {
    const da = parseDate(a.leaveStart);
    const db = parseDate(b.leaveStart);
    return da - db;
  });

  // 3. FIFO 방식으로 승인된 사용 시간 차감
  for (const leave of approvedLeaves) {
    let durationToDeduct = leave.leaveDuration || 0;
    const leaveStart = parseDate(leave.leaveStart);

    // 1차 시도: 해당 휴가가 개시된 날짜 기준으로 활성 및 만료 전 상태인 항목에서 차감
    for (const grant of grants) {
      if (grant.validFrom <= leaveStart && leaveStart < grant.validTo) {
        if (grant.remainingHours > 0) {
          const deduct = Math.min(durationToDeduct, grant.remainingHours);
          grant.remainingHours -= deduct;
          durationToDeduct -= deduct;
          if (durationToDeduct <= 0) break;
        }
      }
    }

    // 2차 시도 (대비책): 혹시 발생일 경계 등 시차/오차로 인해 남아있다면, 남아있는 가장 오래된 항목에서 무조건 차감
    if (durationToDeduct > 0) {
      for (const grant of grants) {
        if (grant.remainingHours > 0) {
          const deduct = Math.min(durationToDeduct, grant.remainingHours);
          grant.remainingHours -= deduct;
          durationToDeduct -= deduct;
          if (durationToDeduct <= 0) break;
        }
      }
    }
  }

  // 4. 최종 결과 집계
  const totalAccruedHours = grants.reduce((sum, g) => sum + g.amountHours, 0);
  const totalAccruedDays = Number((totalAccruedHours / 8).toFixed(2));

  const totalUsedHours = approvedLeaves.reduce((sum, item) => sum + (item.leaveDuration || 0), 0);
  const totalUsedDays = Number((totalUsedHours / 8).toFixed(2));

  // 현재 날짜(targetDate) 기준으로 유효한(validFrom <= targetDate < validTo) 잔여 휴가 계산
  const availableHours = grants
    .filter((g) => g.validFrom <= targetDate && targetDate < g.validTo)
    .reduce((sum, g) => sum + g.remainingHours, 0);
  const availableDays = Number((availableHours / 8).toFixed(2));

  // 만료되어 소멸된 휴가 계산
  const expiredHours = grants
    .filter((g) => targetDate >= g.validTo)
    .reduce((sum, g) => sum + g.remainingHours, 0);
  const expiredDays = Number((expiredHours / 8).toFixed(2));

  const monthlyCount = grants.filter((g) => g.type === "monthly").length;
  const annualCount = grants.filter((g) => g.type === "annual").length;
  const annualDaysSum = grants.filter((g) => g.type === "annual").reduce((sum, g) => sum + g.amountHours, 0) / 8;

  let details = `총 발생: ${totalAccruedDays}일`;
  if (monthlyCount > 0 || annualCount > 0) {
    details += ` (1년 미만 월차 ${monthlyCount}일`;
    if (annualCount > 0) {
      details += `, 1년 이상 연차 ${annualDaysSum}일`;
    }
    details += `)`;
  }
  if (expiredHours > 0) {
    details += ` | 기간만료 소멸: ${expiredDays}일`;
  }

  const defaultApprovalLine = await buildApprovalLine(userId);

  return {
    hireDate: hireDateStr,
    totalAccruedDays,
    totalUsedDays,
    availableDays,
    totalAccruedHours,
    totalUsedHours,
    availableHours,
    details,
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

  // Load approval settings
  const [setting] = await db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.page, "portal"), eq(siteSettings.section, "approvals")));

  let settings = {
    approvalLineType: "dept",
    fixedLine: [],
  };
  if (setting && setting.content) {
    try {
      settings = { ...settings, ...JSON.parse(setting.content) };
    } catch (e) {}
  }

  if (settings.approvalLineType === "fixed" && Array.isArray(settings.fixedLine) && settings.fixedLine.length > 0) {
    const approvalLine = [];
    for (const approverId of settings.fixedLine) {
      if (approverId === requesterId) continue; // skip requester themselves

      const [manager] = await db
        .select({
          id: portalUsers.id,
          email: portalUsers.email,
          position: portalUsers.position,
          name: clients.name,
        })
        .from(portalUsers)
        .leftJoin(clients, eq(portalUsers.clientId, clients.id))
        .where(eq(portalUsers.id, approverId));

      if (manager) {
        approvalLine.push({
          userId: manager.id,
          name: manager.name || manager.email,
          position: manager.position || "결재자",
          status: "pending",
          comment: "",
          updatedAt: null,
        });
      }
    }
    return approvalLine;
  }

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

  // Load approval settings
  const [setting] = await db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.page, "portal"), eq(siteSettings.section, "approvals")));

  let settings = {
    leaveEnabled: true,
    leaveMinUnit: "hourly",
    expenseEnabled: true,
    expenseLimit: 5000000,
    reimbursementEnabled: true,
  };
  if (setting && setting.content) {
    try {
      settings = { ...settings, ...JSON.parse(setting.content) };
    } catch (e) {}
  }

  // 휴가 기안 시 잔여 연차 차감 검증
  if (type === "leave") {
    if (!settings.leaveEnabled) {
      throw new ServiceError("휴가 기안 기능이 비활성화되어 있습니다", 400);
    }
    if (!leaveType || !leaveStart || !leaveEnd || !leaveDuration) {
      throw new ServiceError("휴가 관련 정보가 누락되었습니다", 400);
    }

    // 최소 기안 단위 검증
    if (settings.leaveMinUnit === "half" && leaveDuration % 4 !== 0) {
      throw new ServiceError("휴가는 반차(4시간) 단위로만 신청할 수 있습니다.", 400);
    } else if (settings.leaveMinUnit === "daily" && leaveDuration % 8 !== 0) {
      throw new ServiceError("휴가는 일차(8시간) 단위로만 신청할 수 있습니다.", 400);
    }

    const leaveStatus = await getUserLeaveStatus(requesterId);
    if (leaveStatus.availableHours < leaveDuration) {
      throw new ServiceError(`잔여 휴가 시간(${leaveStatus.availableHours}시간)이 신청 시간(${leaveDuration}시간)보다 부족합니다.`, 400);
    }
  }

  // 지출 검증
  if (type === "expense") {
    if (!settings.expenseEnabled) {
      throw new ServiceError("지출 기안 기능이 비활성화되어 있습니다", 400);
    }
    if (!expenseAmount) {
      throw new ServiceError("금액을 입력해주세요", 400);
    }
    if (settings.expenseLimit && expenseAmount > settings.expenseLimit) {
      throw new ServiceError(`지출 신청 금액(${expenseAmount.toLocaleString()}원)이 1회 한도액(${settings.expenseLimit.toLocaleString()}원)을 초과했습니다.`, 400);
    }
  }

  // 경비 검증
  if (type === "reimbursement") {
    if (!settings.reimbursementEnabled) {
      throw new ServiceError("경비 청구 기능이 비활성화되어 있습니다", 400);
    }
    if (!expenseAmount) {
      throw new ServiceError("금액을 입력해주세요", 400);
    }
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
