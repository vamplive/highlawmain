/**
 * 관리 대시보드 — 커맨드 센터
 *
 * 세계급 로펌 운영 본부 대시보드 — 관리자가 첫 화면에서:
 *  - 오늘 해야 할 일 (활성 타이머·오늘 법정·기한 초과 업무·대기 상담)
 *  - 핵심 재무 지표 (이번 달 매출·미청구·예치금·미수금)
 *  - 모든 모듈 카운트 + 빠른 진입 (의뢰인·계약·블로그·변호사 ...)
 *  - 최근 활동 피드 (상담·계약·블로그·의뢰인)
 * 를 즉시 파악하고 한 번의 탭으로 해당 화면으로 이동.
 *
 * 모바일에서는 1-2 열 자동 그리드, 카드 탭 시 페이지 이동.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../utils/api";
import { COLORS } from "../../../components/admin";

function formatKrw(value) {
  if (!value) return "0원";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatTime(iso) {
  if (!iso) return "";
  return iso.replace("T", " ").slice(11, 16);
}

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T")).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.round(h / 24);
  if (day < 30) return `${day}일 전`;
  return iso.slice(5, 10);
}

const ACTIVITY_ICON = {
  consultation: "💬",
  client: "👤",
  blog: "📰",
  contract: "📄",
};

/* ───────── 모듈 카드 정의 ───────── */
const MODULES = [
  {
    section: "Casework",
    cards: [
      { key: "clients", label: "의뢰인", icon: "👥", to: "/admin/clients", color: "#3b82f6" },
      { key: "openCases", label: "진행 사건", icon: "💼", to: "/admin/cases", color: "#0891b2" },
      { key: "todayCourt", label: "오늘 법정", icon: "📅", to: "/admin/court-dates", color: "#dc2626", computed: (d) => (d.todayCourtDates || []).length },
      { key: "overdueTasks", label: "기한 초과", icon: "⚠️", to: "/admin/tasks?overdue=true", color: "#b91c1c", computed: (d) => (d.overdueTasks || []).length },
      { key: "activeTimers", label: "진행 타이머", icon: "⏱", to: "/admin/time-entries", color: "#c2410c", computed: (d) => (d.activeTimers || []).length },
      { key: "pendingConsultations", label: "대기 상담", icon: "📩", to: "/admin/bookings", color: "#7c3aed" },
    ],
  },
  {
    section: "Finance",
    cards: [
      { key: "monthRevenue", label: "이번 달 매출", icon: "📈", to: "/admin/lawyer-revenue", color: "#15803d", computed: (d) => formatKrw(d.finance?.monthRevenueKrw), big: true },
      { key: "unbilled", label: "미청구 금액", icon: "🕒", to: "/admin/time-entries", color: "#0891b2", computed: (d) => formatKrw(d.finance?.unbilledAmountKrw), sub: (d) => `${d.finance?.unbilledEntryCount || 0}건`, big: true },
      { key: "ar", label: "미수금", icon: "💰", to: "/admin/ar-aging", color: "#dc2626", computed: (d) => formatKrw(d.finance?.arOutstandingKrw), sub: (d) => `${d.finance?.arInvoiceCount || 0}건`, big: true },
      { key: "trust", label: "예치금", icon: "🏦", to: "/admin/trust-accounts", color: "#1d4ed8", computed: (d) => formatKrw(d.finance?.trustTotalKrw), sub: (d) => `${d.finance?.trustActiveClients || 0}명`, big: true },
    ],
  },
  {
    section: "Content",
    cards: [
      { key: "publishedBlog", label: "발행 블로그", icon: "📰", to: "/admin/blog", color: "#7c3aed" },
      { key: "draftBlog", label: "블로그 초안", icon: "✏️", to: "/admin/blog?status=draft", color: "#94a3b8" },
      { key: "publishedCases", label: "공개 사례", icon: "🏆", to: "/admin/cases", color: "#0891b2" },
      { key: "documents", label: "문서함", icon: "📁", to: "/admin/documents", color: "#475569" },
      { key: "publishedReviews", label: "공개 후기", icon: "⭐", to: "/admin/reviews", color: "#f59e0b" },
    ],
  },
  {
    section: "Firm",
    cards: [
      { key: "lawyers", label: "변호사", icon: "⚖️", to: "/admin/lawyers", color: "#1a1a2e" },
      { key: "activeContracts", label: "진행 계약", icon: "📑", to: "/admin/contracts", color: "#0891b2" },
      { key: "completedContracts", label: "완료 계약", icon: "✅", to: "/admin/contracts?status=completed", color: "#15803d" },
    ],
  },
];

function MetricCard({ icon, label, value, sub, color, to, accent }) {
  const card = (
    <div style={{
      padding: "14px 16px",
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${color || COLORS.primary}`,
      borderRadius: 10,
      cursor: to ? "pointer" : "default",
      transition: "transform 120ms ease, box-shadow 120ms ease",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: 4,
      minHeight: 92,
    }}
    onMouseEnter={(e) => {
      if (to) {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }
    }}
    onMouseLeave={(e) => {
      if (to) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 11, color: COLORS.textMuted,
        letterSpacing: "0.06em", textTransform: "uppercase",
        fontWeight: 600,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{
        fontSize: accent ? 22 : 24,
        fontWeight: 700,
        color: accent || COLORS.text,
        lineHeight: 1.1,
        wordBreak: "break-word",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</div>
      )}
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      {card}
    </Link>
  ) : card;
}

function SectionTitle({ children, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 10, marginTop: 24,
    }}>
      <h2 style={{
        fontSize: 12, fontWeight: 700, color: COLORS.textMuted,
        letterSpacing: "0.18em", textTransform: "uppercase",
        margin: 0,
      }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

function PriorityList({ title, color, icon, items, emptyText, renderItem, viewAllHref }) {
  return (
    <div style={{
      padding: 14,
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      display: "flex", flexDirection: "column",
      minHeight: 180,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
        paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
          <span style={{
            padding: "1px 8px", borderRadius: 10,
            background: `${color}1a`, color, fontSize: 11, fontWeight: 700,
          }}>{items.length}</span>
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} style={{ fontSize: 11, color: COLORS.textMuted, textDecoration: "none" }}>
            전체 →
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted, fontSize: 12 }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.slice(0, 5).map(renderItem)}
        </div>
      )}
    </div>
  );
}

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get("/dashboard/overview")
      .then((r) => { if (!cancelled) setData(r.data); })
      .catch((e) => { if (!cancelled) setErr(e.message || "대시보드 로드 실패"); });
    return () => { cancelled = true; };
  }, []);

  if (err) {
    return (
      <div style={{
        padding: 14, marginBottom: 12, background: "#fef2f2",
        border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 13,
      }}>{err}</div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
        대시보드 로딩 중...
      </div>
    );
  }

  return (
    <div>
      {/* ───── 1) 오늘의 액션 (가장 중요) ───── */}
      <SectionTitle>오늘의 액션</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
      }}>
        <PriorityList
          title="오늘 법정 일정"
          color="#dc2626" icon="📅"
          items={data.todayCourtDates || []}
          emptyText="오늘은 법정 일정이 없습니다 ✓"
          viewAllHref="/admin/court-dates?upcoming=true"
          renderItem={(c) => (
            <Link key={c.id} to={`/admin/court-dates`} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 6,
              background: "#fef2f2", textDecoration: "none", color: COLORS.text,
            }}>
              <span style={{
                fontFamily: "monospace", fontSize: 12,
                color: "#dc2626", fontWeight: 700, minWidth: 42,
              }}>{formatTime(c.startsAt)}</span>
              <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                {c.courtName?.slice(0, 8) || ""}
              </span>
            </Link>
          )}
        />
        <PriorityList
          title="기한 초과 업무"
          color="#b91c1c" icon="⚠️"
          items={data.overdueTasks || []}
          emptyText="기한 초과 업무 없음 ✓"
          viewAllHref="/admin/tasks?overdue=true"
          renderItem={(t) => (
            <Link key={t.id} to="/admin/tasks" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 6,
              background: "#fff1f2", textDecoration: "none", color: COLORS.text,
            }}>
              <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.title}
              </span>
              <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>{t.dueDate}</span>
            </Link>
          )}
        />
        <PriorityList
          title="진행 중 타이머"
          color="#c2410c" icon="⏱"
          items={data.activeTimers || []}
          emptyText="진행 중인 타이머 없음"
          viewAllHref="/admin/time-entries"
          renderItem={(t) => (
            <Link key={t.id} to="/admin/time-entries" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 6,
              background: "#fff7ed", textDecoration: "none", color: COLORS.text,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c2410c", minWidth: 50 }}>
                {t.lawyerName?.slice(0, 4) || "?"}
              </span>
              <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.description}
              </span>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                {formatRelative(t.startedAt)}
              </span>
            </Link>
          )}
        />
      </div>

      {/* ───── 2) 핵심 재무 지표 ───── */}
      <SectionTitle action={
        <Link to="/admin/lawyer-revenue" style={{ fontSize: 11, color: COLORS.textMuted, textDecoration: "none" }}>
          상세 분석 →
        </Link>
      }>재무 한눈 보기</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
      }}>
        {MODULES[1].cards.map((c) => (
          <MetricCard key={c.key}
            icon={c.icon} label={c.label}
            value={typeof c.computed === "function" ? c.computed(data) : (data.counts?.[c.key] ?? 0)}
            sub={typeof c.sub === "function" ? c.sub(data) : null}
            color={c.color} to={c.to}
            accent={c.color}
          />
        ))}
      </div>

      {/* ───── 3) 사건 관리 모듈 ───── */}
      <SectionTitle>{MODULES[0].section} — 사건/의뢰</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}>
        {MODULES[0].cards.map((c) => (
          <MetricCard key={c.key}
            icon={c.icon} label={c.label}
            value={typeof c.computed === "function" ? c.computed(data) : (data.counts?.[c.key] ?? 0)}
            color={c.color} to={c.to}
          />
        ))}
      </div>

      {/* ───── 4) 콘텐츠 모듈 ───── */}
      <SectionTitle>{MODULES[2].section} — 콘텐츠/홍보</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}>
        {MODULES[2].cards.map((c) => (
          <MetricCard key={c.key}
            icon={c.icon} label={c.label}
            value={data.counts?.[c.key] ?? 0}
            color={c.color} to={c.to}
          />
        ))}
      </div>

      {/* ───── 5) 사무소 운영 모듈 ───── */}
      <SectionTitle>{MODULES[3].section} — 사무소 운영</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}>
        {MODULES[3].cards.map((c) => (
          <MetricCard key={c.key}
            icon={c.icon} label={c.label}
            value={data.counts?.[c.key] ?? 0}
            color={c.color} to={c.to}
          />
        ))}
      </div>

      {/* ───── 6) 최근 활동 + 다가올 일정 ───── */}
      <SectionTitle>최근 활동 & 다가올 일정</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}>
        <div style={{
          padding: 14, background: "#fff",
          border: `1px solid ${COLORS.border}`, borderRadius: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            📋 최근 활동
          </div>
          {(data.recentActivity || []).length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 12 }}>최근 활동이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(data.recentActivity || []).map((a, idx) => (
                <Link key={`${a.type}-${a.id}-${idx}`} to={a.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 8px", borderRadius: 6,
                  textDecoration: "none", color: COLORS.text,
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 14 }}>{ACTIVITY_ICON[a.type] || "•"}</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ color: COLORS.textMuted, marginRight: 6 }}>[{a.label}]</span>
                    {a.title}
                  </span>
                  <span style={{ fontSize: 10, color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {formatRelative(a.at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: 14, background: "#fff",
          border: `1px solid ${COLORS.border}`, borderRadius: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            🗓 7일 내 법정 일정
          </div>
          {(data.upcomingCourtDates || []).length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 12 }}>예정된 일정이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.upcomingCourtDates.map((c) => (
                <Link key={c.id} to="/admin/court-dates" style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 8px", borderRadius: 6,
                  textDecoration: "none", color: COLORS.text,
                }}>
                  <span style={{
                    fontFamily: "monospace", fontSize: 11, color: "#1d4ed8", fontWeight: 700,
                  }}>{c.startsAt?.slice(5, 16) || ""}</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
