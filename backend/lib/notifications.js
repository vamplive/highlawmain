/**
 * 포털 알림 헬퍼 — portal_notifications 테이블 CRUD
 * - better-sqlite3 동기 API 사용
 */
const { sqlite } = require("../db");
const crypto = require("crypto");

// 테이블이 없으면 생성
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS portal_notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    user_type  TEXT NOT NULL DEFAULT 'portal',
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT,
    link       TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

function create(userId, userType, type, title, body = null, link = null) {
  const id = crypto.randomUUID();
  sqlite.prepare(
    `INSERT INTO portal_notifications (id, user_id, user_type, type, title, body, link)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, userType || "portal", type, title, body, link);
}

function list(userId, userType = "portal") {
  return sqlite.prepare(
    `SELECT * FROM portal_notifications
     WHERE user_id = ? AND user_type = ?
     ORDER BY created_at DESC LIMIT 50`
  ).all(userId, userType);
}

function unreadCount(userId, userType = "portal") {
  return sqlite.prepare(
    `SELECT COUNT(*) as cnt FROM portal_notifications
     WHERE user_id = ? AND user_type = ? AND is_read = 0`
  ).get(userId, userType)?.cnt || 0;
}

function markOne(id) {
  sqlite.prepare(`UPDATE portal_notifications SET is_read = 1 WHERE id = ?`).run(id);
}

function markAll(userId, userType = "portal") {
  sqlite.prepare(
    `UPDATE portal_notifications SET is_read = 1 WHERE user_id = ? AND user_type = ?`
  ).run(userId, userType);
}

module.exports = { create, list, unreadCount, markOne, markAll };
