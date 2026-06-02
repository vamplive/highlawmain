/** 상담안내 페이지 히어로 배너 + 핵심 지표 섹션 */
import { STATS } from "./consultationConstants";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";
import { useLanguage, useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "../../components/layout/layoutConfig";
import { PublicHero, SurfaceCard } from "../../components/public/PublicDesign";
import { safeHttpUrl } from "../../utils/safeUrl";
import { TELEGRAM_CONTACT_URL } from "../../utils/telegramContact";

export default function ConsultationHero() {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;
  const telegramUrl = safeHttpUrl(contact.telegramUrl, TELEGRAM_CONTACT_URL);
  const showTelegram = (contact.telegramEnabled !== false || !contact.telegramUrl) && !!telegramUrl;

  return (
    <>
      <PublicHero
        eyebrow="CONSULTATION"
        title="상담안내"
        description="사건의 핵심을 파악하여 명확한 해결책을 제시해 드립니다"
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
      />

      {/* 핵심 지표 — 기존 STATS 데이터 유지 */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
            {STATS.map((s, i) => (
              <SurfaceCard key={i} className="reveal text-center" style={{ padding: "24px 16px" }}>
                <p className="font-en" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--accent-gold)", marginBottom: 8 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 300 }}>{s.label}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
