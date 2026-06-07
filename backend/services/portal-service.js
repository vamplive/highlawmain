/**
 * 포털 서비스 레이어 — 포털 계정(직원/의뢰인) 비즈니스 로직
 * - 회원가입(승인 대기)/로그인, 관리자 승인/거절
 * - 사건 조회/등록, 메시지 전송, 구글 캘린더 연동
 * - 타임트래킹 (사건별 시간 기록)
 */
const { db } = require("../db");
const crypto = require("crypto");
const {
  portalUsers,
  caseFilesTable,
  caseDocuments,
  caseMessages,
  clients,
  lawyers,
  portalTimeEntries,
  portalPosts,
  portalBoardCategories,
  portalEvents,
  portalMemberGroups,
  adminUsers,
  courtDates,
} = require("../db/schema");
const { eq, desc, and, sql, gte, lte, between, asc, like, or, inArray } = require("drizzle-orm");
const { hashPassword, verifyPassword, dummyVerifyPassword } = require("../lib/auth");
const { createPortalSession, deletePortalSession } = require("../lib/auth");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  cleanPhone,
  KOREAN_PHONE_REGEX,
} = require("./helpers");

/** 이메일 형식 검증 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const { requestOtp, verifyOtp } = require("../lib/sms-otp");
const SMS_OTP_CONFIGURED = Boolean(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER);

// =============================================
// 회원가입 / 로그인 / 로그아웃
// =============================================

/**
 * 포털 회원가입 (가입 후 관리자 승인 대기 상태)
 * isActive=0: 승인 대기, 1: 승인, -1: 거절
 */
async function registerUser(data) {
  const { email, password, name, phone, hireDate } = data;

  if (!email || !EMAIL_REGEX.test((email || "").trim())) {
    throw new ServiceError("올바른 이메일 주소를 입력해주세요", 400);
  }
  if (!password || password.length < 8) {
    throw new ServiceError("비밀번호는 8자 이상이어야 합니다", 400);
  }
  if (!name || !name.trim()) {
    throw new ServiceError("이름을 입력해주세요", 400);
  }
  if (!phone || !KOREAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
    throw new ServiceError("올바른 연락처를 입력해주세요", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [existingUser] = await db
    .select()
    .from(portalUsers)
    .where(eq(portalUsers.email, normalizedEmail));

  if (existingUser) {
    throw new ServiceError("이미 가입된 이메일입니다", 409);
  }

  const normalizedPhone = cleanPhone(phone);
  const [matchedClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.phone, normalizedPhone));

  const passwordHash = hashPassword(password);

  // isActive=0: 관리자 승인 대기
  const [created] = await db.insert(portalUsers).values({
    email: normalizedEmail,
    passwordHash,
    clientId: matchedClient ? matchedClient.id : null,
    isActive: 0,
    hireDate: hireDate || null,
  }).returning();

  if (!matchedClient) {
    const [newClient] = await db.insert(clients).values({
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      source: "manual",
    }).returning();

    await db
      .update(portalUsers)
      .set({ clientId: newClient.id })
      .where(eq(portalUsers.id, created.id));

    created.clientId = newClient.id;
  }

  return { id: created.id, email: created.email, clientId: created.clientId, status: "pending" };
}

/**
 * 포털 로그인 — isActive 상태에 따라 오류 메시지 분기
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new ServiceError("이메일/휴대폰 번호와 비밀번호를 입력해주세요", 400);
  }

  const input = email.trim();
  let user = null;

  // 1. 이메일 형식인 경우 이메일로 먼저 조회
  if (input.includes("@")) {
    const normalizedEmail = input.toLowerCase();
    const [found] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.email, normalizedEmail));
    user = found;
  } else {
    // 2. 이메일 형식이 아니면 휴대폰 번호로 클라이언트 조회 후 포털 계정 연결
    const normalizedPhone = input.replace(/[\s-]/g, ""); // 공백 및 대시 제거
    const [matchedClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.phone, normalizedPhone));

    if (matchedClient) {
      const [found] = await db
        .select()
        .from(portalUsers)
        .where(eq(portalUsers.clientId, matchedClient.id));
      user = found;
    }
  }

  // 3. 휴대폰 번호로 매칭되지 않았고, @가 없었더라도 이메일 계정일 가능성이 있으므로 최종 이메일로 한 번 더 조회
  if (!user) {
    const normalizedEmail = input.toLowerCase();
    const [found] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.email, normalizedEmail));
    user = found;
  }

  if (!user) {
    dummyVerifyPassword();
    throw new ServiceError("이메일/휴대폰 번호 또는 비밀번호가 올바르지 않습니다", 401);
  }

  // 승인 상태별 오류 분기
  if (user.isActive === 0) {
    throw new ServiceError("회원가입 승인 대기 중입니다. 관리자 승인 후 로그인하세요.", 403);
  }
  if (user.isActive === -1) {
    throw new ServiceError("가입 신청이 거절되었습니다. 관리자에게 문의하세요.", 403);
  }
  if (user.isActive !== 1) {
    throw new ServiceError("비활성화된 계정입니다", 403);
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new ServiceError("이메일/휴대폰 번호 또는 비밀번호가 올바르지 않습니다", 401);
  }

  const token = createPortalSession(user.id, user.email, user.clientId);

  return {
    token,
    user: { id: user.id, email: user.email, clientId: user.clientId },
  };
}

function logoutUser(token) {
  if (token) {
    deletePortalSession(token);
  }
}

/**
 * 현재 사용자 프로필 조회 (user + client 정보 + 구글 캘린더 연동 여부)
 */
async function getUserProfile(userId, clientId) {
  const [user] = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      clientId: portalUsers.clientId,
      role: portalUsers.role,
      departmentId: portalUsers.departmentId,
      position: portalUsers.position,
      googleConnected: sql`CASE WHEN ${portalUsers.googleRefreshToken} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, userId));

  let clientInfo = null;
  if (clientId) {
    const [client] = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        smsConsent: clients.smsConsent,
        emailConsent: clients.emailConsent,
      })
      .from(clients)
      .where(eq(clients.id, clientId));
    clientInfo = client || null;
  }

  return { user, client: clientInfo };
}

// =============================================
// 관리자: 포털 사용자 관리 (승인/거절)
// =============================================

/**
 * 관리자: 포털 사용자 목록 조회 (상태별 필터 + 페이지네이션)
 * @param {{ status?: string, page?: string, limit?: string }} query
 */
async function listPortalUsers(query) {
  const { page, limit, offset } = parsePagination(query);
  const status = query.status; // "pending" | "active" | "rejected" | 미지정=전체

  // 상태 필터 조건
  let statusFilter = sql`1=1`;
  if (status === "pending") statusFilter = eq(portalUsers.isActive, 0);
  else if (status === "active") statusFilter = eq(portalUsers.isActive, 1);
  else if (status === "rejected") statusFilter = eq(portalUsers.isActive, -1);

  const rows = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      isActive: portalUsers.isActive,
      createdAt: portalUsers.createdAt,
      clientId: portalUsers.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      role: portalUsers.role,
    })
    .from(portalUsers)
    .leftJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(statusFilter)
    .orderBy(desc(portalUsers.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(portalUsers)
    .where(statusFilter);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * 관리자: 포털 사용자 단건 조회
 */
async function getPortalUser(id) {
  validateUUID(id);
  const [row] = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      isActive: portalUsers.isActive,
      createdAt: portalUsers.createdAt,
      clientId: portalUsers.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      role: portalUsers.role,
    })
    .from(portalUsers)
    .leftJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(eq(portalUsers.id, id));

  if (!row) throw new ServiceError("사용자를 찾을 수 없습니다", 404);
  return row;
}

/**
 * 관리자: 포털 사용자 승인 (isActive=1)
 */
async function approvePortalUser(id) {
  validateUUID(id);
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
  if (!existing) throw new ServiceError("사용자를 찾을 수 없습니다", 404);

  const [updated] = await db
    .update(portalUsers)
    .set({ isActive: 1, updatedAt: sql`(datetime('now'))` })
    .where(eq(portalUsers.id, id))
    .returning();

  return { id: updated.id, email: updated.email, isActive: updated.isActive };
}

/**
 * 관리자: 포털 사용자 거절 (isActive=-1)
 */
async function rejectPortalUser(id) {
  validateUUID(id);
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
  if (!existing) throw new ServiceError("사용자를 찾을 수 없습니다", 404);

  const [updated] = await db
    .update(portalUsers)
    .set({ isActive: -1, updatedAt: sql`(datetime('now'))` })
    .where(eq(portalUsers.id, id))
    .returning();

  return { id: updated.id, email: updated.email, isActive: updated.isActive };
}

/**
 * 관리자: 포털 사용자 삭제
 */
async function deletePortalUser(id) {
  validateUUID(id);
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
  if (!existing) throw new ServiceError("사용자를 찾을 수 없습니다", 404);
  await db.delete(portalUsers).where(eq(portalUsers.id, id));
  return { deleted: true };
}

/**
 * 관리자: 포털 사용자 정보 및 역할 업데이트
 */
async function updatePortalUser(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
  if (!existing) throw new ServiceError("사용자를 찾을 수 없습니다", 404);

  const updates = { updatedAt: sql`(datetime('now'))` };
  if ("role" in data) {
    updates.role = data.role || null;
  }

  const [updated] = await db
    .update(portalUsers)
    .set(updates)
    .where(eq(portalUsers.id, id))
    .returning();

  return updated;
}

// =============================================
// 사건 조회 / 등록
// =============================================

/**
 * 의뢰인의 사건 목록 조회
 */
async function getUserCases(clientId) {
  if (!clientId) return [];

  return db
    .select({
      id: caseFilesTable.id,
      title: caseFilesTable.title,
      status: caseFilesTable.status,
      lawyerId: caseFilesTable.lawyerId,
      description: caseFilesTable.description,
      caseNumber: caseFilesTable.caseNumber,
      court: caseFilesTable.court,
      caseType: caseFilesTable.caseType,
      plaintiff: caseFilesTable.plaintiff,
      defendant: caseFilesTable.defendant,
      filedAt: caseFilesTable.filedAt,
      createdAt: caseFilesTable.createdAt,
      updatedAt: caseFilesTable.updatedAt,
      lawyerName: lawyers.name,
    })
    .from(caseFilesTable)
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .where(eq(caseFilesTable.clientId, clientId))
    .orderBy(desc(caseFilesTable.createdAt));
}

/**
 * 포털 사용자가 직접 사건 등록
 * - clientId로 본인 고객 레코드와 연결
 * - 사건번호 입력 시 대법원 API 조회 결과를 함께 저장
 */
async function registerPortalCase(clientId, data) {
  if (!clientId) throw new ServiceError("계정에 연결된 의뢰인 정보가 없습니다", 400);

  const { title, caseNumber, court, caseType, plaintiff, defendant, filedAt, description } = data;
  if (!title || !title.trim()) throw new ServiceError("사건명을 입력해주세요", 400);

  const [inserted] = await db.insert(caseFilesTable).values({
    clientId,
    title: title.trim(),
    caseNumber: caseNumber || null,
    court: court || null,
    caseType: caseType || null,
    plaintiff: plaintiff || null,
    defendant: defendant || null,
    filedAt: filedAt || null,
    description: description || null,
    status: "접수",
  }).returning();

  return inserted;
}

/**
 * 사건 상세 조회 (소유권 검증)
 */
async function getCaseDetail(caseId, clientId) {
  validateUUID(caseId);

  const [caseFile] = await db
    .select({
      id: caseFilesTable.id,
      clientId: caseFilesTable.clientId,
      title: caseFilesTable.title,
      status: caseFilesTable.status,
      lawyerId: caseFilesTable.lawyerId,
      description: caseFilesTable.description,
      caseNumber: caseFilesTable.caseNumber,
      court: caseFilesTable.court,
      caseType: caseFilesTable.caseType,
      plaintiff: caseFilesTable.plaintiff,
      defendant: caseFilesTable.defendant,
      filedAt: caseFilesTable.filedAt,
      createdAt: caseFilesTable.createdAt,
      updatedAt: caseFilesTable.updatedAt,
      lawyerName: lawyers.name,
    })
    .from(caseFilesTable)
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .where(and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  const documents = await db
    .select()
    .from(caseDocuments)
    .where(and(eq(caseDocuments.caseFileId, caseId), eq(caseDocuments.isVisibleToClient, 1)))
    .orderBy(desc(caseDocuments.submissionDate), desc(caseDocuments.createdAt));

  const messages = await db
    .select()
    .from(caseMessages)
    .where(eq(caseMessages.caseFileId, caseId))
    .orderBy(desc(caseMessages.createdAt))
    .limit(10);

  return { ...caseFile, documents, messages: messages.reverse() };
}

/**
 * 사건 메시지 목록 (페이지네이션, 소유권 검증)
 */
async function getCaseMessages(caseId, clientId, pagination) {
  validateUUID(caseId);

  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  const { page, limit, offset } = parsePagination(pagination);

  const rows = await db
    .select()
    .from(caseMessages)
    .where(eq(caseMessages.caseFileId, caseId))
    .orderBy(desc(caseMessages.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(caseMessages)
    .where(eq(caseMessages.caseFileId, caseId));

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * 의뢰인 메시지 전송
 */
async function sendClientMessage(caseId, clientId, userId, content) {
  validateUUID(caseId);

  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) throw new ServiceError("사건을 찾을 수 없습니다", 404);
  if (!content || !content.trim()) throw new ServiceError("메시지 내용을 입력해주세요", 400);

  const [inserted] = await db.insert(caseMessages).values({
    caseFileId: caseId,
    senderId: userId,
    senderType: "client",
    content: content.trim(),
  }).returning();

  return inserted;
}

// =============================================
// 관리자: 사건 관리
// =============================================

async function listAdminCases(pagination) {
  const { page, limit, offset } = parsePagination(pagination);

  const rows = await db
    .select({
      id: caseFilesTable.id,
      clientId: caseFilesTable.clientId,
      title: caseFilesTable.title,
      status: caseFilesTable.status,
      lawyerId: caseFilesTable.lawyerId,
      description: caseFilesTable.description,
      caseNumber: caseFilesTable.caseNumber,
      court: caseFilesTable.court,
      caseType: caseFilesTable.caseType,
      plaintiff: caseFilesTable.plaintiff,
      defendant: caseFilesTable.defendant,
      filedAt: caseFilesTable.filedAt,
      createdAt: caseFilesTable.createdAt,
      updatedAt: caseFilesTable.updatedAt,
      clientName: clients.name,
      lawyerName: lawyers.name,
    })
    .from(caseFilesTable)
    .leftJoin(clients, eq(caseFilesTable.clientId, clients.id))
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .orderBy(desc(caseFilesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: sql`count(*)` }).from(caseFilesTable);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

async function getAdminCase(id) {
  validateUUID(id);
  const [row] = await db
    .select({
      id: caseFilesTable.id,
      clientId: caseFilesTable.clientId,
      title: caseFilesTable.title,
      status: caseFilesTable.status,
      lawyerId: caseFilesTable.lawyerId,
      description: caseFilesTable.description,
      caseNumber: caseFilesTable.caseNumber,
      court: caseFilesTable.court,
      caseType: caseFilesTable.caseType,
      plaintiff: caseFilesTable.plaintiff,
      defendant: caseFilesTable.defendant,
      filedAt: caseFilesTable.filedAt,
      createdAt: caseFilesTable.createdAt,
      updatedAt: caseFilesTable.updatedAt,
      clientName: clients.name,
      lawyerName: lawyers.name,
    })
    .from(caseFilesTable)
    .leftJoin(clients, eq(caseFilesTable.clientId, clients.id))
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .where(eq(caseFilesTable.id, id));

  if (!row) throw new ServiceError("사건을 찾을 수 없습니다", 404);
  return row;
}

async function listAdminCaseMessages(caseId, pagination) {
  validateUUID(caseId);
  const { page, limit, offset } = parsePagination(pagination);

  const rows = await db
    .select()
    .from(caseMessages)
    .where(eq(caseMessages.caseFileId, caseId))
    .orderBy(desc(caseMessages.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(caseMessages)
    .where(eq(caseMessages.caseFileId, caseId));

  return { data: rows.reverse(), meta: buildPaginationMeta(total, page, limit) };
}

async function deleteAdminCase(id) {
  validateUUID(id);
  const [existing] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
  if (!existing) throw new ServiceError("사건을 찾을 수 없습니다", 404);
  await db.delete(caseFilesTable).where(eq(caseFilesTable.id, id));
  return { deleted: true };
}

const CASE_META_FIELDS = [
  "status", "description", "title", "lawyerId",
  "caseNumber", "court", "caseType", "plaintiff", "defendant", "filedAt",
];

async function createAdminCase(data) {
  const { clientId, title } = data;
  validateUUID(clientId);
  if (!title || !title.trim()) throw new ServiceError("사건 제목을 입력해주세요", 400);

  const [inserted] = await db.insert(caseFilesTable).values({
    clientId,
    title: title.trim(),
    lawyerId: data.lawyerId || null,
    description: data.description || null,
    caseNumber: data.caseNumber || null,
    court: data.court || null,
    caseType: data.caseType || null,
    plaintiff: data.plaintiff || null,
    defendant: data.defendant || null,
    filedAt: data.filedAt || null,
  }).returning();

  return inserted;
}

async function updateAdminCase(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
  if (!existing) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  const updateData = { updatedAt: sql`(datetime('now'))` };
  for (const key of CASE_META_FIELDS) {
    if (data[key] === undefined) continue;
    updateData[key] = key === "title" ? (data.title || "").trim() : data[key];
  }

  const [updated] = await db
    .update(caseFilesTable)
    .set(updateData)
    .where(eq(caseFilesTable.id, id))
    .returning();

  return updated;
}

async function sendLawyerMessage(caseId, content) {
  validateUUID(caseId);
  const [caseFile] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, caseId));
  if (!caseFile) throw new ServiceError("사건을 찾을 수 없습니다", 404);
  if (!content || !content.trim()) throw new ServiceError("메시지 내용을 입력해주세요", 400);

  const [inserted] = await db.insert(caseMessages).values({
    caseFileId: caseId,
    senderType: "lawyer",
    content: content.trim(),
  }).returning();

  return inserted;
}

// =============================================
// 타임트래킹 (포털 사용자 사건별 시간 기록)
// =============================================

/**
 * 포털 사용자의 타임엔트리 목록
 * @param {string} portalUserId
 * @param {{ caseId?: string, from?: string, to?: string, page?: string, limit?: string }} query
 */
async function listPortalTimeEntries(portalUserId, query) {
  const { page, limit, offset } = parsePagination(query);

  let condition = eq(portalTimeEntries.portalUserId, portalUserId);
  if (query.caseId) {
    condition = and(condition, eq(portalTimeEntries.caseId, query.caseId));
  }
  if (query.from) {
    condition = and(condition, gte(portalTimeEntries.startedAt, query.from));
  }
  if (query.to) {
    condition = and(condition, lte(portalTimeEntries.startedAt, query.to + "T23:59:59"));
  }

  const rows = await db
    .select({
      id: portalTimeEntries.id,
      caseId: portalTimeEntries.caseId,
      description: portalTimeEntries.description,
      startedAt: portalTimeEntries.startedAt,
      endedAt: portalTimeEntries.endedAt,
      durationMinutes: portalTimeEntries.durationMinutes,
      note: portalTimeEntries.note,
      createdAt: portalTimeEntries.createdAt,
      caseTitle: caseFilesTable.title,
      caseNumber: caseFilesTable.caseNumber,
    })
    .from(portalTimeEntries)
    .leftJoin(caseFilesTable, eq(portalTimeEntries.caseId, caseFilesTable.id))
    .where(condition)
    .orderBy(desc(portalTimeEntries.startedAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(portalTimeEntries)
    .where(condition);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * 사건별 시간 합계 (포털 사용자)
 */
async function getPortalTimeSummary(portalUserId) {
  const rows = await db
    .select({
      caseId: portalTimeEntries.caseId,
      caseTitle: caseFilesTable.title,
      caseNumber: caseFilesTable.caseNumber,
      totalMinutes: sql`COALESCE(SUM(${portalTimeEntries.durationMinutes}), 0)`,
      entryCount: sql`COUNT(*)`,
    })
    .from(portalTimeEntries)
    .leftJoin(caseFilesTable, eq(portalTimeEntries.caseId, caseFilesTable.id))
    .where(
      and(
        eq(portalTimeEntries.portalUserId, portalUserId),
        sql`${portalTimeEntries.endedAt} IS NOT NULL`
      )
    )
    .groupBy(portalTimeEntries.caseId, caseFilesTable.title, caseFilesTable.caseNumber)
    .orderBy(desc(sql`totalMinutes`));

  return rows;
}

/**
 * 진행 중인 타이머 조회 (ended_at IS NULL)
 */
async function getActivePortalTimer(portalUserId) {
  const [row] = await db
    .select({
      id: portalTimeEntries.id,
      caseId: portalTimeEntries.caseId,
      description: portalTimeEntries.description,
      startedAt: portalTimeEntries.startedAt,
      caseTitle: caseFilesTable.title,
    })
    .from(portalTimeEntries)
    .leftJoin(caseFilesTable, eq(portalTimeEntries.caseId, caseFilesTable.id))
    .where(
      and(
        eq(portalTimeEntries.portalUserId, portalUserId),
        sql`${portalTimeEntries.endedAt} IS NULL`
      )
    )
    .limit(1);

  return row || null;
}

/**
 * 타임엔트리 수동 생성
 */
async function createPortalTimeEntry(portalUserId, data) {
  const { caseId, description, startedAt, endedAt, durationMinutes, note } = data;
  if (!description || !description.trim()) throw new ServiceError("설명을 입력해주세요", 400);
  if (!startedAt) throw new ServiceError("시작 시간을 입력해주세요", 400);

  let duration = durationMinutes;
  if (!duration && startedAt && endedAt) {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    duration = Math.round((end - start) / 60000);
  }

  const [inserted] = await db.insert(portalTimeEntries).values({
    portalUserId,
    caseId: caseId || null,
    description: description.trim(),
    startedAt,
    endedAt: endedAt || null,
    durationMinutes: duration || null,
    note: note || null,
  }).returning();

  return inserted;
}

/**
 * 타이머 시작 (ended_at=NULL인 진행 중 항목 생성)
 */
async function startPortalTimer(portalUserId, data) {
  // 이미 진행 중인 타이머가 있으면 자동으로 종료
  const activeTimer = await getActivePortalTimer(portalUserId);
  if (activeTimer) {
    await stopPortalTimer(portalUserId);
  }

  const { caseId, description, note } = data;
  if (!description || !description.trim()) throw new ServiceError("설명을 입력해주세요", 400);

  const [inserted] = await db.insert(portalTimeEntries).values({
    portalUserId,
    caseId: caseId || null,
    description: description.trim(),
    startedAt: new Date().toISOString(),
    endedAt: null,
    note: note || null,
  }).returning();

  return inserted;
}

/**
 * 타이머 종료 — ended_at 기록 및 durationMinutes 계산
 */
async function stopPortalTimer(portalUserId) {
  const active = await getActivePortalTimer(portalUserId);
  if (!active) throw new ServiceError("진행 중인 타이머가 없습니다", 400);

  const endedAt = new Date().toISOString();
  const durationMinutes = Math.round(
    (new Date(endedAt) - new Date(active.startedAt)) / 60000
  );

  const [updated] = await db
    .update(portalTimeEntries)
    .set({
      endedAt,
      durationMinutes,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(portalTimeEntries.id, active.id))
    .returning();

  return updated;
}

/**
 * 타임엔트리 수정
 */
async function updatePortalTimeEntry(id, portalUserId, data) {
  validateUUID(id);
  const [existing] = await db
    .select()
    .from(portalTimeEntries)
    .where(and(eq(portalTimeEntries.id, id), eq(portalTimeEntries.portalUserId, portalUserId)));

  if (!existing) throw new ServiceError("기록을 찾을 수 없습니다", 404);

  const { description, startedAt, endedAt, durationMinutes, note, caseId } = data;
  const updateData = { updatedAt: sql`(datetime('now'))` };

  if (description !== undefined) updateData.description = description.trim();
  if (startedAt !== undefined) updateData.startedAt = startedAt;
  if (endedAt !== undefined) updateData.endedAt = endedAt;
  if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
  if (note !== undefined) updateData.note = note;
  if (caseId !== undefined) updateData.caseId = caseId;

  const [updated] = await db
    .update(portalTimeEntries)
    .set(updateData)
    .where(eq(portalTimeEntries.id, id))
    .returning();

  return updated;
}

/**
 * 타임엔트리 삭제
 */
async function deletePortalTimeEntry(id, portalUserId) {
  validateUUID(id);
  const [existing] = await db
    .select()
    .from(portalTimeEntries)
    .where(and(eq(portalTimeEntries.id, id), eq(portalTimeEntries.portalUserId, portalUserId)));

  if (!existing) throw new ServiceError("기록을 찾을 수 없습니다", 404);
  await db.delete(portalTimeEntries).where(eq(portalTimeEntries.id, id));
  return { deleted: true };
}

// =============================================
// 관리자: 전체 타임트래킹 조회
// =============================================

/**
 * 관리자: 포털 타임엔트리 전체 조회 (일자별/사건별/직원별 필터)
 * @param {{ from?: string, to?: string, caseId?: string, portalUserId?: string, page?: string, limit?: string }} query
 */
async function listAdminPortalTimeEntries(query) {
  const { page, limit, offset } = parsePagination(query);

  let condition = sql`1=1`;
  if (query.from) condition = and(condition, gte(portalTimeEntries.startedAt, query.from));
  if (query.to) condition = and(condition, lte(portalTimeEntries.startedAt, query.to + "T23:59:59"));
  if (query.caseId) condition = and(condition, eq(portalTimeEntries.caseId, query.caseId));
  if (query.portalUserId) condition = and(condition, eq(portalTimeEntries.portalUserId, query.portalUserId));
  if (query.description) condition = and(condition, like(portalTimeEntries.description, `%${query.description}%`));

  const rows = await db
    .select({
      id: portalTimeEntries.id,
      portalUserId: portalTimeEntries.portalUserId,
      caseId: portalTimeEntries.caseId,
      description: portalTimeEntries.description,
      startedAt: portalTimeEntries.startedAt,
      endedAt: portalTimeEntries.endedAt,
      durationMinutes: portalTimeEntries.durationMinutes,
      note: portalTimeEntries.note,
      createdAt: portalTimeEntries.createdAt,
      caseTitle: caseFilesTable.title,
      caseNumber: caseFilesTable.caseNumber,
      userEmail: portalUsers.email,
      clientName: clients.name,
    })
    .from(portalTimeEntries)
    .leftJoin(caseFilesTable, eq(portalTimeEntries.caseId, caseFilesTable.id))
    .leftJoin(portalUsers, eq(portalTimeEntries.portalUserId, portalUsers.id))
    .leftJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(condition)
    .orderBy(desc(portalTimeEntries.startedAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(portalTimeEntries)
    .where(condition);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

// =============================================
// 구글 캘린더 토큰 저장/조회
// =============================================

/**
 * 포털 사용자의 구글 OAuth2 토큰 저장
 */
async function saveGoogleTokens(portalUserId, { accessToken, refreshToken, expiresAt }) {
  await db
    .update(portalUsers)
    .set({
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiresAt: expiresAt,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(portalUsers.id, portalUserId));
}

/**
 * 포털 사용자의 구글 토큰 조회
 */
async function getGoogleTokens(portalUserId) {
  const [user] = await db
    .select({
      googleAccessToken: portalUsers.googleAccessToken,
      googleRefreshToken: portalUsers.googleRefreshToken,
      googleTokenExpiresAt: portalUsers.googleTokenExpiresAt,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  return user || null;
}

/**
 * 구글 캘린더 연결 해제
 */
async function disconnectGoogle(portalUserId) {
  await db
    .update(portalUsers)
    .set({
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiresAt: null,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(portalUsers.id, portalUserId));

  return { disconnected: true };
}

// =============================================
// 포털 게시판 (자유게시판 / 공지사항 / 업무 매뉴얼 / 양식)
// =============================================

async function listPortalPosts(query) {
  const { page, limit, offset } = parsePagination(query);
  const { category, search, pinnedOnly } = query;

  let condition = sql`1=1`;
  if (category) {
    condition = and(condition, eq(portalPosts.category, category));
  }
  if (search) {
    condition = and(condition, sql`(${portalPosts.title} LIKE ${'%' + search + '%'} OR ${portalPosts.content} LIKE ${'%' + search + '%'})`);
  }
  if (pinnedOnly === "true") {
    condition = and(condition, eq(portalPosts.isPinned, 1));
  }

  const rows = await db
    .select({
      id: portalPosts.id,
      portalUserId: portalPosts.portalUserId,
      category: portalPosts.category,
      title: portalPosts.title,
      content: portalPosts.content,
      viewCount: portalPosts.viewCount,
      isPinned: portalPosts.isPinned,
      isImportant: portalPosts.isImportant,
      createdAt: portalPosts.createdAt,
      updatedAt: portalPosts.updatedAt,
      authorEmail: portalUsers.email,
      authorName: clients.name,
    })
    .from(portalPosts)
    .leftJoin(portalUsers, eq(portalPosts.portalUserId, portalUsers.id))
    .leftJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(condition)
    .orderBy(desc(portalPosts.isPinned), desc(portalPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(portalPosts)
    .where(condition);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

async function createPortalPost(portalUserId, data) {
  const { category, title, content, isPinned, isImportant } = data;
  if (!title || !title.trim()) throw new ServiceError("제목을 입력해주세요", 400);
  if (!content || !content.trim()) throw new ServiceError("내용을 입력해주세요", 400);

  const [inserted] = await db.insert(portalPosts).values({
    portalUserId,
    category: category || "free",
    title: title.trim(),
    content: content.trim(),
    isPinned: isPinned ? 1 : 0,
    isImportant: isImportant ? 1 : 0,
  }).returning();

  return inserted;
}

async function getPortalPost(id) {
  validateUUID(id);
  const [row] = await db
    .select({
      id: portalPosts.id,
      portalUserId: portalPosts.portalUserId,
      category: portalPosts.category,
      title: portalPosts.title,
      content: portalPosts.content,
      viewCount: portalPosts.viewCount,
      isPinned: portalPosts.isPinned,
      isImportant: portalPosts.isImportant,
      createdAt: portalPosts.createdAt,
      updatedAt: portalPosts.updatedAt,
      authorEmail: portalUsers.email,
      authorName: clients.name,
    })
    .from(portalPosts)
    .leftJoin(portalUsers, eq(portalPosts.portalUserId, portalUsers.id))
    .leftJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(eq(portalPosts.id, id));

  if (!row) throw new ServiceError("게시글을 찾을 수 없습니다", 404);

  // 조회수 1 증가 (비동기 수행)
  db.update(portalPosts)
    .set({ viewCount: sql`${portalPosts.viewCount} + 1` })
    .where(eq(portalPosts.id, id))
    .run();

  row.viewCount += 1; // 클라이언트 즉시 반영을 위해 로컬 값도 증가
  return row;
}

async function updatePortalPost(id, portalUserId, isAdmin, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalPosts).where(eq(portalPosts.id, id));
  if (!existing) throw new ServiceError("게시글을 찾을 수 없습니다", 404);

  if (existing.portalUserId !== portalUserId && !isAdmin) {
    throw new ServiceError("수정 권한이 없습니다", 403);
  }

  const { category, title, content, isPinned, isImportant } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (category !== undefined) updates.category = category;
  if (title !== undefined) updates.title = (title || "").trim();
  if (content !== undefined) updates.content = content;
  if (isPinned !== undefined) updates.isPinned = isPinned ? 1 : 0;
  if (isImportant !== undefined) updates.isImportant = isImportant ? 1 : 0;

  const [updated] = await db
    .update(portalPosts)
    .set(updates)
    .where(eq(portalPosts.id, id))
    .returning();

  return updated;
}

async function deletePortalPost(id, portalUserId, isAdmin) {
  validateUUID(id);
  const [existing] = await db.select().from(portalPosts).where(eq(portalPosts.id, id));
  if (!existing) throw new ServiceError("게시글을 찾을 수 없습니다", 404);

  if (existing.portalUserId !== portalUserId && !isAdmin) {
    throw new ServiceError("삭제 권한이 없습니다", 403);
  }

  await db.delete(portalPosts).where(eq(portalPosts.id, id));
  return { deleted: true };
}

// =============================================
// 포털 게시판 카테고리 (대표변호사가 추가/삭제 가능)
// =============================================

async function listBoardCategories() {
  return db
    .select({
      id: portalBoardCategories.id,
      key: portalBoardCategories.key,
      label: portalBoardCategories.label,
      color: portalBoardCategories.color,
      sortOrder: portalBoardCategories.sortOrder,
      createdBy: portalBoardCategories.createdBy,
      createdAt: portalBoardCategories.createdAt,
    })
    .from(portalBoardCategories)
    .orderBy(asc(portalBoardCategories.sortOrder), asc(portalBoardCategories.createdAt));
}

/** 카테고리 key는 portal_posts.category 컬럼에 그대로 저장되므로 영문 소문자/숫자/하이픈만 허용한다 */
const BOARD_CATEGORY_KEY_REGEX = /^[a-z0-9-]{1,30}$/;

async function createBoardCategory(portalUserId, data) {
  const key = (data.key || "").trim().toLowerCase();
  const label = (data.label || "").trim();
  const color = (data.color || "#64748b").trim();

  if (!BOARD_CATEGORY_KEY_REGEX.test(key)) {
    throw new ServiceError("카테고리 key는 영문 소문자/숫자/하이픈으로만 입력해주세요", 400);
  }
  if (!label) throw new ServiceError("게시판 이름을 입력해주세요", 400);

  const [existing] = await db
    .select({ id: portalBoardCategories.id })
    .from(portalBoardCategories)
    .where(eq(portalBoardCategories.key, key));
  if (existing) throw new ServiceError("이미 사용 중인 key입니다", 409);

  const [{ maxSortOrder }] = await db
    .select({ maxSortOrder: sql`COALESCE(MAX(${portalBoardCategories.sortOrder}), -1)` })
    .from(portalBoardCategories);

  const [inserted] = await db.insert(portalBoardCategories).values({
    key,
    label,
    color,
    sortOrder: Number(maxSortOrder) + 1,
    createdBy: portalUserId,
  }).returning();

  return inserted;
}

async function deleteBoardCategory(id) {
  validateUUID(id);
  const [existing] = await db.select().from(portalBoardCategories).where(eq(portalBoardCategories.id, id));
  if (!existing) throw new ServiceError("게시판을 찾을 수 없습니다", 404);

  const [{ postCount }] = await db
    .select({ postCount: sql`count(*)` })
    .from(portalPosts)
    .where(eq(portalPosts.category, existing.key));
  if (Number(postCount) > 0) {
    throw new ServiceError("게시글이 있는 게시판은 삭제할 수 없습니다", 409);
  }

  await db.delete(portalBoardCategories).where(eq(portalBoardCategories.id, id));
  return { deleted: true };
}

// =============================================
// 캘린더 — 함께 보고 싶은 구성원 그룹 (사용자별 저장)
// =============================================

async function listMemberGroups(portalUserId) {
  const rows = await db
    .select({
      id: portalMemberGroups.id,
      name: portalMemberGroups.name,
      memberIds: portalMemberGroups.memberIds,
      createdAt: portalMemberGroups.createdAt,
    })
    .from(portalMemberGroups)
    .where(eq(portalMemberGroups.portalUserId, portalUserId))
    .orderBy(asc(portalMemberGroups.createdAt));

  // 콤마로 저장된 member_ids를 배열로 변환해 프론트엔드가 바로 쓸 수 있게 한다 (attendee_ids와 동일한 방식)
  return rows.map((row) => ({
    ...row,
    memberIds: (row.memberIds || "").split(",").map((id) => id.trim()).filter(Boolean),
  }));
}

async function createMemberGroup(portalUserId, data) {
  const name = (data.name || "").trim();
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds.filter(Boolean) : [];

  if (!name) throw new ServiceError("그룹 이름을 입력해주세요", 400);
  if (memberIds.length === 0) throw new ServiceError("구성원을 1명 이상 선택해주세요", 400);

  const [inserted] = await db.insert(portalMemberGroups).values({
    portalUserId,
    name,
    memberIds: memberIds.join(","),
  }).returning();

  return { ...inserted, memberIds };
}

async function deleteMemberGroup(id, portalUserId) {
  validateUUID(id);
  const [existing] = await db.select().from(portalMemberGroups).where(eq(portalMemberGroups.id, id));
  if (!existing) throw new ServiceError("그룹을 찾을 수 없습니다", 404);

  if (existing.portalUserId !== portalUserId) {
    throw new ServiceError("삭제 권한이 없습니다", 403);
  }

  await db.delete(portalMemberGroups).where(eq(portalMemberGroups.id, id));
  return { deleted: true };
}

// =============================================
// 포털 일정 (캘린더)
// =============================================

async function listPortalEvents(portalUserId, query = {}) {
  // 1. 사용자 정보 조회 (clientId, email 확인)
  const [user] = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      clientId: portalUsers.clientId,
      role: portalUsers.role,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  if (!user) return [];
  const isEmployee = !user.clientId || (user.role && user.role !== "client");

  // Filter target user IDs
  let targetUserIds = [portalUserId];

  if (isEmployee) {
    if (query.company === "true") {
      const allEmps = await db
        .select({ id: portalUsers.id })
        .from(portalUsers)
        .where(
          and(
            eq(portalUsers.isActive, 1),
            sql`(${portalUsers.clientId} IS NULL OR ${portalUsers.role} != 'client')`
          )
        );
      targetUserIds = allEmps.map((e) => e.id);
    } else if (query.departmentId) {
      const deptEmps = await db
        .select({ id: portalUsers.id })
        .from(portalUsers)
        .where(
          and(
            eq(portalUsers.isActive, 1),
            eq(portalUsers.departmentId, query.departmentId)
          )
        );
      targetUserIds = deptEmps.map((e) => e.id);
    } else if (query.userIds) {
      targetUserIds = query.userIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }

  // 2. 포털 사용자 개인 및 attendee로 참여한 일정 조회
  let dbEvents = [];
  if (targetUserIds.length > 0) {
    const conditions = [inArray(portalEvents.portalUserId, targetUserIds)];
    for (const userId of targetUserIds) {
      conditions.push(like(portalEvents.attendeeIds, `%${userId}%`));
    }
    dbEvents = await db
      .select()
      .from(portalEvents)
      .where(or(...conditions))
      .orderBy(asc(portalEvents.startsAt));
  }

  // 3. 의뢰인/변호사 관련 법정 일정(court_dates) 조회
  let clientCourtDates = [];
  if (user.clientId) {
    clientCourtDates = await db
      .select()
      .from(courtDates)
      .where(and(eq(courtDates.clientId, user.clientId), eq(courtDates.status, "scheduled")))
      .orderBy(asc(courtDates.startsAt));
  }

  let targetCourtDates = [];
  if (isEmployee && targetUserIds.length > 0) {
    const targetUsers = await db
      .select({ id: portalUsers.id, email: portalUsers.email })
      .from(portalUsers)
      .where(inArray(portalUsers.id, targetUserIds));
    const targetEmails = targetUsers
      .map((tu) => tu.email?.toLowerCase().trim())
      .filter(Boolean);

    if (targetEmails.length > 0) {
      const targetLawyers = await db
        .select({ id: lawyers.id })
        .from(lawyers)
        .where(inArray(lawyers.email, targetEmails));
      const lawyerIds = targetLawyers.map((l) => l.id);

      if (lawyerIds.length > 0) {
        targetCourtDates = await db
          .select()
          .from(courtDates)
          .where(and(inArray(courtDates.lawyerId, lawyerIds), eq(courtDates.status, "scheduled")))
          .orderBy(asc(courtDates.startsAt));
      }
    }
  } else if (!isEmployee) {
    if (user.email) {
      const [lawyer] = await db
        .select()
        .from(lawyers)
        .where(eq(lawyers.email, user.email.toLowerCase().trim()));
      if (lawyer) {
        targetCourtDates = await db
          .select()
          .from(courtDates)
          .where(and(eq(courtDates.lawyerId, lawyer.id), eq(courtDates.status, "scheduled")))
          .orderBy(asc(courtDates.startsAt));
      }
    }
  }

  const courtDatesMap = new Map();
  for (const cd of [...clientCourtDates, ...targetCourtDates]) {
    courtDatesMap.set(cd.id, cd);
  }

  // 4. 사원 이름/직급 맵핑 및 lawyers 이메일 매칭
  const allUsersList = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      name: clients.name,
      position: portalUsers.position,
    })
    .from(portalUsers)
    .leftJoin(clients, eq(portalUsers.clientId, clients.id));

  const allLawyersList = await db
    .select({
      name: lawyers.name,
      email: lawyers.email,
    })
    .from(lawyers);

  const lawyerNameMap = {};
  for (const l of allLawyersList) {
    if (l.email) lawyerNameMap[l.email.toLowerCase().trim()] = l.name;
  }

  const userNameMap = {};
  const userObjMap = {};
  for (const u of allUsersList) {
    const displayName = lawyerNameMap[u.email?.toLowerCase().trim()] || u.name || "미지정";
    userNameMap[u.id] = displayName;
    userObjMap[u.id] = {
      id: u.id,
      name: displayName,
      email: u.email,
      position: u.position,
    };
  }

  // 5. 일정 정보 가공
  const enrichedEvents = dbEvents.map((evt) => {
    const attendees = (evt.attendeeIds || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => userObjMap[id])
      .filter(Boolean);

    return {
      ...evt,
      ownerName: userNameMap[evt.portalUserId] || "미지정",
      attendees,
    };
  });

  const courtEventsMapped = Array.from(courtDatesMap.values()).map((cd) => {
    const lawyer = allLawyersList.find((l) => l.id === cd.lawyerId);
    return {
      id: `court-${cd.id}`,
      portalUserId: cd.portalUserId || cd.lawyerId || null,
      title: `[기일] ${cd.title}${cd.caseNumber ? ` (${cd.caseNumber})` : ""}`,
      description: [
        cd.courtName && `법원: ${cd.courtName} ${cd.courtRoom || ""}`,
        cd.kind && `구분: ${cd.kind}`,
        cd.memo && `메모: ${cd.memo}`,
      ]
        .filter(Boolean)
        .join("\n"),
      startsAt: cd.startsAt,
      endsAt: cd.endsAt || cd.startsAt,
      isAllDay: 0,
      color: "#ef4444",
      isCourtDate: true,
      ownerName: lawyer ? lawyer.name : "변호사",
      attendees: [],
    };
  });

  return [...enrichedEvents, ...courtEventsMapped].sort((a, b) => {
    return (a.startsAt || "").localeCompare(b.startsAt || "");
  });
}

// 반복 일정: 규칙별 단위/간격/생성 한도 (DB 무한 증식 방지를 위해 상한을 둠)
const RECURRENCE_RULES = {
  daily: { unit: "day", step: 1, maxOccurrences: 60 },     // 약 2개월
  weekly: { unit: "week", step: 1, maxOccurrences: 26 },   // 약 6개월
  monthly: { unit: "month", step: 1, maxOccurrences: 12 }, // 약 1년
  yearly: { unit: "year", step: 1, maxOccurrences: 5 },    // 5년
};

// "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm" 문자열의 날짜 부분에 단위만큼 더해 새 문자열 생성
// (시간대 변환으로 인한 날짜 어긋남을 피하기 위해 new Date(isoString) 대신 로컬 컴포넌트로 직접 계산)
function shiftDateTimeString(value, unit, amount) {
  if (!value) return value;
  const datePart = value.substring(0, 10);
  const timePart = value.length > 10 ? value.substring(10) : "";
  const [y, m, d] = datePart.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (unit === "day") date.setDate(date.getDate() + amount);
  else if (unit === "week") date.setDate(date.getDate() + amount * 7);
  else if (unit === "month") date.setMonth(date.getMonth() + amount);
  else if (unit === "year") date.setFullYear(date.getFullYear() + amount);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}${timePart}`;
}

async function createPortalEvent(portalUserId, data) {
  const {
    title, description, startsAt, endsAt, isAllDay, color, attendeeIds,
    location, videoConferenceUrl, attachmentUrls, category, recurrenceRule, reminderMinutes,
  } = data;
  if (!title || !title.trim()) throw new ServiceError("일정 제목을 입력해주세요", 400);
  if (!startsAt) throw new ServiceError("시작 일시를 입력해주세요", 400);

  const [creatorUser] = await db
    .select({ clientId: portalUsers.clientId, role: portalUsers.role })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  const isEmployee = creatorUser && (!creatorUser.clientId || (creatorUser.role && creatorUser.role !== "client"));
  const targetOwnerId = (isEmployee && data.portalUserId) ? data.portalUserId : portalUserId;

  const rule = RECURRENCE_RULES[recurrenceRule] ? recurrenceRule : null;
  const reminder = Number.isFinite(Number(reminderMinutes)) && Number(reminderMinutes) > 0
    ? Number(reminderMinutes)
    : null;

  const baseValues = {
    portalUserId: targetOwnerId,
    title: title.trim(),
    description: description || null,
    isAllDay: isAllDay ? 1 : 0,
    color: color || "#6366f1",
    attendeeIds: attendeeIds || null,
    location: location || null,
    videoConferenceUrl: videoConferenceUrl || null,
    attachmentUrls: attachmentUrls || null,
    category: category || null,
    recurrenceRule: rule,
    reminderMinutes: reminder,
  };

  if (!rule) {
    const [inserted] = await db.insert(portalEvents).values({
      ...baseValues,
      startsAt,
      endsAt: endsAt || null,
    }).returning();
    return inserted;
  }

  // 반복 일정 — 각 회차를 개별 레코드로 생성(생성 시점에 한해 적용, 회차별 개별 수정/삭제 가능)
  const { unit, step, maxOccurrences } = RECURRENCE_RULES[rule];
  let firstInserted = null;
  for (let i = 0; i < maxOccurrences; i++) {
    const [inserted] = await db.insert(portalEvents).values({
      ...baseValues,
      startsAt: shiftDateTimeString(startsAt, unit, step * i),
      endsAt: endsAt ? shiftDateTimeString(endsAt, unit, step * i) : null,
    }).returning();
    if (i === 0) firstInserted = inserted;
  }
  return firstInserted;
}

async function updatePortalEvent(id, portalUserId, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalEvents).where(eq(portalEvents.id, id));
  if (!existing) throw new ServiceError("일정을 찾을 수 없습니다", 404);

  const attendeesList = (existing.attendeeIds || "").split(",").map(id => id.trim()).filter(Boolean);
  const isAuthorized = existing.portalUserId === portalUserId || attendeesList.includes(portalUserId);
  if (!isAuthorized) {
    throw new ServiceError("수정 권한이 없습니다", 403);
  }

  const [updaterUser] = await db
    .select({ clientId: portalUsers.clientId, role: portalUsers.role })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));
  const isEmployee = updaterUser && (!updaterUser.clientId || (updaterUser.role && updaterUser.role !== "client"));

  const {
    title, description, startsAt, endsAt, isAllDay, color, attendeeIds,
    location, videoConferenceUrl, attachmentUrls, category, reminderMinutes,
  } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (title !== undefined) updates.title = (title || "").trim();
  if (description !== undefined) updates.description = description;
  if (startsAt !== undefined) updates.startsAt = startsAt;
  if (endsAt !== undefined) updates.endsAt = endsAt;
  if (isAllDay !== undefined) updates.isAllDay = isAllDay ? 1 : 0;
  if (color !== undefined) updates.color = color;
  if (attendeeIds !== undefined) updates.attendeeIds = attendeeIds || null;
  if (location !== undefined) updates.location = location || null;
  if (videoConferenceUrl !== undefined) updates.videoConferenceUrl = videoConferenceUrl || null;
  if (attachmentUrls !== undefined) updates.attachmentUrls = attachmentUrls || null;
  if (category !== undefined) updates.category = category || null;
  if (reminderMinutes !== undefined) {
    const reminder = Number.isFinite(Number(reminderMinutes)) && Number(reminderMinutes) > 0
      ? Number(reminderMinutes)
      : null;
    updates.reminderMinutes = reminder;
    // 알림 시각 또는 알림 설정이 변경되면 재발송 가능하도록 발송 여부를 초기화
    updates.reminded = 0;
  }
  if (startsAt !== undefined) updates.reminded = 0;
  if (isEmployee && data.portalUserId !== undefined) {
    updates.portalUserId = data.portalUserId;
  }

  const [updated] = await db
    .update(portalEvents)
    .set(updates)
    .where(eq(portalEvents.id, id))
    .returning();

  return updated;
}

async function deletePortalEvent(id, portalUserId) {
  validateUUID(id);
  const [existing] = await db.select().from(portalEvents).where(eq(portalEvents.id, id));
  if (!existing) throw new ServiceError("일정을 찾을 수 없습니다", 404);

  const attendeesList = (existing.attendeeIds || "").split(",").map(id => id.trim()).filter(Boolean);
  const isAuthorized = existing.portalUserId === portalUserId || attendeesList.includes(portalUserId);
  if (!isAuthorized) {
    throw new ServiceError("삭제 권한이 없습니다", 403);
  }

  await db.delete(portalEvents).where(eq(portalEvents.id, id));
  return { deleted: true };
}

/**
 * 포털 사용자가 직원(임직원)인지 판별한다.
 * 포털 세션에는 role이 저장되지 않으므로(클라이언트 연동 후 관리자가 나중에 부여 가능),
 * 항상 DB에서 최신 clientId/role을 조회해 판단해야 한다.
 */
async function checkIsEmployee(portalUserId) {
  const [user] = await db
    .select({ clientId: portalUsers.clientId, role: portalUsers.role })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  if (!user) return false;
  return !user.clientId || (user.role && user.role !== "client");
}

// =============================================
// 포털 변호사 프로필 설정 / 편집 / 관리자 CRUD
// =============================================

async function checkIsAdmin(email) {
  if (!email) return false;
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email.toLowerCase().trim()), eq(adminUsers.isActive, 1)));
  return !!admin;
}

async function getLawyerProfileByEmail(email) {
  if (!email) return null;
  const [lawyer] = await db
    .select()
    .from(lawyers)
    .where(eq(lawyers.email, email.toLowerCase().trim()));
  return lawyer || null;
}

/**
 * 포털 사용자가 대표변호사인지 판별한다.
 * 포털 계정과 변호사 프로필은 별도 테이블이라, /members와 동일하게
 * 이메일을 기준으로 lawyers.position을 조회해 "대표변호사" 여부를 확인한다.
 */
async function checkIsManagingLawyer(portalUserId) {
  const [user] = await db
    .select({ email: portalUsers.email })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  if (!user) return false;
  const lawyer = await getLawyerProfileByEmail(user.email);
  return lawyer?.position === "대표변호사";
}

async function createLawyerProfile(email, data) {
  const { name, nameEn, nameHanja, position, team, photoUrl, tagline, education, career, specialties, qualifications, publications, books, media, columns, cases, memberships, consultHours, blogUrl, introduction, phone } = data;
  if (!name || !name.trim()) throw new ServiceError("이름은 필수입니다", 400);

  if (email) {
    const [existing] = await db.select().from(lawyers).where(eq(lawyers.email, email.toLowerCase().trim()));
    if (existing) {
      return updateLawyerProfile(existing.id, { ...data, email });
    }
  }

  const id = crypto.randomUUID();
  await db.insert(lawyers).values({
    id,
    name: name.trim(),
    nameEn: nameEn || null,
    nameHanja: nameHanja || null,
    position: position || "변호사",
    team: team || null,
    photoUrl: photoUrl || null,
    tagline: tagline || null,
    education: education || null,
    career: career || null,
    specialties: specialties || null,
    qualifications: qualifications || null,
    publications: publications || null,
    books: books || null,
    media: media || null,
    columns: columns || null,
    cases: cases || null,
    memberships: memberships || null,
    consultHours: consultHours || null,
    blogUrl: blogUrl || null,
    introduction: introduction || null,
    email: email.toLowerCase().trim(),
    phone: phone || null,
    sortOrder: 0,
    isActive: 1,
  }).run();

  const created = await db.select().from(lawyers).where(eq(lawyers.id, id)).get();
  return created;
}

async function listAllLawyers() {
  return db
    .select()
    .from(lawyers)
    .orderBy(asc(lawyers.sortOrder));
}

async function updateLawyerProfile(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(lawyers).where(eq(lawyers.id, id));
  if (!existing) throw new ServiceError("변호사를 찾을 수 없습니다", 404);

  const {
    name,
    nameEn,
    nameHanja,
    position,
    team,
    photoUrl,
    tagline,
    education,
    career,
    specialties,
    qualifications,
    publications,
    books,
    media,
    columns,
    cases,
    memberships,
    consultHours,
    blogUrl,
    introduction,
    email,
    phone,
    sortOrder,
    isActive,
  } = data;

  const updates = { updatedAt: sql`(datetime('now'))` };
  if (name !== undefined) updates.name = name.trim();
  if (nameEn !== undefined) updates.nameEn = nameEn;
  if (nameHanja !== undefined) updates.nameHanja = nameHanja;
  if (position !== undefined) updates.position = position;
  if (team !== undefined) updates.team = team;
  if (photoUrl !== undefined) updates.photoUrl = photoUrl;
  if (tagline !== undefined) updates.tagline = tagline;
  if (education !== undefined) updates.education = education;
  if (career !== undefined) updates.career = career;
  if (specialties !== undefined) updates.specialties = specialties;
  if (qualifications !== undefined) updates.qualifications = qualifications;
  if (publications !== undefined) updates.publications = publications;
  if (books !== undefined) updates.books = books;
  if (media !== undefined) updates.media = media;
  if (columns !== undefined) updates.columns = columns;
  if (cases !== undefined) updates.cases = cases;
  if (memberships !== undefined) updates.memberships = memberships;
  if (consultHours !== undefined) updates.consultHours = consultHours;
  if (blogUrl !== undefined) updates.blogUrl = blogUrl;
  if (introduction !== undefined) updates.introduction = introduction;
  if (email !== undefined) updates.email = email.toLowerCase().trim();
  if (phone !== undefined) updates.phone = phone;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;

  const [updated] = await db
    .update(lawyers)
    .set(updates)
    .where(eq(lawyers.id, id))
    .returning();

  return updated;
}

async function deleteLawyerProfile(id) {
  validateUUID(id);
  const [existing] = await db.select().from(lawyers).where(eq(lawyers.id, id));
  if (!existing) throw new ServiceError("변호사를 찾을 수 없습니다", 404);

  await db.delete(lawyers).where(eq(lawyers.id, id));
  return { deleted: true };
}

async function reorderLawyerProfiles(id1, id2) {
  validateUUID(id1);
  validateUUID(id2);

  const [lawyer1] = await db.select().from(lawyers).where(eq(lawyers.id, id1));
  const [lawyer2] = await db.select().from(lawyers).where(eq(lawyers.id, id2));

  if (!lawyer1 || !lawyer2) throw new ServiceError("변호사를 찾을 수 없습니다", 404);

  const temp = lawyer1.sortOrder;
  await db.update(lawyers).set({ sortOrder: lawyer2.sortOrder }).where(eq(lawyers.id, id1)).run();
  await db.update(lawyers).set({ sortOrder: temp }).where(eq(lawyers.id, id2)).run();

  return { success: true };
}

/**
 * 비밀번호 찾기 — 이메일과 전화번호 매칭 후 SMS OTP 요청
 */
async function forgotPassword(email, phone, req) {
  if (!email || !phone) {
    throw new ServiceError("이메일과 휴대폰 번호를 모두 입력해주세요", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.replace(/[\s-]/g, "");

  // 1. portal_users와 clients를 조인하여 이메일과 전화번호가 매칭되는 사용자 검색
  const [user] = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      phone: clients.phone,
    })
    .from(portalUsers)
    .innerJoin(clients, eq(portalUsers.clientId, clients.id))
    .where(
      and(
        eq(portalUsers.email, normalizedEmail),
        eq(clients.phone, normalizedPhone)
      )
    );

  if (!user) {
    throw new ServiceError("입력하신 정보와 일치하는 계정을 찾을 수 없습니다", 404);
  }

  // 2. OTP 발송 요청
  const result = await requestOtp({
    contextType: "portal_reset_password",
    contextId: user.id,
    phoneNumber: user.phone,
    req,
    dryRun: !SMS_OTP_CONFIGURED,
  });

  return {
    verificationId: result.verificationId,
    sentTo: result.sentTo,
    devCode: result.devCode,
  };
}

/**
 * 비밀번호 재설정 — OTP 검증 후 새 비밀번호 저장
 */
async function resetPassword(verificationId, code, newPassword) {
  if (!verificationId || !code) {
    throw new ServiceError("인증 정보와 인증번호를 입력해주세요", 400);
  }
  if (!newPassword || newPassword.length < 8) {
    throw new ServiceError("새 비밀번호는 8자 이상이어야 합니다", 400);
  }

  // 1. OTP 검증
  const result = verifyOtp(verificationId, code);
  if (!result.ok) {
    throw new ServiceError(result.reason, 400);
  }

  const userId = result.row.context_id;
  const contextType = result.row.context_type;

  if (contextType !== "portal_reset_password") {
    throw new ServiceError("올바르지 않은 인증 요청입니다", 400);
  }

  // 2. 비밀번호 업데이트
  const passwordHash = hashPassword(newPassword);
  await db
    .update(portalUsers)
    .set({
      passwordHash,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(portalUsers.id, userId));

  return { success: true, message: "비밀번호가 성공적으로 재설정되었습니다" };
}

module.exports = {
  // 인증
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
  // 관리자: 포털 사용자
  listPortalUsers,
  getPortalUser,
  approvePortalUser,
  rejectPortalUser,
  deletePortalUser,
  updatePortalUser,
  // 사건
  getUserCases,
  registerPortalCase,
  getCaseDetail,
  getCaseMessages,
  sendClientMessage,
  // 관리자: 사건
  listAdminCases,
  getAdminCase,
  listAdminCaseMessages,
  deleteAdminCase,
  createAdminCase,
  updateAdminCase,
  sendLawyerMessage,
  // 타임트래킹
  listPortalTimeEntries,
  getPortalTimeSummary,
  getActivePortalTimer,
  createPortalTimeEntry,
  startPortalTimer,
  stopPortalTimer,
  updatePortalTimeEntry,
  deletePortalTimeEntry,
  // 관리자: 타임트래킹
  listAdminPortalTimeEntries,
  // 구글 캘린더
  saveGoogleTokens,
  getGoogleTokens,
  disconnectGoogle,

  // 게시판
  listPortalPosts,
  createPortalPost,
  getPortalPost,
  updatePortalPost,
  deletePortalPost,
  listBoardCategories,
  createBoardCategory,
  deleteBoardCategory,

  // 캘린더
  checkIsEmployee,
  listPortalEvents,
  createPortalEvent,
  updatePortalEvent,
  deletePortalEvent,
  listMemberGroups,
  createMemberGroup,
  deleteMemberGroup,

  // 변호사 프로필
  checkIsAdmin,
  checkIsManagingLawyer,
  getLawyerProfileByEmail,
  createLawyerProfile,
  updateLawyerProfile,
  listAllLawyers,
  deleteLawyerProfile,
  reorderLawyerProfiles,
};
