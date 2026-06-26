/**
 * 포털 메시지 — 의뢰인 SMS/이메일 발송
 * 포털에 로그인한 변호사/직원이 담당 의뢰인에게 메시지를 직접 발송
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { showToast } from "../../utils/showToast";

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "이메일" },
];

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PortalMessages() {
  const [channel, setChannel] = useState("sms");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // 수신자 목록
  const [recipients, setRecipients] = useState([]);

  // 고객 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef(null);

  // 직접 입력 (DB에 없는 번호)
  const [manualContact, setManualContact] = useState("");

  // 최근 발송 이력
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // 메시지 템플릿
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadLogs();
    loadTemplates();
  }, []);

  // 고객 검색 (이름·전화번호)
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    api.get(`/clients?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.data ?? []);
          setShowDropdown(true);
        }
      })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get("/messages/logs?limit=20");
      setLogs(res.data ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.get("/messages/templates");
      setTemplates(res.data ?? []);
    } catch {
      setTemplates([]);
    }
  };

  const applyTemplate = (tpl) => {
    setChannel(tpl.channel || "sms");
    setSubject(tpl.subject || "");
    setContent(tpl.content || "");
  };

  // 검색 결과에서 고객 선택
  const selectClient = (client) => {
    const contact = channel === "email" ? (client.email || "") : (client.phone || "");
    if (!contact) {
      showToast(
        channel === "email"
          ? `${client.name}님의 이메일이 등록되어 있지 않습니다`
          : `${client.name}님의 전화번호가 등록되어 있지 않습니다`,
        "error"
      );
      return;
    }
    addRecipient({ name: client.name, contact, clientId: client.id });
    setSearchQuery("");
    setShowDropdown(false);
  };

  // 직접 입력으로 수신자 추가
  const addManualContact = () => {
    const contact = manualContact.trim();
    if (!contact) return;
    addRecipient({ name: "", contact });
    setManualContact("");
  };

  const addRecipient = useCallback(({ name, contact, clientId }) => {
    const normalized = contact.trim();
    setRecipients((prev) => {
      if (prev.some((r) => r.contact === normalized)) {
        showToast("이미 추가된 수신자입니다", "error");
        return prev;
      }
      return [...prev, { name, contact: normalized, clientId }];
    });
  }, []);

  const removeRecipient = (contact) => {
    setRecipients((prev) => prev.filter((r) => r.contact !== contact));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (recipients.length === 0) return showToast("수신자를 1명 이상 추가하세요", "error");
    if (!content.trim()) return showToast("내용을 입력하세요", "error");
    if (channel === "email" && !subject.trim()) return showToast("이메일 제목을 입력하세요", "error");

    setSending(true);
    try {
      const res = await api.post("/messages/send", {
        channel,
        recipients: recipients.map((r) => ({ name: r.name, contact: r.contact })),
        subject: channel === "email" ? subject : undefined,
        content,
      });
      const { sent, failed, blocked } = res.data ?? {};
      if (failed > 0 || (blocked && blocked.length > 0)) {
        showToast(`발송 완료: ${sent}명 성공, ${failed}명 실패${blocked?.length ? `, ${blocked.length}명 수신거부` : ""}`, "error");
      } else {
        showToast(`${sent}명에게 발송 완료`, "success");
      }
      setRecipients([]);
      setSubject("");
      setContent("");
      loadLogs();
    } catch (err) {
      showToast(err.message || "발송에 실패했습니다", "error");
    } finally {
      setSending(false);
    }
  };

  const statusColor = { sent: "#2e7d32", failed: "#c62828", pending: "#e65100" };
  const statusLabel = { sent: "발송완료", failed: "실패", pending: "대기" };

  const contactPlaceholder = channel === "sms" ? "010-0000-0000" : "example@email.com";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6 }}>메시지 발송</h1>
        <p style={{ fontSize: 13, color: T.textSec }}>의뢰인에게 SMS 또는 이메일을 직접 발송합니다.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        {/* 발송 폼 */}
        <div>
          <form onSubmit={handleSend} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${T.border}`, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 18 }}>새 메시지 작성</h3>

            {/* 채널 선택 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>발송 채널</label>
              <div style={{ display: "flex", gap: 8 }}>
                {CHANNEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setChannel(opt.value); setRecipients([]); }}
                    style={{
                      padding: "8px 20px", fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: "pointer",
                      border: `1px solid ${channel === opt.value ? T.accent : T.border}`,
                      background: channel === opt.value ? "rgba(201,168,76,0.08)" : "transparent",
                      color: channel === opt.value ? T.accent : T.textSec,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 수신자 추가 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>수신자 추가 *</label>

              {/* 고객 검색 */}
              <div ref={searchRef} style={{ position: "relative", marginBottom: 8 }}>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...fieldStyle, paddingRight: 36 }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="이름 또는 전화번호로 고객 검색..."
                  />
                  {searching && (
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.textMuted }}>
                      검색 중...
                    </span>
                  )}
                </div>

                {/* 검색 결과 드롭다운 */}
                {showDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto",
                    marginTop: 4,
                  }}>
                    {searchResults.map((client) => {
                      const contact = channel === "email" ? client.email : client.phone;
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => selectClient(client)}
                          style={{
                            width: "100%", padding: "10px 14px", textAlign: "left",
                            background: "transparent", border: "none", cursor: "pointer",
                            borderBottom: `1px solid ${T.border}`, display: "flex",
                            alignItems: "center", justifyContent: "space-between", gap: 8,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f9f7f2"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{client.name}</div>
                            <div style={{ fontSize: 11, color: T.textSec }}>
                              {contact || <span style={{ color: "#c62828" }}>{channel === "email" ? "이메일 없음" : "전화번호 없음"}</span>}
                              {client.category && <span style={{ marginLeft: 6, color: T.textMuted }}>· {client.category}</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: T.accent, flexShrink: 0 }}>+ 추가</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {showDropdown && searchResults.length === 0 && !searching && debouncedQuery.trim() && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: "12px 14px",
                    marginTop: 4, fontSize: 13, color: T.textMuted,
                  }}>
                    검색 결과가 없습니다
                  </div>
                )}
              </div>

              {/* 직접 입력 */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...fieldStyle, flex: 1, marginBottom: 0 }}
                  value={manualContact}
                  onChange={(e) => setManualContact(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManualContact())}
                  placeholder={`직접 입력: ${contactPlaceholder}`}
                />
                <button
                  type="button"
                  onClick={addManualContact}
                  style={{
                    padding: "0 16px", fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${T.accent}`, background: "rgba(201,168,76,0.08)", color: T.accent,
                    whiteSpace: "nowrap",
                  }}
                >
                  추가
                </button>
              </div>

              {/* 선택된 수신자 태그 */}
              {recipients.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {recipients.map((r) => (
                    <div
                      key={r.contact}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 10px 4px 12px", borderRadius: 20,
                        background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.3)`,
                        fontSize: 12, color: T.text,
                      }}
                    >
                      {r.name && <span style={{ fontWeight: 600 }}>{r.name}</span>}
                      <span style={{ color: T.textSec }}>{r.contact}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.contact)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: T.textMuted, fontSize: 14, padding: 0, lineHeight: 1,
                          display: "flex", alignItems: "center",
                        }}
                        title="제거"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <span style={{ fontSize: 11, color: T.textMuted, alignSelf: "center" }}>
                    총 {recipients.length}명
                  </span>
                </div>
              )}
            </div>

            {/* 이메일 제목 */}
            {channel === "email" && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>제목 *</label>
                <input style={fieldStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="이메일 제목" />
              </div>
            )}

            {/* 내용 */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>내용 *</label>
              <textarea
                style={{ ...fieldStyle, height: 140, resize: "vertical" }}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="메시지 내용을 입력하세요"
              />
              {channel === "sms" && (
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, textAlign: "right" }}>
                  {content.length}자 (90바이트 초과 시 LMS로 발송)
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending || recipients.length === 0}
              style={{
                width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 700,
                color: "#fff", background: T.accent, border: "none", borderRadius: 6,
                cursor: (sending || recipients.length === 0) ? "default" : "pointer",
                opacity: (sending || recipients.length === 0) ? 0.5 : 1,
              }}
            >
              {sending ? "발송 중..." : `${recipients.length > 0 ? `${recipients.length}명에게 ` : ""}발송`}
            </button>
          </form>

          {/* 최근 발송 이력 */}
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${T.border}`, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16 }}>최근 발송 이력</h3>
            {logsLoading ? (
              <p style={{ color: T.textMuted, textAlign: "center", padding: 24 }}>로딩 중...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: T.textMuted, textAlign: "center", padding: 24 }}>발송 이력이 없습니다</p>
            ) : (
              <div>
                {logs.map((log, i) => (
                  <div key={log.id} style={{
                    padding: "12px 0", borderBottom: i < logs.length - 1 ? `1px solid ${T.border}` : "none",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#f0f0f0", color: T.textSec, marginRight: 6 }}>
                          {log.channel === "sms" ? "SMS" : "이메일"}
                        </span>
                        {log.recipientContact}
                        {log.recipientName && <span style={{ fontSize: 12, color: T.textSec, marginLeft: 6 }}>{log.recipientName}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 2 }}>{log.content?.slice(0, 60)}{(log.content?.length > 60) ? "..." : ""}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{log.sentAt ? new Date(log.sentAt).toLocaleString("ko-KR") : log.createdAt ? new Date(log.createdAt).toLocaleString("ko-KR") : ""}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#f5f5f5", color: statusColor[log.status] || T.textMuted }}>
                        {statusLabel[log.status] || log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 템플릿 사이드바 */}
        <div>
          <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>메시지 템플릿</h3>
            {templates.length === 0 ? (
              <p style={{ fontSize: 12, color: T.textMuted }}>
                등록된 템플릿이 없습니다.
                <br /><a href="/admin/messages" target="_blank" rel="noreferrer" style={{ color: T.accent }}>관리자 페이지</a>에서 추가하세요.
              </p>
            ) : templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                style={{
                  width: "100%", padding: "10px 12px", marginBottom: 8, fontSize: 12,
                  textAlign: "left", border: `1px solid ${T.border}`, borderRadius: 6,
                  background: "transparent", cursor: "pointer", color: T.text,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{tpl.name}</div>
                <div style={{ color: T.textSec, fontSize: 11 }}>{tpl.content?.slice(0, 50)}...</div>
              </button>
            ))}
          </div>

          {/* 알리고 설정 안내 */}
          <div style={{ background: "#fffdf5", borderRadius: 12, border: `1px solid rgba(201,168,76,0.3)`, padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>📱 SMS 발송 설정</h3>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 0 }}>
              SMS 발송은 <strong>알리고(Aligo)</strong> 서비스를 통해 이루어집니다.
              서버의 <code style={{ background: "#f5f5f5", padding: "1px 4px", borderRadius: 3 }}>.env</code> 파일에
              아래 항목이 설정되어야 합니다:
            </p>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: "monospace", background: "#f5f5f5", padding: 10, borderRadius: 6, color: "#333", lineHeight: 1.8 }}>
              ALIGO_API_KEY=발급받은키<br />
              ALIGO_USER_ID=알리고아이디<br />
              ALIGO_SENDER=발신번호<br />
              ALIGO_TEST_MODE=N
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
