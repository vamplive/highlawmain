/** 홈 솔루션 섹션 — 3가지 강점 카드 그리드 */
import { SOLUTION_CARDS } from "./homeTokens";

export default function HomeSolutionSection({ lang = "ko", copy, settings }) {
  const isEnglish = lang === "en";
  const sol = settings?.solution || {};
  const kicker      = sol.kicker      || copy.solutionKicker;
  const title       = sol.title       || copy.solutionTitle;
  const description = sol.description || copy.solutionDescription;
  const cards       = (sol.cards && sol.cards.length > 0) ? sol.cards : SOLUTION_CARDS;

  return (
    <section className="hp-section" style={{ background: "#fbf9f4" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{kicker}</p>
          <h2 className="hp-title">{title}</h2>
          <p className="hp-copy">{description}</p>
        </div>

        <div className="hp-grid hp-grid-solutions">
          {cards.map((card, idx) => (
            <SolutionCard key={idx} card={card} index={idx} isEnglish={isEnglish} />
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
