/**
 * 상담 예약 일정 선택기
 * - 상담 방식(대면/전화/화상) 세그먼트 컨트롤
 * - 희망 날짜/시간 3개까지 구조화 입력 (협의 요청 방식만 지원)
 * NOTE: '예약 가능한 시간에서 선택' 기능은 제거되었습니다.
 */
import { Input } from "../../components/ui/Input";
import { MEETING_TYPE_OPTIONS, TIME_SLOTS } from "./consultationConstants";

export default function BookingSchedulePicker({ value, onChange }) {
  const { meetingType, preferredSlots } = value;

  function updatePreferred(idx, field, val) {
    const next = preferredSlots.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    onChange({ ...value, preferredSlots: next });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1) 상담 방식 */}
      <SegmentGroup
        label="상담 방식"
        options={MEETING_TYPE_OPTIONS}
        selected={meetingType}
        onSelect={(v) => onChange({ ...value, meetingType: v })}
      />

      {/* 2) 희망 일정 입력 */}
      <PreferredSlotsEditor slots={preferredSlots} onUpdate={updatePreferred} />
    </div>
  );
}

/** iOS 스타일 세그먼트 컨트롤 */
function SegmentGroup({ label, options, selected, onSelect }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, display: "block" }}>
        {label} <span style={{ color: "var(--accent-gold)" }}>*</span>
      </label>
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 6, padding: 4, background: "#f1f1ef", borderRadius: 8,
      }}>
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value} type="button"
              onClick={() => onSelect(opt.value)}
              style={{
                padding: "10px 8px", borderRadius: 6, border: "none",
                background: active ? "#fff" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s", textAlign: "center", lineHeight: 1.4,
                minWidth: 0, wordBreak: "keep-all",
              }}
            >
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.label}</div>
              {opt.description && (
                <div style={{ fontSize: 10, color: active ? "var(--text-muted)" : "var(--gray-400)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {opt.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 협의 요청 — 희망 일정 3개 */
function PreferredSlotsEditor({ slots, onUpdate }) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div style={{
      border: "1px solid var(--border-color)", borderRadius: 8, background: "#fff",
      padding: 16, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div>
        <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
          희망 일정 <span style={{ color: "var(--accent-gold)" }}>*</span>
        </label>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px 0" }}>
          희망하시는 일정을 우선순위 순으로 최대 3개까지 알려주세요. 확인 후 담당자가 연락드립니다.
        </p>
      </div>
      {slots.map((slot, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "72px minmax(0, 1fr) minmax(0, 1fr)", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {idx === 0 ? "1순위 *" : `${idx + 1}순위`}
          </div>
          <Input
            type="date" value={slot.date} min={today}
            onChange={(e) => onUpdate(idx, "date", e.target.value)}
            required={idx === 0} style={{ background: "#fff" }}
          />
          <select
            value={slot.time}
            onChange={(e) => onUpdate(idx, "time", e.target.value)}
            style={{ padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: 4, fontSize: 13, background: "#fff", width: "100%" }}
          >
            {TIME_SLOTS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
