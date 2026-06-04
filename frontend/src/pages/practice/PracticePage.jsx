/**
 * 업무분야 페이지 — 법무법인 하이로 12대 전문 분야
 * 의뢰인 고민 → 대표 분야 → 차별점 → 분야 선택 카드 → CTA
 */
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight, Phone,
  AlertTriangle, CheckCircle2, Shield, Clock, Users, Target,
  Briefcase, HardHat, Award, Scale, Building2, Music, Building, Heart, Key, Globe
} from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

/* ── 의뢰인 고민 ── */
const PAIN_POINTS = [
  { icon: AlertTriangle, text: <>복잡한 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>민사소송</span>과 대여금·공사대금·손해배상 청구 문제로 앞날이 막막하다</> },
  { icon: AlertTriangle, text: <>갑작스러운 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>형사 사건</span>에 연루되어 경찰·검찰 수사와 구속 및 처벌 위험에 처해 있다</> },
  { icon: AlertTriangle, text: <>부당해고, 임금체불 및 취업규칙·근로계약 등 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>인사 노무</span> 관련 규정 정비가 시급하다</> },
  { icon: AlertTriangle, text: <>경영권분쟁, <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>기업 경영</span> 리스크, 주권 등 법적 리스크 관리 및 해결이 필요하다</> },
  { icon: AlertTriangle, text: <><span style={{ color: "var(--text-primary)", fontWeight: 700 }}>중대재해</span>처벌법 및 산업안전보건법 준수를 위한 안전보건확보의무 구축이 어렵다</> },
  { icon: AlertTriangle, text: <><span style={{ color: "var(--text-primary)", fontWeight: 700 }}>스타트업</span> 창업, 주주간 계약(SHA), 스톡옵션 등 성장 단계별 전문 자문이 필요하다</> },
  { icon: AlertTriangle, text: <><span style={{ color: "var(--text-primary)", fontWeight: 700 }}>이혼</span>, 재산분할, 유산 상속 및 유류분 반환 소송 등으로 심각한 가족 간 갈등을 겪고 있다</> },
  { icon: AlertTriangle, text: <>군 조직 내의 특수한 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>군형사</span>사건 수사나 군인·군무원 보통징계위원회 징계에 직면했다</> },
  { icon: AlertTriangle, text: <>국가, 지자체 또는 행정기관의 부당한 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>행정처분</span>으로 불이익을 겪고 있다</> },
  { icon: AlertTriangle, text: <><span style={{ color: "var(--text-primary)", fontWeight: 700 }}>외국</span> 기업·외국인과의 법적 분쟁이나 출입국 및 이민 장벽에 부딪혔다</> },
  { icon: AlertTriangle, text: <>조달 계약상의 지체상금 분쟁 및 <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>방위사업</span> 입찰참가제한 처분 위기에 처했다</> },
  { icon: AlertTriangle, text: <>전속계약 분쟁, <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>저작권</span> 침해, 글로벌 국제 분쟁에 대한 정밀한 조력이 필요하다</> },
];

/* ── 핵심 서비스 가치 및 약속 ── */
const CASE_RESULTS = [
  { amount: "1:1", unit: "직접상담", label: "담당 전문 변호사 1:1 밀착 케어", category: "DIRECT" },
  { amount: "정밀", unit: "법리분석", label: "판례 빅데이터 기반 심층 분석", category: "LAW" },
  { amount: "신속", unit: "초동대응", label: "골든타임 내 긴급 변호인 개입", category: "SPEED" },
  { amount: "신의", unit: "성실의무", label: "의뢰인의 권익을 끝까지 책임지는 헌신", category: "LOYALTY" },
];

/* ── 전문 로펌 차별점 ── */
const ADVANTAGES = [
  {
    icon: Target,
    title: "분야별 고도의 전문성",
    desc: "각 법률 영역에서 실무 담당자로 근무하였거나 대형로펌에서 오랜 경험과 노하우를 쌓은 전담 변호사가 사건을 맡아 정밀한 판례 분석과 법리 해석을 토대로 맞춤형 해법을 도출합니다.",
  },
  {
    icon: Shield,
    title: "현장과 절차의 정교한 이해",
    desc: "사실조사와 증거 수집부터 법원, 검찰, 노동위원회, 군사법원, 행정기관 등 각 기관별 특수한 절차적 메커니즘을 정확히 파악하여 빈틈없이 조력합니다.",
  },
  {
    icon: Clock,
    title: "신속하고 명확한 초기 대응",
    desc: "소송 및 분쟁 해결의 성패는 초기 대응에 달려 있습니다. 하이로는 상담 진행 후 신속하게 사건의 핵심 쟁점과 향후 대응 로드맵을 제공합니다.",
  },
  {
    icon: Users,
    title: "일관성 있는 통합 해결",
    desc: "자문과 협상부터 소송 수행까지, 민·형사 및 행정 절차가 유기적으로 연계된 복잡한 사건도 전담 변호사가 처음부터 끝까지 일관된 맥락으로 책임지고 해결합니다.",
  },
];

/* ── 12대 분야 카드 ── */
const AREAS = [
  {
    to: "/practice/game-fraud",
    image: "/practice-game.png",
    icon: Target,
    label: "GAME FRAUD",
    title: "게임사기",
    desc: "현금 아이템 거래 사기, 계정 도용·해킹, 게임머니 편취, 운영사 부당 제재까지—온라인 게임 환경 고유의 증거 구조와 운영사 약관을 이해하는 변호인이 형사·민사 양면으로 피해를 회복합니다.",
    highlights: ["아이템·계정 거래 사기", "해킹·도용 피해 구제", "게임머니 편취 민사소송", "운영사 제재 이의제기"],
  },
  {
    to: "/practice/illegal-dispatch",
    image: "/practice-labor.png",
    icon: Users,
    label: "ILLEGAL DISPATCH",
    title: "불법파견",
    desc: "도급계약서 한 장이 모든 것을 정당화하지 않습니다. 실제 지휘·감독, 노무 통제, 업무 일체성을 따져 위장도급·불법파견 여부를 가려내고 직접고용·차별시정·형사대응까지 완결합니다.",
    highlights: ["위장도급·불법파견 진정", "직접고용 청구 소송", "차별시정 신청 대리", "파견법 위반 형사대응"],
  },
  {
    to: "/practice/civil",
    image: "/practice-justice.png",
    icon: Scale,
    label: "CIVIL LAW",
    title: "민사",
    desc: "대여금, 손해배상, 부동산 분쟁, 계약 위반 등 일상생활과 기업 활동에서 발생하는 다양한 사법적 분쟁에 대한 정밀한 해법을 제시합니다.",
    highlights: ["손해배상·대여금 청구", "부동산·임대차 분쟁", "계약 위반 손해배상", "보전처분·강제집행"],
  },
  {
    to: "/practice/criminal",
    image: "/practice-justice.png",
    icon: Shield,
    label: "CRIMINAL LAW",
    title: "형사",
    desc: "수사 단계부터 공판에 이르기까지 피의자·피고인의 권리를 철저히 옹호하며, 구속영장 청구 및 형사 절차 전반에 신속하고 강력하게 대응합니다.",
    highlights: ["경찰·검찰 수사 대응", "영장실질심사·구속 조력", "성범죄·재산범죄 변호", "형사고소 대리"],
  },
  {
    to: "/practice/labor",
    image: "/practice-labor.png",
    icon: Briefcase,
    label: "LABOR & HR",
    title: "인사노무",
    desc: "임금체불, 부당해고, 직장 내 괴롭힘, 근로기준법 및 관련 법령 위반 등 개별 노동 관계 및 집단적 노사 관계에서 발생하는 갈등을 합리적으로 해결합니다.",
    highlights: ["부당해고 구제신청", "임금체불·퇴직금 청구", "취업규칙·노무 자문", "노동위원회 심판 대리"],
  },
  {
    to: "/practice/serious-accident",
    image: "/practice-corporate.png",
    icon: HardHat,
    label: "SERIOUS ACCIDENTS",
    title: "중대재해",
    desc: "중대재해처벌법 및 산업안전보건법에 따른 형사책임 예방 조치와 사고 발생 시 신속한 수사 대응으로 기업과 경영책임자의 법적 리스크를 전방위로 방어합니다.",
    highlights: ["중대재해처벌법 컴플라이언스", "산업재해 형사대응", "경영책임자 의무 점검", "근로감독 및 행정대응"],
  },
  {
    to: "/practice/corporate",
    image: "/practice-corporate.png",
    icon: Building2,
    label: "CORPORATE LAW",
    title: "기업",
    desc: "M&A, 투자 유치, 주주총회 및 이사회 운영, 공정거래, 기업 지배구조 등 기업 경영 과정에서 발생하는 모든 법적 현안에 대한 상시 자문 및 송무 서비스를 제공합니다.",
    highlights: ["기업 상시 법률 자문", "인수합병(M&A) 및 투자", "주주간 분쟁 해결", "영업비밀·부정경쟁 방지"],
  },
  {
    to: "/practice/defense",
    image: "/practice-corporate.png",
    icon: Target,
    label: "DEFENSE INDUSTRY",
    title: "방산",
    desc: "방위사업법 및 군수품 관리법에 의거한 방산 수출입, 군 납품 관련 계약 분석, 국방 획득 사업 및 관련 행정 제재 처분에 대해 심도 있는 전략적 솔루션을 제공합니다.",
    highlights: ["방산 납품·계약 법률 검토", "부당업자 제재처분 대응", "방위사업법 관련 자문", "군수조달 소송 대리"],
  },
  {
    to: "/practice/military-criminal",
    image: "/practice-justice.png",
    icon: Award,
    label: "MILITARY CRIMINAL",
    title: "군형사",
    desc: "군형법이 적용되는 군인, 군무원 등의 특수성을 고려하여 군검찰·군사법원의 수사 및 재판 절차에 부합하는 군 법무관 출신 및 전문 변호사 군단이 전방위적 조력을 다합니다.",
    highlights: ["군인·군무원 형사변호", "군 징계 및 인사 소청", "군사 수사 절차 동행", "보통·고등군사법원 대응"],
  },
  {
    to: "/practice/entertainment",
    image: "/practice-entertainment.png",
    icon: Music,
    label: "ENTERTAINMENT",
    title: "엔터테인먼트",
    desc: "전속계약 분쟁, 저작권 및 퍼블리시티권 침해, 초상권 분쟁 등 엔터테인먼트 산업 전반의 계약 체결 단계부터 권리 구제까지 아티스트와 제작사의 이익을 대변합니다.",
    highlights: ["전속계약 효력·해지 분쟁", "저작권·초상권 보호", "엔터테인먼트 계약서 검토", "명예훼손 및 악플 강력 대응"],
  },
  {
    to: "/practice/administrative",
    image: "/practice-justice.png",
    icon: Building,
    label: "ADMINISTRATIVE LAW",
    title: "행정",
    desc: "국가기관이나 지자체의 부당한 처분(영업정지, 면허취소, 조세부과 등)에 대해 행정심판 및 행정소송을 제기하여 국민과 기업의 권익을 구제받을 수 있도록 최선을 다합니다.",
    highlights: ["영업정지·면허취소 처분 취소", "행정심판·행정소송 수행", "국가배상·토지수용 보상", "처분 효력정지 가처분"],
  },
  {
    to: "/practice/family",
    image: "/practice-family.png",
    icon: Heart,
    label: "FAMILY & INHERITANCE",
    title: "가사 및 상속",
    desc: "이혼, 재산분할, 위자료, 양육권 분쟁을 비롯하여 유산 상속, 기여분, 유류분 반환 청구 등 가족 간의 복잡하고 감정적인 갈등 속에서 의뢰인의 권리를 따뜻하고 철저하게 대변합니다.",
    highlights: ["이혼 소송 및 재산분할", "상속재산분할·기여분 소송", "유류분 반환 청구 소송", "성년후견 및 유언 대리"],
  },
  {
    to: "/practice/intellectual-property",
    image: "/practice-ip.png",
    icon: Key,
    label: "INTELLECTUAL PROPERTY",
    title: "지적재산권",
    desc: "특허, 실용신안, 상표, 디자인, 저작권, 영업비밀 등 무형의 자산을 보호하기 위한 특허심판, 침해금지 청구 소송 및 손해배상 소송을 효과적으로 수행합니다.",
    highlights: ["특허·상표·디자인 침해 대응", "저작권 분쟁 및 소송", "영업비밀 유출 방지 및 고소", "IP 라이선스 계약 자문"],
  },
  {
    to: "/practice/immigration",
    image: "/practice-immigration.png",
    icon: Globe,
    label: "IMMIGRATION",
    title: "이민",
    desc: "외국인 투자자 비자, 취업 비자, 국적 취득, 영주권 신청 및 강제퇴거·입국 금지 처분에 대한 이의제기 등 국경을 넘는 법률적 장벽을 해소하는 전문적인 동행자가 되어 드립니다.",
    highlights: ["외국인 투자·취업 비자 대행", "귀화·국적 취득 심사 조력", "출국명령·강제퇴거 처분 취소", "보호처분 일시 해제 신청"],
  },
];

const TABS = [
  { id: "pain-points", label: "상담점검" },
  { id: "advantages", label: "하이로의 강점" },
  { id: "areas", label: "업무 분야" },
];

export default function PracticePage() {
  const ref = useReveal();
  // URL 쿼리파라미터를 단일 진실 소스로 사용 — 드롭다운 링크 클릭 시 즉시 반영
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pain-points";

  return (
    <div ref={ref}>
      <Seo
        path="/practice"
        title="업무분야 — 법무법인 하이로"
        description="법무법인 하이로는 민사, 형사, 인사노무, 중대재해, 기업, 방산, 군형사, 엔터테인먼트, 행정, 가사 및 상속, 지적재산권, 이민을 아우르는 최적의 법률 솔루션을 제공합니다."
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "업무분야", path: "/practice" },
        ])}
      />
      <PublicHero
        image="/realestate-hero.jpg"
        eyebrow="Expertise"
        title="업무 분야"
        description={"검증된 실무 역량과 정교한 법리 해석을 결합하여,\n클라이언트의 가치를 실현하는 최적의 법률 솔루션을 제시합니다."}
        primaryAction={{ to: "/consultation", label: "상담 예약", icon: <Phone size={15} /> }}
        secondaryAction={{ href: "tel:02-6925-6757", label: "02-6925-6757" }}
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

      {/* ==================== 탭 네비게이션 섹션 ==================== */}
      <section className="section" style={{ background: "#fff", paddingTop: 48, paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          
          {/* ==================== 3개 타원형(Pill) 탭 네비게이션 ==================== */}
          <div
            role="tablist"
            aria-label="업무분야 섹션 선택"
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
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
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
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-selected={isActive}
                  role="tab"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 탭별 본문 내용 ==================== */}

      {/* 1. 상담 필요여부 탭 */}
      {activeTab === "pain-points" && (
        <div className="tab-content-active" key="pain-points">
          <section style={{ background: "#fff", padding: "0 24px 80px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <SectionHeading eyebrow="DO YOU NEED US" title="이런 문제로 고민하고 계신가요?" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
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
        </div>
      )}

      {/* 2. 하이로의 강점 탭 */}
      {activeTab === "advantages" && (
        <div className="tab-content-active" key="advantages">
          {/* ━━━ 핵심 지표 (고급스러운 딥 네이비 & 리얼 골드 테두리 사각 표로 리뉴얼) ━━━ */}
          <section style={{ background: "#fff", padding: "0 24px 24px" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 reveal" style={{ 
                background: "linear-gradient(135deg, #0b1f3a 0%, #162f50 100%)", 
                boxShadow: "0 20px 50px rgba(11, 31, 58, 0.20)",
                border: "1.5px solid rgba(201, 168, 76, 0.35)",
                borderRadius: "8px",
                overflow: "hidden"
              }}>
                {CASE_RESULTS.map((r, i) => (
                  <div key={i} className="text-center" style={{ 
                    padding: "36px 20px", 
                    borderRight: i < 3 ? "1px solid rgba(201, 168, 76, 0.15)" : "none",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}>
                    <p className="font-en" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--accent-gold)", marginBottom: 8 }}>{r.category}</p>
                    <p className="font-serif" style={{ fontSize: "clamp(24px, 2.5vw, 32px)", fontWeight: 500, color: "#ffffff", lineHeight: 1.2 }}>
                      {r.amount}<span style={{ fontSize: "0.55em", fontWeight: 300, color: "rgba(255, 255, 255, 0.7)", marginLeft: 2 }}> {r.unit}</span>
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", marginTop: 8, fontWeight: 300, wordBreak: "keep-all" }}>{r.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ━━━ 왜 특화 로펌인가 (간격 조절: 패딩 축소) ━━━ */}
          <section style={{ background: "var(--bg-primary)", padding: "48px 24px 80px" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
              <SectionHeading eyebrow="WHY SPECIALIST" title="왜 법무법인 하이로인가" />
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
        </div>
      )}

      {/* 3. 업무 분야 탭 */}
      {activeTab === "areas" && (
        <div className="tab-content-active" key="areas">
          {/* ━━━ 분야 선택 카드 ━━━ */}
          <section style={{ background: "#fff", padding: "0 24px var(--section-py)" }}>
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
        </div>
      )}

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
            상담 후 신속하게 구체적인 사건 분석 로드맵을 제안해드립니다.
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
