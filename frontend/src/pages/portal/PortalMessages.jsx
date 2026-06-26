/**
 * 포털 문자 발송 페이지 — 내부 구성원 전용
 * 수신자 검색(DB) 또는 직접 추가 → SMS 발송 (Aligo)
 */
import { useState, useRef, useCallback } from "react";
import { api } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import { getByteLength } from "../../utils/formatters";

const SMS_MAX_BYTES = 90;

function getInitials(name) {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase();
}

function Avatar({ name, size = 36 }) {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
  const code = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors[code],
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.42,
      flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

export default function PortalMessages() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [directPhone, setDirectPhone] = useState("");
  const [directName, setDirectName] = useState("");
  const [showDirectAdd, setShowDirectAdd] = useState(false);

  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const byteLen = getByteLength(content);
  const msgType = byteLen > SMS_MAX_BYTES ? "LMS" : "SMS";

  const searchClients = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/portal/clients?q=${encodeURIComponent(q)}&limit=10`);
        const items = res.data?.data ?? res.data ?? [];
        setSearchResults(Array.isArray(items) ? items : []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);
  }, []);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    searchClients(v);
  };

  const addRecipient = (item) => {
    if (!item.phone) { showToast("전화번호가 없는 의뢰인입니다"); return; }
    if (recipients.some((r) => r.contact === item.phone)) {
      showToast("이미 추가된 수신자입니다"); return;
    }
    setRecipients((prev) => [...prev, { id: item.id, name: item.name, contact: item.phone }]);
    setQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const addDirect = () => {
    const phone = directPhone.replace(/\D/g, "");
    if (!/^0\d{7,14}$/.test(phone)) { showToast("올바른 전화번호를 입력하세요 (예: 01012345678)"); return; }
    const name = directName.trim() || phone;
    if (recipients.some((r) => r.contact === phone)) { showToast("이미 추가된 번호입니다"); return; }
    setRecipients((prev) => [...prev, { id: `direct-${phone}`, name, contact: phone }]);
    setDirectPhone(""); setDirectName(""); setShowDirectAdd(false);
  };

  const removeRecipient = (contact) => {
    setRecipients((prev) => prev.filter((r) => r.contact !== contact));
  };

  const clearAll = () => {
    if (!window.confirm("수신자 목록을 모두 삭제하시겠습니까?")) return;
    setRecipients([]);
  };

  const handleSend = async () => {
    if (recipients.length === 0) { showToast("수신자를 추가해주세요"); return; }
    if (!content.trim()) { showToast("메시지 내용을 입력해주세요"); return; }
    if (byteLen > 2000) { showToast("메시지가 너무 깁니다 (최대 2000바이트)"); return; }
    if (!window.confirm(`${recipients.length}명에게 ${msgType}를 발송하시겠습니까?`)) return;

    setSending(true); setResult(null);
    try {
      const res = await api.post("/portal/sms/send", {
        recipients: recipients.map((r) => ({ name: r.name, contact: r.contact })),
        content: content.trim(),
      });
      const data = res.data;
      setResult(data);
      if (data.sent > 0) showToast(`${data.sent}명에게 발송 완료`);
      if (data.failed > 0) showToast(`${data.failed}명 발송 실패`);
      if (data.sent > 0) { setRecipients([]); setContent(""); }
    } catch (err) {
      showToast("발송 실패: " + (err.message || "오류가 발생했습니다"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>문자 발송</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>의뢰인에게 SMS/LMS를 발송합니다. 내부 구성원 전용 기능입니다.</p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,360px) minmax(0,1fr)", gap: 20, alignItems: "start" }}>

        {/* 수신자 패널 */}
        <section style={panelStyle}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#334155", marginBottom: 12 }}>수신자</div>

          {/* 검색 */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              placeholder="의뢰인 이름 또는 전화번호 검색..."
              style={inputStyle}
            />
            {showDropdown && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                boxShadow: "0 4px 16px rgba(15,23,42,0.10)", zIndex: 200,
                maxHeight: 260, overflowY: "auto",
              }}>
                {searchLoading ? (
                  <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>검색 중...</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 13 }}>검색 결과 없음</div>
                ) : searchResults.map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={() => addRecipient(item)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "9px 14px", border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={item.name} size={30} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.phone || "번호 없음"}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 직접 추가 */}
          <button
            onClick={() => setShowDirectAdd((v) => !v)}
            style={{ ...ghostBtnStyle, marginTop: 8, width: "100%" }}
          >
            + 직접 추가
          </button>

          {showDirectAdd && (
            <div style={{ marginTop: 10, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <input
                type="text"
                placeholder="이름 (선택)"
                value={directName}
                onChange={(e) => setDirectName(e.target.value)}
                style={{ ...inputStyle, marginBottom: 6 }}
              />
              <input
                type="tel"
                placeholder="전화번호 (예: 01012345678)"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDirect()}
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addDirect} style={primarySmBtnStyle}>추가</button>
                <button onClick={() => { setShowDirectAdd(false); setDirectPhone(""); setDirectName(""); }} style={ghostBtnStyle}>취소</button>
              </div>
            </div>
          )}

          {/* 수신자 목록 */}
          {recipients.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>{recipients.length}명 선택됨</span>
                <button onClick={clearAll} style={{ ...ghostBtnStyle, color: "#ef4444", fontSize: 12, padding: "3px 8px" }}>전체 삭제</button>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {recipients.map((r) => (
                  <li key={r.contact} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 8,
                    background: "#f1f5f9", border: "1px solid #e2e8f0",
                  }}>
                    <Avatar name={r.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{r.contact}</div>
                    </div>
                    <button
                      onClick={() => removeRecipient(r.contact)}
                      title="삭제"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#94a3b8", fontSize: 16, padding: "2px 4px", lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 메시지 작성 패널 */}
        <section style={panelStyle}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#334155", marginBottom: 12 }}>메시지 내용</div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="발송할 메시지를 입력하세요..."
            rows={10}
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "10px 12px", fontSize: 14, color: "#0f172a",
              resize: "vertical", lineHeight: 1.6, outline: "none",
              fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: byteLen > 2000 ? "#ef4444" : byteLen > SMS_MAX_BYTES ? "#f59e0b" : "#64748b" }}>
              {byteLen}B · <strong>{msgType}</strong>
              {byteLen > SMS_MAX_BYTES && byteLen <= 2000 && <span style={{ color: "#f59e0b", marginLeft: 4 }}>※ 장문(LMS) 발송</span>}
              {byteLen > 2000 && <span style={{ color: "#ef4444", marginLeft: 4 }}>최대 초과</span>}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>SMS: 90B 이하 / LMS: 2000B 이하</div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || recipients.length === 0 || !content.trim() || byteLen > 2000}
            style={{
              width: "100%", padding: "12px 0",
              background: sending || recipients.length === 0 || !content.trim() || byteLen > 2000 ? "#cbd5e1" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 15, cursor: sending ? "wait" : "pointer",
              transition: "background .15s",
            }}
          >
            {sending ? "발송 중..." : `${recipients.length}명에게 발송`}
          </button>

          {result && (
            <div style={{
              marginTop: 16, padding: 14,
              background: result.failed === 0 ? "#f0fdf4" : "#fff7ed",
              border: `1px solid ${result.failed === 0 ? "#86efac" : "#fed7aa"}`,
              borderRadius: 8, fontSize: 13,
            }}>
              <div style={{ fontWeight: 700, color: result.failed === 0 ? "#16a34a" : "#c2410c", marginBottom: 6 }}>
                {result.failed === 0 ? "발송 완료" : "일부 발송 실패"}
              </div>
              <div style={{ color: "#475569" }}>총 {result.total}명 · 성공 {result.sent}명 · 실패 {result.failed}명</div>
              {result.results?.filter(r => !r.success).map((r, i) => (
                <div key={i} style={{ marginTop: 4, color: "#ef4444", fontSize: 12 }}>
                  ✕ {r.name} ({r.contact}): {r.error}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 18,
  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #e2e8f0", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#0f172a",
  outline: "none", fontFamily: "inherit",
};

const ghostBtnStyle = {
  background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
  padding: "6px 12px", fontSize: 13, color: "#475569",
  cursor: "pointer", fontFamily: "inherit",
};

const primarySmBtnStyle = {
  background: "#2563eb", border: "none", borderRadius: 6,
  padding: "6px 14px", fontSize: 13, color: "#fff",
  cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
};
