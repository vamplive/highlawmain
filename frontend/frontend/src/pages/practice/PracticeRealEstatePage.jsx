/** 부동산 법률 전문 페이지 — 라이프사이클·실무영역·실적·인사이트·CTA 오케스트레이터 */
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";
import PracticeHero from "./PracticeHero";
import {
  CaseResultsRow, PainPointsSection, MobileStatsSection,
  LifecycleSection, PracticeTilesSection, TestimonialsSection,
  TrackRecordSection, InsightsSection, PracticeCtaSection,
} from "./practiceSections";
import {
  LIFECYCLE, PRACTICES, STATS, TRACK_RECORDS,
  CASE_RESULTS, PAIN_POINTS, TESTIMONIALS, INSIGHTS,
} from "./practiceRealEstateData";

const BREADCRUMB = [
  { name: "홈", path: "/" },
  { name: "업무분야", path: "/practice" },
  { name: "부동산 법률", path: "/practice/realestate" },
];

export default function PracticeRealEstatePage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <style>{`
        @media (max-width: 640px) {
          .lifecycle-tabs button { padding: 10px 14px !important; font-size: 11px !important; }
        }
      `}</style>
      <Seo
        path="/practice/realestate"
        title="부동산 법률"
        description="재개발·재건축, 부동산 거래·투자, 임대차, 등기·수용까지 — 법무법인 하이로의 부동산 법률 전문 서비스."
        jsonLd={buildBreadcrumbJsonLd(BREADCRUMB)}
      />

      <PracticeHero
        backgroundImage="/realestate-hero.jpg"
        backgroundPosition="center 40%"
        breadcrumbLabel="REAL ESTATE"
        headingMain="부동산 개발의"
        headingAccent="법률 파트너"
        description={<>부동산 개발의 인허가 단계부터 분양, 준공, 분쟁 해결까지—<br />개발 전 과정의 법률자문과 소송대리를 원스톱으로 제공합니다.</>}
        stats={STATS}
      />

      <CaseResultsRow cases={CASE_RESULTS} />

      <PainPointsSection
        painPoints={PAIN_POINTS}
        ctaCopy="부동산 분쟁은 초기 대응이 결과를 결정합니다. 지금 바로 상담하세요."
      />

      <MobileStatsSection stats={STATS} />

      <LifecycleSection
        lifecycle={LIFECYCLE}
        eyebrow="REAL ESTATE LIFECYCLE"
        heading="개발 전 과정의 법률자문과 소송대리"
        subheading="부동산 개발의 인허가부터 분양·준공·분쟁까지, 각 단계에서 법률자문과 소송대리를 제공합니다"
      />

      <PracticeTilesSection practices={PRACTICES} heading="부동산 전문 업무 영역" />

      <TestimonialsSection testimonials={TESTIMONIALS} />

      <TrackRecordSection
        stats={STATS}
        records={TRACK_RECORDS}
        heading="부동산 분야 주요 수행 실적"
      />

      <InsightsSection posts={INSIGHTS} heading="부동산 법률 인사이트" />

      <PracticeCtaSection />
    </div>
  );
}
