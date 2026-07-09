import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";

const ACCENT = "#3b82f6";
const GRID_BG = `linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)`;

const TABS = [
  { id: "civil", label: "게임민사", path: "/game/practices" },
  { id: "criminal", label: "게임형사", path: "/game/practices/criminal" },
  { id: "admin", label: "게임행정", path: "/game/practices/admin" },
];

const SECTION_MAP = { criminal: "criminal", admin: "admin" };

const PRACTICES = {
  civil: {
    title: "게임민사",
    subtitle: "CIVIL LITIGATION",
    color: "#3b82f6",
    desc: "아이템 거래 사기, 운영사 손해배상, 게임머니 부당이득 반환 등 게임 분야 민사 분쟁 전문 법률 서비스입니다.",
    areas: [
      { title: "아이템·계정 거래 사기 손해배상", desc: "온라인 게임 아이템 또는 계정 거래 과정에서 발생한 사기 피해에 대한 민사 손해배상 청구를 대리합니다. 거래 내역, 채팅 기록, 입금 증빙 등 디지털 증거를 체계적으로 수집하여 청구금액을 최대화합니다.", tags: ["손해배상청구", "디지털증거수집", "민사소송"] },
      { title: "게임머니 부당이득 반환 청구", desc: "불법적인 방법으로 게임머니를 편취당한 경우, 부당이득 반환 청구 소송을 통해 피해금액을 회수합니다.", tags: ["부당이득반환", "게임머니", "민사청구"] },
      { title: "운영사 손해배상", desc: "게임 운영사의 과실 또는 불법행위로 인한 피해에 대해 손해배상을 청구합니다. 서버 오류, 부당 운영, 데이터 삭제 등 다양한 유형의 피해를 다룹니다.", tags: ["운영사책임", "손해배상", "소비자보호"] },
      { title: "집단소송 대리", desc: "동일한 게임사기 피해를 입은 다수의 피해자를 모아 집단소송을 진행합니다. 개별 소송보다 강력한 협상력과 비용 효율성을 제공합니다.", tags: ["집단소송", "공동피해자", "협상력"] },
    ],
  },
  criminal: {
    title: "게임형사",
    subtitle: "CRIMINAL COMPLAINT",
    color: "#6366f1",
    desc: "게임 관련 사기 범죄에 대한 형사고소, 수사 지원, 피해자 대리를 전담합니다.",
    areas: [
      { title: "아이템 거래 사기 형사고소", desc: "게임 아이템 거래 과정에서 발생한 사기 범죄에 대해 형사고소장을 작성하고 수사기관에 제출합니다. 증거 분석, 피의자 특정, 수사 협조까지 전 과정을 지원합니다.", tags: ["형사고소", "사기죄", "수사지원"] },
      { title: "해킹·계정 도용 처벌", desc: "계정 해킹 또는 도용 피해에 대한 형사 처벌을 추진합니다. 정보통신망법, 형법상 사기죄 등 다각적인 법률을 적용하여 가해자 처벌을 실현합니다.", tags: ["해킹처벌", "계정도용", "정보통신망법"] },
      { title: "게임머니 편취 수사 지원", desc: "게임머니 편취 사건에서 디지털 포렌식을 활용한 증거 수집과 수사기관 협조를 통해 피의자 검거를 지원합니다.", tags: ["디지털포렌식", "수사협조", "편취"] },
      { title: "피해자 대리 변호", desc: "형사재판 과정에서 피해자를 대리하여 피해사실을 효과적으로 입증하고, 합당한 손해배상 합의 또는 판결을 이끌어냅니다.", tags: ["피해자대리", "형사재판", "합의"] },
    ],
  },
  admin: {
    title: "게임행정",
    subtitle: "ADMINISTRATIVE REVIEW",
    color: "#0ea5e9",
    desc: "게임 이용정지·영구정지 처분 불복, 운영사 제재 이의신청 등 게임 행정 분쟁 전문 서비스입니다.",
    areas: [
      { title: "이용정지·영구정지 불복", desc: "게임 운영사의 이용정지 또는 영구정지 처분이 부당하다고 판단되는 경우, 이의신청 및 행정소송을 통해 계정을 회복합니다.", tags: ["이용정지불복", "영구정지", "계정복구"] },
      { title: "운영사 부당 제재 이의", desc: "운영사의 자의적 기준이나 불명확한 사유에 의한 제재에 대해 공식 이의를 제기하고, 필요시 법적 절차를 통해 구제를 신청합니다.", tags: ["부당제재", "이의신청", "운영사책임"] },
      { title: "소비자분쟁조정 대리", desc: "한국소비자원 등 분쟁조정기관에 게임 관련 소비자 분쟁을 신청하고, 조정 절차에서 의뢰인을 대리합니다.", tags: ["소비자분쟁", "조정신청", "한국소비자원"] },
      { title: "게임물 등급 분쟁", desc: "게임물관리위원회의 등급 분류 결정에 이의가 있는 경우, 행정심판 및 행정소송을 통해 등급 재분류를 추진합니다.", tags: ["게임등급", "게임물관리위원회", "행정심판"] },
    ],
  },
};

export default function GamePracticesPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeId = (tab && SECTION_MAP[tab]) ? SECTION_MAP[tab] : "civil";
  const practice = PRACTICES[activeId];

  return (
    <>
      <Seo title={`${practice.title} | HIGHLAW 게임센터`} description={practice.desc} path={`/game/practices${activeId !== "civil" ? "/" + activeId : ""}`} />

      <div style={{ paddingTop: 64, background: "#030508", minHeight: "100vh", backgroundImage: GRID_BG, backgroundSize: "60px 60px" }}>
        <div style={{ background: "rgba(3,5,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.08)", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.22em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>PRACTICES</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 40 }}>업무 분야</h1>
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
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.22em", color: practice.color, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>{practice.subtitle}</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>{practice.title}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", lineHeight: 1.8, maxWidth: 680 }}>{practice.desc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {practice.areas.map(area => (
              <div
                key={area.title}
                style={{ background: "#07090f", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 10, padding: "28px 24px", transition: "border-color .2s,box-shadow .2s,transform .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(59,130,246,0.1)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.12)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>{area.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.8, marginBottom: 16 }}>{area.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {area.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 10, background: "rgba(59,130,246,0.1)", color: ACCENT, padding: "3px 10px", borderRadius: 10, fontWeight: 500, border: "1px solid rgba(59,130,246,0.2)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 60, background: "#05080f", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: "36px 40px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.2rem,2.5vw,1.8rem)", fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>
              {practice.title} 피해를 입으셨나요?
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 28 }}>빠른 초기 대응이 피해 회복의 핵심입니다. 지금 바로 상담하세요.</p>
            <Link
              to="/game/consultation"
              style={{ display: "inline-block", background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 32px", borderRadius: 4, textDecoration: "none", boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}
            >
              무료 사건 진단
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
