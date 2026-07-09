import { useParams } from "react-router-dom";
import Seo from "../../components/Seo";
import ConsultationForm from "../consultation/ConsultationForm";
import ConsultationSteps from "../consultation/ConsultationSteps";
import ConsultationFAQ from "../consultation/ConsultationFAQ";
import GamePageShell from "./GamePageShell";

const TABS = [
  { id:"form",    label:"상담신청", path:"/game/consultation" },
  { id:"process", label:"진행절차", path:"/game/consultation/process" },
  { id:"faq",     label:"FAQ",      path:"/game/consultation/faq" },
];
const SM = { process:"process", faq:"faq" };
const TITLES = { form:"상담신청", process:"진행절차", faq:"FAQ" };

export default function GameConsultationPage() {
  const { tab } = useParams();
  const activeId = (tab && SM[tab]) ? SM[tab] : "form";
  return (
    <>
      <Seo title={`${TITLES[activeId]} | HIGHLAW 게임센터`} description="HIGHLAW 게임센터에 법률 상담을 신청하세요." path="/game/consultation" />
      <GamePageShell eyebrow="CONSULTATION" title="상담문의" tabs={TABS} activeId={activeId}>
        {activeId === "form"    && <ConsultationForm />}
        {activeId === "process" && <ConsultationSteps />}
        {activeId === "faq"     && <ConsultationFAQ />}
      </GamePageShell>
    </>
  );
}
