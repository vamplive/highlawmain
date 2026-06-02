/** 상담안내 페이지 FAQ 아코디언 섹션 */
import { useState } from "react";
import { FAQ_ITEMS } from "./consultationConstants";
import { SectionHeading } from "../../components/public/PublicDesign";

/** FAQ 아코디언 펼침 시 최대 높이 (px) */
const FAQ_MAX_HEIGHT = 200;

/** @param {{ compact?: boolean }} props compact=true 시 section/container 래퍼 생략 */
export default function ConsultationFAQ({ compact = false }) {
  const [openIndex, setOpenIndex] = useState(null);

  function handleToggle(index) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  const content = (
    <>
      <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />

      {/* 아코디언 목록 */}
      <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {FAQ_ITEMS.map((item, idx) => {
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
