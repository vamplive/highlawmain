/**
 * 메신저 채팅 REST API
 * - 채팅방 목록/생성, 메시지 이력, 파일 업로드, 읽음 처리
 * - 포털 사용자(portal) + 관리자(admin) 혼용 지원
 * WebSocket: backend/lib/chat-ws.js 참고
 */
const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { sqlite } = require("../db");
const {
  portalAuth, adminAuth,
  extractPortalToken, getPortalSession,
  extractAdminToken, getSession,
} = require("../lib/auth");
const { handleError } = require("../lib/route-handler");

const router = Router();

// ─── 파일 업로드 설정 ───────────────────────────────────────────────
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const CHAT_UPLOAD_DIR = path.join(STORAGE_PATH, "uploads", "chat");

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
    cb(null, CHAT_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `chat-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

// ─── 현재 사용자 추출 헬퍼 ──────────────────────────────────────────
function getCurrentUser(req) {
  if (req.portalUser) {
    return { id: req.portalUser.userId, type: "portal", email: req.portalUser.email };
  }
  if (req.adminUser) {
    return { id: req.adminUser.id, type: "admin", email: req.adminUser.email, name: req.adminUser.name };
  }
  return null;
}

// 포털 또는 관리자 인증 허용 미들웨어
function anyAuth(req, res, next) {
  const portalToken = extractPortalToken(req);
  const portalSession = portalToken ? getPortalSession(portalToken) : null;
  if (portalSession) {
    req.portalUser = portalSession;
    return next();
  }
  const adminToken = extractAdminToken(req);
  const adminSession = adminToken ? getSession(adminToken) : null;
  if (adminSession) {
    const adminUser = sqlite.prepare(
      "SELECT id, username, name, role, email, is_active FROM admin_users WHERE id = ?"
    ).get(adminSession.userId);
    if (adminUser && adminUser.is_active) {
      req.adminUser = { ...adminSession, id: adminUser.id, username: adminUser.username, name: adminUser.name, role: adminUser.role, email: adminUser.email };
      return next();
    }
  }
  return res.status(401).json({ data: null, error: "인증이 필요합니다", meta: null });
}

// ─── 사용자 표시명 조회 ──────────────────────────────────────────────
function getUserDisplayName(userId, userType) {
  if (userType === "portal") {
    const row = sqlite.prepare(
      "SELECT pu.email, c.name FROM portal_users pu LEFT JOIN clients c ON pu.client_id = c.id WHERE pu.id = ?"
    ).get(userId);
    return row ? (row.name || row.email || "사용자") : "사용자";
  }
  if (userType === "admin") {
    const row = sqlite.prepare("SELECT name, username FROM admin_users WHERE id = ?").get(userId);
    return row ? (row.name || row.username || "관리자") : "관리자";
  }
  return "사용자";
}

// ─── 채팅방 목록 ──────────────────────────────────────────────────────
/** GET /api/chat/rooms — 현재 사용자가 참여한 방 목록 */
router.get("/rooms", anyAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    const rooms = sqlite.prepare(`
      SELECT
        r.id, r.name, r.type, r.last_message_at, r.last_message_preview, r.created_at,
        m.last_read_at
      FROM messenger_rooms r
      JOIN messenger_members m ON m.room_id = r.id
      WHERE m.user_id = ? AND m.user_type = ?
      ORDER BY COALESCE(r.last_message_at, r.created_at) DESC
    `).all(user.id, user.type);

    // 각 방에 대해 멤버 정보 + 읽지 않은 메시지 수 첨부
    const enriched = rooms.map((room) => {
      const members = sqlite.prepare(`
        SELECT user_id, user_type, display_name, joined_at FROM messenger_members WHERE room_id = ?
      `).all(room.id);

      const enrichedMembers = members.map((m) => ({
        ...m,
        displayName: m.display_name || getUserDisplayName(m.user_id, m.user_type),
      }));

      const unreadCount = sqlite.prepare(`
        SELECT count(*) as cnt FROM messenger_messages
        WHERE room_id = ?
          AND is_deleted = 0
          AND (sender_id != ? OR sender_type != ?)
          AND (? IS NULL OR created_at > ?)
      `).get(
        room.id,
        user.id, user.type,
        room.last_read_at, room.last_read_at
      );

      // 1:1 채팅방의 표시 이름: 상대방 이름
      let displayName = room.name;
      if (room.type === "direct" && !displayName) {
        const other = enrichedMembers.find(
          (m) => !(m.user_id === user.id && m.user_type === user.type)
        );
        displayName = other?.displayName || "상대방";
      }

      return {
        ...room,
        displayName,
        members: enrichedMembers,
        unreadCount: unreadCount?.cnt ?? 0,
      };
    });

    res.json({ data: enriched, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 채팅방 생성 ──────────────────────────────────────────────────────
/**
 * POST /api/chat/rooms
 * body: {
 *   type: "direct"|"group",
 *   name?: string,  (그룹일 때)
 *   members: [{ userId, userType }]  (상대방 목록)
 * }
 */
router.post("/rooms", anyAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { type = "direct", name, members = [] } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ data: null, error: "참여자를 1명 이상 지정하세요", meta: null });
    }

    // direct: 상대방 1명, 이미 방이 있으면 기존 반환
    if (type === "direct") {
      const other = members[0];
      if (!other?.userId || !other?.userType) {
        return res.status(400).json({ data: null, error: "상대방 정보가 없습니다", meta: null });
      }

      const existing = sqlite.prepare(`
        SELECT r.id FROM messenger_rooms r
        JOIN messenger_members m1 ON m1.room_id = r.id AND m1.user_id = ? AND m1.user_type = ?
        JOIN messenger_members m2 ON m2.room_id = r.id AND m2.user_id = ? AND m2.user_type = ?
        WHERE r.type = 'direct'
          AND (SELECT count(*) FROM messenger_members WHERE room_id = r.id) = 2
        LIMIT 1
      `).get(user.id, user.type, other.userId, other.userType);

      if (existing) {
        return res.json({ data: { roomId: existing.id, isNew: false }, error: null, meta: null });
      }
    }

    // 새 방 생성
    const roomId = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    sqlite.prepare(`
      INSERT INTO messenger_rooms (id, name, type, created_by, created_by_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(roomId, name || null, type, user.id, user.type, now, now);

    // 현재 사용자 멤버 등록
    const selfName = getUserDisplayName(user.id, user.type);
    const addMember = sqlite.prepare(`
      INSERT OR IGNORE INTO messenger_members (id, room_id, user_id, user_type, display_name, joined_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    addMember.run(crypto.randomUUID(), roomId, user.id, user.type, selfName, now);

    // 상대방 멤버 등록
    for (const m of members) {
      if (!m.userId || !m.userType) continue;
      const memberName = getUserDisplayName(m.userId, m.userType);
      addMember.run(crypto.randomUUID(), roomId, m.userId, m.userType, memberName, now);
    }

    res.json({ data: { roomId, isNew: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 메시지 이력 ──────────────────────────────────────────────────────
/** GET /api/chat/rooms/:id/messages?before=ISO&limit=50 */
router.get("/rooms/:id/messages", anyAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id: roomId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const before = req.query.before || null;

    // 방 멤버인지 확인
    const member = sqlite.prepare(
      "SELECT 1 FROM messenger_members WHERE room_id = ? AND user_id = ? AND user_type = ?"
    ).get(roomId, user.id, user.type);
    if (!member) {
      return res.status(403).json({ data: null, error: "접근 권한이 없습니다", meta: null });
    }

    let query, params;
    if (before) {
      query = `
        SELECT * FROM messenger_messages
        WHERE room_id = ? AND is_deleted = 0 AND created_at < ?
        ORDER BY created_at DESC LIMIT ?
      `;
      params = [roomId, before, limit];
    } else {
      query = `
        SELECT * FROM messenger_messages
        WHERE room_id = ? AND is_deleted = 0
        ORDER BY created_at DESC LIMIT ?
      `;
      params = [roomId, limit];
    }

    const rows = sqlite.prepare(query).all(...params);
    res.json({ data: rows.reverse(), error: null, meta: { roomId, limit } });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 읽음 처리 ───────────────────────────────────────────────────────
/** POST /api/chat/rooms/:id/read */
router.post("/rooms/:id/read", anyAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id: roomId } = req.params;
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    sqlite.prepare(
      "UPDATE messenger_members SET last_read_at = ? WHERE room_id = ? AND user_id = ? AND user_type = ?"
    ).run(now, roomId, user.id, user.type);

    res.json({ data: { ok: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 파일 업로드 ─────────────────────────────────────────────────────
/** POST /api/chat/rooms/:id/files */
router.post("/rooms/:id/files", anyAuth, chatUpload.single("file"), (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id: roomId } = req.params;

    // 방 멤버인지 확인
    const member = sqlite.prepare(
      "SELECT 1 FROM messenger_members WHERE room_id = ? AND user_id = ? AND user_type = ?"
    ).get(roomId, user.id, user.type);
    if (!member) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ data: null, error: "접근 권한이 없습니다", meta: null });
    }

    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    res.json({
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 사용자 목록 (채팅 상대방 선택용) ────────────────────────────────
/** GET /api/chat/users — 포털 사용자 + 관리자 목록 */
router.get("/users", anyAuth, (req, res) => {
  try {
    const portalUsers = sqlite.prepare(`
      SELECT pu.id, 'portal' as user_type, COALESCE(c.name, pu.email) as display_name, pu.email
      FROM portal_users pu
      LEFT JOIN clients c ON pu.client_id = c.id
      WHERE pu.is_active = 1
      ORDER BY COALESCE(c.name, pu.email)
    `).all();

    const adminUsers = sqlite.prepare(`
      SELECT id, 'admin' as user_type, COALESCE(name, username) as display_name, email
      FROM admin_users
      WHERE is_active = 1
      ORDER BY COALESCE(name, username)
    `).all();

    res.json({ data: { portal: portalUsers, admin: adminUsers }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// ─── 메시지 삭제 (본인 메시지만) ─────────────────────────────────────
/** DELETE /api/chat/messages/:id */
router.delete("/messages/:id", anyAuth, (req, res) => {
  try {
    const user = getCurrentUser(req);
    const { id } = req.params;

    const msg = sqlite.prepare("SELECT * FROM messenger_messages WHERE id = ?").get(id);
    if (!msg) return res.status(404).json({ data: null, error: "메시지를 찾을 수 없습니다", meta: null });
    if (msg.sender_id !== user.id || msg.sender_type !== user.type) {
      return res.status(403).json({ data: null, error: "본인 메시지만 삭제할 수 있습니다", meta: null });
    }

    sqlite.prepare("UPDATE messenger_messages SET is_deleted = 1, content = NULL WHERE id = ?").run(id);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
