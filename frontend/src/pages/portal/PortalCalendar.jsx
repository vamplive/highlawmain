import { useState, useEffect } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit,
  X,
  AlertCircle
} from "lucide-react";

export default function PortalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // 일자별 업무시간 합계: { 'YYYY-MM-DD': 분 }
  const [timeSummaryByDay, setTimeSummaryByDay] = useState({});

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 폼 상태
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formColor, setFormColor] = useState("#6366f1");

  // 프리미엄 파스텔 톤 색상 리스트
  const colorPalette = [
    { value: "#6366f1", label: "인디고" },
    { value: "#8b5cf6", label: "퍼플" },
    { value: "#3b82f6", label: "블루" },
    { value: "#10b981", label: "에메랄드" },
    { value: "#f59e0b", label: "엠버" },
    { value: "#ef4444", label: "로즈" },
  ];

  // 일정 목록 불러오기
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await portalApi.get("/events");
      setEvents(res.data?.data || []);
    } catch (e) {
      console.error("[PortalCalendar] 일정 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 변환 헬퍼 (YYYY-MM-DD)
  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 날짜 변환 헬퍼 (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date, setTimeTo = "09:00") => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T${setTimeTo}`;
  };

  // 달력 격자 생성
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0: 일, 1: 월...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  // 이전 달 패딩
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // 현재 달 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // 다음 달 패딩 (42칸 맞추기)
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  // 특정 일자 일정 매칭
  const getEventsForDay = (date) => {
    const dateString = formatDateString(date);
    return events.filter((event) => {
      const start = event.startsAt.substring(0, 10);
      const end = (event.endsAt || event.startsAt).substring(0, 10);
      return dateString >= start && dateString <= end;
    });
  };

  // 이전달/다음달 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 일정 등록 모달 열기
  const handleOpenCreateModal = (date) => {
    setIsEditing(false);
    setSelectedEvent(null);
    setFormTitle("");
    setFormDescription("");
    setFormStartsAt(formatDateForInput(date, "09:00"));
    setFormEndsAt(formatDateForInput(date, "18:00"));
    setFormIsAllDay(false);
    setFormColor("#6366f1");
    setShowModal(true);
  };

  // 일정 상세/수정 모달 열기
  const handleOpenEditModal = (event, e) => {
    e.stopPropagation(); // 셀 클릭 이벤트 버블링 방지
    setIsEditing(true);
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    
    // 만약 데이터에 초단위나 시간대가 섞여 있으면 input datetime-local 양식에 맞추기 위해 잘라줌
    const formatInputDateTime = (str) => {
      if (!str) return "";
      return str.length > 16 ? str.substring(0, 16) : str;
    };

    setFormStartsAt(formatInputDateTime(event.startsAt));
    setFormEndsAt(formatInputDateTime(event.endsAt || event.startsAt));
    setFormIsAllDay(event.isAllDay === 1);
    setFormColor(event.color || "#6366f1");
    setShowModal(true);
  };

  // 저장 처리
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return alert("일정 제목을 입력해주세요.");
    if (!formStartsAt) return alert("시작 시간을 선택해주세요.");
    
    const payload = {
      title: formTitle,
      description: formDescription,
      startsAt: formStartsAt,
      endsAt: formEndsAt || formStartsAt,
      isAllDay: formIsAllDay ? 1 : 0,
      color: formColor,
    };

    try {
      if (isEditing && selectedEvent) {
        await portalApi.put(`/events/${selectedEvent.id}`, payload);
        alert("일정이 수정되었습니다.");
      } else {
        await portalApi.post("/events", payload);
        alert("새 일정이 등록되었습니다.");
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert("일정 저장에 실패했습니다.");
    }
  };

  // 일정 삭제
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("정말로 이 일정을 삭제하시겠습니까?")) return;
    
    try {
      await portalApi.delete(`/events/${selectedEvent.id}`);
      alert("일정이 삭제되었습니다.");
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert("일정 삭제에 실패했습니다.");
    }
  };

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px 32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%", minHeight: 650 }}>
      {/* ==================== 1. 상단 컨트롤러 ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={22} style={{ color: "#8b5cf6" }} />
            사내 일정 캘린더
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
            법무법인 하이로 포털 사용자 개인의 업무 일정을 추가하고 관리할 수 있습니다.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 이전달/오늘/다음달 */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
            <button
              onClick={handlePrevMonth}
              style={{ background: "transparent", border: "none", display: "flex", padding: 6, borderRadius: 6, cursor: "pointer", color: "#475569" }}
              title="이전 달"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              style={{ background: "#ffffff", border: "none", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, cursor: "pointer", color: "#334155", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              오늘
            </button>
            <button
              onClick={handleNextMonth}
              style={{ background: "transparent", border: "none", display: "flex", padding: 6, borderRadius: 6, cursor: "pointer", color: "#475569" }}
              title="다음 달"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 현재 표시 년/월 */}
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", minWidth: 100, textAlign: "center" }}>
            {year}년 {month + 1}월
          </span>

          {/* 일정 추가 버튼 */}
          <button
            onClick={() => handleOpenCreateModal(new Date())}
            style={{
              background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(139,92,246,0.15)"
            }}
          >
            <Plus size={16} />
            일정 등록
          </button>
        </div>
      </div>

      {/* ==================== 2. 달력 격자 ==================== */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {weekdays.map((w, idx) => (
            <div
              key={w}
              style={{
                padding: "10px 0", fontSize: 12, fontWeight: 600, textAlign: "center",
                color: idx === 0 ? "#ef4444" : idx === 6 ? "#3b82f6" : "#475569"
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(90px, 1fr)", flex: 1 }}>
          {loading ? (
            <div style={{ gridColumn: "span 7", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
              일정을 로딩하고 있습니다...
            </div>
          ) : (
            cells.map((cell, idx) => {
              const isToday = formatDateString(cell.date) === formatDateString(new Date());
              const dayEvents = getEventsForDay(cell.date);
              const dayOfWeek = cell.date.getDay();

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenCreateModal(cell.date)}
                  style={{
                    borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #f1f5f9",
                    borderBottom: idx >= 35 ? "none" : "1px solid #f1f5f9",
                    padding: "6px 8px",
                    display: "flex",
                    flexDirection: "column",
                    background: cell.isCurrentMonth ? "#ffffff" : "#f8fafc",
                    cursor: "pointer",
                    transition: "background 0.1s",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = cell.isCurrentMonth ? "#f5f3ff" : "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = cell.isCurrentMonth ? "#ffffff" : "#f8fafc"; }}
                >
                  {/* 날짜 표시 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{
                      width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "50%", fontSize: 12, fontWeight: 700,
                      background: isToday ? "#8b5cf6" : "transparent",
                      color: isToday ? "#ffffff" : (!cell.isCurrentMonth ? "#cbd5e1" : (dayOfWeek === 0 ? "#ef4444" : dayOfWeek === 6 ? "#3b82f6" : "#334155"))
                    }}>
                      {cell.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && cell.isCurrentMonth && (
                      <span style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 600 }}>
                        {dayEvents.length}개 일정
                      </span>
                    )}
                  </div>

                  {/* 일정 뱃지들 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "hidden", flex: 1 }}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleOpenEditModal(event, e)}
                        style={{
                          fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4,
                          background: `${event.color}15`, color: event.color, borderLeft: `3px solid ${event.color}`,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          cursor: "pointer", transition: "transform 0.1s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", paddingRight: 4 }}>
                        +{dayEvents.length - 3} 더보기
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== 3. 등록 및 편집 모달 ==================== */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleSaveEvent} style={{
            background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 460,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {selectedEvent?.isCourtDate ? "법정 일정 상세" : (isEditing ? "일정 수정 / 상세" : "새 일정 등록")}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>일정 제목</label>
              <input
                type="text"
                placeholder="제목을 입력해 주세요"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={fieldStyle}
                disabled={selectedEvent?.isCourtDate}
                required
              />
            </div>

            {/* 시작 시간 / 종료 시간 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>시작 시간</label>
                <input
                  type={formIsAllDay ? "date" : "datetime-local"}
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  style={fieldStyle}
                  disabled={selectedEvent?.isCourtDate}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>종료 시간</label>
                <input
                  type={formIsAllDay ? "date" : "datetime-local"}
                  value={formEndsAt}
                  onChange={(e) => setFormEndsAt(e.target.value)}
                  style={fieldStyle}
                  disabled={selectedEvent?.isCourtDate}
                  required
                />
              </div>
            </div>

            {/* 하루 종일 설정 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: selectedEvent?.isCourtDate ? "default" : "pointer" }}>
                <input
                  type="checkbox"
                  checked={formIsAllDay}
                  disabled={selectedEvent?.isCourtDate}
                  onChange={(e) => {
                    setFormIsAllDay(e.target.checked);
                    // 하루종일 체크 시 포맷 단순 날짜로 변환 유도
                    if (e.target.checked) {
                      setFormStartsAt(prev => prev.substring(0, 10));
                      setFormEndsAt(prev => prev.substring(0, 10));
                    } else {
                      setFormStartsAt(prev => `${prev.substring(0, 10)}T09:00`);
                      setFormEndsAt(prev => `${prev.substring(0, 10)}T18:00`);
                    }
                  }}
                />
                하루 종일 (시간 미지정)
              </label>
            </div>

            {/* 일정 색상 분류 */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>일정 색상</label>
              <div style={{ display: "flex", gap: 8 }}>
                {colorPalette.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => !selectedEvent?.isCourtDate && setFormColor(c.value)}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", background: c.value,
                      border: formColor === c.value ? "2px solid #0f172a" : "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)", cursor: selectedEvent?.isCourtDate ? "default" : "pointer"
                    }}
                    title={c.label}
                    disabled={selectedEvent?.isCourtDate}
                  />
                ))}
              </div>
            </div>

            {/* 상세 설명 */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>상세 설명</label>
              <textarea
                placeholder="일정 상세 내용을 적어주세요 (장소, 준비물 등)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{ ...fieldStyle, height: 80, resize: "vertical" }}
                disabled={selectedEvent?.isCourtDate}
              />
            </div>

            {/* 하단 액션 버튼 */}
            <div style={{ display: "flex", justifyContent: (isEditing && !selectedEvent?.isCourtDate) ? "space-between" : "flex-end", gap: 8 }}>
              {isEditing && !selectedEvent?.isCourtDate && (
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  style={{
                    background: "#fff", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 6,
                    padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6
                  }}
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6,
                    padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer"
                  }}
                >
                  {selectedEvent?.isCourtDate ? "닫기" : "취소"}
                </button>
                {!selectedEvent?.isCourtDate && (
                  <button
                    type="submit"
                    style={{
                      background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6,
                      padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(139,92,246,0.15)"
                    }}
                  >
                    {isEditing ? "수정 완료" : "등록"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
