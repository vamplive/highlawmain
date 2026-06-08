/**
 * 관리자 메시지 — 발송 중심 레이아웃
 * 좌측 얇은 네비게이션 + 우측 넓은 발송/관리 영역
 */
import { useState } from "react";
import { BarChart3, Clock3, FileText, History, MailPlus, PanelsTopLeft, Send, Users, Workflow } from "lucide-react";
import TemplatesTab from "./TemplatesTab";
import SendTab from "./SendTab";
import LogsTab from "./LogsTab";
import ScheduledTab from "./ScheduledTab";
import TriggersTab from "./TriggersTab";
import ReportTab from "./ReportTab";
import ClientsTab from "./ClientsTab";
import ContractsTab from "./ContractsTab";
import { COLORS } from "../../../components/admin";
import useMediaQuery from "../../../hooks/useMediaQuery";

/** 좌측 네비 항목 — 발송을 최상단에 배치 */
const NAV_ITEMS = [
  { key: "send", label: "메시지 발송", icon: Send, description: "수신자 선택부터 발송 전 검토까지 한 화면에서 처리합니다" },
  { key: "clients", label: "고객 DB", icon: Users, description: "발송 대상 고객을 추가·편집·삭제합니다 — /portal/clients와 자동 연동" },
  { key: "templates", label: "템플릿", icon: PanelsTopLeft, description: "자주 쓰는 안내문과 치환값을 관리합니다" },
  { key: "scheduled", label: "예약", icon: Clock3, description: "예약 대기 중인 발송을 확인합니다" },
  { key: "triggers", label: "자동화", icon: Workflow, description: "조건 기반 자동 발송 규칙을 설정합니다" },
  { key: "logs", label: "이력", icon: History, description: "개별 발송 성공·실패 기록을 추적합니다" },
  { key: "report", label: "리포트", icon: BarChart3, description: "발송량과 실패율을 통계로 확인합니다" },
  { key: "contracts", label: "전자계약서", icon: FileText, description: "위임계약서·합의서를 발행하고 서명 진행을 추적합니다" },
];

export default function AdminMessages() {
  const [activeView, setActiveView] = useState("send");
  const isMobile = useMediaQuery("(max-width: 899px)");
  const current = NAV_ITEMS.find((n) => n.key === activeView);

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 0,
      margin: isMobile ? "-22px -16px -30px" : "-36px -44px",
      minHeight: "calc(100vh - 60px)",
      background: "#fff",
    }}>
      <aside style={sidebarStyle(isMobile)}>
        <div style={{
          padding: isMobile ? "12px 16px 8px" : "20px 16px 12px",
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.muted,
          letterSpacing: 1,
          textTransform: "uppercase",
          flex: "0 0 auto",
        }}>
          Client Messaging
        </div>
        <div style={{
          display: isMobile ? "flex" : "block",
          overflowX: isMobile ? "auto" : "visible",
          padding: isMobile ? "0 8px 10px" : 0,
          WebkitOverflowScrolling: "touch",
        }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              style={navItemStyle(activeView === item.key, isMobile)}
            >
              <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon size={16} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <main style={mainStyle}>
        <header style={headerStyle(isMobile)}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: COLORS.text, letterSpacing: -0.3 }}>
            {current.label}
          </h1>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 0" }}>
            {current.description}
          </p>
          {activeView === "send" && (
            <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, background: "#fff" }}>
              <MailPlus size={15} color={COLORS.accent} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>선택, 작성, 검토 순서로 발송 사고를 줄입니다.</span>
            </div>
          )}
        </header>

        <div style={contentStyle(isMobile)}>
          {activeView === "send" && <SendTab />}
          {activeView === "clients" && <ClientsTab />}
          {activeView === "templates" && <TemplatesTab />}
          {activeView === "scheduled" && <ScheduledTab />}
          {activeView === "triggers" && <TriggersTab />}
          {activeView === "logs" && <LogsTab />}
          {activeView === "report" && <ReportTab />}
          {activeView === "contracts" && <ContractsTab />}
        </div>
      </main>
    </div>
  );
}

const sidebarStyle = (isMobile) => ({
  width: isMobile ? "100%" : 200,
  flexShrink: 0,
  background: "#f7f8fa",
  borderRight: isMobile ? "none" : `1px solid ${COLORS.borderLight}`,
  borderBottom: isMobile ? `1px solid ${COLORS.borderLight}` : "none",
  padding: isMobile ? 0 : "0 0 16px",
});

const navItemStyle = (active, isMobile) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: isMobile ? "auto" : "100%",
  minWidth: isMobile ? 132 : "auto",
  padding: isMobile ? "9px 12px" : "10px 20px",
  border: "none",
  background: active ? "#fff" : "transparent",
  borderLeft: isMobile ? "none" : (active ? `2px solid ${COLORS.accent}` : "2px solid transparent"),
  borderBottom: isMobile ? (active ? `2px solid ${COLORS.accent}` : "2px solid transparent") : "none",
  color: active ? COLORS.text : COLORS.textSecondary,
  fontSize: isMobile ? 13 : 14,
  fontWeight: active ? 600 : 400,
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.15s",
  whiteSpace: "nowrap",
});

const mainStyle = {
  flex: 1,
  background: "#fff",
  minWidth: 0,
};

const headerStyle = (isMobile) => ({
  padding: isMobile ? "20px 16px 16px" : "28px 32px 20px",
  borderBottom: `1px solid ${COLORS.borderLight}`,
});

const contentStyle = (isMobile) => ({
  padding: isMobile ? "18px 16px 28px" : "28px 32px",
});
