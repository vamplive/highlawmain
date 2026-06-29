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
  const [formLocation, setFormLocation] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMembers, setShareMembers] = useState([]);
  const [selectedShareIds, setSelectedShareIds] = useState([]);
  const [sharePhone, setSharePhone] = useState("");
  const [sharePhoneName, setSharePhoneName] = useState("");
  const [shareTab, setShareTab] = useState("internal");
  const [sharingSending, setShareSending] = useState(false);
  const [sharePendingEvent, setSharePendingEvent] = useState(null);

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
      setIcalUrl(res.data?.icalUrl || "");
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
    setFormLocation("");
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
    setFormLocation(event.location || "");
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
      location: formLocation || null,
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

  const handleOpenShare = async (event) => {
    setSharePendingEvent(event || null);
    setSelectedShareIds([]);
    setSharePhone("");
    setSharePhoneName("");
    setShareTab("internal");
    setShowShareModal(true);
    if (shareMembers.length === 0) {
      try {
        const res = await portalApi.get("/members");
        setShareMembers((res.data || []).filter(m => m.userId !== res.myId));
      } catch { showToast("구성원 목록을 불러오지 못했습니다", "error"); }
    }
  };

  const handleShareInternal = async () => {
    if (!selectedShareIds.length) return showToast("공유할 구성원을 선택해주세요");
    if (!sharePendingEvent?.id) return showToast("일정을 먼저 저장해주세요");
    setShareSending(true);
    try {
      const res = await portalApi.post(`/events/${sharePendingEvent.id}/share`, { userIds: selectedShareIds });
      showToast(`${res.data?.shared ?? 0}명에게 일정이 공유되었습니다`);
      setShowShareModal(false);
    } catch (e) { showToast(e.message || "공유에 실패했습니다", "error"); }
    finally { setShareSending(false); }
  };

  const handleShareSms = async () => {
    if (!sharePhone.trim()) return showToast("전화번호를 입력해주세요");
    if (!sharePendingEvent) return showToast("일정 정보가 없습니다");
    const ev = sharePendingEvent;
    const dt = ev.isAllDay ? ev.startsAt?.substring(0,10) :
      new Date(ev.startsAt).toLocaleString("ko-KR", { year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit" });
    const msg = `[하이로법률사무소] 일정 안내\n제목: ${ev.title}\n일시: ${dt}${ev.location ? "\n장소: "+ev.location : ""}${ev.description ? "\n"+ev.description : ""}`;
    setShareSending(true);
    try {
      await portalApi.post("/sms/send", {
        recipients: [{ name: sharePhoneName || "수신자", contact: sharePhone.trim() }],
        content: msg,
      });
      showToast("문자가 발송되었습니다");
      setSharePhone(""); setSharePhoneName("");
    } catch (e) { showToast(e.message || "발송 실패", "error"); }
    finally { setShareSending(false); }
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

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES = ["00","05","10","15","20","25","30","35","40","45","50","55"];
  const selTime = { border: "none", outline: "none", fontSize: 13, color: "#334155", background: "#f1f5f9", borderRadius: 7, padding: "5px 7px", cursor: "pointer", fontFamily: "inherit", appearance: "auto" };
  const roundMin = (raw) => { const n = parseInt(raw || "0", 10); return String(Math.min(55, Math.round(n / 5) * 5)).padStart(2, "0"); };

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


      {/* 일정 드로어 */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "stretch" }}
          onClick={() => setShowModal(false)}>
          <div style={{ flex: 1, background: "rgba(15,23,42,0.25)", backdropFilter: "blur(2px)" }} />
          <form onSubmit={handleSaveEvent} onClick={e => e.stopPropagation()}
            style={{ width: 480, maxWidth: "100vw", display: "flex", flexDirection: "column", background: "#fff", boxShadow: "-8px 0 40px rgba(15,23,42,0.14)" }}>

            {/* 드로어 헤더 */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {selectedEvent?.isCourtDate ? "법정 일정 상세" : (isEditing ? "일정 수정" : "새 일정 등록")}
              </span>
              <button type="button" onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4, borderRadius: 6 }}>
                <X size={18} />
              </button>
            </div>

            {/* 제목 */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
              <input type="text" placeholder="제목을 입력하세요"
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                disabled={selectedEvent?.isCourtDate} required
                style={{ width: "100%", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "#0f172a", background: "transparent", boxSizing: "border-box", caretColor: "#0ea5e9" }} />
            </div>

            {/* 폼 본문 */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* 날짜/시간 행 */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 6 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* 시작 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 26, flexShrink: 0 }}>시작</span>
                    <input type="date"
                      value={formStartsAt.substring(0, 10)}
                      onChange={e => setFormStartsAt(
                        formIsAllDay ? e.target.value : `${e.target.value}T${formStartsAt.includes("T") ? formStartsAt.substring(11, 16) : "09:00"}`
                      )}
                      disabled={selectedEvent?.isCourtDate} required
                      style={{ border: "none", outline: "none", fontSize: 13, color: "#334155", background: "#f1f5f9", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }} />
                    {!formIsAllDay && (
                      <>
                        <select
                          value={formStartsAt.includes("T") ? formStartsAt.substring(11, 13) : "09"}
                          onChange={e => setFormStartsAt(`${formStartsAt.substring(0, 10)}T${e.target.value}:${formStartsAt.includes("T") ? formStartsAt.substring(14, 16) : "00"}`)}
                          disabled={selectedEvent?.isCourtDate}
                          style={selTime}>
                          {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                        </select>
                        <select
                          value={roundMin(formStartsAt.includes("T") ? formStartsAt.substring(14, 16) : "00")}
                          onChange={e => setFormStartsAt(`${formStartsAt.substring(0, 10)}T${formStartsAt.includes("T") ? formStartsAt.substring(11, 13) : "09"}:${e.target.value}`)}
                          disabled={selectedEvent?.isCourtDate}
                          style={selTime}>
                          {MINUTES.map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </>
                    )}
                  </div>
                  {/* 종료 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 26, flexShrink: 0 }}>종료</span>
                    <input type="date"
                      value={(formEndsAt || formStartsAt).substring(0, 10)}
                      onChange={e => setFormEndsAt(
                        formIsAllDay ? e.target.value : `${e.target.value}T${formEndsAt.includes("T") ? formEndsAt.substring(11, 16) : "18:00"}`
                      )}
                      disabled={selectedEvent?.isCourtDate}
                      style={{ border: "none", outline: "none", fontSize: 13, color: "#334155", background: "#f1f5f9", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }} />
                    {!formIsAllDay && (
                      <>
                        <select
                          value={(formEndsAt || formStartsAt).includes("T") ? (formEndsAt || formStartsAt).substring(11, 13) : "18"}
                          onChange={e => setFormEndsAt(`${formEndsAt.substring(0, 10)}T${e.target.value}:${formEndsAt.includes("T") ? formEndsAt.substring(14, 16) : "00"}`)}
                          disabled={selectedEvent?.isCourtDate}
                          style={selTime}>
                          {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                        </select>
                        <select
                          value={roundMin(formEndsAt.includes("T") ? formEndsAt.substring(14, 16) : "00")}
                          onChange={e => setFormEndsAt(`${formEndsAt.substring(0, 10)}T${formEndsAt.includes("T") ? formEndsAt.substring(11, 13) : "18"}:${e.target.value}`)}
                          disabled={selectedEvent?.isCourtDate}
                          style={selTime}>
                          {MINUTES.map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </>
                    )}
                  </div>
                  {/* 하루 종일 */}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 2, fontSize: 12, color: "#64748b", cursor: selectedEvent?.isCourtDate ? "default" : "pointer" }}>
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
                    하루 종일
                  </label>
                </div>
              </div>

              {/* 색상 행 */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 17, height: 17, borderRadius: "50%", background: formColor, flexShrink: 0, border: "2px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {colorPalette.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => !selectedEvent?.isCourtDate && setFormColor(c.value)}
                      disabled={selectedEvent?.isCourtDate}
                      title={c.label}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: c.value, border: `2px solid ${formColor === c.value ? "#0f172a" : "transparent"}`, cursor: selectedEvent?.isCourtDate ? "default" : "pointer", transition: "border-color 0.15s", flexShrink: 0 }} />
                  ))}
                </div>
              </div>

              {/* 장소/회의실 행 */}
              {!selectedEvent?.isCourtDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <input type="text" placeholder="회의실 또는 장소" value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#334155", background: "transparent", fontFamily: "inherit" }} />
                </div>
              )}

              {/* 메모/설명 행 */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <textarea placeholder="메모를 입력하세요" value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  disabled={selectedEvent?.isCourtDate}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#334155", background: "transparent", resize: "none", minHeight: 72, lineHeight: 1.7, fontFamily: "inherit" }} />
              </div>

              {/* 일정 공유 행 */}
              {!selectedEvent?.isCourtDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <button type="button"
                    onClick={() => handleOpenShare(selectedEvent || { title: formTitle, startsAt: formStartsAt, endsAt: formEndsAt, isAllDay: formIsAllDay, location: formLocation, description: formDescription, id: null })}
                    style={{ fontSize: 13, color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "none" }}>
                    일정 공유
                  </button>
                </div>
              )}

              {/* 구글 캘린더 행 */}
              {!selectedEvent?.isCourtDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px" }}>
                  <img src="https://www.google.com/favicon.ico" alt="G" width={16} height={16} style={{ flexShrink: 0, borderRadius: 2 }} />
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    {googleConnected ? (
                      isEditing && selectedEvent ? (
                        <button type="button" onClick={() => handleSyncEvent(selectedEvent)}
                          disabled={syncingEventId === selectedEvent.id}
                          style={{ fontSize: 13, color: "#1a73e8", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: syncingEventId === selectedEvent.id ? 0.6 : 1 }}>
                          {syncingEventId === selectedEvent.id ? "추가 중..." : (selectedEvent?.googleEventId || selectedEvent?.google_event_id) ? "다시 동기화" : "구글 캘린더에 추가"}
                        </button>
                      ) : (
                        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                          <input type="checkbox" checked={formAutoSync} onChange={e => setFormAutoSync(e.target.checked)} />
                          저장 후 구글 캘린더에 추가
                        </label>
                      )
                    ) : (
                      <>
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>구글 캘린더 미연동</span>
                        <button type="button" onClick={handleShowIcal}
                          style={{ fontSize: 12, color: "#1a73e8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          연동하기 →
                        </button>
                      </>
                    )}
                    {(selectedEvent?.googleEventId || selectedEvent?.google_event_id) && (
                      <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", borderRadius: 4, padding: "1px 6px", marginLeft: "auto" }}>동기화됨</span>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* 드로어 푸터 */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: (isEditing && !selectedEvent?.isCourtDate) ? "space-between" : "flex-end", alignItems: "center", gap: 8, flexShrink: 0, background: "#fafbfc" }}>
              {isEditing && !selectedEvent?.isCourtDate && (
                <button type="button" onClick={handleDeleteEvent}
                  style={{ background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Trash2 size={14} /> 삭제
                </button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {selectedEvent?.isCourtDate ? "닫기" : "취소"}
                </button>
                {!selectedEvent?.isCourtDate && (
                  <button type="submit"
                    style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {isEditing ? "수정 완료" : "저장"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 일정 공유 모달 */}
      {showShareModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.45)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460, padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.18)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>📤 일정 공유</h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20 }}>✕</button>
            </div>
            {sharePendingEvent && (
              <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 14, fontSize: 12, color: "#334155", border: "1px solid #e2e8f0" }}>
                <strong>{sharePendingEvent.title || "(제목 없음)"}</strong>
                {sharePendingEvent.startsAt && <span style={{ marginLeft: 8, color: "#64748b" }}>{sharePendingEvent.startsAt?.substring(0,16).replace("T"," ")}</span>}
              </div>
            )}
            <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              {[["internal","👥 내부 구성원 공유"],["sms","📱 문자로 공유"]].map(([key,label]) => (
                <button key={key} type="button" onClick={() => setShareTab(key)}
                  style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: shareTab===key?700:400, background: shareTab===key?"#0ea5e9":"#fff", color: shareTab===key?"#fff":"#475569", border: "none", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {shareTab === "internal" ? (
                <div>
                  {!sharePendingEvent?.id && (
                    <div style={{ marginBottom: 10, padding: "8px 12px", background: "#fff7ed", borderRadius: 8, fontSize: 12, color: "#c2410c", border: "1px solid #fed7aa" }}>
                      ⚠ 일정을 먼저 저장한 후 공유할 수 있습니다.
                    </div>
                  )}
                  {shareMembers.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>구성원을 불러오는 중...</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {shareMembers.map(m => (
                        <label key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: selectedShareIds.includes(m.userId) ? "#eff6ff" : "#fff" }}>
                          <input type="checkbox" checked={selectedShareIds.includes(m.userId)} onChange={e => setSelectedShareIds(prev => e.target.checked ? [...prev,m.userId] : prev.filter(id=>id!==m.userId))} />
                          <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{m.name || m.email}</span>
                          {m.position && <span style={{ fontSize: 11, color: "#94a3b8" }}>{m.position}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                  <button onClick={handleShareInternal} disabled={sharingSending || !selectedShareIds.length || !sharePendingEvent?.id}
                    style={{ marginTop: 14, width: "100%", padding: "10px 0", background: (!selectedShareIds.length || !sharePendingEvent?.id) ? "#cbd5e1" : "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    {sharingSending ? "공유 중..." : `${selectedShareIds.length}명에게 일정 공유`}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={labelStyle}>이름 (선택)</label>
                    <input type="text" placeholder="수신자 이름" value={sharePhoneName} onChange={e => setSharePhoneName(e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>전화번호</label>
                    <input type="tel" placeholder="010-0000-0000" value={sharePhone} onChange={e => setSharePhone(e.target.value)} style={fieldStyle} />
                  </div>
                  {sharePendingEvent && (
                    <div style={{ marginBottom: 14, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>
                      <strong style={{ display: "block", marginBottom: 4, color: "#334155" }}>발송될 문자 미리보기</strong>
                      {`[하이로법률사무소] 일정 안내\n제목: ${sharePendingEvent.title || ""}\n일시: ${sharePendingEvent.isAllDay ? (sharePendingEvent.startsAt||"").substring(0,10) : (sharePendingEvent.startsAt||"").substring(0,16).replace("T"," ")}${sharePendingEvent.location ? "\n장소: "+sharePendingEvent.location : ""}${sharePendingEvent.description ? "\n"+sharePendingEvent.description.substring(0,50) : ""}`}
                    </div>
                  )}
                  <button onClick={handleShareSms} disabled={sharingSending || !sharePhone.trim()}
                    style={{ width: "100%", padding: "10px 0", background: !sharePhone.trim() ? "#cbd5e1" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    {sharingSending ? "발송 중..." : "문자 발송"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
