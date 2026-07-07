/** 변호사 개별 프로필 페이지 — /lawyers/:id
 *  HERO + sticky TabBar + 7 탭 + 해시 라우팅 + SEO/JSON-LD. */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../utils/api";
import Seo from "../../components/Seo";
import { buildAttorneyJsonLd, buildBreadcrumbJsonLd, absoluteUrl } from "../../lib/seo";
import { parseLawyer } from "../../components/lawyer-profile/parseLawyer";
import LawyerHero from "../../components/lawyer-profile/LawyerHero";
import LawyerTabBar from "../../components/lawyer-profile/LawyerTabBar";
import {
  ProfileTab, PracticeAreasTab, PublicationsTab,
  MediaTab, ColumnsTab, LecturesTab, CasesTab,
} from "../../components/lawyer-profile/tabs";

const TABS = [
  { id: "profile",   label: "프로필",     Component: ProfileTab },
  { id: "practice",  label: "업무분야",   Component: PracticeAreasTab },
  { id: "papers",    label: "논문·저서",  Component: PublicationsTab },
  { id: "media",     label: "미디어",     Component: MediaTab },
  { id: "columns",   label: "칼럼",       Component: ColumnsTab },
  { id: "lectures",  label: "강연",       Component: LecturesTab },
  { id: "cases",     label: "수행사례",   Component: CasesTab },
];

const TAB_IDS = TABS.map((t) => t.id);

function getInitialTab() {
  if (typeof window === "undefined") return TAB_IDS[0];
  const hash = window.location.hash.replace("#", "");
  return TAB_IDS.includes(hash) ? hash : TAB_IDS[0];
}

export default function LawyerDetailPage() {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(getInitialTab);

  // 변호사 + 강의 데이터 로드 (강의는 별도 테이블)
  // URL 파라미터가 슬러그일 수 있으므로, 변호사 응답에서 받은 UUID로 강의를
  // 다시 조회한다. (lectures 테이블의 lawyerId 는 UUID 만 인덱싱)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      api.get(`/lawyers/${id}`)
        .then((res) => {
          if (cancelled) return null;
          setRaw(res?.data || null);
          const uuid = res?.data?.id;
          if (!uuid) return { data: [] };
          return api.get(`/lectures?lawyerId=${uuid}`).catch(() => ({ data: [] }));
        })
        .then((lecRes) => {
          if (cancelled || !lecRes) return;
          const lecRows = lecRes?.data || [];
          setLectures(
            lecRows.map((l) => ({
              id: l.id,
              date: l.date || "",
              title: l.title || "",
              host: l.organizer || "",
              venue: l.venue || "",
              description: l.description || "",
              thumbnailUrl: l.thumbnailUrl || "",
              materialUrl: l.materialUrl || "",
              materialName: l.materialName || "",
            }))
          );
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err?.message || "변호사 정보를 불러오지 못했습니다");
          setLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, [id]);

  // 해시 동기화 — 새로고침/공유 시 탭 유지
  useEffect(() => {
    function onHash() {
      const h = window.location.hash.replace("#", "");
      if (TAB_IDS.includes(h)) setActive(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function changeTab(id) {
    setActive(id);
    if (typeof window !== "undefined") {
      const url = `${window.location.pathname}#${id}`;
      window.history.replaceState(null, "", url);
    }
  }

  const lawyer = useMemo(() => {
    const parsed = parseLawyer(raw);
    if (!parsed) return null;
    parsed.lectures = lectures;
    return parsed;
  }, [raw, lectures]);

  const visibleTabs = useMemo(() => {
    if (!lawyer) return TABS;
    return TABS.filter((tab) => {
      switch (tab.id) {
        case "profile":  return true;
        case "practice": return lawyer.practiceAreas?.length > 0;
        case "papers":   return lawyer.publications?.length > 0 || lawyer.books?.length > 0;
        case "media":    return lawyer.media?.length > 0;
        case "columns":  return lawyer.columns?.length > 0;
        case "lectures": return lawyer.lectures?.length > 0;
        case "cases":    return lawyer.cases?.length > 0;
        default:         return true;
      }
    });
  }, [lawyer]);

  if (loading) {
    return (
      <div className="lp-scope" style={{ background: "var(--lp-bg)", minHeight: "60vh", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--lp-muted)" }}>불러오는 중…</p>
      </div>
    );
  }
  if (error || !lawyer) {
    return (
      <div className="lp-scope" style={{ background: "var(--lp-bg)", minHeight: "60vh", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--lp-ink)", marginBottom: 16 }}>{error || "변호사를 찾을 수 없습니다."}</p>
        <Link to="/partners" style={{ color: "var(--lp-accent)" }}>← 구성원 목록으로</Link>
      </div>
    );
  }

  const currentActive = visibleTabs.some((t) => t.id === active) ? active : "profile";
  const ActivePanel = TABS.find((t) => t.id === currentActive)?.Component || ProfileTab;
  const canonicalPath = `/partners/${lawyer.slug || lawyer.id}`;
  const seoTitle = `${lawyer.name} ${lawyer.title} — 법무법인 하이로`;
  const seoDesc = lawyer.tagline || lawyer.intro || `${lawyer.name} ${lawyer.title}의 학력·경력·논문·수행사례를 소개합니다.`;
  const jsonLd = [
    buildAttorneyJsonLd({
      name: lawyer.name,
      jobTitle: lawyer.title,
      url: absoluteUrl(canonicalPath),
      image: lawyer.photo ? absoluteUrl(lawyer.photo) : undefined,
      email: lawyer.email,
      telephone: lawyer.phone,
      knowsAbout: lawyer.practiceAreas,
    }),
    buildBreadcrumbJsonLd([
      { name: "홈", url: absoluteUrl("/") },
      { name: "구성원", url: absoluteUrl("/partners") },
      { name: lawyer.name, url: absoluteUrl(canonicalPath) },
    ]),
  ];

  return (
    <div className="lp-scope">
      <Seo
        title={seoTitle}
        description={seoDesc}
        path={canonicalPath}
        image={lawyer.photo ? absoluteUrl(lawyer.photo) : undefined}
        jsonLd={jsonLd}
      />

      <nav aria-label="경로" className="lp-breadcrumb">
        <div className="lp-breadcrumb-inner">
          <Link to="/">홈</Link>
          <span aria-hidden="true">›</span>
          <Link to="/partners">구성원</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{lawyer.name}</span>
        </div>
      </nav>

      <LawyerHero lawyer={lawyer} />

      <LawyerTabBar tabs={visibleTabs} active={currentActive} onChange={changeTab} />

      <main className="lp-main">
        <div
          role="tabpanel"
          id={`lp-panel-${currentActive}`}
          aria-labelledby={`lp-tab-${currentActive}`}
          tabIndex={0}
          className="lp-panel"
        >
          <ActivePanel lawyer={lawyer} />
        </div>
      </main>

      <style>{`
        .lp-scope {
          background: var(--lp-bg);
          color: var(--lp-ink);
          /* 고정 헤더(유틸 30 + 메인 64 + 보더) + 모바일 노치 안전영역까지 클리어 */
          padding-top: calc(110px + env(safe-area-inset-top, 0px));
        }
        @media (min-width: 640px) {
          .lp-scope { padding-top: calc(100px + env(safe-area-inset-top, 0px)); }
        }
        .lp-breadcrumb {
          background: var(--lp-bg);
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-breadcrumb-inner {
          max-width: 72rem; margin: 0 auto;
          padding: 10px 20px;
          font-size: 12.5px; color: var(--lp-muted);
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
        }
        .lp-breadcrumb-inner a {
          color: var(--lp-muted); text-decoration: none;
        }
        .lp-breadcrumb-inner a:hover { color: var(--lp-accent); }
        .lp-breadcrumb-inner [aria-current="page"] { color: var(--lp-ink); }
        .lp-main {
          background: var(--lp-bg);
          padding: 32px 20px 64px;
        }
        .lp-panel {
          max-width: 56rem; margin: 0 auto;
          outline: none;
        }
        .lp-panel:focus-visible {
          outline: 2px solid var(--lp-accent); outline-offset: 4px;
        }
        @media (min-width: 640px) {
          .lp-breadcrumb-inner { padding: 12px 24px; font-size: 13px; }
          .lp-main { padding: 40px 24px 80px; }
        }
        @media (min-width: 1024px) {
          .lp-main { padding: 64px 24px 120px; }
        }
      `}</style>
    </div>
  );
}
