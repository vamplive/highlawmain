/**
 * 직원 계정 생성 시드 (멱등).
 *  - username 'jeongyunseon' 계정이 없으면 생성, 있으면 비밀번호만 재설정.
 *  - 임시 비밀번호로 발급하므로 본인 첫 로그인 후 즉시 변경 필요.
 */
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const USERNAME = "jeongyunseon";
const NAME = "정윤선";
const ROLE = "editor"; // 직원(편집자) 권한
const TEMP_PASSWORD = "highlaw2026!";

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const passwordHash = hashPassword(TEMP_PASSWORD);

const existing = db.prepare("SELECT id FROM admin_users WHERE username = ?").get(USERNAME);
if (existing) {
  db.prepare(`
    UPDATE admin_users
       SET password_hash = ?, name = ?, role = ?, is_active = 1, updated_at = datetime('now')
     WHERE id = ?
  `).run(passwordHash, NAME, ROLE, existing.id);
  console.log(`RESET admin_users (${existing.id}) — username='${USERNAME}', role='${ROLE}'`);
} else {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO admin_users (id, username, password_hash, name, role, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, USERNAME, passwordHash, NAME, ROLE);
  console.log(`CREATE admin_users (${id}) — username='${USERNAME}', role='${ROLE}'`);
}

db.close();
console.log(`임시 비밀번호: ${TEMP_PASSWORD}  (본인 로그인 후 즉시 변경하세요)`);
