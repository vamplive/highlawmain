/**
 * AdminHomepageManager — 홈페이지 통합 관리 페이지
 * "Highlaw Main"과 "군사센터" 두 사이트를 상위 탭으로 전환하며 편집
 *
 * - Highlaw Main 탭: 기존 AdminSiteManager 그대로 렌더링
 * - 군사센터 탭:   기존 MilitarySiteManager 그대로 렌더링
 * - 기존 /admin/site-manager, /admin/military-site-manager는 변경 없이 그대로 유지
 */
import { useState } from "react";
import { COLORS } from "../../../components/admin/styles";
import AdminSiteManager from "../site-manager";
import MilitarySiteManager from "../military-site-manager";

/* 상위 사이트 탭 정의 */
const SITE_TABS = [
  { key: "main",     label: "Highlaw Main",  emoji: "🏛" },
  { key: "military", label: "군사센터",       emoji: "⚖️" },
];

/** 상위 사이트 선택 탭 바 */
function SiteTabBar({ activeSite, onSelect }) {
  return (
    <div style={{
      display: "flex",
      gap: 4,
      padding: "6px 8px",
      background: "rgba(11,31,58,0.04)",
      borderRadius: 10,
      border: `1px solid ${COLORS.border}`,
      marginBottom: 28,
      width: "fit-content",
    }}>
      {SITE_TABS.map((tab) => {
        const isActive = activeSite === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              padding: "8px 24px",
              fontSize: 13.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : COLORS.textSecondary,
              background: isActive ? COLORS.accent : "transparent",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.18s",
              boxShadow: isActive ? "0 2px 8px rgba(11,31,58,0.18)" : "none",
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.emoji}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminHomepageManager() {
  /* 사이트 선택 상태 — useState 사용 (URL param 충돌 방지)
   * AdminSiteManager가 내부적으로 ?tab= URL param을 관리하므로
   * 상위 사이트 선택은 setState로 분리해 충돌을 막는다 */
  const [activeSite, setActiveSite] = useState("main");

  return (
    <div>
      <SiteTabBar activeSite={activeSite} onSelect={setActiveSite} />

      {/* 선택된 사이트 관리자 렌더링 — 기존 컴포넌트를 그대로 사용 */}
      {activeSite === "main" && <AdminSiteManager />}
      {activeSite === "military" && <MilitarySiteManager />}
    </div>
  );
}
