/**
 * 발송 탭 1단계 — 수신자 선택 패널.
 * 채널 선택, 출처 선택, 세그먼트 빌더, 직접 입력, 검색, 수신자 리스트, 카운트 바.
 */
import { useState } from "react";
import { COLORS } from "../../../components/admin";
import { formatPhone } from "../../../utils/formatters";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS } from "./messageConstants";
import SegmentBuilder from "./SegmentBuilder";
import {
  SectionLabel, SegmentedControl, EmptyBlock,
} from "./sendTabPrimitives";
import { countBarStyle, linkBtnStyle, listContainerStyle, searchInputStyle } from "./sendTabStyles";

// localStorage 키 — 직접 입력 저장 수신자 보관
const SAVED_RECIPIENTS_KEY = "portal_saved_recipients";

function loadSavedRecipients() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_RECIPIENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSavedRecipients(list) {
  try {
    localStorage.setItem(SAVED_RECIPIENTS_KEY, JSON.stringify(list));
  } catch { /* localStorage 쓰기 실패 무시 */ }
}

const CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "이메일" },
  { value: "both", label: "둘 다" },
];

const SOURCE_OPTIONS = [
  { value: "clients", label: "고객 DB" },
  { value: "consultations", label: "상담 신청" },
  { value: "segment", label: "세그먼트" },
  { value: "manual", label: "직접 입력" },
];

export default function SendRecipientPanel({
  channel, onChannelChange,
  recipientSource, onSourceChange,
  recipientLoading, setRecipientLoading,
  filteredClients, selectedClients, onToggleClient, onToggleAll,
  clientFilter, onFilterChange,
  onSegmentResult, segmentCount,
  manualRecipients, onAddManualRecipient, onRemoveManualRecipient,
}) {
  const smsReady = filteredClients.filter((c) => c.phone).length;
  const emailReady = filteredClients.filter((c) => c.email).length;
  const selectedItems = filteredClients.filter((c) => selectedClients.has(c.id));
  const selectedSms = selectedItems.filter((c) => c.phone).length;
  const selectedEmail = selectedItems.filter((c) => c.email).length;

  return (
    <div style={{ minWidth: 0 }}>
      <SectionLabel step="1" title="받는 사람" />

      <SegmentedControl
        value={channel}
        onChange={onChannelChange}
        options={CHANNEL_OPTIONS}
      />

      <div style={{ height: 12 }} />

      <SegmentedControl
        value={recipientSource}
        onChange={onSourceChange}
        options={SOURCE_OPTIONS}
        size="sm"
      />

      {recipientSource === "segment" && (
        <div style={{ marginTop: 12 }}>
          <SegmentBuilder
            channel={channel}
            onResult={onSegmentResult}
            loading={recipientLoading}
            setLoading={setRecipientLoading}
          />
          {segmentCount > 0 && (
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
              조건 매칭 <strong style={{ color: COLORS.accent }}>{segmentCount}명</strong>
            </div>
          )}
        </div>
      )}

      {recipientSource === "manual" && (
        <ManualEntryPanel
          manualRecipients={manualRecipients}
          onAdd={onAddManualRecipient}
          onRemove={onRemoveManualRecipient}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
        <StatCard label="선택" value={`${selectedClients.size}명`} accent />
        <StatCard label="문자 가능" value={`${selectedSms || smsReady}명`} />
        <StatCard label="이메일 가능" value={`${selectedEmail || emailReady}명`} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={searchInputStyle}
          value={clientFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="이름·전화·이메일 검색"
        />
        <button onClick={onToggleAll} style={linkBtnStyle}>
          {selectedClients.size === filteredClients.length && filteredClients.length > 0 ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      <div style={listContainerStyle}>
        {recipientLoading ? (
          <EmptyBlock text="불러오는 중..." />
        ) : filteredClients.length === 0 ? (
          <EmptyBlock text="해당하는 수신자가 없습니다" />
        ) : (
          filteredClients.map((c) => (
            <RecipientRow
              key={c.id} client={c} channel={channel}
              source={recipientSource}
              selected={selectedClients.has(c.id)}
              onToggle={() => onToggleClient(c.id)}
            />
          ))
        )}
      </div>

      <div style={countBarStyle}>
        <span>{selectedClients.size}명 선택됨</span>
        <span style={{ color: COLORS.muted }}>· 전체 {filteredClients.length}명</span>
      </div>
    </div>
  );
}

function RecipientRow({ client: c, channel, source, selected, onToggle }) {
  const phone = formatPhone(c.phone);
  const contact = channel === "both"
    ? `${phone} · ${c.email || "-"}`
    : channel === "sms" ? phone : (c.email || "-");
  const statusColor = c.status ? (STATUS_COLORS[c.status] || COLORS.muted) : null;

  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
      cursor: "pointer", background: selected ? "#eff6ff" : "transparent",
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle}
        style={{ accentColor: COLORS.accent, width: 14, height: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: COLORS.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {c.name || "-"}
        </div>
        <div style={{
          fontSize: 11, color: COLORS.textMuted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {contact}
        </div>
      </div>
      {source === "consultations" && c.status && (
        <span style={{
          fontSize: 10, fontWeight: 500, color: statusColor,
          padding: "2px 8px", borderRadius: 10,
          background: `${statusColor}15`, flexShrink: 0,
        }}>
          {STATUS_LABELS[c.status] || c.status}
        </span>
      )}
      {c.category && (
        <span style={{ fontSize: 10, color: COLORS.muted, flexShrink: 0, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {CATEGORY_LABELS[c.category] || c.category}
        </span>
      )}
    </label>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div style={{
      border: `1px solid ${accent ? "#bfdbfe" : "#e2e8f0"}`,
      background: accent ? "#eff6ff" : "#f8fafc",
      borderRadius: 7,
      padding: "9px 10px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: accent ? "#1d4ed8" : "#64748b", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent ? "#1d4ed8" : COLORS.text }}>{value}</div>
    </div>
  );
}

/**
 * 직접 입력 패널 — 이름/전화/이메일을 직접 입력하거나 localStorage 저장 목록에서 불러와 추가한다.
 */
function ManualEntryPanel({ manualRecipients, onAdd, onRemove }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [savedList, setSavedList] = useState(loadSavedRecipients);

  const handleAdd = () => {
    if (!name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!phone.trim() && !email.trim()) { alert("전화번호 또는 이메일 중 하나 이상을 입력해주세요."); return; }
    const recipient = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
    };
    onAdd(recipient);
    setName(""); setPhone(""); setEmail("");
  };

  const handleSave = () => {
    if (!name.trim()) { alert("저장할 이름을 입력해주세요."); return; }
    if (!phone.trim() && !email.trim()) { alert("전화번호 또는 이메일을 입력해주세요."); return; }
    const entry = {
      id: `saved-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
    };
    const updated = [...savedList, entry];
    setSavedList(updated);
    saveSavedRecipients(updated);
    alert("수신자가 저장되었습니다.");
  };

  const handleDeleteSaved = (id) => {
    const updated = savedList.filter((r) => r.id !== id);
    setSavedList(updated);
    saveSavedRecipients(updated);
  };

  const handleLoadSaved = (saved) => {
    // saved.id 기반으로 유니크 접두사를 붙여 세션 목록에 추가 (Date.now 등 불순 함수 회피)
    const recipient = { ...saved, id: `loaded-${saved.id}` };
    onAdd(recipient);
  };

  const inputStyle = {
    flex: 1, minWidth: 80, padding: "7px 9px", fontSize: 12.5,
    border: "1px solid #cbd5e1", borderRadius: 6, outline: "none",
  };

  return (
    <div style={{ marginTop: 14, padding: "14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: "0 0 10px" }}>수신자 직접 입력</p>

      {/* 입력 폼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (필수)" />
        <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호 (예: 010-1234-5678)" />
        <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" />
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleAdd} style={{ flex: 1, padding: "7px", fontSize: 12, fontWeight: 600, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            추가
          </button>
          <button onClick={handleSave} style={{ flex: 1, padding: "7px", fontSize: 12, fontWeight: 600, background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
            저장
          </button>
        </div>
      </div>

      {/* 현재 세션 직접 입력 목록 */}
      {manualRecipients.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px", fontWeight: 600 }}>추가된 수신자</p>
          {manualRecipients.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#fff", borderRadius: 6, marginBottom: 4, border: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: COLORS.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{[r.phone, r.email].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={() => onRemove(r.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* 저장된 수신자 목록 */}
      {savedList.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px", fontWeight: 600 }}>저장된 수신자</p>
          {savedList.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#eff6ff", borderRadius: 6, marginBottom: 4, border: "1px solid #bfdbfe" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1d4ed8" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#3b82f6" }}>{[r.phone, r.email].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={() => handleLoadSaved(r)} style={{ fontSize: 11, padding: "3px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>불러오기</button>
              <button onClick={() => handleDeleteSaved(r.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
