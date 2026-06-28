/** 관리자 사이트 콘텐츠 관리 — 탭 라우팅 오케스트레이터 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../components/admin";
import { COLORS, btnStyle } from "../../../components/admin/styles";
import { TABS } from "./constants";
import useMediaQuery from "../../../hooks/useMediaQuery";

/** URL 쿼리 ?tab= 에 허용되는 키 화이트리스트 (XSS·오타 방어) */
const VALID_TAB_KEYS = TABS.map((t) => t.key);
import { LangToggle } from "./shared";
import useSiteSettings from "./useSiteSettings";
import AdminHeroVideos from "../hero-videos";
import HomeSection from "./HomeSection";
import AboutSection from "./AboutSection";
import PracticeSection from "./PracticeSection";
import LayoutSection from "./LayoutSection";
import ThemeSection from "./ThemeSection";
import SeoSection from "./SeoSection";
import AnnouncementsSection from "./AnnouncementsSection";
import HistorySection from "./HistorySection";
import AdminLawyers from "../lawyers";
import NewsBlogSection from "./NewsBlogSection";
import RecruitSectionWrapper from "./RecruitSectionWrapper";
import ConsultationSectionWrapper from "./ConsultationSectionWrapper";

/** 독립 저장을 관리하는 탭 (하단 저장 바 미표시) */
const SELF_SAVING_TABS = ["seo", "announcements", "history", "hero-videos", "members"];
/** 미리보기 가능한 탭 */
const PREVIEWABLE_TABS = ["home", "about", "practice", "layout"];

export default function AdminSiteManager() {
  const isMobile = useMediaQuery("(max-width: 899px)");
  // URL 쿼리 ?tab= 로 초기 탭 결정 (딥링크 지원). 잘못된 값이면 "home"으로 폴백.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  // URL을 단일 진실 공급원으로 사용 — useState를 쓰면 사이드바 링크로 URL만 변경될 때 탭이 갱신되지 않음
  const activeTab = VALID_TAB_KEYS.includes(urlTab) ? urlTab : "home";
  const setActiveTab = (key) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [editingLang, setEditingLang] = useState("ko");

  const {
    settings, dirty, saving, loading, toast, setToast,
    update, updateItem, addItem, removeItem,
    updateDetail, addDetail, removeDetail,
    save, cancel,
  } = useSiteSettings();

  const sectionProps = { settings, update, updateItem, addItem, removeItem };
  const isPreviewable = PREVIEWABLE_TABS.includes(activeTab);
  const showPreview = previewMode && isPreviewable;
  const langToggle = <LangToggle editingLang={editingLang} setEditingLang={setEditingLang} />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "home": return <>{langToggle}<HomeSection {...sectionProps} /></>;
      case "hero-videos": return <AdminHeroVideos />;
      case "about": return <>{langToggle}<AboutSection {...sectionProps} /></>;
      case "practice":
        return <>{langToggle}<PracticeSection {...sectionProps} updateDetail={updateDetail} addDetail={addDetail} removeDetail={removeDetail} /></>;
      case "layout": return <>{langToggle}<LayoutSection {...sectionProps} /></>;
      case "theme": return <ThemeSection settings={settings} update={update} />;
      case "seo": return <SeoSection toast={toast} setToast={setToast} />;
      case "announcements": return <AnnouncementsSection toast={toast} setToast={setToast} />;
      case "history": return <HistorySection />;
      case "members": return <AdminLawyers />;
      case "news-edit": return <NewsBlogSection settings={settings} update={update} />;
      case "recruit-edit": return <RecruitSectionWrapper settings={settings} update={update} />;
      case "consultation-edit":
        return <ConsultationSectionWrapper settings={settings} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem} />;
      default: return null;
    }
  };

  if (loading) {
    return <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>;
  }

  return (
    <div>
      <PageHeader title="사이트 콘텐츠 관리">
        {isPreviewable && (
          <button onClick={() => setPreviewMode(!previewMode)} style={btnStyle(previewMode ? COLORS.danger : "#2563eb")}>
            {previewMode ? "미리보기 닫기" : "미리보기"}
          </button>
        )}
      </PageHeader>

      {/* 탭 바 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 28, overflowX: "auto" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 22px", fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? COLORS.accent : COLORS.textSecondary,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap", transition: "all 0.15s",
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {showPreview ? (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          <div style={{ flex: isMobile ? "1 1 auto" : "0 0 55%", minWidth: 0, paddingBottom: dirty ? 80 : 0 }}>{renderTabContent()}</div>
          <PreviewPane
            activeTab={activeTab}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <div style={{ paddingBottom: dirty ? 80 : 0 }}>{renderTabContent()}</div>
      )}

      {/* 저장 바 */}
      {dirty && !SELF_SAVING_TABS.includes(activeTab) && (
        <SaveBar toast={toast} onCancel={cancel} onSave={save} saving={saving} />
      )}

      {/* 토스트 */}
      {!dirty && toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: COLORS.success, color: "#fff", padding: "10px 20px",
          borderRadius: 6, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/** 미리보기 패널 */
function PreviewPane({ activeTab, previewDevice, setPreviewDevice, isMobile }) {
  return (
    <div style={{ flex: isMobile ? "1 1 auto" : "0 0 45%", minWidth: 0 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[{ key: "desktop", label: "Desktop" }, { key: "mobile", label: "Mobile" }].map((d) => (
          <button key={d.key} onClick={() => setPreviewDevice(d.key)} style={{
            padding: "4px 12px", fontSize: 11, fontWeight: previewDevice === d.key ? 600 : 400,
            color: previewDevice === d.key ? "#fff" : COLORS.textSecondary,
            background: previewDevice === d.key ? COLORS.accent : "rgba(26,58,107,0.08)",
            border: "none", borderRadius: 4, cursor: "pointer",
          }}>
            {d.label}
          </button>
        ))}
      </div>
      <div style={{
        border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden",
        background: "#f0f0f0", height: isMobile ? "62vh" : "calc(100vh - 200px)", display: "flex", justifyContent: "center",
      }}>
        <iframe
          src={`/${activeTab === "layout" ? "" : activeTab}?preview=1`}
          style={{ width: previewDevice === "mobile" ? "min(375px, 100%)" : "100%", height: "100%", border: "none", background: "#fff", transition: "width 0.3s" }}
          title="미리보기"
        />
      </div>
    </div>
  );
}

/** 하단 저장 바 */
function SaveBar({ toast, onCancel, onSave, saving }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff", borderTop: `1px solid ${COLORS.border}`,
      padding: "12px 44px", display: "flex", alignItems: "center",
      justifyContent: "flex-end", gap: 12, boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
    }}>
      {toast && <span style={{ marginRight: "auto", fontSize: 13, color: COLORS.success, fontWeight: 500 }}>{toast}</span>}
      <button onClick={onCancel} style={btnStyle(COLORS.muted)}>취소</button>
      <button onClick={onSave} disabled={saving} style={btnStyle(COLORS.accent)}>{saving ? "저장 중..." : "저장"}</button>
    </div>
  );
}
