/** 상담안내 페이지 히어로 배너 + 핵심 지표 섹션 */
import { STATS } from "./consultationConstants";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import { useLanguage, useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "../../components/layout/layoutConfig";
import { PublicHero } from "../../components/public/PublicDesign";
import { safeHttpUrl } from "../../utils/safeUrl";
import { TELEGRAM_CONTACT_URL } from "../../utils/telegramContact";

const CONSULTATIONS_DEFAULTS = {
  hero: {
    heading: "상담안내",
    subheading: "CONSULTATION"
  }
};

export default function ConsultationHero() {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const { settings: consSettings } = useSiteSettingsPage("consultations", CONSULTATIONS_DEFAULTS);
  
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;
  const telegramUrl = safeHttpUrl(contact.telegramUrl, TELEGRAM_CONTACT_URL);
  const showTelegram = (contact.telegramEnabled !== false || !contact.telegramUrl) && !!telegramUrl;

  return (
    <PublicHero
      eyebrow={consSettings.hero?.subheading || "CONSULTATION"}
      title={consSettings.hero?.heading || "상담안내"}
      primaryAction={{
        href: KAKAO_CHANNEL_CHAT,
        target: "_blank",
        label: "카카오톡 문의",
        icon: (
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 4C8.477 4 4 7.582 4 12c0 2.87 1.89 5.39 4.726 6.836l-.96 3.56c-.08.296.256.536.512.368L12.4 20.2c.52.06 1.06.1 1.6.1 5.523 0 10-3.582 10-8s-4.477-8-10-8z" fill="currentColor"/>
          </svg>
        ),
      }}
      secondaryAction={showTelegram ? {
        href: telegramUrl,
        target: "_blank",
        label: "텔레그램 문의",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M22.05 2.7 1.79 10.49c-1.38.55-1.37 1.32-.25 1.66l5.2 1.62 12.04-7.6c.57-.35 1.09-.16.66.22l-9.75 8.8h-.01l.01.01-.36 5.36c.55 0 .79-.25 1.1-.55l2.64-2.57 5.49 4.05c1.01.56 1.74.27 1.99-.94l3.6-16.97c.37-1.49-.57-2.16-1.55-1.81z"
              fill="currentColor"
            />
          </svg>
        ),
      } : null}
    >
      {/* 핵심 지표 박스 — 히어로 내부 글라스 카드 */}
      <div
        className="reveal"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 36,
          width: "100%",
          maxWidth: 560,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "20px 12px",
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <p
              className="font-en"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 300, color: "var(--accent-gold)", marginBottom: 6 }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: 300, letterSpacing: "0.03em" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </PublicHero>
  );
}
