/** 상담안내 페이지 — 히어로 + 3개 탭(상담 신청/진행 절차/FAQ) */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useReveal from "../../hooks/useReveal";
import ConsultationHero from "./ConsultationHero";
import ConsultationSteps from "./ConsultationSteps";
import ConsultationForm from "./ConsultationForm";
import ConsultationFAQ from "./ConsultationFAQ";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd, buildLegalServiceJsonLd } from "../../lib/seo";

const TABS = [
  { id: "form", label: "상담 신청", labelEn: "CONTACT" },
  { id: "process", label: "진행 절차", labelEn: "PROCESS" },
  { id: "faq", label: "FAQ", labelEn: "FAQ" },
];

export default function ConsultationPage() {
  const ref = useReveal();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "form");

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

      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content-active {
          animation: tabFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      <section className="section" style={{ background: "#fff", paddingTop: 48 }}>
        <div className="container" style={{ maxWidth: 1000 }}>

          {/* 탭 네비게이션 */}
          <div
            role="tablist"
            aria-label="상담 섹션 선택"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: 56,
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
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
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === "form" && (
            <div className="tab-content-active" key="form">
              <ConsultationForm compact />
            </div>
          )}
          {activeTab === "process" && (
            <div className="tab-content-active" key="process">
              <ConsultationSteps compact />
            </div>
          )}
          {activeTab === "faq" && (
            <div className="tab-content-active" key="faq">
              <ConsultationFAQ compact />
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
