/** 사무소 소개 페이지 — 법무법인 하이로 개요, 핵심 가치, 연혁, 인사말, 공익활동, 오시는 길 */
import { Link, useLocation } from "react-router-dom";
import { Handshake, Scale, Landmark, Lightbulb } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import { useSiteSettingsPage } from "../../hooks/useSiteSettings";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd, buildLegalServiceJsonLd } from "../../lib/seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

const VALUES = [
  {
    title: "신의성실",
    subtitle: "LOYALTY",
    desc: "의뢰인의 신뢰를 가장 소중한 가치로 여기며, 어떠한 순간에도 의뢰인의 이익과 권리를 최우선으로 수호합니다.",
    icon: Handshake,
  },
  {
    title: "품격",
    subtitle: "DIGNITY",
    desc: "깊이 있는 학문적 성찰과 품위 있는 변론을 통해, 하이엔드 서비스에 걸맞은 차별화된 사법적 결과를 창출합니다.",
    icon: Landmark,
  },
  {
    title: "정직",
    subtitle: "INTEGRITY",
    desc: "사건의 실체를 투명하게 공유하고, 흔들림 없는 법조 윤리를 준수하며 타협하지 않는 정의를 지향합니다.",
    icon: Scale,
  },
  {
    title: "전문성",
    subtitle: "EXPERTISE",
    desc: "대형 로펌 출신의 풍부한 실무 경험과 고도의 정밀 법리 분석으로 클라이언트에게 가장 정교한 솔루션을 제시합니다.",
    icon: Lightbulb,
  },
];

const ABOUT_DEFAULTS = {
  hero: { heading: "사무소 소개", subheading: "ABOUT HIGHLAW LAWFIRM", description: "노무·인사, 기업, 국제, 엔터테인먼트, 게임, 방산 등 각 분야의 인정받은 변호사들이 최적화된 법률 솔루션을 제공합니다." },
  philosophy: { heading: "특수 분야의 깊이로\n결과를 만드는 로펌", description: "법무법인 하이로는 불법파견·게임사기·노동·군사건의 4개 분야만 집중적으로 다룹니다. 첫 상담부터 사건 종결까지, 해당 분야의 절차와 판례를 깊이 이해하는 변호사가 직접 사건을 진행합니다." },
  values: { items: [
    { title: "신의성실", subtitle: "LOYALTY", desc: "의뢰인의 신뢰를 가장 소중한 가치로 여기며, 어떠한 순간에도 의뢰인의 이익과 권리를 최우선으로 수호합니다." },
    { title: "품격", subtitle: "DIGNITY", desc: "깊이 있는 학문적 성찰과 품위 있는 변론을 통해, 하이엔드 서비스에 걸맞은 차별화된 사법적 결과를 창출합니다." },
    { title: "정직", subtitle: "INTEGRITY", desc: "사건의 실체를 투명하게 공유하고, 흔들림 없는 법조 윤리를 준수하며 타협하지 않는 정의를 지향합니다." },
    { title: "전문성", subtitle: "EXPERTISE", desc: "대형 로펌 출신의 풍부한 실무 경험과 고도의 정밀 법리 분석으로 클라이언트에게 가장 정교한 솔루션을 제시합니다." },
  ] },
  history: { items: [
    { year: "설립", text: "법무법인 하이로 출범 — 불법파견·게임사기·노동·군사건 특화" },
    { year: "구성", text: "대표변호사 조덕재·김범·강민구 체제 정립" },
    { year: "확장", text: "서울특별시 강남구 테헤란로 141, 15층 사무소 운영" },
    { year: "현재", text: "특수 분야 사건에 한해 의뢰인 직접 상담 원칙 유지" },
  ] },
};

const TABS = [
  { id: "greetings", label: "인사말", labelEn: "GREETINGS" },
  { id: "values", label: "핵심가치", labelEn: "VALUES" },
  { id: "directions", label: "오시는 길", labelEn: "DIRECTIONS" },
  { id: "probono", label: "공익활동", labelEn: "PRO BONO" },
  { id: "history", label: "연혁", labelEn: "HISTORY" },
];

export default function AboutPage() {
  const location = useLocation();
  const pathPart = location.pathname.split("/").pop();
  const activeTab = ["greetings", "values", "directions", "probono", "history"].includes(pathPart) ? pathPart : "greetings";

  const ref = useReveal();
  const { settings } = useSiteSettingsPage("about", ABOUT_DEFAULTS);

  const seoConfig = {
    greetings: {
      title: "인사말 | 법무법인 하이로",
      description: "법무법인 하이로 대표변호사의 인사말. Loyalty, Dignity, Integrity를 핵심 가치로 삼아 하이엔드 서비스를 제공합니다.",
      path: "/about/greetings",
      breadcrumbName: "인사말"
    },
    values: {
      title: "핵심가치 | 법무법인 하이로",
      description: "신뢰, 전문성, 헌신, 혁신. 법무법인 하이로의 4대 약속과 로펌 철학을 소개합니다.",
      path: "/about/values",
      breadcrumbName: "핵심가치"
    },
    directions: {
      title: "오시는 길 | 법무법인 하이로",
      description: "법무법인 하이로 서울 사무소 찾아오시는 길. 역삼역 4번 출구 도보 1분거리, 주차 및 대중교통 안내.",
      path: "/about/directions",
      breadcrumbName: "오시는 길"
    },
    probono: {
      title: "공익활동 | 법무법인 하이로",
      description: "사회적 책임과 온기를 채우는 하이로의 공익 활동. 군장병 권익 보호, 비정규직 노동자 법률 구조 등 실천 사례.",
      path: "/about/probono",
      breadcrumbName: "공익활동"
    },
    history: {
      title: "연혁 | 법무법인 하이로",
      description: "법무법인 하이로의 발자취와 주요 역사. 설립부터 오피스 확장 및 최고 파트너십 구축 과정.",
      path: "/about/history",
      breadcrumbName: "연혁"
    }
  };

  const activeSeo = seoConfig[activeTab] || seoConfig.greetings;

  return (
    <div ref={ref}>
      <Seo
        path={activeSeo.path}
        title={activeSeo.title}
        description={activeSeo.description}
        jsonLd={[
          buildLegalServiceJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "사무소 소개", path: "/about" },
            { name: activeSeo.breadcrumbName, path: activeSeo.path },
          ]),
        ]}
      />
      <PublicHero
        image="/realestate-hero.jpg"
        eyebrow={settings.hero.subheading}
        title={settings.hero.heading}
        description={settings.hero.description}
      />

      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content-active {
          animation: tabFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      {/* ==================== 탭 및 본문 통합 섹션 (소식 페이지 스타일 적용) ==================== */}
      <section className="section" style={{ background: "#fff", paddingTop: 48 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          
          {/* ==================== 5개 탭 네비게이션 ==================== */}
          <div 
            role="tablist"
            aria-label="소개 섹션 선택" 
            style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "12px", 
              flexWrap: "wrap",
              marginBottom: 56
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const targetPath = tab.id === "greetings" ? "/about" : `/about/${tab.id}`;
              return (
                <Link
                  key={tab.id}
                  to={targetPath}
                  style={{
                    padding: "10px 24px",
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    border: "1px solid",
                    borderColor: isActive ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                    borderRadius: 24,
                    background: isActive ? "var(--accent-gold)" : "transparent",
                    color: isActive ? "#fff" : "var(--gray-500)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.05em",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-selected={isActive}
                  role="tab"
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* ==================== 탭별 본문 내용 ==================== */}
          
          {/* 1. 인사말 탭 */}
          {activeTab === "greetings" && (
            <div className="tab-content-active" key="greetings" style={{ maxWidth: 760, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Introduction"
                title="Message from Partners"
              />
              <div style={{ color: "var(--text-secondary)", fontWeight: 300, fontSize: 15, lineHeight: 1.9, display: "flex", flexDirection: "column", gap: 24, marginBottom: 60, textAlign: "left" }}>
                <p>
                  <strong>법무법인 하이로</strong>는 <strong>Loyalty, Dignity, Integrity</strong>를 핵심 가치로 삼아, 클라이언트에게 최적의 법률 솔루션을 제공하기 위해 설립된 <strong>Premium Lawfirm Service</strong> 브랜드입니다.
                </p>
                <p>
                  우리는 단순히 법률 지식을 전달하는 데 그치지 않습니다. 각 사안의 본질을 꿰뚫는 전문성을 바탕으로 문제의 이면을 파고들어 그 흐름과 구조를 분석함으로써, 보다 근본적이고 지속 가능한 해결책을 제시하고자 하고 있습니다. 이는 HIGHLAW의 이름이 곧 ‘고객에 충실한 하이엔드 서비스’의 기준이 되고자 하는 우리의 다짐이기도 합니다.
                </p>
                <p>
                  하이로의 구성원들은 모두 대형로펌에서 우수한 성과를 인정받은 전문가로서, 각자의 분야에서 풍부한 실무 경험과 학문적 깊이를 겸비하고 있습니다. 민사·형사소송은 물론 인사·노무, 국제법무, 기업법무, 부동산·건설, 지식재산권, 군사법 등 폭넓은 분야에서 탁월한 역량을 검증받았습니다. 각 분야의 전문 변호사들이 협력해 정밀하고 전략적인 솔루션을 제시하며, 언제나 고객에게 가장 적합한 방식으로 최선의 결과를 제공하는 조력자가 되고자 합니다.
                </p>
                <p>
                  법무법인 하이로는 저희를 신뢰하는 클라이언트들이 언제든지 저희를 다시 찾아올 수 있는 믿음을 제공하고자 합니다. 한결같은 헌신과 지적인 품격, 그리고 변함없는 성실함으로 클라이언트의 신뢰를 지키고, 신뢰와 결과로 보답하는 법률 파트너가 되도록 하겠습니다.
                </p>
                <p>
                  언제나 맞춤형 <strong>HIGH-END SERVICE</strong>를 제공하기 위해 끊임없는 연구와 정직한 태도로 클라이언트와 여정을 함께하는 파트너가 되어드리도록 하겠습니다.
                </p>
                <p style={{ marginTop: 32, fontWeight: 500, color: "var(--text-primary)", textAlign: "right", fontSize: 16 }}>
                  법무법인 하이로 대표변호사 조덕재 · 김범 · 강민구
                </p>
              </div>
            </div>
          )}

          {/* 2. 핵심가치 탭 */}
          {activeTab === "values" && (
            <div className="tab-content-active" key="values">
              <SectionHeading
                eyebrow="OUR PHILOSOPHY"
                title="하이로의 철학"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger" style={{ marginBottom: 40 }}>
                {settings.values.items.map((v, i) => {
                  const Icon = VALUES[i]?.icon;
                  return (
                    <SurfaceCard
                      key={i}
                      style={{ padding: "36px 28px", display: "flex", flexDirection: "column", height: "100%" }}
                    >
                      {Icon && <div style={{ marginBottom: 16 }}><Icon size={30} strokeWidth={1.3} color="var(--accent-gold)" /></div>}
                      <h3 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{v.title}</h3>
                      <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--accent-gold)", marginBottom: 16 }}>{v.subtitle}</p>
                      <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300, flexGrow: 1 }}>{v.desc}</p>
                    </SurfaceCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 오시는 길 탭 */}
          {activeTab === "directions" && (
            <div className="tab-content-active" key="directions" style={{ maxWidth: 900, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="DIRECTIONS"
                title="법무법인 하이로 서울 사무소"
              />
              
              {/* 세련된 위치 지도 카드 */}
              <SurfaceCard style={{ padding: 0, overflow: "hidden", marginBottom: 36, border: "1px solid var(--border-subtle)" }}>
                <div style={{ width: "100%", position: "relative" }}>
                  <img 
                    src="/map.png"
                    alt="법무법인 하이로 오시는 길 지도 (역삼역 4번 출구 도보 1분)" 
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
                
                {/* 길찾기 버튼 영역 */}
                <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "20px 28px", borderBottom: "1px solid var(--border-subtle)", background: "#fbfbfc" }}>
                  <a 
                    href="https://map.naver.com/v5/search/%EB%B2%95%EB%AC%B5%EB%B2%95%EC%9D%B8%20%ED%95%98%EC%9D%B4%EB%A1%9C" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      background: "#03C75A", 
                      color: "#fff", 
                      fontSize: 13, 
                      fontWeight: 600, 
                      padding: "10px 24px", 
                      borderRadius: 6, 
                      textDecoration: "none", 
                      boxShadow: "0 2px 8px rgba(3,199,90,0.2)", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8,
                      transition: "all 0.2s"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    네이버지도 길찾기
                  </a>
                  <a 
                    href="https://map.kakao.com/?q=%EB%B2%95%EB%AC%B5%EB%B2%95%EC%9D%B8%20%ED%95%98%EC%9D%B4%EB%A1%9C" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      background: "#FEE500", 
                      color: "#191919", 
                      fontSize: 13, 
                      fontWeight: 600, 
                      padding: "10px 24px", 
                      borderRadius: 6, 
                      textDecoration: "none", 
                      boxShadow: "0 2px 8px rgba(254,229,0,0.15)", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8,
                      transition: "all 0.2s"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    카카오맵 길찾기
                  </a>
                </div>

                <div style={{ padding: "32px 28px" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <h5 style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>주소</h5>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6 }}>
                          서울특별시 강남구 테헤란로 141 (역삼KR빌딩) 15층 <br />
                          <span style={{ fontSize: 12, color: "var(--gray-400)" }}>(우편번호: 06132)</span>
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>지하철 이용 시</h5>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6 }}>
                          <strong>2호선 역삼역 4번 출구</strong>에서 선릉역 방향으로 도보 1~2분 (약 100m 직진 후 1층에 스타벅스가 있는 역삼KR빌딩 15층입니다.)
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>버스 이용 시</h5>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6 }}>
                          <strong>역삼역.포스코타워역삼</strong> 정류장 하차<br />
                          - 간선버스: 147, 242, 350 <br />
                          - 지선버스: 3412, 4432
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, borderLeft: "1px solid var(--border-subtle)", paddingLeft: "16px" }} className="md:border-l md:pl-8">
                      <div>
                        <h5 style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>주차 안내</h5>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6 }}>
                          건물 내 기계식 및 자주식 지하 주차장을 이용해 주세요.<br />
                          법률 상담 방문 차량에 한하여 <strong>2시간 무료 주차권</strong>을 인포데스크에서 제공해 드립니다.
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>대표 연락처</h5>
                        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 4 }}>
                          <span>대표전화: <strong>02-6925-6757</strong></span>
                          <span>팩스번호: 02-6925-6758</span>
                          <span>이메일: contact@highlaw.co.kr</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          )}

          {/* 4. 공익활동 탭 */}
          {activeTab === "probono" && (
            <div className="tab-content-active" key="probono">
              <SectionHeading
                eyebrow="PRO BONO"
                title="사회적 책임과 온기를 채우는 하이로의 공익 활동"
              />
              <div style={{ color: "var(--text-secondary)", fontWeight: 300, fontSize: 15, lineHeight: 1.8, marginBottom: 40, maxWidth: 800, margin: "0 auto 40px" }}>
                법무법인 하이로는 법치주의 확립과 사회 구성원 모두의 보편적 인권 옹호를 중요한 사명으로 여깁니다. 우리가 지닌 법률 전문성을 바탕으로 정의의 온기가 사회 곳곳에 미치도록 지속 가능한 사회공헌 활동을 실천합니다.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                {[
                  {
                    title: "군 장병 권익 및 인권 보호",
                    desc: "격오지에 근무하거나 비용 문제로 법적 조력을 받지 못해 부당한 징계나 군형사 위기에 처한 영외 군장병 및 하급 간부들을 위한 무료 소송 지원과 무료 전화 법률 상담 창구를 운영합니다.",
                    badge: "군장병 무료상담"
                  },
                  {
                    title: "취약 계층 노동자 법률 구조",
                    desc: "불법파견의 부당함에 직면한 비정규직 노동자, 그리고 임금 체불과 부당해고 등의 사각지대에 방치된 플랫폼 노동자 및 5인 미만 소규모 사업장 소속 근로자들의 신속한 보상과 법적 안정을 위해 힘씁니다.",
                    badge: "비정규직 노동법률지원"
                  },
                  {
                    title: "청년 게이머 및 디지털 소비자 권익 옹호",
                    desc: "대형 플랫폼 및 게임사들의 불공정 거래 조건이나 기만 행위에 처한 청년 게이머 집단의 정당한 권익 보호를 위해, 무료 공익 단체소송 대리 및 관련 법제 개선을 위한 학술 연구와 정책 제안을 정기적으로 추진합니다.",
                    badge: "게임소비자 권익보호"
                  },
                  {
                    title: "지역사회 상생 및 무료 법률 교육",
                    desc: "사법 접근성이 낮은 서민 가구와 예비 청년 창업자, 노동 분쟁 예방에 목마른 구직 청년층을 위해 필수적인 기초 노동법 지식과 생활 법률 세미나를 정기적으로 주최하여 지식을 공유합니다.",
                    badge: "무료 교육 나눔"
                  }
                ].map((activity, idx) => (
                  <SurfaceCard key={idx} style={{ padding: "32px 28px", display: "flex", flexDirection: "column", height: "100%" }} className="reveal">
                    <div style={{ alignSelf: "flex-start", background: "var(--accent-gold-light)", color: "var(--accent-gold)", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 4, marginBottom: 16 }}>
                      {activity.badge}
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{activity.title}</h4>
                    <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.7, fontWeight: 300, flexGrow: 1 }}>{activity.desc}</p>
                  </SurfaceCard>
                ))}
              </div>
            </div>
          )}

          {/* 5. 연혁 탭 */}
          {activeTab === "history" && (
            <div className="tab-content-active" key="history" style={{ maxWidth: 760, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="HISTORY"
                title="어제를 돌아보며 내일을 준비하는 하이로의 발자취"
              />
              
              <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", paddingLeft: 24, borderLeft: "2px solid var(--border-subtle)", textAlign: "left" }}>
                {[
                  {
                    year: "2026 - 현재",
                    title: "전문성 공고화 및 디지털 사법지원 시스템 고도화",
                    desc: "첫 상담부터 변호사가 모든 서면을 직접 전담하는 책임 상담제 및 인공지능 기반 사법 보조 데이터 분석 시스템을 구축하여 의뢰인 밀착 대응 시스템을 확대 고도화하였습니다."
                  },
                  {
                    year: "2025",
                    title: "서울 강남 오피스 확장 이전",
                    desc: "서울특별시 강남구 테헤란로 141 (역삼KR빌딩) 15층으로 오피스를 확장 이전하여, 불법파견 및 게임사기 관련 주요 거점 의뢰인들과 소통할 수 있는 프리미엄 컨설팅 룸과 인프라를 확충하였습니다."
                  },
                  {
                    year: "2024",
                    title: "동일 분야 최고 실력의 파트너십 완성",
                    desc: "노동법 및 불법파견 사건의 권위자인 조덕재 대표변호사, 게임 소송계의 선구자인 김범 대표변호사, 군사 전문 행정 분야의 강민구 대표변호사가 파트너십을 맺어 3대 대표변호사 체제를 정립하였습니다."
                  },
                  {
                    year: "2023",
                    title: "법무법인 하이로 공식 출범",
                    desc: "불법파견, 게임사기, 노동, 군사건 등 고유의 노하우가 집적된 4대 특수 사법 분야의 독보적인 법률 권익 수호를 기치로 법무법인 하이로가 설립되어 법조계에 첫발을 내디뎠습니다."
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ position: "relative", marginBottom: 40 }} className="reveal">
                    <div 
                      style={{ 
                        position: "absolute", 
                        left: -32, 
                        top: 4, 
                        width: 12, 
                        height: 12, 
                        borderRadius: "50%", 
                        background: "white", 
                        border: "3px solid var(--accent-gold)" 
                      }} 
                    />
                    <span className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-gold)", display: "block", marginBottom: 6 }}>
                      {item.year}
                    </span>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.7, fontWeight: 300 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
