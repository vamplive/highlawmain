/** 윤세환 대표변호사 — 석사학위 논문 추가 (Emory University, 2013). 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const publications = [
  {
    year: 2013,
    title: "The Search for Credibility in Crisis Bargaining and Nuclear Blackmail",
    journal: "Emory University (Master's Thesis, Political Science)",
    url: "https://etd.library.emory.edu/concern/etds/gm80hw111?locale=en",
  },
];

const row = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

const r = db.prepare(`
  UPDATE lawyers
     SET publications = @pubs,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ pubs: JSON.stringify(publications), id: row.id });

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — publications ${publications.length}건`);
db.close();
