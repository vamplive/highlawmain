/**
 * 포털 서비스 레이어 — 의뢰인 포털 비즈니스 로직
 * - 회원가입/로그인, 사건 조회, 메시지 전송, 관리자 사건 관리
 */
const { db } = require("../db");
const { portalUsers, caseFilesTable, caseDocuments, caseMessages, clients, lawyers } = require("../db/schema");
const { eq, desc, and, sql } = require("drizzle-orm");
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

/**
 * 포털 회원가입
 * @param {{ email: string, password: string, name: string, phone: string }} data
 * @returns {Promise<{ id: string, email: string, clientId: string }>}
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

  // 이메일 중복 체크
  const [existingUser] = await db
    .select()
    .from(portalUsers)
    .where(eq(portalUsers.email, normalizedEmail));

  if (existingUser) {
    throw new ServiceError("이미 가입된 이메일입니다", 409);
  }

  // 전화번호로 기존 고객 매칭
  const normalizedPhone = cleanPhone(phone);
  const [matchedClient] = await db
    .select()
    .from(clients)
    .where(eq(clients.phone, normalizedPhone));

  const passwordHash = hashPassword(password);

  const [created] = await db.insert(portalUsers).values({
    email: normalizedEmail,
    passwordHash,
    clientId: matchedClient ? matchedClient.id : null,
  }).returning();

  // 매칭된 고객이 없으면 새 고객 레코드 생성
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

  return { id: created.id, email: created.email, clientId: created.clientId };
}

/**
 * 포털 로그인 — 인증 후 세션 토큰 발급 (SQLite 세션)
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
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
    // 사용자 미존재 시에도 동일한 비용을 소비하여 응답 시간 차로
    // 가입 여부가 노출되지 않도록 한다.
    dummyVerifyPassword();
    throw new ServiceError("이메일 또는 비밀번호가 올바르지 않습니다", 401);
  }

  if (!user.isActive) {
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

/**
 * 포털 로그아웃
 * @param {string|null} token
 */
function logoutUser(token) {
  if (token) {
    deletePortalSession(token);
  }
}

/**
 * 현재 사용자 프로필 조회 (user + client 정보)
 * @param {string} userId
 * @param {string|null} clientId
 * @returns {Promise<{ user: object, client: object|null }>}
 */
async function getUserProfile(userId, clientId) {
  const [user] = await db
    .select({ id: portalUsers.id, email: portalUsers.email, clientId: portalUsers.clientId })
    .from(portalUsers)
    .where(eq(portalUsers.id, userId));

  let clientInfo = null;
  if (clientId) {
    // 포털 사용자에게는 본인 식별·연락처만 노출. memo(관리자 메모), tags(세그먼트),
    // source(유입경로), consultationId 등 내부 운영 필드는 응답에서 제외한다.
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

/**
 * 의뢰인의 사건 목록 조회 — 담당 변호사 이름까지 join.
 * @param {string|null} clientId
 * @returns {Promise<Array>}
 */
async function getUserCases(clientId) {
  if (!clientId) {
    return [];
  }

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
 * 사건 상세 조회 (문서 + 최근 메시지 포함, 소유권 검증)
 * 의뢰인에게 노출되는 문서는 is_visible_to_client = 1 만 반환한다.
 * @param {string} caseId
 * @param {string} clientId
 * @returns {Promise<object>}
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

  if (!caseFile) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

  // 의뢰인에게는 isVisibleToClient = 1 인 문서만 보여준다 (관리자 내부 메모/초안 제외).
  // 정렬 순서는 전자소송과 동일하게 제출일자 내림차순 → 등록일 내림차순.
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
 * @param {string} caseId
 * @param {string} clientId
 * @param {{ page?: string, limit?: string }} pagination
 * @returns {Promise<{ data: Array, meta: object }>}
 */
async function getCaseMessages(caseId, clientId, pagination) {
  validateUUID(caseId);

  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

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
 * @param {string} caseId
 * @param {string} clientId
 * @param {string} userId
 * @param {string} content
 * @returns {Promise<object>}
 */
async function sendClientMessage(caseId, clientId, userId, content) {
  validateUUID(caseId);

  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(and(eq(caseFilesTable.id, caseId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

  if (!content || !content.trim()) {
    throw new ServiceError("메시지 내용을 입력해주세요", 400);
  }

  const [inserted] = await db.insert(caseMessages).values({
    caseFileId: caseId,
    senderId: userId,
    senderType: "client",
    content: content.trim(),
  }).returning();

  return inserted;
}

/**
 * 관리자 사건 목록 (페이지네이션) — 의뢰인/변호사 이름까지 join 한다.
 * 관리자 화면에서 행마다 누가 누구의 사건인지 한 눈에 보이도록 하기 위함.
 * @param {{ page?: string, limit?: string }} pagination
 * @returns {Promise<{ data: Array, meta: object }>}
 */
async function listAdminCases(pagination) {
  const { page, limit, offset } = parsePagination(pagination);

  // Drizzle 의 leftJoin 으로 client/lawyer 이름까지 한 번에 가져온다.
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

  const [{ total }] = await db
    .select({ total: sql`count(*)` })
    .from(caseFilesTable);

  return { data: rows, meta: buildPaginationMeta(total, page, limit) };
}

/**
 * 관리자: 사건 단건 조회 (이름 join 포함).
 * @param {string} id
 */
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

  if (!row) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }
  return row;
}

/** 관리자: 사건 메시지 목록 (페이지네이션) — 권한 검증 없음 (관리자 전체 접근). */
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

  // 변호사 → 의뢰인 → 변호사 흐름이 자연스럽게 보이도록 시간 오름차순으로 뒤집어 반환.
  return { data: rows.reverse(), meta: buildPaginationMeta(total, page, limit) };
}

/** 관리자: 사건 삭제 (cascade 로 문서/메시지도 함께 제거된다) */
async function deleteAdminCase(id) {
  validateUUID(id);
  const [existing] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
  if (!existing) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }
  await db.delete(caseFilesTable).where(eq(caseFilesTable.id, id));
  return { deleted: true };
}

/** 사건 메타데이터 화이트리스트 — 관리자 입력에서 허용하는 필드 키 */
const CASE_META_FIELDS = [
  "status",
  "description",
  "title",
  "lawyerId",
  "caseNumber",
  "court",
  "caseType",
  "plaintiff",
  "defendant",
  "filedAt",
];

/**
 * 관리자 사건 생성
 * @param {object} data — clientId, title 필수. 나머지 사건 메타 필드는 선택.
 * @returns {Promise<object>}
 */
async function createAdminCase(data) {
  const { clientId, title } = data;

  validateUUID(clientId);

  if (!title || !title.trim()) {
    throw new ServiceError("사건 제목을 입력해주세요", 400);
  }

  const insertValues = {
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
  };

  const [inserted] = await db.insert(caseFilesTable).values(insertValues).returning();

  return inserted;
}

/**
 * 관리자 사건 수정 — 화이트리스트 필드만 업데이트.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
async function updateAdminCase(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
  if (!existing) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

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

/**
 * 변호사(관리자) 메시지 전송
 * @param {string} caseId
 * @param {string} content
 * @returns {Promise<object>}
 */
async function sendLawyerMessage(caseId, content) {
  validateUUID(caseId);

  const [caseFile] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, caseId));
  if (!caseFile) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

  if (!content || !content.trim()) {
    throw new ServiceError("메시지 내용을 입력해주세요", 400);
  }

  const [inserted] = await db.insert(caseMessages).values({
    caseFileId: caseId,
    senderType: "lawyer",
    content: content.trim(),
  }).returning();

  return inserted;
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getUserCases,
  getCaseDetail,
  getCaseMessages,
  sendClientMessage,
  listAdminCases,
  getAdminCase,
  listAdminCaseMessages,
  deleteAdminCase,
  createAdminCase,
  updateAdminCase,
  sendLawyerMessage,
};
