/** 홈 페이지 하단 CTA 섹션 — 상담 유도 배너 */
import { Link } from "react-router-dom";

export default function HomeCtaSection({ copy }) {
  return (
    <section className="hp-cta-section">
      <h2 className="hp-cta-title">
        {copy.ctaTitle}
      </h2>

      <p className="hp-cta-copy">
        {copy.ctaDescription}
      </p>

      <Link
        to="/consultation"
        className="hp-cta-button"
      >
        {copy.ctaButton}
      </Link>
    </section>
  );
}
