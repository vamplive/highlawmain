/** 건설 법률 전문 페이지 — 라이프사이클·실무영역·실적·인사이트·CTA 오케스트레이터 */
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
} from "./practiceConstructionData";

const BREADCRUMB = [
  { name: "홈", path: "/" },
  { name: "업무분야", path: "/practice" },
  { name: "건설 법률", path: "/practice/construction" },
];

export default function PracticeConstructionPage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <style>{`
        @media (max-width: 640px) {
          .lifecycle-tabs button { padding: 10px 14px !important; font-size: 11px !important; }
        }
      `}</style>
      <Seo
        path="/practice/construction"
        title="건설 법률"
        description="공사대금, 하자담보, 인허가, 재개발·재건축까지 — 법무법인 하이로의 건설 법률 전문 서비스."
        jsonLd={buildBreadcrumbJsonLd(BREADCRUMB)}
      />

      <PracticeHero
        backgroundImage="/construction-hero3.jpg"
        backgroundPosition="center 30%"
        breadcrumbLabel="CONSTRUCTION"
        headingMain="건설 분쟁의"
        headingAccent="전문적 해결"
        description={<>프로젝트 기획부터 준공, 분쟁 해결까지—<br />건설 프로젝트 전 과정을 아우르는 원스톱 법률 서비스를 제공합니다.</>}
        stats={STATS}
      />

      <CaseResultsRow cases={CASE_RESULTS} />

      <PainPointsSection
        painPoints={PAIN_POINTS}
        ctaCopy="건설 분쟁은 초기 대응이 결과를 결정합니다. 지금 바로 상담하세요."
      />

      <MobileStatsSection stats={STATS} />

      <LifecycleSection
        lifecycle={LIFECYCLE}
        eyebrow="PROJECT LIFECYCLE"
        heading="프로젝트 전 과정을 아우르는 법률 서비스"
        subheading="건설 프로젝트의 기획부터 준공까지, 각 단계에 최적화된 법률 솔루션을 제공합니다"
      />

      <PracticeTilesSection practices={PRACTICES} heading="건설 전문 업무 영역" />

      <TestimonialsSection testimonials={TESTIMONIALS} />

      <TrackRecordSection
        stats={STATS}
        records={TRACK_RECORDS}
        heading="건설 분야 주요 수행 실적"
      />

      <InsightsSection posts={INSIGHTS} heading="건설 법률 인사이트" />

      <PracticeCtaSection />
    </div>
  );
}
