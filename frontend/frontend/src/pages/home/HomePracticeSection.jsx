/** 홈 업무분야 섹션 — 4개 분야 카드 그리드 */
import { Link } from "react-router-dom";
import { C, PRACTICE_AREAS } from "./homeTokens";

export default function HomePracticeSection({ lang = "ko", copy }) {
  const isEnglish = lang === "en";

  return (
    <section className="hp-section" style={{ background: "#f5f7fa" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{copy.practiceKicker}</p>
          <h2 className="hp-title">{copy.practiceTitle}</h2>
        </div>

        <div className="hp-grid hp-grid-practice">
          {PRACTICE_AREAS.map((area) => (
            <PracticeCard key={area.en} area={area} isEnglish={isEnglish} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            to="/practice"
            className="hp-hero-button hp-hero-button-secondary"
            style={{
              borderColor: "var(--accent-gold)",
              color: "var(--accent-gold)",
              background: "transparent",
              fontSize: "14px",
              padding: "12px 32px",
              minHeight: "44px",
            }}
          >
            업무분야 전체보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function PracticeCard({ area, isEnglish }) {
  return (
    <Link
      to={area.to}
      className="hp-practice-card"
    >
      <h3 className="hp-practice-title">
        {isEnglish ? area.en : area.ko}
      </h3>

      <p className="hp-practice-meta">
        {isEnglish ? area.ko : area.en}
      </p>

      <p className="hp-practice-copy">
        {isEnglish ? area.descEn : area.desc}
      </p>
    </Link>
  );
}
