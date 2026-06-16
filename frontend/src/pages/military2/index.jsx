/** 군 징계사건 비대면 케어 랜딩 페이지 — /military2
 * 다크 테마. Header·Footer 없음. 카카오톡 채널 즉시 상담 CTA.
 * 39만원 비대면 징계 서비스 특화 원페이지.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, AlertTriangle, ChevronRight } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { KAKAO_CHANNEL_CHAT } from "../../utils/kakaoChannel";

const C = {
  gold: "#FFB800",
  goldDim: "rgba(255,184,0,0.15)",
  dark: "#0d0d14",
  darkMid: "#13131e",
  darkCard: "#1a1a28",
  darkBorder: "rgba(255,184,0,0.2)",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.72)",
  textMuted: "rgba(255,255,255,0.42)",
  white: "#ffffff",
  whiteMid: "#f8f8f8",
  warning: "#ff6b35",
};

/* ── 재사용 헬퍼 ── */
function RevealSection({ bg, children, style = {} }) {
  const ref = useReveal();
  return (
    <section ref={ref} style={{ background: bg, padding: "72px clamp(20px, 6vw, 100px)", ...style }}>
      {children}
    </section>
  );
}

function SectionLabel({ children, dark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
      <div style={{ width: 4, height: 28, background: C.gold, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: "clamp(1.3rem, 2.8vw, 1.9rem)", fontWeight: 700, color: dark ? C.white : "#111" }}>
        {children}
      </h2>
    </div>
  );
}

function KakaoCTA({ large = false, outline = false }) {
  const bg = outline ? "transparent" : C.gold;
  const border = outline ? `2px solid ${C.gold}` : "none";
  const color = outline ? C.gold : "#111";
  return (
    <a
      href={KAKAO_CHANNEL_CHAT}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: large ? 12 : 8,
        background: bg, color, border, fontWeight: 700,
        fontSize: large ? 17 : 14,
        padding: large ? "18px 48px" : "12px 28px",
        borderRadius: 50, textDecoration: "none", cursor: "pointer",
        transition: "opacity 0.18s, transform 0.18s",
        letterSpacing: "0.02em",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <MessageCircle size={large ? 22 : 16} />
      {large ? "지금 바로 상담을 시작하세요!" : "카카오톡 상담"}
    </a>
  );
}

/* ── 가격 카운트업 애니메이션 ── */
function CountUp({ target, duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString("ko-KR")}</span>;
}

export default function Military2LandingPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("m2-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Seo
        title="군 징계사건 비대면 케어 39만원 — 법무법인 하이로"
        description="군 징계사건 비대면 High Law 케어. 39만원으로 징계기록 검토 및 의견서 제출. 전원 군법무관 출신 징계 전문가."
        path="/military2"
      />

      <style>{`
        .m2-line { opacity: 0; transform: translateY(28px); transition: opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1); }
        .m2-ready .m2-line { opacity: 1; transform: translateY(0); }
        .m2-ready .m2-line:nth-child(2) { transition-delay: 0.12s; }
        .m2-ready .m2-line:nth-child(3) { transition-delay: 0.24s; }
        .m2-ready .m2-line:nth-child(4) { transition-delay: 0.36s; }
        .m2-card { transition: transform 0.22s, box-shadow 0.22s; }
        .m2-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
        .m2-step-line { height: 3px; flex: 1; background: linear-gradient(90deg, #FFB800 0%, rgba(255,184,0,0.3) 100%); }
        @media (max-width: 680px) {
          .m2-3col { grid-template-columns: 1fr !important; }
          .m2-2col { grid-template-columns: 1fr !important; }
          .m2-steps { flex-direction: column !important; gap: 28px !important; }
          .m2-step-line { display: none !important; }
          .m2-table th, .m2-table td { padding: 10px 8px !important; font-size: 12px !important; }
        }
      `}</style>

      {/* ── 고정 미니 네비 ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(13,13,20,0.94)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.darkBorder}`,
        padding: "14px clamp(20px, 5vw, 64px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link to="/" style={{ color: C.gold, fontSize: 17, fontWeight: 800, textDecoration: "none", letterSpacing: "0.05em", fontFamily: "var(--font-serif)" }}>
          HIGH &amp; LAW
        </Link>
        <KakaoCTA />
      </nav>

      {/* ── 히어로 ── */}
      <div
        ref={heroRef}
        style={{
          minHeight: "100dvh",
          background: `linear-gradient(160deg, #0d0d1a 0%, #111128 55%, #0a0a14 100%)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "110px clamp(24px, 6vw, 120px) 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* 배경 장식 */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,184,0,0.06) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(255,184,0,0.04) 0%, transparent 50%)`,
        }} />

        {/* 배지 */}
        <div className="m2-line" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.goldDim, border: `1px solid ${C.darkBorder}`, borderRadius: 50, padding: "6px 18px", marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, letterSpacing: "0.12em" }}>DISCIPLINARY LEGAL CARE</span>
        </div>

        <h1 className="m2-line" style={{ fontSize: "clamp(2rem, 5.5vw, 4.4rem)", fontWeight: 800, color: C.white, lineHeight: 1.18, maxWidth: 780, marginBottom: 12 }}>
          군 징계 사건의 비대면<br />
          <span style={{ color: C.gold }}>하이로(HighLaw) 케어</span>
        </h1>

        <p className="m2-line" style={{ fontSize: "clamp(15px, 1.6vw, 18px)", color: C.textDim, marginBottom: 10, fontWeight: 400 }}>
          39만원으로 징계기록 검토 및 의견서 제출
        </p>
        <p className="m2-line" style={{ fontSize: 14, color: C.textMuted, marginBottom: 52, letterSpacing: "0.04em" }}>
          전원 군법무관 출신 · 징계 전문가
        </p>

        <div className="m2-line" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <KakaoCTA large />
        </div>

        {/* 스크롤 힌트 */}
        <div aria-hidden="true" style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.18em", color: C.textMuted, textTransform: "uppercase" }}>scroll</span>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${C.gold}60, transparent)` }} />
        </div>
      </div>

      {/* ── 수사 Q: 왜 변호사가 필요한가요? ── */}
      <section style={{ background: C.whiteMid, padding: "72px clamp(24px, 6vw, 100px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="reveal" style={{ fontSize: 13, color: "#888", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 20 }}>COMMON QUESTION</p>
          <h2 className="reveal" style={{ fontSize: "clamp(1.25rem, 2.8vw, 2rem)", fontWeight: 800, color: "#111", lineHeight: 1.5, marginBottom: 0 }}>
            제가 분명히 잘못했고,<br />
            단순해 보이는 징계사건인데<br />
            <span style={{ background: C.gold, color: "#111", padding: "0 4px" }}>왜 변호사가 필요한가요?</span>
          </h2>
        </div>
      </section>

      {/* ── 징계위기의 본질 ── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel dark>징계위기의 본질</SectionLabel>
          <div className="m2-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 8 }}>
            {[
              {
                icon: "⚖️",
                title: "자의적 결정",
                desc: "형사와 달리 부대 간부들이 결정하기에 과도한 처분이 내려질 수 있습니다.",
              },
              {
                icon: "📋",
                title: "판례와의 괴리",
                desc: "법률 지식이 부족한 징계위는 유사사례보다 훨씬 무거운 징계를 내리곤 합니다.",
              },
              {
                icon: "🔍",
                title: "절차적 하자",
                desc: "전문가가 검토하면 절차상 하자를 발견해 징계 무효화 및 감경이 가능합니다.",
              },
            ].map((item) => (
              <div key={item.title} className="m2-card reveal" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 12, padding: "32px 28px" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.gold, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.85 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 징계 어차피 전역하면 그만? ── */}
      <section style={{ background: C.whiteMid, padding: "72px clamp(24px, 6vw, 100px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionLabel>징계 어차피 전역하면 그만 아니야?</SectionLabel>
          <div className="m2-2col reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            <div>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 8 }}>
                  <span style={{ color: C.warning }}>•</span> 상병 전역의 낙인
                </p>
                <p style={{ fontSize: 14, color: "#444", lineHeight: 1.85 }}>
                  강등 혹은 누적 징계로 인한 상병 전역은 병적증명서상 사회에서도 바로 인식 가능합니다.
                </p>
              </div>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 8 }}>
                  <span style={{ color: C.warning }}>•</span> 전역일 연기
                </p>
                <p style={{ fontSize: 14, color: "#444", lineHeight: 1.85 }}>
                  군기교육대 징계는 전역일 자체가 미뤄짐에 따라 병적증명서상 인기가 가능합니다.
                </p>
              </div>
              <div style={{ background: "#fff3f0", border: `1px solid ${C.warning}`, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={18} color={C.warning} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: "#a03000", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                  이 꼬리표는 취업 시 치명적인 결격 사유가 될 수 있습니다.
                </p>
              </div>
            </div>
            <div className="reveal" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src="/military/photos/photo3.jpg"
                alt="전역 서류"
                style={{ width: "100%", maxWidth: 340, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", filter: "grayscale(20%)" }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 가격 섹션 ── */}
      <section style={{ background: C.darkMid, padding: "72px clamp(24px, 6vw, 100px)", textAlign: "center" }}>
        <p className="reveal" style={{ fontSize: 13, color: C.textMuted, letterSpacing: "0.1em", marginBottom: 12 }}>변호사 비용 최소 몇백만원?</p>
        <p className="reveal" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)", fontWeight: 900, color: C.gold, lineHeight: 1, marginBottom: 16, letterSpacing: "-0.02em" }}>
          <CountUp target={390000} />
        </p>
        <p className="reveal" style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 700, color: C.white }}>
          하이로는 <span style={{ color: C.gold }}>39만원</span>에서 시작합니다!
        </p>
      </section>

      {/* ── 거품을 걷어낸 혁신 ── */}
      <section style={{ background: C.whiteMid, padding: "72px clamp(24px, 6vw, 100px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionLabel>거품을 걷어낸 혁신</SectionLabel>
          <div className="reveal" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#555", width: 160, flexShrink: 0 }}>기존 오프라인 수임료</span>
              <div style={{ flex: 1, height: 32, background: "#2d2d2d", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14 }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>수백만 원 (100%)</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 12, color: "#555", width: 160, flexShrink: 0 }}>하이로 비대면 케어</span>
              <div style={{ width: "10%", height: 32, background: C.gold, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, minWidth: 110 }}>
                <span style={{ fontSize: 12, color: "#111", fontWeight: 700 }}>39만원 (10%)</span>
              </div>
            </div>
          </div>
          <h3 className="reveal" style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 12 }}>90%의 불필요한 비용 제거</h3>
          <p className="reveal" style={{ fontSize: 14, color: "#444", lineHeight: 1.9 }}>
            변호사 비용의 상당부분은 <strong>지방 부대 출장비</strong>입니다.<br />
            하이로는 비대면 고밀도 대리 서비스를 통해 거품을 제거했습니다.<br />
            이제 39만원으로 전직 군검사 출신 변호사의 조력을 받을 수 있습니다.
          </p>
        </div>
      </section>

      {/* ── 비대면 징계대리 솔루션 ── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionLabel dark>비대면 징계대리 솔루션</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { title: "징계기록 정밀 검토", desc: "수천건의 데이터를 기반으로 절차상 하자를 완벽히 분석합니다." },
              { title: "징계위원회 의견서 제출", desc: "위원회를 설득할 수 있는 날카로운 법리적 의견서를 제출합니다." },
              { title: "정당성 사후 확인", desc: "위원회 종료 후 정보공개를 통해 정당한 징계 여부를 끝까지 추적합니다." },
              { title: "행정소송 실익 분석", desc: "항고 및 행정소송으로 이어질 경우의 승산과 실익을 진단합니다." },
            ].map((item, i) => (
              <div key={i} className="reveal" style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: 24, paddingBottom: 28, marginLeft: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.gold, color: "#111", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.white }}>{item.title}</h3>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: C.textDim, lineHeight: 1.85 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 저렴하면 퀄리티? ── */}
      <section style={{ background: "#111118", padding: "72px clamp(24px, 6vw, 100px)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p className="reveal" style={{ fontSize: "clamp(3rem, 7vw, 5rem)", color: C.gold, fontWeight: 900, lineHeight: 1, marginBottom: 0 }}>"</p>
          <h2 className="reveal" style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", fontWeight: 800, color: C.white, lineHeight: 1.4, marginBottom: 16 }}>
            저렴하면 퀄리티가 낮다?<br />
            <span style={{ color: C.gold }}>천만의 말씀입니다.</span>
          </h2>
          <p className="reveal" style={{ fontSize: 15, color: C.textDim, lineHeight: 1.9 }}>
            하이로의 혁신은 서비스의 타협이 아닌,<br />
            불필요한 이동 경비를 제거한 스마트한 결과입니다.
          </p>
        </div>
      </section>

      {/* ── 압도적 전문성 ── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <SectionLabel dark>하이로의 압도적 전문성</SectionLabel>
          <div className="reveal" style={{ marginBottom: 32 }}>
            <img
              src="/military/photos/team.jpg"
              alt="법무법인 하이로 변호사 팀"
              style={{ width: "100%", maxWidth: 640, display: "block", margin: "0 auto", borderRadius: 12, boxShadow: "0 12px 48px rgba(0,0,0,0.5)" }}
              loading="lazy"
            />
          </div>

          {/* 변호사 소개 */}
          <div className="m2-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { img: "/military/photos/kang.jpg", name: "강민구 변호사", career: ["해병대 시험부 군검사", "해군전인사정보부 군검사", "방위사실임 군법무관"] },
              { img: "/military/photos/jo.png", name: "조덕재 변호사", career: ["육군 13년간 군검사 및 징계항고부", "국방부 법무관리관실 군법무관"] },
              { img: "/military/photos/kim.jpg", name: "김범 변호사", career: ["육군 23년간 군검사 및 징계항고", "국군부 송무팀 군법무관"] },
            ].map((l) => (
              <div key={l.name} className="m2-card reveal" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 10, overflow: "hidden" }}>
                <img src={l.img} alt={l.name} style={{ width: "100%", height: 180, objectFit: "cover", objectPosition: "top" }} loading="lazy" />
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: C.white, marginBottom: 8 }}>{l.name}</p>
                  {l.career.map((c) => (
                    <p key={c} style={{ fontSize: 12, color: C.textMuted, marginBottom: 3, lineHeight: 1.5 }}>• {c}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 3가지 강점 */}
          <div className="m2-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { icon: "👤", title: "전원 군검사 출신", desc: "군사법 체계를 안에서부터 경험한 진짜 전문가들입니다." },
              { icon: "📊", title: "징계 데이터 분석", desc: "수천건의 데이터를 기반으로 처분의 적절성을 판단합니다." },
              { icon: "✍️", title: "적극적 의견 개진", desc: "징계위원회에 의견서를 제출해 결과를 반전시킵니다." },
            ].map((item) => (
              <div key={item.title} className="reveal" style={{ background: C.goldDim, border: `1px solid ${C.darkBorder}`, borderRadius: 10, padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 8 }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── 유연한 대응 시스템 ── */}
      <section style={{ background: C.whiteMid, padding: "72px clamp(24px, 6vw, 100px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionLabel>유연한 대응 시스템</SectionLabel>
          <div className="m2-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div className="reveal">
              <div style={{ background: C.goldDim, border: `1px solid rgba(255,184,0,0.4)`, borderRadius: 8, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>
                  상담 후 <strong>적극 대응 상품으로 전환</strong> 가능합니다.
                </p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "징계내용을 적극적으로 부인하기 위하여 증거 수집 및 부대원들의 면담이 필요한 경우",
                  "중대사건으로 징계조사 및 징계위원회에서 변호사의 보다 적극적인 변론이 필요한 경우",
                ].map((text, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <ChevronRight size={16} color={C.warning} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: "#333", lineHeight: 1.7 }}>{text}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 20, background: "#fff3f0", border: `1px solid ${C.warning}`, borderRadius: 8, padding: "12px 16px" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#a03000", fontWeight: 600 }}>
                  본 상품으로 진행하다가도 전환이 가능합니다.
                </p>
              </div>
            </div>
            <div className="reveal">
              <img
                src="/military/photos/office.jpg"
                alt="상담 장면"
                style={{ width: "100%", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 서비스 라인업 ── */}
      <RevealSection bg={C.dark}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionLabel dark>법무법인 하이로 서비스 라인업</SectionLabel>
          <p className="reveal" style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>의뢰인의 상황과 필요에 맞춘 체계적인 방어전략 매트릭스</p>
          <div className="reveal" style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.darkBorder}` }}>
            <table className="m2-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: C.darkCard }}>
              <thead>
                <tr style={{ background: "#111120" }}>
                  <th style={{ padding: "14px 18px", color: C.textMuted, fontWeight: 600, textAlign: "left", borderBottom: `1px solid ${C.darkBorder}` }}>구분</th>
                  <th style={{ padding: "14px 18px", color: C.gold, fontWeight: 700, textAlign: "center", borderBottom: `1px solid ${C.darkBorder}` }}>비대면 징계서비스</th>
                  <th style={{ padding: "14px 18px", color: C.textDim, fontWeight: 700, textAlign: "center", borderBottom: `1px solid ${C.darkBorder}` }}>+동행</th>
                  <th style={{ padding: "14px 18px", color: C.textDim, fontWeight: 700, textAlign: "center", borderBottom: `1px solid ${C.darkBorder}` }}>패키지 케어</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "업무방식", v1: "서면중심의 합리적 대리", v2: "변호사의 출석 대응", v3: "밀착방어" },
                  { label: "주요업무", v1: "기록검토 및 서면작성", v2: "징계조사 및 위원회 참석, 증거수집", v3: "기록검토, 서면작성, 현장 입회, 증인신문, 법정 대면 변론" },
                  { label: "비용정책", v1gold: "39만원\n(정찰제)", v2: "110만원\n/ 변호사 1회 출석\n(정찰제)", v3: "사안의 경중, 복잡성에 따라\n합리적 책정 (330만원~)" },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    <td style={{ padding: "14px 18px", color: C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>{row.label}</td>
                    <td style={{ padding: "14px 18px", color: row.v1gold ? C.gold : C.textDim, fontWeight: row.v1gold ? 800 : 400, textAlign: "center", whiteSpace: "pre-line" }}>{row.v1gold || row.v1}</td>
                    <td style={{ padding: "14px 18px", color: C.textDim, textAlign: "center", whiteSpace: "pre-line" }}>{row.v2}</td>
                    <td style={{ padding: "14px 18px", color: C.textDim, textAlign: "center", whiteSpace: "pre-line" }}>{row.v3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="reveal" style={{ fontSize: 11, color: C.textMuted, marginTop: 12, lineHeight: 1.7 }}>
            * 형사사건은 변호사가 출석하여 피의자 진술 조력 및 법정변론이 반드시 필요하므로 패키지로 진행하는 것이 원칙입니다.
          </p>
        </div>
      </RevealSection>

      {/* ── 프로세스 & 최종 CTA ── */}
      <section style={{ background: C.dark, padding: "72px clamp(24px, 6vw, 100px)", textAlign: "center" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <h2 className="reveal" style={{ fontSize: "clamp(1.3rem, 2.8vw, 2rem)", fontWeight: 800, color: C.white, marginBottom: 48 }}>
            당신의 명예와 미래 하이로가 지킵니다
          </h2>

          {/* 4단계 타임라인 */}
          <div className="m2-steps reveal" style={{ display: "flex", alignItems: "center", marginBottom: 56 }}>
            {[
              { n: "1", title: "카카오 채널 상담", desc: "실시간 사안 접수" },
              { n: "2", title: "간편 계약 작성", desc: "모바일로 5분 완료" },
              { n: "3", title: "간편 결제", desc: "빠른 선임 완료" },
              { n: "4", title: "선임 완료", desc: "즉각 기록 검토 착수" },
            ].map((step, i, arr) => (
              <>
                <div key={step.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, minWidth: 0, flex: "0 0 auto" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", border: `2px solid ${C.gold}`, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{step.n}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.white }}>{step.title}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textMuted }}>{step.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div key={`line-${i}`} className="m2-step-line" />
                )}
              </>
            ))}
          </div>

          <KakaoCTA large />
        </div>
      </section>

      {/* ── 미니 푸터 ── */}
      <footer style={{
        background: "#080810",
        padding: "24px clamp(20px, 6vw, 100px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>© 2025 법무법인 하이로. All rights reserved.</span>
        <div style={{ display: "flex", gap: 18 }}>
          {[
            { to: "/privacy", label: "개인정보처리방침" },
            { to: "/military", label: "군형사 전문 페이지" },
            { to: "/", label: "법인 홈페이지" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{ fontSize: 12, color: C.textMuted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
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
