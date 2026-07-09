import { useParams, useNavigate, Link } from "react-router-dom";
import Seo from "../../components/Seo";
import ConsultationMap from "../consultation/ConsultationMap";

const ACCENT = "#3b82f6";

const TABS = [
  { id: "greeting", label: "인사말", path: "/game/about" },
  { id: "values", label: "핵심가치", path: "/game/about/values" },
  { id: "directions", label: "오시는 길", path: "/game/about/directions" },
  { id: "probono", label: "공익활동", path: "/game/about/probono" },
  { id: "history", label: "연혁", path: "/game/about/history" },
];

const SECTION_MAP = {
  values: "values",
  directions: "directions",
  probono: "probono",
  history: "history",
};

const VALUES = [
  { ko: "신의성실", en: "LOYALTY", desc: "의뢰인과의 신뢰를 최우선으로 여기며, 모든 법률 서비스에서 성실함을 다합니다." },
  { ko: "품격", en: "DIGNITY", desc: "법조인으로서의 품격과 전문성을 갖추어 의뢰인에게 최상의 서비스를 제공합니다." },
  { ko: "정직", en: "INTEGRITY", desc: "투명하고 정직한 소통으로 의뢰인이 현명한 법률적 판단을 내릴 수 있도록 돕습니다." },
  { ko: "전문성", en: "EXPERTISE", desc: "게임·디지털 분야 법률 전문지식을 바탕으로 최적의 법률 전략을 수립합니다." },
];

const HISTORY = [
  { year: "2026 — 현재", desc: "전문성 공고화 및 디지털 사법지원 시스템 고도화" },
  { year: "2025", desc: "서울 강남 오피스 확장 이전" },
  { year: "2024", desc: "동일 분야 최고 실력의 파트너십 완성" },
  { year: "2023", desc: "법무법인 하이로 공식 출범" },
];

const PROBONO = [
  { title: "게임 피해자 무료 법률 상담", desc: "경제적 어려움을 겪는 게임사기 피해자를 위한 무료 초기 법률 상담 서비스를 제공합니다." },
  { title: "청소년 게임 피해 예방 교육", desc: "학교 및 청소년 단체와 협력하여 게임 사기 예방 교육 프로그램을 운영합니다." },
  { title: "디지털 소비자 권리 캠페인", desc: "게임 이용자의 권리 보호와 공정한 게임 환경 조성을 위한 캠페인에 참여합니다." },
];

export default function GameAboutPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const activeId = section && SECTION_MAP[section] ? SECTION_MAP[section] : "greeting";

  return (
    <>
      <Seo title="하이로 게임센터 소개 | HIGHLAW 게임센터" description="법무법인 하이로 게임센터의 인사말, 핵심가치, 연혁, 오시는 길, 공익활동을 소개합니다." path="/game/about" />

      <div style={{ paddingTop: 64 }}>
        {/* Page header */}
        <div style={{ background: "#0a1628", padding: "48px clamp(20px,6vw,100px) 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>ABOUT</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 700, color: "#fff", marginBottom: 40 }}>하이로 게임센터</h1>
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
          {activeId === "greeting" && (
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>
                게임 피해, 전문 법률팀이 함께합니다
              </h2>
              <p style={{ fontSize: 16, color: "#334155", lineHeight: 1.9, marginBottom: 24 }}>
                HIGHLAW 게임센터는 게임 아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재 등 게임 분야 법률 분쟁에 특화된 전문 팀입니다.
              </p>
              <p style={{ fontSize: 16, color: "#334155", lineHeight: 1.9, marginBottom: 24 }}>
                디지털 환경에서 발생하는 피해는 증거 수집과 법률적 대응이 동시에 이루어져야 합니다. 저희는 형사고소부터 민사 손해배상 청구, 행정 불복까지 양면 전략으로 의뢰인의 권리를 최대한 회복합니다.
              </p>
              <p style={{ fontSize: 16, color: "#334155", lineHeight: 1.9, marginBottom: 40 }}>
                피해를 입은 즉시 연락 주십시오. 디지털 증거는 시간이 지날수록 소멸됩니다.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <Link
                  to="/game/consultation"
                  style={{ display: "inline-block", background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 28px", borderRadius: 4, textDecoration: "none" }}
                >
                  상담 신청
                </Link>
                <Link
                  to="/game/members"
                  style={{ display: "inline-block", border: "1px solid " + ACCENT, color: ACCENT, fontWeight: 600, fontSize: 14, padding: "12px 28px", borderRadius: 4, textDecoration: "none" }}
                >
                  구성원 소개
                </Link>
              </div>
            </div>
          )}

          {activeId === "values" && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 48 }}>핵심가치</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 24 }}>
                {VALUES.map(v => (
                  <div key={v.en} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "32px 28px" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", color: ACCENT, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>{v.en}</div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>{v.ko}</h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeId === "directions" && (
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>오시는 길</h2>
              <ConsultationMap />
            </div>
          )}

          {activeId === "probono" && (
            <div style={{ maxWidth: 760 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>공익활동</h2>
              <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 40 }}>
                HIGHLAW 게임센터는 법률 서비스의 사회적 책임을 다하기 위해 다양한 공익활동을 펼치고 있습니다.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {PROBONO.map(p => (
                  <div key={p.title} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "24px 28px" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeId === "history" && (
            <div style={{ maxWidth: 680 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#0f172a", marginBottom: 48 }}>연혁</h2>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "linear-gradient(" + ACCENT + ",rgba(59,130,246,.1))" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 36, paddingLeft: 36 }}>
                  {HISTORY.map((h, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: -42, top: 4, width: 10, height: 10, borderRadius: "50%", background: ACCENT, border: "2px solid #fff", boxShadow: "0 0 0 2px " + ACCENT }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 8, letterSpacing: "0.04em" }}>{h.year}</div>
                      <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7 }}>{h.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
