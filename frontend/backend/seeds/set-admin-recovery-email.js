/** 관리자(admin) 계정의 복구 이메일 설정. 멱등. */
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const USERNAME = "admin";
const RECOVERY_EMAIL = "youn.sehwan@gmail.com";

const row = db.prepare("SELECT id, email FROM admin_users WHERE username = ?").get(USERNAME);
if (!row) {
  console.error(`'${USERNAME}' 관리자 계정을 찾지 못했습니다.`);
  process.exit(1);
}

if (row.email === RECOVERY_EMAIL) {
  console.log(`이미 ${RECOVERY_EMAIL} 로 설정되어 있습니다.`);
  db.close();
  return;
}

const r = db.prepare(`
  UPDATE admin_users
     SET email = @email,
         updated_at = datetime('now')
   WHERE id = @id
`).run({ email: RECOVERY_EMAIL, id: row.id });

console.log(`UPDATE admin_users (${row.id}): ${r.changes}건 — email = ${RECOVERY_EMAIL}`);
db.close();
