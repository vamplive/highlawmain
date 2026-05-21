/** 상담안내 페이지 — 히어로, 절차, 폼, FAQ, 지도 섹션을 조합하는 메인 컴포넌트 */
import useReveal from "../../hooks/useReveal";
import ConsultationHero from "./ConsultationHero";
import ConsultationSteps from "./ConsultationSteps";
import ConsultationForm from "./ConsultationForm";
import ConsultationFAQ from "./ConsultationFAQ";
import ConsultationMap from "./ConsultationMap";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd, buildLegalServiceJsonLd } from "../../lib/seo";

export default function ConsultationPage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <Seo
        path="/consultation"
        title="상담 신청"
        description="법무법인 하이로 — 불법파견·게임사기·노동·군사건 1:1 맞춤 법률 상담 신청. 강남 테헤란로 소재, 전문 변호사가 직접 상담합니다."
        jsonLd={[
          buildLegalServiceJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "상담 신청", path: "/consultation" },
          ]),
        ]}
      />
      <ConsultationHero />
      <ConsultationSteps />
      <ConsultationForm />
      <ConsultationFAQ />
      <ConsultationMap />
    </div>
  );
}
