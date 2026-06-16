/** 군 징계사건 비대면 케어 랜딩 페이지 — /military2
 * military/index.jsx 팔레트 · 로고 · 푸터 통일.
 * 시네마틱 히어로 패럴랙스 · 플로팅 CTA 바 · 880→39만 카운트다운.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, AlertTriangle, ChevronRight, X } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

/* ── 색상 토큰 — military/index.jsx 와 동일 ── */
const C = {
  gold:      "#c9a84c",
  goldHover: "#b8923e",
  goldDim:   "rgba(201,168,76,0.12)",
  goldBorder:"rgba(201,168,76,0.22)",
  dark:      "#070c17",
  darkMid:   "#0b1529",
  darkLight: "#0f1e3c",
  text:      "rgba(255,255,255,0.85)",
  textDim:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.35)",
  ink:       "#0b0f18",
  warn:      "#e05a2b",
};

/* ── 사진 경로 (사진 폴더 → public/military2/photos) ── */
const P = {
  heroBg:    "/military2/photos/KakaoTalk_20260607_225512717_02.jpg",   // 도시뷰 배경
  teamWarm:  "/military2/photos/KakaoTalk_20260607_225512717_20.jpg",   // 하이로 리셉션
  teamDark:  "/military2/photos/KakaoTalk_20260607_225512717_24.jpg",   // 마블 팀
  atmo1:     "/military2/photos/KakaoTalk_20260607_225512717_03.jpg",   // 하이로 간판
  atmo2:     "/military2/photos/KakaoTalk_20260607_225512717_08.jpg",   // 팔짱 도시뷰
  atmo3:     "/military2/photos/KakaoTalk_20260607_225512717_01.jpg",   // 마블벽 정면
  /* 포털 프로필 사진 (홈페이지·포털과 동일 경로) */
  kang:  "/lawyers/kang-min-gu/kang-min-gu_profile.jpg",
  jo:    "/lawyers/jo-deok-jae/jo-deok-jae_profile.jpg",
  kim:   "/lawyers/kim-beom/kim-beom_profile.jpg",
};

/* ── 재사용 헬퍼 ── */
function RevealSection({ bg, children, style = {} }) {
  const ref = useReveal();
  return (
    <section ref={ref} style={{ background: bg, padding: "88px clamp(20px, 7vw, 120px)", ...style }}>
      {children}
    </section>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="reveal" style={{ fontSize: 11, letterSpacing: "0.24em", color: C.gold, textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
      {children}
    </p>
  );
}

function SectionHeading({ children, center = false }) {
  return (
    <h2 className="reveal" style={{
      fontFamily: "var(--font-serif)",
      fontSize: "clamp(1.7rem, 3.2vw, 2.7rem)",
      color: "#fff", fontWeight: 600, marginBottom: 48, lineHeight: 1.3,
      textAlign: center ? "center" : undefined,
    }}>
      {children}
    </h2>
  );
}

/* ── 카카오 CTA ── */
function KakaoCTA({ large = false, dark = false, label }) {
  const bg       = dark ? C.ink : C.gold;
  const bgHover  = dark ? "#152038" : C.goldHover;
  const color    = dark ? C.gold : C.ink;
  const text     = label ?? (large ? "카카오톡으로 즉시 상담" : "카카오톡 상담");
  return (
    <a
      href={KAKAO_CHANNEL_CHAT}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: large ? 12 : 8,
        background: bg, color, fontWeight: 700,
        fontSize: large ? 17 : 14,
        padding: large ? "18px 44px" : "12px 24px",
        borderRadius: 4, textDecoration: "none", cursor: "pointer",
        transition: "background 0.2s", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = bgHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
    >
      <MessageCircle size={large ? 22 : 16} />
      {text}
    </a>
  );
}

/* ── 880만→39만 카운트다운 ── */
function PriceCountdown() {
  const [val, setVal]       = useState(8800000);
  const [done, setDone]     = useState(false);
  const started             = useRef(false);
  const ref                 = useRef(null);
  const FROM = 8800000, TO = 390000, DURATION = 2200;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const start = performance.now();
      function frame(now) {
        const t      = Math.min((now - start) / DURATION, 1);
        const eased  = 1 - Math.pow(1 - t, 3);           // ease-out-cubic
        const cur    = Math.round(FROM - eased * (FROM - TO));
        setVal(cur);
        if (t < 1) requestAnimationFrame(frame);
        else       setDone(true);
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <p style={{ fontSize: 13, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 10 }}>
        기존 오프라인 변호사 비용
      </p>
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* 880만원 가로줄 (초반에만) */}
        {!done && (
          <span style={{
            position: "absolute", top: "50%", left: 0, right: 0,
            height: 4, background: C.gold, opacity: val < 2000000 ? 1 : 0,
            transition: "opacity 0.4s", pointerEvents: "none",
          }} />
        )}
        <p style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(3.8rem, 10vw, 7.5rem)",
          fontWeight: 700, lineHeight: 1,
          color: done ? C.gold : "rgba(255,255,255,0.7)",
          transition: "color 0.6s",
          letterSpacing: "-0.02em",
        }}>
          {val.toLocaleString("ko-KR")}
        </p>
      </div>
      <p style={{ fontSize: 14, color: C.textDim, marginTop: 8, letterSpacing: "0.06em" }}>원</p>
      {done && (
        <p style={{
          marginTop: 20,
          fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
          fontWeight: 700, color: "#fff",
          animation: "m2-fade-in 0.6s ease both",
        }}>
          하이로는 <span style={{ color: C.gold, fontSize: "1.2em" }}>39만원</span>에서 시작합니다!
        </p>
      )}
    </div>
  );
}

export default function Military2LandingPage() {
  const heroRef      = useRef(null);
  const bgRef        = useRef(null);
  const [showFloat, setShowFloat]   = useState(false);
  const [floatDism, setFloatDism]   = useState(false);

  /* 히어로 진입 애니메이션 */
  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("m2-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  /* 스크롤: 패럴랙스 + 플로팅 바 */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${y * 0.38}px)`;
      }
      setShowFloat(y > 560);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Seo
        title="군 징계사건 비대면 케어 39만원 — 법무법인 하이로"
        description="39만원으로 군 징계기록 검토 및 의견서 제출. 전원 군법무관 출신 징계 전문가. 비대면 하이로 케어."
        path="/military2"
      />

      {/* ── 전용 CSS ── */}
      <style>{`
        /* 히어로 진입 */
        .m2-line { opacity:0; transform:translateY(36px);
          transition: opacity 0.9s cubic-bezier(.16,1,.3,1), transform 0.9s cubic-bezier(.16,1,.3,1); }
        .m2-ready .m2-line                { opacity:1; transform:translateY(0); }
        .m2-ready .m2-line:nth-child(2)   { transition-delay:.13s; }
        .m2-ready .m2-line:nth-child(3)   { transition-delay:.26s; }
        .m2-ready .m2-line:nth-child(4)   { transition-delay:.39s; }
        .m2-ready .m2-line:nth-child(5)   { transition-delay:.52s; }

        /* 카드 호버 */
        .m2-card { transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease; }
        .m2-card:hover { transform:translateY(-6px); box-shadow:0 20px 56px rgba(0,0,0,.5); border-color:rgba(201,168,76,.45) !important; }
        .m2-pain:hover { border-left-color:#c9a84c !important; }

        /* 플로팅 바 */
        @keyframes m2-slide-up { from{transform:translateY(110%);opacity:0} to{transform:translateY(0);opacity:1} }
        .m2-float { animation: m2-slide-up 0.44s cubic-bezier(.16,1,.3,1) both; }

        /* 페이드인 */
        @keyframes m2-fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* 골드 펄스 (가격 완료 시) */
        @keyframes m2-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 0 14px rgba(201,168,76,0)} }

        /* 보조 버튼 */
        .m2-sec-btn { transition: color .2s, border-color .2s; }
        .m2-sec-btn:hover { color:#fff !important; border-color:rgba(255,255,255,.55) !important; }

        /* 반응형 */
        @media (max-width:768px) {
          .m2-3col { grid-template-columns:1fr !important; }
          .m2-2col { grid-template-columns:1fr !important; }
          .m2-process-row { flex-direction:column !important; gap:32px !important; }
          .m2-connector { display:none !important; }
          .m2-stats { gap:28px !important; }
          .m2-table th,.m2-table td { padding:10px 8px !important; font-size:12px !important; }
          .m2-float-inner { flex-direction:column !important; gap:10px !important; text-align:center; }
        }
      `}</style>

      {/* ── 고정 미니 네비 (military/index.jsx 와 동일) ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(7,12,23,0.92)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.goldBorder}`,
        padding: "14px clamp(20px, 5vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link to="/" style={{
          color: C.gold, fontFamily: "var(--font-serif)", fontSize: 19,
          fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em",
        }}>
          HIGH &amp; LAW
        </Link>
        <KakaoCTA />
      </nav>

      {/* ════════════════════════════════════════════
          히어로 — 시네마틱 풀스크린 + 패럴랙스
      ════════════════════════════════════════════ */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh", position: "relative",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "110px clamp(24px, 7vw, 140px) 80px",
          overflow: "hidden",
        }}
      >
        {/* 패럴랙스 배경 이미지 */}
        <div ref={bgRef} aria-hidden="true" style={{
          position: "absolute", inset: "-20% 0",
          backgroundImage: `url(${P.heroBg})`,
          backgroundSize: "cover", backgroundPosition: "center 30%",
          willChange: "transform",
        }} />
        {/* 어두운 오버레이 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(160deg, rgba(7,12,23,0.82) 0%, rgba(7,12,23,0.72) 50%, rgba(7,12,23,0.88) 100%)`,
        }} />
        {/* 격자 패턴 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 70%)",
        }} />
        {/* 수직선 장식 */}
        <div aria-hidden="true" style={{ position:"absolute", left:"clamp(20px,5vw,60px)", top:"20%", bottom:"20%", width:1, background:`linear-gradient(to bottom, transparent, ${C.gold}40, transparent)` }} />
        <div aria-hidden="true" style={{ position:"absolute", right:"clamp(20px,5vw,60px)", top:"20%", bottom:"20%", width:1, background:`linear-gradient(to bottom, transparent, ${C.gold}40, transparent)` }} />

        {/* 콘텐츠 */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="m2-line" style={{ fontSize:11, letterSpacing:"0.26em", color:C.gold, textTransform:"uppercase", fontWeight:600, marginBottom:24, display:"block" }}>
            DISCIPLINARY LEGAL CARE · 군 징계 전문
          </span>
          <h1 className="m2-line" style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.4rem, 6vw, 5rem)",
            fontWeight: 700, color: "#fff", lineHeight: 1.18,
            maxWidth: 840, marginBottom: 24,
          }}>
            군 징계 사건의 비대면<br />
            <span style={{ color: C.gold }}>하이로(HighLaw) 케어</span>
          </h1>
          <p className="m2-line" style={{ fontSize:"clamp(15px,1.8vw,19px)", color:C.textDim, lineHeight:1.85, maxWidth:560, marginBottom:8 }}>
            39만원으로 징계기록 검토 및 의견서 제출
          </p>
          <p className="m2-line" style={{ fontSize:13, color:C.textMuted, marginBottom:52, letterSpacing:"0.06em" }}>
            전원 군법무관 출신 · 징계 전문가
          </p>
          <div className="m2-line" style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
            <KakaoCTA large />
            <Link to="/consultation" className="m2-sec-btn" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              color:C.textDim, fontSize:14, fontWeight:500,
              padding:"18px 28px", border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:4, textDecoration:"none",
            }}>
              상담 신청 폼으로
            </Link>
          </div>
        </div>

        {/* 스크롤 힌트 */}
        <div aria-hidden="true" style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, letterSpacing:"0.2em", color:C.textMuted, textTransform:"uppercase" }}>scroll</span>
          <div style={{ width:1, height:44, background:`linear-gradient(to bottom, ${C.gold}60, transparent)` }} />
        </div>
      </div>

      {/* ── 통계 바 (gold — military 스타일) ── */}
      <div className="m2-stats" style={{ background:C.gold, padding:"28px clamp(20px,7vw,120px)", display:"flex", justifyContent:"center", gap:"clamp(32px,8vw,100px)", flexWrap:"wrap" }}>
        {[
          { value: "39만원",  label: "비대면 징계 기록 검토·의견서" },
          { value: "수천 건", label: "징계 데이터 기반 분석" },
          { value: "1:1",    label: "담당 변호인 직접 대응" },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.5rem,2.8vw,2.2rem)", fontWeight:700, color:C.ink, lineHeight:1 }}>{value}</p>
            <p style={{ fontSize:12, color:"rgba(11,15,24,0.6)", marginTop:7, letterSpacing:"0.04em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          수사 Q — "왜 변호사가 필요한가요?"
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center" }}>
          <Eyebrow>COMMON QUESTION</Eyebrow>
          <h2 className="reveal" style={{
            fontFamily:"var(--font-serif)",
            fontSize:"clamp(1.5rem,3vw,2.6rem)",
            color:"#fff", fontWeight:600, lineHeight:1.45, marginBottom:32,
          }}>
            제가 분명히 잘못했고,<br />
            단순해 보이는 징계사건인데<br />
            <span style={{ color:C.gold }}>왜 변호사가 필요한가요?</span>
          </h2>
          <p className="reveal" style={{ fontSize:15, color:C.textDim, lineHeight:2, maxWidth:600, margin:"0 auto" }}>
            군 징계는 형사와 달리 부대 내부 절차로 진행되어
            법률 지식 없이도 과도한 처분이 쉽게 내려집니다.
            전문가의 개입이 결과를 결정적으로 바꿉니다.
          </p>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          징계위기의 본질 — 3 카드
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>
          <Eyebrow>THE NATURE OF RISK</Eyebrow>
          <SectionHeading>징계위기의 본질</SectionHeading>
          <div className="m2-3col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {[
              {
                n: "01", title: "자의적 결정",
                body: "형사와 달리 부대 간부들이 결정하기에 과도한 처분이 내려질 수 있습니다.",
              },
              {
                n: "02", title: "판례와의 괴리",
                body: "법률 지식이 부족한 징계위는 유사사례보다 훨씬 무거운 징계를 내리곤 합니다.",
              },
              {
                n: "03", title: "절차적 하자",
                body: "전문가가 검토하면 절차상 하자를 발견해 징계 무효화 및 감경이 가능합니다.",
              },
            ].map((item) => (
              <div key={item.n} className="reveal m2-card" style={{
                background:C.darkLight, border:`1px solid ${C.goldBorder}`,
                borderRadius:8, padding:"38px 34px",
              }}>
                <span style={{ fontFamily:"var(--font-serif)", fontSize:36, color:C.gold, fontWeight:700, opacity:.3, display:"block", marginBottom:16, lineHeight:1 }}>
                  {item.n}
                </span>
                <h3 style={{ fontFamily:"var(--font-serif)", fontSize:21, color:"#fff", fontWeight:600, marginBottom:14 }}>{item.title}</h3>
                <p style={{ fontSize:14, color:C.textDim, lineHeight:1.9 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          징계 어차피 전역하면 그만? — 사진 병치
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <Eyebrow>LONG-TERM CONSEQUENCES</Eyebrow>
          <SectionHeading>징계 어차피 전역하면 그만 아니야?</SectionHeading>
          <div className="m2-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
            <div>
              {[
                {
                  title: "상병 전역의 낙인",
                  body: "강등 혹은 누적 징계로 인한 상병 전역은 병적증명서상 사회에서도 바로 인식 가능합니다.",
                },
                {
                  title: "전역일 연기",
                  body: "군기교육대 징계는 전역일 자체가 미뤄짐에 따라 병적증명서상 인기가 가능합니다.",
                },
              ].map((item, i) => (
                <div key={i} className="reveal m2-pain" style={{
                  padding: "24px 28px", marginBottom: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `2px solid ${C.goldBorder}`,
                  transition: "border-color 0.2s",
                }}>
                  <p style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:8 }}>
                    <span style={{ color:C.gold }}>· </span>{item.title}
                  </p>
                  <p style={{ fontSize:14, color:C.textDim, lineHeight:1.85 }}>{item.body}</p>
                </div>
              ))}
              <div className="reveal" style={{
                marginTop:20, background:"rgba(224,90,43,0.1)",
                border:`1px solid rgba(224,90,43,0.4)`,
                borderRadius:6, padding:"14px 20px",
                display:"flex", alignItems:"flex-start", gap:10,
              }}>
                <AlertTriangle size={18} color={C.warn} style={{ flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:13, color:"#f08060", fontWeight:600, margin:0, lineHeight:1.65 }}>
                  이 꼬리표는 취업 시 치명적인 결격 사유가 될 수 있습니다.
                </p>
              </div>
            </div>
            <div className="reveal" style={{ position:"relative" }}>
              <img
                src={P.atmo3}
                alt="변호사 상담"
                style={{
                  width:"100%", borderRadius:8,
                  boxShadow:"0 20px 64px rgba(0,0,0,0.6)",
                  filter:"brightness(0.88) saturate(0.8)",
                }}
                loading="lazy"
              />
              <div style={{
                position:"absolute", bottom:20, left:20, right:20,
                background:"rgba(7,12,23,0.85)", backdropFilter:"blur(8px)",
                borderTop:`2px solid ${C.gold}`,
                padding:"14px 18px",
              }}>
                <p style={{ fontSize:13, color:"#fff", fontWeight:600, margin:0 }}>
                  지금 전문가에게 검토받으세요
                </p>
                <p style={{ fontSize:11, color:C.textMuted, margin:"4px 0 0" }}>
                  비대면 · 39만원 정찰제
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          가격 카운트다운 — 880만 → 39만
      ════════════════════════════════════════════ */}
      <section style={{ background:C.dark, padding:"96px clamp(20px,7vw,120px)", textAlign:"center" }}>
        <Eyebrow>REVOLUTIONARY PRICING</Eyebrow>
        <PriceCountdown />
      </section>

      {/* ════════════════════════════════════════════
          거품을 걷어낸 혁신
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth:820, margin:"0 auto" }}>
          <Eyebrow>COST INNOVATION</Eyebrow>
          <SectionHeading>거품을 걷어낸 혁신</SectionHeading>
          {/* 바 차트 비교 */}
          <div className="reveal" style={{ marginBottom:40 }}>
            {[
              { label:"기존 오프라인 수임료", ratio:"100%", minW:"100%", text:"수백만 원 (100%)", bg:"rgba(255,255,255,0.2)" },
              { label:"하이로 비대면 케어",   ratio:"10%",  minW:130,    text:"39만원 (10%)",    bg:C.gold },
            ].map((bar) => (
              <div key={bar.label} style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
                <span style={{ fontSize:12, color:C.textMuted, minWidth:140, flexShrink:0, textAlign:"right" }}>
                  {bar.label}
                </span>
                <div style={{
                  width:bar.ratio, minWidth:bar.minW,
                  height:36, background:bar.bg, borderRadius:4,
                  display:"flex", alignItems:"center", paddingRight:14,
                  justifyContent:"flex-end",
                  transition:"width 1s ease",
                }}>
                  <span style={{ fontSize:12, color:bar.bg === C.gold ? C.ink : "#fff", fontWeight:700 }}>
                    {bar.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <h3 className="reveal" style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(1.3rem,2.5vw,2rem)", color:"#fff", marginBottom:18 }}>
            90%의 불필요한 비용 제거
          </h3>
          <p className="reveal" style={{ fontSize:15, color:C.textDim, lineHeight:2 }}>
            변호사 비용의 상당부분은 <strong style={{ color:"#fff" }}>지방 부대 출장비</strong>입니다.<br />
            하이로는 비대면 고밀도 대리 서비스를 통해 거품을 제거했습니다.<br />
            이제 39만원으로 전직 군검사 출신 변호사의 조력을 받을 수 있습니다.
          </p>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          비대면 징계대리 솔루션 — 4단계 수직
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <Eyebrow>REMOTE DEFENSE SOLUTION</Eyebrow>
          <SectionHeading>비대면 징계대리 솔루션</SectionHeading>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[
              { title:"징계기록 정밀 검토",    body:"수천건의 데이터를 기반으로 절차상 하자를 완벽히 분석합니다." },
              { title:"징계위원회 의견서 제출", body:"위원회를 설득할 수 있는 날카로운 법리적 의견서를 제출합니다." },
              { title:"정당성 사후 확인",       body:"위원회 종료 후 정보공개를 통해 정당한 징계 여부를 끝까지 추적합니다." },
              { title:"행정소송 실익 분석",     body:"항고 및 행정소송으로 이어질 경우의 승산과 실익을 진단합니다." },
            ].map((item, i) => (
              <div key={i} className="reveal" style={{
                display:"flex", gap:28,
                borderLeft:`2px solid ${i === 3 ? "transparent" : C.goldBorder}`,
                paddingLeft:32, paddingBottom:36,
                marginLeft:12, position:"relative",
              }}>
                {/* 스텝 원 */}
                <div style={{
                  position:"absolute", left:-14,
                  width:28, height:28, borderRadius:"50%",
                  border:`2px solid ${C.gold}`, background:C.dark,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <span style={{ fontFamily:"var(--font-serif)", fontSize:12, color:C.gold, fontWeight:700 }}>
                    {String(i+1).padStart(2,"0")}
                  </span>
                </div>
                <div>
                  <h4 style={{ fontSize:17, color:"#fff", fontWeight:600, marginBottom:8 }}>{item.title}</h4>
                  <p style={{ fontSize:14, color:C.textDim, lineHeight:1.9, margin:0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ marginTop:16, textAlign:"center" }}>
            <KakaoCTA large />
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          인용구 — "저렴하면 퀄리티가 낮다?"
      ════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:"96px clamp(20px,7vw,120px)", textAlign:"center" }}>
        {/* 배경 사진 */}
        <div aria-hidden="true" style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${P.teamDark})`,
          backgroundSize:"cover", backgroundPosition:"center 40%",
          filter:"brightness(0.18) saturate(0.5)",
        }} />
        <div aria-hidden="true" style={{ position:"absolute", inset:0, background:"rgba(7,12,23,0.7)" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:720, margin:"0 auto" }}>
          <p className="reveal" style={{ fontFamily:"var(--font-serif)", fontSize:72, color:C.gold, lineHeight:.8, marginBottom:12 }}>"</p>
          <h2 className="reveal" style={{
            fontFamily:"var(--font-serif)",
            fontSize:"clamp(1.6rem,3.5vw,2.8rem)",
            color:"#fff", fontWeight:700, lineHeight:1.35, marginBottom:24,
          }}>
            저렴하면 퀄리티가 낮다?<br />
            <span style={{ color:C.gold }}>천만의 말씀입니다.</span>
          </h2>
          <p className="reveal" style={{ fontSize:15, color:C.textDim, lineHeight:2 }}>
            하이로의 혁신은 서비스의 타협이 아닌,<br />
            불필요한 이동 경비를 제거한 스마트한 결과입니다.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          압도적 전문성 — 팀 사진 + 변호사 카드
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth:1080, margin:"0 auto" }}>
          <Eyebrow>OUR EXPERTISE</Eyebrow>
          <SectionHeading>하이로의 압도적 전문성</SectionHeading>

          {/* 팀 사진 풀폭 */}
          <div className="reveal" style={{ marginBottom:48, position:"relative", borderRadius:8, overflow:"hidden" }}>
            <img
              src={P.teamWarm}
              alt="법무법인 하이로 팀"
              style={{ width:"100%", maxHeight:380, objectFit:"cover", objectPosition:"center 25%", display:"block" }}
              loading="lazy"
            />
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to right, rgba(7,12,23,0.5) 0%, transparent 40%, transparent 60%, rgba(7,12,23,0.5) 100%)",
            }} />
          </div>

          {/* 변호사 카드 3개 — 포털과 동일 프로필 사진 */}
          <div className="m2-3col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:40 }}>
            {[
              {
                img: P.kang, name: "강민구 변호사",
                career: ["해병대 시험부 군검사", "해군전인사정보부 군검사", "방위사업청 군법무관"],
              },
              {
                img: P.jo, name: "조덕재 변호사",
                career: ["육군 13년간 군검사 및 징계항고부", "국방부 법무관리관실 군법무관"],
              },
              {
                img: P.kim, name: "김범 변호사",
                career: ["육군 23년간 군검사 및 징계항고", "국군부 송무팀 군법무관"],
              },
            ].map((l) => (
              <div key={l.name} className="reveal m2-card" style={{
                background:C.dark, border:`1px solid ${C.goldBorder}`,
                borderRadius:8, overflow:"hidden",
              }}>
                <div style={{ height:220, overflow:"hidden" }}>
                  <img
                    src={l.img} alt={l.name}
                    style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", display:"block" }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding:"20px 22px" }}>
                  <p style={{ fontFamily:"var(--font-serif)", fontSize:17, color:"#fff", fontWeight:600, marginBottom:10 }}>{l.name}</p>
                  {l.career.map((c) => (
                    <p key={c} style={{ fontSize:12, color:C.textMuted, marginBottom:4, lineHeight:1.55 }}>· {c}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 강점 3개 */}
          <div className="m2-3col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              { title:"전원 군검사 출신", body:"군사법 체계를 안에서부터 경험한 진짜 전문가들입니다." },
              { title:"징계 데이터 분석", body:"수천건의 데이터를 기반으로 처분의 적절성을 판단합니다." },
              { title:"적극적 의견 개진", body:"징계위원회에 의견서를 제출해 결과를 반전시킵니다." },
            ].map((item) => (
              <div key={item.title} className="reveal" style={{
                padding:"28px 24px", textAlign:"center",
                background:"rgba(255,255,255,0.03)",
                borderLeft:`2px solid ${C.goldBorder}`,
              }}>
                <h4 style={{ fontFamily:"var(--font-serif)", fontSize:17, color:C.gold, marginBottom:10 }}>{item.title}</h4>
                <p style={{ fontSize:13, color:C.textDim, lineHeight:1.85 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          유연한 대응 시스템 — 사진 + 텍스트
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <Eyebrow>FLEXIBLE SYSTEM</Eyebrow>
          <SectionHeading>유연한 대응 시스템</SectionHeading>
          <div className="m2-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
            <div>
              <div className="reveal" style={{
                background:C.goldDim, border:`1px solid ${C.goldBorder}`,
                borderRadius:6, padding:"16px 20px", marginBottom:28,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:18 }}>💡</span>
                <p style={{ margin:0, fontSize:15, fontWeight:700, color:"#fff" }}>
                  상담 후 적극 대응 상품으로 전환 가능합니다.
                </p>
              </div>
              {[
                "징계내용을 적극적으로 부인하기 위하여 증거 수집 및 부대원들의 면담이 필요한 경우",
                "중대사건으로 징계조사 및 징계위원회에서 변호사의 보다 적극적인 변론이 필요한 경우",
              ].map((text, i) => (
                <div key={i} className="reveal" style={{ display:"flex", gap:12, marginBottom:18, alignItems:"flex-start" }}>
                  <ChevronRight size={16} color={C.gold} style={{ flexShrink:0, marginTop:2 }} />
                  <p style={{ fontSize:14, color:C.textDim, lineHeight:1.8, margin:0 }}>{text}</p>
                </div>
              ))}
              <div className="reveal" style={{
                marginTop:24, background:"rgba(224,90,43,0.1)",
                border:`1px solid rgba(224,90,43,0.4)`,
                borderRadius:6, padding:"12px 18px",
              }}>
                <p style={{ margin:0, fontSize:13, color:"#f08060", fontWeight:600 }}>
                  본 상품으로 진행하다가도 전환이 가능합니다.
                </p>
              </div>
            </div>
            <div className="reveal" style={{ position:"relative", borderRadius:8, overflow:"hidden" }}>
              <img
                src={P.atmo2}
                alt="변호사 상담"
                style={{
                  width:"100%", display:"block",
                  boxShadow:"0 16px 48px rgba(0,0,0,0.5)",
                  filter:"brightness(0.85)",
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          서비스 라인업 테이블
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.darkMid}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <Eyebrow>SERVICE LINEUP</Eyebrow>
          <SectionHeading>법무법인 하이로 서비스 라인업</SectionHeading>
          <p className="reveal" style={{ fontSize:13, color:C.textMuted, marginBottom:28 }}>
            의뢰인의 상황과 필요에 맞춘 체계적인 방어전략 매트릭스
          </p>
          <div className="reveal" style={{ overflowX:"auto", borderRadius:8, border:`1px solid ${C.goldBorder}` }}>
            <table className="m2-table" style={{ width:"100%", borderCollapse:"collapse", fontSize:14, background:C.darkLight }}>
              <thead>
                <tr style={{ background:C.dark }}>
                  <th style={{ padding:"14px 20px", color:C.textMuted, fontWeight:600, textAlign:"left", borderBottom:`1px solid ${C.goldBorder}` }}>구분</th>
                  <th style={{ padding:"14px 20px", color:C.gold, fontWeight:700, textAlign:"center", borderBottom:`1px solid ${C.goldBorder}` }}>비대면 징계서비스</th>
                  <th style={{ padding:"14px 20px", color:C.textDim, fontWeight:700, textAlign:"center", borderBottom:`1px solid ${C.goldBorder}` }}>+동행</th>
                  <th style={{ padding:"14px 20px", color:C.textDim, fontWeight:700, textAlign:"center", borderBottom:`1px solid ${C.goldBorder}` }}>패키지 케어</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "업무방식",
                    v1: "서면중심의 합리적 대리", v2: "변호사의 출석 대응", v3: "밀착방어",
                  },
                  {
                    label: "주요업무",
                    v1: "기록검토 및 서면작성",
                    v2: "징계조사 및 위원회 참석, 증거수집",
                    v3: "기록검토, 서면작성, 현장 입회,\n증인신문, 법정 대면 변론",
                  },
                  {
                    label: "비용",
                    v1gold: "39만원\n(정찰제)",
                    v2: "110만원\n/ 변호사 1회 출석\n(정찰제)",
                    v3: "사안의 경중·복잡성에 따라\n합리적 책정 (330만원~)",
                  },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
                    <td style={{ padding:"14px 20px", color:C.textMuted, fontWeight:600, whiteSpace:"nowrap" }}>{row.label}</td>
                    <td style={{ padding:"14px 20px", color:row.v1gold ? C.gold : C.textDim, fontWeight:row.v1gold ? 800 : 400, textAlign:"center", whiteSpace:"pre-line" }}>{row.v1gold || row.v1}</td>
                    <td style={{ padding:"14px 20px", color:C.textDim, textAlign:"center", whiteSpace:"pre-line" }}>{row.v2}</td>
                    <td style={{ padding:"14px 20px", color:C.textDim, textAlign:"center", whiteSpace:"pre-line" }}>{row.v3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="reveal" style={{ fontSize:11, color:C.textMuted, marginTop:12, lineHeight:1.7 }}>
            * 형사사건은 변호사가 출석하여 피의자 진술 조력 및 법정변론이 반드시 필요하므로 패키지로 진행하는 것이 원칙입니다.
          </p>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          프로세스 4단계 + 최종 CTA
      ════════════════════════════════════════════ */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth:1020, margin:"0 auto" }}>
          <Eyebrow>PROCESS</Eyebrow>
          <SectionHeading center>당신의 명예와 미래 하이로가 지킵니다</SectionHeading>
          <div className="m2-process-row" style={{ display:"flex", gap:0, position:"relative", marginBottom:52 }}>
            {[
              { step:"01", title:"카카오 채널 상담", desc:"실시간 사안 접수" },
              { step:"02", title:"간편 계약 작성",   desc:"모바일로 5분 완료" },
              { step:"03", title:"간편 결제",         desc:"빠른 선임 완료" },
              { step:"04", title:"선임 완료",         desc:"즉각 기록 검토 착수" },
            ].map(({ step, title, desc }, i) => (
              <div key={step} className="reveal" style={{ flex:1, paddingRight:24, position:"relative" }}>
                {i < 3 && (
                  <div className="m2-connector" style={{
                    position:"absolute", top:27, left:"calc(100% - 24px)", width:48,
                    height:1,
                    background:`linear-gradient(to right, ${C.gold}80, rgba(201,168,76,0.1))`,
                  }} />
                )}
                <div style={{
                  width:56, height:56, borderRadius:"50%",
                  border:`2px solid ${C.gold}`, display:"flex", alignItems:"center",
                  justifyContent:"center", marginBottom:22, background:C.dark,
                }}>
                  <span style={{ fontFamily:"var(--font-serif)", fontSize:16, color:C.gold, fontWeight:700 }}>{step}</span>
                </div>
                <h4 style={{ fontSize:16, color:"#fff", fontWeight:600, marginBottom:8 }}>{title}</h4>
                <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.85 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center" }}>
            <KakaoCTA large />
          </div>
        </div>
      </RevealSection>

      {/* ════════════════════════════════════════════
          최종 CTA 섹션 — gold (military 스타일)
      ════════════════════════════════════════════ */}
      <section style={{ background:C.gold, padding:"88px clamp(20px,7vw,120px)", textAlign:"center" }}>
        <h2 style={{ fontFamily:"var(--font-serif)", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:700, color:C.ink, marginBottom:18, lineHeight:1.2 }}>
          지금 바로 무료 상담을 시작하세요
        </h2>
        <p style={{ fontSize:15, color:"rgba(11,15,24,0.6)", marginBottom:44, lineHeight:1.9 }}>
          군 징계 사건은 시간이 가장 중요합니다.<br />
          첫 상담은 카카오톡으로 신속히 연결됩니다.
        </p>
        <KakaoCTA large dark />
      </section>

      {/* ════════════════════════════════════════════
          미니 푸터 — military/index.jsx 와 동일
      ════════════════════════════════════════════ */}
      <footer style={{
        background: "#040810",
        padding: "28px clamp(20px,7vw,120px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize:12, color:C.textMuted }}>© 2025 법무법인 하이로. All rights reserved.</span>
        <div style={{ display:"flex", gap:20 }}>
          {[
            { to:"/privacy",  label:"개인정보처리방침" },
            { to:"/military", label:"군형사 전문 페이지" },
            { to:"/",         label:"법인 홈페이지" },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              style={{ fontSize:12, color:C.textMuted, textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>

      {/* ════════════════════════════════════════════
          플로팅 CTA 바 — 스크롤 후 하단에 등장
      ════════════════════════════════════════════ */}
      {showFloat && !floatDism && (
        <div className="m2-float" style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:300,
          background:"rgba(7,12,23,0.96)", backdropFilter:"blur(16px)",
          borderTop:`1px solid ${C.goldBorder}`,
          padding:"16px clamp(20px,5vw,64px)",
        }}>
          <div className="m2-float-inner" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, maxWidth:1100, margin:"0 auto" }}>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>
                지금 징계 기록을 검토하세요
              </p>
              <p style={{ fontSize:12, color:C.textMuted, margin:"3px 0 0" }}>
                39만원 정찰제 · 전원 군법무관 출신 · 비대면
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <KakaoCTA large label="지금 바로 상담 시작" />
              <button
                onClick={() => setFloatDism(true)}
                aria-label="닫기"
                style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:6, lineHeight:0 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
