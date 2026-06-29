import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  X,
} from "lucide-react";

export default function PortalCalendar() {
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [syncingEventId, setSyncingEventId] = useState(null);
  const [formAutoSync, setFormAutoSync] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [showIcalModal, setShowIcalModal] = useState(false);
  const [icalUrl, setIcalUrl] = useState("");
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalCopied, setIcalCopied] = useState(false);
  const [icalError, setIcalError] = useState("");

  // 폼 상태
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formColor, setFormColor] = useState("#0ea5e9");

  const colorPalette = [
    { value: "#0ea5e9", label: "스카이" },
    { value: "#06b6d4", label: "시안" },
    { value: "#3b82f6", label: "블루" },
    { value: "#10b981", label: "에메랄드" },
    { value: "#f59e0b", label: "엠버" },
    { value: "#ef4444", label: "로즈" },
  ];

  // OAuth 콜백 처리
  useEffect(() => {
    const connected = searchParams.get("googleConnected");
    const err = searchParams.get("googleError");
    if (connected === "1") {
      showToast("구글 캘린더가 연동되었습니다", "success");
      setGoogleConnected(true);
      window.history.replaceState({}, "", "/portal/calendar");
    } else if (err) {
      showToast(`구글 캘린더 연동 실패: ${err}`, "error");
      window.history.replaceState({}, "", "/portal/calendar");
    }
  }, [searchParams]);

  // 초기 데이터 로드
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      portalApi.get("/events"),
      portalApi.get("/me"),
    ]).then(([evRes, meRes]) => {
      if (cancelled) return;
      setEvents(evRes.data?.data || []);
      setGoogleConnected(Boolean(meRes.data?.user?.googleConnected));
    }).catch(() => {
      if (!cancelled) setEvents([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await portalApi.get("/events");
      setEvents(res.data?.data || []);
    } catch {}
  };

  // 날짜 헬퍼
  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDateForInput = (date, setTimeTo = "09:00") => {
    return `${formatDateString(date)}T${setTimeTo}`;
  };

  // 달력 격자
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const getEventsForDay = (date) => {
    const ds = formatDateString(date);
    return events.filter((e) => {
      const start = e.startsAt.substring(0, 10);
      const end = (e.endsAt || e.startsAt).substring(0, 10);
      return ds >= start && ds <= end;
    });
  };

  // iCal 모달 열기
  const handleShowIcal = async () => {
    setIcalError("");
    setIcalUrl("");
    setIcalLoading(true);
    setShowIcalModal(true);
    try {
      const res = await portalApi.get("/me/ical-token");
      setIcalUrl(res.data?.data?.icalUrl || "");
    } catch (e) {
      setIcalError(e?.response?.data?.error || "iCal 주소를 가져오지 못했습니다");
    } finally {
      setIcalLoading(false);
    }
  };

  const handleCopyIcal = () => {
    if (!icalUrl) return;
    navigator.clipboard.writeText(icalUrl).then(() => {
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2000);
    });
  };

  const handleGoogleDisconnect = async () => {
    if (!window.confirm("구글 캘린더 연동을 해제하시겠습니까?")) return;
    try {
      await portalApi.delete("/google/disconnect");
      setGoogleConnected(false);
      showToast("구글 캘린더 연동이 해제되었습니다");
    } catch {
      showToast("연동 해제에 실패했습니다", "error");
    }
  };

  const handleSyncEvent = async (event) => {
    if (!googleConnected) {
      showToast("먼저 구글 캘린더를 연동해주세요", "error");
      return;
    }
    setSyncingEventId(event.id);
    try {
      const res = await portalApi.post(`/google/sync-event/${event.id}`);
      const googleEventId = res.data?.data?.eventId;
      if (googleEventId) {
        setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, googleEventId } : ev));
        if (selectedEvent?.id === event.id) setSelectedEvent(prev => ({ ...prev, googleEventId }));
      }
      showToast(`"${event.title}" 일정이 구글 캘린더에 추가되었습니다`);
    } catch (err) {
      showToast(err.message || "구글 캘린더 추가에 실패했습니다", "error");
    } finally {
      setSyncingEventId(null);
    }
  };

  const handleBulkSync = async () => {
    if (!googleConnected) return;
    if (!window.confirm("아직 동기화되지 않은 모든 일정을 구글 캘린더에 추가하시겠습니까?")) return;
    setBulkSyncing(true);
    try {
      const res = await portalApi.post("/google/sync-all");
      const { synced, failed, total } = res.data?.data || {};
      if (total === 0) showToast("동기화할 일정이 없습니다");
      else if (failed === 0) showToast(`${synced}개 일정을 구글 캘린더에 추가했습니다`, "success");
      else showToast(`${synced}개 추가 완료, ${failed}개 실패`, "warning");
      await fetchEvents();
    } catch {
      showToast("전체 동기화에 실패했습니다", "error");
    } finally {
      setBulkSyncing(false);
    }
  };

  // 모달 열기/닫기
  const handleOpenCreateModal = (date) => {
    setIsEditing(false);
    setSelectedEvent(null);
    setFormTitle("");
    setFormDescription("");
    setFormStartsAt(formatDateForInput(date, "09:00"));
    setFormEndsAt(formatDateForInput(date, "18:00"));
    setFormIsAllDay(false);
    setFormColor("#0ea5e9");
    setFormAutoSync(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (event, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    const fmt = (s) => (!s ? "" : s.length > 16 ? s.substring(0, 16) : s);
    setFormStartsAt(fmt(event.startsAt));
    setFormEndsAt(fmt(event.endsAt || event.startsAt));
    setFormIsAllDay(event.isAllDay === 1);
    setFormColor(event.color || "#0ea5e9");
    setShowModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return showToast("일정 제목을 입력해주세요");
    if (!formStartsAt) return showToast("시작 시간을 선택해주세요");
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
        showToast("일정이 수정되었습니다");
      } else {
        const createRes = await portalApi.post("/events", payload);
        showToast("새 일정이 등록되었습니다");
        if (formAutoSync && googleConnected && createRes.data?.data?.id) {
          try {
            await portalApi.post(`/google/sync-event/${createRes.data.data.id}`);
            showToast("구글 캘린더에도 추가되었습니다", "success");
          } catch { showToast("구글 캘린더 추가에 실패했습니다", "error"); }
        }
      }
      setShowModal(false);
      fetchEvents();
    } catch {
      showToast("일정 저장에 실패했습니다", "error");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/events/${selectedEvent.id}`);
      showToast("일정이 삭제되었습니다");
      setShowModal(false);
      fetchEvents();
    } catch {
      showToast("일정 삭제에 실패했습니다", "error");
    }
  };

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px 32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%", minHeight: 650 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarIcon size={22} style={{ color: "#0ea5e9" }} />
            사내 일정 캘린더
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>포털 사용자 개인의 업무 일정을 추가하고 관리합니다.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* 구글 캘린더 연동 버튼 */}
          {googleConnected ? (
            <>
              <button onClick={handleBulkSync} disabled={bulkSyncing} style={{
                padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "#1a73e8",
                background: "#e8f0fe", border: "1px solid #c5d8f7", borderRadius: 7, cursor: bulkSyncing ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6, opacity: bulkSyncing ? 0.6 : 1,
              }}>
                <img src="https://www.google.com/favicon.ico" alt="G" width={14} height={14} style={{ borderRadius: 2 }} />
                {bulkSyncing ? "동기화 중..." : "전체 동기화"}
              </button>
              <button onClick={handleGoogleDisconnect} style={{
                padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "#374151",
                background: "#f9fafb", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <img src="https://www.google.com/favicon.ico" alt="G" width={14} height={14} style={{ borderRadius: 2 }} />
                구글 연결됨
                <span style={{ fontSize: 11, color: "#9ca3af" }}>해제</span>
              </button>
            </>
          ) : (
            <button onClick={handleShowIcal} style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "#1a73e8",
              background: "#e8f0fe", border: "1px solid #c5d8f7", borderRadius: 7, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <img src="https://www.google.com/favicon.ico" alt="G" width={14} height={14} style={{ borderRadius: 2 }} />
              구글 캘린더 연동
            </button>
          )}

          {/* 이전달/오늘/다음달 */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: "transparent", border: "none", display: "flex", padding: 6, borderRadius: 6, cursor: "pointer", color: "#475569" }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} style={{ background: "#fff", border: "none", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, cursor: "pointer", color: "#334155", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              오늘
            </button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: "transparent", border: "none", display: "flex", padding: 6, borderRadius: 6, cursor: "pointer", color: "#475569" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", minWidth: 90, textAlign: "center" }}>
            {year}년 {month + 1}월
          </span>

          <button onClick={() => handleOpenCreateModal(new Date())} style={{
            background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Plus size={16} />
            일정 등록
          </button>
        </div>
      </div>

      {/* 구글 연동 상태 안내 */}
      {googleConnected ? (
        <div style={{ marginBottom: 14, padding: "8px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 12, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
          ✓ 구글 캘린더가 연동되어 있습니다. 각 일정에서 구글 캘린더에 추가할 수 있습니다.
        </div>
      ) : (
        <div style={{ marginBottom: 14, padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#475569" }}>
          💡 위의 <strong>구글 캘린더 연동</strong> 버튼을 클릭하면 일정을 구글 캘린더에 추가할 수 있습니다.
        </div>
      )}

      {/* 달력 그리드 */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {weekdays.map((w, idx) => (
            <div key={w} style={{ padding: "10px 0", fontSize: 12, fontWeight: 600, textAlign: "center", color: idx === 0 ? "#ef4444" : idx === 6 ? "#3b82f6" : "#475569" }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(90px, 1fr)", flex: 1 }}>
          {loading ? (
            <div style={{ gridColumn: "span 7", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
              일정을 로딩하고 있습니다...
            </div>
          ) : (
            cells.map((cell, idx) => {
              const isToday = formatDateString(cell.date) === formatDateString(new Date());
              const dayEvents = getEventsForDay(cell.date);
              const dow = cell.date.getDay();
              return (
                <div key={idx} onClick={() => handleOpenCreateModal(cell.date)}
                  style={{ borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #f1f5f9", borderBottom: idx >= 35 ? "none" : "1px solid #f1f5f9", padding: "6px 8px", display: "flex", flexDirection: "column", background: cell.isCurrentMonth ? "#fff" : "#f8fafc", cursor: "pointer", transition: "background 0.1s", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.background = cell.isCurrentMonth ? "#f5f3ff" : "#f1f5f9"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = cell.isCurrentMonth ? "#fff" : "#f8fafc"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700, background: isToday ? "#0ea5e9" : "transparent", color: isToday ? "#fff" : (!cell.isCurrentMonth ? "#cbd5e1" : (dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : "#334155")) }}>
                      {cell.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && cell.isCurrentMonth && <span style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600 }}>{dayEvents.length}개</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "hidden", flex: 1 }}>
                    {dayEvents.slice(0, 3).map(event => (
                      <div key={event.id} onClick={e => handleOpenEditModal(event, e)}
                        style={{ fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: `${event.color}15`, color: event.color, borderLeft: `3px solid ${event.color}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                        title={event.title}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</span>
                        {(event.googleEventId || event.google_event_id) && <span style={{ flexShrink: 0, fontSize: 9, color: "#1a73e8", fontWeight: 700 }}>G</span>}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", paddingRight: 4 }}>+{dayEvents.length - 3} 더보기</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* iCal 모달 */}
      {showIcalModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, padding: "28px 28px 24px", boxShadow: "0 20px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="https://www.google.com/favicon.ico" alt="G" width={18} height={18} style={{ borderRadius: 3 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>구글 캘린더 연동</h3>
              </div>
              <button onClick={() => setShowIcalModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: "#475569", marginBottom: 14 }}>아래 URL을 복사하여 구글 캘린더에 추가하세요.</p>

            {icalError ? (
              <div style={{ marginBottom: 20, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                ⚠ {icalError}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input
                  readOnly
                  value={icalLoading ? "주소 생성 중..." : icalUrl}
                  style={{ flex: 1, padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#334155", background: "#f8fafc", fontFamily: "monospace" }}
                />
                <button
                  onClick={handleCopyIcal}
                  disabled={icalLoading || !icalUrl}
                  style={{ padding: "9px 16px", background: icalCopied ? "#16a34a" : "#1a73e8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", minWidth: 64 }}
                >
                  {icalCopied ? "복사됨 ✓" : "복사"}
                </button>
              </div>
            )}

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>구글 캘린더 추가 방법</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#1a73e8", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                <img src="https://www.google.com/favicon.ico" alt="G" width={12} height={12} style={{ borderRadius: 2 }} /> Google 캘린더
              </p>
              <ol style={{ margin: "0 0 14px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "위 URL을 복사합니다.",
                  "PC에서 Google 캘린더에 로그인합니다.",
                  "화면 왼쪽 메뉴 하단의 '다른 캘린더' 옆에 있는 +(추가) 버튼을 클릭합니다.",
                  "메뉴 중 'URL로 추가'를 선택하고, 복사한 주소를 붙여넣은 뒤 '캘린더 추가'를 누릅니다.",
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", margin: "0 0 6px" }}>
                🍎 iPhone (iOS)
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "위 URL을 복사합니다.",
                  "iOS 설정 > 앱 > 캘린더 > 캘린더 계정 > 계정 추가 > 기타를 선택합니다.",
                  "'구독할 캘린더 추가'를 선택한 후 복사한 URL을 붙여넣고 다음을 누릅니다.",
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{step}</li>
                ))}
              </ol>
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowIcalModal(false)} style={{ padding: "9px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 모달 */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <form onSubmit={handleSaveEvent} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {selectedEvent?.isCourtDate ? "법정 일정 상세" : (isEditing ? "일정 수정 / 상세" : "새 일정 등록")}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>일정 제목</label>
              <input type="text" placeholder="제목을 입력해 주세요" value={formTitle} onChange={e => setFormTitle(e.target.value)} style={fieldStyle} disabled={selectedEvent?.isCourtDate} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>시작 시간</label>
                <input type={formIsAllDay ? "date" : "datetime-local"} value={formStartsAt} onChange={e => setFormStartsAt(e.target.value)} style={fieldStyle} disabled={selectedEvent?.isCourtDate} required />
              </div>
              <div>
                <label style={labelStyle}>종료 시간</label>
                <input type={formIsAllDay ? "date" : "datetime-local"} value={formEndsAt} onChange={e => setFormEndsAt(e.target.value)} style={fieldStyle} disabled={selectedEvent?.isCourtDate} required />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: selectedEvent?.isCourtDate ? "default" : "pointer" }}>
                <input type="checkbox" checked={formIsAllDay} disabled={selectedEvent?.isCourtDate}
                  onChange={e => {
                    setFormIsAllDay(e.target.checked);
                    if (e.target.checked) {
                      setFormStartsAt(prev => prev.substring(0, 10));
                      setFormEndsAt(prev => prev.substring(0, 10));
                    } else {
                      setFormStartsAt(prev => `${prev.substring(0, 10)}T09:00`);
                      setFormEndsAt(prev => `${prev.substring(0, 10)}T18:00`);
                    }
                  }} />
                하루 종일 (시간 미지정)
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>일정 색상</label>
              <div style={{ display: "flex", gap: 8 }}>
                {colorPalette.map(c => (
                  <button key={c.value} type="button" onClick={() => !selectedEvent?.isCourtDate && setFormColor(c.value)}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: c.value, border: formColor === c.value ? "2px solid #0f172a" : "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", cursor: selectedEvent?.isCourtDate ? "default" : "pointer" }}
                    title={c.label} disabled={selectedEvent?.isCourtDate} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>상세 설명</label>
              <textarea placeholder="일정 상세 내용을 적어주세요 (장소, 준비물 등)" value={formDescription} onChange={e => setFormDescription(e.target.value)} style={{ ...fieldStyle, height: 80, resize: "vertical" }} disabled={selectedEvent?.isCourtDate} />
            </div>

            {/* 구글 캘린더 섹션 */}
            {!selectedEvent?.isCourtDate && (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <img src="https://www.google.com/favicon.ico" alt="G" width={12} height={12} />
                  구글 캘린더
                  {(selectedEvent?.googleEventId || selectedEvent?.google_event_id) && (
                    <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", borderRadius: 4, padding: "1px 6px" }}>동기화됨</span>
                  )}
                </div>
                {googleConnected ? (
                  isEditing && selectedEvent ? (
                    <button type="button" onClick={() => handleSyncEvent(selectedEvent)} disabled={syncingEventId === selectedEvent.id}
                      style={{ padding: "7px 14px", fontSize: 13, fontWeight: 500, color: "#1a73e8", background: "#e8f0fe", border: "1px solid #c5d8f7", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: syncingEventId === selectedEvent.id ? 0.6 : 1 }}>
                      <img src="https://www.google.com/favicon.ico" alt="G" width={14} height={14} />
                      {syncingEventId === selectedEvent.id ? "추가 중..." : (selectedEvent?.googleEventId || selectedEvent?.google_event_id) ? "구글 캘린더 다시 동기화" : "구글 캘린더에 추가"}
                    </button>
                  ) : (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                      <input type="checkbox" checked={formAutoSync} onChange={e => setFormAutoSync(e.target.checked)} />
                      저장 후 구글 캘린더에 추가
                    </label>
                  )
                ) : (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    구글 캘린더와 연동하면 이 일정을 구글 캘린더에 추가할 수 있습니다.
                    <button type="button" onClick={handleGoogleConnect} style={{ marginLeft: 8, color: "#1a73e8", background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 }}>연동하기 →</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: (isEditing && !selectedEvent?.isCourtDate) ? "space-between" : "flex-end", gap: 8 }}>
              {isEditing && !selectedEvent?.isCourtDate && (
                <button type="button" onClick={handleDeleteEvent} style={{ background: "#fff", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Trash2 size={14} />
                  삭제
                </button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {selectedEvent?.isCourtDate ? "닫기" : "취소"}
                </button>
                {!selectedEvent?.isCourtDate && (
                  <button type="submit" style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
