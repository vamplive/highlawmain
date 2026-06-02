/** 윤세환 대표변호사 — 자격을 '대한민국 변호사' 하나로 정리. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const qualifications = ["대한민국 변호사"];

const row = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

const r = db.prepare(`
  UPDATE lawyers
     SET qualifications = @q,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ q: JSON.stringify(qualifications), id: row.id });

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — qualifications ${qualifications.length}건`);
db.close();
