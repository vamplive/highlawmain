/** 홈 신뢰 지표 섹션 — 누적 상담건수·재방문률 등 4개 수치 */

const TRUST_STATS = [
  { value: "2,000+", unit: "건", label: "누적 상담건수",  sub: "Total Consultations" },
  { value: "83%",    unit: "",   label: "의뢰인 재방문률", sub: "Client Return Rate" },
  { value: "12H",    unit: "",   label: "초기 대응 시간",  sub: "Initial Response" },
  { value: "3",      unit: "인", label: "대표 변호사",     sub: "Partner Attorneys" },
];

export default function HomeTrustSection() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f2444 50%, #0a1628 100%)",
        padding: "72px 48px",
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
          textAlign: "center", marginBottom: 48,
        }}>
          TRUSTED BY CLIENTS — 하이로를 선택한 이유
        </p>

        {/* 수치 그리드 */}
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
