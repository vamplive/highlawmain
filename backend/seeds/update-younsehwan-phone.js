/** 윤세환 대표변호사 — 전화번호 02-594-5583 으로 갱신. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "yjlaw.db");
const db = new Database(dbPath);

const phone = "02-594-5583";

const row = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

const r = db.prepare(`
  UPDATE lawyers
     SET phone = @phone,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ phone, id: row.id });

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — phone ${phone}`);
db.close();
