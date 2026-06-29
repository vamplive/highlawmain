/**
 * 포털 문자 발송 — 발송 · 템플릿 · 예약 · 이력 · 리포트
 * 채널: SMS/LMS (알리고) | 카카오 알림톡 (알리고 카카오)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import { getByteLength } from "../../utils/formatters";

const SMS_MAX = 90;

/* ── 공통 스타일 ─────────────────────────────── */
const panel = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(15,23,42,.06)" };
const inp = { width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit" };
const ghostBtn = { background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 13, color: "#475569", cursor: "pointer", fontFamily: "inherit" };
const primaryBtn = { background: "#2563eb", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" };
const dangerBtn = { background: "none", border: "1px solid #fca5a5", borderRadius: 6, padding: "6px 12px", fontSize: 13, color: "#dc2626", cursor: "pointer", fontFamily: "inherit" };
const kakaoColor = "#FEE500";
const kakaoTextColor = "#3C1E1E";

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 24, overflowX: "auto" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: "10px 20px", fontSize: 14, fontWeight: active === t.key ? 700 : 400,
          color: active === t.key ? "#2563eb" : "#64748b", background: "none", border: "none",
          borderBottom: active === t.key ? "2px solid #2563eb" : "2px solid transparent",
          cursor: "pointer", whiteSpace: "nowrap",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function ChannelToggle({ channel, onChange }) {
  const btn = (key, label, emoji) => (
    <button onClick={() => onChange(key)} style={{
      flex: 1, padding: "10px 0", fontSize: 13, fontWeight: channel === key ? 700 : 400,
      color: channel === key ? (key === "kakao" ? kakaoTextColor : "#fff") : "#64748b",
      background: channel === key ? (key === "kakao" ? kakaoColor : "#2563eb") : "#f8fafc",
      border: "1px solid " + (channel === key ? (key === "kakao" ? "#d4c000" : "#1d4ed8") : "#e2e8f0"),
      borderRadius: key === "sms" ? "8px 0 0 8px" : "0 8px 8px 0",
      cursor: "pointer", transition: "all .15s",
    }}>{emoji} {label}</button>
  );
  return (
    <div style={{ display: "flex", marginBottom: 16 }}>
      {btn("sms", "SMS / LMS", "💬")}
      {btn("kakao", "카카오 알림톡", "🟡")}
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4"];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[(name||"?").charCodeAt(0) % colors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * .42, flexShrink: 0 }}>
      {(name||"?").charAt(0).toUpperCase()}
    </div>
  );
}

function Badge({ text, color = "#64748b", bg = "#f1f5f9" }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, borderRadius: 4, padding: "2px 7px" }}>{text}</span>;
}

function StatusBadge({ status }) {
  const map = { sent:["성공","#16a34a","#f0fdf4"], failed:["실패","#dc2626","#fef2f2"], pending:["대기","#d97706","#fffbeb"], processing:["처리중","#2563eb","#eff6ff"], cancelled:["취소","#64748b","#f1f5f9"] };
  const [label, color, bg] = map[status] || ["알 수 없음","#64748b","#f1f5f9"];
  return <Badge text={label} color={color} bg={bg} />;
}

function ChannelBadge({ channel }) {
  if (channel === "kakao") return <Badge text="카카오" color={kakaoTextColor} bg={kakaoColor} />;
  return <Badge text="SMS" color="#2563eb" bg="#eff6ff" />;
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ ...ghostBtn, padding: "5px 10px" }}>‹</button>
      <span style={{ fontSize: 13, color: "#64748b", padding: "5px 12px" }}>{page} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} style={{ ...ghostBtn, padding: "5px 10px" }}>›</button>
    </div>
  );
}

function fmtDate(s) {
  if (!s) return "-";
  return new Date(s.replace(" ", "T")).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ── 수신자 패널 (공통) ───────────────────────── */
function RecipientPanel({ recipients, onAdd, onRemove, onClear }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [directPhone, setDirectPhone] = useState("");
  const [directName, setDirectName] = useState("");
  const [showDirect, setShowDirect] = useState(false);
  const debRef = useRef(null);

  const search = (q) => {
    clearTimeout(debRef.current);
    if (!q.trim()) { setResults([]); setShowDrop(false); return; }
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/portal/clients?q=${encodeURIComponent(q)}&limit=10`);
        const items = r.data?.data ?? r.data ?? [];
        setResults(Array.isArray(items) ? items : []);
        setShowDrop(true);
      } catch { setResults([]); }
    }, 280);
  };

  const addFromDB = (item) => {
    if (!item.phone) { showToast("전화번호가 없는 의뢰인입니다"); return; }
    onAdd({ id: item.id, name: item.name, contact: item.phone });
    setQuery(""); setResults([]); setShowDrop(false);
  };

  const addDirect = () => {
    const phone = directPhone.replace(/\D/g, "");
    if (!/^0\d{7,14}$/.test(phone)) { showToast("올바른 전화번호를 입력하세요"); return; }
    onAdd({ id: `d-${phone}`, name: directName.trim() || phone, contact: phone });
    setDirectPhone(""); setDirectName(""); setShowDirect(false);
  };

  return (
    <section style={panel}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#334155", marginBottom: 12 }}>수신자</div>
      <div style={{ position: "relative" }}>
        <input type="text" value={query} onChange={e => { setQuery(e.target.value); search(e.target.value); }} onFocus={() => query && setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 180)} placeholder="이름 또는 전화번호 검색..." style={inp} />
        {showDrop && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(15,23,42,.10)", zIndex: 200, maxHeight: 240, overflowY: "auto" }}>
            {results.length === 0
              ? <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>결과 없음</div>
              : results.map(item => (
                <button key={item.id} onMouseDown={() => addFromDB(item)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <Avatar name={item.name} size={28} />
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{item.phone||"번호 없음"}</div></div>
                </button>
              ))}
          </div>
        )}
      </div>
      <button onClick={() => setShowDirect(v => !v)} style={{ ...ghostBtn, marginTop: 8, width: "100%" }}>+ 직접 추가</button>
      {showDirect && (
        <div style={{ marginTop: 10, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <input type="text" placeholder="이름 (선택)" value={directName} onChange={e => setDirectName(e.target.value)} style={{ ...inp, marginBottom: 6 }} />
          <input type="tel" placeholder="전화번호 (예: 01012345678)" value={directPhone} onChange={e => setDirectPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && addDirect()} style={{ ...inp, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={addDirect} style={primaryBtn}>추가</button>
            <button onClick={() => { setShowDirect(false); setDirectPhone(""); setDirectName(""); }} style={ghostBtn}>취소</button>
          </div>
        </div>
      )}
      {recipients.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{recipients.length}명</span>
            <button onClick={() => { if (window.confirm("전체 삭제?")) onClear(); }} style={{ ...ghostBtn, color: "#ef4444", fontSize: 12, padding: "3px 8px" }}>전체 삭제</button>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {recipients.map(r => (
              <li key={r.contact} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                <Avatar name={r.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{r.contact}</div>
                </div>
                <button onClick={() => onRemove(r.contact)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 15, padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/* ── SMS 작성 패널 ────────────────────────────── */
function SmsComposePanel({ templates, applyTpl, clearApply, recipients }) {
  const [selectedTpl, setSelectedTpl] = useState("");
  const [content, setContent] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const bytes = getByteLength(content);
  const msgType = bytes > SMS_MAX ? "LMS" : "SMS";

  useEffect(() => {
    if (!applyTpl) return;
    setSelectedTpl(String(applyTpl.id));
    setContent(applyTpl.content);
    clearApply();
  }, [applyTpl, clearApply]);

  const applyTemplate = (id) => {
    setSelectedTpl(id);
    const t = templates.find(t => String(t.id) === String(id));
    if (t) setContent(t.content);
  };

  const handleScheduleConfirm = async () => {
    if (!recipients.length) return showToast("수신자를 추가해주세요");
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if (!scheduledAt) return showToast("예약 시각을 입력해주세요");
    if (new Date(scheduledAt).getTime() < Date.now() + 30000) return showToast("예약 시각은 현재 이후여야 합니다");
    setSending(true);
    try {
      await api.post("/portal/sms/schedule", { recipients: recipients.map(r => ({ name: r.name, contact: r.contact })), content: content.trim(), scheduledAt });
      showToast("예약 등록 완료");
      setScheduleMode(false);
      setScheduledAt("");
    } catch (e) { showToast("예약 실패: " + e.message); }
    finally { setSending(false); }
  };

  const handleSend = async () => {
    if (!recipients.length) return showToast("수신자를 추가해주세요");
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if (bytes > 2000) return showToast("2000바이트를 초과합니다");
    if (!window.confirm(`${recipients.length}명에게 ${msgType}를 발송하시겠습니까?`)) return;
    setSending(true); setResult(null);
    try {
      const res = await api.post("/portal/sms/send", { recipients: recipients.map(r => ({ name: r.name, contact: r.contact })), content: content.trim() });
      setResult(res.data);
      if (res.data.sent > 0) showToast(`${res.data.sent}명 발송 완료`);
      if (res.data.failed > 0) showToast(`${res.data.failed}명 실패`);
    } catch (e) { showToast("발송 실패: " + e.message); }
    finally { setSending(false); }
  };

  return (
    <section style={panel}>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#334155", marginBottom: 12 }}>메시지 작성</div>
      {templates.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>템플릿 불러오기</label>
          <select value={selectedTpl} onChange={e => applyTemplate(e.target.value)} style={{ ...inp }}>
            <option value="">-- 템플릿 선택 --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="발송할 메시지를 입력하세요..." rows={9} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 14, fontSize: 12 }}>
        <span style={{ color: bytes > 2000 ? "#ef4444" : bytes > SMS_MAX ? "#f59e0b" : "#64748b" }}>{bytes}B · <strong>{msgType}</strong></span>
        <span style={{ color: "#94a3b8" }}>SMS ≤90B / LMS ≤2000B</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
          <input type="checkbox" checked={scheduleMode} onChange={e => setScheduleMode(e.target.checked)} /> 예약 발송
        </label>
        {scheduleMode && <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ ...inp, width: "auto", flex: 1 }} />}
        {scheduleMode && (
          <button onClick={handleScheduleConfirm}
            disabled={!scheduledAt || !recipients.length || !content.trim() || sending}
            style={{ padding: "9px 16px", background: (!scheduledAt || !recipients.length || !content.trim() || sending) ? "#cbd5e1" : "#0369a1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: (!scheduledAt || !recipients.length || !content.trim() || sending) ? "default" : "pointer", whiteSpace: "nowrap" }}>
            {sending ? "처리 중..." : "확인"}
          </button>
        )}
      </div>
      {scheduleMode && scheduledAt && (
        <div style={{ marginBottom: 10, padding: "8px 12px", background: "#eff6ff", borderRadius: 8, fontSize: 12, color: "#1d4ed8" }}>
          ⏰ {new Date(scheduledAt).toLocaleString("ko-KR")}에 {recipients.length}명에게 예약 발송됩니다
        </div>
      )}
      {!scheduleMode && (
        <button onClick={handleSend} disabled={sending || !recipients.length || !content.trim() || bytes > 2000}
          style={{ width: "100%", padding: "12px 0", background: (sending || !recipients.length || !content.trim() || bytes > 2000) ? "#cbd5e1" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: sending ? "wait" : "pointer" }}>
          {sending ? "처리 중..." : `${recipients.length}명에게 발송`}
        </button>
      )}
      <Result data={result} />
    </section>
  );
}

/* ── 카카오 알림톡 작성 패널 ──────────────────── */
function KakaoComposePanel({ recipients }) {
  const [kakaoTemplates, setKakaoTemplates] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [tplError, setTplError] = useState(null);
  const [selectedTpl, setSelectedTpl] = useState(null); // template object
  const [messages, setMessages] = useState({}); // { contact: message }
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoadingTpl(true);
    api.get("/portal/kakao/templates")
      .then(j => { setKakaoTemplates(j.data ?? []); setTplError(null); })
      .catch(e => setTplError(e.message || "템플릿 조회 실패"))
      .finally(() => setLoadingTpl(false));
  }, []);

  const selectTemplate = (code) => {
    const t = kakaoTemplates.find(t => t.code === code);
    setSelectedTpl(t || null);
    // 템플릿 내용을 기본 메시지로 설정 (변수 치환 전)
    if (t) {
      const defaultMsgs = {};
      recipients.forEach(r => { defaultMsgs[r.contact] = t.content.replace(/#{이름}/g, r.name); });
      setMessages(defaultMsgs);
    }
  };

  // 수신자 추가/변경 시 메시지 동기화
  useEffect(() => {
    if (!selectedTpl) return;
    setMessages(prev => {
      const next = {};
      recipients.forEach(r => {
        next[r.contact] = prev[r.contact] ?? selectedTpl.content.replace(/#{이름}/g, r.name);
      });
      return next;
    });
  }, [recipients, selectedTpl]);

  const handleSend = async () => {
    if (!recipients.length) return showToast("수신자를 추가해주세요");
    if (!selectedTpl) return showToast("알림톡 템플릿을 선택해주세요");
    if (!window.confirm(`${recipients.length}명에게 카카오 알림톡을 발송하시겠습니까?`)) return;
    setSending(true); setResult(null);
    try {
      const recipientsPayload = recipients.map(r => ({
        name: r.name,
        contact: r.contact,
        message: messages[r.contact] || selectedTpl.content,
      }));
      const res = await api.post("/portal/kakao/send", { recipients: recipientsPayload, templateCode: selectedTpl.code });
      setResult(res.data);
      if (res.data.sent > 0) showToast(`${res.data.sent}명 알림톡 발송 완료`);
      if (res.data.failed > 0) showToast(`${res.data.failed}명 실패`);
    } catch (e) { showToast("발송 실패: " + e.message); }
    finally { setSending(false); }
  };

  return (
    <section style={{ ...panel, borderColor: "#d4c000", background: "#fffef0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>🟡</span>
        <div style={{ fontWeight: 700, fontSize: 14, color: kakaoTextColor }}>카카오 알림톡</div>
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>사전 승인 템플릿만 발송 가능</span>
      </div>

      {loadingTpl ? (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>템플릿 불러오는 중...</div>
      ) : tplError ? (
        <div style={{ color: "#dc2626", fontSize: 13, padding: "12px 0", background: "#fef2f2", borderRadius: 8, padding: 12 }}>
          ⚠ {tplError}
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>알리고 카카오 알림톡 서비스 신청 및 채널 연동 상태를 확인해 주세요.</div>
        </div>
      ) : kakaoTemplates.length === 0 ? (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
          승인된 알림톡 템플릿이 없습니다.<br />
          <span style={{ fontSize: 12 }}>알리고 관리자 → 카카오 알림톡 → 템플릿 관리에서 템플릿을 등록하고 승인을 받아주세요.</span>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>알림톡 템플릿 선택 *</label>
            <select onChange={e => selectTemplate(e.target.value)} value={selectedTpl?.code || ""} style={{ ...inp }}>
              <option value="">-- 템플릿 선택 --</option>
              {kakaoTemplates.map(t => <option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
            </select>
          </div>

          {selectedTpl && (
            <>
              <div style={{ marginBottom: 14, padding: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>템플릿 내용 미리보기</div>
                <div style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selectedTpl.content}</div>
                {selectedTpl.content.includes("#{") && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#f59e0b" }}>
                    ※ #{"{변수}"} 형태의 항목은 수신자별로 자동 치환됩니다 (#{"{이름}"}은 수신자 이름으로 자동 대체)
                  </div>
                )}
              </div>

              {/* 수신자가 있을 때만 개별 메시지 편집 */}
              {recipients.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>수신자별 발송 메시지 확인 / 수정</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {recipients.map(r => (
                      <div key={r.contact} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Avatar name={r.name} size={22} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.name}</span>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.contact}</span>
                        </div>
                        <textarea
                          value={messages[r.contact] || ""}
                          onChange={e => setMessages(prev => ({ ...prev, [r.contact]: e.target.value }))}
                          rows={3}
                          style={{ ...inp, fontSize: 12, resize: "vertical", lineHeight: 1.5 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button onClick={handleSend} disabled={sending || !recipients.length || !selectedTpl}
            style={{ width: "100%", padding: "12px 0", background: (sending || !recipients.length || !selectedTpl) ? "#cbd5e1" : kakaoColor, color: (sending || !recipients.length || !selectedTpl) ? "#fff" : kakaoTextColor, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: sending ? "wait" : "pointer" }}>
            {sending ? "발송 중..." : `${recipients.length}명에게 알림톡 발송`}
          </button>
          <Result data={result} />
        </>
      )}
    </section>
  );
}

function Result({ data }) {
  if (!data) return null;
  return (
    <div style={{ marginTop: 14, padding: 14, background: data.failed===0?"#f0fdf4":"#fff7ed", border: `1px solid ${data.failed===0?"#86efac":"#fed7aa"}`, borderRadius: 8, fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: data.failed===0?"#16a34a":"#c2410c", marginBottom: 4 }}>
        {data.failed===0?"발송 완료":"일부 실패"}
        {data.testMode && <span style={{ marginLeft: 8, fontSize: 11, color: "#f59e0b", fontWeight: 400 }}>(테스트 모드)</span>}
      </div>
      <div style={{ color: "#475569" }}>총 {data.total}명 · 성공 {data.sent}명 · 실패 {data.failed}명</div>
      {data.results?.filter(r => !r.success).map((r,i) => (
        <div key={i} style={{ marginTop: 4, color: "#ef4444", fontSize: 12 }}>✕ {r.name} ({r.contact}): {r.error}</div>
      ))}
    </div>
  );
}

/* ── 발송 탭 ─────────────────────────────────── */
function SendTab({ templates, applyTpl, clearApply }) {
  const [channel, setChannel] = useState("sms");
  const [recipients, setRecipients] = useState([]);

  const addRecipient = (item) => {
    if (recipients.some(r => r.contact === item.contact)) { showToast("이미 추가됨"); return; }
    setRecipients(p => [...p, item]);
  };

  return (
    <div>
      <ChannelToggle channel={channel} onChange={setChannel} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,360px) minmax(0,1fr)", gap: 20, alignItems: "start" }}>
        <RecipientPanel recipients={recipients} onAdd={addRecipient} onRemove={contact => setRecipients(p => p.filter(r => r.contact !== contact))} onClear={() => setRecipients([])} />
        {channel === "sms"
          ? <SmsComposePanel templates={templates} applyTpl={applyTpl} clearApply={clearApply} recipients={recipients} />
          : <KakaoComposePanel recipients={recipients} />
        }
      </div>
    </div>
  );
}

/* ── 템플릿 탭 ───────────────────────────────── */
const EMPTY_FORM = { name: "", content: "" };

function TemplatesTab({ templates, onTemplatesChange, onUseTemplate }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing("new"); setForm(EMPTY_FORM); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, content: t.content }); };
  const cancelEdit = () => { setEditing(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.name.trim()) return showToast("이름을 입력해주세요");
    if (!form.content.trim()) return showToast("내용을 입력해주세요");
    setSaving(true);
    try {
      if (editing === "new") {
        const res = await api.post("/portal/sms/templates", { name: form.name, content: form.content });
        onTemplatesChange([...templates, res.data]);
        showToast("템플릿이 추가되었습니다");
      } else {
        const res = await api.patch(`/portal/sms/templates/${editing.id}`, { name: form.name, content: form.content });
        onTemplatesChange(templates.map(t => t.id === editing.id ? res.data : t));
        showToast("템플릿이 수정되었습니다");
      }
      setEditing(null); setForm(EMPTY_FORM);
    } catch (e) { showToast("저장 실패: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (t) => {
    if (!window.confirm(`'${t.name}' 템플릿을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/portal/sms/templates/${t.id}`);
      onTemplatesChange(templates.filter(x => x.id !== t.id));
      showToast("삭제되었습니다");
    } catch (e) { showToast("삭제 실패: " + e.message); }
  };

  const bytes = (s) => getByteLength(s || "");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>SMS 템플릿 {templates.length}개 · 모든 포털 사용자에게 공유</span>
        <button onClick={openNew} style={primaryBtn}>+ 새 템플릿</button>
      </div>

      {editing && (
        <div style={{ ...panel, marginBottom: 16, border: "1px solid #bfdbfe", background: "#f8fbff" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1d4ed8", marginBottom: 14 }}>
            {editing === "new" ? "새 템플릿" : "템플릿 수정"}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>템플릿 이름 *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 상담 일정 확인 안내" style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>
              내용 * <span style={{ color: bytes(form.content) > 2000 ? "#ef4444" : bytes(form.content) > SMS_MAX ? "#f59e0b" : "#94a3b8" }}>({bytes(form.content)}B · {bytes(form.content) > SMS_MAX ? "LMS" : "SMS"})</span>
            </label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="메시지 내용을 입력하세요..." rows={6} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? .6 : 1 }}>{saving ? "저장 중..." : "저장"}</button>
            <button onClick={cancelEdit} style={ghostBtn}>취소</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !editing ? (
        <div style={{ color: "#94a3b8", textAlign: "center", padding: 40, fontSize: 14 }}>등록된 SMS 템플릿이 없습니다. 새 템플릿을 추가해 보세요.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} style={{ ...panel, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.name}</span>
                  <Badge text="SMS" color="#2563eb" bg="#eff6ff" />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{bytes(t.content)}B</span>
                </div>
                <div style={{ fontSize: 13, color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 72, overflow: "hidden" }}>{t.content}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => onUseTemplate(t)} style={primaryBtn}>발송에 사용</button>
                <button onClick={() => openEdit(t)} style={ghostBtn}>수정</button>
                <button onClick={() => remove(t)} style={dangerBtn}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 예약 탭 ─────────────────────────────────── */
function ScheduledTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState("pending");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterStatus) params.set("status", filterStatus);
    api.get(`/portal/sms/scheduled?${params}`)
      .then(j => { setItems(j.data??[]); setMeta(j.meta??{total:0,totalPages:0}); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm("이 예약을 취소하시겠습니까?")) return;
    try { await api.delete(`/portal/sms/scheduled/${id}`); showToast("예약 취소됨"); load(); }
    catch (e) { showToast("취소 실패: " + e.message); }
  };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center" }}>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ ...inp, width:140 }}>
          <option value="">전체 상태</option>
          <option value="pending">대기</option>
          <option value="sent">완료</option>
          <option value="failed">실패</option>
          <option value="cancelled">취소</option>
        </select>
        <span style={{ fontSize:13, color:"#64748b" }}>총 {meta.total}건</span>
        <button onClick={load} style={{ ...ghostBtn, marginLeft:"auto" }}>새로고침</button>
      </div>
      {loading ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>불러오는 중...</div>
       : items.length===0 ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>예약된 메시지가 없습니다.</div>
       : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map(item => {
            const rcpts = (() => { try { return JSON.parse(item.recipients); } catch { return []; } })();
            return (
              <div key={item.id} style={{ ...panel, display:"flex", alignItems:"flex-start", gap:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <StatusBadge status={item.status} />
                    <span style={{ fontSize:12, color:"#64748b" }}>예약: {fmtDate(item.scheduled_at)}</span>
                    <span style={{ fontSize:12, color:"#64748b" }}>수신자 {rcpts.length}명</span>
                  </div>
                  <div style={{ fontSize:13, color:"#334155", whiteSpace:"pre-wrap", maxHeight:60, overflow:"hidden", lineHeight:1.5 }}>{item.content}</div>
                  {rcpts.length>0 && <div style={{ marginTop:4, fontSize:11, color:"#94a3b8" }}>{rcpts.map(r=>r.name||r.contact).join(", ")}</div>}
                </div>
                {item.status==="pending" && <button onClick={() => cancel(item.id)} style={{ ...ghostBtn, color:"#ef4444", flexShrink:0 }}>취소</button>}
              </div>
            );
          })}
        </div>
       )}
      <Pagination page={page} totalPages={meta.totalPages||0} onPage={setPage} />
    </div>
  );
}

/* ── 이력 탭 ─────────────────────────────────── */
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total:0, totalPages:0 });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterStatus) params.set("status", filterStatus);
    if (filterChannel) params.set("channel", filterChannel);
    api.get(`/portal/sms/logs?${params}`)
      .then(j => { setLogs(j.data??[]); setMeta(j.meta??{total:0,totalPages:0}); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, filterStatus, filterChannel]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center", flexWrap:"wrap" }}>
        <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1); }} style={{ ...inp, width:140 }}>
          <option value="">전체 채널</option>
          <option value="sms">SMS</option>
          <option value="kakao">카카오</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ ...inp, width:140 }}>
          <option value="">전체 상태</option>
          <option value="sent">성공</option>
          <option value="failed">실패</option>
        </select>
        <span style={{ fontSize:13, color:"#64748b" }}>총 {meta.total}건</span>
        <button onClick={load} style={{ ...ghostBtn, marginLeft:"auto" }}>새로고침</button>
      </div>
      {loading ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>불러오는 중...</div>
       : logs.length===0 ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>발송 이력이 없습니다.</div>
       : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {logs.map(log => (
            <div key={log.id} style={{ ...panel, cursor:"pointer" }} onClick={() => setExpanded(expanded===log.id?null:log.id)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <StatusBadge status={log.status} />
                <ChannelBadge channel={log.channel} />
                <Avatar name={log.recipient_name||log.recipientName||"?"} size={28} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{log.recipient_name||log.recipientName||"-"}</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{log.recipient_contact||log.recipientContact}</div>
                </div>
                <div style={{ fontSize:11, color:"#94a3b8", whiteSpace:"nowrap" }}>{fmtDate(log.created_at||log.createdAt)}</div>
              </div>
              {expanded===log.id && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f1f5f9" }}>
                  <div style={{ fontSize:13, color:"#334155", whiteSpace:"pre-wrap", lineHeight:1.6 }}>{log.content}</div>
                  {log.error_message && <div style={{ marginTop:6, fontSize:12, color:"#ef4444" }}>오류: {log.error_message}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
       )}
      <Pagination page={page} totalPages={meta.totalPages||0} onPage={setPage} />
    </div>
  );
}

/* ── 리포트 탭 ───────────────────────────────── */
function ReportTab() {
  const daysAgo = n => new Date(Date.now()-n*86400000).toISOString().slice(0,10);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(daysAgo(0));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/portal/sms/stats?from=${from}&to=${to}`)
      .then(j => setData(j.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const preset = days => { setFrom(daysAgo(days-1)); setTo(daysAgo(0)); };
  const rate = data && data.total>0 ? Math.round((data.sent/data.total)*1000)/10 : 0;

  return (
    <div>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", padding:14, background:"#f8fafc", borderRadius:8, marginBottom:20 }}>
        <label style={{ fontSize:13 }}>시작 <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ ...inp, width:160, display:"inline", marginLeft:6 }} /></label>
        <label style={{ fontSize:13 }}>종료 <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ ...inp, width:160, display:"inline", marginLeft:6 }} /></label>
        <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
          {[[7,"7일"],[30,"30일"],[90,"90일"]].map(([d,l]) => (
            <button key={d} onClick={() => preset(d)} style={{ ...ghostBtn, fontSize:12, padding:"5px 10px" }}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>불러오는 중...</div>
       : !data ? <div style={{ color:"#94a3b8", textAlign:"center", padding:40 }}>데이터를 불러올 수 없습니다.</div>
       : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:24 }}>
            {[["총 발송",data.total,"#0f172a","#fff"],["성공",data.sent,"#16a34a","#f0fdf4"],["실패",data.failed,"#dc2626","#fef2f2"],["성공률",`${rate}%`,"#2563eb","#eff6ff"]].map(([l,v,c,bg]) => (
              <div key={l} style={{ background:bg, border:"1px solid #e2e8f0", borderRadius:8, padding:"14px 16px" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          {data.daily && data.daily.length>0 && (
            <div style={panel}>
              <div style={{ fontWeight:600, fontSize:14, color:"#334155", marginBottom:12 }}>일별 발송 현황 (SMS + 카카오)</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#f8fafc" }}>
                      {["날짜","성공","실패","합계"].map(h => (
                        <th key={h} style={{ textAlign:h==="날짜"?"left":"right", padding:"8px 12px", color:"#64748b", fontWeight:600, borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map(row => (
                      <tr key={row.day} style={{ borderBottom:"1px solid #f1f5f9" }}>
                        <td style={{ padding:"8px 12px", color:"#334155" }}>{row.day}</td>
                        <td style={{ padding:"8px 12px", textAlign:"right", color:"#16a34a", fontWeight:600 }}>{row.sent}</td>
                        <td style={{ padding:"8px 12px", textAlign:"right", color:"#dc2626" }}>{row.failed}</td>
                        <td style={{ padding:"8px 12px", textAlign:"right", color:"#334155" }}>{row.sent+row.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
       )}
    </div>
  );
}

/* ── 메인 ────────────────────────────────────── */
const TABS = [
  { key:"send", label:"발송" },
  { key:"templates", label:"SMS 템플릿" },
  { key:"scheduled", label:"예약" },
  { key:"logs", label:"이력" },
  { key:"report", label:"리포트" },
];

export default function PortalMessages() {
  const [tab, setTab] = useState("send");
  const [templates, setTemplates] = useState([]);
  const [applyTpl, setApplyTpl] = useState(null);

  useEffect(() => {
    api.get("/portal/sms/templates")
      .then(j => setTemplates(j.data ?? []))
      .catch(() => setTemplates([]));
  }, []);

  const handleUseTemplate = (tpl) => {
    setApplyTpl(tpl);
    setTab("send");
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1060, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>메시지 발송</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>SMS · 카카오 알림톡 발송, 예약, 이력 조회 — 내부 구성원 전용</p>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab==="send" && <SendTab templates={templates} applyTpl={applyTpl} clearApply={() => setApplyTpl(null)} />}
      {tab==="templates" && <TemplatesTab templates={templates} onTemplatesChange={setTemplates} onUseTemplate={handleUseTemplate} />}
      {tab==="scheduled" && <ScheduledTab />}
      {tab==="logs" && <LogsTab />}
      {tab==="report" && <ReportTab />}
    </div>
  );
}
