/**
 * 블로그 카테고리 마이그레이션 (1회용)
 * - legal_column → 전부 construction_realestate 로 이동
 *   (기존 legal_column 글이 모두 건설/부동산 관련 내용이므로 일괄 이동)
 * - legal_news → 전부 삭제
 *
 * 실행: node backend/seeds/migrate-blog-categories.js
 */
const path = require("path");
const Database = require("better-sqlite3");

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const DB_PATH = path.join(STORAGE_PATH, "db", "yjlaw.db");
const db = new Database(DB_PATH);

const moved = db.prepare(
  "UPDATE blog_posts SET category = 'construction_realestate' WHERE category = 'legal_column'"
).run();
console.log(`legal_column → construction_realestate 이동: ${moved.changes}건`);

const removed = db.prepare(
  "DELETE FROM blog_posts WHERE category = 'legal_news'"
).run();
console.log(`legal_news 삭제: ${removed.changes}건`);

db.close();
console.log("완료.");
