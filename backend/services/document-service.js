/**
 * 문서 서비스 — 문서 CRUD 비즈니스 로직
 * 라우트 핸들러에서 HTTP 관심사를 분리하여 순수 데이터 조작만 담당한다.
 */
const { db, sqlite, searchFTSWithSnippet } = require("../db");
const {
  documents,
  documentCategories,
  categories,
  collections,
  documentCollections,
  highlights,
  documentRelations,
} = require("../db/schema");
const { eq, desc, sql, and, like, count } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  nowTimestamp,
} = require("./helpers");

/** 마크다운에서 서식 기호를 제거하여 평문 텍스트를 생성한다. */
function stripMarkdown(md) {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 문서 수정 시 허용되는 필드 목록 */
const ALLOWED_UPDATE_FIELDS = [
  "title", "documentType", "subtitle", "author", "source", "publishedDate",
  "contentMarkdown", "contentHtml", "contentPlain", "summary", "status", "importance",
  "filePath", "fileType", "fileSize", "metadata",
];

function stripHtml(html = "") {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 문서 목록 조회 (페이지네이션 + 필터)
 * @param {object} filters - { page, limit, document_type, status, importance, q }
 * @returns {{ items: Array, meta: object }}
 */
async function listDocuments(filters) {
  const { page, limit, offset } = parsePagination(filters, { maxLimit: 500 });

  const conditions = [];
  if (filters.document_type) {
    conditions.push(eq(documents.documentType, filters.document_type));
  }
  if (filters.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters.importance) {
    conditions.push(eq(documents.importance, parseInt(filters.importance)));
  }
  if (filters.q) {
    const { escapeLike } = require("../lib/sanitize");
    conditions.push(like(documents.title, `%${escapeLike(filters.q)}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ total: count() })
    .from(documents)
    .where(where);

  const rows = await db
    .select()
    .from(documents)
    .where(where)
    .orderBy(desc(documents.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    meta: buildPaginationMeta(totalResult.total, page, limit),
  };
}

/**
 * FTS5 전문 검색
 * @param {string} query - 검색어
 * @param {number} [limit=20] - 최대 결과 수
 * @returns {Array}
 */
function searchDocuments(query, limit = 20) {
  if (!query || query.trim().length === 0) {
    throw new ServiceError("Query parameter 'q' is required", 400);
  }
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return searchFTSWithSnippet(query, safeLimit);
}

/**
 * 문서 상세 조회 (연관 데이터 포함)
 * @param {string} id - 문서 UUID
 * @returns {object} 문서 + categories, collections, highlights, relations
 */
async function getDocument(id) {
  validateUUID(id);

  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  const [docCategories, docCollections, docHighlights, docRelations] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, color: categories.color, icon: categories.icon })
      .from(documentCategories)
      .innerJoin(categories, eq(documentCategories.categoryId, categories.id))
      .where(eq(documentCategories.documentId, id)),
    db
      .select({ id: collections.id, name: collections.name, color: collections.color, icon: collections.icon })
      .from(documentCollections)
      .innerJoin(collections, eq(documentCollections.collectionId, collections.id))
      .where(eq(documentCollections.documentId, id)),
    db.select().from(highlights).where(eq(highlights.documentId, id)),
    db.select().from(documentRelations)
      .where(sql`${documentRelations.sourceId} = ${id} OR ${documentRelations.targetId} = ${id}`),
  ]);

  return {
    ...doc,
    categories: docCategories,
    collections: docCollections,
    highlights: docHighlights,
    relations: docRelations,
  };
}

/**
 * 문서 생성
 * @param {object} data - 문서 데이터 (title, documentType 필수)
 * @returns {object} 생성된 문서
 */
async function createDocument(data) {
  const {
    title, documentType, subtitle, author, source, publishedDate,
    contentMarkdown, contentHtml, contentPlain, summary, status: docStatus,
    importance, filePath, fileType, metadata, categoryIds,
  } = data;

  if (!title || !documentType) {
    throw new ServiceError("title and documentType are required", 400);
  }

  if (importance !== undefined && importance !== null) {
    const imp = parseInt(importance);
    if (isNaN(imp) || imp < 1 || imp > 5) {
      throw new ServiceError("importance는 1~5 사이의 값이어야 합니다", 400);
    }
  }

  const plain = contentPlain
    ? contentPlain
    : contentMarkdown
      ? stripMarkdown(contentMarkdown)
      : contentHtml
        ? stripHtml(contentHtml)
        : null;

  // 문서 본문 + 카테고리 연결을 단일 트랜잭션으로 묶는다.
  // WHY: 카테고리 INSERT가 실패하면 documents 행이 고아로 남고,
  //      FTS5 동기화 트리거도 일관된 시점에 실행되어야 한다.
  const insertTxn = sqlite.transaction(() => {
    const [row] = db
      .insert(documents)
      .values({
        title,
        documentType,
        subtitle: subtitle ?? null,
        author: typeof author === "object" ? JSON.stringify(author) : (author ?? null),
        source: source ?? null,
        publishedDate: publishedDate ?? null,
        contentMarkdown: contentMarkdown ?? null,
        contentHtml: contentHtml ?? null,
        contentPlain: plain,
        summary: summary ?? null,
        status: docStatus ?? "unread",
        importance: importance ?? 3,
        filePath: filePath ?? null,
        fileType: fileType ?? null,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata ?? null),
      })
      .returning()
      .all();

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      db.insert(documentCategories).values(
        categoryIds.map((categoryId) => ({ documentId: row.id, categoryId }))
      ).run();
    }
    return row;
  });
  return insertTxn();
}

/**
 * 문서 수정 (부분 업데이트)
 * @param {string} id - 문서 UUID
 * @param {object} data - 수정할 필드 (categoryIds는 별도 처리)
 * @returns {object} 수정된 문서
 */
async function updateDocument(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(documents).where(eq(documents.id, id));
  if (!existing) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  const { categoryIds, ...fields } = data;

  const updateData = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in fields) {
      let value = fields[key];
      if ((key === "author" || key === "metadata") && typeof value === "object") {
        value = JSON.stringify(value);
      }
      updateData[key] = value;
    }
  }
  if (!("contentPlain" in updateData)) {
    if ("contentMarkdown" in updateData) {
      updateData.contentPlain = updateData.contentMarkdown ? stripMarkdown(updateData.contentMarkdown) : null;
    } else if ("contentHtml" in updateData) {
      updateData.contentPlain = updateData.contentHtml ? stripHtml(updateData.contentHtml) : null;
    }
  }
  updateData.updatedAt = nowTimestamp();

  // 본문 수정 + 카테고리 재연결을 단일 트랜잭션으로 묶는다 (FTS 일관성 + 부분 실패 방지)
  const updateTxn = sqlite.transaction(() => {
    const [row] = db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning()
      .all();

    if (categoryIds && Array.isArray(categoryIds)) {
      db.delete(documentCategories).where(eq(documentCategories.documentId, id)).run();
      if (categoryIds.length > 0) {
        db.insert(documentCategories).values(
          categoryIds.map((categoryId) => ({ documentId: id, categoryId }))
        ).run();
      }
    }
    return row;
  });
  return updateTxn();
}

/**
 * 문서 삭제 (1차: archived 상태로 변경, 2차: 영구 삭제)
 * @param {string} id - 문서 UUID
 * @returns {object} { deleted: true } 또는 archived된 문서
 */
async function deleteDocument(id) {
  validateUUID(id);

  const [existing] = await db.select().from(documents).where(eq(documents.id, id));
  if (!existing) {
    throw new ServiceError("문서를 찾을 수 없습니다", 404);
  }

  // 이미 archived 상태면 영구 삭제 — FTS 트리거가 트랜잭션 안에서 함께 동작하도록 감싼다
  if (existing.status === "archived") {
    sqlite.transaction(() => {
      db.delete(documents).where(eq(documents.id, id)).run();
    })();
    return { deleted: true };
  }

  // 그 외에는 소프트 삭제 (archived로 변경)
  const [updated] = await db
    .update(documents)
    .set({ status: "archived", updatedAt: nowTimestamp() })
    .where(eq(documents.id, id))
    .returning();

  return updated;
}

/**
 * 여러 문서를 한 번에 갱신한다.
 *  - patch: 모든 대상 문서에 동일하게 적용할 단순 필드 (status / importance / documentType)
 *  - addCategoryIds / removeCategoryIds: 카테고리는 ID 단위로 추가/제거(전체 교체 X)
 *  ※ deleteDocument 와 동일한 소프트→하드 삭제 정책을 따르려면 bulkDeleteDocuments 사용.
 *
 * @param {string[]} ids                — 대상 문서 UUID 배열
 * @param {object}   options
 * @param {object}   [options.patch]               — { status?, importance?, documentType? }
 * @param {string[]} [options.addCategoryIds]      — 추가할 카테고리 ID 들
 * @param {string[]} [options.removeCategoryIds]   — 제거할 카테고리 ID 들
 * @returns {{ updated: number }}
 */
async function bulkUpdateDocuments(ids, options = {}) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ServiceError("대상 문서 ID가 비어있습니다", 400);
  }
  for (const id of ids) validateUUID(id);

  const { patch = {}, addCategoryIds = [], removeCategoryIds = [] } = options;
  const ALLOWED_BULK_FIELDS = ["status", "importance", "documentType"];
  const updateData = {};
  for (const key of ALLOWED_BULK_FIELDS) {
    if (patch[key] !== undefined && patch[key] !== null && patch[key] !== "") {
      updateData[key] = key === "importance" ? parseInt(patch[key]) : patch[key];
    }
  }

  const hasFieldUpdate = Object.keys(updateData).length > 0;
  const hasCategoryAdd = addCategoryIds.length > 0;
  const hasCategoryRemove = removeCategoryIds.length > 0;
  if (!hasFieldUpdate && !hasCategoryAdd && !hasCategoryRemove) {
    return { updated: 0 };
  }

  if (hasFieldUpdate) updateData.updatedAt = nowTimestamp();

  let updated = 0;
  const tx = sqlite.transaction(() => {
    for (const id of ids) {
      const [existing] = db.select().from(documents).where(eq(documents.id, id)).all();
      if (!existing) continue;

      if (hasFieldUpdate) {
        db.update(documents).set(updateData).where(eq(documents.id, id)).run();
      }

      if (hasCategoryRemove) {
        for (const catId of removeCategoryIds) {
          db.delete(documentCategories)
            .where(and(eq(documentCategories.documentId, id), eq(documentCategories.categoryId, catId)))
            .run();
        }
      }
      if (hasCategoryAdd) {
        const existingLinks = db.select({ categoryId: documentCategories.categoryId })
          .from(documentCategories)
          .where(eq(documentCategories.documentId, id))
          .all();
        const existingSet = new Set(existingLinks.map((r) => r.categoryId));
        const toInsert = addCategoryIds.filter((c) => !existingSet.has(c));
        if (toInsert.length > 0) {
          db.insert(documentCategories)
            .values(toInsert.map((catId) => ({ documentId: id, categoryId: catId })))
            .run();
        }
      }
      updated += 1;
    }
  });
  tx();
  return { updated };
}

/** 여러 문서를 한 번에 삭제한다. 단일 deleteDocument 와 동일한 소프트→하드 정책. */
async function bulkDeleteDocuments(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ServiceError("대상 문서 ID가 비어있습니다", 400);
  }
  for (const id of ids) validateUUID(id);

  let deleted = 0;
  let archived = 0;
  const tx = sqlite.transaction(() => {
    for (const id of ids) {
      const [existing] = db.select().from(documents).where(eq(documents.id, id)).all();
      if (!existing) continue;
      if (existing.status === "archived") {
        db.delete(documents).where(eq(documents.id, id)).run();
        deleted += 1;
      } else {
        db.update(documents)
          .set({ status: "archived", updatedAt: nowTimestamp() })
          .where(eq(documents.id, id))
          .run();
        archived += 1;
      }
    }
  });
  tx();
  return { deleted, archived };
}

module.exports = {
  stripMarkdown,
  listDocuments,
  searchDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkUpdateDocuments,
  bulkDeleteDocuments,
};
