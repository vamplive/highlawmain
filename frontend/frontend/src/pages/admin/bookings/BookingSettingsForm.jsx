/** 예약 설정 폼 — 변호사 선택, 근무 요일, 시간, 슬롯 생성 */
import { FormField } from "../../../components/admin";
import { COLORS, btnStyle, formContainerStyle } from "../../../components/admin/styles";

const DAY_LABELS = ["월", "화", "수", "목", "금"];

const SLOT_DURATIONS = [
  { value: 30, label: "30분" },
  { value: 60, label: "60분" },
  { value: 90, label: "90분" },
];

/** 원형 요일 토글 버튼 그룹 */
function DaySelector({ selectedDays, onToggle }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" }}>
        근무 요일
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        {DAY_LABELS.map((label, idx) => {
          const dayIdx = idx + 1;
          const active = selectedDays.includes(dayIdx);
          return (
            <button
              key={dayIdx}
              onClick={() => onToggle(dayIdx)}
              style={{
                width: 42, height: 42, borderRadius: "50%", fontSize: 13, fontWeight: 500,
                border: `1px solid ${active ? COLORS.accent : "#ddd"}`,
                background: active ? COLORS.accent : "#fff",
                color: active ? "#fff" : COLORS.textSecondary,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 날짜 범위 입력 + 슬롯 생성 버튼 */
function SlotGenerator({ settings, genStartDate, setGenStartDate, genEndDate, setGenEndDate, genMsg, onGenerate }) {
  return (
    <div style={formContainerStyle}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: COLORS.text }}>슬롯 생성</h3>
      {!settings.lawyerId && (
        <p style={{ fontSize: 13, color: COLORS.warning, marginBottom: 12 }}>변호사를 먼저 선택해주세요</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <FormField label="시작일" type="date" value={genStartDate} onChange={setGenStartDate} />
        <FormField label="종료일" type="date" value={genEndDate} onChange={setGenEndDate} />
      </div>
      <button onClick={onGenerate} style={btnStyle(COLORS.accent)}>슬롯 생성</button>
      {genMsg && <p style={{ marginTop: 12, fontSize: 13, color: COLORS.success }}>{genMsg}</p>}
    </div>
  );
}

export default function BookingSettingsForm({
  settings, lawyerOptions, onUpdateSetting, onToggleDay,
  genStartDate, setGenStartDate, genEndDate, setGenEndDate, genMsg, onGenerate,
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 16 }}>
        <FormField
          label="변호사 선택"
          type="select"
          value={settings.lawyerId}
          onChange={(v) => onUpdateSetting("lawyerId", v)}
          options={lawyerOptions}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <DaySelector selectedDays={settings.days} onToggle={onToggleDay} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
        <FormField
          label="시작 시간"
          type="time"
          value={settings.startTime}
          onChange={(v) => onUpdateSetting("startTime", v)}
        />
        <FormField
          label="종료 시간"
          type="time"
          value={settings.endTime}
          onChange={(v) => onUpdateSetting("endTime", v)}
        />
        <FormField
          label="슬롯 단위"
          type="select"
          value={settings.slotDuration}
          onChange={(v) => onUpdateSetting("slotDuration", Number(v))}
          options={SLOT_DURATIONS}
        />
      </div>

      <SlotGenerator
        settings={settings}
        genStartDate={genStartDate}
        setGenStartDate={setGenStartDate}
        genEndDate={genEndDate}
        setGenEndDate={setGenEndDate}
        genMsg={genMsg}
        onGenerate={onGenerate}
      />
    </div>
  );
}
