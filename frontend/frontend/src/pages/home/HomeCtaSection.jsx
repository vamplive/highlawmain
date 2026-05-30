/** 홈 페이지 하단 CTA 섹션 — 상담 유도 배너 */
import { Link } from "react-router-dom";

export default function HomeCtaSection({ copy }) {
  return (
    <section className="hp-section hp-cta-section" style={{ background: "#0a1628" }}>
      <div className="hp-section-inner" style={{ alignItems: "center" }}>
        <h2 className="hp-cta-title" style={{ margin: 0 }}>
          {copy.ctaTitle}
        </h2>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          margin: "32px auto 0",
          color: "rgba(255,255,255,0.85)",
          fontSize: "15.5px",
          fontWeight: 300,
          width: "fit-content",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ color: "var(--accent-gold)", fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>✓</span>
            <span style={{ lineHeight: 1.25 }}>정밀한 분석 후 솔직한 진단을 알려드립니다.</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ color: "var(--accent-gold)", fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>✓</span>
            <span style={{ lineHeight: 1.25 }}>관련 규정에 따른 정직한 비용만을 청구합니다.</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ color: "var(--accent-gold)", fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>✓</span>
            <span style={{ lineHeight: 1.25 }}>신뢰에 대한 헌신으로 고객에게 보답합니다</span>
          </div>
        </div>

        <Link
          to="/consultation"
          className="hp-cta-button"
          style={{ marginTop: 44 }}
        >
          {copy.ctaButton}
        </Link>
      </div>
    </section>
  );
}
