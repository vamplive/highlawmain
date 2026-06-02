/** 실시간 채팅 위젯 — 플로팅 버튼 + 채팅창, 챗봇 API 연동 */
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { getAnalyticsConsent } from "../utils/privacy-consent";

const T = { accent: "var(--accent-gold)", text: "var(--text-primary)", textSec: "var(--text-secondary)", textMuted: "var(--text-muted)" };

const QUICK_REPLIES = ["상담 비용", "상담 예약", "업무분야", "찾아오시는 길"];
const SESSION_KEY = "chatbot_session_id";
const GREETING = "안녕하세요! 법무법인 하이로입니다. 무엇을 도와드릴까요?";

/** 고유 세션 ID 생성/조회 */
function getSessionId() {
  if (!getAnalyticsConsent()) return null;
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget({ buttonBottom = 228, hideToggleButton = false }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const listRef = useRef(null);

  /** 채팅창 열 때 인사 메시지 추가 */
  const handleOpen = useCallback(() => {
    setOpen(true);
    if (!initialized) {
      setMessages([{ role: "bot", content: GREETING }]);
      setInitialized(true);
    }
  }, [initialized]);

  /** 외부에서 챗봇을 열 수 있도록 커스텀 이벤트 리스너 등록 */
  useEffect(() => {
    const handleOpenChat = () => handleOpen();
    window.addEventListener("open-chatbot", handleOpenChat);
    return () => window.removeEventListener("open-chatbot", handleOpenChat);
  }, [handleOpen]);

  /** 챗봇 개폐 상태를 전역으로 브로드캐스트 (퀵메뉴 등과 레이아웃 연동) */
  useEffect(() => {
    const event = new CustomEvent("chatbot-state", { detail: { open } });
    window.dispatchEvent(event);
  }, [open]);

  /** 스크롤 하단 고정 */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  /** 메시지 전송 */
  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;

    const userMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const json = await api.post("/chatbot/chat", { message: content, sessionId: getSessionId() });
      const botReply = json.data?.answer || json.data?.reply || json.data?.message || "죄송합니다. 잠시 후 다시 시도해주세요.";
      setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setSending(false);
    }
  };

  /** 퀵 리플라이 클릭 */
  const handleQuickReply = (text) => sendMessage(text);

  return (
    <>
      {/* ==================== 토글 버튼 ==================== */}
      {!open && !hideToggleButton && (
        <button
          onClick={handleOpen}
          aria-label="법률 상담 채팅 열기"
          style={{
            position: "fixed", bottom: buttonBottom, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%",
            background: T.accent, border: "none", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          title="법률 상담 도우미"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      <style>{`
        .chatbot-window {
          position: fixed;
          bottom: 24px;
          right: 138px; /* 데스크톱에서 퀵메뉴와 나란히 배치하도록 오프셋 조정 */
          z-index: 9999;
          width: 360px;
          height: 480px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 10px 35px rgba(11, 31, 58, 0.16);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          border: 1px solid rgba(11, 31, 58, 0.08);
        }

        @media (max-width: 768px) {
          .chatbot-window {
            right: 16px !important;
            bottom: 16px !important;
            width: calc(100vw - 32px) !important;
            height: calc(100vh - 100px) !important;
            border-radius: 12px !important;
          }
        }
      `}</style>

      {/* ==================== 채팅 창 ==================== */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="법률 상담 채팅"
          className="chatbot-window"
        >
          {/* 헤더 */}
          <div style={{
            padding: "14px 18px",
            background: T.accent,
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>법률 상담 도우미</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="법률 상담 채팅 닫기"
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
            >
              &#10005;
            </button>
          </div>

          {/* 메시지 목록 */}
          <div
            ref={listRef}
            aria-live="polite"
            aria-relevant="additions text"
            style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  background: msg.role === "user" ? T.accent : "#f0f0f0",
                  color: msg.role === "user" ? "#fff" : T.text,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: msg.role === "bot" ? 4 : 14,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* 퀵 리플라이 (첫 인사 후 표시) */}
            {messages.length === 1 && messages[0].role === "bot" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    style={{
                      padding: "6px 14px", fontSize: 12, borderRadius: 16,
                      border: `1px solid ${T.accent}`, background: "transparent",
                      color: T.accent, cursor: "pointer", fontWeight: 500,
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: 14, background: "#f0f0f0", fontSize: 13, color: T.textMuted }}>
                  &#8230; 답변 작성 중
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div style={{
            padding: "10px 14px", borderTop: "1px solid #eee",
            display: "flex", gap: 8, flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              aria-label="채팅 메시지 입력"
              placeholder="메시지를 입력하세요..."
              style={{
                flex: 1, padding: "10px 14px", fontSize: 13, border: "1px solid #ddd",
                borderRadius: 20, outline: "none", fontFamily: "inherit",
              }}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              aria-label={sending ? "메시지 전송 중" : "채팅 메시지 보내기"}
              style={{
                width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: "50%",
                background: input.trim() ? T.accent : "#ddd",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {/* AI 고지 — 자동 응답임을 사용자에게 명시 (관련 법령 준수) */}
          <div
            role="note"
            style={{
              padding: "6px 14px 8px",
              fontSize: 11,
              color: T.textMuted,
              textAlign: "center",
              borderTop: "1px solid #f3f3f3",
              background: "#fafafa",
              flexShrink: 0,
              lineHeight: 1.4,
            }}
          >
            본 채팅은 AI가 자동으로 답변합니다. 정확한 상담은 변호사 상담을 이용해 주세요.
          </div>
        </div>
      )}
    </>
  );
}
