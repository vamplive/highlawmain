/**
 * 발송 탭 하위 패널 — 채널 선택, 수신자 선택, 메시지 작성 UI
 */
import {
  FormField,
  COLORS, fieldStyle, labelStyle, btnStyle, badgeStyle,
} from "../../../components/admin";
import { getByteLength, renderPlaceholders } from "../../../utils/formatters";
import {
  SMS_BYTE_LIMIT, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS,
} from "./messageConstants";

/** 채널 선택 버튼 그룹 */
export function ChannelSelector({ channel, onChange }) {
  const channels = [
    { value: "sms", label: "SMS 문자", color: "#3498db" },
    { value: "email", label: "이메일", color: "#9b59b6" },
    { value: "both", label: "동시 발송 (SMS+이메일)", color: "#e67e22" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {channels.map((ch) => (
        <button key={ch.value} onClick={() => onChange(ch.value)}
          style={{ ...btnStyle(channel === ch.value ? ch.color : "#ccc"), transition: "all 0.2s" }}>
          {ch.label}
        </button>
      ))}
    </div>
  );
}

/** 수신자 선택 패널 */
export function RecipientPanel({
  channel, recipientSource, onSourceChange,
  filteredClients, selectedClients, clientFilter, onFilterChange,
  onToggleClient, onToggleAll, loading,
  segmentBuilder, segmentMatchedCount,
}) {
  const sourceToggleStyle = (active) => ({
    padding: "5px 14px", fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? "#fff" : COLORS.textMuted,
    background: active ? COLORS.accent : "#f0f0f0",
    border: "none", borderRadius: 4, cursor: "pointer",
  });

  const emptyMessage = channel === "both"
    ? "전화번호와 이메일 모두 있는 고객이 없습니다"
    : channel === "email"
      ? "이메일 주소가 있는 고객이 없습니다"
      : "해당하는 고객이 없습니다";

  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 8, padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: COLORS.text }}>
        수신자 선택{" "}
        <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.muted }}>
          ({selectedClients.size}명 선택)
        </span>
      </h3>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => onSourceChange("clients")} style={sourceToggleStyle(recipientSource === "clients")}>
          고객 DB
        </button>
        <button onClick={() => onSourceChange("consultations")} style={sourceToggleStyle(recipientSource === "consultations")}>
          상담 신청
        </button>
        <button onClick={() => onSourceChange("segment")} style={sourceToggleStyle(recipientSource === "segment")}>
          🎯 세그먼트
        </button>
      </div>

      {recipientSource === "segment" && segmentBuilder}
      {recipientSource === "segment" && segmentMatchedCount > 0 && (
        <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
          조건 매칭: <strong style={{ color: COLORS.accent }}>{segmentMatchedCount}명</strong>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          style={{ ...fieldStyle, flex: 1 }}
          value={clientFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="이름, 전화번호, 이메일 검색..."
        />
        <button onClick={onToggleAll} style={{ ...btnStyle("#666"), whiteSpace: "nowrap", padding: "8px 14px" }}>
          전체 {selectedClients.size === filteredClients.length ? "해제" : "선택"}
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #eee", borderRadius: 4 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: COLORS.muted }}>불러오는 중...</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: COLORS.muted }}>{emptyMessage}</div>
        ) : filteredClients.map((c) => (
          <RecipientRow
            key={c.id}
            client={c}
            channel={channel}
            recipientSource={recipientSource}
            selected={selectedClients.has(c.id)}
            onToggle={() => onToggleClient(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

/** 수신자 목록 행 */
function RecipientRow({ client: c, channel, recipientSource, selected, onToggle }) {
  const contactDisplay = channel === "both"
    ? `${c.phone} / ${c.email}`
    : channel === "sms" ? c.phone : c.email;

  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
      borderBottom: "1px solid #f0f0f0", cursor: "pointer",
      background: selected ? "#f0f4ff" : "transparent",
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
        <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 8 }}>{contactDisplay}</span>
      </div>
      {recipientSource === "consultations" ? (
        <span style={badgeStyle(STATUS_COLORS[c.status] || COLORS.muted)}>
          {STATUS_LABELS[c.status] || c.status}
        </span>
      ) : (
        c.source && (
          <span style={badgeStyle(c.source === "consultation" ? "#3498db" : "#95a5a6")}>
            {c.source === "consultation" ? "상담" : "직접"}
          </span>
        )
      )}
      {c.category && (
        <span style={{ fontSize: 11, color: "#aaa" }}>
          {CATEGORY_LABELS[c.category] || c.category}
        </span>
      )}
    </label>
  );
}

/** 메시지 작성 패널 */
export function MessageComposer({
  channel, templates, selectedTemplate, onTemplateSelect,
  subject, onSubjectChange, content, onContentChange,
  selectedCount, channelLabel, sending, onSend, result,
  previewSample,
  sendMode = "now", onSendModeChange, scheduledAt = "", onScheduledAtChange,
}) {
  const byteLen = getByteLength(content);
  const showEmailSubject = channel === "email" || channel === "both";
  const showSmsCounter = channel === "sms" || channel === "both";

  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 8, padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: COLORS.text }}>메시지 작성</h3>

      <div style={{ marginBottom: 16 }}>
        <FormField label="템플릿 선택" value={selectedTemplate} onChange={onTemplateSelect} type="select">
          <option value="">직접 입력</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </FormField>
      </div>

      {showEmailSubject && (
        <div style={{ marginBottom: 16 }}>
          <FormField
            label="이메일 제목" value={subject} onChange={onSubjectChange}
            required placeholder="[법무법인 하이로] 상담 일정 안내"
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          내용 *
          <span style={{ fontWeight: 400, color: COLORS.muted, marginLeft: 8 }}>
            {"{고객명}"} {"{name}"} {"{{고객명}}"} {"{date}"} {"{category}"} 사용 가능
          </span>
        </label>
        <textarea
          style={{ ...fieldStyle, minHeight: 180, resize: "vertical" }}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="안녕하세요 {고객명}님, 법무법인 하이로입니다..."
        />
        {showSmsCounter && (
          <div style={{ fontSize: 11, color: byteLen > SMS_BYTE_LIMIT ? COLORS.danger : COLORS.muted, marginTop: 4 }}>
            {byteLen} / {SMS_BYTE_LIMIT} 바이트
            {byteLen > SMS_BYTE_LIMIT ? " (LMS로 발송)" : " (SMS)"}
          </div>
        )}
      </div>

      {content && (
        <MessagePreview
          content={content}
          subject={subject}
          showSubject={showEmailSubject}
          sample={previewSample}
        />
      )}

      {/* 발송 모드 토글 + 예약 시각 */}
      <div style={{ marginBottom: 12, padding: 10, background: COLORS.bgForm, borderRadius: 6 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: sendMode === "schedule" ? 10 : 0 }}>
          <button
            type="button"
            onClick={() => onSendModeChange && onSendModeChange("now")}
            style={sendModeBtnStyle(sendMode === "now")}
          >⚡ 지금 발송</button>
          <button
            type="button"
            onClick={() => onSendModeChange && onSendModeChange("schedule")}
            style={sendModeBtnStyle(sendMode === "schedule")}
          >📅 예약 발송</button>
        </div>
        {sendMode === "schedule" && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange && onScheduledAtChange(e.target.value)}
            style={{ ...fieldStyle, fontSize: 13 }}
            min={toDatetimeLocalMin()}
          />
        )}
      </div>

      <button onClick={onSend} disabled={sending}
        style={{ ...btnStyle(sending ? COLORS.muted : (sendMode === "schedule" ? "#e67e22" : COLORS.success)), width: "100%", padding: "12px 0", fontSize: 15 }}>
        {sending
          ? (sendMode === "schedule" ? "예약 등록 중..." : "발송 중...")
          : (sendMode === "schedule"
            ? `${selectedCount}명 ${channelLabel} 예약 발송`
            : `${selectedCount}명에게 ${channelLabel} 발송`)}
      </button>

      {result && <SendResult result={result} />}
    </div>
  );
}

/**
 * 메시지 미리보기 — 선택된 첫 수신자 기준으로 {name}/{category} 치환.
 * 수신자 미선택 시 기본값(홍길동/민사)로 폴백.
 */
function MessagePreview({ content, subject, showSubject, sample }) {
  const sampleData = sample || { name: "홍길동", category: "civil" };
  const previewSubject = renderPlaceholders(subject || "", sampleData);
  const previewContent = renderPlaceholders(content, sampleData);

  return (
    <div style={{
      marginBottom: 16, padding: 12, background: COLORS.bgForm,
      border: `1px solid ${COLORS.border}`, borderRadius: 6,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>
        📲 {sampleData.name}님에게 전달되는 내용
        {!sample && <span style={{ color: COLORS.warning, marginLeft: 6 }}>(샘플 — 수신자 선택 시 실제 데이터로 미리보기)</span>}
      </div>
      {showSubject && previewSubject && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 6 }}>
          {previewSubject}
        </div>
      )}
      <div style={{ fontSize: 13, color: "#333", whiteSpace: "pre-wrap" }}>{previewContent}</div>
    </div>
  );
}

const sendModeBtnStyle = (active) => ({
  flex: 1, padding: "7px 10px", fontSize: 12,
  fontWeight: active ? 600 : 400,
  color: active ? "#fff" : COLORS.textSecondary,
  background: active ? COLORS.accent : "#fff",
  border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
  borderRadius: 4, cursor: "pointer",
});

/** datetime-local 입력의 min 속성용 — 현재 시각 1분 후를 YYYY-MM-DDTHH:MM 형식으로 반환 */
function toDatetimeLocalMin() {
  const d = new Date(Date.now() + 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 발송 결과 표시 */
function SendResult({ result }) {
  const hasFailed = result.failed > 0;

  return (
    <div style={{
      marginTop: 16, padding: 16, borderRadius: 6,
      background: hasFailed ? "#fef0e7" : "#e8f8ef",
      border: `1px solid ${hasFailed ? "#f5c6a8" : "#a3d9b1"}`,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        발송 완료: 총 {result.total}건 | 성공 {result.sent}건 | 실패 {result.failed}건
      </div>
      {result.results?.filter((r) => !r.success).map((r, i) => (
        <div key={i} style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>
          {r.recipientContact}: {r.error}
        </div>
      ))}
    </div>
  );
}
