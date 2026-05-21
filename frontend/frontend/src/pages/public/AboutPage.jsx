/** 사무소 소개 페이지 — 법무법인 하이로 개요, 핵심 가치, 연혁 */
import { Handshake, Scale, Landmark, Lightbulb } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import { useSiteSettingsPage } from "../../hooks/useSiteSettings";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd, buildLegalServiceJsonLd } from "../../lib/seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

const VALUES = [
  {
    title: "신뢰",
    subtitle: "TRUST",
    desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다.",
    icon: Handshake,
  },
  {
    title: "전문성",
    subtitle: "EXPERTISE",
    desc: "불법파견·게임사기·노동·군사건 등 특수 분야에 한정해 깊이 있는 실무 경험을 축적했습니다.",
    icon: Scale,
  },
  {
    title: "헌신",
    subtitle: "DEDICATION",
    desc: "의뢰인의 사건을 비즈니스처럼 정교하게 관리하며, 최선의 결론을 만들기 위해 함께합니다.",
    icon: Landmark,
  },
  {
    title: "혁신",
    subtitle: "INNOVATION",
    desc: "최신 판례와 데이터 분석을 활용한 선진적 법률 서비스를 지향합니다.",
    icon: Lightbulb,
  },
];

const ABOUT_DEFAULTS = {
  hero: { heading: "사무소 소개", subheading: "ABOUT HIGH & LAW FIRM", description: "불법파견·게임사기·노동·군사건—\n특수 분야의 절차와 판례를 깊이 이해하는 변호사가 직접 사건을 다룹니다." },
  philosophy: { heading: "특수 분야의 깊이로\n결과를 만드는 로펌", description: "법무법인 하이로는 불법파견·게임사기·노동·군사건의 4개 분야만 집중적으로 다룹니다. 첫 상담부터 사건 종결까지, 해당 분야의 절차와 판례를 깊이 이해하는 변호사가 직접 사건을 진행합니다." },
  values: { items: [
    { title: "신뢰", subtitle: "TRUST", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." },
    { title: "전문성", subtitle: "EXPERTISE", desc: "불법파견·게임사기·노동·군사건 등 특수 분야에 한정해 깊이 있는 실무 경험을 축적했습니다." },
    { title: "헌신", subtitle: "DEDICATION", desc: "의뢰인의 사건을 비즈니스처럼 정교하게 관리하며, 최선의 결론을 만들기 위해 함께합니다." },
    { title: "혁신", subtitle: "INNOVATION", desc: "최신 판례와 데이터 분석을 활용한 선진적 법률 서비스를 지향합니다." },
  ] },
  history: { items: [
    { year: "설립", text: "법무법인 하이로 출범 — 불법파견·게임사기·노동·군사건 특화" },
    { year: "구성", text: "대표변호사 조덕재·김범·강민구 체제 정립" },
    { year: "확장", text: "서울특별시 강남구 테헤란로 141, 15층 사무소 운영" },
    { year: "현재", text: "특수 분야 사건에 한해 의뢰인 직접 상담 원칙 유지" },
  ] },
};

export default function AboutPage() {
  const ref = useReveal();
  const { settings } = useSiteSettingsPage("about", ABOUT_DEFAULTS);

  return (
    <div ref={ref}>
      <Seo
        path="/about"
        title="사무소 소개"
        description="법무법인 하이로의 핵심 가치 — 신뢰·전문성·헌신·혁신. 불법파견·게임사기·노동·군사건 특수 분야에 집중하는 로펌입니다."
        jsonLd={[
          buildLegalServiceJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "사무소 소개", path: "/about" },
          ]),
        ]}
      />
      <PublicHero
        image={null}
        eyebrow={settings.hero.subheading}
        title={settings.hero.heading}
        description={settings.hero.description}
      />

      {/* ==================== 소개 문구 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <SectionHeading
            eyebrow="OUR PHILOSOPHY"
            title={settings.philosophy.heading}
            description={settings.philosophy.description}
          />

          {/* 핵심 가치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger" style={{ marginBottom: 80 }}>
            {settings.values.items.map((v, i) => {
              const Icon = VALUES[i]?.icon;
              return (
                <SurfaceCard
                  key={i}
                  className="reveal"
                  style={{ padding: "36px 32px" }}
                >
                  {Icon && <div style={{ marginBottom: 12 }}><Icon size={30} strokeWidth={1.3} color="var(--accent-gold)" /></div>}
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{v.title}</h3>
                  <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--gray-200)", marginBottom: 16 }}>{v.subtitle}</p>
                  <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{v.desc}</p>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 연혁 ==================== */}
      <section style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 800 }}>
          <SectionHeading eyebrow="HISTORY" title="사무소 연혁" />
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            {settings.history.items.map((item, i) => (
              <div
                key={i}
                className="reveal flex items-start gap-6"
                style={{ padding: "20px 0", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span className="font-en" style={{ fontSize: 18, fontWeight: 300, color: "var(--accent-gold)", minWidth: 60 }}>
                  {item.year}
                </span>
                <span style={{ fontSize: 15, color: "#444", fontWeight: 300, paddingTop: 2 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
