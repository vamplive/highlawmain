/** 변호사 소개 페이지 — 변호사 카드 그리드 + 상세 모달 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { api } from "../../utils/api";
import { SkeletonLawyerCard } from "../../components/ui/Skeleton";
import ErrorState from "../../components/ui/ErrorState";
import Seo from "../../components/Seo";
import { buildAttorneyJsonLd, buildBreadcrumbJsonLd } from "../../lib/seo";
import { PublicHero, SurfaceCard } from "../../components/public/PublicDesign";

/** JSON 문자열 → 배열 파싱 (education, career, specialties 필드) */
function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split("\n").filter(Boolean);
  }
}

/** 비동기 데이터 로드 후에도 reveal 애니메이션이 작동하도록 재관찰 */
function useRevealOnChange(deps) {
  const ref = useRef();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".reveal:not(.visible)");
    if (targets.length === 0) return;
    targets.forEach((t) => t.classList.add("reveal-pending"));
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
    // deps는 호출자가 전달한 의존성 배열 — 동적 전달이 이 훅의 계약
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [activeTab, setActiveTab] = useState("lawyer"); // 'lawyer', 'advisor', 'staff'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const filteredLawyers = lawyers.filter((l) => {
    if (activeTab === "lawyer") {
      return l.position === "대표변호사" || l.position === "변호사";
    }
    if (activeTab === "advisor") {
      return l.position === "전문위원";
    }
    if (activeTab === "staff") {
      return l.position === "직원";
    }
    return false;
  });

  const ref = useRevealOnChange([filteredLawyers]);

  const loadLawyers = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get("/lawyers")
      .then((json) => { setLawyers(json.data ?? []); })
      .catch(() => { setLawyers([]); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadLawyers();
    });
    return () => { cancelled = true; };
  }, [loadLawyers]);

  // 로딩된 변호사 각각을 Attorney JSON-LD로 변환 — 검색엔진이 인물 정보를 인덱싱
  const attorneyJsonLds = filteredLawyers
    .map((l) => buildAttorneyJsonLd({
      name: l.name,
      jobTitle: l.position || "변호사",
      image: l.photoUrl,
      email: l.email,
      telephone: l.phone,
      bio: l.introduction,
    }))
    .filter(Boolean);

  return (
    <div ref={ref}>
      <Seo
        path="/partners"
        title="구성원"
        description="법무법인 하이로의 신뢰할 수 있는 구성원들을 소개합니다."
        jsonLd={[
          buildBreadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "구성원", path: "/partners" },
          ]),
          ...attorneyJsonLds,
        ]}
      />
      <PublicHero
        eyebrow="PEOPLE"
        title="구성원"
        description={"각 분야 전문가들이 유기적으로 협력하여\n의뢰인에게 최선의 솔루션을 제공합니다"}
      />

      {/* ==================== 탭 컨트롤 ==================== */}
      <div style={{ background: "#fff", paddingTop: 48, paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div
            role="tablist"
            aria-label="구성원 섹션 선택"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: 40
            }}
          >
            {[
              { id: "lawyer", label: "변호사" },
              { id: "advisor", label: "전문위원" },
              { id: "staff", label: "직원" }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
        </div>
      </div>

      {/* ==================== 구성원 카드 그리드 ==================== */}
      <section className="section" style={{ background: "#fff", paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {loading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="sr-only">구성원 정보를 불러오는 중입니다</span>
              {Array.from({ length: 3 }, (_, i) => <SkeletonLawyerCard key={i} />)}
            </div>
          ) : error ? (
            <ErrorState
              title="구성원 정보를 불러오지 못했습니다"
              message="네트워크 상태를 확인하신 후 다시 시도해 주세요."
              onRetry={loadLawyers}
            />
          ) : filteredLawyers.length === 0 ? (
            <div className="text-center reveal" style={{ padding: "80px 0", color: "var(--gray-200)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Scale size={40} strokeWidth={1} color="#ccc" /></div>
              <p style={{ fontSize: 16, fontWeight: 300 }}>구성원 정보가 준비 중입니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger">
              {filteredLawyers.map((lawyer) => (
                <SurfaceCard
                  as={Link}
                  key={lawyer.id}
                  to={`/partners/${lawyer.slug || lawyer.id}`}
                  aria-label={`${lawyer.name} 프로필 상세 보기`}
                  className="reveal group cursor-pointer"
                  style={{
                    textDecoration: "none",
                    background: "#fff",
                    overflow: "hidden",
                  }}
                >
                  {/* 사진 */}
                  <div style={{
                    width: "100%", aspectRatio: "3/4",
                    position: "relative", overflow: "hidden",
                    background: "#e8e6e3",
                  }}>
                    {lawyer.photoUrl ? (
                      <img
                        src={lawyer.photoUrl}
                        alt={lawyer.name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "88%", height: "88%", objectFit: "cover", objectPosition: "center top", display: "block", margin: "auto", marginTop: "6%" }}
                      />
                    ) : (
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                        <Scale size={48} strokeWidth={0.8} color="rgba(255,255,255,0.15)" />
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
                  </div>

                  {/* 정보 */}
                  <div style={{ padding: "24px 28px 28px" }}>
                    <div className="flex items-baseline gap-3" style={{ marginBottom: 8 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>{lawyer.name}</h3>
                      {lawyer.nameEn && (
                        <span className="font-en" style={{ fontSize: 12, color: "var(--gray-200)", fontWeight: 300 }}>{lawyer.nameEn}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--accent-gold)", fontWeight: 500, marginBottom: 14, letterSpacing: "0.05em" }}>
                      {lawyer.position}
                    </p>
                    {lawyer.specialties && parseList(lawyer.specialties).length > 0 && (
                      <div className="flex flex-wrap gap-1" style={{ marginBottom: 14 }}>
                        {parseList(lawyer.specialties).slice(0, 4).map((s, i) => (
                          <span key={i} style={{ fontSize: 11, color: "var(--accent-gold)", padding: "4px 12px", background: "rgba(26,58,107,0.06)", borderRadius: 2, letterSpacing: "0.02em" }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {lawyer.introduction && (
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontWeight: 300 }}>
                        {lawyer.introduction.length > 100 ? lawyer.introduction.slice(0, 100) + "..." : lawyer.introduction}
                      </p>
                    )}
                    <p className="font-en group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{ fontSize: 11, color: "#ccc", marginTop: 16, letterSpacing: "0.15em" }}>
                      VIEW PROFILE →
                    </p>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
