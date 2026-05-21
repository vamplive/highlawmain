/**
 * 상담 예약 일정 선택기
 * - 상담 방식(대면/전화/화상) 세그먼트 컨트롤
 * - 예약 방식(슬롯 선택/협의 요청) 토글
 * - 슬롯 모드: 주간 캘린더로 공개 가용 슬롯 표시
 * - 협의 모드: 희망 날짜/시간 3개까지 구조화 입력
 */
import { useEffect, useMemo, useState } from "react";
import { Input } from "../../components/ui/Input";
import { api } from "../../utils/api";
import { MEETING_TYPE_OPTIONS, SCHEDULE_MODE_OPTIONS, TIME_SLOTS } from "./consultationConstants";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** YYYY-MM-DD 반환 (로컬 타임존 기준) */
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 이번 주 월요일 기준 7일 시작일 */
function startOfWeek(base = new Date()) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay(); // 월요일 시작
  d.setDate(d.getDate() + diff);
  return d;
}

export default function BookingSchedulePicker({ value, onChange }) {
  const { meetingType, scheduleMode, bookingSlotId, preferredSlots } = value;
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const weekStartStr = useMemo(() => toDateStr(weekStart), [weekStart]);

  // 슬롯 모드일 때만 주간 슬롯 조회
  useEffect(() => {
    if (scheduleMode !== "slot") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      api.get(`/bookings/available-week?startDate=${weekStartStr}`)
        .then((res) => { if (!cancelled) setSlots(res.data || []); })
        .catch(() => { if (!cancelled) setSlots([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [weekStartStr, scheduleMode]);

  /** 날짜별로 슬롯 그룹화 */
  const slotsByDate = useMemo(() => {
    const map = {};
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [slots]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return { date: d, dateStr: toDateStr(d), label: DAY_LABELS[d.getDay()] };
    });
  }, [weekStart]);

  function shiftWeek(delta) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
  }

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

      {/* 2) 예약 방식 */}
      <SegmentGroup
        label="예약 방식"
        options={SCHEDULE_MODE_OPTIONS}
        selected={scheduleMode}
        onSelect={(v) => onChange({ ...value, scheduleMode: v })}
      />

      {/* 3-A) 슬롯 선택 모드 */}
      {scheduleMode === "slot" && (
        <WeeklySlotGrid
          weekStart={weekStart} days={days} slotsByDate={slotsByDate}
          loading={loading} selectedSlotId={bookingSlotId}
          onShiftWeek={shiftWeek}
          onSelect={(id) => onChange({ ...value, bookingSlotId: id })}
        />
      )}

      {/* 3-B) 협의 요청 모드 */}
      {scheduleMode === "request" && (
        <PreferredSlotsEditor slots={preferredSlots} onUpdate={updatePreferred} />
      )}
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

/** 주간 슬롯 그리드 */
function WeeklySlotGrid({ days, slotsByDate, loading, selectedSlotId, onShiftWeek, onSelect }) {
  const hasAny = Object.keys(slotsByDate).length > 0;
  return (
    <div style={{
      border: "1px solid var(--border-color)", borderRadius: 8, background: "#fff",
      padding: 16, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={() => onShiftWeek(-1)} style={navBtnStyle}>‹ 이전 주</button>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {days[0].dateStr} ~ {days[6].dateStr}
        </div>
        <button type="button" onClick={() => onShiftWeek(1)} style={navBtnStyle}>다음 주 ›</button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 13 }}>불러오는 중...</div>}

      {!loading && !hasAny && (
        <div style={{ textAlign: "center", padding: 28, color: "var(--text-muted)", fontSize: 13 }}>
          이 주에는 공개된 예약 시간이 없습니다. 다음 주를 확인하거나 <strong>일정 협의 요청</strong>으로 문의해 주세요.
        </div>
      )}

      {!loading && hasAny && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(40px, 1fr))", gap: 4, overflowX: "auto" }}>
          {days.map((day) => {
            const dateSlots = slotsByDate[day.dateStr] || [];
            return (
              <div key={day.dateStr} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", paddingBottom: 4, borderBottom: "1px solid #eee" }}>
                  <div>{day.label}</div>
                  <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{day.date.getDate()}</div>
                </div>
                {dateSlots.length === 0 && <div style={{ fontSize: 10, color: "#ccc", textAlign: "center", padding: 4 }}>—</div>}
                {dateSlots.map((slot) => {
                  const active = slot.id === selectedSlotId;
                  return (
                    <button
                      key={slot.id} type="button" onClick={() => onSelect(slot.id)}
                      style={{
                        padding: "6px 4px", fontSize: 11, border: "1px solid",
                        borderColor: active ? "var(--accent-gold)" : "#e5e5e3",
                        background: active ? "var(--accent-gold)" : "#fff",
                        color: active ? "#fff" : "var(--text-primary)",
                        borderRadius: 4, cursor: "pointer", fontWeight: active ? 600 : 400,
                      }}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
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
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        희망하시는 일정을 우선순위 순으로 최대 3개까지 알려주세요. 확인 후 담당자가 연락드립니다.
      </p>
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

const navBtnStyle = {
  padding: "6px 12px", fontSize: 12, background: "none",
  border: "1px solid var(--border-color)", borderRadius: 4, cursor: "pointer",
  color: "var(--text-secondary)",
};
