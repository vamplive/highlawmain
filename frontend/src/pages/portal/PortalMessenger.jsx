/**
 * 포털 메신저 — KakaoWork 스타일 실시간 채팅
 * - WebSocket (ws://.../ws/chat) 실시간 연결
 * - 1:1 채팅 + 그룹 채팅
 * - 파일 첨부 지원
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api, portalApi } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import {
  MessageSquare, Plus, Search, Send, Paperclip,
  Users, ChevronDown, X, Hash, User, Check, CheckCheck,
} from "lucide-react";

// ─── 색상 상수 ───────────────────────────────────────────────────────
const C = {
  bg: "#f0f2f5",
  sidebar: "#ffffff",
  sidebarBorder: "#e8eaed",
  header: "#ffffff",
  accent: "#7c3aed",
  accentLight: "#f5f3ff",
  msgBubbleSelf: "#7c3aed",
  msgBubbleOther: "#ffffff",
  text: "#1e293b",
  textSec: "#64748b",
  textMuted: "#94a3b8",
  online: "#22c55e",
  border: "#e2e8f0",
};

// ─── WebSocket 관리 ──────────────────────────────────────────────────
function useMessengerWs(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = (() => {
      const loc = window.location;
      const proto = loc.protocol === "https:" ? "wss:" : "ws:";
      // 개발: Vite 프록시가 /ws → 백엔드로 전달, 프로덕션: 동일 호스트
      return `${proto}//${loc.host}/ws/chat`;
    })();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage(data);
      } catch { /* 무시 */ }
    };

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  return { send };
}

// ─── 날짜 포매터 ─────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function fmtDateSep(iso) {
  if (!iso) return "";
  return new Date(iso.replace(" ", "T")).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ─── 아바타 ──────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 36, color = "#7c3aed" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {String(name).charAt(0).toUpperCase()}
    </div>
  );
}

// 사용자별 고정 색상
const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#2563eb"];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────
export default function PortalMessenger() {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all"); // "all" | "direct" | "group"
  const [showNewChat, setShowNewChat] = useState(false);
  const [userList, setUserList] = useState({ portal: [], admin: [] });
  const [newChatSearch, setNewChatSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [myProfile, setMyProfile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // ─ WebSocket 메시지 핸들러
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case "new_message":
        setMessages((prev) => {
          // 중복 제거
          if (prev.some((m) => m.id === data.message.id)) return prev;
          if (data.message.roomId !== activeRoomIdRef.current) {
            // 다른 방 미확인 배지 갱신
            setRooms((rms) => rms.map((r) =>
              r.id === data.message.roomId
                ? { ...r, unreadCount: (r.unreadCount || 0) + 1, lastMessagePreview: data.message.content || `[파일]`, lastMessageAt: data.message.createdAt }
                : r
            ));
            return prev;
          }
          return [...prev, data.message];
        });
        break;
      case "typing":
        setTypingUsers((prev) => {
          const key = `${data.userId}:${data.userType}`;
          if (data.isTyping) return { ...prev, [data.roomId]: { ...prev[data.roomId], [key]: true } };
          const next = { ...prev };
          if (next[data.roomId]) {
            delete next[data.roomId][key];
            if (Object.keys(next[data.roomId]).length === 0) delete next[data.roomId];
          }
          return next;
        });
        break;
      case "read_receipt":
        break;
      case "presence":
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          const key = `${data.userId}:${data.userType}`;
          if (data.status === "online") next.add(key);
          else next.delete(key);
          return next;
        });
        break;
      default:
        break;
    }
  }, []);

  const activeRoomIdRef = useRef(activeRoomId);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  const { send: wsSend } = useMessengerWs(handleWsMessage);

  // ─ 초기 로드
  useEffect(() => {
    loadRooms();
    loadUserList();
    portalApi.get("/me").then((r) => setMyProfile(r.data)).catch(() => {});
  }, []);

  async function loadRooms() {
    setLoadingRooms(true);
    try {
      const res = await api.get("/chat/rooms");
      setRooms(res.data ?? []);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function loadUserList() {
    try {
      const res = await api.get("/chat/users");
      setUserList(res.data ?? { portal: [], admin: [] });
    } catch { /* 무시 */ }
  }

  // ─ 방 선택 시 메시지 로드
  useEffect(() => {
    if (!activeRoomId) return;
    setMessages([]);
    loadMessages(activeRoomId);
    markRead(activeRoomId);
    wsSend({ type: "join_room", roomId: activeRoomId });
  }, [activeRoomId]);

  async function loadMessages(roomId) {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function markRead(roomId) {
    try {
      await api.post(`/chat/rooms/${roomId}/read`);
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, unreadCount: 0 } : r));
    } catch { /* 무시 */ }
  }

  // ─ 스크롤 최하단
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─ 메시지 전송
  async function sendMessage(e) {
    e?.preventDefault();
    const content = msgInput.trim();
    if (!content || !activeRoomId || sending) return;

    setSending(true);
    setMsgInput("");

    // WS로 전송 (서버에서 저장 후 브로드캐스트)
    wsSend({ type: "send_message", roomId: activeRoomId, content, type: "text" });

    // 타이핑 중지
    wsSend({ type: "typing", roomId: activeRoomId, isTyping: false });
    setSending(false);
  }

  // ─ 타이핑 표시
  function handleInputChange(e) {
    setMsgInput(e.target.value);
    if (!activeRoomId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1000) {
      wsSend({ type: "typing", roomId: activeRoomId, isTyping: true });
      lastTypingSentRef.current = now;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      wsSend({ type: "typing", roomId: activeRoomId, isTyping: false });
    }, 2000);
  }

  // ─ 파일 업로드
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    e.target.value = "";

    setFileUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.upload(`/chat/rooms/${activeRoomId}/files`, form);
      const { fileUrl, fileName, fileSize } = res.data;
      wsSend({ type: "send_message", roomId: activeRoomId, content: null, type: "file", fileUrl, fileName, fileSize });
    } catch {
      showToast("파일 업로드 실패", "error");
    } finally {
      setFileUploading(false);
    }
  }

  // ─ 새 채팅 시작
  async function startChat() {
    if (selectedUsers.length === 0) return;
    const type = selectedUsers.length === 1 ? "direct" : "group";
    try {
      const res = await api.post("/chat/rooms", {
        type,
        name: type === "group" ? (newGroupName || `그룹 채팅`) : undefined,
        members: selectedUsers,
      });
      const { roomId } = res.data;
      await loadRooms();
      setActiveRoomId(roomId);
      setShowNewChat(false);
      setSelectedUsers([]);
      setNewGroupName("");
    } catch {
      showToast("채팅방 생성 실패", "error");
    }
  }

  // ─ 필터된 방 목록
  const myUserId = myProfile?.user?.id || myProfile?.client?.id;
  const filteredRooms = rooms.filter((r) => {
    const matchesTab = tab === "all" || (tab === "direct" && r.type === "direct") || (tab === "group" && r.type === "group");
    const matchesSearch = !searchQuery || (r.displayName || "").includes(searchQuery) || (r.lastMessagePreview || "").includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  // ─ 타이핑 텍스트
  const typingCount = Object.keys(typingUsers[activeRoomId] || {}).length;
  const typingText = typingCount > 0 ? `입력 중...` : "";

  // ─ 사용자 목록 (새 채팅)
  const allUsers = [
    ...userList.portal.map((u) => ({ ...u, userType: "portal" })),
    ...userList.admin.map((u) => ({ ...u, userType: "admin" })),
  ];
  const filteredNewUsers = allUsers.filter((u) =>
    (u.display_name || u.email || "").toLowerCase().includes(newChatSearch.toLowerCase())
  );

  // ─ 메시지 날짜 구분선 여부
  function needsDateSep(messages, idx) {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const curr = messages[idx];
    return fmtDateSep(prev.createdAt) !== fmtDateSep(curr.createdAt);
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)", background: C.bg, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

      {/* ── 왼쪽 사이드바 ── */}
      <div style={{ width: 300, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* 사이드바 헤더 */}
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>메신저</span>
            <button
              onClick={() => setShowNewChat(true)}
              style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
            >
              <Plus size={14} />
              새 채팅
            </button>
          </div>

          {/* 검색 */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="메시지 검색"
              style={{ width: "100%", padding: "7px 10px 7px 30px", fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 8, background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* 탭 */}
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {[{ key: "all", label: "전체" }, { key: "direct", label: "1:1" }, { key: "group", label: "그룹" }].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: "5px 0", fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
                  border: "none", borderRadius: 6, cursor: "pointer",
                  background: tab === t.key ? C.accentLight : "transparent",
                  color: tab === t.key ? C.accent : C.textSec,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingRooms ? (
            <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>로딩 중...</div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
              {searchQuery ? "검색 결과 없음" : "채팅방이 없습니다.\n새 채팅을 시작해 보세요."}
            </div>
          ) : filteredRooms.map((room) => {
            const isActive = room.id === activeRoomId;
            const otherOnline = room.members?.some((m) =>
              !(m.user_id === myUserId) && onlineUsers.has(`${m.user_id}:${m.user_type}`)
            );
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                style={{
                  width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  border: "none", background: isActive ? C.accentLight : "transparent",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                  borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                }}
              >
                {/* 아바타 */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {room.type === "group"
                    ? <div style={{ width: 40, height: 40, borderRadius: 12, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={18} color="#4f46e5" /></div>
                    : <Avatar name={room.displayName} size={40} color={avatarColor(room.displayName || "")} />
                  }
                  {otherOnline && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: C.online, border: "2px solid white" }} />
                  )}
                </div>

                {/* 방 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.displayName || "채팅방"}
                      {room.type === "group" && room.members && (
                        <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{room.members.length}</span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0, marginLeft: 4 }}>
                      {fmtTime(room.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.lastMessagePreview || "대화를 시작해 보세요"}
                    </span>
                    {room.unreadCount > 0 && (
                      <span style={{ background: C.accent, color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>
                        {room.unreadCount > 99 ? "99+" : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 오른쪽 채팅 영역 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {activeRoomId && activeRoom ? (
          <>
            {/* 채팅 헤더 */}
            <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", background: C.header, borderBottom: `1px solid ${C.border}`, gap: 12, flexShrink: 0 }}>
              {activeRoom.type === "group"
                ? <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={15} color="#4f46e5" /></div>
                : <Avatar name={activeRoom.displayName} size={32} color={avatarColor(activeRoom.displayName || "")} />
              }
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{activeRoom.displayName || "채팅방"}</div>
                {typingText
                  ? <div style={{ fontSize: 11, color: C.accent }}>{typingText}</div>
                  : activeRoom.type === "group"
                    ? <div style={{ fontSize: 11, color: C.textMuted }}>{activeRoom.members?.length || 0}명</div>
                    : null
                }
              </div>
            </div>

            {/* 메시지 목록 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
              {loadingMessages ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 24 }}>로딩 중...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 40 }}>
                  <MessageSquare size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>첫 메시지를 보내보세요</div>
                </div>
              ) : messages.map((msg, idx) => {
                const isSelf = msg.senderType === "portal" && msg.senderId === myProfile?.user?.id;
                const showDate = needsDateSep(messages, idx);
                const showName = !isSelf && activeRoom.type === "group";
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && prevMsg.senderType === msg.senderType
                  && !needsDateSep(messages, idx);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                        <span style={{ fontSize: 11, color: C.textMuted, background: "#e2e8f0", padding: "2px 10px", borderRadius: 10 }}>
                          {fmtDateSep(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: "flex", flexDirection: isSelf ? "row-reverse" : "row",
                      alignItems: "flex-end", gap: 8,
                      marginTop: isConsecutive ? 2 : 10,
                    }}>
                      {/* 아바타 (본인 아님 + 연속 아님) */}
                      {!isSelf && !isConsecutive
                        ? <Avatar name={msg.senderName || "?"} size={28} color={avatarColor(msg.senderId || "")} />
                        : !isSelf ? <div style={{ width: 28, flexShrink: 0 }} /> : null
                      }

                      <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isSelf ? "flex-end" : "flex-start", gap: 2 }}>
                        {showName && !isConsecutive && (
                          <span style={{ fontSize: 11, color: C.textSec, paddingLeft: 4 }}>{msg.senderName || "사용자"}</span>
                        )}

                        {/* 메시지 버블 */}
                        {msg.isDeleted ? (
                          <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", padding: "6px 12px", background: "#f1f5f9", borderRadius: 12 }}>
                            삭제된 메시지입니다
                          </div>
                        ) : msg.type === "file" ? (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "10px 14px", borderRadius: 12, textDecoration: "none",
                              background: isSelf ? C.msgBubbleSelf : C.msgBubbleOther,
                              color: isSelf ? "#fff" : C.text,
                              border: isSelf ? "none" : `1px solid ${C.border}`,
                              fontSize: 13,
                            }}
                          >
                            <Paperclip size={14} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{msg.fileName || "파일"}</div>
                              {msg.fileSize && <div style={{ fontSize: 11, opacity: 0.7 }}>{(msg.fileSize / 1024).toFixed(1)} KB</div>}
                            </div>
                          </a>
                        ) : (
                          <div style={{
                            padding: "8px 14px", borderRadius: isSelf ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                            background: isSelf ? C.msgBubbleSelf : C.msgBubbleOther,
                            color: isSelf ? "#fff" : C.text,
                            fontSize: 13, lineHeight: 1.5,
                            border: isSelf ? "none" : `1px solid ${C.border}`,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                            wordBreak: "break-word", whiteSpace: "pre-wrap",
                          }}>
                            {msg.content}
                          </div>
                        )}

                        <span style={{ fontSize: 10, color: C.textMuted }}>{fmtTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <form
              onSubmit={sendMessage}
              style={{ padding: "12px 20px", background: C.header, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-end", gap: 8 }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fileUploading}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted, padding: 8, borderRadius: 8, flexShrink: 0, display: "flex" }}
                title="파일 첨부"
              >
                <Paperclip size={18} />
              </button>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />

              <textarea
                value={msgInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="메시지를 입력하세요 (Enter 전송 / Shift+Enter 줄바꿈)"
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px", fontSize: 13, border: `1px solid ${C.border}`,
                  borderRadius: 20, resize: "none", outline: "none", fontFamily: "inherit",
                  lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />

              <button
                type="submit"
                disabled={!msgInput.trim() || sending}
                style={{
                  background: msgInput.trim() ? C.accent : "#e2e8f0",
                  color: msgInput.trim() ? "#fff" : C.textMuted,
                  border: "none", borderRadius: "50%", width: 40, height: 40,
                  cursor: msgInput.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          /* 방 미선택 상태 */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.textMuted }}>
            <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: C.textSec }}>채팅방을 선택하세요</div>
            <div style={{ fontSize: 13 }}>왼쪽에서 대화를 선택하거나 새 채팅을 시작하세요</div>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                marginTop: 20, padding: "10px 24px", background: C.accent, color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={14} />
              새 채팅 시작
            </button>
          </div>
        )}
      </div>

      {/* ── 새 채팅 모달 ── */}
      {showNewChat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 400, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>새 채팅</span>
              <button onClick={() => { setShowNewChat(false); setSelectedUsers([]); setNewGroupName(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              {selectedUsers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {selectedUsers.map((u) => (
                    <span key={`${u.userId}:${u.userType}`} style={{ display: "flex", alignItems: "center", gap: 4, background: C.accentLight, color: C.accent, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                      {u.displayName}
                      <button onClick={() => setSelectedUsers((p) => p.filter((x) => !(x.userId === u.userId && x.userType === u.userType)))} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.accent, padding: 0, display: "flex" }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedUsers.length > 1 && (
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="그룹 이름 (선택)"
                  style={{ width: "100%", padding: "7px 12px", fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                />
              )}
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
                <input
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="이름 또는 이메일 검색"
                  style={{ width: "100%", padding: "7px 10px 7px 28px", fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 8, background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredNewUsers.map((u) => {
                const isSelected = selectedUsers.some((s) => s.userId === u.id && s.userType === u.userType);
                return (
                  <button
                    key={`${u.id}:${u.userType}`}
                    onClick={() => {
                      if (isSelected) setSelectedUsers((p) => p.filter((x) => !(x.userId === u.id && x.userType === u.userType)));
                      else setSelectedUsers((p) => [...p, { userId: u.id, userType: u.userType, displayName: u.display_name || u.email }]);
                    }}
                    style={{
                      width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
                      border: "none", background: isSelected ? C.accentLight : "transparent",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <Avatar name={u.display_name || u.email} size={32} color={avatarColor(u.id || "")} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.display_name || u.email}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{u.userType === "admin" ? "관리자" : "포털 사용자"}</div>
                    </div>
                    {isSelected && <Check size={16} color={C.accent} />}
                  </button>
                );
              })}
              {filteredNewUsers.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: C.textMuted, fontSize: 13 }}>사용자를 찾을 수 없습니다</div>
              )}
            </div>

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={startChat}
                disabled={selectedUsers.length === 0}
                style={{
                  width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 700,
                  background: selectedUsers.length > 0 ? C.accent : "#e2e8f0",
                  color: selectedUsers.length > 0 ? "#fff" : C.textMuted,
                  border: "none", borderRadius: 8, cursor: selectedUsers.length > 0 ? "pointer" : "default",
                }}
              >
                {selectedUsers.length === 0
                  ? "참여자를 선택하세요"
                  : selectedUsers.length === 1
                    ? `${selectedUsers[0].displayName}와(과) 채팅 시작`
                    : `그룹 채팅 시작 (${selectedUsers.length}명)`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
