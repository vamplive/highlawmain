/**
 * 메신저 WebSocket 서버
 * - HTTP 서버에 /ws/chat 경로로 붙임
 * - 포털 세션 쿠키 또는 x-portal-token 헤더로 인증
 * - 실시간 메시지 브로드캐스트, 타이핑 알림, 읽음 처리
 */
const WebSocket = require("ws");
const crypto = require("crypto");
const { sqlite } = require("../db");
const { extractPortalToken, getPortalSession } = require("./auth");
const logger = require("./logger");
const notif = require("./notifications");

// WebSocket readyState 상수
const WS_OPEN = 1;

/**
 * HTTP 서버에 WebSocket 서버를 부착한다.
 * @param {import("http").Server} httpServer
 * @returns {WebSocket.Server}
 */
function attachChatWs(httpServer) {
  const wss = new WebSocket.Server({ noServer: true });

  // roomId → Set<WebSocket> : 방별 연결된 클라이언트
  const roomClients = new Map();
  // userId:userType → WebSocket
  const userClients = new Map();

  // HTTP upgrade 이벤트 — /ws/chat 경로만 처리
  httpServer.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/ws/chat")) return;

    // 쿠키 또는 헤더에서 포털 토큰 추출
    const token = extractPortalToken(req);
    const session = token ? getPortalSession(token) : null;

    if (!session) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nContent-Length: 0\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.userId = session.userId;
      ws.userType = "portal";
      ws.userEmail = session.email;
      ws.isAlive = true;
      wss.emit("connection", ws, req);
    });
  });

  // 연결 수립
  wss.on("connection", (ws) => {
    const userKey = `${ws.userId}:${ws.userType}`;
    userClients.set(userKey, ws);

    // 현재 사용자가 참여 중인 방 목록 조회 후 room 채널 구독
    const rooms = sqlite.prepare(
      "SELECT room_id FROM messenger_members WHERE user_id = ? AND user_type = ?"
    ).all(ws.userId, ws.userType);

    for (const { room_id } of rooms) {
      joinRoom(roomClients, room_id, ws);
    }

    // 온라인 상태 알림
    broadcastPresence(roomClients, ws.userId, ws.userType, "online");

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      handleIncoming(ws, msg, roomClients, userClients);
    });

    ws.on("close", () => {
      userClients.delete(userKey);
      // 모든 방에서 제거
      for (const [, clients] of roomClients) clients.delete(ws);
      broadcastPresence(roomClients, ws.userId, ws.userType, "offline");
    });

    ws.on("error", (err) => {
      logger.warn({ err, userId: ws.userId }, "[chat-ws] client error");
    });

    // 연결 확인 메시지
    send(ws, { type: "connected", userId: ws.userId });
  });

  // Ping/Pong 헬스체크 (30초 간격)
  const pingInterval = setInterval(() => {
    for (const [, ws] of userClients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);
  pingInterval.unref();

  wss.on("close", () => clearInterval(pingInterval));

  return wss;
}

// ─── 메시지 핸들러 ────────────────────────────────────────────────────
function handleIncoming(ws, msg, roomClients, userClients) {
  switch (msg.type) {
    case "send_message":
      handleSendMessage(ws, msg, roomClients, userClients);
      break;
    case "typing":
      handleTyping(ws, msg, roomClients);
      break;
    case "read":
      handleRead(ws, msg, roomClients);
      break;
    case "join_room":
      handleJoinRoom(ws, msg, roomClients);
      break;
    default:
      break;
  }
}

function handleSendMessage(ws, msg, roomClients, userClients) {
  const { roomId, content, contentType: type = "text", fileUrl, fileName, fileSize } = msg;
  if (!roomId) return;

  // 방 멤버 확인
  const member = sqlite.prepare(
    "SELECT 1 FROM messenger_members WHERE room_id = ? AND user_id = ? AND user_type = ?"
  ).get(roomId, ws.userId, ws.userType);
  if (!member) return;

  if (!content && !fileUrl) return;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const msgId = crypto.randomUUID();

  // 발신자 이름 + 프로필사진 조회
  const senderName = getSenderName(ws.userId, ws.userType);
  const senderPhotoUrl = getSenderPhotoUrl(ws.userId, ws.userType);

  // DB 저장
  sqlite.prepare(`
    INSERT INTO messenger_messages
      (id, room_id, sender_id, sender_type, sender_name, content, type, file_url, file_name, file_size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(msgId, roomId, ws.userId, ws.userType, senderName,
    content || null, type, fileUrl || null, fileName || null, fileSize || null, now);

  // 방 마지막 메시지 갱신
  const preview = type === "file" ? `[파일] ${fileName || ""}` : (content || "").slice(0, 80);
  sqlite.prepare(`
    UPDATE messenger_rooms SET last_message_at = ?, last_message_preview = ?, updated_at = ?
    WHERE id = ?
  `).run(now, preview, now, roomId);

  // 방 내 모든 클라이언트에게 브로드캐스트
  const outgoing = {
    type: "new_message",
    message: {
      id: msgId,
      roomId,
      senderId: ws.userId,
      senderType: ws.userType,
      senderName,
      senderPhotoUrl: senderPhotoUrl || null,
      content: content || null,
      type,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      isDeleted: 0,
      createdAt: now,
    },
  };

  broadcastToRoom(roomClients, roomId, outgoing);

  // 방에 없는 멤버에게 알림 생성
  try {
    const roomMembers = sqlite.prepare(
      "SELECT user_id, user_type FROM messenger_members WHERE room_id = ? AND NOT (user_id = ? AND user_type = ?)"
    ).all(roomId, ws.userId, ws.userType);

    const roomRow = sqlite.prepare("SELECT name FROM messenger_rooms WHERE id = ?").get(roomId);
    const notifTitle = `${senderName}: ${(content || "[파일]").slice(0, 50)}`;
    const notifBody = roomRow?.name || null;

    for (const m of roomMembers) {
      const memberWs = userClients?.get(`${m.user_type}:${m.user_id}`);
      const isInRoom = memberWs && roomClients.get(roomId)?.has(memberWs);
      if (!isInRoom) {
        notif.create(m.user_id, m.user_type, "message", notifTitle, notifBody, "/portal/messenger");
      }
    }
  } catch { /* 알림 실패가 메시지 전송에 영향을 미치지 않도록 */ }
}

function handleTyping(ws, msg, roomClients) {
  const { roomId, isTyping } = msg;
  if (!roomId) return;

  const member = sqlite.prepare(
    "SELECT 1 FROM messenger_members WHERE room_id = ? AND user_id = ? AND user_type = ?"
  ).get(roomId, ws.userId, ws.userType);
  if (!member) return;

  broadcastToRoom(roomClients, roomId, {
    type: "typing",
    roomId,
    userId: ws.userId,
    userType: ws.userType,
    isTyping: !!isTyping,
  }, ws); // 본인 제외
}

function handleRead(ws, msg, roomClients) {
  const { roomId } = msg;
  if (!roomId) return;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  sqlite.prepare(
    "UPDATE messenger_members SET last_read_at = ? WHERE room_id = ? AND user_id = ? AND user_type = ?"
  ).run(now, roomId, ws.userId, ws.userType);

  broadcastToRoom(roomClients, roomId, {
    type: "read_receipt",
    roomId,
    userId: ws.userId,
    userType: ws.userType,
    readAt: now,
  }, ws);
}

function handleJoinRoom(ws, msg, roomClients) {
  const { roomId } = msg;
  if (!roomId) return;

  const member = sqlite.prepare(
    "SELECT 1 FROM messenger_members WHERE room_id = ? AND user_id = ? AND user_type = ?"
  ).get(roomId, ws.userId, ws.userType);
  if (!member) return;

  joinRoom(roomClients, roomId, ws);
}

// ─── 유틸 ─────────────────────────────────────────────────────────────
function joinRoom(roomClients, roomId, ws) {
  if (!roomClients.has(roomId)) roomClients.set(roomId, new Set());
  roomClients.get(roomId).add(ws);
}

function broadcastToRoom(roomClients, roomId, payload, exclude = null) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  for (const client of clients) {
    if (client === exclude) continue;
    if (client.readyState === WS_OPEN) client.send(data);
  }
}

function broadcastPresence(roomClients, userId, userType, status) {
  const rooms = sqlite.prepare(
    "SELECT room_id FROM messenger_members WHERE user_id = ? AND user_type = ?"
  ).all(userId, userType);

  const payload = JSON.stringify({ type: "presence", userId, userType, status });
  for (const { room_id } of rooms) {
    const clients = roomClients.get(room_id);
    if (!clients) continue;
    for (const client of clients) {
      if (client.readyState === WS_OPEN && !(client.userId === userId && client.userType === userType)) {
        client.send(payload);
      }
    }
  }
}

function send(ws, payload) {
  if (ws.readyState === WS_OPEN) ws.send(JSON.stringify(payload));
}

function getSenderName(userId, userType) {
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

function getSenderPhotoUrl(userId, userType) {
  if (userType === "portal") {
    try {
      const row = sqlite.prepare("SELECT photo_url FROM portal_users WHERE id = ?").get(userId);
      return row?.photo_url || null;
    } catch { return null; }
  }
  return null;
}

module.exports = { attachChatWs };
