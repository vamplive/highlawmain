import { useState, useEffect, useRef } from "react";

const TRUST_STATS = [
  { value: "2,000+", unit: "건", label: "누적 상담건수",  sub: "Total Consultations" },
  { value: "83%",    unit: "",   label: "의뢰인 재방문률", sub: "Client Return Rate" },
  { value: "12H",    unit: "",   label: "초기 대응 시간",  sub: "Initial Response" },
  { value: "3",      unit: "인", label: "대표 변호사",     sub: "Partner Attorneys" },
];

export default function HomeTrustSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScroll = (e) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const index = Math.min(
        TRUST_STATS.length - 1,
        Math.max(0, Math.round(scrollLeft / width))
      );
      setActiveDot(index);
    }
  };

  const scrollToItem = (index) => {
    const container = scrollRef.current;
    if (container) {
      const width = container.clientWidth;
      container.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
      setActiveDot(index);
    }
  };

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f2444 50%, #0a1628 100%)",
        padding: isMobile ? "60px 20px" : "72px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 장식 원 */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(201,168,76,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: "25%", width: 200, height: 200, borderRadius: "50%", background: "rgba(201,168,76,0.04)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
        {/* 상단 eyebrow */}
        <p style={{
          fontSize: 10, letterSpacing: "0.35em", color: "rgba(201,168,76,0.65)",
          textTransform: "uppercase", fontWeight: 700,
          textAlign: "center", marginBottom: isMobile ? 36 : 48,
        }}>
          TRUSTED BY CLIENTS — 하이로를 선택한 이유
        </p>

        {/* 수치 그리드 / 모바일 flex 슬라이더 */}
        {isMobile ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              gap: 0,
              width: "100%",
            }}
            className="hide-scrollbar"
          >
            {TRUST_STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 100%",
                  scrollSnapAlign: "center",
                  textAlign: "center",
                  padding: "0 32px 8px",
                  boxSizing: "border-box",
                }}
              >
                {/* 큰 수치 */}
                <p
                  className="font-serif"
                  style={{
                    margin: 0,
                    fontSize: "clamp(2.8rem, 4.5vw, 4rem)",
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                  }}
                >
                  <span style={{ color: "#DEC584" }}>{stat.value}</span>
                  {stat.unit && (
                    <span style={{ fontSize: "0.38em", color: "rgba(255,255,255,0.55)", fontWeight: 300, marginLeft: 4, verticalAlign: "bottom", lineHeight: 3.2 }}>
                      {stat.unit}
                    </span>
                  )}
                </p>

                {/* 한글 레이블 */}
                <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.90)", margin: "16px 0 6px", letterSpacing: "-0.01em" }}>
                  {stat.label}
                </p>

                {/* 영문 서브 */}
                <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", margin: 0 }}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {TRUST_STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "0 32px 8px",
                  borderRight: i < 3 ? "1px solid rgba(201,168,76,0.12)" : "none",
                }}
              >
                {/* 큰 수치 */}
                <p
                  className="font-serif"
                  style={{
                    margin: 0,
                    fontSize: "clamp(2.8rem, 4.5vw, 4rem)",
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                  }}
                >
                  <span style={{ color: "#DEC584" }}>{stat.value}</span>
                  {stat.unit && (
                    <span style={{ fontSize: "0.38em", color: "rgba(255,255,255,0.55)", fontWeight: 300, marginLeft: 4, verticalAlign: "bottom", lineHeight: 3.2 }}>
                      {stat.unit}
                    </span>
                  )}
                </p>

                {/* 한글 레이블 */}
                <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.90)", margin: "16px 0 6px", letterSpacing: "-0.01em" }}>
                  {stat.label}
                </p>

                {/* 영문 서브 */}
                <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.30)", textTransform: "uppercase", margin: 0 }}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 모바일 페이지네이션 도트 */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
            {TRUST_STATS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToItem(idx)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: idx === activeDot ? "#DEC584" : "rgba(255,255,255,0.25)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "background 0.3s ease",
                }}
                aria-label={`${idx + 1}번 항목 보기`}
              />
            ))}
          </div>
        )}

        {/* 하단 구분선 + 설명 */}
        <div style={{ marginTop: 48, borderTop: "1px solid rgba(201,168,76,0.15)", paddingTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", letterSpacing: "0.05em" }}>
            * 2026년 기준 내부 집계 데이터
          </p>
        </div>
      </div>
    </section>
  );
}
