import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useReveal from "../../hooks/useReveal";
import ConsultationSteps from "./ConsultationSteps";
import ConsultationForm from "./ConsultationForm";
import ConsultationFAQ from "./ConsultationFAQ";
import ConsultationMap from "./ConsultationMap";
import QnaHubPage from "../qna/QnaHubPage";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd, buildLegalServiceJsonLd } from "../../lib/seo";

export default function InquiryPage() {
  const ref = useReveal();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "guide"; // 기본값: guide

  useEffect(() => {
    let tabTitle = "상담 안내";
    if (activeTab === "apply") tabTitle = "상담 신청";
    if (activeTab === "qna") tabTitle = "Q&A 게시판";
    document.title = `${tabTitle} | Inquiry | 법무법인 하이로`;
  }, [activeTab]);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  return (
    <div ref={ref}>
      <Seo
        path="/inquiry"
        title={activeTab === "guide" ? "상담 안내" : activeTab === "apply" ? "상담 신청" : "Q&A 게시판"}
        description="법무법인 하이로 Inquiry — 전문 변호사와의 1:1 맞춤 상담 안내, 상담 신청 및 공개 법률 Q&A 소통 영역입니다."
        jsonLd={[
          buildLegalServiceJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "Inquiry", path: "/inquiry" },
          ]),
        ]}
      />

      {/* 히어로 영역 — 다크 럭셔리 & 샴페인 골드 라인 */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: "40vh",
          minHeight: 320,
          background: "linear-gradient(135deg, #050505 0%, #0b0e14 100%)",
          borderBottom: "1px solid var(--white-15)",
        }}
      >
        <div className="relative text-center z-10" style={{ padding: "0 24px" }}>
          <span
            className="font-en inline-block reveal"
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              color: "#DEC584",
              borderBottom: "1px solid rgba(222, 197, 132, 0.3)",
              paddingBottom: 8,
              marginBottom: 16,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Inquiry Center
          </span>
          <h1
            className="font-serif-kr reveal"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 2.8rem)",
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.4,
              marginBottom: 12,
            }}
          >
            {activeTab === "guide" ? "상담 안내" : activeTab === "apply" ? "상담 신청" : "Q&A 게시판"}
          </h1>
          <p
            className="reveal"
            style={{
              fontSize: 14,
              color: "var(--white-60)",
              lineHeight: 1.8,
              fontWeight: 300,
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            {activeTab === "guide"
              ? "하이로의 체계적인 리걸 컨설팅 절차와 전문 분야 상담 비용을 안내해 드립니다."
              : activeTab === "apply"
              ? "간단한 정보 입력으로 신속하고 정확한 변호사 직접 1:1 상담 예약을 신청하실 수 있습니다."
              : "변호사가 직접 검토하여 답변하는 공개 Q&A 질의응답 공간입니다."}
          </p>
        </div>
      </section>

      {/* 세련된 3단 탭 내비게이션 바 */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--border-subtle)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="container" style={{ maxWidth: 900, padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {[
              { id: "guide", label: "상담 안내" },
              { id: "apply", label: "상담 신청" },
              { id: "qna", label: "Q&A 게시판" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    flex: 1,
                    padding: "16px 0",
                    fontSize: "clamp(13px, 3.5vw, 15px)",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--accent-gold)" : "var(--text-secondary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: isActive ? "2.5px solid var(--accent-gold)" : "2.5px solid transparent",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 탭 활성화에 따른 하단 본문 콘텐츠 분기 */}
      <div style={{ background: "#fff" }}>
        {activeTab === "guide" && (
          <div className="reveal">
            <ConsultationSteps />
            <ConsultationFAQ />
            <ConsultationMap />
          </div>
        )}

        {activeTab === "apply" && (
          <div className="reveal" style={{ paddingTop: 30 }}>
            <ConsultationForm />
          </div>
        )}

        {activeTab === "qna" && (
          <div className="reveal">
            {/* hideHero={true} props를 제공하여 내부 중복 히어로를 걷어냅니다 */}
            <QnaHubPage hideHero={true} />
          </div>
        )}
      </div>
    </div>
  );
}
