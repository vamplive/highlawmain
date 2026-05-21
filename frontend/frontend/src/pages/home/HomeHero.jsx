/** 홈 히어로 — 풀스크린 비디오 배경 + 중앙 HIGHLAW 골드 로고 + 키 카피·CTA */
import { useState } from "react";
import { Link } from "react-router-dom";

const HERO_MARK = "/brand/highlaw-mark-gold.png";

export default function HomeHero({ heroVideo, settings, copy }) {
  const [videoReady, setVideoReady] = useState(false);

  const primaryLink = settings.hero.ctaPrimaryLink || "/consultation";
  const secondaryLink = settings.hero.ctaSecondaryLink || "tel:02-594-5583";
  const isPrimaryTel = primaryLink.startsWith("tel:");
  const isSecondaryTel = secondaryLink.startsWith("tel:");

  return (
    <section className="hp-hero">
      <video
        key={heroVideo}
        className={`hp-hero-video${videoReady ? " is-ready" : ""}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/og-image.jpg"
        src={heroVideo}
        onCanPlay={() => setVideoReady(true)}
      />

      <div className="hp-hero-overlay" />

      <div className="hp-hero-content">
        <img
          src={HERO_MARK}
          alt="법무법인 하이로 HIGHLAW"
          className="hp-hero-mark"
          fetchpriority="high"
          decoding="async"
        />

        <h1 className="hp-hero-title">{settings.hero.heading}</h1>
        <p className="hp-hero-copy">{settings.hero.tagline}</p>

        <div className="hp-cta-buttons">
          <CtaButton
            href={primaryLink}
            isTel={isPrimaryTel}
            className="hp-hero-button hp-hero-button-primary"
          >
            {copy.heroPrimary || settings.hero.ctaPrimary}
          </CtaButton>
          <CtaButton
            href={secondaryLink}
            isTel={isSecondaryTel}
            className="hp-hero-button hp-hero-button-secondary"
          >
            {copy.heroSecondary || settings.hero.ctaSecondary}
          </CtaButton>
        </div>
      </div>

      <div className="hp-scroll-indicator" aria-hidden="true">
        <span>SCROLL</span>
      </div>
    </section>
  );
}

function CtaButton({ href, isTel, className, children }) {
  if (isTel || /^https?:/.test(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}
