/** 온라인 상담 신청 폼 — 필드, 유효성 검증, 개인정보 동의, 제출 처리 */
import { useState } from "react";
import { api } from "../../utils/api";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { CONSULTATION_CATEGORIES, INITIAL_FORM } from "./consultationConstants";
import { KAKAO_CHANNEL_ADD } from "../../utils/kakaoChannel";
import { PRIVACY_POLICY_VERSION, PRIVACY_POLICY_TEXT } from "../../utils/privacy-policy";
import PrivacyModal from "./PrivacyModal";
import BookingSchedulePicker from "./BookingSchedulePicker";

export default function ConsultationForm({ invitationToken: _invitationToken, initialValues }) {
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...(initialValues || {}) }));
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [signaturePayload, setSignaturePayload] = useState(null);

  /** 폼 필드 업데이트 핸들러 */
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  /** 상담 신청 제출 */
  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitResult(null);

    if (!form.phone?.trim() && !form.email?.trim()) {
      setSubmitResult({ type: "error", msg: "연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요." });
      return;
    }
    if (!form.agreed) {
      setSubmitResult({ type: "error", msg: "개인정보 수집 및 이용에 동의해주세요." });
      return;
    }
    if (!signaturePayload?.imageData) {
      setSubmitResult({ type: "error", msg: "개인정보 동의 서명이 확인되지 않았습니다. 동의서를 다시 확인해주세요." });
      return;
    }
    if (form.scheduleMode === "slot" && !form.bookingSlotId) {
      setSubmitResult({ type: "error", msg: "예약 가능 시간을 선택하시거나 '일정 협의 요청'으로 전환해 주세요." });
      return;
    }
    if (form.scheduleMode === "request" && !form.preferredSlots?.[0]?.date) {
      setSubmitResult({ type: "error", msg: "희망 일정을 최소 1개 이상 입력해주세요." });
      return;
    }

    setSubmitting(true);
    let createdConsentId = null;
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        category: form.category,
        message: form.message,
        agreed: form.agreed,
        meetingType: form.meetingType,
        scheduleMode: form.scheduleMode,
      };
      if (form.scheduleMode === "slot") {
        payload.bookingSlotId = form.bookingSlotId;
      } else {
        payload.preferredSlots = form.preferredSlots.filter((s) => s.date);
      }
      const consent = await api.post("/privacy-consents", {
        policyVersion: PRIVACY_POLICY_VERSION,
        policyText: PRIVACY_POLICY_TEXT,
        name: form.name,
        phone: form.phone,
        signature: signaturePayload,
      });
      createdConsentId = consent.data?.consentId;
      payload.consentId = createdConsentId;
      await api.post("/consultations", payload);
      setSubmitResult({ type: "success", msg: "상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다." });
      setForm(INITIAL_FORM);
      setSignaturePayload(null);
    } catch (err) {
      if (createdConsentId) {
        api.delete(`/privacy-consents/${createdConsentId}`).catch(() => {});
      }
      setSubmitResult({ type: "error", msg: err.message || "신청 중 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * 개인정보 동의 완료 콜백
   * @param {object} payload - { imageData, strokes, pointerType, widthPx, heightPx }
   */
  function handlePrivacyAgreed(payload) {
    if (!payload?.imageData) {
      alert("서명이 완료되지 않았습니다. 다시 시도해주세요.");
      return;
    }
    setSignaturePayload(payload);
    setForm((prev) => ({ ...prev, agreed: true }));
    setPrivacyOpen(false);
  }

  return (
    <section className="section" style={{ background: "#f7f8fa", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container" style={{ maxWidth: 880 }}>
        {/* 섹션 제목 */}
        <div className="text-center reveal" style={{ marginBottom: 48 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
            CONTACT FORM
          </p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 12 }}>
            온라인 상담 신청
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 300 }}>
            아래 양식을 작성해 주시면 빠른 시일 내에 연락드리겠습니다
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="reveal" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 이름 + 연락처 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="consult-name" label="이름" required>
              <Input id="consult-name" name="name" value={form.name} onChange={handleFormChange} placeholder="홍길동" required style={{ background: "#fff" }} />
            </FormField>
            <FormField id="consult-phone" label="연락처">
              <Input id="consult-phone" name="phone" type="tel" value={form.phone} onChange={handleFormChange} placeholder="010-1234-5678" style={{ background: "#fff" }} />
            </FormField>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "-8px 0 8px", fontStyle: "italic" }}>
            * 전화번호 또는 이메일 중 최소 하나를 입력해주세요.
          </p>

          {/* 이메일 + 상담 분야 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="consult-email" label="이메일">
              <Input id="consult-email" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="example@email.com" style={{ background: "#fff" }} />
            </FormField>
            <FormField id="consult-category" label="상담 분야" required>
              <Select id="consult-category" name="category" value={form.category} onChange={handleFormChange} style={{ background: "#fff" }}>
                {CONSULTATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* 상담 방식 + 일정 선택 — 대면/전화/화상 × 슬롯/협의 요청 */}
          <BookingSchedulePicker value={form} onChange={setForm} />

          {/* 상담 내용 */}
          <FormField id="consult-message" label="상담 내용" required>
            <Textarea
              id="consult-message" name="message" value={form.message} onChange={handleFormChange}
              placeholder="상담받고자 하는 내용을 간략히 작성해 주세요 (10자 이상)"
              rows={5} required style={{ background: "#fff" }}
            />
          </FormField>

          {/* 개인정보 동의 */}
          <PrivacyConsentBox
            agreed={form.agreed}
            onOpenModal={() => setPrivacyOpen(true)}
          />

          {/* 결과 메시지 */}
          {submitResult && <SubmitResultMessage result={submitResult} />}

          {/* 접수 완료 시 카카오톡 채널 추가 유도 — 이후 진행 상황을 카카오톡으로 안내받도록 */}
          {submitResult?.type === "success" && <KakaoFollowUpCTA />}

          {/* 제출 버튼 */}
          <div className="text-center" style={{ marginTop: 8 }}>
            <Button type="submit" size="lg" disabled={submitting} style={{ minWidth: 200, letterSpacing: "0.05em" }}>
              {submitting ? "접수 중..." : "상담 신청하기"}
            </Button>
          </div>
        </form>
      </div>

      {/* 개인정보 동의서 모달 */}
      {privacyOpen && (
        <PrivacyModal
          onClose={() => setPrivacyOpen(false)}
          onAgreed={handlePrivacyAgreed}
        />
      )}
    </section>
  );
}

/** 폼 필드 라벨 래퍼 */
function FormField({ id, label, required, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
        {label} {required && <span style={{ color: "var(--accent-gold)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/** 개인정보 동의 체크박스 + 동의서 확인 버튼 */
function PrivacyConsentBox({ agreed, onOpenModal }) {
  return (
    <div style={{ border: "1px solid var(--border-color)", padding: "16px 20px", background: "#f7f8fa" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            border: agreed ? "2px solid var(--accent-gold)" : "2px solid #ccc",
            background: agreed ? "var(--accent-gold)" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {agreed && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: agreed ? "var(--text-primary)" : "var(--gray-500)" }}>
            {agreed ? "개인정보 수집·이용에 동의하였습니다" : "개인정보 수집·이용 동의 (필수)"}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          style={{
            fontSize: 12, color: "var(--accent-gold)", background: "none",
            border: "1px solid var(--accent-gold)", padding: "6px 14px",
            minHeight: 44, minWidth: 88,
            cursor: "pointer", fontWeight: 500,
          }}
        >
          {agreed ? "다시 보기" : "동의서 확인"}
        </button>
      </div>
    </div>
  );
}

/** 접수 완료 후 카카오톡 채널 추가 안내 CTA — 의뢰인이 후속 알림을 받을 수 있도록 유도 */
function KakaoFollowUpCTA() {
  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: 8,
        background: "#FEE500",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 14, color: "#3C1E1E", fontWeight: 500, lineHeight: 1.6 }}>
        카카오톡 채널을 추가하시면<br />
        상담 진행 상황을 빠르게 안내받으실 수 있습니다.
      </p>
      <a
        href={KAKAO_CHANNEL_ADD}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          background: "#3C1E1E",
          color: "#FEE500",
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 6,
          textDecoration: "none",
          letterSpacing: "0.02em",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 4C8.477 4 4 7.582 4 12c0 2.87 1.89 5.39 4.726 6.836l-.96 3.56c-.08.296.256.536.512.368L12.4 20.2c.52.06 1.06.1 1.6.1 5.523 0 10-3.582 10-8s-4.477-8-10-8z" fill="#FEE500"/>
        </svg>
        카카오톡 채널 추가하기
      </a>
    </div>
  );
}

/** 제출 결과 메시지 (성공/에러) */
function SubmitResultMessage({ result }) {
  const isSuccess = result.type === "success";
  return (
    <div
      style={{
        padding: "14px 20px",
        fontSize: 14,
        borderRadius: 6,
        background: isSuccess ? "#f0fdf4" : "#fef2f2",
        color: isSuccess ? "#166534" : "#991b1b",
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      {result.msg}
    </div>
  );
}
