/** 관리자 예약 관리 — 예약 현황 조회, 예약 설정, 슬롯 생성, 히어로, 진행절차, FAQ 설정 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { PageHeader, COLORS, fieldStyle, outlineBtnStyle, FormField, btnStyle } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";
import useSiteSettings from "../site-manager/useSiteSettings";
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
  const [activeSubTab, setActiveSubTab] = useState("apply");
  const [tab, setTab] = useState("consultations");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);

  /* 사이트 설정 훅 */
  const localSettings = useSiteSettings();
  const s = localSettings.settings;
  const update = localSettings.update;
  const updateItem = localSettings.updateItem;
  const addItem = localSettings.addItem;
  const removeItem = localSettings.removeItem;

  const [savingSettings, setSavingSettings] = useState(false);
  const saveConsultationSettings = async (section, content) => {
    setSavingSettings(true);
    try {
      await api.post("/site-settings/bulk", {
        settings: [{ page: "consultations", section, content }]
      });
      alert("설정이 저장되었습니다.");
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  /* 예약 설정 상태 */
  const [bookingSettings, setBookingSettings] = useState(EMPTY_SETTINGS);
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
    if (activeSubTab !== "apply" || tab !== "list") return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadBookings();
    });
    return () => { cancelled = true; };
  }, [activeSubTab, tab]);

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
    if (!bookingSettings.lawyerId) return showToast("변호사를 선택해주세요");
    setGenMsg("");
    try {
      const res = await api.post("/bookings/generate-slots", {
        lawyerId: bookingSettings.lawyerId,
        startDate: genStartDate,
        endDate: genEndDate,
        days: bookingSettings.days,
        startTime: bookingSettings.startTime,
        endTime: bookingSettings.endTime,
        slotDuration: bookingSettings.slotDuration,
      });
      setGenMsg(`${res.data?.count ?? 0}개의 슬롯이 생성되었습니다`);
    } catch (err) {
      showToast("슬롯 생성 실패: " + err.message);
    }
  };

  /** 요일 토글 */
  const toggleDay = (dayIdx) => {
    setBookingSettings((prev) => ({
      ...prev,
      days: prev.days.includes(dayIdx)
        ? prev.days.filter((d) => d !== dayIdx)
        : [...prev.days, dayIdx].sort(),
    }));
  };

  /** 설정 필드 업데이트 헬퍼 */
  const updateSetting = (key, value) => setBookingSettings((prev) => ({ ...prev, [key]: value }));

  /* 변호사 옵션 (select용) */
  const lawyerOptions = [
    { value: "", label: "선택해주세요" },
    ...lawyers.map((l) => ({ value: l.id, label: `${l.name} (${l.position})` })),
  ];

  const SUB_TABS = [
    { key: "hero", label: "히어로" },
    { key: "apply", label: "상담 신청" },
    { key: "steps", label: "진행 절차" },
    { key: "faq", label: "FAQ" }
  ];

  return (
    <div>
      <PageHeader title="상담문의 관리" />

      {/* 서브 탭 바 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${COLORS.borderLight}`, marginBottom: 20 }}>
        {SUB_TABS.map((t) => {
          const isActive = activeSubTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveSubTab(t.key)}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? COLORS.accent : COLORS.textSecondary,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── 1. 히어로 탭 ── */}
      {activeSubTab === "hero" && (
        <div style={{ background: "#fff", padding: 24, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>히어로 섹션 편집</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormField
              label="제목 (Heading)"
              value={s["consultations/hero"]?.heading || ""}
              onChange={(v) => update("consultations/hero", "heading", v)}
              placeholder="상담안내"
            />
            <FormField
              label="부제목 (Subheading)"
              value={s["consultations/hero"]?.subheading || ""}
              onChange={(v) => update("consultations/hero", "subheading", v)}
              placeholder="CONSULTATION"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => saveConsultationSettings("hero", s["consultations/hero"])}
                disabled={savingSettings}
                style={{ ...btnStyle(COLORS.accent), padding: "8px 16px", fontSize: 13 }}
              >
                {savingSettings ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. 상담 신청 (예약 관리 및 현황) 탭 ── */}
      {activeSubTab === "apply" && (
        <div>
          {/* 중첩 탭 */}
          <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
            <button onClick={() => setTab("consultations")} style={tabBtnStyle(tab === "consultations")}>신청 목록</button>
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
              settings={bookingSettings}
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
      )}

      {/* ── 3. 진행 절차 탭 ── */}
      {activeSubTab === "steps" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 진행 절차 (Steps) */}
          <div style={{ background: "#fff", padding: 24, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>진행 절차 안내 편집</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {(s["consultations/steps"]?.items || []).map((stepItem, idx) => (
                <div key={idx} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bgForm }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, margin: 0 }}>Step {stepItem.step || `0${idx+1}`}</h4>
                    <button
                      type="button"
                      onClick={() => removeItem("consultations/steps", idx)}
                      style={{ ...outlineBtnStyle(COLORS.danger), fontSize: 11, padding: "2px 8px" }}
                    >
                      삭제
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                    <FormField label="단계 번호" value={stepItem.step} onChange={(v) => updateItem("consultations/steps", idx, "step", v)} style={{ width: 100 }} />
                    <FormField label="제목" value={stepItem.title} onChange={(v) => updateItem("consultations/steps", idx, "title", v)} style={{ flex: 1 }} />
                  </div>
                  <FormField label="설명" type="textarea" value={stepItem.desc} onChange={(v) => updateItem("consultations/steps", idx, "desc", v)} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => addItem("consultations/steps", { step: `0${(s["consultations/steps"]?.items?.length || 0) + 1}`, title: "", desc: "" })}
                  style={outlineBtnStyle()}
                >
                  + 단계 추가
                </button>
                <button
                  onClick={() => saveConsultationSettings("steps", s["consultations/steps"])}
                  disabled={savingSettings}
                  style={{ ...btnStyle(COLORS.accent), padding: "8px 16px", fontSize: 13 }}
                >
                  {savingSettings ? "저장 중..." : "진행 절차 저장"}
                </button>
              </div>
            </div>
          </div>

          {/* 연락처 및 업무시간 (Contact) */}
          <div style={{ background: "#fff", padding: 24, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>연락처 및 상담 가능 시간 편집</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField
                label="전화번호"
                value={s["consultations/contact"]?.phone || ""}
                onChange={(v) => update("consultations/contact", "phone", v)}
                placeholder="준비 중 또는 02-6925-6757"
              />
              <FormField
                label="이메일"
                value={s["consultations/contact"]?.email || ""}
                onChange={(v) => update("consultations/contact", "email", v)}
                placeholder="준비 중 또는 contact@highlaw.co.kr"
              />
              <FormField
                label="상담 가능 시간"
                value={s["consultations/contact"]?.hours || ""}
                onChange={(v) => update("consultations/contact", "hours", v)}
                placeholder="평일 09:00 - 18:00 (예약 상담 우선)"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={() => saveConsultationSettings("contact", s["consultations/contact"])}
                  disabled={savingSettings}
                  style={{ ...btnStyle(COLORS.accent), padding: "8px 16px", fontSize: 13 }}
                >
                  {savingSettings ? "저장 중..." : "연락처 정보 저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. FAQ 탭 ── */}
      {activeSubTab === "faq" && (
        <div style={{ background: "#fff", padding: 24, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>상담 FAQ 편집</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(s["consultations/faq"]?.items || []).map((faqItem, idx) => (
              <div key={idx} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bgForm }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, margin: 0 }}>질문 {idx + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeItem("consultations/faq", idx)}
                    style={{ ...outlineBtnStyle(COLORS.danger), fontSize: 11, padding: "2px 8px" }}
                  >
                    삭제
                  </button>
                </div>
                <FormField label="질문 (Q)" value={faqItem.q} onChange={(v) => updateItem("consultations/faq", idx, "q", v)} style={{ marginBottom: 12 }} />
                <FormField label="답변 (A)" type="textarea" value={faqItem.a} onChange={(v) => updateItem("consultations/faq", idx, "a", v)} />
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <button
                type="button"
                onClick={() => addItem("consultations/faq", { q: "", a: "" })}
                style={outlineBtnStyle()}
              >
                + FAQ 추가
              </button>
              <button
                onClick={() => saveConsultationSettings("faq", s["consultations/faq"])}
                disabled={savingSettings}
                style={{ ...btnStyle(COLORS.accent), padding: "8px 16px", fontSize: 13 }}
              >
                {savingSettings ? "저장 중..." : "FAQ 저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
