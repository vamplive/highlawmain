/** 윤세환 대표변호사 — 저서 1건 추가 (황변과 함께하는 법조윤리, 공저). 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "yjlaw.db");
const db = new Database(dbPath);

const books = [
  {
    year: 2025,
    title: "황변과 함께하는 법조윤리 (11판)",
    publisher: "법률저널",
    role: "공저 (황정현·최웅구·정동주·윤세환·양준명·조성헌)",
    url: "https://product.kyobobook.co.kr/detail/S000217005585",
  },
];

const row = db.prepare("SELECT id FROM lawyers WHERE name = ?").get("윤세환");
if (!row) {
  console.error("윤세환 변호사 행을 찾지 못했습니다.");
  process.exit(1);
}

const r = db.prepare(`
  UPDATE lawyers
     SET books = @books,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ books: JSON.stringify(books), id: row.id });

console.log(`UPDATE 윤세환 (${row.id}): ${r.changes}건 — books ${books.length}건`);
db.close();
