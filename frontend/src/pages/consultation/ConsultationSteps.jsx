/** 상담 절차 + 연락처 섹션 */
import { STEPS, CONTACT_INFO } from "./consultationConstants";
import { Phone, MessageCircle, AtSign, Clock, Send } from "lucide-react";
import { useLanguage, useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "../../components/layout/layoutConfig";
import { SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";
import { safeHttpUrl } from "../../utils/safeUrl";
import { TELEGRAM_CONTACT_URL } from "../../utils/telegramContact";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const CONSULTATIONS_DEFAULTS = {
  steps: {
    items: [
      { step: "01", title: "사건 분석 및 진단", desc: "초기 자료를 신속히 검토하고 핵심 쟁점과 위험요소를 명확히 정리합니다." },
      { step: "02", title: "전략 설계 및 실행", desc: "협상·소송·집행 단계별 목표를 설정하고 일정 중심으로 추진합니다." },
      { step: "03", title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
      { step: "04", title: "결과 관리 및 사후 대응", desc: "판결 이후 이행, 추가 분쟁 예방까지 의뢰인의 리스크를 관리합니다." },
    ]
  },
  contact: {
    phone: "준비 중",
    email: "준비 중",
    hours: "평일 09:00 - 18:00 (예약 상담 우선)"
  }
};

/** @param {{ compact?: boolean }} props compact=true 시 section/container 래퍼 생략 */
export default function ConsultationSteps({ compact = false }) {
  const { settings: consSettings } = useSiteSettingsPage("consultations", CONSULTATIONS_DEFAULTS);
  const steps = consSettings.steps?.items || CONSULTATIONS_DEFAULTS.steps.items;
  const contactConfig = consSettings.contact || CONSULTATIONS_DEFAULTS.contact;

  const content = (
    <>
      <SectionHeading
        eyebrow="PROCESS"
        title="명확한 전략, 빠른 실행, 책임 있는 결과"
        description="법무법인 하이로는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여 의뢰인에게 가장 실익이 큰 선택지를 제시합니다."
      />

      {/* 절차 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger" style={{ marginBottom: 80 }}>
        {steps.map((s, i) => (
          <SurfaceCard
            key={i}
            className="reveal text-center"
            style={{ padding: "32px 20px", background: "var(--bg-primary)" }}
          >
            <p className="font-en" style={{ fontSize: 32, fontWeight: 300, color: "var(--accent-gold)", marginBottom: 12 }}>
              {s.step}
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, fontWeight: 300 }}>{s.desc}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* 연락처 */}
      <ContactInfoSection contactConfig={contactConfig} />
    </>
  );

  if (compact) return <div style={{ maxWidth: 960, margin: "0 auto" }}>{content}</div>;

  return (
    <section className="section" style={{ background: "#fff" }}>
      <div className="container" style={{ maxWidth: 960 }}>{content}</div>
    </section>
  );
}

/** 연락처 카드 목록 */
function ContactInfoSection({ contactConfig }) {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;
  const telegramUrl = safeHttpUrl(contact.telegramUrl, TELEGRAM_CONTACT_URL);
  const showTelegram = (contact.telegramEnabled !== false || !contact.telegramUrl) && !!telegramUrl;

  const phoneVal = contactConfig?.phone || "준비 중";
  const emailVal = contactConfig?.email || "준비 중";
  const hoursVal = contactConfig?.hours || "평일 09:00 - 18:00 (예약 상담 우선)";

  const items = [
    { label: "전화", value: phoneVal, icon: Phone, href: phoneVal !== "준비 중" ? `tel:${phoneVal}` : null },
    { label: "카카오톡 상담", value: "카카오톡으로 빠른 상담", icon: MessageCircle, href: KAKAO_CHANNEL_CHAT },
    { label: "이메일", value: emailVal, icon: AtSign, href: emailVal !== "준비 중" ? `mailto:${emailVal}` : null },
    { label: "영업시간", value: hoursVal, icon: Clock, href: null },
  ];

  const contactItems = showTelegram
    ? [
        items[0],
        items[1],
        { label: "텔레그램 상담", value: "텔레그램으로 빠른 상담", icon: Send, href: telegramUrl },
        ...items.slice(2),
      ]
    : items;

  return (
    <div className="reveal">
      <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
        CONTACT
      </p>
      <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 32 }}>
        연락처
      </h2>
      <div className="space-y-4">
        {contactItems.map((c, i) => {
          const Inner = (
            <SurfaceCard
              className="flex items-center gap-4 transition-colors duration-200 hover:bg-[#f0f0ee]"
              style={{ padding: "16px 20px", background: "var(--bg-primary)", cursor: c.href ? "pointer" : "default" }}
            >
              <c.icon size={22} strokeWidth={1.3} color="var(--accent-gold)" />
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{c.label}</p>
                <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 400 }}>{c.value}</p>
              </div>
            </SurfaceCard>
          );
          return c.href ? (
            <a key={i} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{Inner}</a>
          ) : (
            <div key={i}>{Inner}</div>
          );
        })}
      </div>
    </div>
  );
}

