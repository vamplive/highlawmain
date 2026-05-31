/**
 * 마이그레이션: layout/contact 카카오톡 URL을 법무법인 하이로 공식 채널로 업데이트
 * 실행: node backend/scripts/migrate-2026-05-31-kakao-url.js
 * - 이미 올바른 값이면 변경 없음 (idempotent)
 */
const path = require("path");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "..", "data", "db", "yjlaw.db");
const db = new Database(DB_PATH);

const CORRECT_KAKAO_URL = "https://pf.kakao.com/_highlawofficial/chat";

const NEW_CONTACT = {
  phone: "02-6925-6757",
  kakaoUrl: CORRECT_KAKAO_URL,
  telegramUrl: "",
  telegramEnabled: false,
  kakaoEnabled: true,
  phoneEnabled: true,
};

const existing = db.prepare(
  "SELECT id, content FROM site_settings WHERE page='layout' AND section='contact'"
).get();

if (existing) {
  const current = JSON.parse(existing.content || "{}");

  if (current.kakaoUrl === CORRECT_KAKAO_URL) {
    console.log("[migrate] kakaoUrl already correct — skipping");
    db.close();
    process.exit(0);
  }

  const merged = { ...current, ...NEW_CONTACT };
  db.prepare(
    "UPDATE site_settings SET content=?, updated_at=datetime('now') WHERE id=?"
  ).run(JSON.stringify(merged), existing.id);

  console.log(`[migrate] layout/contact updated`);
  console.log(`  이전 kakaoUrl: ${current.kakaoUrl || "(없음)"}`);
  console.log(`  변경 kakaoUrl: ${CORRECT_KAKAO_URL}`);
} else {
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO site_settings (id, page, section, content, updated_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).run(id, "layout", "contact", JSON.stringify(NEW_CONTACT));

  console.log(`[migrate] layout/contact inserted`);
  console.log(`  kakaoUrl: ${CORRECT_KAKAO_URL}`);
}

db.close();
