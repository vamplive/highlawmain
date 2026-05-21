/** 개인정보처리방침 전용 페이지 — 상담 신청 모달과 같은 본문을 공유한다 */
import PrivacyContent from "../consultation/PrivacyContent";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";

export default function PrivacyPage() {
  return (
    <section className="section" style={{ background: "#fff", minHeight: "60vh" }}>
      <Seo
        path="/privacy"
        title="개인정보처리방침"
        description="법무법인 하이로의 개인정보 수집·이용 동의서 및 처리방침 전문."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "개인정보처리방침", path: "/privacy" },
        ])}
      />
      <div className="container" style={{ maxWidth: 760, padding: "0 24px" }}>
        <header style={{ textAlign: "center", marginBottom: 40 }}>
          <p className="font-en" style={{ fontSize: 12, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>
            PRIVACY POLICY
          </p>
          <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
            개인정보처리방침
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>시행일 2026년 5월 6일</p>
        </header>
        <article style={{ fontSize: 14, lineHeight: 1.9, color: "#333" }}>
          <PrivacyContent />
        </article>
      </div>
    </section>
  );
}
