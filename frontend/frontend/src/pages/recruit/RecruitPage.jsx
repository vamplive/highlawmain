import { useEffect } from "react";
import useReveal from "../../hooks/useReveal";

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
              fontSize: 10,
              letterSpacing: "0.35em",
              color: "#DEC584", // 샴페인 골드
              borderBottom: "1px solid rgba(222, 197, 132, 0.3)",
              paddingBottom: 8,
              marginBottom: 16,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Careers
          </span>
          <h1
            className="font-serif-kr reveal"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.4,
              marginBottom: 16,
            }}
          >
            인재 채용
          </h1>
          <p
            className="font-serif reveal"
            style={{
              fontSize: "clamp(11px, 2vw, 13px)",
              fontStyle: "italic",
              color: "#DEC584",
              letterSpacing: "0.15em",
              fontWeight: 400,
              opacity: 0.9,
            }}
          >
            Loyalty builds trust; professionalism earns respect.
          </p>
        </div>
      </section>

      {/* 채용 상세 */}
      <section
        className="section"
        style={{
          background: "#fff",
          paddingTop: 80,
          paddingBottom: 100,
        }}
      >
        <div className="container" style={{ maxWidth: 800, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 2.0, fontWeight: 300 }}>
            법무법인 하이로와 함께 탁월한 전문성을 발휘할 인재를 기다립니다.<br />
            현재 공식 채용 기간이 아닙니다. 인재풀 등록 및 상시 채용 문의는<br />
            아래 이메일로 이력서 및 자기소개서를 제출해 주시기 바랍니다.
          </p>
          <div style={{ marginTop: 40 }}>
            <a
              href="mailto:recruit@highlaw.net"
              className="font-en"
              style={{
                display: "inline-block",
                padding: "12px 36px",
                border: "1px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                transition: "all 0.3s ease",
              }}
            >
              recruit@highlaw.net
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
