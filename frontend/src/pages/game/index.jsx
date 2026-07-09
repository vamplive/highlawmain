/** HIGHLAW 게임센터 — 게임사기 전문 독립 랜딩 페이지 /game
 * 풀스크린 다크 테마. Header·Footer 없음. 카카오톡 채널 즉시 상담 CTA.
 * 섹션: 미니 네비 → 히어로 → 통계 바 → 고민 상황 → 서비스 → 절차 → 최종 CTA
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldAlert, Search, Gavel, FileWarning, Gamepad2 } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

/* ── 색상 토큰 ── */
const C = {
  accent: "#3b82f6",
  accentHover: "#2563eb",
  accentDim: "rgba(59,130,246,0.12)",
  dark: "#06090f",
  darkMid: "#080e1c",
  darkLight: "#0d1526",
  text: "rgba(255,255,255,0.85)",
  textDim: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.35)",
  ink: "#060810",
  gold: "#c9a84c",
};

/* ── 콘텐츠 데이터 ── */
const PAIN_POINTS = [
  "게임 아이템이나 계정 거래에서 사기를 당해 현금 피해를 입었다",
  "계정이 해킹·도용되어 아이템과 게임머니를 탈취당했다",
  "게임운영사로부터 부당한 영구정지·이용제한 처분을 받았다",
  "상대방의 게임머니·아이템 편취로 민·형사상 피해가 발생했다",
];

const SERVICES = [
  {
    Icon: ShieldAlert,
    title: "아이템·계정 거래 사기",
    desc: "현금 거래 플랫폼·직거래에서 발생한 아이템 사기, 대금 미지급, 되팔기 사기에 대한 형사 고소 및 민사 손해배상 청구를 병행 수행합니다.",
  },
  {
    Icon: Search,
    title: "해킹·계정 도용 피해 구제",
    desc: "무단 접속·계정 탈취·개인정보 침해에 대한 형사 고소와 피해액 산정, 운영사 대상 손해배상 청구 절차를 원스톱으로 처리합니다.",
  },
  {
    Icon: FileWarning,
    title: "게임머니 편취 민사소송",
    desc: "재화성 아이템·게임머니의 재산적 가치를 법적으로 입증하여 부당이득 반환 및 손해배상 소송으로 피해를 회복합니다.",
  },
  {
    Icon: Gavel,
    title: "운영사 부당 제재 이의제기",
    desc: "근거 없는 영구정지·이용제한 처분에 대한 운영사 교섭, 약관 위반 항의 및 행정·민사상 이의신청 절차를 대리합니다.",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "피해 분석", desc: "사기 유형·피해액·관련 플랫폼 확인, 형사·민사 가능성 진단" },
  { step: "02", title: "디지털 증거 확보", desc: "채팅 로그, 거래 내역, IP 기록, 게임 데이터 등 디지털 증거 수집·보전" },
  { step: "03", title: "전략 수립", desc: "형사 고소·민사 청구·운영사 교섭 등 병행 전략 설계 및 피해 극대화 회수 방안 마련" },
  { step: "04", title: "고소·소송 수행", desc: "경찰·검찰 수사 지원, 법원 변론, 운영사 협상까지 종결까지 전담 변호인 동행" },
];

/* ── 카카오톡 CTA 버튼 ── */
function KakaoCtaButton({ large = false, dark = false }) {
  const bg = dark ? C.ink : C.accent;
  const bgHover = dark ? "#0a1528" : C.accentHover;
  const color = dark ? C.accent : "#fff";

  return (
    <a
      href={KAKAO_CHANNEL_CHAT}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center",
        gap: large ? 12 : 8,
        background: bg, color,
        fontWeight: 700, fontSize: large ? 17 : 14,
        padding: large ? "18px 44px" : "12px 24px",
        borderRadius: 4, textDecoration: "none", cursor: "pointer",
        transition: "background 0.2s", whiteSpace: "nowrap",
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
    <section ref={revealRef} style={{ background: bg, padding: "88px clamp(20px, 7vw, 120px)", ...style }}>
      {children}
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="reveal" style={{
      fontSize: 11, letterSpacing: "0.22em", color: C.accent,
      textTransform: "uppercase", fontWeight: 600, marginBottom: 18,
    }}>
      {children}
    </p>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="reveal" style={{
      fontFamily: "var(--font-serif)",
      fontSize: "clamp(1.7rem, 3.2vw, 2.8rem)",
      color: "#fff", fontWeight: 600, marginBottom: 52, lineHeight: 1.3,
    }}>
      {children}
    </h2>
  );
}

export default function GameCenterPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => heroRef.current?.classList.add("gc-ready"), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Seo
        title="게임사기 전문 — HIGHLAW 게임센터"
        description="아이템 거래 사기, 계정 해킹·도용, 게임머니 편취, 운영사 부당 제재까지 — 디지털 증거를 이해하는 법무법인 하이로 게임센터가 형사·민사 양면으로 피해를 회복합니다."
        path="/game"
      />

      <style>{`
        .gc-line { opacity: 0; transform: translateY(32px); transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1); }
        .gc-ready .gc-line { opacity: 1; transform: translateY(0); }
        .gc-ready .gc-line:nth-child(2) { transition-delay: 0.14s; }
        .gc-ready .gc-line:nth-child(3) { transition-delay: 0.28s; }
        .gc-ready .gc-line:nth-child(4) { transition-delay: 0.42s; }
        .gc-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .gc-card:hover { transform: translateY(-5px); box-shadow: 0 24px 60px rgba(0,0,0,0.5); border-color: rgba(59,130,246,0.45) !important; }
        .gc-pain:hover { border-left-color: #3b82f6 !important; }
        .gc-secondary-btn { transition: color 0.2s, border-color 0.2s; }
        .gc-secondary-btn:hover { color: #fff !important; border-color: rgba(255,255,255,0.55) !important; }
        @media (max-width: 720px) {
          .gc-service-grid { grid-template-columns: 1fr !important; }
          .gc-process-row  { flex-direction: column !important; gap: 32px !important; }
          .gc-connector    { display: none !important; }
          .gc-stats-row    { gap: 28px !important; }
        }
      `}</style>

      {/* ── 고정 미니 네비 ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(6,9,15,0.92)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(59,130,246,0.12)",
        padding: "14px clamp(20px, 5vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link to="/" style={{ color: C.gold, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em" }}>
            HIGH &amp; LAW
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ color: C.accent, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            게임센터
          </span>
        </div>
        <KakaoCtaButton />
      </nav>

      {/* ── 히어로 ── */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh",
          background: `radial-gradient(ellipse 90% 65% at 50% 35%, ${C.darkLight} 0%, ${C.dark} 100%)`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", textAlign: "center",
          padding: "110px clamp(24px, 7vw, 140px) 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* 배경 격자 패턴 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 72%)",
        }} />
        <div aria-hidden="true" style={{ position: "absolute", left: "clamp(20px,5vw,60px)", top: "20%", bottom: "20%", width: 1, background: `linear-gradient(to bottom, transparent, rgba(59,130,246,0.4), transparent)` }} />
        <div aria-hidden="true" style={{ position: "absolute", right: "clamp(20px,5vw,60px)", top: "20%", bottom: "20%", width: 1, background: `linear-gradient(to bottom, transparent, rgba(59,130,246,0.4), transparent)` }} />

        <div className="gc-line" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <Gamepad2 size={14} color={C.accent} />
          <span style={{ fontSize: 11, letterSpacing: "0.26em", color: C.accent, textTransform: "uppercase", fontWeight: 600 }}>
            GAME FRAUD · 게임사기 · 계정 도용 · 운영사 제재
          </span>
        </div>
        <h1 className="gc-line" style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(2.4rem, 6vw, 5.2rem)",
          fontWeight: 700, color: "#fff", lineHeight: 1.18,
          maxWidth: 860, marginBottom: 30,
        }}>
          게임에서 피해를 입었다면,<br />
          <span style={{ color: C.accent }}>디지털 증거</span>가 핵심입니다
        </h1>
        <p className="gc-line" style={{
          fontSize: "clamp(14px, 1.7vw, 17px)", color: C.textDim,
          lineHeight: 2, maxWidth: 600, marginBottom: 48,
        }}>
          아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지 —<br />
          HIGHLAW 게임센터는 온라인 게임 환경을 이해하는 변호인으로 형사·민사 양면에서 피해를 회복합니다.
        </p>
        <div className="gc-line" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <KakaoCtaButton large />
          <Link
            to="/consultation"
            className="gc-secondary-btn"
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
          <div style={{ width: 1, height: 44, background: `linear-gradient(to bottom, rgba(59,130,246,0.6), transparent)` }} />
        </div>
      </div>

      {/* ── 통계 바 ── */}
      <div className="gc-stats-row" style={{
        background: C.accent,
        padding: "30px clamp(20px, 7vw, 120px)",
        display: "flex", justifyContent: "center",
        gap: "clamp(36px, 8vw, 100px)", flexWrap: "wrap",
      }}>
        {[
          { value: "형사+민사", label: "양면 전략으로 피해 극대화 회수" },
          { value: "디지털 증거", label: "게임 로그·거래 내역 전문 분석" },
          { value: "1:1", label: "담당 변호인 직접 대응" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.3rem, 2.5vw, 2rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 7, letterSpacing: "0.04em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── 고민 상황 ── */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <Eyebrow>SITUATION</Eyebrow>
          <SectionHeading>이런 상황이라면 즉시 연락하세요</SectionHeading>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {PAIN_POINTS.map((text, i) => (
              <div
                key={i}
                className="reveal gc-pain"
                style={{
                  padding: "28px 30px",
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `2px solid rgba(59,130,246,0.2)`,
                  transition: "border-color 0.2s",
                }}
              >
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: C.accent, fontWeight: 700, opacity: 0.35, display: "block", marginBottom: 10, lineHeight: 1 }}>
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

      {/* ── 서비스 ── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Eyebrow>SERVICES</Eyebrow>
          <SectionHeading>HIGHLAW 게임센터가 완결합니다</SectionHeading>
          <div className="stagger gc-service-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {SERVICES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="reveal gc-card"
                style={{
                  background: C.darkLight,
                  border: `1px solid rgba(59,130,246,0.15)`,
                  borderRadius: 8, padding: "38px 34px",
                }}
              >
                <Icon size={28} color={C.accent} strokeWidth={1.5} style={{ marginBottom: 22 }} />
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, color: "#fff", fontWeight: 600, marginBottom: 14 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.9 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 절차 ── */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <Eyebrow>PROCESS</Eyebrow>
          <SectionHeading>상담부터 종결까지</SectionHeading>
          <div className="gc-process-row" style={{ display: "flex", gap: 0, position: "relative" }}>
            {PROCESS_STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="reveal" style={{ flex: 1, paddingRight: 24, position: "relative" }}>
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="gc-connector" style={{
                    position: "absolute", top: 27, left: "calc(100% - 24px)", width: 48, height: 1,
                    background: `linear-gradient(to right, rgba(59,130,246,0.8), rgba(59,130,246,0.1))`,
                  }} />
                )}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: `2px solid ${C.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 22, background: C.dark,
                }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: C.accent, fontWeight: 700 }}>{step}</span>
                </div>
                <h4 style={{ fontSize: 16, color: "#fff", fontWeight: 600, marginBottom: 10 }}>{title}</h4>
                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.85 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 왜 하이로 게임센터 ── */}
      <RevealSection bg={C.dark} style={{ padding: "80px clamp(20px, 7vw, 120px)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>WHY HIGHLAW 게임센터</Eyebrow>
          <h2 className="reveal" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.7rem, 3vw, 2.6rem)", color: "#fff", fontWeight: 600, marginBottom: 28, lineHeight: 1.3 }}>
            게임 환경을 이해하는<br />전문 변호인
          </h2>
          <p className="reveal" style={{ fontSize: 15, color: C.textDim, lineHeight: 2.1, marginBottom: 52 }}>
            아이템·게임머니의 재산적 가치 입증, 디지털 증거 수집 및 분석,<br />
            운영사 약관 해석까지 — 온라인 게임 고유의 법적 쟁점을 꿰뚫는 변호인이 피해를 끝까지 회복합니다.
          </p>
          <div className="reveal stagger" style={{ display: "flex", gap: "clamp(20px, 4vw, 44px)", justifyContent: "center", flexWrap: "wrap" }}>
            {["아이템 재산성 법적 입증", "디지털 증거 전문 분석", "형사·민사 병행 전략"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, color: C.textDim, fontSize: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 최종 CTA ── */}
      <section style={{ background: C.accent, padding: "88px clamp(20px, 7vw, 120px)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 700, color: "#fff", marginBottom: 18, lineHeight: 1.2 }}>
          지금 바로 변호인을 선임하세요
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 44, lineHeight: 1.9 }}>
          디지털 증거는 시간이 지날수록 사라집니다. 지금 바로 카카오톡으로 연결하세요.
        </p>
        <KakaoCtaButton large dark />
      </section>

      {/* ── 미니 푸터 ── */}
      <footer style={{
        background: "#03050c",
        padding: "28px clamp(20px, 7vw, 120px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>© 2025 법무법인 하이로. All rights reserved.</span>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { to: "/privacy", label: "개인정보처리방침" },
            { to: "/", label: "법인 홈페이지" },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              style={{ fontSize: 12, color: C.textMuted, textDecoration: "none", transition: "color 0.2s" }}
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
