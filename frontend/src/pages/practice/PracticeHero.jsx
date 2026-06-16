/**
 * 건설/부동산 페이지 공통 히어로.
 * 배경 이미지·브레드크럼·헤딩·서브카피만 페이지별로 다르고
 * 레이아웃·CTA·우측 통계는 동일하므로 props로 분기.
 */
import { Link } from "react-router-dom";
import { ChevronRight, Phone } from "lucide-react";

export default function PracticeHero({
  backgroundImage,
  backgroundPosition = "center 30%",
  breadcrumbLabel,
  headingMain,
  headingAccent,
  description,
  stats,
}) {
  return (
    <section className="practice-hero relative flex items-center justify-center overflow-hidden" style={{ height: "70vh", minHeight: 500 }}>
      <div className="absolute inset-0" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition, backgroundRepeat: "no-repeat" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,15,20,0.87) 0%, rgba(17,29,42,0.76) 40%, rgba(22,36,51,0.80) 70%, rgba(13,21,32,0.90) 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 150, background: "linear-gradient(to top, #fff, transparent)" }} />

      <div className="relative" style={{ maxWidth: 900, padding: "0 24px", zIndex: 2, width: "100%" }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div style={{ maxWidth: 560 }}>
            <div className="reveal flex items-center gap-2" style={{ marginBottom: 20 }}>
              <Link to="/practice" className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--white-40)", textDecoration: "none" }}>PRACTICE</Link>
              <ChevronRight size={12} color="var(--white-20)" />
              <span className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "#fff" }}>{breadcrumbLabel}</span>
            </div>

            <h1 className="font-serif-kr reveal" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.35, marginBottom: 24 }}>
              {headingMain}
              <br /><span style={{ fontWeight: 500, color: "#fff" }}>{headingAccent}</span>
            </h1>
            <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.9, fontWeight: 300, marginBottom: 36 }}>
              {description}
            </p>
            <div className="reveal flex flex-wrap gap-3">
              <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "15px 32px", fontSize: 14, fontWeight: 500 }}>
                <Phone size={15} /> 상담 예약하기
              </Link>
              <a href="#lifecycle" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "15px 32px", fontSize: 13, letterSpacing: "0.08em" }}>
                서비스 알아보기 <ChevronRight size={14} />
              </a>
            </div>
          </div>

          <div className="hidden md:flex flex-col gap-6 reveal" style={{ paddingBottom: 8 }}>
            {stats.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, border: "1px solid var(--white-15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.icon size={16} color="#fff" />
                </div>
                <div>
                  <p className="font-serif" style={{ fontSize: 20, fontWeight: 500, color: "#fff", lineHeight: 1.2 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "var(--white-40)" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
