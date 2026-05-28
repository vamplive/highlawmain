import { useEffect } from "react";
import useReveal from "../../hooks/useReveal";

const OPEN_POSITIONS = [
  {
    id: "new-lawyer",
    title: "신규변호사 채용",
    desc: "법학전문대학원 졸업 예정자 및 변호사 시험 합격자를 대상으로 하이로의 미래를 이끌어갈 주니어 변호사를 모집합니다.",
    isOpen: false,
  },
  {
    id: "exp-lawyer",
    title: "경력변호사 채용",
    desc: "민사, 형사, 기업법무 등 특정 분야에서 탁월한 전문성과 1년 이상의 실무 경력을 보유한 변호사를 모집합니다.",
    isOpen: false,
  },
  {
    id: "mil-lawyer",
    title: "법무관 채용",
    desc: "전역 예정 법무관을 대상으로 공공기관 및 군사법 분야의 전문성을 발휘할 우수한 인재를 모집합니다.",
    isOpen: false,
  },
  {
    id: "staff",
    title: "전문 직원 채용",
    desc: "법무행정, 비서, 일반 사무 등 하이로의 법률 서비스를 정교하게 지원할 역량 있는 파트너를 모집합니다.",
    isOpen: true,
  },
];

export default function RecruitPage() {
  const revealRef = useReveal();

  useEffect(() => {
    document.title = "Recruit | 법무법인 하이로";
  }, []);

  return (
    <div ref={revealRef}>
      {/* 서브 히어로 영역 — 다크 럭셔리 & 샴페인 골드 라인 */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: "45vh",
          minHeight: 350,
          background: "linear-gradient(135deg, #050505 0%, #0b0e14 100%)",
          borderBottom: "1px solid var(--white-15)",
        }}
      >
        <div className="relative text-center z-10" style={{ padding: "0 24px" }}>
          <span
            className="font-en inline-block reveal"
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              color: "#DEC584", // 샴페인 골드
              borderBottom: "1px solid rgba(222, 197, 132, 0.3)",
              paddingBottom: 8,
              marginBottom: 16,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Talent Acquisition
          </span>
          <h1
            className="font-serif-kr reveal"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3rem)",
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.4,
              marginBottom: 16,
            }}
          >
            Join Our Excellence
          </h1>
          <p
            className="font-serif reveal"
            style={{
              fontSize: "clamp(13px, 2.5vw, 16px)",
              fontStyle: "italic",
              color: "#DEC584",
              letterSpacing: "0.08em",
              fontWeight: 400,
              opacity: 0.9,
            }}
          >
            Loyalty builds trust; professionalism earns respect.
          </p>
        </div>
      </section>

      {/* 채용 본문 그리드 */}
      <section
        className="section"
        style={{
          background: "#fff",
          paddingTop: 80,
          paddingBottom: 100,
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span
              className="font-en"
              style={{
                fontSize: 11,
                letterSpacing: "0.24em",
                color: "var(--accent-gold)",
                display: "block",
                marginBottom: 12,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Careers
            </span>
            <h2
              className="font-serif-kr"
              style={{
                fontSize: "clamp(22px, 3.5vw, 30px)",
                fontWeight: 400,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Open Positions
            </h2>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 30 }}
          >
            {OPEN_POSITIONS.map((pos) => (
              <div
                key={pos.id}
                className="reveal"
                style={{
                  background: "#fff",
                  border: `1px solid ${pos.isOpen ? "var(--accent-gold)" : "var(--border-color)"}`,
                  padding: "48px 40px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 4,
                  opacity: pos.isOpen ? 1 : 0.6,
                  transition: "all 0.3s ease",
                  boxShadow: pos.isOpen ? "0 10px 25px rgba(59, 110, 165, 0.08)" : "none",
                }}
              >
                <div>
                  {/* 상태 배지 */}
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      borderRadius: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginBottom: 20,
                      border: pos.isOpen ? "1px solid #bbf7d0" : "1px solid #fecaca",
                      background: pos.isOpen ? "#f0f9f0" : "#fef2f2",
                      color: pos.isOpen ? "#166534" : "#dc2626",
                    }}
                  >
                    {pos.isOpen ? "모집 중" : "모집 마감"}
                  </span>

                  <h3
                    className="font-serif-kr"
                    style={{
                      fontSize: 21,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      marginBottom: 14,
                    }}
                  >
                    {pos.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "var(--text-secondary)",
                      opacity: 0.85,
                      marginBottom: 32,
                    }}
                  >
                    {pos.desc}
                  </p>
                </div>

                <div>
                  {pos.isOpen ? (
                    <a
                      href="mailto:recruit@highlaw.net"
                      className="font-en"
                      style={{
                        display: "inline-block",
                        width: "100%",
                        padding: "14px 0",
                        border: "1px solid var(--accent-gold)",
                        color: "var(--accent-gold)",
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        textAlign: "center",
                        transition: "all 0.3s ease",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent-gold)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--accent-gold)";
                      }}
                    >
                      Apply Now
                    </a>
                  ) : (
                    <span
                      className="font-en"
                      style={{
                        display: "inline-block",
                        width: "100%",
                        padding: "14px 0",
                        border: "1px solid #ccc",
                        color: "#999",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        textAlign: "center",
                        background: "#fafafa",
                        cursor: "not-allowed",
                      }}
                    >
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 안내 박스 */}
      <section
        style={{
          background: "var(--bg-dark)",
          color: "#fff",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: 760 }}>
          <span
            className="font-en"
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              color: "#DEC584",
              display: "block",
              marginBottom: 16,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Inquiry
          </span>
          <h2
            className="font-serif-kr"
            style={{
              fontSize: "clamp(22px, 3.5vw, 30px)",
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.4,
              marginBottom: 14,
            }}
          >
            Commitment to Excellence
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--white-60)",
              lineHeight: 1.85,
              fontWeight: 300,
              marginBottom: 36,
            }}
          >
            법무법인 하이로는 클라이언트의 가치를 최우선으로 하며, <br />
            타협하지 않는 최고 수준의 전문성을 약속합니다.
          </p>
          <a
            href="/inquiry?tab=apply"
            className="font-en"
            style={{
              display: "inline-block",
              padding: "16px 45px",
              border: "1px solid #DEC584",
              color: "#DEC584",
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: "2px",
              textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#DEC584";
              e.currentTarget.style.color = "var(--bg-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#DEC584";
            }}
          >
            Professional Consultation
          </a>
        </div>
      </section>
    </div>
  );
}
