/**
 * 업무분야 페이지 — 법무법인 하이로 4대 전문 분야 (불법파견·게임사기·노동·군사건)
 * 의뢰인 고민 → 대표 분야 → 차별점 → 분야 선택 카드 → CTA
 */
import { Link } from "react-router-dom";
import {
  ArrowRight, Phone,
  AlertTriangle, CheckCircle2, Shield, Clock, Users, Target,
  Briefcase, Gamepad2, HardHat, Award,
} from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

/* ── 의뢰인 고민 ── */
const PAIN_POINTS = [
  { icon: AlertTriangle, text: "도급계약이라는데 실제로는 파견처럼 일하고 있다" },
  { icon: AlertTriangle, text: "온라인 게임 아이템·재화 거래 사기로 큰 손해를 입었다" },
  { icon: AlertTriangle, text: "임금체불·부당해고로 정당한 권리를 빼앗기고 있다" },
  { icon: AlertTriangle, text: "군에서 부당한 징계·처분을 받아 억울하다" },
  { icon: AlertTriangle, text: "산업재해를 당했지만 보상이 제대로 되지 않는다" },
  { icon: AlertTriangle, text: "군 복무 중 발생한 사건으로 형사절차에 직면해 있다" },
];

/* ── 핵심 업무 분야 ── */
const CASE_RESULTS = [
  { amount: "불법", unit: "파견", label: "위장도급·파견법 위반 구제 전문", category: "불법파견" },
  { amount: "게임", unit: "사기", label: "아이템 거래·계정 도용 형사대응", category: "게임사기" },
  { amount: "노동", unit: "분쟁", label: "임금체불·부당해고·산재 대응", category: "노동" },
  { amount: "군", unit: "사건", label: "군형사·군징계·국가배상 전문", category: "군사건" },
];

/* ── 전문 로펌 차별점 ── */
const ADVANTAGES = [
  {
    icon: Target,
    title: "특수 분야만 집중합니다",
    desc: "일반 종합 법률사무소가 어려워하는 불법파견·게임사기·노동·군사건만을 깊이 다루어, 사건 유형별 판례와 실무 노하우를 축적해 왔습니다.",
  },
  {
    icon: Shield,
    title: "현장과 절차를 모두 이해합니다",
    desc: "사업장 실태조사, 게임 운영사 약관, 노동위원회 심판, 군 수사·군사법원 절차까지—각 분야 고유의 절차를 직접 다뤄본 변호사가 사건을 맡습니다.",
  },
  {
    icon: Clock,
    title: "신속한 초기 대응",
    desc: "불법파견 진정, 사기 형사고소, 부당해고 구제신청, 군 징계 항고 모두 시한이 짧습니다. 초기 상담 후 48시간 내 전략 보고서를 제공합니다.",
  },
  {
    icon: Users,
    title: "원스톱 절차 처리",
    desc: "민사·형사·노동위원회·행정심판·군사법원까지 사건 단계별 절차를 하나의 팀이 일관되게 처리하여, 사건의 연속성과 효율을 보장합니다.",
  },
];

/* ── 4대 분야 카드 ── */
const AREAS = [
  {
    to: "/practice/illegal-dispatch",
    image: "/construction-hero3.jpg",
    icon: Briefcase,
    label: "ILLEGAL DISPATCH",
    title: "불법파견",
    desc: "위장도급·불법파견 판단부터 직접고용 청구, 차별시정, 파견법 위반 형사대응까지 — 도급의 외형 뒤에 숨은 파견의 실질을 가려내 의뢰인의 권리를 회복합니다.",
    highlights: ["위장도급·불법파견 진정", "직접고용 청구·차별시정", "파견법 위반 형사대응", "원·하청 노무 자문"],
  },
  {
    to: "/practice/game-fraud",
    image: "/realestate-hero.jpg",
    icon: Gamepad2,
    label: "GAME FRAUD",
    title: "게임사기",
    desc: "현금 아이템 거래 사기, 계정 도용·해킹, 게임머니·재화 편취, 운영사 부당 제재까지 — 온라인 게임 환경에서 벌어지는 모든 사기·분쟁에 형사·민사 양면으로 대응합니다.",
    highlights: ["아이템·계정 거래 사기 형사고소", "해킹·도용 피해 구제", "게임머니 편취 민사소송", "운영사 제재 이의제기"],
  },
  {
    to: "/practice/labor",
    image: "/construction-hero3.jpg",
    icon: HardHat,
    label: "LABOR LAW",
    title: "노동",
    desc: "임금체불, 부당해고, 산업재해, 직장 내 괴롭힘, 노조 활동 보장까지 — 근로기준법·산재보험법·노동조합법 전 영역에서 근로자의 권리를 옹호합니다.",
    highlights: ["임금체불·퇴직금 청구", "부당해고 구제신청", "산업재해 보상·민사", "직장 내 괴롭힘 대응"],
  },
  {
    to: "/practice/military",
    image: "/realestate-hero.jpg",
    icon: Award,
    label: "MILITARY CASES",
    title: "군사건",
    desc: "군형사사건, 군 징계·인사처분 항고, 국가배상, 병역 관련 분쟁까지 — 군 수사·군사법원·항고심사위원회·행정법원의 절차를 이해하는 변호인이 끝까지 동행합니다.",
    highlights: ["군형사사건 변호", "군 징계·인사처분 항고", "국가배상·산재 청구", "병역·전공상 분쟁"],
  },
];

export default function PracticePage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <Seo
        path="/practice"
        title="업무분야 — 불법파견·게임사기·노동·군사건 전문"
        description="법무법인 하이로는 불법파견, 게임사기, 노동, 군사건만을 전문으로 다루는 특화 로펌입니다. 사건 유형별 판례와 절차를 깊이 이해하는 변호사가 직접 상담합니다."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "업무분야", path: "/practice" },
        ])}
      />
      <PublicHero
        eyebrow="ILLEGAL DISPATCH · GAME FRAUD · LABOR · MILITARY"
        title="특수 분야, 결과로 증명합니다"
        description={"불법파견·게임사기·노동·군사건만 깊이 파고든 전문성으로\n의뢰인의 권리와 이익을 끝까지 지켜드립니다"}
        primaryAction={{ to: "/consultation", label: "상담 예약", icon: <Phone size={15} /> }}
        secondaryAction={{ href: "tel:02-6925-6757", label: "02-6925-6757" }}
      />

      {/* ━━━ 4대 분야 임팩트 ━━━ */}
      <section style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", transform: "translateY(-48px)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 reveal" style={{ background: "var(--bg-dark)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            {CASE_RESULTS.map((r, i) => (
              <div key={i} className="text-center" style={{ padding: "32px 16px", borderRight: i < 3 ? "1px solid var(--white-08)" : "none" }}>
                <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent-gold)", marginBottom: 8 }}>{r.category}</p>
                <p className="font-serif" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                  {r.amount}<span style={{ fontSize: "0.5em", fontWeight: 300, color: "var(--white-60)" }}> {r.unit}</span>
                </p>
                <p style={{ fontSize: 12, color: "var(--white-40)", marginTop: 6 }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 의뢰인 고민 공감 ━━━ */}
      <section style={{ background: "#fff", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <SectionHeading title="이런 문제로 고민하고 계신가요?" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {PAIN_POINTS.map((p, i) => (
              <SurfaceCard key={i} className="reveal flex items-center gap-4" style={{ padding: "18px 24px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)" }}>
                <p style={{ fontSize: 14, color: "var(--gray-600)", fontWeight: 400, lineHeight: 1.6 }}>&quot;{p.text}&quot;</p>
              </SurfaceCard>
            ))}
          </div>
          <p className="text-center reveal" style={{ marginTop: 32, fontSize: 15, color: "var(--accent-gold)", fontWeight: 500 }}>
            법무법인 하이로가 해결의 길을 함께 찾아드립니다.
          </p>
        </div>
      </section>

      {/* ━━━ 왜 특화 로펌인가 ━━━ */}
      <section style={{ background: "var(--bg-primary)", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionHeading eyebrow="WHY SPECIALIST" title="왜 특화 로펌이어야 하는가" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {ADVANTAGES.map((a, i) => {
              const Icon = a.icon;
              return (
                <SurfaceCard key={i} className="reveal flex gap-5" style={{ padding: "32px 28px" }}>
                  <div style={{ width: 52, height: 52, background: "var(--accent-gold-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={24} strokeWidth={1.5} color="var(--accent-gold)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{a.title}</h3>
                    <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{a.desc}</p>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ 분야 선택 카드 ━━━ */}
      <section style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading eyebrow="PRACTICE AREAS" title="전문 분야를 선택하세요" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
            {AREAS.map((area, i) => {
              const Icon = area.icon;
              return (
                <SurfaceCard key={i} as={Link} to={area.to} className="reveal group block" style={{ textDecoration: "none", overflow: "hidden" }}>
                  <div className="relative overflow-hidden" style={{ height: 220 }}>
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${area.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between" style={{ padding: "28px 28px" }}>
                      <div>
                        <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 6 }}>{area.label}</p>
                        <h2 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 500, color: "#fff" }}>{area.title}</h2>
                      </div>
                      <Icon size={36} strokeWidth={1.2} color="rgba(255,255,255,0.85)" />
                    </div>
                  </div>
                  <div style={{ padding: "28px 28px 32px" }}>
                    <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300, marginBottom: 20 }}>{area.desc}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                      {area.highlights.map((h, j) => (
                        <li key={j} className="flex items-center gap-2" style={{ fontSize: 13.5, color: "var(--gray-600)", padding: "5px 0" }}>
                          <CheckCircle2 size={14} color="var(--accent-gold)" strokeWidth={2} />{h}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-flex items-center gap-2 font-en transition-all duration-300 group-hover:gap-3" style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-gold)" }}>
                      자세히 보기 <ArrowRight size={14} />
                    </span>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)", padding: "80px 24px" }}>
        <div className="text-center reveal" style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="sep mx-auto" style={{ marginBottom: 32 }} />
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 300, color: "#fff", marginBottom: 16, lineHeight: 1.5 }}>
            분쟁은 시간이 지날수록 불리해집니다
          </h2>
          <p style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.8, fontWeight: 300, marginBottom: 12 }}>
            초기 대응이 사건의 결과를 결정합니다.
          </p>
          <p style={{ fontSize: 14, color: "var(--white-40)", lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
            48시간 내 사건 분석 보고서를 제공해드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "16px 40px", fontSize: 15, fontWeight: 600 }}>
              <Phone size={16} /> 지금 상담 예약하기
            </Link>
            <a href="tel:02-6925-6757" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "16px 40px", fontSize: 15 }}>
              02-6925-6757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
