/** 홈 구성원 소개 섹션 — 변호사 카드 그리드 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api";
import { C, FALLBACK_LAWYERS, parseSpecialtyList } from "./homeTokens";

export default function HomePeopleSection({ copy, settings }) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 모바일인 경우 전문위원과 직원은 제외하고 변호사만 노출
  const onlyLawyers = isMobile
    ? lawyerList.filter((l) => l.position === "대표변호사" || l.position === "변호사")
    : lawyerList;

  // 무한 루프 슬라이더를 위한 클론 생성
  const slides = onlyLawyers.length > 1
    ? [onlyLawyers[onlyLawyers.length - 1], ...onlyLawyers, onlyLawyers[0]]
    : onlyLawyers;

  const handleTouchStart = (e) => {
    if (isTransitioning || onlyLawyers.length <= 1) return;
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setDragOffset(0);
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null || touchStartY === null) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = currentX - touchStart;
    const diffY = currentY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) e.preventDefault();
      setIsSwiping(true);
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    const threshold = 50;
    let nextIndex = currentIndex;

    if (isSwiping) {
      if (dragOffset < -threshold) {
        nextIndex = currentIndex + 1;
      } else if (dragOffset > threshold) {
        nextIndex = currentIndex - 1;
      }
    }

    setDragOffset(0);
    setTouchStart(null);
    setTouchStartY(null);
    setIsSwiping(false);

    if (nextIndex !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(nextIndex);
    }
  };

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (currentIndex === 0) {
      setCurrentIndex(onlyLawyers.length);
    } else if (currentIndex === onlyLawyers.length + 1) {
      setCurrentIndex(1);
    }
  };

  const activeDotIndex = onlyLawyers.length > 0
    ? (currentIndex - 1 + onlyLawyers.length) % onlyLawyers.length
    : 0;

  const trackStyle = {
    display: "flex",
    width: `${slides.length * 100}%`,
    transform: `translateX(calc(-${(currentIndex * 100) / slides.length}% + ${dragOffset}px))`,
    transition: isTransitioning ? "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
  };

  const slideStyle = {
    flex: `0 0 ${100 / slides.length}%`,
    display: "flex",
    justifyContent: "center",
    padding: "0 10px",
    boxSizing: "border-box",
  };

  return (
    <section className="hp-section" style={{ background: "#ffffff", padding: "60px 48px" }}>
      <div className="hp-section-inner">
        <div className="hp-section-centered">
          <p className="hp-kicker">{settings?.peopleHeader?.kicker || copy.peopleKicker}</p>
          <h2 className="hp-title">{settings?.peopleHeader?.title || copy.peopleTitle}</h2>
        </div>

        {isMobile ? (
          onlyLawyers.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: 48, color: "var(--text-muted)" }}>
              등록된 변호사가 없습니다.
            </p>
          ) : onlyLawyers.length === 1 ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "48px", width: "100%" }}>
              <LawyerCard lawyer={onlyLawyers[0]} />
            </div>
          ) : (
            <div style={{ position: "relative", width: "100%", overflow: "hidden", marginTop: "48px" }}>
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTransitionEnd={handleTransitionEnd}
                style={trackStyle}
              >
                {slides.map((lawyer, i) => (
                  <div key={i} style={slideStyle}>
                    <LawyerCard lawyer={lawyer} />
                  </div>
                ))}
              </div>

              {/* 페이지네이션 도트 */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
                {onlyLawyers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setCurrentIndex(idx + 1);
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: idx === activeDotIndex ? "var(--accent-gold)" : "#ddd",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "background 0.3s ease",
                    }}
                    aria-label={`${idx + 1}번 변호사 보기`}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
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
            {onlyLawyers.map((lawyer) => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
        )}

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
    <Link
      to={`/partners/${lawyer.slug || lawyer.id}`}
      className="hp-lawyer-card"
      style={{ width: "min(280px, 100%)" }}
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
