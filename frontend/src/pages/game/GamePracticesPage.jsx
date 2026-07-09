import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";
import GamePageShell from "./GamePageShell";

const BLUE  = "#1d4ed8";
const TEXT  = "#111827";
const TEXT2 = "#6b7280";
const WHITE = "#ffffff";

const TABS = [
  { id:"civil",    label:"게임민사", path:"/game/practices" },
  { id:"criminal", label:"게임형사", path:"/game/practices/criminal" },
  { id:"admin",    label:"게임행정", path:"/game/practices/admin" },
];
const SM = { criminal:"criminal", admin:"admin" };

const DATA = {
  civil: {
    title:"게임민사", subtitle:"CIVIL LITIGATION", color: BLUE,
    desc:"아이템 거래 사기, 운영사 손해배상, 게임머니 부당이득 반환 등 게임 분야 민사 분쟁 전문 법률 서비스입니다.",
    areas:[
      { title:"아이템·계정 거래 사기 손해배상", desc:"온라인 게임 아이템 또는 계정 거래 과정에서 발생한 사기 피해에 대한 민사 손해배상 청구를 대리합니다.", tags:["손해배상청구","디지털증거수집","민사소송"] },
      { title:"게임머니 부당이득 반환 청구",    desc:"불법적인 방법으로 게임머니를 편취당한 경우, 부당이득 반환 청구 소송을 통해 피해금액을 회수합니다.", tags:["부당이득반환","게임머니","민사청구"] },
      { title:"운영사 손해배상",                desc:"게임 운영사의 과실 또는 불법행위로 인한 피해에 대해 손해배상을 청구합니다.", tags:["운영사책임","손해배상","소비자보호"] },
      { title:"집단소송 대리",                  desc:"동일한 게임사기 피해를 입은 다수의 피해자를 모아 집단소송을 진행합니다.", tags:["집단소송","공동피해자","협상력"] },
    ],
  },
  criminal: {
    title:"게임형사", subtitle:"CRIMINAL COMPLAINT", color:"#7c3aed",
    desc:"게임 관련 사기 범죄에 대한 형사고소, 수사 지원, 피해자 대리를 전담합니다.",
    areas:[
      { title:"아이템 거래 사기 형사고소", desc:"게임 아이템 거래 과정에서 발생한 사기 범죄에 대해 형사고소장을 작성하고 수사기관에 제출합니다.", tags:["형사고소","사기죄","수사지원"] },
      { title:"해킹·계정 도용 처벌",      desc:"계정 해킹 또는 도용 피해에 대한 형사 처벌을 추진합니다. 정보통신망법, 형법상 사기죄 등 다각적인 법률을 적용합니다.", tags:["해킹처벌","계정도용","정보통신망법"] },
      { title:"게임머니 편취 수사 지원",  desc:"게임머니 편취 사건에서 디지털 포렌식을 활용한 증거 수집과 수사기관 협조를 통해 피의자 검거를 지원합니다.", tags:["디지털포렌식","수사협조","편취"] },
      { title:"피해자 대리 변호",         desc:"형사재판 과정에서 피해자를 대리하여 피해사실을 효과적으로 입증하고, 합당한 손해배상 합의 또는 판결을 이끌어냅니다.", tags:["피해자대리","형사재판","합의"] },
    ],
  },
  admin: {
    title:"게임행정", subtitle:"ADMINISTRATIVE REVIEW", color:"#0891b2",
    desc:"게임 이용정지·영구정지 처분 불복, 운영사 제재 이의신청 등 게임 행정 분쟁 전문 서비스입니다.",
    areas:[
      { title:"이용정지·영구정지 불복",  desc:"게임 운영사의 이용정지 또는 영구정지 처분이 부당하다고 판단되는 경우, 이의신청 및 행정소송을 통해 계정을 회복합니다.", tags:["이용정지불복","영구정지","계정복구"] },
      { title:"운영사 부당 제재 이의",   desc:"운영사의 자의적 기준이나 불명확한 사유에 의한 제재에 대해 공식 이의를 제기하고 법적 구제를 신청합니다.", tags:["부당제재","이의신청","운영사책임"] },
      { title:"소비자분쟁조정 대리",     desc:"한국소비자원 등 분쟁조정기관에 게임 관련 소비자 분쟁을 신청하고, 조정 절차에서 의뢰인을 대리합니다.", tags:["소비자분쟁","조정신청","한국소비자원"] },
      { title:"게임물 등급 분쟁",        desc:"게임물관리위원회의 등급 분류 결정에 이의가 있는 경우, 행정심판 및 행정소송을 통해 등급 재분류를 추진합니다.", tags:["게임등급","게임물관리위원회","행정심판"] },
    ],
  },
};

export default function GamePracticesPage() {
  const { tab } = useParams();
  const activeId = (tab && SM[tab]) ? SM[tab] : "civil";
  const p = DATA[activeId];

  return (
    <>
      <Seo title={`${p.title} | HIGHLAW 게임센터`} description={p.desc} path={`/game/practices${activeId !== "civil" ? "/" + activeId : ""}`} />
      <GamePageShell eyebrow="PRACTICES" title="업무 분야" tabs={TABS} activeId={activeId}>

        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.22em", color: p.color, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{p.subtitle}</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 700, color: TEXT, marginBottom: 14 }}>{p.title}</h2>
          <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.8, maxWidth: 640 }}>{p.desc}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
          {p.areas.map(area => (
            <div key={area.title}
              style={{ background: WHITE, border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "26px 22px", transition: "border-color .2s,box-shadow .2s,transform .2s", borderTop: `3px solid ${p.color}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderTopColor = p.color; }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 10 }}>{area.title}</h3>
              <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.8, marginBottom: 14 }}>{area.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {area.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 10, background: "#eff6ff", color: BLUE, padding: "3px 9px", borderRadius: 10, fontWeight: 600, border: "1px solid #dbeafe" }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, background: WHITE, border: `1.5px solid ${BLUE}`, borderRadius: 12, padding: "32px 36px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.1rem,2.5vw,1.6rem)", fontWeight: 700, color: TEXT, marginBottom: 14 }}>{p.title} 피해를 입으셨나요?</h3>
          <p style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>빠른 초기 대응이 피해 회복의 핵심입니다. 지금 바로 상담하세요.</p>
          <Link to="/game/consultation"
            style={{ display: "inline-block", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 32px", borderRadius: 6, textDecoration: "none", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}>
            무료 사건 진단
          </Link>
        </div>

      </GamePageShell>
    </>
  );
}
