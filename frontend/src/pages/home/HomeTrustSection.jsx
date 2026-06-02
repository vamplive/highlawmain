/** 홈 신뢰 지표 섹션 — 누적 상담건수·재방문률 등 4개 수치 */

const TRUST_STATS = [
  { value: "2,000+", unit: "건", label: "누적 상담건수", sub: "Total Consultations" },
  { value: "83%",   unit: "",   label: "의뢰인 재방문률", sub: "Client Return Rate" },
  { value: "24H",   unit: "",   label: "초기 응답 시간", sub: "Initial Response" },
  { value: "12",    unit: "인", label: "전문 변호사", sub: "Specialist Attorneys" },
];

export default function HomeTrustSection() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0b1f3a 0%, #122d52 100%)",
        padding: "56px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 장식 */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 240, height: 240,
        borderRadius: "50%",
        background: "rgba(201,168,76,0.06)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: "30%",
        width: 160, height: 160,
        borderRadius: "50%",
        background: "rgba(201,168,76,0.04)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
        {/* 상단 레이블 */}
        <p style={{
          fontSize: 10, letterSpacing: "0.32em", color: "rgba(201,168,76,0.7)",
          textTransform: "uppercase", fontWeight: 600,
          textAlign: "center", marginBottom: 36,
        }}>
          TRUSTED BY CLIENTS
        </p>

        {/* 수치 그리드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
        }}>
          {TRUST_STATS.map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "12px 24px 24px",
                borderRight: i < 3 ? "1px solid rgba(201,168,76,0.14)" : "none",
              }}
            >
              {/* 수치 */}
              <p
                className="font-serif"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 300,
                  color: "#fff",
                  lineHeight: 1.1,
                  marginBottom: 4,
                  letterSpacing: "-0.02em",
                }}
              >
                <span style={{ color: "var(--accent-gold)" }}>{stat.value}</span>
                {stat.unit && (
                  <span style={{ fontSize: "0.45em", color: "rgba(255,255,255,0.6)", fontWeight: 300, marginLeft: 3 }}>
                    {stat.unit}
                  </span>
                )}
              </p>
              {/* 한글 레이블 */}
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontWeight: 500, marginBottom: 4 }}>
                {stat.label}
              </p>
              {/* 영문 서브 */}
              <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
