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
  X,
  Users,
  Filter
} from "lucide-react";

export default function PortalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // 구글 캘린더 연동 모달 관련 상태
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncUrl, setSyncUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // 뷰 모드: "personal_day" | "personal_week" | "personal_month" | "member_day" | "member_month"
  const [viewMode, setViewMode] = useState("personal_month");

  // 직원/의뢰인 역할 정보
  const [isEmployee, setIsEmployee] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);

  // 필터 상태 (직원용)
  const [selectedFilterMode, setSelectedFilterMode] = useState("my"); // "my" | "dept" | "company"
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]); // 필터링 대상 멤버 IDs
  const [showSidebar, setShowSidebar] = useState(false); // 모바일 사이드바 토글

  // 모바일 뷰 감지
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
  const [formColor, setFormColor] = useState("#0b1f3a");
  const [formOwnerId, setFormOwnerId] = useState("");
  const [formAttendeeIds, setFormAttendeeIds] = useState([]);

  // 프리미엄 파스텔 톤 색상 리스트 (관리자 페이지 테마 적용)
  const colorPalette = [
    { value: "#0b1f3a", label: "네이비" },
    { value: "#c9a84c", label: "골드" },
    { value: "#3b82f6", label: "블루" },
    { value: "#10b981", label: "에메랄드" },
    { value: "#f59e0b", label: "엠버" },
    { value: "#ef4444", label: "로즈" },
  ];

  // 윈도우 리사이즈 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. 프로필 정보 조회
  useEffect(() => {
    portalApi.get("/me").then((res) => {
      setUserProfile(res.data);
    }).catch(err => console.error("프로필 로드 실패:", err));
  }, []);

  // 1-2. 구글 캘린더 연동 링크 로드
  useEffect(() => {
    if (userProfile) {
      portalApi.get("/calendar/sync-info")
        .then((res) => {
          setSyncUrl(res.data?.feedUrl || "");
        })
        .catch((err) => console.error("캘린더 연동 정보 로드 실패:", err));
    }
  }, [userProfile]);

  // 2. 직원 체크 및 필터 데이터 (부서/사원) 로드
  useEffect(() => {
    if (userProfile) {
      const employeeCheck = !userProfile.user?.clientId;
      setIsEmployee(employeeCheck);

      if (employeeCheck) {
        Promise.all([
          portalApi.get("/departments"),
          portalApi.get("/members")
        ]).then(([deptRes, memRes]) => {
          const depts = deptRes.data?.data || [];
          const mems = memRes.data?.data || [];
          setDepartments(depts);
          setMembers(mems);

          // 기본 부서 설정: 본인 부서
          const me = mems.find(m => m.id === userProfile.user?.id);
          if (me && me.departmentId) {
            setSelectedDeptId(me.departmentId);
          } else if (depts.length > 0) {
            setSelectedDeptId(depts[0].id);
          }
        }).catch(err => {
          console.error("조직 데이터 로드 실패:", err);
        });
      }
    }
  }, [userProfile]);

  // 3. 필터 모드 및 선택 대상 변경 시 멤버 선택 ID 초기화
  useEffect(() => {
    if (selectedFilterMode === "my" && userProfile) {
      setSelectedMemberIds([userProfile.user?.id]);
    } else if (selectedFilterMode === "dept" && selectedDeptId) {
      const deptMems = members.filter(m => m.departmentId === selectedDeptId);
      setSelectedMemberIds(deptMems.map(m => m.id));
    } else if (selectedFilterMode === "company") {
      setSelectedMemberIds(members.map(m => m.id));
    }
  }, [selectedFilterMode, selectedDeptId, members, userProfile]);

  // 3-2. 구성원용 뷰 모드로 전환 시, 기본 필터 모드를 'company'로 변경하여 전체 구성원이 보이도록 설정
  useEffect(() => {
    if (viewMode.startsWith("member_")) {
      if (selectedFilterMode === "my") {
        setSelectedFilterMode("company");
      }
    }
  }, [viewMode]);

  // 4. 일정 목록 로드 (필터 또는 뷰 모드 변경 반응)
  useEffect(() => {
    if (userProfile) {
      fetchEvents();
    }
  }, [selectedFilterMode, selectedDeptId, selectedMemberIds, userProfile, viewMode]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = "/events";
      const params = {};

      if (isEmployee) {
        // 개인 일정 뷰인 경우 강제로 본인 ID만 쿼리
        if (viewMode.startsWith("personal_")) {
          params.userIds = userProfile?.user?.id;
        } else {
          // 구성원 일정 뷰인 경우 필터링 상태 적용
          if (selectedFilterMode === "my") {
            params.userIds = userProfile?.user?.id;
          } else {
            params.userIds = selectedMemberIds.join(",");
          }
        }
      }

      const queryStr = new URLSearchParams(params).toString();
      const res = await portalApi.get(url + (queryStr ? `?${queryStr}` : ""));
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

  // 특정 일자 일정 매칭
  const getEventsForDay = (date) => {
    const dateString = formatDateString(date);
    return events.filter((event) => {
      const start = event.startsAt.substring(0, 10);
      const end = (event.endsAt || event.startsAt).substring(0, 10);
      return dateString >= start && dateString <= end;
    });
  };

  // 이전/다음 날짜 이동 컨트롤
  const handlePrev = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode.endsWith("month")) {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode.endsWith("week")) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode.endsWith("day")) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode.endsWith("month")) {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode.endsWith("week")) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode.endsWith("day")) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 주간 날짜 범위 텍스트 추출
  const getWeekRangeString = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatShortDate = (d) => {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    };
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
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
    setFormColor("#0b1f3a");
    if (userProfile) {
      setFormOwnerId(userProfile.user?.id || "");
    }
    setFormAttendeeIds([]);
    setShowModal(true);
  };

  // 일정 상세/수정 모달 열기
  const handleOpenEditModal = (event, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    
    const formatInputDateTime = (str) => {
      if (!str) return "";
      return str.length > 16 ? str.substring(0, 16) : str;
    };

    setFormStartsAt(formatInputDateTime(event.startsAt));
    setFormEndsAt(formatInputDateTime(event.endsAt || event.startsAt));
    setFormIsAllDay(event.isAllDay === 1);
    setFormColor(event.color || "#6366f1");
    setFormOwnerId(event.portalUserId || "");
    setFormAttendeeIds(
      (event.attendeeIds || "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)
    );
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
      portalUserId: isEmployee ? formOwnerId : undefined,
      attendeeIds: isEmployee ? formAttendeeIds.join(",") : undefined,
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
      alert(err.response?.data?.error || "일정 저장에 실패했습니다.");
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

  // ==================== 월간 뷰 그리드 렌더링 ====================
  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
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

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(90px, 1fr)", flex: 1 }}>
        {cells.map((cell, idx) => {
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
                position: "relative",
                minHeight: 90
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = cell.isCurrentMonth ? "rgba(201, 168, 76, 0.08)" : "#f1f5f9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = cell.isCurrentMonth ? "#ffffff" : "#f8fafc"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: 12,
                  fontWeight: 700,
                  background: isToday ? "#0b1f3a" : "transparent",
                  color: isToday ? "#ffffff" : (!cell.isCurrentMonth ? "#cbd5e1" : (dayOfWeek === 0 ? "#ef4444" : dayOfWeek === 6 ? "#3b82f6" : "#334155")),
                }}>
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 0 && cell.isCurrentMonth && (
                  <span style={{ fontSize: 10, color: "#0b1f3a", fontWeight: 600 }}>
                    {dayEvents.length}개 일정
                  </span>
                )}
              </div>

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
                    title={`${event.title} (${event.ownerName || "미지정"})`}
                  >
                    {viewMode.startsWith("member_") && event.ownerName ? `[${event.ownerName}] ${event.title}` : event.title}
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
        })}
      </div>
    );
  };

  // ==================== 주간 뷰 그리드 렌더링 ====================
  const renderWeeklyView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, flex: 1, minHeight: 480 }}>
        {weekDays.map((date, idx) => {
          const dateStr = formatDateString(date);
          const dayEvents = getEventsForDay(date);
          const isToday = dateStr === formatDateString(new Date());
          const dayOfWeek = date.getDay();
          const weekdaysKorean = ["일", "월", "화", "수", "목", "금", "토"];

          return (
            <div
              key={idx}
              onClick={() => handleOpenCreateModal(date)}
              style={{
                borderRight: idx === 6 ? "none" : "1px solid #f1f5f9",
                background: "#ffffff",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 450,
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201, 168, 76, 0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: dayOfWeek === 0 ? "#ef4444" : dayOfWeek === 6 ? "#3b82f6" : "#64748b" }}>
                  {weekdaysKorean[dayOfWeek]}
                </span>
                <span style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 4,
                  background: isToday ? "#0b1f3a" : "transparent",
                  color: isToday ? "#ffffff" : "#1e293b"
                }}>
                  {date.getDate()}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, overflowY: "auto" }}>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleOpenEditModal(event, e)}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: `${event.color}12`,
                      color: event.color,
                      borderLeft: `3px solid ${event.color}`,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    }}
                    title={`${event.title}\n${event.description || ""}`}
                  >
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8, display: "flex", justifyContent: "space-between" }}>
                      <span>{event.isAllDay ? "하루종일" : event.startsAt.substring(11, 16)}</span>
                      {event.ownerName && <span>{event.ownerName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== 일간 뷰 그리드 렌더링 ====================
  const renderDailyView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const allDayEvents = dayEvents.filter(e => e.isAllDay === 1);
    const timedEvents = dayEvents.filter(e => e.isAllDay !== 1);

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 480 }}>
        {/* 하루 종일 영역 */}
        {allDayEvents.length > 0 && (
          <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "10px 16px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>하루 종일</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => handleOpenEditModal(event, e)}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                    background: `${event.color}15`, color: event.color, borderLeft: `4px solid ${event.color}`,
                    cursor: "pointer"
                  }}
                >
                  {event.title} {event.ownerName ? `(${event.ownerName})` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간대별 타임라인 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
          {hours.map(hour => {
            const hourStr = String(hour).padStart(2, "0") + ":00";
            const hourEvents = timedEvents.filter(e => {
              const h = parseInt(e.startsAt.substring(11, 13), 10);
              return h === hour;
            });

            return (
              <div
                key={hour}
                onClick={() => {
                  const d = new Date(currentDate);
                  // clicked hour
                  const formattedHour = String(hour).padStart(2, "0");
                  setIsEditing(false);
                  setSelectedEvent(null);
                  setFormTitle("");
                  setFormDescription("");
                  setFormStartsAt(formatDateForInput(d, `${formattedHour}:00`));
                  const nextHour = String(hour + 1).padStart(2, "0");
                  setFormEndsAt(formatDateForInput(d, `${nextHour}:00`));
                  setFormIsAllDay(false);
                  setFormColor("#0b1f3a");
                  if (userProfile) {
                    setFormOwnerId(userProfile.user?.id || "");
                  }
                  setFormAttendeeIds([]);
                  setShowModal(true);
                }}
                style={{
                  display: "flex",
                  borderBottom: "1px solid #f1f5f9",
                  minHeight: 56,
                  cursor: "pointer",
                  transition: "background 0.1s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201, 168, 76, 0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 72, borderRight: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc"
                }}>
                  {hourStr}
                </div>

                <div style={{ flex: 1, padding: "6px 12px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleOpenEditModal(event, e)}
                      style={{
                        fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
                        background: `${event.color}12`, color: event.color, borderLeft: `4px solid ${event.color}`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)", cursor: "pointer",
                        display: "flex", flexDirection: "column", gap: 2, minWidth: 140
                      }}
                      title={`${event.title}\n${event.description || ""}`}
                    >
                      <span style={{ fontWeight: 700 }}>{event.title}</span>
                      <span style={{ fontSize: 10, opacity: 0.8 }}>
                        {event.startsAt.substring(11, 16)} - {(event.endsAt || event.startsAt).substring(11, 16)}
                        {event.ownerName ? ` | 담당: ${event.ownerName}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==================== 구성원 일간 뷰 렌더링 ====================
  const renderMemberDailyView = () => {
    const activeMembers = members.filter(m => selectedMemberIds.includes(m.id));

    if (activeMembers.length === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#64748b", fontSize: 13.5, background: "#f8fafc" }}>
          선택된 구성원이 없습니다. 왼쪽 필터 또는 구성원 목록에서 사원을 선택해 주세요.
        </div>
      );
    }

    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 to 23:00

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowX: "auto", background: "#ffffff", borderRadius: 8 }}>
        {/* 구성원 컬럼 헤더 */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", minWidth: 60 + activeMembers.length * 140 }}>
          <div style={{ width: 60, borderRight: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }} />
          {activeMembers.map(m => (
            <div
              key={m.id}
              style={{
                flex: 1,
                minWidth: 140,
                borderRight: "1px solid #e2e8f0",
                padding: "10px",
                textAlign: "center",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#0b1f3a",
                background: "#f8fafc",
                borderBottom: "2px solid #c9a84c"
              }}
            >
              {m.name} <span style={{ fontSize: 10, fontWeight: 500, color: "#64748b" }}>{m.position || "사원"}</span>
            </div>
          ))}
        </div>

        {/* 하루 종일 영역 */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", minWidth: 60 + activeMembers.length * 140, background: "#f8fafc" }}>
          <div style={{
            width: 60,
            borderRight: "1px solid #e2e8f0",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b"
          }}>
            종일
          </div>
          {activeMembers.map(m => {
            const mEvents = events.filter(e => {
              const isOwner = e.portalUserId === m.id;
              const isAttendee = (e.attendeeIds || "").split(",").includes(m.id);
              const isToday = formatDateString(currentDate) >= e.startsAt.substring(0, 10) && formatDateString(currentDate) <= (e.endsAt || e.startsAt).substring(0, 10);
              return (isOwner || isAttendee) && isToday && e.isAllDay === 1;
            });

            return (
              <div key={m.id} style={{ flex: 1, minWidth: 140, borderRight: "1px solid #e2e8f0", padding: "6px 8px", minHeight: 45, display: "flex", flexDirection: "column", gap: 3 }}>
                {mEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleOpenEditModal(event, e)}
                    style={{
                      fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4,
                      background: `${event.color}15`, color: event.color, borderLeft: `3px solid ${event.color}`,
                      cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* 시간대별 그리드 */}
        <div style={{ display: "flex", flex: 1, overflowY: "auto", position: "relative", minWidth: 60 + activeMembers.length * 140 }}>
          {/* 시간 표시선 */}
          <div style={{ width: 60, borderRight: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {hours.map(hour => (
              <div key={hour} style={{ height: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6, fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #f1f5f9", boxSizing: "border-box" }}>
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 구성원 타임라인 열 */}
          <div style={{ flex: 1, display: "flex", position: "relative" }}>
            {activeMembers.map(m => {
              const mEvents = events.filter(e => {
                const isOwner = e.portalUserId === m.id;
                const isAttendee = (e.attendeeIds || "").split(",").includes(m.id);
                const isToday = formatDateString(currentDate) >= e.startsAt.substring(0, 10) && formatDateString(currentDate) <= (e.endsAt || e.startsAt).substring(0, 10);
                return (isOwner || isAttendee) && isToday && e.isAllDay !== 1;
              });

              return (
                <div
                  key={m.id}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    borderRight: "1px solid #e2e8f0",
                    position: "relative",
                    height: hours.length * 60,
                    background: "#ffffff"
                  }}
                >
                  {hours.map(hour => (
                    <div
                      key={hour}
                      onClick={() => {
                        const d = new Date(currentDate);
                        const formattedHour = String(hour).padStart(2, "0");
                        setIsEditing(false);
                        setSelectedEvent(null);
                        setFormTitle("");
                        setFormDescription("");
                        setFormStartsAt(formatDateForInput(d, `${formattedHour}:00`));
                        const nextHour = String(hour + 1).padStart(2, "0");
                        setFormEndsAt(formatDateForInput(d, `${nextHour}:00`));
                        setFormIsAllDay(false);
                        setFormColor("#0b1f3a");
                        setFormOwnerId(m.id);
                        setFormAttendeeIds([]);
                        setShowModal(true);
                      }}
                      style={{
                        height: 60,
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        boxSizing: "border-box"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201, 168, 76, 0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    />
                  ))}

                  {/* 일정 블록 절대 위치 배치 */}
                  {mEvents.map(event => {
                    const startTimeStr = event.startsAt.substring(11, 16);
                    const endTimeStr = (event.endsAt || event.startsAt).substring(11, 16);

                    const [sH, sM] = startTimeStr.split(":").map(Number);
                    const [eH, eM] = endTimeStr.split(":").map(Number);

                    const startHourVal = sH + sM / 60;
                    const endHourVal = eH + eM / 60;

                    const displayStart = Math.max(8, Math.min(24, startHourVal));
                    const displayEnd = Math.max(8, Math.min(24, endHourVal));

                    if (displayEnd <= displayStart) return null;

                    const top = (displayStart - 8) * 60;
                    const height = (displayEnd - displayStart) * 60;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleOpenEditModal(event, e)}
                        style={{
                          position: "absolute",
                          top: top + 2,
                          height: height - 4,
                          left: 4,
                          right: 4,
                          zIndex: 10,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 6px",
                          borderRadius: 4,
                          background: `${event.color}15`,
                          color: event.color,
                          borderLeft: `3px solid ${event.color}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2
                        }}
                        title={`${event.title}\n${startTimeStr} - ${endTimeStr}`}
                      >
                        <span style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {event.title}
                        </span>
                        <span style={{ fontSize: 9, opacity: 0.8 }}>
                          {startTimeStr}-{endTimeStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const weekdaysHeader = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: isMobile ? "column" : "row", height: "100%", minHeight: 650 }}>
      
      {/* ==================== 1. 조직도 필터 사이드바 (직원 전용) ==================== */}
      {isEmployee && (
        <div style={{
          width: isMobile ? "100%" : 240,
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: 20,
          boxShadow: T.cardShadow,
          display: (isMobile && !showSidebar) ? "none" : "block",
          flexShrink: 0
        }}>
          {/* 큰 일정 등록 버튼 (네이비/골드 적용) */}
          <button
            onClick={() => handleOpenCreateModal(new Date())}
            style={{
              width: "100%", background: "#0b1f3a", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: 8,
              padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(11,31,58,0.15)", marginBottom: 20,
              transition: "opacity 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.9; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
          >
            <Plus size={18} />
            일정 등록
          </button>

          {viewMode.startsWith("member_") ? (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0b1f3a", margin: "0 0 12px 0", letterSpacing: "0.03em" }}>
                구성원 캘린더 필터
              </h3>

              {/* 필터 모드 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {[
                  { id: "my", label: "👤 내 일정 보기" },
                  { id: "dept", label: "🏢 부서별 일정" },
                  { id: "company", label: "🌐 회사 전체 일정" }
                ].map(mode => (
                  <label
                    key={mode.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                      color: selectedFilterMode === mode.id ? "#0b1f3a" : "var(--text-secondary)",
                      cursor: "pointer", padding: "8px 10px", borderRadius: 6,
                      background: selectedFilterMode === mode.id ? "rgba(11, 31, 58, 0.06)" : "transparent",
                      fontWeight: selectedFilterMode === mode.id ? 600 : 400,
                      transition: "all 0.15s"
                    }}
                  >
                    <input
                      type="radio"
                      name="filterMode"
                      checked={selectedFilterMode === mode.id}
                      onChange={() => setSelectedFilterMode(mode.id)}
                      style={{ accentColor: "#0b1f3a" }}
                    />
                    {mode.label}
                  </label>
                ))}
              </div>

              {/* 부서 선택 dropdown */}
              {selectedFilterMode === "dept" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>부서 선택</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    style={{ ...fieldStyle, padding: "8px 10px", fontSize: 13, borderColor: "#cbd5e1" }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 구성원 체크리스트 */}
              {(selectedFilterMode === "dept" || selectedFilterMode === "company") && (
                <div>
                  <label style={labelStyle}>
                    구성원 일정 ({
                      (selectedFilterMode === "dept"
                        ? members.filter(m => m.departmentId === selectedDeptId)
                        : members
                      ).length
                    }명)
                  </label>
                  <div style={{
                    maxHeight: 280, overflowY: "auto", border: "1px solid #cbd5e1",
                    borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6
                  }}>
                    {(selectedFilterMode === "dept"
                      ? members.filter(m => m.departmentId === selectedDeptId)
                      : members
                    ).map(m => {
                      const isChecked = selectedMemberIds.includes(m.id);
                      return (
                        <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer", padding: "2px 0" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.id));
                              } else {
                                setSelectedMemberIds([...selectedMemberIds, m.id]);
                              }
                            }}
                            style={{ accentColor: "#0b1f3a" }}
                          />
                          <span>{m.name} {m.position || "사원"}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: "14px", background: "rgba(11, 31, 58, 0.04)", border: "1px solid rgba(11, 31, 58, 0.08)", borderRadius: 8, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: "#0b1f3a", display: "block", marginBottom: 6, fontSize: 13 }}>ℹ️ 개인 캘린더 모드</span>
              로그인한 사용자 본인의 일정과 본인이 배정받은 사건의 법정 기일(재판 기일 등) 일정을 통합 조회하는 화면입니다.
              <div style={{ marginTop: 8, fontSize: 11.5, color: "#64748b" }}>
                다른 구성원들의 일정을 확인하거나 공동 일정을 등록하려면 상단 탭에서 <strong>'구성원'</strong>을 선택하십시오.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 2. 달력 본문 영역 ==================== */}
      <div style={{
        flex: 1, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0",
        padding: isMobile ? 16 : "24px 32px", boxShadow: T.cardShadow,
        display: "flex", flexDirection: "column", minWidth: 0
      }}>
        
        {/* 상단 컨트롤 바 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b1f3a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarIcon size={20} style={{ color: "#c9a84c" }} />
                사내 일정 캘린더
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCopySuccess(false);
                  setShowSyncModal(true);
                }}
                style={{
                  background: "transparent", border: "1px solid #c9a84c", color: "#0b1f3a", borderRadius: 6,
                  padding: "4px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201, 168, 76, 0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                구글 캘린더 연동
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "4px 0 0" }}>
              {isEmployee ? "부서원 및 전사 구성원들과 공유되는 일정과 법정 기일을 통합 관리합니다." : "개인 업무 및 법정 기일 일정을 확인합니다."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* 모바일 필터 버튼 */}
            {isEmployee && isMobile && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                style={{
                  background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8,
                  padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}
              >
                <Filter size={14} />
                필터
              </button>
            )}

            {/* 뷰 모드 스위처 (네이버 캘린더 스타일) */}
            <div style={{ display: "flex", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#f1f5f9", padding: 2 }}>
              <div style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", padding: "0 6px 0 4px" }}>개인:</span>
                {[
                  { id: "personal_day", label: "일간" },
                  { id: "personal_week", label: "주간" },
                  { id: "personal_month", label: "월간" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    style={{
                      background: viewMode === mode.id ? "#0b1f3a" : "transparent",
                      border: "none", fontSize: 11, fontWeight: 600,
                      padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                      color: viewMode === mode.id ? "#c9a84c" : "#475569",
                      boxShadow: viewMode === mode.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.15s",
                      marginRight: 2
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              
              {isEmployee && (
                <div style={{ display: "flex", alignItems: "center", borderLeft: "1px solid #cbd5e1", paddingLeft: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", padding: "0 6px 0 4px" }}>구성원:</span>
                  {[
                    { id: "member_day", label: "일간" },
                    { id: "member_month", label: "월간" }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setViewMode(mode.id)}
                      style={{
                        background: viewMode === mode.id ? "#0b1f3a" : "transparent",
                        border: "none", fontSize: 11, fontWeight: 600,
                        padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                        color: viewMode === mode.id ? "#c9a84c" : "#475569",
                        boxShadow: viewMode === mode.id ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                        transition: "all 0.15s",
                        marginRight: 2
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 날짜 네비게이션 */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
              <button
                onClick={handlePrev}
                style={{ background: "transparent", border: "none", display: "flex", padding: 5, borderRadius: 6, cursor: "pointer", color: "#475569" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleToday}
                style={{ background: "#ffffff", border: "none", fontSize: 11.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, cursor: "pointer", color: "#0b1f3a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              >
                오늘
              </button>
              <button
                onClick={handleNext}
                style={{ background: "transparent", border: "none", display: "flex", padding: 5, borderRadius: 6, cursor: "pointer", color: "#475569" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 날짜 타이틀 */}
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0b1f3a", minWidth: 100, textAlign: "center" }}>
              {viewMode.endsWith("month") && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
              {viewMode.endsWith("week") && getWeekRangeString()}
              {viewMode.endsWith("day") && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`}
            </span>

            {/* 일반 일정 추가 버튼 (비임직원용 또는 모바일용) */}
            {(!isEmployee || isMobile) && (
              <button
                onClick={() => handleOpenCreateModal(new Date())}
                style={{
                  background: "#0b1f3a", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: 8,
                  padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 4px rgba(11,31,58,0.15)"
                }}
              >
                <Plus size={14} />
                등록
              </button>
            )}
          </div>
        </div>

        {/* 캘린더 그리드 영역 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", minWidth: 0 }}>
          {/* 요일 헤더 (주간, 월간 모드 공용) */}
          {!viewMode.endsWith("day") && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {weekdaysHeader.map((w, idx) => (
                <div
                  key={w}
                  style={{
                    padding: "8px 0", fontSize: 12, fontWeight: 600, textAlign: "center",
                    color: idx === 0 ? "#ef4444" : idx === 6 ? "#3b82f6" : "#475569"
                  }}
                >
                  {w}
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14, flex: 1, padding: 40 }}>
              일정을 불러오고 있습니다...
            </div>
          ) : (
            <>
              {viewMode.endsWith("month") && renderMonthlyView()}
              {viewMode.endsWith("week") && renderWeeklyView()}
              {viewMode === "personal_day" && renderDailyView()}
              {viewMode === "member_day" && renderMemberDailyView()}
            </>
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
            background: "#ffffff", borderRadius: 12, width: "92%", maxWidth: 480,
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

            {/* 담당자 설정 (직원전용) */}
            {isEmployee && !selectedEvent?.isCourtDate && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>담당 사원 (스케줄 소유자)</label>
                <select
                  value={formOwnerId}
                  onChange={(e) => setFormOwnerId(e.target.value)}
                  style={fieldStyle}
                  required
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position || "사원"})</option>
                  ))}
                </select>
              </div>
            )}

            {/* 일정 제목 */}
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

            {/* 참석 사원 지정 (직원전용) */}
            {isEmployee && !selectedEvent?.isCourtDate && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>회의 참석자 (복수 선택)</label>
                <div style={{
                  maxHeight: 120, overflowY: "auto", border: "1px solid rgba(11, 31, 58, 0.16)",
                  borderRadius: 6, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6
                }}>
                  {members.filter(m => m.id !== formOwnerId).map(m => {
                    const isChecked = formAttendeeIds.includes(m.id);
                    return (
                      <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setFormAttendeeIds(formAttendeeIds.filter(id => id !== m.id));
                            } else {
                              setFormAttendeeIds([...formAttendeeIds, m.id]);
                            }
                          }}
                          style={{ accentColor: "#0b1f3a" }}
                        />
                        <span>{m.name} ({m.position || "사원"})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

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
                      background: "#0b1f3a", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: 6,
                      padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(11,31,58,0.15)"
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

      {/* ==================== 4. 구글 캘린더 연동 안내 모달 ==================== */}
      {showSyncModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: 12, width: "92%", maxWidth: 520,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0b1f3a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarIcon size={18} style={{ color: "#c9a84c" }} />
                구글 캘린더 연동 안내 (iCal)
              </h3>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 12px 0" }}>
                하이로 캘린더 일정을 외부 구글 캘린더에 실시간으로 동기화하여 구독할 수 있습니다. 아래 주소를 복사해 구글 캘린더에 등록해 주세요.
              </p>
              
              <label style={labelStyle}>구독용 iCal 피드 주소</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={syncUrl || "연동 주소를 불러오는 중..."}
                  readOnly
                  onClick={(e) => e.target.select()}
                  style={{ ...fieldStyle, flex: 1, padding: "8px 12px", fontSize: 12.5, background: "#f8fafc", color: "#334155" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (syncUrl) {
                      navigator.clipboard.writeText(syncUrl);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }
                  }}
                  style={{
                    background: copySuccess ? "#10b981" : "#0b1f3a",
                    color: copySuccess ? "#ffffff" : "#c9a84c",
                    border: copySuccess ? "none" : "1px solid #c9a84c",
                    borderRadius: 6,
                    padding: "0 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s"
                  }}
                >
                  {copySuccess ? "✓ 복사됨" : "주소 복사"}
                </button>
              </div>
              <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 500 }}>
                ⚠️ 주의: 이 주소에는 회원님의 일정 정보가 들어있으므로 타인에게 노출되지 않도록 주의해 주세요.
              </span>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginBottom: 24 }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 700, color: "#0b1f3a", margin: "0 0 10px 0" }}>
                연동 방법 및 순서
              </h4>
              <ol style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 6 }}>
                  구글 캘린더 홈페이지(<a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c", fontWeight: 600, textDecoration: "underline" }}>calendar.google.com</a>)에 접속하여 로그인합니다.
                </li>
                <li style={{ marginBottom: 6 }}>
                  왼쪽 사이드바 영역의 <strong>'다른 캘린더'</strong> 항목 우측에 있는 <strong>'+' (다른 캘린더 추가)</strong> 버튼을 누릅니다.
                </li>
                <li style={{ marginBottom: 6 }}>
                  나타나는 메뉴 중 <strong>'URL로 추가'</strong>를 선택하여 클릭합니다.
                </li>
                <li style={{ marginBottom: 6 }}>
                  입력 필드에 복사해 둔 <strong>하이로 iCal 피드 주소</strong>를 붙여넣습니다.
                </li>
                <li>
                  마지막으로 <strong>'캘린더 추가'</strong> 버튼을 누르면 연동이 완료됩니다.<br />
                  <span style={{ fontSize: 11, color: "#8a97a8" }}>※ 구글 시스템 특성상 실시간 동기화 반영에는 수 시간 정도 소요될 수 있습니다.</span>
                </li>
              </ol>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                style={{
                  background: "#0b1f3a", color: "#c9a84c", border: "1px solid #c9a84c", borderRadius: 6,
                  padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(11,31,58,0.1)"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
