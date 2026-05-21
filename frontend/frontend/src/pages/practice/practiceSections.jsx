/**
 * 건설/부동산 분야 페이지 공통 섹션 컴포넌트.
 * 두 페이지가 구조는 같고 텍스트·데이터만 다른 부분을
 * props로 받아 렌더링한다.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, CheckCircle2, ArrowRight, Phone, Quote,
} from "lucide-react";

/** 히어로 아래 성공 사례 4컬럼 카드 (데스크톱 전용, -48px 오버랩) */
export function CaseResultsRow({ cases }) {
  return (
    <section className="hidden md:block" style={{ background: "#fff", padding: "0 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", transform: "translateY(-48px)" }}>
        <div className="grid grid-cols-4 gap-0 reveal" style={{ background: "var(--bg-dark)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          {cases.map((r, i) => (
            <div key={i} className="text-center group" style={{ padding: "28px 16px", borderRight: i < 3 ? "1px solid var(--white-08)" : "none", cursor: "default" }}>
              <p className="font-serif" style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 500, color: "var(--accent-gold)", lineHeight: 1 }}>
                {r.amount}{r.unit && <span style={{ fontSize: "0.5em", fontWeight: 300, color: "var(--white-60)" }}> {r.unit}</span>}
              </p>
              <p style={{ fontSize: 12.5, color: "var(--white-60)", marginTop: 6, fontWeight: 500 }}>{r.label}</p>
              <p style={{ fontSize: 11, color: "var(--white-40)", marginTop: 4, fontWeight: 300, lineHeight: 1.5 }}>{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 의뢰인 고민 공감 섹션 (인용형 카드 그리드) */
export function PainPointsSection({ painPoints, ctaCopy }) {
  return (
    <section style={{ background: "#fff", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="text-center reveal" style={{ marginBottom: 40 }}>
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>
            이런 문제로 고민하고 계신가요?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
          {painPoints.map((p, i) => (
            <div key={i} className="reveal flex items-center gap-3" style={{ padding: "16px 20px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)" }}>
              <p style={{ fontSize: 14, color: "var(--gray-600)", fontWeight: 400, lineHeight: 1.6 }}>"{p}"</p>
            </div>
          ))}
        </div>
        <p className="text-center reveal" style={{ marginTop: 28, fontSize: 15, color: "var(--accent-gold)", fontWeight: 500 }}>
          {ctaCopy}
        </p>
      </div>
    </section>
  );
}

/** 모바일 전용 통계 그리드 */
export function MobileStatsSection({ stats }) {
  return (
    <section className="md:hidden" style={{ background: "var(--bg-dark)", padding: "32px 24px" }}>
      <div className="grid grid-cols-2 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <s.icon size={18} color="var(--accent-gold)" />
            <div>
              <p className="font-serif" style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "var(--white-40)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 프로젝트 라이프사이클 — 탭 + 활성 단계 콘텐츠 + 페이지 인디케이터 */
export function LifecycleSection({ lifecycle, eyebrow, heading, subheading }) {
  const [activePhase, setActivePhase] = useState(0);

  return (
    <section id="lifecycle" style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="text-center reveal" style={{ marginBottom: 56 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>{eyebrow}</p>
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>
            {heading}
          </h2>
          <p style={{ fontSize: 14, color: "var(--gray-400)", marginTop: 14, fontWeight: 300, maxWidth: 560, margin: "14px auto 0" }}>
            {subheading}
          </p>
        </div>

        <div className="reveal lifecycle-tabs flex justify-center gap-0" style={{ marginBottom: 48, borderBottom: "1px solid var(--border-subtle)" }}>
          {lifecycle.map((p, i) => (
            <button key={i} onClick={() => setActivePhase(i)} className="font-en transition-all duration-300" style={{ padding: "16px 32px", fontSize: 12, letterSpacing: "0.12em", color: activePhase === i ? "var(--accent-gold)" : "var(--gray-300)", fontWeight: activePhase === i ? 600 : 400, borderBottom: activePhase === i ? "2px solid var(--accent-gold)" : "2px solid transparent", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 8, fontWeight: 300 }}>{p.phase}</span>{p.subtitle}
            </button>
          ))}
        </div>

        <div className="reveal" style={{ maxWidth: 800, margin: "0 auto" }}>
          {lifecycle.map((phase, i) => (
            <div key={i} style={{ display: activePhase === i ? "block" : "none", animation: "fadeIn 0.4s ease" }}>
              <div className="flex flex-col md:flex-row gap-8">
                <div style={{ flex: "0 0 280px" }}>
                  <p style={{ fontSize: 48, fontWeight: 200, color: "var(--accent-gold)", lineHeight: 1, marginBottom: 12, fontFamily: "var(--font-serif)" }}>{phase.phase}</p>
                  <h3 className="font-serif-kr" style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, color: "var(--text-primary)" }}>{phase.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{phase.desc}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {phase.services.map((s, j) => (
                      <li key={j} className="flex items-center gap-3" style={{ padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 14.5, color: "var(--gray-600)", fontWeight: 400 }}>
                        <CheckCircle2 size={16} color="var(--accent-gold)" strokeWidth={1.8} />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 reveal" style={{ marginTop: 40 }}>
          {lifecycle.map((_, i) => (
            <button key={i} onClick={() => setActivePhase(i)} style={{ width: activePhase === i ? 32 : 8, height: 8, borderRadius: 4, background: activePhase === i ? "var(--accent-gold)" : "var(--gray-100)", border: "none", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 전문 분야 타일 — 클릭 시 디테일 펼침 */
export function PracticeTilesSection({ practices, heading }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <section style={{ background: "var(--bg-primary)", padding: "var(--section-py) 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="text-center reveal" style={{ marginBottom: 56 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>PRACTICE AREAS</p>
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>{heading}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
          {practices.map((area, i) => {
            const Icon = area.icon;
            const isOpen = expandedIdx === i;
            return (
              <div key={i} className="reveal cursor-pointer" onClick={() => setExpandedIdx(isOpen ? null : i)} style={{ background: "#fff", border: isOpen ? "1px solid rgba(26,58,107,0.2)" : "1px solid var(--border-subtle)", transition: "all 0.35s ease", boxShadow: isOpen ? "0 12px 40px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                <div style={{ padding: "32px 28px" }}>
                  <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: "var(--accent-gold-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={22} strokeWidth={1.5} color="var(--accent-gold)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{area.title}</h3>
                      <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--gray-300)" }}>{area.subtitle}</p>
                    </div>
                    <ChevronRight size={16} color="var(--gray-300)" style={{ transition: "transform 0.3s", transform: isOpen ? "rotate(90deg)" : "rotate(0)", marginTop: 6, flexShrink: 0 }} />
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{area.desc}</p>
                  <div style={{ maxHeight: isOpen ? 360 : 0, opacity: isOpen ? 1 : 0, overflow: "hidden", transition: "all 0.4s ease" }}>
                    <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 18, paddingTop: 16 }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {area.details.map((d, j) => (
                          <li key={j} className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--gray-600)", padding: "6px 0" }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent-gold)", flexShrink: 0 }} />{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 의뢰인 추천 인용문 2단 그리드 */
export function TestimonialsSection({ testimonials }) {
  return (
    <section style={{ background: "#fff", padding: "80px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="text-center reveal" style={{ marginBottom: 48 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>CLIENT TESTIMONIALS</p>
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>의뢰인이 말하는 하이로</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
          {testimonials.map((t, i) => (
            <div key={i} className="reveal" style={{ padding: "36px 32px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)", position: "relative" }}>
              <Quote size={28} color="rgba(26,58,107,0.15)" style={{ position: "absolute", top: 20, right: 24 }} />
              <p style={{ fontSize: 14.5, color: "var(--gray-600)", lineHeight: 1.9, fontWeight: 300, fontStyle: "italic", marginBottom: 20 }}>"{t.quote}"</p>
              <p style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 500 }}>— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 주요 실적 — 어두운 배경 + 통계 + 카테고리별 항목 */
export function TrackRecordSection({ stats, records, heading }) {
  return (
    <section style={{ background: "linear-gradient(160deg, #0a0f14 0%, #162433 50%, #0d1520 100%)", padding: "80px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="text-center reveal" style={{ marginBottom: 48 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>TRACK RECORD</p>
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "#fff" }}>{heading}</h2>
        </div>
        <div className="hidden md:grid grid-cols-4 gap-0 reveal" style={{ marginBottom: 48, borderBottom: "1px solid var(--white-08)", paddingBottom: 40 }}>
          {stats.map((s, i) => (
            <div key={i} className="text-center" style={{ borderRight: i < 3 ? "1px solid var(--white-08)" : "none" }}>
              <p className="font-serif" style={{ fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 400, color: "var(--accent-gold)", marginBottom: 6 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--white-40)" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 stagger">
          {records.map((r, i) => (
            <div key={i} className="reveal flex items-start gap-4" style={{ padding: "20px 0", borderBottom: "1px solid var(--white-08)" }}>
              <span className="font-en" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--accent-gold)", background: "rgba(26,58,107,0.1)", padding: "4px 10px", flexShrink: 0, marginTop: 2, whiteSpace: "nowrap" }}>{r.category}</span>
              <p style={{ fontSize: 14, color: "var(--white-60)", fontWeight: 300, lineHeight: 1.7 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 인사이트(블로그) 미리보기 3컬럼 */
export function InsightsSection({ posts, heading }) {
  return (
    <section style={{ background: "#fff", padding: "80px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="flex items-end justify-between reveal" style={{ marginBottom: 40 }}>
          <div>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>INSIGHTS</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>{heading}</h2>
          </div>
          <Link to="/blog" className="hidden md:inline-flex items-center gap-2 font-en transition-all duration-300 hover:gap-3" style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-gold)", textDecoration: "none" }}>
            VIEW ALL <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {posts.map((post, i) => (
            <Link key={i} to="/blog" className="reveal group block" style={{ padding: "28px 24px", border: "1px solid var(--border-subtle)", textDecoration: "none", transition: "all 0.3s", background: "#fff" }}>
              <span className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent-gold)", display: "block", marginBottom: 12 }}>{post.tag}</span>
              <h3 className="group-hover:text-[var(--accent-gold)] transition-colors" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 16 }}>{post.title}</h3>
              <p style={{ fontSize: 12, color: "var(--gray-300)" }}>{post.date}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 페이지 하단 상담 유도 CTA */
export function PracticeCtaSection() {
  return (
    <section style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f1d32 100%)", padding: "80px 24px" }}>
      <div className="text-center reveal" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="sep mx-auto" style={{ marginBottom: 32 }} />
        <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 300, color: "#fff", marginBottom: 16, lineHeight: 1.5 }}>
          분쟁은 시간이 지날수록 불리해집니다
        </h2>
        <p style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.8, fontWeight: 300, marginBottom: 8 }}>
          초기 대응이 사건의 결과를 결정합니다.
        </p>
        <p style={{ fontSize: 14, color: "var(--white-40)", lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
          48시간 내 사건 분석 보고서를 제공합니다.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "15px 36px", fontSize: 14, fontWeight: 500 }}>
            <Phone size={15} /> 상담 예약
          </Link>
          <a href="tel:준비 중" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "15px 36px", fontSize: 14 }}>준비 중</a>
        </div>
      </div>
    </section>
  );
}
