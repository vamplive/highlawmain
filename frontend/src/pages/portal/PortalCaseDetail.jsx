/** 포털 사건 상세 -- 서류/메시지 탭, 채팅 스레드 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T } from "./portalStyles";
import { STATUS_MAP } from "./portalConstants";
import { showToast } from "../../utils/showToast";

export default function PortalCaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("documents");

  /* 서류 */
  const [documents, setDocuments] = useState([]);

  /* 메시지 */
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const msgListRef = useRef(null);

  /** 사건 + 서류 + 메시지 로드 */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [caseRes, msgRes] = await Promise.all([
        portalApi.get(`/cases/${id}`),
        portalApi.get(`/cases/${id}/messages`).catch(() => ({ data: [] })),
      ]);
      setCaseData(caseRes.data ?? null);
      setDocuments(caseRes.data?.documents ?? []);
      setMessages(msgRes.data ?? []);
    } catch {
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /** 메시지 스크롤 하단 고정 */
  useEffect(() => {
    if (msgListRef.current) {
      msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
    }
  }, [messages]);

  /** 메시지 전송 */
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await portalApi.post(`/cases/${id}/messages`, { content: newMessage.trim(), senderType: "client" });
      setNewMessage("");
      const res = await portalApi.get(`/cases/${id}/messages`);
      setMessages(res.data ?? []);
    } catch (err) {
      showToast("전송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const tabBtnStyle = (active) => ({
    padding: "10px 24px", fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? T.accent : T.textSec,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  if (loading) {
    return <p style={{ color: T.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>로딩 중...</p>;
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 15, color: T.textSec, marginBottom: 16 }}>사건을 찾을 수 없습니다</p>
        <Link to="/portal" style={{ fontSize: 13, color: T.accent, textDecoration: "none" }}>대시보드로 돌아가기</Link>
      </div>
    );
  }

  const statusStyle = STATUS_MAP[caseData.status] || STATUS_MAP["접수"];

  return (
    <div>
      {/* ==================== 뒤로가기 ==================== */}
      <Link to="/portal" style={{ fontSize: 13, color: T.textMuted, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        &#8592; 대시보드
      </Link>

      {/* ==================== 사건 헤더 ==================== */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
        padding: 28, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: 0, fontFamily: "'Noto Serif KR', serif" }}>
            {caseData.title}
          </h1>
          <span style={{
            fontSize: 12, padding: "4px 12px", borderRadius: 10,
            background: statusStyle.bg, color: statusStyle.color, fontWeight: 500,
          }}>
            {caseData.status}
          </span>
        </div>

        {/* 전자소송 메타 요약 */}
        {(caseData.caseNumber || caseData.court || caseData.plaintiff || caseData.defendant) && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "8px 18px", marginBottom: 12,
          }}>
            {[
              { label: "사건번호", value: caseData.caseNumber, mono: true },
              { label: "재판부", value: caseData.court },
              { label: "원고", value: caseData.plaintiff },
              { label: "피고", value: caseData.defendant },
            ].filter((r) => r.value).map((r) => (
              <div key={r.label}>
                <div style={{ fontSize: 11, color: T.textMuted }}>{r.label}</div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: r.mono ? "monospace" : "inherit" }}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {caseData.lawyerName && (
          <p style={{ fontSize: 14, color: T.textSec }}>담당 변호사: {caseData.lawyerName}</p>
        )}
        {caseData.description && (
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8, lineHeight: 1.6 }}>{caseData.description}</p>
        )}

        {/* 사건 기록 전체 보기 (전자소송 스타일 두 패널 뷰어) */}
        <Link
          to={`/portal/cases/${id}/records`}
          style={{
            display: "inline-block", marginTop: 14,
            padding: "8px 16px", fontSize: 13, fontWeight: 500,
            color: "#fff", background: T.accent, borderRadius: 4,
            textDecoration: "none",
          }}
        >
          📁 사건기록 열람
        </Link>
      </div>

      {/* ==================== 탭 ==================== */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
        <button onClick={() => setTab("documents")} style={tabBtnStyle(tab === "documents")}>
          서류 ({documents.length})
        </button>
        <button onClick={() => setTab("messages")} style={tabBtnStyle(tab === "messages")}>
          메시지 ({messages.length})
        </button>
      </div>

      {/* ==================== 서류 탭 ==================== */}
      {tab === "documents" && (
        <div>
          {documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
              <p style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>&#x1F4C4;</p>
              <p style={{ fontSize: 14 }}>등록된 서류가 없습니다</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 10,
                    padding: "14px 20px", background: T.card,
                    border: `1px solid ${T.border}`, borderRadius: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4, wordBreak: "break-word" }}>
                      {doc.title || doc.filename}
                    </p>
                    <p style={{ fontSize: 12, color: T.textMuted }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("ko-KR") : ""}
                      {doc.fileSize && <span> &middot; {(doc.fileSize / 1024).toFixed(0)}KB</span>}
                    </p>
                  </div>
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 14px", fontSize: 12, fontWeight: 500,
                        color: T.accent, border: `1px solid ${T.accent}`,
                        borderRadius: 4, textDecoration: "none",
                      }}
                    >
                      다운로드
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 메시지 탭 ==================== */}
      {tab === "messages" && (
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
          overflow: "hidden", display: "flex", flexDirection: "column", height: 460,
        }}>
          {/* 메시지 목록 */}
          <div ref={msgListRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>
                아직 메시지가 없습니다. 아래에서 메시지를 보내보세요.
              </div>
            ) : (
              messages.map((m, i) => {
                const isClient = m.senderType === "client";
                return (
                  <div key={m.id || i} style={{ display: "flex", justifyContent: isClient ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "70%", padding: "10px 16px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                      background: isClient ? T.accent : "#f0f0f0",
                      color: isClient ? "#fff" : T.text,
                      borderBottomRightRadius: isClient ? 4 : 14,
                      borderBottomLeftRadius: isClient ? 14 : 4,
                    }}>
                      {!isClient && (
                        <p style={{ fontSize: 11, fontWeight: 600, color: T.accent, marginBottom: 4 }}>
                          {m.senderName || "변호사"}
                        </p>
                      )}
                      <p style={{ margin: 0 }}>{m.content}</p>
                      <p style={{ fontSize: 10, marginTop: 6, opacity: 0.6, textAlign: "right" }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleString("ko-KR") : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 입력 영역 */}
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="메시지를 입력하세요..."
              disabled={sending}
              style={{
                flex: 1, padding: "10px 14px", fontSize: 13,
                border: `1px solid ${T.border}`, borderRadius: 20,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              style={{
                padding: "10px 20px", fontSize: 13, fontWeight: 500,
                color: "#fff", background: newMessage.trim() ? T.accent : "#ccc",
                border: "none", borderRadius: 20, cursor: newMessage.trim() ? "pointer" : "default",
                transition: "background 0.2s",
              }}
            >
              {sending ? "..." : "전송"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
