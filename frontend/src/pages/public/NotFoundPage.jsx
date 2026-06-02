/** 404 페이지 — 친절한 안내 + 연관 콘텐츠 카드로 이탈률 감소 */
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";

const RELATED_LINKS = [
  { to: "/about", title: "사무소 소개", desc: "법무법인 하이로의 핵심 가치와 연혁" },
  { to: "/practice", title: "업무분야", desc: "불법파견·게임사기·노동·군사건 특화 서비스" },
  { to: "/lawyers", title: "변호사 소개", desc: "전문 분야별 소속 변호사 프로필" },
  { to: "/blog", title: "블로그", desc: "실무 이슈와 판례 해설" },
];

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="페이지를 찾을 수 없습니다"
        description="요청하신 페이지를 찾을 수 없습니다. 법무법인 하이로 홈으로 이동해 주세요."
        noindex
      />
      <section
        className="section"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          textAlign: "center",
          paddingTop: 80,
          paddingBottom: 40,
        }}
      >
        <div style={{ maxWidth: 620, padding: "0 24px" }}>
          <p
            className="font-en"
            style={{
              fontSize: 14,
              letterSpacing: "0.3em",
              color: "var(--accent-gold)",
              marginBottom: 16,
            }}
          >
            404 — NOT FOUND
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 300,
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            페이지를 찾을 수 없습니다
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: 36 }}>
            요청하신 페이지가 이동되었거나 삭제되었을 수 있습니다.<br />
            주소를 다시 확인하시거나 아래에서 원하시는 정보를 찾아보세요.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/"
              style={{
                padding: "12px 28px",
                minHeight: 44,
                fontSize: 14,
                fontWeight: 500,
                background: "var(--accent-gold)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              홈으로
            </Link>
            <Link
              to="/consultation"
              style={{
                padding: "12px 28px",
                minHeight: 44,
                fontSize: 14,
                fontWeight: 500,
                background: "transparent",
                color: "var(--text-secondary)",
                textDecoration: "none",
                border: "1px solid var(--gray-100)",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              상담 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 연관 콘텐츠 카드 — 주요 섹션으로 회수 유도 */}
      <section className="section" style={{ paddingTop: 20, paddingBottom: 80, background: "var(--bg-primary)" }}>
        <div className="container" style={{ maxWidth: 960, padding: "0 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 20, textAlign: "center" }}>
            이런 페이지는 어떠세요?
          </h2>
          <ul
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {RELATED_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  style={{
                    display: "block",
                    padding: "20px 22px",
                    background: "#fff",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 4,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
