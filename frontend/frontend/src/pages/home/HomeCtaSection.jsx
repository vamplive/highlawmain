/** 홈 페이지 하단 CTA 섹션 — 상담 유도 배너 */
import { Link } from "react-router-dom";

export default function HomeCtaSection({ copy }) {
  return (
    <section className="hp-section hp-cta-section" style={{ background: "#0a1628" }}>
      <div className="hp-section-inner" style={{ alignItems: "center" }}>
        <h2 className="hp-cta-title" style={{ margin: 0 }}>
          {copy.ctaTitle}
        </h2>

        <p className="hp-cta-copy" style={{ margin: "24px 0 0" }}>
          {copy.ctaDescription}
        </p>

        <Link
          to="/consultation"
          className="hp-cta-button"
          style={{ marginTop: 40 }}
        >
          {copy.ctaButton}
        </Link>
      </div>
    </section>
  );
}
