/** 홈 솔루션 섹션 — 3가지 강점 카드 그리드 */
import { C, SOLUTION_CARDS } from "./homeTokens";

export default function HomeSolutionSection({ lang = "ko", copy }) {
  const isEnglish = lang === "en";

  return (
    <section className="hp-section" style={{ background: C.bgLight }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{copy.solutionKicker}</p>
          <h2 className="hp-title">
            {copy.solutionTitle}
          </h2>
          <p className="hp-copy">
            {copy.solutionDescription}
          </p>
        </div>

        <div className="hp-grid hp-grid-solutions">
          {SOLUTION_CARDS.map((card, idx) => (
            <SolutionCard key={card.title} card={card} index={idx} isEnglish={isEnglish} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionCard({ card, index, isEnglish }) {
  const numberLabel = String(index + 1).padStart(2, "0");

  return (
    <div className="hp-card hp-solution-card">
      <span className="hp-card-number">
        {numberLabel}
      </span>
      <h3 className="hp-card-title">
        {isEnglish ? card.titleEn : card.title}
      </h3>
      <p className="hp-card-copy">
        {isEnglish ? card.descEn : card.desc}
      </p>
    </div>
  );
}
