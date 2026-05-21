/** 상담 절차 + 연락처 + 오시는 길 섹션 */
import { STEPS, CONTACT_INFO, OFFICE_ADDRESS } from "./consultationConstants";
import { Send } from "lucide-react";
import { useLanguage, useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "../../components/layout/layoutConfig";
import { SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";
import { safeHttpUrl } from "../../utils/safeUrl";
import { TELEGRAM_CONTACT_URL } from "../../utils/telegramContact";

export default function ConsultationSteps() {
  return (
    <section className="section" style={{ background: "#fff" }}>
      <div className="container" style={{ maxWidth: 960 }}>
        <SectionHeading
          eyebrow="PROCESS"
          title="명확한 전략, 빠른 실행, 책임 있는 결과"
          description="법무법인 하이로는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여 의뢰인에게 가장 실익이 큰 선택지를 제시합니다."
        />

        {/* 절차 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger" style={{ marginBottom: 80 }}>
          {STEPS.map((s, i) => (
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

        {/* 연락처 + 오시는 길 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ContactInfoSection />
          <LocationSection />
        </div>
      </div>
    </section>
  );
}

/** 연락처 카드 목록 */
function ContactInfoSection() {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;
  const telegramUrl = safeHttpUrl(contact.telegramUrl, TELEGRAM_CONTACT_URL);
  const showTelegram = (contact.telegramEnabled !== false || !contact.telegramUrl) && !!telegramUrl;
  const contactItems = showTelegram
    ? [
        CONTACT_INFO[0],
        CONTACT_INFO[1],
        { label: "텔레그램 상담", value: "텔레그램으로 빠른 상담", icon: Send, href: telegramUrl },
        ...CONTACT_INFO.slice(2),
      ]
    : CONTACT_INFO;

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

/** 오시는 길 섹션 */
function LocationSection() {
  return (
    <div className="reveal">
      <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
        LOCATION
      </p>
      <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 32 }}>
        오시는 길
      </h2>
      <SurfaceCard style={{ padding: "32px 24px", background: "var(--bg-primary)", marginBottom: 16 }}>
        <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500, marginBottom: 12 }}>
          {OFFICE_ADDRESS}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.9, fontWeight: 300 }}>
          지하철: 2호선 강남역 / 선릉역 인근<br />
          상세 도보 안내는 추후 업데이트 예정
        </p>
      </SurfaceCard>
    </div>
  );
}
