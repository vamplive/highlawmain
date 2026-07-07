/**
 * 포털 메신저 — KakaoWork 스타일 실시간 채팅
 * - WebSocket (ws://.../ws/chat) 실시간 연결
 * - 1:1 채팅 + 그룹 채팅
 * - 파일 첨부 / 드래그&드롭 지원
 * - 채팅방 이름 변경
 * - 배경색 + 배경 이미지 설정
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api, portalApi } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import {
  MessageSquare, Plus, Search, Send, Paperclip,
  Users, X, User, Check, CheckCheck,
  Download, Trash2, MoreVertical, Edit2, Image,
  Clock, ChevronDown, ChevronUp, Play, Square,
} from "lucide-react";

// ─── 색상 상수 ───────────────────────────────────────────────────────
const C = {
  bg: "#f0f2f5",
  sidebar: "#ffffff",
  sidebarBorder: "#e8eaed",
  header: "#ffffff",
  accent: "#0ea5e9",
  accentLight: "#f0f9ff",
  msgBubbleSelf: "#0ea5e9",
  msgBubbleOther: "#ffffff",
  text: "#1e293b",
  textSec: "#64748b",
  textMuted: "#94a3b8",
  online: "#22c55e",
  border: "#e2e8f0",
};

// ─── 배경색 프리셋 ──────────────────────────────────────────────────
const BG_PRESETS = [
  { label: "기본", color: "#f0f2f5" },
  { label: "하늘색", color: "#dbeafe" },
  { label: "민트", color: "#d1fae5" },
  { label: "라벤더", color: "#ede9fe" },
  { label: "복숭아", color: "#fce7f3" },
  { label: "아이보리", color: "#fef9c3" },
  { label: "화이트", color: "#ffffff" },
];

// ─── REST→내부 필드 정규화 ────────────────────────────────────────
function normalizeMsg(m) {
  return {
    id: m.id,
    roomId:        m.room_id        ?? m.roomId,
    senderId:      m.sender_id      ?? m.senderId,
    senderType:    m.sender_type    ?? m.senderType,
    senderName:    m.sender_name    ?? m.senderName,
    senderPhotoUrl: m.sender_photo_url ?? m.senderPhotoUrl ?? null,
    content:       m.content,
    type:          m.type,
    fileUrl:       m.file_url       ?? m.fileUrl,
    fileName:      m.file_name      ?? m.fileName,
    fileSize:      m.file_size      ?? m.fileSize,
    isDeleted:     m.is_deleted     ?? m.isDeleted,
    createdAt:     m.created_at     ?? m.createdAt,
  };
}

// ─── WebSocket 관리 ──────────────────────────────────────────────────
function useMessengerWs(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const connectRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = (() => {
      const loc = window.location;
      const proto = loc.protocol === "https:" ? "wss:" : "ws:";
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
      reconnectTimer.current = setTimeout(() => connectRef.current?.(), 3000);
    };

    ws.onerror = () => ws.close();
  }, [onMessage]);

  useEffect(() => {
    connectRef.current = connect;
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
function Avatar({ name = "?", photoUrl = null, size = 36, color = "#0ea5e9" }) {
  const [objPos, setObjPos] = useState("center 15%");
  const imgRef = useRef(null);

  function handleLoad() {
    const img = imgRef.current;
    if (!img || !("FaceDetector" in window)) return;
    try {
      const fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      fd.detect(img).then((faces) => {
        if (!faces.length || !imgRef.current) return;
        const { boundingBox: b } = faces[0];
        const el = imgRef.current;
        const x = ((b.x + b.width / 2) / el.naturalWidth * 100).toFixed(0);
        const y = ((b.y + b.height / 2) / el.naturalHeight * 100).toFixed(0);
        setObjPos(`${x}% ${y}%`);
      }).catch(() => {});
    } catch {}
  }

  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        flexShrink: 0, overflow: "hidden",
      }}>
        <img
          ref={imgRef}
          src={photoUrl}
          alt=""
          onLoad={handleLoad}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: objPos }}
        />
      </div>
    );
  }
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
const AVATAR_COLORS = ["#0ea5e9", "#0891b2", "#059669", "#d97706", "#dc2626", "#06b6d4", "#2563eb"];
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

  // 타이머 상태 (메신저 내 표시)
  const [timerStatuses, setTimerStatuses] = useState({}); // { userId: { caseTitle, startedAt } }
  const [timerPanelOpen, setTimerPanelOpen] = useState(false);
  const [timerCases, setTimerCases] = useState([]);
  const [timerActiveCaseId, setTimerActiveCaseId] = useState(null);
  const [timerActiveTitle, setTimerActiveTitle] = useState(null);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerCaseSearch, setTimerCaseSearch] = useState("");
  const [timerStarting, setTimerStarting] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "direct" | "group"
  const [showNewChat, setShowNewChat] = useState(false);
  const [userList, setUserList] = useState({ portal: [], admin: [] });
  const [newChatSearch, setNewChatSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [myProfile, setMyProfile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [roomMenu, setRoomMenu] = useState(null); // { roomId, x, y }
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [chatBg, setChatBg] = useState(() => {
    try { return JSON.parse(localStorage.getItem("messengerBg") || "{}"); } catch { return {}; }
  });
  const [chatBgImage, setChatBgImage] = useState(() => {
    try { return JSON.parse(localStorage.getItem("messengerBgImage") || "{}"); } catch { return {}; }
  });
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // 방 메뉴 / 헤더 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!roomMenu && !showHeaderMenu && !showBgPicker) return;
    function close(e) {
      if (e.target.closest?.("[data-menu]")) return;
      setRoomMenu(null);
      setShowHeaderMenu(false);
      setShowBgPicker(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [roomMenu, showHeaderMenu, showBgPicker]);

  // ─ WebSocket 메시지 핸들러
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case "new_message": {
        const msg = normalizeMsg(data.message);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          if (msg.roomId !== activeRoomIdRef.current) {
            setRooms((rms) => rms.map((r) =>
              r.id === msg.roomId
                ? { ...r, unreadCount: (r.unreadCount || 0) + 1, lastMessagePreview: msg.content || "[파일]", lastMessageAt: msg.createdAt }
                : r
            ));
            return prev;
          }
          return [...prev, msg];
        });
        break;
      }
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

  // ─ 타이머 상태 폴링 (30초마다)
  useEffect(() => {
    let cancelled = false;
    const fetchTimers = () => {
      portalApi.get("/time-entries/active-all").then(res => {
        if (cancelled) return;
        const map = {};
        (res.data?.data || []).forEach(row => {
          map[row.portal_user_id] = { caseTitle: row.case_title, startedAt: row.started_at };
        });
        setTimerStatuses(map);
      }).catch(() => {});
    };
    fetchTimers();
    const iv = setInterval(fetchTimers, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  // ─ 내 활성 타이머 로드
  useEffect(() => {
    portalApi.get("/time-entries/active").then(res => {
      const d = res.data?.data;
      if (d) {
        setTimerActiveCaseId(d.caseId);
        setTimerActiveTitle(d.caseTitle);
        setTimerStartedAt(d.startedAt ? new Date(d.startedAt) : null);
      }
    }).catch(() => {});
    portalApi.get("/cases").then(res => {
      setTimerCases(res.data?.data || []);
    }).catch(() => {});
  }, []);

  // ─ 타이머 경과시간 (1초 갱신)
  useEffect(() => {
    if (!timerStartedAt) { setTimerElapsed(0); return; }
    const iv = setInterval(() => {
      setTimerElapsed(Math.floor((Date.now() - timerStartedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [timerStartedAt]);

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
      setMessages((res.data ?? []).map(normalizeMsg));
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

  // ─ 타이머 헬퍼
  function fmtElapsed(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
  }

  async function handleTimerStart(caseId) {
    if (!caseId) return;
    setTimerStarting(true);
    try {
      await portalApi.post("/time-entries/timer/start", { caseId });
      const c = timerCases.find(x => x.id === caseId);
      setTimerActiveCaseId(caseId);
      setTimerActiveTitle(c?.title || "");
      setTimerStartedAt(new Date());
    } catch (e) { console.error(e); }
    finally { setTimerStarting(false); }
  }

  async function handleTimerStop() {
    try {
      await portalApi.post("/time-entries/timer/stop", {});
      setTimerActiveCaseId(null);
      setTimerActiveTitle(null);
      setTimerStartedAt(null);
      setTimerElapsed(0);
    } catch (e) { console.error(e); }
  }

  // ─ 메시지 전송
  async function sendMessage(e) {
    e?.preventDefault();
    const content = msgInput.trim();
    if (!content || !activeRoomId || sending) return;

    setSending(true);
    setMsgInput("");
    wsSend({ type: "send_message", roomId: activeRoomId, content, contentType: "text" });
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

  // ─ 파일 업로드 (공통 헬퍼)
  async function uploadFile(file) {
    if (!file || !activeRoomId) return;
    setFileUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.upload(`/chat/rooms/${activeRoomId}/files`, form);
      const { fileUrl, fileName, fileSize } = res.data;
      wsSend({ type: "send_message", roomId: activeRoomId, content: null, contentType: "file", fileUrl, fileName, fileSize });
    } catch {
      showToast("파일 업로드 실패", "error");
    } finally {
      setFileUploading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await uploadFile(file);
  }

  // ─ 드래그&드롭
  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }
  function handleDragEnter(e) { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }
  function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }
  async function handleDrop(e) {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  // ─ 메시지 삭제
  async function deleteMessage(msgId) {
    try {
      await api.delete(`/chat/messages/${msgId}`);
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, isDeleted: 1, content: null } : m
      ));
    } catch {
      showToast("메시지 삭제 실패", "error");
    }
  }

  // ─ 방 나가기
  async function leaveRoom(roomId) {
    if (!confirm("채팅방에서 나가시겠습니까?")) return;
    try {
      await api.post(`/chat/rooms/${roomId}/leave`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) setActiveRoomId(null);
    } catch {
      showToast("나가기 실패", "error");
    }
    setRoomMenu(null);
    setShowHeaderMenu(false);
  }

  // ─ 채팅방 이름 변경
  function openRenameDialog(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    setRenameInput(room?.displayName || room?.name || "");
    setShowRenameDialog(true);
    setShowHeaderMenu(false);
    setRoomMenu(null);
  }

  async function submitRename() {
    if (!renameInput.trim() || !activeRoomId) return;
    try {
      await api.patch(`/chat/rooms/${activeRoomId}/name`, { name: renameInput.trim() });
      setRooms((prev) => prev.map((r) =>
        r.id === activeRoomId ? { ...r, name: renameInput.trim(), displayName: renameInput.trim() } : r
      ));
      setShowRenameDialog(false);
    } catch {
      showToast("이름 변경 실패", "error");
    }
  }

  // ─ 배경색 적용
  function applyBgColor(color) {
    if (!activeRoomId) return;
    const next = { ...chatBg, [activeRoomId]: color };
    setChatBg(next);
    try { localStorage.setItem("messengerBg", JSON.stringify(next)); } catch {}
    setShowBgPicker(false);
  }

  // ─ 배경 이미지 적용
  function handleBgImageChange(e) {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const next = { ...chatBgImage, [activeRoomId]: dataUrl };
      setChatBgImage(next);
      try { localStorage.setItem("messengerBgImage", JSON.stringify(next)); } catch {}
    };
    reader.readAsDataURL(file);
    setShowBgPicker(false);
  }

  function removeBgImage() {
    if (!activeRoomId) return;
    const next = { ...chatBgImage };
    delete next[activeRoomId];
    setChatBgImage(next);
    try { localStorage.setItem("messengerBgImage", JSON.stringify(next)); } catch {}
  }

  // ─ 새 채팅 시작
  async function startChat() {
    if (selectedUsers.length === 0) return;
    const type = selectedUsers.length === 1 ? "direct" : "group";
    try {
      const res = await api.post("/chat/rooms", {
        type,
        name: type === "group" ? (newGroupName || "그룹 채팅") : undefined,
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
  const currentBgImage = chatBgImage[activeRoomId] || null;
  const currentBg = chatBg[activeRoomId] || C.bg;
  const activeRoomOther = activeRoom?.type === "direct"
    ? activeRoom.members?.find((m) => !(m.user_id === myUserId && m.user_type === "portal"))
    : null;

  // ─ 타이핑 텍스트
  const typingCount = Object.keys(typingUsers[activeRoomId] || {}).length;
  const typingText = typingCount > 0 ? "입력 중..." : "";

  // ─ 사용자 목록 (새 채팅)
  const allUsers = [
    ...userList.portal.map((u) => ({ ...u, userType: "portal" })),
    ...userList.admin.map((u) => ({ ...u, userType: "admin" })),
  ];
  const filteredNewUsers = allUsers.filter((u) =>
    (u.display_name || u.email || "").toLowerCase().includes(newChatSearch.toLowerCase())
  );

  // ─ 메시지 날짜 구분선 여부
  function needsDateSep(msgs, idx) {
    if (idx === 0) return true;
    return fmtDateSep(msgs[idx - 1].createdAt) !== fmtDateSep(msgs[idx].createdAt);
  }

  const menuBtnStyle = {
    width: "100%", padding: "10px 16px", border: "none", background: "transparent",
    textAlign: "left", cursor: "pointer", fontSize: 13, color: C.text,
    display: "flex", alignItems: "center", gap: 8,
  };
  const menuDangerBtnStyle = { ...menuBtnStyle, color: "#ef4444" };

  // ─ 메시지 영역 배경 스타일
  const msgAreaStyle = currentBgImage
    ? { backgroundImage: `url(${currentBgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: currentBg };

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
            const otherMember = room.type === "direct"
              ? room.members?.find((m) => !(m.user_id === myUserId && m.user_type === "portal"))
              : null;

            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setRoomMenu({ roomId: room.id, x: e.clientX, y: e.clientY });
                }}
                style={{
                  width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  border: "none", background: isActive ? C.accentLight : "transparent",
                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                  borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {room.type === "group"
                    ? <div style={{ width: 40, height: 40, borderRadius: 12, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={18} color="#0284c7" /></div>
                    : <Avatar name={room.displayName} photoUrl={otherMember?.photoUrl} size={40} color={avatarColor(room.displayName || "")} />
                  }
                  {otherOnline && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: C.online, border: "2px solid white" }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.displayName || "채팅방"}
                      {room.type === "group" && room.members && (
                        <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 4 }}>{room.members.length}</span>
                      )}
                    </span>
                    {room.type === "direct" && otherMember && timerStatuses[otherMember.user_id] && (
                      <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: "#d97706", background: "#fef3c7", borderRadius: 8, padding: "1px 5px", marginLeft: 4, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Clock size={9} />{timerStatuses[otherMember.user_id].caseTitle || "진행 중"}
                      </span>
                    )}
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

        {/* 타이머 패널 */}
        <div style={{ borderTop: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
          <button onClick={() => setTimerPanelOpen(p => !p)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 16px",
            background: timerActiveCaseId ? "#fffbeb" : "transparent", border: "none", cursor: "pointer",
            color: timerActiveCaseId ? "#d97706" : C.textMuted, fontSize: 13, fontWeight: timerActiveCaseId ? 600 : 400,
          }}>
            <Clock size={15} color={timerActiveCaseId ? "#d97706" : C.textMuted} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {timerActiveCaseId ? `${timerActiveTitle || "타이머 진행 중"}  ${fmtElapsed(timerElapsed)}` : "타임트래킹"}
            </span>
            {timerPanelOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {timerPanelOpen && (
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.sidebarBorder}`, background: "#fafafa" }}>
              {timerActiveCaseId ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 13, color: "#374151", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {timerActiveTitle || "알 수 없음"}
                  </div>
                  <div style={{ fontSize: 24, fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#d97706", textAlign: "center", letterSpacing: 2 }}>
                    {fmtElapsed(timerElapsed)}
                  </div>
                  <button onClick={handleTimerStop} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8,
                    background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}>
                    <Square size={12} fill="#fff" /> 타이머 종료
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={timerCaseSearch}
                    onChange={e => setTimerCaseSearch(e.target.value)}
                    placeholder="사건 검색..."
                    style={{ padding: "7px 10px", fontSize: 12, border: `1px solid ${C.border}`, borderRadius: 7, background: "#fff", color: C.text, width: "100%", boxSizing: "border-box" }}
                  />
                  <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                    {timerCases
                      .filter(c => !timerCaseSearch || (c.title || "").includes(timerCaseSearch))
                      .slice(0, 30)
                      .map(c => (
                        <button key={c.id} onClick={() => handleTimerStart(c.id)} disabled={timerStarting} style={{
                          padding: "6px 10px", fontSize: 12, textAlign: "left", borderRadius: 6,
                          border: "none", background: "#fff", color: C.text, cursor: "pointer",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          <Play size={10} style={{ marginRight: 5, color: "#22c55e", verticalAlign: "middle" }} />
                          {c.title || c.id}
                        </button>
                      ))}
                    {timerCases.length === 0 && (
                      <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "8px 0" }}>담당 사건이 없습니다</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 메신저 다운로드 버튼 */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.sidebarBorder}`, flexShrink: 0 }}>
          <a
            href="/uploads/messenger/highlaw-messenger-setup.exe"
            download="하이로메신저설치.exe"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
              background: C.accentLight, border: `1px solid #ddd6fe`,
              borderRadius: 8, textDecoration: "none", color: C.accent,
              fontSize: 12, fontWeight: 600, transition: "background 0.1s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#ede9fe"}
            onMouseLeave={(e) => e.currentTarget.style.background = C.accentLight}
          >
            <Download size={14} />
            하이로 메신저 다운로드
          </a>
        </div>
      </div>

      {/* ── 오른쪽 채팅 영역 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        {activeRoomId && activeRoom ? (
          <>
            {/* 채팅 헤더 */}
            <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", background: C.header, borderBottom: `1px solid ${C.border}`, gap: 12, flexShrink: 0 }}>
              {activeRoom.type === "group"
                ? <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={15} color="#0284c7" /></div>
                : <Avatar name={activeRoom.displayName} photoUrl={activeRoomOther?.photoUrl} size={32} color={avatarColor(activeRoom.displayName || "")} />
              }
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{activeRoom.displayName || "채팅방"}</span>
                  {activeRoom.type === "direct" && activeRoomOther && timerStatuses[activeRoomOther.user_id] && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d97706", background: "#fef3c7", borderRadius: 10, padding: "2px 8px" }}>
                      <Clock size={10} /> {timerStatuses[activeRoomOther.user_id].caseTitle || "타이머 진행 중"}
                    </span>
                  )}
                </div>
                {typingText
                  ? <div style={{ fontSize: 11, color: C.accent }}>{typingText}</div>
                  : activeRoom.type === "group"
                    ? <div style={{ fontSize: 11, color: C.textMuted }}>{activeRoom.members?.length || 0}명</div>
                    : null
                }
              </div>

              {/* ⋮ 메뉴 버튼 */}
              <div style={{ marginLeft: "auto", position: "relative" }}>
                <button
                  data-menu
                  onClick={(e) => { e.stopPropagation(); setShowHeaderMenu((p) => !p); }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted, padding: 8, borderRadius: 8, display: "flex" }}
                >
                  <MoreVertical size={18} />
                </button>

                {showHeaderMenu && (
                  <div
                    data-menu
                    style={{
                      position: "absolute", right: 0, top: "calc(100% + 4px)",
                      background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      zIndex: 200, minWidth: 160, border: `1px solid ${C.border}`, overflow: "hidden",
                    }}
                  >
                    <button
                      data-menu
                      style={menuBtnStyle}
                      onClick={() => openRenameDialog(activeRoomId)}
                    >
                      <Edit2 size={14} />
                      이름 변경
                    </button>
                    <button
                      data-menu
                      style={menuBtnStyle}
                      onClick={() => { setShowBgPicker(true); setShowHeaderMenu(false); }}
                    >
                      🎨 배경 바꾸기
                    </button>
                    <div style={{ height: 1, background: C.border }} />
                    <button
                      data-menu
                      style={menuDangerBtnStyle}
                      onClick={() => leaveRoom(activeRoomId)}
                    >
                      나가기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 메시지 목록 (드래그&드롭 영역) */}
            <div
              style={{
                flex: 1, overflowY: "auto", padding: "16px 20px",
                display: "flex", flexDirection: "column", gap: 4,
                position: "relative",
                ...msgAreaStyle,
              }}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* 드래그 오버레이 */}
              {isDragging && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 50,
                  background: "rgba(124,58,237,0.12)",
                  border: "2px dashed #0ea5e9",
                  borderRadius: 8,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <Paperclip size={32} color="#0ea5e9" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0ea5e9" }}>파일을 여기에 놓으세요</span>
                </div>
              )}

              {loadingMessages ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 24 }}>로딩 중...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textMuted, padding: 40 }}>
                  <MessageSquare size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div style={{ fontSize: 13 }}>첫 메시지를 보내보세요</div>
                </div>
              ) : messages.map((msg, idx) => {
                const isSelf = msg.senderType === "portal" && msg.senderId === myUserId;
                const showDate = needsDateSep(messages, idx);
                const showName = !isSelf && activeRoom.type === "group";
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId && prevMsg.senderType === msg.senderType
                  && !needsDateSep(messages, idx);
                const isHovered = hoveredMsgId === msg.id;

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
                        <span style={{ fontSize: 11, color: C.textMuted, background: "rgba(0,0,0,0.06)", padding: "2px 10px", borderRadius: 10 }}>
                          {fmtDateSep(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: "flex", flexDirection: isSelf ? "row-reverse" : "row",
                      alignItems: "flex-end", gap: 8,
                      marginTop: isConsecutive ? 2 : 10,
                    }}>
                      {/* 아바타 */}
                      {!isSelf && !isConsecutive
                        ? <Avatar name={msg.senderName || "?"} photoUrl={msg.senderPhotoUrl} size={28} color={avatarColor(msg.senderId || "")} />
                        : !isSelf ? <div style={{ width: 28, flexShrink: 0 }} /> : null
                      }

                      <div
                        style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isSelf ? "flex-end" : "flex-start", gap: 2, position: "relative" }}
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                      >
                        {showName && !isConsecutive && (
                          <span style={{ fontSize: 11, color: C.textSec, paddingLeft: 4 }}>{msg.senderName || "사용자"}</span>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexDirection: isSelf ? "row" : "row-reverse" }}>
                          {/* 삭제 버튼 */}
                          {isSelf && !msg.isDeleted && isHovered && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              title="메시지 삭제"
                              style={{
                                background: "rgba(0,0,0,0.07)", border: "none", borderRadius: 6,
                                padding: "3px 5px", cursor: "pointer", color: "#94a3b8",
                                display: "flex", alignItems: "center", flexShrink: 0,
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}

                          {/* 메시지 버블 */}
                          {msg.isDeleted ? (
                            <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", padding: "6px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 12 }}>
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
                        </div>

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
              <input ref={bgImageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBgImageChange} />

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

        {/* ── 배경 설정 패널 ── */}
        {showBgPicker && (
          <div
            data-menu
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              zIndex: 300, minWidth: 300,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>배경 설정</span>
              <button onClick={() => setShowBgPicker(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            {/* 배경색 */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>배경 색상</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {BG_PRESETS.map(({ label, color }) => (
                <button
                  key={color}
                  data-menu
                  onClick={() => applyBgColor(color)}
                  title={label}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "10px 6px", border: (!currentBgImage && currentBg === color) ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
                    borderRadius: 10, cursor: "pointer", background: "transparent",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: color, border: "1px solid rgba(0,0,0,0.08)" }} />
                  <span style={{ fontSize: 10, color: C.textSec, whiteSpace: "nowrap" }}>{label}</span>
                </button>
              ))}
            </div>

            {/* 배경 이미지 */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>배경 이미지</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                data-menu
                onClick={() => bgImageInputRef.current?.click()}
                style={{
                  flex: 1, padding: "10px 0", border: `2px dashed ${C.border}`,
                  borderRadius: 10, cursor: "pointer", background: "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  color: C.textSec, fontSize: 12,
                }}
              >
                <Image size={20} color={C.textMuted} />
                이미지 선택
              </button>
              {currentBgImage && (
                <button
                  data-menu
                  onClick={() => { removeBgImage(); setShowBgPicker(false); }}
                  style={{
                    flex: 1, padding: "10px 0", border: `2px solid #fca5a5`,
                    borderRadius: 10, cursor: "pointer", background: "#fef2f2",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    color: "#ef4444", fontSize: 12,
                  }}
                >
                  <X size={20} />
                  이미지 제거
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 방 우클릭 컨텍스트 메뉴 ── */}
      {roomMenu && (
        <div
          data-menu
          style={{
            position: "fixed", left: roomMenu.x, top: roomMenu.y,
            background: "#fff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 500, minWidth: 160, border: `1px solid ${C.border}`, overflow: "hidden",
          }}
        >
          <button
            data-menu
            style={menuBtnStyle}
            onClick={() => openRenameDialog(roomMenu.roomId)}
          >
            <Edit2 size={14} />
            이름 변경
          </button>
          {roomMenu.roomId === activeRoomId && (
            <button
              data-menu
              style={menuBtnStyle}
              onClick={() => { setShowBgPicker(true); setRoomMenu(null); }}
            >
              🎨 배경 바꾸기
            </button>
          )}
          <div style={{ height: 1, background: C.border }} />
          <button
            data-menu
            style={menuDangerBtnStyle}
            onClick={() => leaveRoom(roomMenu.roomId)}
          >
            나가기
          </button>
        </div>
      )}

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
                    <Avatar name={u.display_name || u.email} photoUrl={u.photo_url} size={32} color={avatarColor(u.id || "")} />
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

      {/* ── 채팅방 이름 변경 다이얼로그 ── */}
      {showRenameDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRenameDialog(false); }}
        >
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 28px 20px", width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>채팅방 이름 변경</div>
            <input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setShowRenameDialog(false);
              }}
              placeholder="새 채팅방 이름"
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14,
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                outline: "none", boxSizing: "border-box", marginBottom: 16,
              }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.border}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRenameDialog(false)}
                style={{ padding: "8px 18px", border: `1px solid ${C.border}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 13, color: C.textSec }}
              >
                취소
              </button>
              <button
                onClick={submitRename}
                disabled={!renameInput.trim()}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 8,
                  background: renameInput.trim() ? C.accent : "#e2e8f0",
                  color: renameInput.trim() ? "#fff" : C.textMuted,
                  cursor: renameInput.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 600,
                }}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
