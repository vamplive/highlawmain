import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useReveal from "../../hooks/useReveal";
import { useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { api } from "../../utils/api";
import Seo from "../../components/Seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

const RECRUIT_DEFAULTS = {
  hero: { heading: "인재 채용", subheading: "CAREERS AT HIGHLAW", description: "신의성실(Loyalty)과 품격(Dignity)을 바탕으로, 탁월한 법률 솔루션을 창출해 나갈 하이로의 인재를 모십니다." },
};

const CATEGORY_META = {
  new_lawyer: { label: "신입변호사", icon: "⚖️", color: "#1a3a6b", light: "rgba(26,58,107,0.06)" },
  experienced_lawyer: { label: "경력변호사", icon: "🏛️", color: "#1565c0", light: "rgba(21,101,192,0.06)" },
  military_lawyer: { label: "군법무관", icon: "🎖️", color: "#4a148c", light: "rgba(74,20,140,0.06)" },
  staff: { label: "직원", icon: "👥", color: "#e65100", light: "rgba(230,81,0,0.06)" },
};


const TABS = [
  { id: "recruit", label: "채용 공고", labelEn: "JOB OPENINGS" },
  { id: "apply", label: "지원 안내", labelEn: "APPLY GUIDE" },
  { id: "contact", label: "채용 문의", labelEn: "CONTACT" },
];


function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const catMeta = CATEGORY_META[post.category] || {};

  const isOpen = post.status === "open";
  const deadline = post.applicationDeadline
    ? new Date(post.applicationDeadline).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <SurfaceCard
      style={{
        padding: 0,
        overflow: "hidden",
        border: "1px solid #eef0f2",
        boxShadow: expanded ? "0 8px 30px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.02)",
        transition: "all 0.3s ease",
      }}
    >
      {/* 헤더 */}
      <div
        style={{ padding: "24px 28px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 16 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: catMeta.light || "rgba(26,58,107,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {catMeta.icon || "📋"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              color: catMeta.color || "#1a3a6b",
              background: catMeta.light || "rgba(26,58,107,0.06)",
              padding: "3px 10px", borderRadius: 4, textTransform: "uppercase",
            }}>
              {catMeta.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: isOpen ? "#1b5e20" : "#b71c1c",
              background: isOpen ? "#e8f5e9" : "#ffebee",
              padding: "3px 8px", borderRadius: 4,
              border: `1px solid ${isOpen ? "#a5d6a7" : "#ef9a9a"}`,
            }}>
              {isOpen ? "모집 중" : "마감"}
            </span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16.5, fontWeight: 600, color: "#0b0e14", lineHeight: 1.45 }}>
            {post.title}
          </h3>
          {deadline && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--gray-400)" }}>
              지원 마감: {deadline}
            </p>
          )}
        </div>
        <div style={{
          width: 28, height: 28, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#aaa",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>
          ▾
        </div>
      </div>

      {/* 확장 내용 */}
      {expanded && (
        <div style={{ padding: "0 28px 28px", borderTop: "1px solid #f8f9fa" }}>
          <div style={{ paddingTop: 24, textAlign: "left" }}>
            {post.description && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  공고 내용
                </h4>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                  {post.description}
                </p>
              </div>
            )}

            {post.requirements && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  지원 자격 및 우대사항
                </h4>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                  {post.requirements}
                </p>
              </div>
            )}

            {post.benefits && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--accent-gold)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  복리후생 및 처우
                </h4>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                  {post.benefits}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
              {post.applicationFileUrl && (
                <a
                  href={post.applicationFileUrl}
                  download={post.applicationFileName || true}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 20px",
                    background: "#fafafa",
                    color: "#495057",
                    border: "1px solid #ced4da",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 13, fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f3f5"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fafafa"; }}
                >
                  📥 지원서 다운로드
                  {post.applicationFileName && (
                    <span style={{ fontWeight: 400, color: "#888", fontSize: 11 }}>({post.applicationFileName})</span>
                  )}
                </a>
              )}
              {isOpen && (
                <a
                  href="/recruit/apply-form"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 24px",
                    background: "#0b0e14",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-gold)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#0b0e14"; }}
                >
                  온라인 지원하기 →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}


export default function RecruitPage() {
  const revealRef = useReveal();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "recruit";
  const { settings } = useSiteSettingsPage("recruit", RECRUIT_DEFAULTS);

  useEffect(() => {
    api.get("/recruit")
      .then((res) => setPosts(res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div ref={revealRef}>
      <Seo
        path="/recruit"
        title="채용 안내 | 법무법인 하이로"
        description="법무법인 하이로 채용 안내 페이지. 신입 및 경력 변호사, 군법무관, 행정직원 공고 및 온라인 지원."
      />

      <PublicHero
        image="/construction-hero3.jpg"
        eyebrow={settings.hero.subheading}
        title={settings.hero.heading}
        description={settings.hero.description}
      />

      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-content-active {
          animation: tabFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      {/* ==================== 탭 및 본문 통합 섹션 ==================== */}
      <section className="section" style={{ background: "#fff", paddingTop: 48 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          
          {/* ==================== 3개 타원형(Pill) 탭 네비게이션 ==================== */}
          <div
            role="tablist"
            aria-label="채용 섹션 선택"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: 56
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  style={{
                    padding: "10px 24px",
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    border: "1px solid",
                    borderColor: isActive ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                    borderRadius: 24,
                    background: isActive ? "var(--accent-gold)" : "transparent",
                    color: isActive ? "#fff" : "var(--gray-500)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.05em",
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-selected={isActive}
                  role="tab"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ==================== 탭별 본문 내용 ==================== */}

          {/* 1. 채용 공고 탭 */}
          {activeTab === "recruit" && (
            <div className="tab-content-active" key="recruit" style={{ maxWidth: 840, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Job Openings"
                title="채용 공고"
              />

              {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--gray-400)", fontSize: 14 }}>공고를 불러오는 중...</div>
              ) : posts.length === 0 ? (
                <div style={{
                  padding: "48px 28px",
                  textAlign: "center",
                  border: "1px dashed #ced4da",
                  borderRadius: 12,
                  color: "#aaa",
                  background: "#fafafa",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <p style={{ margin: 0, fontSize: 14 }}>현재 진행 중인 채용 공고가 없습니다.</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#bbb" }}>추후 공고를 확인해 주세요.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. 지원 안내 탭 */}
          {activeTab === "apply" && (
            <div className="tab-content-active" key="apply" style={{ maxWidth: 900, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Recruitment Process"
                title="채용 전형 및 지원 방법"
              />

              {/* 전형 절차 로드맵 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 48,
                position: "relative",
              }} className="stagger">
                {[
                  { step: "01", title: "온라인 지원", desc: "공식 채용 시스템을 통해 인적사항 및 이력서를 등록합니다." },
                  { step: "02", title: "서류 전형", desc: "제출하신 서류를 바탕으로 종합적인 자격 요건을 정밀 검토합니다." },
                  { step: "03", title: "면접 전형", desc: "실무진 및 파트너 면접을 거쳐 전문 역량과 가치관을 평가합니다." },
                  { step: "04", title: "최종 합격", desc: "개별 전형 결과를 통보하고 처우 및 근무 조건을 최종 협의합니다." }
                ].map((item, idx) => (
                  <SurfaceCard key={idx} style={{ padding: "28px 20px", display: "flex", flexDirection: "column", textAlign: "left", height: "100%" }}>
                    <span className="font-serif" style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-gold)", marginBottom: 12, display: "block" }}>
                      {item.step}
                    </span>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{item.title}</h4>
                    <p style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.6, fontWeight: 300, margin: 0 }}>{item.desc}</p>
                  </SurfaceCard>
                ))}
              </div>

              {/* 프리미엄 입사지원 유도 카드 */}
              <SurfaceCard style={{
                padding: "48px 40px",
                background: "linear-gradient(135deg, #0b0e14 0%, #1a3a6b 100%)",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                border: "none",
                marginBottom: 20
              }}>
                <div style={{
                  position: "absolute", top: -40, right: -40,
                  width: 180, height: 180,
                  background: "rgba(222,197,132,0.08)",
                  borderRadius: "50%",
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase",
                    color: "#DEC584", borderBottom: "1px solid rgba(222,197,132,0.3)",
                    paddingBottom: 6, marginBottom: 20,
                  }}>
                    ONLINE APPLICATION SYSTEM
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 500, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
                    법무법인 하이로 온라인 입사지원
                  </h3>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 640, margin: "0 auto 32px" }}>
                    하이로 온라인 지원은 PC 환경에 최적화되어 있습니다. <br />
                    개인정보 수집 및 이용에 동의한 후 지원 분야 선택, 기본 신원 정보 입력, 그리고 이력서/자기소개서 서류를 안전하게 업로드하는 방식으로 진행됩니다.
                  </p>

                  <a
                    href="/recruit/apply-form"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 36px",
                      background: "#DEC584",
                      color: "#0b0e14",
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 6,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(222,197,132,0.3)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,255,255,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#DEC584";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(222,197,132,0.3)";
                    }}
                  >
                    온라인 입사지원 시스템 바로가기 ↗
                  </a>
                </div>
              </SurfaceCard>
            </div>
          )}

          {/* 3. 채용 문의 탭 */}
          {activeTab === "contact" && (
            <div className="tab-content-active" key="contact" style={{ maxWidth: 800, margin: "0 auto" }}>
              <SectionHeading
                eyebrow="Recruitment Inquiry"
                title="채용 문의 및 안내"
              />

              {/* 주 안내 */}
              <div style={{
                textAlign: "center",
                padding: "48px 40px",
                background: "linear-gradient(135deg, #0b0e14 0%, #1a3a6b 100%)",
                borderRadius: 16,
                marginBottom: 32,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -40, right: -40,
                  width: 180, height: 180,
                  background: "rgba(222,197,132,0.08)",
                  borderRadius: "50%",
                }} />
                <div style={{ position: "relative" }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase",
                    color: "#DEC584", borderBottom: "1px solid rgba(222,197,132,0.3)",
                    paddingBottom: 6, marginBottom: 20,
                  }}>
                    Careers Inquiry
                  </span>
                  <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                    채용과 관련된 모든 문의사항은 아래를 통해 접수해 주세요.
                  </p>
                  <a
                    href="mailto:mingukang@highlaw.net"
                    style={{
                      display: "inline-block",
                      fontSize: 22, fontWeight: 600,
                      color: "#DEC584",
                      textDecoration: "none",
                      letterSpacing: "0.02em",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                  >
                    mingukang@highlaw.net
                  </a>
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>으로 문의 바랍니다.</p>
                </div>
              </div>

              {/* 안내 카드들 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="stagger">
                {[
                  {
                    icon: "📧",
                    title: "이메일 문의",
                    body: "지원 서식 제출 및 채용 관련 일반 문의는 이메일로 보내주시면 2-3 영업일 내 답변드립니다.",
                  },
                  {
                    icon: "📋",
                    title: "지원 서류",
                    body: "이력서, 자기소개서를 이메일에 첨부해 주세요. 지원서 양식은 채용 공고에서 다운로드 가능합니다.",
                  },
                  {
                    icon: "🔒",
                    title: "개인정보 보호",
                    body: "제출된 지원 서류는 채용 목적으로만 사용되며, 채용 절차 종료 후 규정에 맞게 안전하게 파기됩니다.",
                  },
                ].map((card) => (
                  <SurfaceCard key={card.title} style={{
                    padding: "24px 20px",
                    textAlign: "left",
                    height: "100%",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0b0e14" }}>{card.title}</h4>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.7, fontWeight: 300 }}>{card.body}</p>
                  </SurfaceCard>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
