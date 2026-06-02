/**
 * 발송 탭 3단계 — 발송/예약 액션 패널.
 * 즉시·예약 모드 선택, 예약 시각 입력, 발송 버튼, 결과 표시.
 */
import { COLORS } from "../../../components/admin";
import {
  SectionLabel, SegmentedControl,
} from "./sendTabPrimitives";
import { inputStyle, primaryBtnStyle, toDatetimeLocalMin } from "./sendTabStyles";

const SEND_MODE_OPTIONS = [
  { value: "now", label: "지금" },
  { value: "schedule", label: "예약" },
];

export default function SendActionPanel({
  sendMode, onSendModeChange,
  scheduledAt, onScheduledAtChange,
  sending, selectedCount, channelLabel,
  onSend, result,
  content = "",
  subject = "",
  showEmailSubject = false,
}) {
  const hasContent = Boolean(content.trim());
  const hasSubject = !showEmailSubject || Boolean(subject.trim());
  const hasSchedule = sendMode !== "schedule" || Boolean(scheduledAt);
  const disabled = sending || selectedCount === 0 || !hasContent || !hasSubject || !hasSchedule;
  const buttonText = sending
    ? (sendMode === "schedule" ? "예약 등록 중..." : "발송 중...")
    : (sendMode === "schedule"
      ? `${selectedCount}명에게 예약 ${channelLabel} 발송`
      : `${selectedCount}명에게 ${channelLabel} 발송`);

  return (
    <div style={{ marginTop: 24 }}>
      <SectionLabel step="3" title="발송" />

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <ReviewRow done={selectedCount > 0} label="수신자 선택" value={selectedCount > 0 ? `${selectedCount}명` : "미선택"} />
        <ReviewRow done={hasContent} label="메시지 내용" value={hasContent ? "입력됨" : "비어 있음"} />
        {showEmailSubject && <ReviewRow done={hasSubject} label="이메일 제목" value={hasSubject ? "입력됨" : "필요"} />}
        {sendMode === "schedule" && <ReviewRow done={hasSchedule} label="예약 시각" value={hasSchedule ? scheduledAt.replace("T", " ") : "필요"} />}
      </div>

      <SegmentedControl
        value={sendMode}
        onChange={onSendModeChange}
        options={SEND_MODE_OPTIONS}
        size="sm"
      />

      {sendMode === "schedule" && (
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
          style={{ ...inputStyle, marginTop: 10 }}
          min={toDatetimeLocalMin()}
        />
      )}

      <button onClick={onSend} disabled={disabled} style={primaryBtnStyle(disabled)}>
        {buttonText}
      </button>

      {result && <ResultBlock result={result} />}
    </div>
  );
}

function ReviewRow({ done, label, value }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "9px 10px",
      border: `1px solid ${done ? "#bbf7d0" : "#fed7aa"}`,
      borderRadius: 7,
      background: done ? "#f0fdf4" : "#fff7ed",
      fontSize: 12,
    }}>
      <span style={{ color: done ? "#166534" : "#9a3412", fontWeight: 600 }}>{label}</span>
      <span style={{ color: done ? "#15803d" : "#c2410c" }}>{value}</span>
    </div>
  );
}

function ResultBlock({ result }) {
  const hasFailed = result.failed > 0;
  return (
    <div style={{
      marginTop: 14, padding: 14, borderRadius: 6,
      background: hasFailed ? "#fff5f0" : "#f0faf3",
      border: `1px solid ${hasFailed ? "#f5c6a8" : "#a3d9b1"}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
        총 {result.total}건 · 성공 {result.sent} · 실패 {result.failed}
      </div>
      {result.results?.filter((r) => !r.success).map((r, i) => (
        <div key={i} style={{ fontSize: 11, color: COLORS.danger, marginTop: 4 }}>
          {r.recipientContact}: {r.error}
        </div>
      ))}
    </div>
  );
}
