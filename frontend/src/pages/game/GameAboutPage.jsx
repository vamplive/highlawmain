import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Seo from "../../components/Seo";
import ConsultationMap from "../consultation/ConsultationMap";
import GamePageShell from "./GamePageShell";

const BLUE  = "#1d4ed8";
const TEXT  = "#111827";
const TEXT2 = "#6b7280";
const WHITE = "#ffffff";

const TABS = [
  { id:"greeting",   label:"인사말",   path:"/game/about" },
  { id:"values",     label:"핵심가치", path:"/game/about/values" },
  { id:"directions", label:"오시는 길",path:"/game/about/directions" },
  { id:"probono",    label:"공익활동", path:"/game/about/probono" },
  { id:"history",    label:"연혁",     path:"/game/about/history" },
];
const SM = { values:"values", directions:"directions", probono:"probono", history:"history" };

const VALUES = [
  { ko:"신의성실", en:"LOYALTY",   desc:"의뢰인과의 신뢰를 최우선으로 여기며, 모든 법률 서비스에서 성실함을 다합니다." },
  { ko:"품격",     en:"DIGNITY",   desc:"법조인으로서의 품격과 전문성을 갖추어 의뢰인에게 최상의 서비스를 제공합니다." },
  { ko:"정직",     en:"INTEGRITY", desc:"투명하고 정직한 소통으로 의뢰인이 현명한 법률적 판단을 내릴 수 있도록 돕습니다." },
  { ko:"전문성",   en:"EXPERTISE", desc:"게임·디지털 분야 법률 전문지식을 바탕으로 최적의 법률 전략을 수립합니다." },
];
const HISTORY = [
  { year:"2026 — 현재", desc:"전문성 공고화 및 디지털 사법지원 시스템 고도화" },
  { year:"2025",        desc:"서울 강남 오피스 확장 이전" },
  { year:"2024",        desc:"동일 분야 최고 실력의 파트너십 완성" },
  { year:"2023",        desc:"법무법인 하이로 공식 출범" },
];
const PROBONO = [
  { title:"게임 피해자 무료 법률 상담",  desc:"경제적 어려움을 겪는 게임사기 피해자를 위한 무료 초기 법률 상담 서비스를 제공합니다." },
  { title:"청소년 게임 피해 예방 교육",  desc:"학교 및 청소년 단체와 협력하여 게임 사기 예방 교육 프로그램을 운영합니다." },
  { title:"디지털 소비자 권리 캠페인",   desc:"게임 이용자의 권리 보호와 공정한 게임 환경 조성을 위한 캠페인에 참여합니다." },
];

export default function GameAboutPage() {
  const { section } = useParams();
  const activeId = (section && SM[section]) ? SM[section] : "greeting";
  return (
    <>
      <Seo title="하이로 게임센터 소개 | HIGHLAW 게임센터" description="법무법인 하이로 게임센터의 인사말, 핵심가치, 연혁, 오시는 길, 공익활동을 소개합니다." path="/game/about" />
      <GamePageShell eyebrow="ABOUT" title="하이로 게임센터" tabs={TABS} activeId={activeId}>

        {activeId === "greeting" && (
          <div style={{ maxWidth: 720 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: TEXT, marginBottom: 28 }}>
              게임 피해, 전문 법률팀이 함께합니다
            </h2>
            <p style={{ fontSize: 16, color: TEXT2, lineHeight: 1.9, marginBottom: 20 }}>
              HIGHLAW 게임센터는 게임 아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재 등 게임 분야 법률 분쟁에 특화된 전문 팀입니다.
            </p>
            <p style={{ fontSize: 16, color: TEXT2, lineHeight: 1.9, marginBottom: 20 }}>
              디지털 환경에서 발생하는 피해는 증거 수집과 법률적 대응이 동시에 이루어져야 합니다. 저희는 형사고소부터 민사 손해배상 청구, 행정 불복까지 양면 전략으로 의뢰인의 권리를 최대한 회복합니다.
            </p>
            <p style={{ fontSize: 16, color: TEXT2, lineHeight: 1.9, marginBottom: 36 }}>
              피해를 입은 즉시 연락 주십시오. 디지털 증거는 시간이 지날수록 소멸됩니다.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/game/consultation"
                style={{ display: "inline-block", background: BLUE, color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 28px", borderRadius: 6, textDecoration: "none", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}>
                상담 신청
              </Link>
              <Link to="/game/members"
                style={{ display: "inline-block", border: `1.5px solid ${BLUE}`, color: BLUE, fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 6, textDecoration: "none" }}>
                구성원 소개
              </Link>
            </div>
          </div>
        )}

        {activeId === "values" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: TEXT, marginBottom: 40 }}>핵심가치</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 20 }}>
              {VALUES.map(v => (
                <div key={v.en}
                  style={{ background: WHITE, border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "28px 24px", transition: "border-color .2s,box-shadow .2s,transform .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = "0 8px 32px rgba(29,78,216,0.12)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.22em", color: BLUE, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>{v.en}</div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 700, color: TEXT, marginBottom: 14 }}>{v.ko}</h3>
                  <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.8 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeId === "directions" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: TEXT, marginBottom: 28 }}>오시는 길</h2>
            <ConsultationMap />
          </div>
        )}

        {activeId === "probono" && (
          <div style={{ maxWidth: 720 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: TEXT, marginBottom: 28 }}>공익활동</h2>
            <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.8, marginBottom: 36 }}>HIGHLAW 게임센터는 법률 서비스의 사회적 책임을 다하기 위해 다양한 공익활동을 펼치고 있습니다.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PROBONO.map(p => (
                <div key={p.title}
                  style={{ background: WHITE, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "22px 24px", borderLeft: `4px solid ${BLUE}` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.8 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeId === "history" && (
          <div style={{ maxWidth: 620 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: TEXT, marginBottom: 44 }}>연혁</h2>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(${BLUE},rgba(29,78,216,0.1))` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingLeft: 32 }}>
                {HISTORY.map((h, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -38, top: 6, width: 10, height: 10, borderRadius: "50%", background: BLUE, border: "2px solid #f9fafb", boxShadow: "0 0 0 3px rgba(29,78,216,0.2)" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, marginBottom: 6, letterSpacing: "0.05em" }}>{h.year}</div>
                    <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.7 }}>{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </GamePageShell>
    </>
  );
}
