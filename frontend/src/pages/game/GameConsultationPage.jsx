import { useParams, useNavigate } from "react-router-dom";
import Seo from "../../components/Seo";
import ConsultationForm from "../consultation/ConsultationForm";
import ConsultationSteps from "../consultation/ConsultationSteps";
import ConsultationFAQ from "../consultation/ConsultationFAQ";

const ACCENT = "#3b82f6";
const GRID_BG = `linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)`;

const TABS = [
  { id: "form", label: "상담신청", path: "/game/consultation" },
  { id: "process", label: "진행절차", path: "/game/consultation/process" },
  { id: "faq", label: "FAQ", path: "/game/consultation/faq" },
];

const SECTION_MAP = { process: "process", faq: "faq" };

export default function GameConsultationPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = (tab && SECTION_MAP[tab]) ? SECTION_MAP[tab] : "form";

  const PAGE_TITLES = { form: "상담신청", process: "진행절차", faq: "FAQ" };

  return (
    <>
      <Seo
        title={`${PAGE_TITLES[activeId]} | HIGHLAW 게임센터`}
        description="HIGHLAW 게임센터에 법률 상담을 신청하세요. 게임 사기, 해킹, 운영사 제재 등 전문 변호사가 상담합니다."
        path="/game/consultation"
      />

      <div style={{ paddingTop: 64, background: "#030508", minHeight: "100vh", backgroundImage: GRID_BG, backgroundSize: "60px 60px" }}>
        <div style={{ background: "rgba(3,5,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.08)", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>CONSULTATION</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 40 }}>상담문의</h1>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(59,130,246,0.1)", overflowX: "auto" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(t.path)}
                  style={{
                    padding: "12px 24px", fontSize: 13, fontWeight: activeId === t.id ? 700 : 400,
                    color: activeId === t.id ? "#fff" : "rgba(255,255,255,.35)",
                    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: activeId === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                    marginBottom: -1, transition: "color 0.15s",
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
