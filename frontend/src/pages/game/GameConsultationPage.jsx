import { useParams, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo";
import ConsultationForm from "../consultation/ConsultationForm";
import ConsultationSteps from "../consultation/ConsultationSteps";
import ConsultationFAQ from "../consultation/ConsultationFAQ";

const ACCENT = "#3b82f6";

const TABS = [
  { id: "form", label: "상담신청", path: "/game/consultation" },
  { id: "process", label: "진행절차", path: "/game/consultation/process" },
  { id: "faq", label: "FAQ", path: "/game/consultation/faq" },
];

const SECTION_MAP = {
  process: "process",
  faq: "faq",
};

const PAGE_TITLES = {
  form: "상담신청",
  process: "진행절차",
  faq: "FAQ",
};

export default function GameConsultationPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = tab && SECTION_MAP[tab] ? SECTION_MAP[tab] : "form";

  return (
    <>
      <Seo
        title={`${PAGE_TITLES[activeId]} | HIGHLAW 게임센터`}
        description="HIGHLAW 게임센터에 법률 상담을 신청하세요. 게임 사기, 해킹, 운영사 제재 등 전문 변호사가 상담합니다."
        path="/game/consultation"
      />

      <div style={{ paddingTop: 64 }}>
        <div style={{ background: "#0a1628", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>CONSULTATION</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 40 }}>상담문의</h1>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,.1)", overflowX: "auto" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  style={{
                    padding: "12px 24px", fontSize: 13, fontWeight: activeId === t.id ? 700 : 400,
                    color: activeId === t.id ? "#fff" : "rgba(255,255,255,.5)",
                    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: activeId === t.id ? "2px solid " + ACCENT : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "60px clamp(20px,6vw,100px)", maxWidth: 1100, margin: "0 auto" }}>
          {activeId === "form" && <ConsultationForm />}
          {activeId === "process" && <ConsultationSteps />}
          {activeId === "faq" && <ConsultationFAQ />}
        </div>
      </div>
    </>
  );
}
