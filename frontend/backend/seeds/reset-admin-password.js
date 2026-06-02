/**
 * 관리자 계정 복구 시드 (1회용).
 * - 'admin' 계정이 있으면 비밀번호를 임시값으로 재설정,
 * - 없으면 같은 임시값으로 새로 생성한다.
 * 실행 후 즉시 관리자 화면에서 비밀번호를 변경하고 이 파일은 삭제한다.
 */
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "db", "highlaw.db");
const db = new Database(dbPath);

const USERNAME = "admin";
const TEMP_PASSWORD = "Yj!RecoveryMay2026";

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
       SET password_hash = ?, is_active = 1, updated_at = datetime('now')
     WHERE id = ?
  `).run(passwordHash, existing.id);
  console.log(`RESET admin_users (${existing.id}) — username='${USERNAME}'`);
} else {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO admin_users (id, username, password_hash, name, role, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, USERNAME, passwordHash, "관리자", "admin");
  console.log(`CREATE admin_users (${id}) — username='${USERNAME}'`);
}

db.prepare("DELETE FROM sessions").run();
console.log("기존 세션 모두 무효화 완료.");

db.close();
console.log(`임시 비밀번호: ${TEMP_PASSWORD}  (로그인 후 즉시 변경하세요)`);
