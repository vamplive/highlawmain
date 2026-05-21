/**
 * 사건 기록 서비스 — 전자소송 스타일 PDF 문서 관리 비즈니스 로직.
 *
 * - 사건(case_files)에 첨부되는 제출 서류(case_documents)를 관리한다.
 * - 의뢰인 포털에서는 isVisibleToClient = 1 인 문서만 노출되며,
 *   접근하려는 사건의 소유권(clientId 일치)을 항상 검증한다.
 * - 관리자는 모든 문서(비공개 포함)를 보고 메타데이터를 편집할 수 있다.
 *
 * 파일 자체의 디스크 I/O 는 라우트 레이어(case-records.js)에서 multer 가
 * 담당한다. 본 서비스는 DB 레코드만 다룬다.
 */
const { db } = require("../db");
const { caseFilesTable, caseDocuments, lawyers } = require("../db/schema");
const { eq, and, desc } = require("drizzle-orm");
const { ServiceError, validateUUID } = require("./helpers");

/** 의뢰인이 자기 사건의 문서 목록을 조회 — 비공개 문서 제외 */
async function listClientDocuments(caseId, clientId) {
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

  const rows = await db
    .select()
    .from(caseDocuments)
    .where(and(eq(caseDocuments.caseFileId, caseId), eq(caseDocuments.isVisibleToClient, 1)))
    .orderBy(desc(caseDocuments.submissionDate), desc(caseDocuments.createdAt));

  return { caseFile, documents: rows };
}

/** 의뢰인이 단일 문서 상세 조회 — 소유권 + 공개 여부 검증 */
async function getClientDocument(documentId, clientId) {
  validateUUID(documentId);

  const [doc] = await db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.id, documentId));

  if (!doc) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  if (doc.isVisibleToClient !== 1) {
    throw new ServiceError("열람 권한이 없습니다", 403);
  }

  // 사건 소유권 검증 — 다른 의뢰인의 문서를 documentId 추측만으로 열람하지 못하게 한다.
  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(and(eq(caseFilesTable.id, doc.caseFileId), eq(caseFilesTable.clientId, clientId)));

  if (!caseFile) {
    throw new ServiceError("열람 권한이 없습니다", 403);
  }

  return doc;
}

/** 관리자: 사건의 모든 문서 조회 (비공개 포함) */
async function listAdminDocuments(caseId) {
  validateUUID(caseId);

  return db
    .select()
    .from(caseDocuments)
    .where(eq(caseDocuments.caseFileId, caseId))
    .orderBy(desc(caseDocuments.submissionDate), desc(caseDocuments.createdAt));
}

/**
 * 관리자: 새 사건 기록(문서) 등록.
 * 이미 디스크에 저장된 파일 정보(filename/url/size 등)와 사용자가 입력한
 * 메타데이터(documentType/submitter/submissionDate/description)를 병합해 저장한다.
 */
async function createAdminDocument(data) {
  const {
    caseFileId,
    filename,
    url,
    fileSize,
    mimeType,
    originalName,
    documentType,
    submitter,
    submissionDate,
    description,
    isVisibleToClient,
    uploadedBy,
  } = data;

  validateUUID(caseFileId);

  if (!filename || !url) {
    throw new ServiceError("파일 정보가 누락되었습니다", 400);
  }

  // 사건이 실제로 존재하는지 확인 (FK 검증)
  const [caseFile] = await db
    .select()
    .from(caseFilesTable)
    .where(eq(caseFilesTable.id, caseFileId));

  if (!caseFile) {
    throw new ServiceError("사건을 찾을 수 없습니다", 404);
  }

  const [inserted] = await db.insert(caseDocuments).values({
    caseFileId,
    filename,
    url,
    fileSize: fileSize ?? null,
    mimeType: mimeType ?? null,
    originalName: originalName ?? null,
    documentType: documentType?.trim() || null,
    submitter: submitter?.trim() || null,
    submissionDate: submissionDate || null,
    description: description?.trim() || null,
    isVisibleToClient: isVisibleToClient === 0 || isVisibleToClient === false ? 0 : 1,
    uploadedBy: uploadedBy || "admin",
  }).returning();

  return inserted;
}

/** 관리자: 문서 메타데이터 수정 */
async function updateAdminDocument(documentId, data) {
  validateUUID(documentId);

  const [existing] = await db.select().from(caseDocuments).where(eq(caseDocuments.id, documentId));
  if (!existing) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  const updateData = {};
  const META_FIELDS = ["documentType", "submitter", "submissionDate", "description", "originalName"];
  for (const key of META_FIELDS) {
    if (data[key] !== undefined) updateData[key] = data[key] || null;
  }
  if (data.isVisibleToClient !== undefined) {
    updateData.isVisibleToClient = data.isVisibleToClient ? 1 : 0;
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const [updated] = await db
    .update(caseDocuments)
    .set(updateData)
    .where(eq(caseDocuments.id, documentId))
    .returning();

  return updated;
}

/** 관리자: 문서 레코드 삭제. 디스크 파일 삭제는 라우트에서 처리한다. */
async function deleteAdminDocument(documentId) {
  validateUUID(documentId);

  const [existing] = await db.select().from(caseDocuments).where(eq(caseDocuments.id, documentId));
  if (!existing) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  await db.delete(caseDocuments).where(eq(caseDocuments.id, documentId));
  return existing;
}

module.exports = {
  listClientDocuments,
  getClientDocument,
  listAdminDocuments,
  createAdminDocument,
  updateAdminDocument,
  deleteAdminDocument,
};
