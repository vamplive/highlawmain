/** 윤세환 대표변호사 — '대한변호사협회 신탁변호사회 이사' 멤버십 추가. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const NEW_ITEM = "대한변호사협회 신탁변호사회 이사";

const row = db.prepare("SELECT id, memberships FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

let list = [];
try { list = JSON.parse(row.memberships || "[]"); } catch { list = []; }
if (!Array.isArray(list)) list = [];

if (!list.includes(NEW_ITEM)) list.push(NEW_ITEM);

const r = db.prepare(`
  UPDATE lawyers
     SET memberships = @m,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ m: JSON.stringify(list), id: row.id });

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — memberships ${list.length}건`);
console.log(list.map((x, i) => `  ${i + 1}. ${x}`).join("\n"));
db.close();
