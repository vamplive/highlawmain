/**
 * ERP 페이지 간 빠른 이동 칩 — 모든 ERP 화면 상단에서 같은 세트 노출.
 * 현재 페이지 자신은 자동으로 칩에서 제외하기 위해 `currentPath` 헬퍼 제공.
 */
export const ERP_LINKS_ALL = [
  { to: "/admin", label: "대시보드", icon: "🏠" },
  { to: "/admin/clients", label: "의뢰인", icon: "👥" },
  { to: "/admin/cases", label: "사건", icon: "💼" },
  { to: "/admin/court-dates", label: "법정 일정", icon: "📅" },
  { to: "/admin/tasks", label: "업무", icon: "✅" },
  { to: "/admin/time-entries", label: "시간 기록", icon: "🕒" },
  { to: "/admin/trust-accounts", label: "예치금", icon: "🏦" },
  { to: "/admin/contracts", label: "계약서", icon: "📄" },
  { to: "/admin/lawyer-revenue", label: "변호사 매출", icon: "📊" },
  { to: "/admin/ar-aging", label: "미수금", icon: "💰" },
];

/**
 * 현재 경로를 빼고 ERP 링크들을 반환.
 */
export function ERP_LINKS(currentPath) {
  return ERP_LINKS_ALL.filter((l) => {
    if (l.to === "/admin") return currentPath !== "/admin";
    return !currentPath.startsWith(l.to);
  });
}
