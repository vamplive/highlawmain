/** 홈 구성원 소개 섹션 — 변호사 카드 그리드 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { C, FALLBACK_LAWYERS, parseSpecialtyList } from "./homeTokens";

export default function HomePeopleSection({ copy }) {
  const [lawyerList, setLawyerList] = useState(FALLBACK_LAWYERS);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/lawyers")
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        setLawyerList(rows.length ? rows : FALLBACK_LAWYERS);
        setUsingFallback(rows.length === 0);
      })
      .catch(() => {
        if (!cancelled) setUsingFallback(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="hp-section" style={{ background: "#ffffff" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{copy.peopleKicker}</p>
          <h2 className="hp-title">{copy.peopleTitle}</h2>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "30px",
            marginTop: "48px",
            width: "100%",
          }}
        >
          {lawyerList.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
        {usingFallback && (
          <p className="hp-data-note" role="status" style={{ textAlign: "center", marginTop: 24 }}>
            현재 기본 프로필 정보를 표시하고 있습니다.
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            to="/lawyers"
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
            구성원 전체보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function LawyerCard({ lawyer }) {
  const specialties = parseSpecialtyList(lawyer.specialties);

  return (
    <Link
      to={`/lawyers/${lawyer.slug || lawyer.id}`}
      className="hp-lawyer-card"
      style={{ width: "280px", flexShrink: 0 }}
    >
      {lawyer.photoUrl ? (
        <img
          src={lawyer.photoUrl}
          alt={lawyer.name}
          className="hp-lawyer-photo"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="hp-lawyer-placeholder" aria-hidden="true">
          <span>변호사</span>
        </div>
      )}

      <div className="hp-lawyer-body">
        <h3 className="hp-lawyer-name">
          {lawyer.name}
        </h3>

        <p className="hp-lawyer-position">
          {lawyer.position}
        </p>

        {specialties.length > 0 && (
          <div className="hp-tags">
            {specialties.map((tag) => (
              <span key={tag} className="hp-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
