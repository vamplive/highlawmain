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
  portalEvents,
  adminUsers,
  courtDates,
} = require("../db/schema");
const { eq, desc, and, sql, gte, lte, between, asc, like } = require("drizzle-orm");
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

// =============================================
// 회원가입 / 로그인 / 로그아웃
// =============================================

/**
 * 포털 회원가입 (가입 후 관리자 승인 대기 상태)
 * isActive=0: 승인 대기, 1: 승인, -1: 거절
 */
async function registerUser(data) {
  const { email, password, name, phone } = data;

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
    throw new ServiceError("이메일과 비밀번호를 입력해주세요", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(portalUsers)
    .where(eq(portalUsers.email, normalizedEmail));

  if (!user) {
    dummyVerifyPassword();
    throw new ServiceError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
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
    throw new ServiceError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
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
// 포털 일정 (캘린더)
// =============================================

async function listPortalEvents(portalUserId) {
  // 1. 사용자 정보 조회 (clientId, email 확인)
  const [user] = await db
    .select({
      id: portalUsers.id,
      email: portalUsers.email,
      clientId: portalUsers.clientId,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, portalUserId));

  if (!user) return [];

  // 2. 포털 사용자 개인 일정 조회
  const userEvents = await db
    .select()
    .from(portalEvents)
    .where(eq(portalEvents.portalUserId, portalUserId))
    .orderBy(asc(portalEvents.startsAt));

  // 3. 의뢰인/변호사 관련 법정 일정(court_dates) 조회
  let clientCourtDates = [];
  if (user.clientId) {
    clientCourtDates = await db
      .select()
      .from(courtDates)
      .where(and(eq(courtDates.clientId, user.clientId), eq(courtDates.status, "scheduled")))
      .orderBy(asc(courtDates.startsAt));
  }

  let lawyerCourtDates = [];
  if (user.email) {
    const [lawyer] = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.email, user.email.toLowerCase().trim()));
    if (lawyer) {
      lawyerCourtDates = await db
        .select()
        .from(courtDates)
        .where(and(eq(courtDates.lawyerId, lawyer.id), eq(courtDates.status, "scheduled")))
        .orderBy(asc(courtDates.startsAt));
    }
  }

  // 4. 중복 제거를 위해 Map 사용 (id 기준)
  const courtDatesMap = new Map();
  for (const cd of [...clientCourtDates, ...lawyerCourtDates]) {
    courtDatesMap.set(cd.id, cd);
  }

  // 5. 법정 일정을 캘린더 이벤트 형태로 변환
  const courtEventsMapped = Array.from(courtDatesMap.values()).map((cd) => ({
    id: `court-${cd.id}`,
    portalUserId: portalUserId,
    title: `[기일] ${cd.title}${cd.caseNumber ? ` (${cd.caseNumber})` : ""}`,
    description: [
      cd.courtName && `법원: ${cd.courtName} ${cd.courtRoom || ""}`,
      cd.kind && `구분: ${cd.kind}`,
      cd.memo && `메모: ${cd.memo}`,
    ].filter(Boolean).join("\n"),
    startsAt: cd.startsAt,
    endsAt: cd.endsAt || cd.startsAt,
    isAllDay: 0,
    color: "#ef4444", // 법정 일정은 빨간색/로즈 계열로 강조
    isCourtDate: true,
  }));

  // 6. 전체 일정 결합 후 정렬
  return [...userEvents, ...courtEventsMapped].sort((a, b) => {
    return (a.startsAt || "").localeCompare(b.startsAt || "");
  });
}

async function createPortalEvent(portalUserId, data) {
  const { title, description, startsAt, endsAt, isAllDay, color } = data;
  if (!title || !title.trim()) throw new ServiceError("일정 제목을 입력해주세요", 400);
  if (!startsAt) throw new ServiceError("시작 일시를 입력해주세요", 400);

  const [inserted] = await db.insert(portalEvents).values({
    portalUserId,
    title: title.trim(),
    description: description || null,
    startsAt,
    endsAt: endsAt || null,
    isAllDay: isAllDay ? 1 : 0,
    color: color || "#6366f1",
  }).returning();

  return inserted;
}

async function updatePortalEvent(id, portalUserId, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalEvents).where(eq(portalEvents.id, id));
  if (!existing) throw new ServiceError("일정을 찾을 수 없습니다", 404);

  if (existing.portalUserId !== portalUserId) {
    throw new ServiceError("수정 권한이 없습니다", 403);
  }

  const { title, description, startsAt, endsAt, isAllDay, color } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (title !== undefined) updates.title = (title || "").trim();
  if (description !== undefined) updates.description = description;
  if (startsAt !== undefined) updates.startsAt = startsAt;
  if (endsAt !== undefined) updates.endsAt = endsAt;
  if (isAllDay !== undefined) updates.isAllDay = isAllDay ? 1 : 0;
  if (color !== undefined) updates.color = color;

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

  if (existing.portalUserId !== portalUserId) {
    throw new ServiceError("삭제 권한이 없습니다", 403);
  }

  await db.delete(portalEvents).where(eq(portalEvents.id, id));
  return { deleted: true };
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

async function createLawyerProfile(email, data) {
  const { name, nameEn, nameHanja, position, team, photoUrl, tagline, education, career, specialties, qualifications, publications, books, media, columns, cases, memberships, consultHours, blogUrl, introduction, phone } = data;
  if (!name || !name.trim()) throw new ServiceError("이름은 필수입니다", 400);

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

module.exports = {
  // 인증
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  // 관리자: 포털 사용자
  listPortalUsers,
  getPortalUser,
  approvePortalUser,
  rejectPortalUser,
  deletePortalUser,
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

  // 캘린더
  listPortalEvents,
  createPortalEvent,
  updatePortalEvent,
  deletePortalEvent,

  // 변호사 프로필
  checkIsAdmin,
  getLawyerProfileByEmail,
  createLawyerProfile,
  updateLawyerProfile,
  listAllLawyers,
  deleteLawyerProfile,
  reorderLawyerProfiles,
};
