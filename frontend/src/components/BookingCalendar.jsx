/** 예약 캘린더 — 주간 뷰 슬롯 선택, 모바일 대응 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../utils/api";

const T = { accent: "var(--accent-gold)", accentDim: "var(--accent-gold-light)", text: "var(--text-primary)", textSec: "var(--text-secondary)", textMuted: "var(--text-muted)", border: "var(--border-color)" };

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const HOUR_START = 9;
const HOUR_END = 18;

/** 주의 월요일 날짜 구하기 */
function getMonday(date) {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** 날짜를 YYYY-MM-DD 형식으로 변환 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_NAMES[date.getDay()]}요일`;
}

/** 주간 날짜 배열 (월~금) */
function getWeekDays(monday) {
  return Array.from({ length: 5 }, (_, i) => {
    const weekday = new Date(monday);
    weekday.setDate(weekday.getDate() + i);
    return weekday;
  });
}

/** 시간 행 배열 */
function getTimeRows() {
  const rows = [];
  for (let h = HOUR_START; h < HOUR_END; h++) {
    rows.push(`${String(h).padStart(2, "0")}:00`);
    rows.push(`${String(h).padStart(2, "0")}:30`);
  }
  return rows;
}

/**
 * 예약 캘린더 컴포넌트
 * @param {{ onSelectSlot: (slot: object) => void, lawyerId?: string }} props
 */
export default function BookingCalendar({ onSelectSlot, lawyerId }) {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileDay, setMobileDay] = useState(0);

  const weekDays = useMemo(() => getWeekDays(monday), [monday]);
  const timeRows = useMemo(() => getTimeRows(), []);

  /** 모바일 감지 (간단 방식) */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  /** 슬롯 데이터 로드 */
  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate: formatDate(monday) });
      if (lawyerId) params.set("lawyerId", lawyerId);
      const json = await api.get(`/bookings/available-week?${params}`);
      setSlots(json.data ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [monday, lawyerId]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  /** 주 이동 */
  const prevWeek = () => setMonday((prev) => { const date = new Date(prev); date.setDate(date.getDate() - 7); return date; });
  const nextWeek = () => setMonday((prev) => { const date = new Date(prev); date.setDate(date.getDate() + 7); return date; });

  /** 슬롯 조회 (날짜 + 시간 매칭) */
  const getSlot = (date, time) => {
    const dateStr = formatDate(date);
    return slots.find((s) => s.date === dateStr && s.time === time);
  };

  /** 슬롯 클릭 */
  const handleSlotClick = (slot) => {
    if (!slot || slot.status === "booked") return;
    setSelectedSlot(slot);
    if (onSelectSlot) onSelectSlot(slot);
  };

  const isSlotSelected = (slot) => Boolean(slot && selectedSlot && selectedSlot.id === slot.id);

  const getSlotLabel = (date, time, slot) => {
    const prefix = `${formatDateLabel(date)} ${time}`;
    if (!slot) return `${prefix} 예약 시간 없음`;
    if (slot.status === "booked") return `${prefix} 예약됨`;
    return `${prefix} ${isSlotSelected(slot) ? "선택됨" : "예약 가능"}`;
  };

  /** 슬롯 셀 스타일 */
  const slotCellStyle = (slot) => {
    if (!slot) return { background: "#f5f5f5", cursor: "default" };
    if (slot.status === "booked") return { background: "#e8e8e8", color: T.textMuted, cursor: "default" };
    const isSelected = isSlotSelected(slot);
    return {
      background: isSelected ? T.accent : "#fff",
      color: isSelected ? "#fff" : T.text,
      border: `1px solid ${isSelected ? T.accent : T.accent + "66"}`,
      cursor: "pointer",
    };
  };

  /** 헤더 날짜 표시 */
  const fridayDate = weekDays[4];
  const headerText = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${fridayDate.getDate()}일`;

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      {/* ==================== 헤더 ==================== */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", background: "#faf9f6", borderBottom: `1px solid ${T.border}`,
      }}>
        <button
          type="button"
          onClick={prevWeek}
          aria-label="이전 주 예약 시간 보기"
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.textSec, padding: "4px 8px" }}
        >
          &#8592;
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{headerText}</span>
        <button
          type="button"
          onClick={nextWeek}
          aria-label="다음 주 예약 시간 보기"
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.textSec, padding: "4px 8px" }}
        >
          &#8594;
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>로딩 중...</div>}

      {/* ==================== 모바일: 요일 선택 탭 ==================== */}
      {isMobile && (
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {weekDays.map((day, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setMobileDay(idx)}
              aria-label={`${formatDateLabel(day)} 예약 시간 보기`}
              aria-pressed={mobileDay === idx}
              style={{
                flex: 1, padding: "10px 0", fontSize: 12, fontWeight: mobileDay === idx ? 600 : 400,
                background: mobileDay === idx ? T.accentDim : "transparent",
                color: mobileDay === idx ? T.accent : T.textSec,
                border: "none", borderBottom: mobileDay === idx ? `2px solid ${T.accent}` : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {DAY_NAMES[day.getDay()]}<br />
              <span style={{ fontSize: 11 }}>{day.getDate()}</span>
            </button>
          ))}
        </div>
      )}

      {/* ==================== 데스크탑: 주간 그리드 ==================== */}
      {!isMobile ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ width: 60, padding: 8, borderBottom: `1px solid ${T.border}`, color: T.textMuted, fontWeight: 500 }}>시간</th>
                {weekDays.map((day, i) => (
                  <th key={i} style={{ padding: 8, borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 500, textAlign: "center" }}>
                    {DAY_NAMES[day.getDay()]} {day.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeRows.map((time) => (
                <tr key={time}>
                  <td style={{ padding: "6px 8px", borderRight: `1px solid ${T.border}`, color: T.textMuted, fontSize: 11, textAlign: "center" }}>
                    {time}
                  </td>
                  {weekDays.map((day, i) => {
                    const slot = getSlot(day, time);
                    const selected = isSlotSelected(slot);
                    return (
                      <td
                        key={i}
                        style={{
                          padding: 4, textAlign: "center", borderRight: i < 4 ? `1px solid ${T.border}` : "none",
                          borderBottom: `1px solid #f0f0f0`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSlotClick(slot)}
                          disabled={!slot || slot.status === "booked"}
                          aria-label={getSlotLabel(day, time, slot)}
                          aria-pressed={slot && slot.status !== "booked" ? selected : undefined}
                          style={{
                            width: "100%", minHeight: 28, borderRadius: 4,
                            font: "inherit", lineHeight: 1,
                            ...slotCellStyle(slot),
                            transition: "all 0.15s",
                          }}
                        >
                          <span aria-hidden="true">{slot ? (slot.status === "booked" ? "X" : "O") : ""}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ==================== 모바일: 단일 요일 시간 목록 ==================== */
        <div style={{ padding: 12 }}>
          {timeRows.map((time) => {
            const slot = getSlot(weekDays[mobileDay], time);
            return (
              <button
                type="button"
                key={time}
                onClick={() => handleSlotClick(slot)}
                disabled={!slot || slot.status === "booked"}
                aria-label={getSlotLabel(weekDays[mobileDay], time, slot)}
                aria-pressed={slot && slot.status !== "booked" ? isSlotSelected(slot) : undefined}
                style={{
                  width: "100%", border: slot ? undefined : "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", marginBottom: 6, borderRadius: 6,
                  fontSize: 13, fontFamily: "inherit", ...slotCellStyle(slot), transition: "all 0.15s",
                }}
              >
                <span>{time}</span>
                <span style={{ fontSize: 12 }}>
                  {slot ? (slot.status === "booked" ? "예약됨" : "예약 가능") : "-"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ==================== 범례 ==================== */}
      <div style={{ display: "flex", gap: 16, padding: "12px 20px", borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textMuted }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, border: `1px solid ${T.accent}66`, marginRight: 4, verticalAlign: "middle" }} /> 예약 가능</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: "#e8e8e8", marginRight: 4, verticalAlign: "middle" }} /> 예약됨</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: T.accent, marginRight: 4, verticalAlign: "middle" }} /> 선택됨</span>
      </div>
    </div>
  );
}
