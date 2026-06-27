/** 홈 구성원 소개 섹션 — 변호사 카드 (모바일: 좌우 스와이프 캐러셀) */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { FALLBACK_LAWYERS, parseSpecialtyList } from "./homeTokens";

export default function HomePeopleSection({ copy, settings }) {
  const [lawyerList, setLawyerList] = useState(FALLBACK_LAWYERS);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/lawyers")
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data || []).filter(
          (l) => l.position === "대표변호사" || l.position === "변호사"
        );
        setLawyerList(rows.length ? rows : FALLBACK_LAWYERS);
        setUsingFallback(rows.length === 0);
      })
      .catch(() => {
        if (!cancelled) setUsingFallback(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    // 수평 padding은 CSS 반응형(.hp-section)이 제어하고, 수직은 인라인으로 고정
    <section className="hp-section" style={{ background: "#ffffff", paddingTop: "60px", paddingBottom: "60px" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{settings?.peopleHeader?.kicker || copy.peopleKicker}</p>
          <h2 className="hp-title">{settings?.peopleHeader?.title || copy.peopleTitle}</h2>
        </div>

        {/* 데스크톱: flex wrap 그리드 / 모바일: 좌우 스와이프 캐러셀 */}
        <div className="hp-people-carousel-wrap">
          <div className="hp-people-carousel">
            {lawyerList.map((lawyer) => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
        </div>

        {usingFallback && (
          <p className="hp-data-note" role="status" style={{ textAlign: "center", marginTop: 24 }}>
            현재 기본 프로필 정보를 표시하고 있습니다.
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            to="/partners"
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
    // width는 home.css의 .hp-lawyer-card에서 관리 (모바일 캐러셀에서 CSS가 오버라이드)
    <Link
      to={`/partners/${lawyer.slug || lawyer.id}`}
      className="hp-lawyer-card"
    >
      {lawyer.photoUrl ? (
        <div style={{
          width: "100%", aspectRatio: "3/4",
          position: "relative", overflow: "hidden",
          background: "#e8e6e3",
        }}>
          <img
            src={lawyer.photoUrl}
            alt={lawyer.name}
            loading="lazy"
            decoding="async"
            style={{
              width: "88%", height: "88%",
              objectFit: "cover",
              objectPosition: lawyer.photoFocus || "center top",
              display: "block",
              margin: "auto",
              marginTop: "6%",
            }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 80,
            background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
          }} />
        </div>
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
