/**
 * SQLite 데이터베이스 진입점
 * - better-sqlite3 + Drizzle ORM 설정
 * - 부트스트랩 시 init-schema와 fts 모듈을 호출해 테이블/FTS5 인덱스 생성
 *
 * 스키마 정의는 ./init-schema.js, FTS5 검색은 ./fts.js 참고.
 */
const Database = require("better-sqlite3");
const { drizzle } = require("drizzle-orm/better-sqlite3");
const path = require("path");
const fs = require("fs");
const schema = require("./schema");
const { initTables } = require("./init-schema");
const { initFTS, searchFTS: ftsSearch, searchFTSWithSnippet: ftsSearchSnippet } = require("./fts");

// STORAGE_PATH 환경변수로 외부 스토리지 경로 지정 (Dropbox 등)
// 미설정 시 프로젝트 내부 backend/data/db 사용
const STORAGE_BASE = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const DB_DIR = path.join(STORAGE_BASE, "db");
const DB_PATH = path.join(DB_DIR, "yjlaw.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });
const shouldLogDbInfo = process.env.NODE_ENV !== "test" && process.env.LOG_LEVEL !== "fatal";
const shouldLogDbWarning = process.env.LOG_LEVEL !== "fatal";

function logDbInfo(message) {
  if (shouldLogDbInfo) {
    console.log(message);
  }
}

function logDbWarning(message, detail) {
  if (shouldLogDbWarning) {
    console.warn(message, detail);
  }
}

// 외부 호출자에게는 sqlite 인자를 감추고 기존과 같은 시그니처로 노출
const searchFTS = (query, limit) => ftsSearch(sqlite, query, limit);
const searchFTSWithSnippet = (query, limit) => ftsSearchSnippet(sqlite, query, limit);

try {
  initTables(sqlite);
  initFTS(sqlite);
  // 블로그 글이 없으면 시드 데이터 자동 삽입
  try {
    const blogCount = sqlite.prepare("SELECT count(*) as c FROM blog_posts").get();
    if (blogCount.c === 0) {
      require("../seeds/seed-blog");
      logDbInfo("[db] 블로그 시드 데이터 자동 삽입 완료");
    }
  } catch (e) { logDbWarning("[db] 블로그 시드 실패:", e.message); }
  try {
    const { seedRecruit } = require("../seeds/seed-recruit");
    const result = seedRecruit(sqlite);
    if (result.inserted) {
      logDbInfo(`[db] 채용 공고 시드 데이터 ${result.count}건 자동 삽입 완료`);
    }
  } catch (e) { logDbWarning("[db] 채용 공고 시드 실패:", e.message); }
  try {
    const { refreshBlogContent } = require("../seeds/seed-blog-complete-2026");
    const result = refreshBlogContent(sqlite);
    if (result.refreshed) {
      logDbInfo(`[db] 블로그 장문 콘텐츠 ${result.count}건 반영 완료 (${result.version})`);
    }
  } catch (e) { logDbWarning("[db] 블로그 장문 콘텐츠 반영 실패:", e.message); }
  try {
    const { enrichPossessionInjunctionBlogImages } = require("../seeds/enrich-blog-possession-injunction-images");
    const result = enrichPossessionInjunctionBlogImages(sqlite);
    if (result.updated) {
      logDbInfo(`[db] 점유이전금지가처분 블로그 본문 이미지 ${result.figures}건 삽입 완료`);
    }
  } catch (e) { logDbWarning("[db] 점유이전금지가처분 블로그 이미지 삽입 실패:", e.message); }
} catch (e) {
  console.error("[DB Init Error]", e.message);
  process.exit(1);
}

module.exports = { db, sqlite, searchFTS, searchFTSWithSnippet };
