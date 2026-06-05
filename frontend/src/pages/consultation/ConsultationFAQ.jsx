/** 상담안내 페이지 FAQ 아코디언 섹션 */
import { useState } from "react";
import { SectionHeading } from "../../components/public/PublicDesign";
import { useSiteSettingsPage } from "../../hooks/useSiteSettings";

const CONSULTATIONS_DEFAULTS = {
  faq: {
    items: [
      { q: "상담 비용은 어떻게 되나요?", a: "초기 상담은 사건의 복잡도와 분야에 따라 상이합니다. 카카오톡 또는 상담 신청 폼으로 문의하시면 상담 유형에 맞는 안내를 드립니다." },
      { q: "상담 예약은 어떻게 하나요?", a: "카카오톡 또는 위 상담 신청 폼을 통해 예약하실 수 있습니다. 예약 상담이 우선 진행됩니다." },
      { q: "방문 상담이 가능한가요?", a: "네, 서울특별시 강남구 테헤란로 141, 15층 사무소에서 직접 상담이 가능합니다. 사전 예약을 권장드립니다." },
      { q: "상담 후 수임이 필수인가요?", a: "아닙니다. 상담을 통해 사건의 방향성을 파악하신 후 자유롭게 결정하실 수 있습니다." },
      { q: "어떤 분야를 전문으로 하나요?", a: "민사, 형사, 인사노무, 중대재해, 기업, 방산, 군형사, 엔터테인먼트, 행정, 가사 및 상속, 지적재산권, 이민을 비롯한 주요 분야에 대해 검증된 실무 역량과 정교한 법리 해석을 토대로 최적의 법률 솔루션을 제공합니다." },
      { q: "비밀이 보장되나요?", a: "변호사법에 따라 상담 내용은 철저히 비밀이 보장됩니다. 모든 정보는 안전하게 관리됩니다." }
    ]
  }
};

/** FAQ 아코디언 펼침 시 최대 높이 (px) */
const FAQ_MAX_HEIGHT = 200;

/** @param {{ compact?: boolean }} props compact=true 시 section/container 래퍼 생략 */
export default function ConsultationFAQ({ compact = false }) {
  const [openIndex, setOpenIndex] = useState(null);
  const { settings: consSettings } = useSiteSettingsPage("consultations", CONSULTATIONS_DEFAULTS);
  const faqItems = consSettings.faq?.items || CONSULTATIONS_DEFAULTS.faq.items;

  function handleToggle(index) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  const content = (
    <>
      <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />

      {/* 아코디언 목록 */}
      <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className="w-full text-left flex items-center justify-between transition-colors duration-200 hover:bg-[#f7f8fa]"
                style={{ padding: "20px 4px", cursor: "pointer", background: "transparent", border: "none" }}
              >
                <span style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 400, flex: 1, paddingRight: 16 }}>
                  {item.q}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: "var(--accent-gold)",
                    transition: "transform 0.3s ease",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  maxHeight: isOpen ? FAQ_MAX_HEIGHT : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease, opacity 0.3s ease",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <p style={{ padding: "0 4px 20px", fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (compact) return <div style={{ maxWidth: 720, margin: "0 auto" }}>{content}</div>;

  return (
    <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container" style={{ maxWidth: 720 }}>{content}</div>
    </section>
  );
}
