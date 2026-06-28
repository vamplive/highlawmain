/**
 * 군형사센터 통합 관리자 페이지 (/admin/military-site-manager)
 * — 6개 탭: 군사센터 홈, 하이로 군사센터, 구성원, 업무분야, 하이로 소식, 상담문의
 */
import { useState, useEffect } from "react";
import { PageHeader } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import HomeSectionsTab from "./HomeSectionsTab";
import SubPageTab from "./SubPageTab";
import AdminLawyers from "../lawyers";

/* ══════════════════════════════════════
   탭 및 서브탭 정의
══════════════════════════════════════ */
const MAIN_TABS = [
  { key: "home",         label: "군사센터 홈" },
  { key: "about",        label: "하이로 군사센터" },
  { key: "members",      label: "구성원" },
  { key: "practices",    label: "업무분야" },
  { key: "info",         label: "하이로 소식" },
  { key: "consultation", label: "상담문의" },
];

const ABOUT_SUBTABS = [
  { id: "greeting",   label: "인사말" },
  { id: "values",     label: "핵심가치" },
  { id: "directions", label: "오시는 길" },
  { id: "probono",    label: "공익활동" },
  { id: "history",    label: "연혁" },
];

const PRACTICES_SUBTABS = [
  { id: "discipline", label: "군징계" },
  { id: "criminal",   label: "군형사" },
  { id: "admin",      label: "행정" },
  { id: "civil",      label: "민사" },
];

const INFO_SUBTABS = [
  { id: "news",  label: "하이로 뉴스" },
  { id: "guide", label: "군법 가이드" },
];

const CONSULTATION_SUBTABS = [
  { id: "form",    label: "상담신청" },
  { id: "process", label: "진행절차" },
  { id: "faq",     label: "FAQ" },
];

/* ══════════════════════════════════════
   공용 컴포넌트
══════════════════════════════════════ */

/* 토스트 알림 */
function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "#166534" : "#c0392b";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: bgColor, color: "#fff", padding: "12px 22px",
      borderRadius: 8, fontSize: 13.5, fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
    }}>
      {msg}
    </div>
  );
}

/* 메인 탭 바 */
function MainTabBar({ activeTab, onSelect }) {
  return (
    <div style={{
      display: "flex", borderBottom: `1px solid ${COLORS.border}`,
      marginBottom: 28, marginTop: 20, overflowX: "auto",
    }}>
      {MAIN_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              padding: "10px 22px", fontSize: 13.5, fontWeight: isActive ? 700 : 400,
              color: isActive ? COLORS.primary : COLORS.textMuted,
              background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
              borderBottom: isActive ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              marginBottom: -1, transition: "color 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}


/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function MilitarySiteManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
  }

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: COLORS.bgPage }}>
      <PageHeader
        title="군형사센터 관리"
        subtitle="highlaw.co.kr/military 및 하위 페이지 콘텐츠 편집"
      />

      <MainTabBar activeTab={activeTab} onSelect={setActiveTab} />

      {/* 군사센터 홈 */}
      {activeTab === "home" && (
        <HomeSectionsTab onToast={(msg) => showToast(msg)} />
      )}

      {/* 하이로 군사센터 */}
      {activeTab === "about" && (
        <SubPageTab
          page="about"
          subTabs={ABOUT_SUBTABS}
          pageUrl="https://highlaw.co.kr/military/about"
          onToast={(msg) => showToast(msg)}
        />
      )}

      {/* 구성원 */}
      {activeTab === "members" && <AdminLawyers />}

      {/* 업무분야 */}
      {activeTab === "practices" && (
        <SubPageTab
          page="practices"
          subTabs={PRACTICES_SUBTABS}
          pageUrl="https://highlaw.co.kr/military/practices"
          onToast={(msg) => showToast(msg)}
        />
      )}

      {/* 하이로 소식 */}
      {activeTab === "info" && (
        <SubPageTab
          page="info"
          subTabs={INFO_SUBTABS}
          pageUrl="https://highlaw.co.kr/military/info"
          onToast={(msg) => showToast(msg)}
        />
      )}

      {/* 상담문의 */}
      {activeTab === "consultation" && (
        <SubPageTab
          page="consultation"
          subTabs={CONSULTATION_SUBTABS}
          pageUrl="https://highlaw.co.kr/military/consultation"
          onToast={(msg) => showToast(msg)}
        />
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
