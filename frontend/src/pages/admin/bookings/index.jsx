/** 관리자 예약 관리 — 예약 현황 조회, 예약 설정, 슬롯 생성 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { PageHeader, COLORS, outlineBtnStyle, FormField, btnStyle } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";
import BookingList from "./BookingList";
import BookingSettingsForm from "./BookingSettingsForm";
import ConsultationsPanel from "./ConsultationsPanel";

const EMPTY_SETTINGS = {
  lawyerId: "",
  days: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 60,
};

/** 탭 버튼 스타일 */
const tabBtnStyle = (active) => ({
  padding: "10px 28px",
  fontSize: 14,
  fontWeight: active ? 600 : 400,
  color: active ? COLORS.accent : COLORS.textSecondary,
  background: "transparent",
  border: "none",
  borderBottom: `2px solid ${active ? COLORS.accent : "transparent"}`,
  cursor: "pointer",
});

export default function AdminBookings() {
  const [tab, setTab] = useState("consultations");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);

  /* 예약 설정 상태 */
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [genMsg, setGenMsg] = useState("");

  useEffect(() => {
    api.get("/lawyers").then((j) => setLawyers(j.data ?? [])).catch(() => {});
  }, []);

  /** 예약 현황 로드 */
  const loadBookings = () => {
    setLoading(true);
    api.get("/bookings?upcoming=true")
      .then((json) => setBookings(json.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab !== "list") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadBookings();
    });
    return () => { cancelled = true; };
  }, [tab]);

  /** 예약 취소 */
  const cancelBooking = async (id) => {
    if (!confirm("이 예약을 취소하시겠습니까?")) return;
    try {
      await api.patch(`/bookings/${id}`, { status: "cancelled" });
      loadBookings();
    } catch (err) {
      showToast("취소 실패: " + err.message);
    }
  };

  /** 슬롯 생성 */
  const generateSlots = async () => {
    if (!genStartDate || !genEndDate) return showToast("날짜 범위를 선택해주세요");
    if (!settings.lawyerId) return showToast("변호사를 선택해주세요");
    setGenMsg("");
    try {
      const res = await api.post("/bookings/generate-slots", {
        lawyerId: settings.lawyerId,
        startDate: genStartDate,
        endDate: genEndDate,
        days: settings.days,
        startTime: settings.startTime,
        endTime: settings.endTime,
        slotDuration: settings.slotDuration,
      });
      setGenMsg(`${res.data?.count ?? 0}개의 슬롯이 생성되었습니다`);
    } catch (err) {
      showToast("슬롯 생성 실패: " + err.message);
    }
  };

  /** 요일 토글 */
  const toggleDay = (dayIdx) => {
    setSettings((prev) => ({
      ...prev,
      days: prev.days.includes(dayIdx)
        ? prev.days.filter((d) => d !== dayIdx)
        : [...prev.days, dayIdx].sort(),
    }));
  };

  /** 설정 필드 업데이트 헬퍼 */
  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  /* 변호사 옵션 (select용) */
  const lawyerOptions = [
    { value: "", label: "선택해주세요" },
    ...lawyers.map((l) => ({ value: l.id, label: `${l.name} (${l.position})` })),
  ];

  return (
    <div>
      <PageHeader title="예약 관리" />

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        <button onClick={() => setTab("consultations")} style={tabBtnStyle(tab === "consultations")}>상담 신청</button>
        <button onClick={() => setTab("list")} style={tabBtnStyle(tab === "list")}>예약 현황</button>
        <button onClick={() => setTab("settings")} style={tabBtnStyle(tab === "settings")}>예약 설정</button>
      </div>

      {/* 상담 신청 탭 — 접수 상담 조회 + 확정 플로우 */}
      {tab === "consultations" && <ConsultationsPanel />}

      {/* 예약 현황 탭 */}
      {tab === "list" && (
        <BookingList bookings={bookings} loading={loading} onCancel={cancelBooking} />
      )}

      {/* 예약 설정 탭 */}
      {tab === "settings" && (
        <BookingSettingsForm
          settings={settings}
          lawyerOptions={lawyerOptions}
          onUpdateSetting={updateSetting}
          onToggleDay={toggleDay}
          genStartDate={genStartDate}
          setGenStartDate={setGenStartDate}
          genEndDate={genEndDate}
          setGenEndDate={setGenEndDate}
          genMsg={genMsg}
          onGenerate={generateSlots}
        />
      )}
    </div>
  );
}
