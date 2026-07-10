/**
 * 포털 서비스 레이어 — 포털 계정(직원/의뢰인) 비즈니스 로직
 * - 회원가입(승인 대기)/로그인, 관리자 승인/거절
 * - 사건 조회/등록, 메시지 전송, 구글 캘린더 연동
 * - 타임트래킹 (사건별 시간 기록)
 */
const { db, sqlite } = require("../db");
const crypto = require("crypto");
const {
  portalUsers,
  caseFilesTable,
  caseDocuments,
  caseMessages,
  clients,
  clientCases,
  clientRelatedPersons,
  lawyers,
  portalTimeEntries,
  portalPosts,
  portalBoardCategories,
  portalEvents,
  adminUsers,
  courtDates,
  bookingSlots,
} = require("../db/schema");
const { eq, desc, and, or, sql, gte, lte, between, asc, like } = require("drizzle-orm");
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
 * 포털 로그인 — 이메일 또는 전화번호 + 비밀번호
 * isActive 상태에 따라 오류 메시지 분기
 */
async function loginUser(emailOrPhone, password) {
  if (!emailOrPhone || !password) {
    throw new ServiceError("이메일(또는 전화번호)과 비밀번호를 입력해주세요", 400);
  }

  let user;
  const isEmail = EMAIL_REGEX.test(emailOrPhone.trim());

  if (isEmail) {
    const normalizedEmail = emailOrPhone.trim().toLowerCase();
    [user] = await db.select().from(portalUsers).where(eq(portalUsers.email, normalizedEmail));
  } else {
    // 전화번호로 clients 테이블 조회 후 연결된 portal_user 찾기
    const normalizedPhone = cleanPhone(emailOrPhone);
    if (!KOREAN_PHONE_REGEX.test(normalizedPhone)) {
      dummyVerifyPassword();
      throw new ServiceError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
    }
    const [client] = await db.select().from(clients).where(eq(clients.phone, normalizedPhone));
    if (client) {
      [user] = await db.select().from(portalUsers).where(eq(portalUsers.clientId, client.id));
    }
  }

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
      role: portalUsers.role,
      departmentId: portalUsers.departmentId,
      googleConnected: sql`CASE WHEN ${portalUsers.googleRefreshToken} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(portalUsers)
    .where(eq(portalUsers.id, userId));

  // photo_url은 Drizzle 스키마에 없으므로 raw sqlite로 조회
  let photoUrl = null;
  let lawyerPhotoUrl = null;
  if (user?.email) {
    try {
      const puRow = sqlite.prepare("SELECT photo_url FROM portal_users WHERE id = ?").get(userId);
      photoUrl = puRow?.photo_url || null;
      const lwRow = sqlite.prepare("SELECT photo_url FROM lawyers WHERE LOWER(email) = LOWER(?)").get(user.email);
      lawyerPhotoUrl = lwRow?.photo_url || null;
    } catch { /* 무시 */ }
  }

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

  return { user: { ...user, photoUrl, lawyerPhotoUrl }, client: clientInfo };
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
      role: portalUsers.role,
      position: portalUsers.position,
      hireDate: portalUsers.hireDate,
      createdAt: portalUsers.createdAt,
      clientId: portalUsers.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      googleConnected: sql`CASE WHEN ${portalUsers.googleAccessToken} IS NOT NULL THEN 1 ELSE 0 END`,
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
 * 관리자: 포털 사용자 역할/직급 등 필드 수정
 * - role: 역할 분류 (대표변호사 | 변호사 | 전문위원 | 직원 | null)
 */
async function updatePortalUser(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalUsers).where(eq(portalUsers.id, id));
  if (!existing) throw new ServiceError("사용자를 찾을 수 없습니다", 404);

  const allowed = ["role", "position", "departmentId", "hireDate"];
  const updates = {};
  for (const key of allowed) {
    if (key in data) updates[key] = data[key] ?? null;
  }
  if (Object.keys(updates).length === 0) throw new ServiceError("변경할 필드가 없습니다", 400);

  const [updated] = await db.update(portalUsers).set(updates).where(eq(portalUsers.id, id)).returning();
  return updated;
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
  const baseQuery = db
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
      clientId: caseFilesTable.clientId,
      clientName: clients.name,
      visitRoute: caseFilesTable.visitRoute,
      referrerName: caseFilesTable.referrerName,
      registeredAt: caseFilesTable.registeredAt,
      departmentIds: caseFilesTable.departmentIds,
      memberIds: caseFilesTable.memberIds,
      consultantIds: caseFilesTable.consultantIds,
    })
    .from(caseFilesTable)
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .leftJoin(clients, eq(caseFilesTable.clientId, clients.id))
    .orderBy(desc(caseFilesTable.createdAt));

  if (clientId) {
    return baseQuery.where(eq(caseFilesTable.clientId, clientId));
  }
  // Internal users (clientId=null) see all cases
  return baseQuery;
}

/**
 * 포털 사용자가 직접 사건 등록
 * - clientId로 본인 고객 레코드와 연결
 * - 사건번호 입력 시 대법원 API 조회 결과를 함께 저장
 */
async function registerPortalCase(clientId, data) {
  const {
    title, caseNumber, court, caseType, plaintiff, defendant, filedAt, description, status,
    consultantId, consultantName, consultantIds: rawConsultantIds, paymentMethod,
    visitRoute, referrerId, referrerName,
    retainerFee, retainerInstallments, retainerDay,
    successFee, successInstallments, successDay,
    registeredAt, departmentIds, members,
  } = data;
  if (!title || !title.trim()) throw new ServiceError("사건명을 입력해주세요", 400);

  const memberIds = Array.isArray(members) && members.length > 0
    ? JSON.stringify(members.map(m => m.id || m).filter(Boolean))
    : null;
  const consultantIds = Array.isArray(rawConsultantIds) && rawConsultantIds.length > 0
    ? JSON.stringify(rawConsultantIds.map(c => (typeof c === 'object' ? c.id : c)).filter(Boolean))
    : null;

  const [inserted] = await db.insert(caseFilesTable).values({
    clientId,
    title: title.trim(),
    status: status || "접수/상담",
    caseNumber: caseNumber || null,
    court: court || null,
    caseType: caseType || null,
    plaintiff: plaintiff || null,
    defendant: defendant || null,
    filedAt: filedAt || null,
    description: description || null,
    consultantId: consultantId || null,
    consultantName: consultantName || null,
    consultantIds: consultantIds || null,
    paymentMethod: paymentMethod || null,
    visitRoute: visitRoute || null,
    referrerId: referrerId || null,
    referrerName: referrerName || null,
    retainerFee: retainerFee ? parseInt(retainerFee) : null,
    retainerInstallments: retainerInstallments ? parseInt(retainerInstallments) : null,
    retainerDay: retainerDay ? parseInt(retainerDay) : null,
    successFee: successFee ? parseInt(successFee) : null,
    successInstallments: successInstallments ? parseInt(successInstallments) : null,
    successDay: successDay ? parseInt(successDay) : null,
    registeredAt: registeredAt || null,
    departmentIds: departmentIds && Array.isArray(departmentIds) && departmentIds.length > 0 ? JSON.stringify(departmentIds) : null,
    memberIds: memberIds,
  }).returning();

  return inserted;
}


/**
 * 포털 사건 수정 (소유권 확인 후)
 * - 내부 사용자: 모든 사건 수정 가능
 * - 외부 의뢰인: 자신의 사건만 수정 가능
 */
async function updatePortalCase(caseId, clientId, data) {
  validateUUID(caseId);

  const [existing] = await db
    .select({ id: caseFilesTable.id, clientId: caseFilesTable.clientId })
    .from(caseFilesTable)
    .where(clientId
      ? and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId))
      : eq(caseFilesTable.id, caseId));

  if (!existing) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  const allowed = ["title", "caseNumber", "court", "caseType", "plaintiff", "defendant",
                   "filedAt", "description", "status", "lawyerId",
                   "consultantId", "consultantName", "paymentMethod",
                   "visitRoute", "referrerId", "referrerName",
                   "retainerFee", "retainerInstallments", "retainerDay",
                   "successFee", "successInstallments", "successDay",
                   "registeredAt", "departmentIds", "memberIds"];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key] || null;
  }
  // departmentIds: handle separately (JSON stringify)
  if (data.departmentIds !== undefined) {
    updates.departmentIds = Array.isArray(data.departmentIds) && data.departmentIds.length > 0
      ? JSON.stringify(data.departmentIds) : null;
  }
  // members array -> memberIds JSON
  if (data.members !== undefined) {
    const ids = Array.isArray(data.members) ? data.members.map(m => m.id || m).filter(Boolean) : [];
    updates.memberIds = ids.length > 0 ? JSON.stringify(ids) : null;
  }
  // consultantIds array -> consultantIds JSON
  if (data.consultantIds !== undefined) {
    const cids = Array.isArray(data.consultantIds) ? data.consultantIds.map(c => (typeof c === 'object' ? c.id : c)).filter(Boolean) : [];
    updates.consultantIds = cids.length > 0 ? JSON.stringify(cids) : null;
    if (cids.length > 0 && !data.consultantId) updates.consultantId = cids[0];
  }
  if (data.title !== undefined && !data.title?.trim()) {
    throw new ServiceError("사건명을 입력해주세요", 400);
  }
  if (Object.keys(updates).length === 0) throw new ServiceError("변경할 내용이 없습니다", 400);

  updates.updatedAt = new Date().toISOString().replace("T", " ").substring(0, 19);

  const [updated] = await db
    .update(caseFilesTable)
    .set(updates)
    .where(eq(caseFilesTable.id, caseId))
    .returning();

  return updated;
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
      consultantId: caseFilesTable.consultantId,
      consultantName: caseFilesTable.consultantName,
      paymentMethod: caseFilesTable.paymentMethod,
      visitRoute: caseFilesTable.visitRoute,
      referrerId: caseFilesTable.referrerId,
      referrerName: caseFilesTable.referrerName,
      retainerFee: caseFilesTable.retainerFee,
      retainerInstallments: caseFilesTable.retainerInstallments,
      retainerDay: caseFilesTable.retainerDay,
      successFee: caseFilesTable.successFee,
      successInstallments: caseFilesTable.successInstallments,
      successDay: caseFilesTable.successDay,
      registeredAt: caseFilesTable.registeredAt,
      departmentIds: caseFilesTable.departmentIds,
      memberIds: caseFilesTable.memberIds,
      consultantIds: caseFilesTable.consultantIds,
      createdAt: caseFilesTable.createdAt,
      updatedAt: caseFilesTable.updatedAt,
      lawyerName: lawyers.name,
    })
    .from(caseFilesTable)
    .leftJoin(lawyers, eq(caseFilesTable.lawyerId, lawyers.id))
    .where(clientId
      ? and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId))
      : eq(caseFilesTable.id, caseId));

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
    .where(clientId
      ? and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId))
      : eq(caseFilesTable.id, caseId));

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
    .where(clientId
      ? and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId))
      : eq(caseFilesTable.id, caseId));

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
    .orderBy(desc(sql`COALESCE(SUM(${portalTimeEntries.durationMinutes}), 0)`));

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
      attachments: portalPosts.attachments,
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
  const { category, title, content, isPinned, isImportant, attachments } = data;
  if (!title || !title.trim()) throw new ServiceError("제목을 입력해주세요", 400);
  if (!content || !content.trim()) throw new ServiceError("내용을 입력해주세요", 400);

  const [inserted] = await db.insert(portalPosts).values({
    portalUserId,
    category: category || "free",
    title: title.trim(),
    content: content.trim(),
    isPinned: isPinned ? 1 : 0,
    isImportant: isImportant ? 1 : 0,
    attachments: attachments ?? null,
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
      attachments: portalPosts.attachments,
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

  const { category, title, content, isPinned, isImportant, attachments } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (category !== undefined) updates.category = category;
  if (title !== undefined) updates.title = (title || "").trim();
  if (content !== undefined) updates.content = content;
  if (isPinned !== undefined) updates.isPinned = isPinned ? 1 : 0;
  if (isImportant !== undefined) updates.isImportant = isImportant ? 1 : 0;
  if (attachments !== undefined) updates.attachments = attachments ?? null;

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


/**
 * 포털 사용자가 내부 구성원(직원/변호사/관리자)인지 확인
 * - lawyers 테이블에 있거나 admin_users에 있거나 portal_users.role이 설정된 경우
 */
function isInternalPortalUser(userId, email) {
  if (checkIsLawyer(email)) return true;
  if (checkIsAdminByEmail(email)) return true;
  if (userId) {
    const row = sqlite.prepare("SELECT role FROM portal_users WHERE id = ?").get(userId);
    if (row && row.role) return true;
  }
  return false;
}

function checkIsLawyer(email) {
  if (!email) return false;
  const row = sqlite.prepare("SELECT id FROM lawyers WHERE LOWER(email) = LOWER(?)").get(email.trim());
  return !!row;
}

function checkIsAdminByEmail(email) {
  if (!email) return false;
  const row = sqlite.prepare("SELECT id FROM admin_users WHERE LOWER(email) = LOWER(?) AND is_active = 1").get(email.trim());
  return !!row;
}

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

async function listLawyersForOrgChart() {
  // portal_users(직원/변호사 계정) + departments 기반으로 조직도 구성.
  // photo_url 우선순위: lawyers 프로필 사진 > portal_users 업로드 사진
  // portal_users + departments 조인. 변호사 계정이면 lawyers 테이블 사진도 fallback으로 사용
  const rows = sqlite.prepare(`
    SELECT
      pu.id,
      COALESCE(c.name, pu.email) AS name,
      pu.position,
      d.name AS team,
      COALESCE(lw.photo_url, pu.photo_url) AS photo_url,
      pu.email,
      c.phone
    FROM portal_users pu
    LEFT JOIN clients c ON c.id = pu.client_id
    LEFT JOIN departments d ON d.id = pu.department_id
    LEFT JOIN lawyers lw ON LOWER(lw.email) = LOWER(pu.email)
    WHERE pu.is_active = 1
    ORDER BY d.name ASC, c.name ASC
  `).all();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    nameEn: null,
    position: r.position,
    team: r.team,
    photoUrl: r.photo_url,
    tagline: null,
    email: r.email,
    phone: r.phone,
    sortOrder: 0,
  }));
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

// =============================================
// 게시판 카테고리 관리
// =============================================

const DEFAULT_CATEGORIES = [
  { key: "notice", label: "공지사항", color: "#ef4444", sortOrder: 0 },
  { key: "manual", label: "업무 매뉴얼", color: "#3b82f6", sortOrder: 1 },
  { key: "free", label: "자유게시판", color: "#10b981", sortOrder: 2 },
  { key: "template", label: "양식", color: "#8b5cf6", sortOrder: 3 },
];

async function listBoardCategories() {
  const [{ cnt }] = await db.select({ cnt: sql`count(*)` }).from(portalBoardCategories);
  if (!cnt || cnt === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.insert(portalBoardCategories).values(cat).run();
    }
  }
  return db.select().from(portalBoardCategories).orderBy(asc(portalBoardCategories.sortOrder));
}

async function createBoardCategory(createdBy, data) {
  const { key, label, color, sortOrder } = data;
  if (!key || !key.trim()) throw new ServiceError("카테고리 키를 입력해주세요", 400);
  if (!label || !label.trim()) throw new ServiceError("카테고리 이름을 입력해주세요", 400);

  const [existing] = await db.select().from(portalBoardCategories).where(eq(portalBoardCategories.key, key.trim()));
  if (existing) throw new ServiceError("이미 존재하는 카테고리 키입니다", 409);

  const [inserted] = await db.insert(portalBoardCategories).values({
    key: key.trim(),
    label: label.trim(),
    color: color || "#64748b",
    sortOrder: sortOrder ?? 99,
    createdBy: createdBy || null,
  }).returning();

  return inserted;
}

async function updateBoardCategory(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(portalBoardCategories).where(eq(portalBoardCategories.id, id));
  if (!existing) throw new ServiceError("카테고리를 찾을 수 없습니다", 404);

  const { label, color, sortOrder } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (label !== undefined) updates.label = (label || "").trim();
  if (color !== undefined) updates.color = color;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [updated] = await db
    .update(portalBoardCategories)
    .set(updates)
    .where(eq(portalBoardCategories.id, id))
    .returning();

  return updated;
}

async function deleteBoardCategory(id) {
  validateUUID(id);
  const [existing] = await db.select().from(portalBoardCategories).where(eq(portalBoardCategories.id, id));
  if (!existing) throw new ServiceError("카테고리를 찾을 수 없습니다", 404);
  await db.delete(portalBoardCategories).where(eq(portalBoardCategories.id, id));
  return { deleted: true };
}

// =============================================
// 구성원 미팅 예약 시스템
// =============================================

sqlite.exec(`CREATE TABLE IF NOT EXISTS portal_bookings (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location TEXT,
  attendee_ids TEXT DEFAULT '',
  event_ids TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

function _enrichMember(u) {
  let name = u.email;
  let photo_url = null;
  if (u.client_id) {
    const c = sqlite.prepare("SELECT name FROM clients WHERE id = ?").get(u.client_id);
    if (c?.name) name = c.name;
  }
  const l = sqlite.prepare("SELECT name, photo_url FROM lawyers WHERE LOWER(email) = LOWER(?)").get(u.email);
  if (l?.name) name = l.name;
  if (l?.photo_url) photo_url = l.photo_url;
  return { id: u.id, email: u.email, name, photo_url };
}

function _getMemberInfo(id) {
  const u = sqlite.prepare("SELECT id, email, client_id FROM portal_users WHERE id = ?").get(id);
  if (!u) return null;
  return _enrichMember(u);
}

function listPortalMembers() {
  const users = sqlite.prepare("SELECT id, email, client_id FROM portal_users WHERE is_active = 1").all();
  return users.map(_enrichMember).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function listMemberBookings(portalUserId) {
  const rows = sqlite.prepare(`
    SELECT * FROM portal_bookings
    WHERE status = 'confirmed'
      AND (
        organizer_id = ?
        OR (',' || COALESCE(attendee_ids,'') || ',') LIKE ('%,' || ? || ',%')
      )
    ORDER BY starts_at ASC
  `).all(portalUserId, portalUserId);

  return rows.map(row => {
    const organizer = _getMemberInfo(row.organizer_id) || { name: null, photo_url: null };
    const attendeeIds = row.attendee_ids ? row.attendee_ids.split(",").filter(Boolean) : [];
    const attendees = attendeeIds.map(id => _getMemberInfo(id)).filter(Boolean);
    return {
      id: row.id,
      organizerId: row.organizer_id,
      organizerName: organizer.name,
      organizerPhoto: organizer.photo_url,
      title: row.title,
      description: row.description,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      location: row.location,
      attendees,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

function createMemberBooking(organizerId, data) {
  const { title, description, startsAt, endsAt, location, attendeeIds = [] } = data;
  if (!title || !title.trim()) throw new ServiceError("제목을 입력해주세요", 400);
  if (!startsAt) throw new ServiceError("시작 시간을 입력해주세요", 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const uniqueAttendees = attendeeIds.filter(aid => aid !== organizerId);
  const allParticipants = [organizerId, ...uniqueAttendees];
  const eventIds = [];

  for (const userId of allParticipants) {
    const eventId = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO portal_events
        (id, portal_user_id, title, description, starts_at, ends_at, is_all_day, color, attendee_ids, location, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, '#3b82f6', ?, ?, 'booking', ?, ?)
    `).run(eventId, userId, title.trim(), description || null, startsAt, endsAt || null, uniqueAttendees.join(","), location || null, now, now);
    eventIds.push(eventId);
  }

  sqlite.prepare(`
    INSERT INTO portal_bookings
      (id, organizer_id, title, description, starts_at, ends_at, location, attendee_ids, event_ids, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
  `).run(id, organizerId, title.trim(), description || null, startsAt, endsAt || null, location || null, uniqueAttendees.join(","), eventIds.join(","), now, now);

  const organizer = _getMemberInfo(organizerId);
  const attendees = uniqueAttendees.map(aid => _getMemberInfo(aid)).filter(Boolean);
  return {
    id, organizerId,
    organizerName: organizer?.name || null,
    organizerPhoto: organizer?.photo_url || null,
    title: title.trim(), description, startsAt, endsAt, location,
    attendees, status: "confirmed", createdAt: now,
  };
}

function cancelMemberBooking(bookingId, portalUserId) {
  const booking = sqlite.prepare("SELECT * FROM portal_bookings WHERE id = ?").get(bookingId);
  if (!booking) throw new ServiceError("예약을 찾을 수 없습니다", 404);
  if (booking.organizer_id !== portalUserId) throw new ServiceError("예약 생성자만 취소할 수 있습니다", 403);
  if (booking.status === "cancelled") throw new ServiceError("이미 취소된 예약입니다", 400);

  const eventIds = booking.event_ids ? booking.event_ids.split(",").filter(Boolean) : [];
  for (const eventId of eventIds) {
    sqlite.prepare("DELETE FROM portal_events WHERE id = ?").run(eventId);
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  sqlite.prepare("UPDATE portal_bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, bookingId);

  return { ok: true };
}

// =============================================
// 고객 관리 (내부 구성원 전용)
// =============================================

async function listPortalClients(query) {
  const { page, limit, offset } = parsePagination(query);
  const { q } = query;

  let whereClause = eq(clients.isActive, 1);
  if (q && q.trim()) {
    const term = "%" + q.trim() + "%";
    whereClause = and(
      eq(clients.isActive, 1),
      sql`(${clients.name} LIKE ${term} OR ${clients.phone} LIKE ${term} OR COALESCE(${clients.email},'') LIKE ${term})`
    );
  }

  const [{ total }] = await db.select({ total: sql`count(*)` })
    .from(clients)
    .where(whereClause);

  const rows = await db.select({
    id: clients.id,
    name: clients.name,
    phone: clients.phone,
    email: clients.email,
    category: clients.category,
    memo: clients.memo,
    source: clients.source,
    createdAt: clients.createdAt,
    updatedAt: clients.updatedAt,
  })
    .from(clients)
    .where(whereClause)
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

async function createPortalClient(data) {
  const { name, phone, email, category, memo } = data;
  if (!name || !name.trim()) throw new ServiceError("이름을 입력해주세요", 400);
  if (!phone || !phone.trim()) throw new ServiceError("전화번호를 입력해주세요", 400);

  const [inserted] = await db.insert(clients).values({
    name: name.trim(),
    phone: cleanPhone(phone) || phone.trim(),
    email: email || null,
    category: category || null,
    memo: memo || null,
    source: "manual",
    isActive: 1,
  }).returning();

  return inserted;
}

async function updatePortalClient(id, data) {
  validateUUID(id);
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) throw new ServiceError("고객을 찾을 수 없습니다", 404);

  const { name, phone, email, category, memo } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (name !== undefined) updates.name = (name || "").trim();
  if (phone !== undefined) updates.phone = cleanPhone(phone) || (phone || "").trim();
  if (email !== undefined) updates.email = email || null;
  if (category !== undefined) updates.category = category || null;
  if (memo !== undefined) updates.memo = memo || null;

  const [updated] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
  return updated;
}

async function deletePortalClient(id) {
  validateUUID(id);
  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) throw new ServiceError("고객을 찾을 수 없습니다", 404);
  await db.delete(clients).where(eq(clients.id, id));
  return { deleted: true };
}

async function listClientCases(clientId) {
  validateUUID(clientId);
  return db.select()
    .from(clientCases)
    .where(eq(clientCases.clientId, clientId))
    .orderBy(asc(clientCases.createdAt));
}

async function createClientCase(clientId, data) {
  validateUUID(clientId);
  const { caseNumber, jurisdiction, memo } = data;

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new ServiceError("고객을 찾을 수 없습니다", 404);

  const [inserted] = await db.insert(clientCases).values({
    clientId,
    caseNumber: caseNumber || null,
    jurisdiction: jurisdiction || null,
    memo: memo || null,
  }).returning();

  return inserted;
}

async function updateClientCase(clientId, caseId, data) {
  validateUUID(clientId);
  validateUUID(caseId);

  const [existing] = await db.select().from(clientCases)
    .where(and(eq(clientCases.id, caseId), eq(clientCases.clientId, clientId)));
  if (!existing) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  const { caseNumber, jurisdiction, memo } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (caseNumber !== undefined) updates.caseNumber = caseNumber || null;
  if (jurisdiction !== undefined) updates.jurisdiction = jurisdiction || null;
  if (memo !== undefined) updates.memo = memo || null;

  const [updated] = await db.update(clientCases).set(updates)
    .where(eq(clientCases.id, caseId)).returning();
  return updated;
}

async function deleteClientCase(clientId, caseId) {
  validateUUID(clientId);
  validateUUID(caseId);

  const [existing] = await db.select().from(clientCases)
    .where(and(eq(clientCases.id, caseId), eq(clientCases.clientId, clientId)));
  if (!existing) throw new ServiceError("사건을 찾을 수 없습니다", 404);

  await db.delete(clientCases).where(eq(clientCases.id, caseId));
  return { deleted: true };
}

async function listClientPersons(clientId) {
  validateUUID(clientId);
  return db.select()
    .from(clientRelatedPersons)
    .where(eq(clientRelatedPersons.clientId, clientId))
    .orderBy(asc(clientRelatedPersons.createdAt));
}

async function createClientPerson(clientId, data) {
  validateUUID(clientId);
  const { name, phone, role } = data;
  if (!name || !name.trim()) throw new ServiceError("이름을 입력해주세요", 400);

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new ServiceError("고객을 찾을 수 없습니다", 404);

  const [inserted] = await db.insert(clientRelatedPersons).values({
    clientId,
    name: name.trim(),
    phone: phone || null,
    role: role || null,
  }).returning();

  return inserted;
}

async function updateClientPerson(clientId, personId, data) {
  validateUUID(clientId);
  validateUUID(personId);

  const [existing] = await db.select().from(clientRelatedPersons)
    .where(and(eq(clientRelatedPersons.id, personId), eq(clientRelatedPersons.clientId, clientId)));
  if (!existing) throw new ServiceError("관련자를 찾을 수 없습니다", 404);

  const { name, phone, role } = data;
  const updates = { updatedAt: sql`(datetime('now'))` };
  if (name !== undefined) updates.name = (name || "").trim();
  if (phone !== undefined) updates.phone = phone || null;
  if (role !== undefined) updates.role = role || null;

  const [updated] = await db.update(clientRelatedPersons).set(updates)
    .where(eq(clientRelatedPersons.id, personId)).returning();
  return updated;
}

async function deleteClientPerson(clientId, personId) {
  validateUUID(clientId);
  validateUUID(personId);

  const [existing] = await db.select().from(clientRelatedPersons)
    .where(and(eq(clientRelatedPersons.id, personId), eq(clientRelatedPersons.clientId, clientId)));
  if (!existing) throw new ServiceError("관련자를 찾을 수 없습니다", 404);

  await db.delete(clientRelatedPersons).where(eq(clientRelatedPersons.id, personId));
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

// =============================================
// 아이디 찾기 / 비밀번호 재설정
// =============================================

/** 재설정 토큰 만료 시간: 30분 */
const PORTAL_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

/** 평문 토큰 → SHA-256 hex (DB 저장용) */
function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/**
 * 전화번호로 이메일(아이디) 찾기
 * - 마스킹된 이메일 반환 (예: ab****@gmail.com)
 * - 계정 없으면 null 반환 (클라이언트에서 "일치 없음" 처리)
 */
async function findEmailByPhone(phone) {
  if (!phone) throw new ServiceError("휴대폰 번호를 입력해주세요", 400);
  const normalizedPhone = cleanPhone(phone);
  if (!KOREAN_PHONE_REGEX.test(normalizedPhone)) {
    throw new ServiceError("올바른 휴대폰 번호를 입력해주세요", 400);
  }

  const [client] = await db.select().from(clients).where(eq(clients.phone, normalizedPhone));
  if (!client) return null;

  const [user] = await db.select()
    .from(portalUsers)
    .where(and(eq(portalUsers.clientId, client.id), eq(portalUsers.isActive, 1)));
  if (!user) return null;

  // 이메일 앞부분 2자리 + **** + @ 이후 도메인
  const email = user.email;
  const atIdx = email.indexOf("@");
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  const visible = local.length <= 2 ? local : local.slice(0, 2);
  const masked = visible + "****" + domain;

  return { maskedEmail: masked };
}

/**
 * 비밀번호 재설정 링크 발송
 * - 이메일 입력 시 → 이메일 발송
 * - 전화번호 입력 시 → SMS 발송 (카카오톡 앱에서 열 수 있는 링크 포함)
 * - 사용자 존재 여부를 응답에서 노출하지 않음
 */
async function createPortalResetToken(input) {
  const { sendEmail } = require("../lib/email-service");
  const { sendSMS } = require("../lib/sms-service");

  if (!input) throw new ServiceError("이메일 또는 휴대폰 번호를 입력해주세요", 400);

  let user = null;
  let phoneForSMS = null;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
  if (isEmail) {
    [user] = await db.select().from(portalUsers)
      .where(and(eq(portalUsers.email, input.trim().toLowerCase()), eq(portalUsers.isActive, 1)));
  } else {
    const normalizedPhone = cleanPhone(input);
    if (!KOREAN_PHONE_REGEX.test(normalizedPhone)) {
      throw new ServiceError("올바른 이메일 또는 휴대폰 번호를 입력해주세요", 400);
    }
    phoneForSMS = normalizedPhone;
    const [client] = await db.select().from(clients).where(eq(clients.phone, normalizedPhone));
    if (client) {
      [user] = await db.select().from(portalUsers)
        .where(and(eq(portalUsers.clientId, client.id), eq(portalUsers.isActive, 1)));
    }
  }

  // 사용자가 없어도 동일하게 응답 (존재 여부 노출 방지)
  if (!user) {
    hashResetToken(crypto.randomBytes(32).toString("hex")); // timing 평준화
    return { sent: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = Date.now() + PORTAL_RESET_TOKEN_TTL_MS;

  await db.update(portalUsers).set({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: expiresAt,
    updatedAt: sql`(datetime('now'))`,
  }).where(eq(portalUsers.id, user.id));

  const appUrl = process.env.APP_URL || "https://highlaw.co.kr";
  const resetUrl = `${appUrl.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;

  if (phoneForSMS) {
    // 전화번호로 요청 → SMS 발송 (카카오톡에서도 링크 열림)
    const smsText = `[법무법인 하이로] 포털 비밀번호 재설정 링크입니다.\n아래 링크를 클릭해 30분 내에 비밀번호를 변경해주세요.\n${resetUrl}\n\n본인 요청이 아니면 무시하세요.`;
    await sendSMS(phoneForSMS, smsText, { title: "포털 비밀번호 재설정" });
  } else {
    // 이메일로 요청 → 이메일 발송
    const html = `
      <div style="font-family: -apple-system, 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a; margin: 0 0 16px;">비밀번호 재설정</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.<br />
          링크는 <strong>30분간</strong> 유효합니다.
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 28px; background: #1a1a1a; color: #fff;
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
            비밀번호 재설정
          </a>
        </div>
        <p style="color: #8a8a8a; font-size: 12px; line-height: 1.5; word-break: break-all;">
          버튼이 작동하지 않으면 아래 주소를 복사해 브라우저에 붙여넣으세요:<br />
          ${resetUrl}
        </p>
        <p style="color: #8a8a8a; font-size: 12px; line-height: 1.5; margin-top: 24px;">
          본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 11px;">법무법인 하이로 CLIENT PORTAL</p>
      </div>
    `;
    await sendEmail(user.email, "[법무법인 하이로] 포털 비밀번호 재설정 안내", html);
  }

  return { sent: true, via: phoneForSMS ? "sms" : "email" };
}

/**
 * 재설정 토큰 검증 후 새 비밀번호 적용
 * - 토큰 만료/미존재/비활성 시 동일한 오류 반환
 * - 성공 시 비밀번호 교체 + 토큰 폐기 + 기존 세션 전체 무효화
 */
async function resetPortalPassword(token, newPassword) {
  if (!token || typeof token !== "string") {
    throw new ServiceError("토큰이 올바르지 않습니다", 400);
  }
  if (token.length !== 64 || !/^[0-9a-f]+$/i.test(token)) {
    throw new ServiceError("토큰이 유효하지 않거나 만료되었습니다", 400);
  }
  if (!newPassword || newPassword.length < 8) {
    throw new ServiceError("비밀번호는 8자 이상이어야 합니다", 400);
  }
  if (newPassword.length > 256) {
    throw new ServiceError("비밀번호는 256자 이하로 입력해주세요", 400);
  }

  const tokenHash = hashResetToken(token);
  const [user] = await db.select().from(portalUsers)
    .where(eq(portalUsers.resetTokenHash, tokenHash));

  const INVALID_MSG = "토큰이 유효하지 않거나 만료되었습니다";
  if (!user || user.isActive !== 1 || !user.resetTokenExpiresAt) {
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32)); // timing 평준화
    throw new ServiceError(INVALID_MSG, 400);
  }
  if (Date.now() > Number(user.resetTokenExpiresAt)) {
    throw new ServiceError(INVALID_MSG, 400);
  }

  // timing-safe 비교
  const stored = Buffer.from(user.resetTokenHash || "", "hex");
  const provided = Buffer.from(tokenHash, "hex");
  if (stored.length !== provided.length || !crypto.timingSafeEqual(stored, provided)) {
    throw new ServiceError(INVALID_MSG, 400);
  }

  const newHash = hashPassword(newPassword);

  await db.update(portalUsers).set({
    passwordHash: newHash,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    updatedAt: sql`(datetime('now'))`,
  }).where(eq(portalUsers.id, user.id));

  // 기존 세션 전체 무효화 (다른 기기 로그인 강제 로그아웃)
  const { deleteAllPortalSessionsForUser } = require("../lib/auth");
  if (typeof deleteAllPortalSessionsForUser === "function") {
    deleteAllPortalSessionsForUser(user.id);
  }

  return { success: true };
}

/**
 * 이번 달 유입 경로 + 매출 통계
 * 지인 소개 건은 착수금/성공보수에 20% 할인 적용
 */
async function getMonthlyCaseStats(year, month) {
  // 수임일(registered_at) 기준으로 해당 월과 연관된 사건 조회
  // - 수임일이 query 월인 사건: 유입경로 통계 + 비할부 매출 집계
  // - 할부 사건: 수임월부터 N개월치 각 월에 월납입액 분산
  const rows = sqlite.prepare(
    `SELECT visit_route, referrer_id, referrer_name,
            retainer_fee, retainer_installments,
            success_fee, success_installments,
            COALESCE(registered_at, created_at) AS effective_date
     FROM case_files
     WHERE effective_date IS NOT NULL`
  ).all();

  const routeMap = {};
  let retainerTotal = 0;
  let successTotal = 0;
  const externalReferrerMap = {};
  let totalCases = 0;

  for (const row of rows) {
    const effectiveDate = row.effective_date;
    if (!effectiveDate) continue;

    const regYear  = parseInt(effectiveDate.substr(0, 4), 10);
    const regMonth = parseInt(effectiveDate.substr(5, 2), 10);
    // 수임월로부터 query월까지의 개월 차이 (0 = 수임월)
    const monthDiff = (year - regYear) * 12 + (month - regMonth);

    // 유입경로 통계: 수임월에만 카운트
    if (monthDiff === 0) {
      totalCases++;
      const r = row.visit_route || "(미입력)";
      routeMap[r] = (routeMap[r] || 0) + 1;
    }

    const isExternalReferral = row.visit_route === "지인" && !row.referrer_id;
    const discount = isExternalReferral ? 0.8 : 1.0;

    // 착수금: 해당 월에 납입 예정인 회차인지 확인
    const retN = Math.max(1, row.retainer_installments || 1);
    if (monthDiff >= 0 && monthDiff < retN && row.retainer_fee) {
      const monthly = Math.round(row.retainer_fee / retN);
      retainerTotal += Math.round(monthly * discount);
      // 외부 소개인 수당: 수임월(첫 납입월)에만 집계
      if (monthDiff === 0 && isExternalReferral && row.referrer_name) {
        const name = row.referrer_name;
        if (!externalReferrerMap[name]) externalReferrerMap[name] = { retainerCommission: 0, successCommission: 0, count: 0 };
        externalReferrerMap[name].retainerCommission += Math.round(row.retainer_fee * 0.2);
        externalReferrerMap[name].count += 1;
      }
    }

    // 성공보수: 해당 월에 납입 예정인 회차인지 확인
    const sucN = Math.max(1, row.success_installments || 1);
    if (monthDiff >= 0 && monthDiff < sucN && row.success_fee) {
      const monthly = Math.round(row.success_fee / sucN);
      successTotal += Math.round(monthly * discount);
      if (monthDiff === 0 && isExternalReferral && row.referrer_name) {
        const name = row.referrer_name;
        if (!externalReferrerMap[name]) externalReferrerMap[name] = { retainerCommission: 0, successCommission: 0, count: 0 };
        externalReferrerMap[name].successCommission += Math.round(row.success_fee * 0.2);
      }
    }
  }

  const routes = Object.entries(routeMap)
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count);

  const externalReferrers = Object.entries(externalReferrerMap)
    .map(([name, v]) => ({ name, ...v, total: v.retainerCommission + v.successCommission }))
    .sort((a, b) => b.total - a.total);

  return {
    routes,
    revenue: { retainerTotal, successTotal, total: retainerTotal + successTotal },
    externalReferrers,
    year, month, totalCases,
  };
}


/**
 * 할부 납입 예정 목록
 * payment_method = "무통장입금" 인 사건만 반환 (강민구는 카드도 포함하여 구분)
 */
/**
 * 소송위임계약서 목록 조회
 * document_type = 'litigation_agreement' 인 서류
 */
function getLitigationAgreements({ search, from, to, caseId } = {}) {
  let query = `
    SELECT
      d.id,
      d.case_file_id AS caseFileId,
      d.filename,
      d.original_name AS originalName,
      d.url,
      d.file_size AS fileSize,
      d.mime_type AS mimeType,
      d.created_at AS createdAt,
      cf.title AS caseTitle
    FROM case_documents d
    LEFT JOIN case_files cf ON cf.id = d.case_file_id
    WHERE d.document_type = 'litigation_agreement'
  `;
  const params = [];

  if (caseId) {
    query += ' AND d.case_file_id = ?';
    params.push(caseId);
  }
  if (from) {
    query += ' AND date(d.created_at) >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date(d.created_at) <= ?';
    params.push(to);
  }
  if (search) {
    query += ' AND (d.filename LIKE ? OR cf.title LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%');
  }

  query += ' ORDER BY d.created_at DESC LIMIT 500';
  return sqlite.prepare(query).all(...params);
}

function getUpcomingPayments() {
  const rows = sqlite.prepare(
    `SELECT id, title, retainer_fee, retainer_installments, retainer_day,
            success_fee, success_installments, success_day,
            payment_method, visit_route
     FROM case_files
     WHERE status NOT IN ('완료')
       AND (
         (retainer_installments IS NOT NULL AND retainer_installments > 1)
         OR (success_installments IS NOT NULL AND success_installments > 1)
       )`
  ).all();

  const now = new Date();
  const results = [];

  for (const row of rows) {
    const pm = row.payment_method || '무통장입금';
    const title = row.title || '';
    // extract client from "의뢰인_사건명" format
    const clientName = title.includes('_') ? title.split('_')[0] : title;

    if (row.retainer_installments > 1 && row.retainer_fee) {
      const monthly = Math.round(row.retainer_fee / row.retainer_installments);
      const remaining = row.retainer_installments;
      if (remaining > 0) {
        results.push({
          caseTitle: title,
          clientName,
          type: '착수금',
          paymentMethod: pm,
          monthlyAmount: monthly,
          dueDay: row.retainer_day || 1,
          paidCount: 0,
          totalInstallments: row.retainer_installments,
          remainingCount: remaining,
        });
      }
    }

    if (row.success_installments > 1 && row.success_fee) {
      const monthly = Math.round(row.success_fee / row.success_installments);
      const remaining = row.success_installments;
      if (remaining > 0) {
        results.push({
          caseTitle: title,
          clientName,
          type: '성공보수',
          paymentMethod: pm,
          monthlyAmount: monthly,
          dueDay: row.success_day || 1,
          paidCount: 0,
          totalInstallments: row.success_installments,
          remainingCount: remaining,
        });
      }
    }
  }

  // 납일 기준 정렬
  results.sort((a, b) => a.dueDay - b.dueDay);
  return results;
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
  updatePortalUser,
  deletePortalUser,
  // 사건
  getUserCases,
  registerPortalCase,
  updatePortalCase,
  getMonthlyCaseStats,
  getLitigationAgreements,
  getUpcomingPayments,
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
  isInternalPortalUser,
  checkIsLawyer,
  checkIsAdminByEmail,
  checkIsAdmin,
  getLawyerProfileByEmail,
  createLawyerProfile,
  updateLawyerProfile,
  listAllLawyers,
  listLawyersForOrgChart,
  deleteLawyerProfile,
  reorderLawyerProfiles,

  // 게시판 카테고리
  listBoardCategories,
  createBoardCategory,
  updateBoardCategory,
  deleteBoardCategory,

  // 구성원 미팅 예약
  listPortalMembers,
  listMemberBookings,
  createMemberBooking,
  cancelMemberBooking,

  // 고객 관리
  listPortalClients,
  createPortalClient,
  updatePortalClient,
  deletePortalClient,
  listClientCases,
  createClientCase,
  updateClientCase,
  deleteClientCase,
  listClientPersons,
  createClientPerson,
  updateClientPerson,
  deleteClientPerson,

  // 아이디 찾기 / 비밀번호 재설정
  findEmailByPhone,
  createPortalResetToken,
  resetPortalPassword,
  changePortalPassword,
};

async function changePortalPassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new ServiceError("새 비밀번호는 8자 이상이어야 합니다", 400);
  }
  if (newPassword.length > 256) {
    throw new ServiceError("비밀번호는 256자 이하로 입력해주세요", 400);
  }

  const [user] = await db.select().from(portalUsers).where(eq(portalUsers.id, userId));
  if (!user) throw new ServiceError("사용자를 찾을 수 없습니다", 404);

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new ServiceError("현재 비밀번호가 올바르지 않습니다", 401);
  }

  const newHash = hashPassword(newPassword);
  await db.update(portalUsers).set({ passwordHash: newHash }).where(eq(portalUsers.id, userId));
  return { success: true };
}
