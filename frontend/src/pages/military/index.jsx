/** 군형사·징계 전문 독립 랜딩 페이지 — /military
 * 풀스크린 다크 테마. Header·Footer 없음. 카카오톡 채널 즉시 상담 CTA.
 * 섹션: 미니 네비 → 히어로 → 통계 바 → 고민 상황 → 서비스 → 절차 → 최종 CTA
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Shield, FileText, Award, Scale } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

/* ── 색상 토큰 (이 페이지 전용 다크 팔레트) ── */
const C = {
  gold: "#c9a84c",
  goldHover: "#b8923e",
  dark: "#070c17",
  darkMid: "#0b1529",
  darkLight: "#0f1e3c",
  text: "rgba(255,255,255,0.85)",
  textDim: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.35)",
  ink: "#0b0f18",
};

/* ── 콘텐츠 데이터 ── */
const PAIN_POINTS = [
  "군에서 형사사건 피의자·피해자로 수사를 받고 있다",
  "부당한 징계·전역·인사처분을 받아 항고를 준비 중이다",
  "군 복무 중 다쳤지만 국가배상·보훈 처리가 거부되었다",
  "병역 관련 처분(병역면탈·전공상 불인정 등)에 다투고 싶다",
];

const SERVICES = [
  {
    Icon: Shield,
    title: "군형사사건 변호",
    desc: "군수사단·군검찰·군사법원 단계 변호. 군형법·일반형법 모두 대응, 보통군사법원·고등군사법원·대법원까지.",
  },
  {
    Icon: FileText,
    title: "군 징계·인사처분 항고",
    desc: "징계항고·인사소청·항고심사위원회 절차 대리. 사실관계 입증·양정 다툼·전역 무효 청구까지.",
  },
  {
    Icon: Award,
    title: "국가배상·보훈 청구",
    desc: "군 복무 중 사망·상이에 대한 국가배상 청구, 국가유공자·보훈보상자 등록 거부·등급 불복 행정쟁송.",
  },
  {
    Icon: Scale,
    title: "병역·전공상 분쟁",
    desc: "병역처분 불복, 전공상 인정 여부 다툼, 군무이탈·복무이탈 관련 행정·형사 대응.",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "사건 성격 파악", desc: "군 수사·징계·인사·보훈 등 사건 단계 및 관할 절차 확인" },
  { step: "02", title: "기록·증거 확보", desc: "수사기록 열람·등사, 의무기록, 진술서, 지휘관 보고서 등 수집" },
  { step: "03", title: "전략 수립", desc: "양형·무죄·징계 감경·처분 취소 등 목표별 방어 전략 설계" },
  { step: "04", title: "절차·재판 동행", desc: "군 수사·군사법원·항고심사위·행정법원 단계별 변호인 동행" },
];

/* ── 카카오톡 CTA 버튼 (재사용 컴포넌트) ── */
function KakaoCtaButton({ large = false, dark = false }) {
  const bg = dark ? C.ink : C.gold;
  const bgHover = dark ? "#152038" : C.goldHover;
  const color = dark ? C.gold : C.ink;

  return (
    <a
      href={KAKAO_CHANNEL_CHAT}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: large ? 12 : 8,
        background: bg,
        color,
        fontWeight: 700,
        fontSize: large ? 17 : 14,
        padding: large ? "18px 44px" : "12px 24px",
        borderRadius: 4,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = bgHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
    >
      <MessageCircle size={large ? 22 : 16} />
      카카오톡으로 즉시 상담
    </a>
  );
}

/* ── 스크롤 reveal 섹션 래퍼 ── */
function RevealSection({ bg, children, style = {} }) {
  const revealRef = useReveal();
  return (
    <section
      ref={revealRef}
      style={{ background: bg, padding: "88px clamp(20px, 7vw, 120px)", ...style }}
    >
      {children}
    </section>
  );
}

/* ── 섹션 레이블 (소문자 eyebrow 텍스트) ── */
function Eyebrow({ children }) {
  return (
    <p className="reveal" style={{ fontSize: 11, letterSpacing: "0.22em", color: C.gold, textTransform: "uppercase", fontWeight: 600, marginBottom: 18 }}>
      {children}
    </p>
  );
}

/* ── 섹션 제목 ── */
function SectionHeading({ children }) {
  return (
    <h2 className="reveal" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.7rem, 3.2vw, 2.8rem)", color: "#fff", fontWeight: 600, marginBottom: 52, lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

export default function MilitaryLandingPage() {
  const heroRef = useRef(null);

  /* 히어로 텍스트 진입 애니메이션 트리거 */
  useEffect(() => {
    const timer = setTimeout(() => heroRef.current?.classList.add("mil-ready"), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Seo
        title="군형사·군징계 전문 — 법무법인 하이로"
        description="군 수사·군사법원·항고심사위원회의 모든 절차. 군형사사건 변호, 군 징계·인사처분 항고, 국가배상, 병역 분쟁 전문 민간 변호인."
        path="/military"
      />

      {/* 이 페이지 전용 CSS (전역 오염 방지를 위해 인라인 처리) */}
      <style>{`
        .mil-line        { opacity: 0; transform: translateY(32px); transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1); }
        .mil-ready .mil-line                      { opacity: 1; transform: translateY(0); }
        .mil-ready .mil-line:nth-child(2)         { transition-delay: 0.14s; }
        .mil-ready .mil-line:nth-child(3)         { transition-delay: 0.28s; }
        .mil-ready .mil-line:nth-child(4)         { transition-delay: 0.42s; }
        .mil-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .mil-card:hover { transform: translateY(-5px); box-shadow: 0 24px 60px rgba(0,0,0,0.45); border-color: rgba(201,168,76,0.45) !important; }
        .mil-pain:hover { border-left-color: #c9a84c !important; }
        .mil-secondary-btn { transition: color 0.2s, border-color 0.2s; }
        .mil-secondary-btn:hover { color: #fff !important; border-color: rgba(255,255,255,0.55) !important; }
        @media (max-width: 720px) {
          .mil-service-grid { grid-template-columns: 1fr !important; }
          .mil-process-row  { flex-direction: column !important; gap: 32px !important; }
          .mil-connector    { display: none !important; }
          .mil-stats-row    { gap: 28px !important; }
        }
      `}</style>

      {/* ───────────────────── 고정 미니 네비 ───────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(7,12,23,0.92)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
        padding: "14px clamp(20px, 5vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link to="/" style={{ color: C.gold, fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em" }}>
          HIGH &amp; LAW
        </Link>
        <KakaoCtaButton />
      </nav>

      {/* ───────────────────── 히어로 ───────────────────── */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh",
          background: `radial-gradient(ellipse 90% 65% at 50% 35%, ${C.darkLight} 0%, ${C.dark} 100%)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "110px clamp(24px, 7vw, 140px) 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* 배경 격자 패턴 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 72%)",
        }} />
        {/* 좌·우 수직선 장식 */}
        <div aria-hidden="true" style={{ position: "absolute", left: "clamp(20px,5vw,60px)", top: "20%", bottom: "20%", width: 1, background: `linear-gradient(to bottom, transparent, ${C.gold}40, transparent)` }} />
        <div aria-hidden="true" style={{ position: "absolute", right: "clamp(20px,5vw,60px)", top: "20%", bottom: "20%", width: 1, background: `linear-gradient(to bottom, transparent, ${C.gold}40, transparent)` }} />

        <span className="mil-line" style={{ fontSize: 11, letterSpacing: "0.26em", color: C.gold, textTransform: "uppercase", fontWeight: 600, marginBottom: 28 }}>
          MILITARY LAW · 군형사 · 군징계 전문
        </span>
        <h1 className="mil-line" style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(2.4rem, 6vw, 5.2rem)",
          fontWeight: 700, color: "#fff", lineHeight: 1.18,
          maxWidth: 840, marginBottom: 30,
        }}>
          군에서 사건이 생겼다면,<br />
          <span style={{ color: C.gold }}>첫 48시간</span>이 결정합니다
        </h1>
        <p className="mil-line" style={{ fontSize: "clamp(14px, 1.7vw, 17px)", color: C.textDim, lineHeight: 2, maxWidth: 580, marginBottom: 48 }}>
          군수사단 수사부터 군사법원, 항고심사위원회까지 —<br />
          법무법인 하이로는 군의 폐쇄적 절차를 꿰뚫는 민간 변호인으로 즉시 대응합니다.
        </p>
        <div className="mil-line" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <KakaoCtaButton large />
          <Link
            to="/consultation"
            className="mil-secondary-btn"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: C.textDim, fontSize: 14, fontWeight: 500,
              padding: "18px 28px", border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: 4, textDecoration: "none",
            }}
          >
            상담 신청 폼으로
          </Link>
        </div>

        {/* 스크롤 힌트 */}
        <div aria-hidden="true" style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: C.textMuted, textTransform: "uppercase" }}>scroll</span>
          <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, ${C.gold}60, transparent)` }} />
        </div>
      </div>

      {/* ───────────────────── 통계 바 ───────────────────── */}
      <div style={{ background: C.gold, padding: "30px clamp(20px, 7vw, 120px)", display: "flex", justifyContent: "center", gap: "clamp(36px, 8vw, 100px)", flexWrap: "wrap" }} className="mil-stats-row">
        {[
          { value: "48H", label: "초기 전략 수립 목표" },
          { value: "4 절차", label: "형사·징계·보훈·병역 전 영역" },
          { value: "1:1", label: "담당 변호인 직접 대응" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)", fontWeight: 700, color: C.ink, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: "rgba(11,15,24,0.6)", marginTop: 7, letterSpacing: "0.04em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ───────────────────── 고민 상황 ───────────────────── */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <Eyebrow>SITUATION</Eyebrow>
          <SectionHeading>이런 상황이라면 즉시 연락하세요</SectionHeading>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {PAIN_POINTS.map((text, i) => (
              <div
                key={i}
                className="reveal mil-pain"
                style={{
                  padding: "28px 30px",
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `2px solid rgba(201,168,76,0.2)`,
                  transition: "border-color 0.2s",
                }}
              >
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: C.gold, fontWeight: 700, opacity: 0.35, display: "block", marginBottom: 10, lineHeight: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ color: C.text, fontSize: 15, lineHeight: 1.8 }}>{text}</p>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ marginTop: 44, textAlign: "center" }}>
            <KakaoCtaButton large />
          </div>
        </div>
      </RevealSection>

      {/* ───────────────────── 서비스 ───────────────────── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Eyebrow>SERVICES</Eyebrow>
          <SectionHeading>하이로가 완결합니다</SectionHeading>
          <div className="stagger mil-service-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {SERVICES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="reveal mil-card"
                style={{
                  background: C.darkLight, border: `1px solid rgba(201,168,76,0.15)`,
                  borderRadius: 8, padding: "38px 34px",
                }}
              >
                <Icon size={28} color={C.gold} strokeWidth={1.5} style={{ marginBottom: 22 }} />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, color: "#fff", fontWeight: 600, marginBottom: 14 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.9 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ───────────────────── 절차 ───────────────────── */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <Eyebrow>PROCESS</Eyebrow>
          <SectionHeading>상담부터 종결까지</SectionHeading>
          <div className="mil-process-row" style={{ display: "flex", gap: 0, position: "relative" }}>
            {PROCESS_STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="reveal" style={{ flex: 1, paddingRight: 24, position: "relative" }}>
                {/* 스텝 사이 연결선 */}
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="mil-connector" style={{
                    position: "absolute", top: 27, left: "calc(100% - 24px)", width: 48,
                    height: 1,
                    background: `linear-gradient(to right, ${C.gold}80, rgba(201,168,76,0.1))`,
                  }} />
                )}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: `2px solid ${C.gold}`, display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: 22, background: C.dark,
                }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: C.gold, fontWeight: 700 }}>{step}</span>
                </div>
                <h4 style={{ fontSize: 16, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{title}</h4>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.85 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ───────────────────── 왜 하이로 ───────────────────── */}
      <RevealSection bg={C.dark} style={{ padding: "80px clamp(20px, 7vw, 120px)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>WHY HIGH &amp; LAW</Eyebrow>
          <h2 className="reveal" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.7rem, 3vw, 2.6rem)", color: "#fff", fontWeight: 600, marginBottom: 28, lineHeight: 1.3 }}>
            군의 폐쇄적 절차를<br />이해하는 민간 변호인
          </h2>
          <p className="reveal" style={{ fontSize: 15, color: C.textDim, lineHeight: 2.1, marginBottom: 52 }}>
            군형사사건, 군 징계·인사처분 항고, 국가배상, 병역 관련 분쟁까지 —<br />
            군사법원법·군인사법·군인의 지위 및 복무에 관한 기본법 전 영역에서 의뢰인의 권리를 실현합니다.
          </p>
          <div className="reveal stagger" style={{ display: "flex", gap: "clamp(20px, 4vw, 44px)", justifyContent: "center", flexWrap: "wrap" }}>
            {["군사법원법 전 영역 대응", "군 수사 단계부터 즉시 착수", "대법원까지 끝까지"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, color: C.textDim, fontSize: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ───────────────────── 최종 CTA ───────────────────── */}
      <section style={{ background: C.gold, padding: "88px clamp(20px, 7vw, 120px)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 700, color: C.ink, marginBottom: 18, lineHeight: 1.2 }}>
          지금 바로 변호인을 선임하세요
        </h2>
        <p style={{ fontSize: 15, color: "rgba(11,15,24,0.6)", marginBottom: 44, lineHeight: 1.9 }}>
          군 사건은 시간이 가장 중요합니다. 첫 상담은 카카오톡으로 신속히 연결됩니다.
        </p>
        <KakaoCtaButton large dark />
      </section>

      {/* ───────────────────── 미니 푸터 ───────────────────── */}
      <footer style={{
        background: "#040810",
        padding: "28px clamp(20px, 7vw, 120px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>© 2025 법무법인 하이로. All rights reserved.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { to: "/privacy", label: "개인정보처리방침" },
            { to: "/", label: "법인 홈페이지" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{ fontSize: 12, color: C.textMuted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </>
  );
}
