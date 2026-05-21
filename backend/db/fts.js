/**
 * FTS5 전문 검색 — 가상 테이블·트리거 생성, 안전한 쿼리 정제, 검색 함수
 *
 * 한국어 unicode61 토크나이저로 documents 테이블의 title/content_plain/summary 인덱싱.
 * 트리거로 INSERT/UPDATE/DELETE 시 자동 동기화.
 */

/* ── FTS 검색 상수 ── */
/** 개별 검색어 최대 길이 (바이트) — 비정상적으로 긴 토큰 차단 */
const FTS_MAX_TOKEN_LENGTH = 100;
/** 검색어 최대 개수 — DoS 방지 */
const FTS_MAX_TOKENS = 20;
/** 스니펫에서 제목 주변 컨텍스트 토큰 수 */
const FTS_SNIPPET_TITLE_TOKENS = 32;
/** 스니펫에서 본문 주변 컨텍스트 토큰 수 */
const FTS_SNIPPET_CONTENT_TOKENS = 64;

/**
 * FTS5 가상 테이블 + 동기화 트리거 생성
 * @param {import("better-sqlite3").Database} sqlite
 */
function initFTS(sqlite) {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      title, content_plain, summary,
      content='documents',
      content_rowid='rowid',
      tokenize='unicode61'
    );
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, title, content_plain, summary)
      VALUES (NEW.rowid, NEW.title, NEW.content_plain, NEW.summary);
    END;
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content_plain, summary)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.content_plain, OLD.summary);
    END;
  `);

  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content_plain, summary)
      VALUES ('delete', OLD.rowid, OLD.title, OLD.content_plain, OLD.summary);
      INSERT INTO documents_fts(rowid, title, content_plain, summary)
      VALUES (NEW.rowid, NEW.title, NEW.content_plain, NEW.summary);
    END;
  `);
}

/**
 * FTS5 쿼리 문자열을 안전하게 정제
 * - 특수 문자를 제거하여 FTS5 구문 오류 방지
 * - 빈 토큰은 필터링
 */
function sanitizeFTSQuery(query) {
  const cleaned = query
    .replace(/["""''(){}[\]*^~:]/g, " ")
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, " ")
    .trim();
  const tokens = cleaned
    .split(/\s+/)
    .filter(t => t && t.length <= FTS_MAX_TOKEN_LENGTH)
    .slice(0, FTS_MAX_TOKENS);
  if (tokens.length === 0) return null;
  return tokens.map(t => `"${t.replace(/"/g, "")}"`).join(" ");
}

/** 단순 FTS5 검색 — 매칭된 문서 행을 rank 순으로 반환 */
function searchFTS(sqlite, query, limit = 20) {
  const safeQuery = sanitizeFTSQuery(query);
  if (!safeQuery) return [];

  const stmt = sqlite.prepare(`
    SELECT d.*, rank
    FROM documents_fts fts
    JOIN documents d ON d.rowid = fts.rowid
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  return stmt.all(safeQuery, limit);
}

/** 스니펫 포함 FTS5 검색 — title/content 양쪽에 <mark> 하이라이트 적용 */
function searchFTSWithSnippet(sqlite, query, limit = 20) {
  const safeQuery = sanitizeFTSQuery(query);
  if (!safeQuery) return [];

  const stmt = sqlite.prepare(`
    SELECT d.*,
      snippet(documents_fts, 0, '<mark>', '</mark>', '...', ${FTS_SNIPPET_TITLE_TOKENS}) as title_snippet,
      snippet(documents_fts, 1, '<mark>', '</mark>', '...', ${FTS_SNIPPET_CONTENT_TOKENS}) as content_snippet,
      rank
    FROM documents_fts fts
    JOIN documents d ON d.rowid = fts.rowid
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  return stmt.all(safeQuery, limit);
}

module.exports = { initFTS, searchFTS, searchFTSWithSnippet, sanitizeFTSQuery };
