/** 관리자 설정 — 탭 네비게이션 (사용자 관리, 보안, 활동 로그, 개발 이력) */
import { useState } from "react";
import { PageHeader, COLORS } from "../../../components/admin";
import UsersTab from "./UsersTab";
import SecurityTab from "./SecurityTab";
import ActivityTab from "./ActivityTab";
import DevLogTab from "./DevLogTab";

const TABS = ["사용자 관리", "보안", "활동 로그", "개발 이력"];
const TAB_COMPONENTS = [UsersTab, SecurityTab, ActivityTab, DevLogTab];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState(0);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div>
      <PageHeader title="관리자 설정" />

      {/* 탭 네비게이션 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 28 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "10px 22px", fontSize: 13,
              fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? COLORS.accent : COLORS.textSecondary,
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === i ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <ActiveComponent />
    </div>
  );
}
