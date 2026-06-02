/** 변호사 프로필 사진 경로 업데이트 — 실제 업로드된 파일명에 맞춰 photo_url 갱신 */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const updates = [
  { name: "윤세환", photoUrl: "/lawyers/younsehwan/younsehwan_profile.jpg" },
  { name: "한샘이", photoUrl: "/lawyers/hansaemi/hansaemi_profile.png" },
  { name: "김효림", photoUrl: "/lawyers/kimhyorim/kimhyorim_profile.jpg" },
  { name: "김수경", photoUrl: "/lawyers/kimsukyung/kimsukyung_profile.jpg" },
];

const stmt = db.prepare("UPDATE lawyers SET photo_url = ?, updated_at = datetime('now') WHERE name = ?");
for (const u of updates) {
  const r = stmt.run(u.photoUrl, u.name);
  console.log(`${u.name}: ${r.changes}건 업데이트 → ${u.photoUrl}`);
}

const rows = db.prepare("SELECT name, photo_url FROM lawyers ORDER BY sort_order").all();
console.log("\n현재 상태:");
console.table(rows);

db.close();
