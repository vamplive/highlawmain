/**
 * ERP 요약 위젯 — 관리 대시보드 상단에 표시되는 ERP 핵심 지표.
 *
 * 표시 내용:
 *  - 활성 타이머 (지금 측정 중인 변호사 수)
 *  - 미청구 시간 / 금액
 *  - 이번 주 청구 가능 시간
 *  - 미완료 / 기한 초과 업무
 *  - 7일 내 다가올 법정 일정
 *  - 의뢰인 총 예치금
 *
 * 각 카드 클릭 시 해당 관리 페이지로 이동.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../utils/api";
import { COLORS } from "../../../components/admin";

function formatKrw(value) {
  if (!value) return "0원";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatHours(minutes) {
  if (!minutes) return "0시간";
  const h = (minutes / 60).toFixed(1);
  return `${h}시간`;
}

function Card({ label, value, sub, href, accent }) {
  const content = (
    <div style={{
      padding: "16px 18px",
      background: "#fff",
      border: `1px solid ${accent ? "#1d4ed8" : COLORS.border}`,
      borderLeft: `4px solid ${accent || COLORS.primary}`,
      borderRadius: 8,
      cursor: href ? "pointer" : "default",
      transition: "transform 0.1s, box-shadow 0.1s",
      height: "100%",
    }}
    onMouseEnter={(e) => {
      if (href) {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }
    }}
    onMouseLeave={(e) => {
      if (href) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }
    }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || COLORS.text, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
  return href ? <Link to={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>{content}</Link> : content;
}

export default function ErpSummaryWidget() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get("/dashboard/erp")
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message || "ERP 요약을 불러오지 못했습니다"));
  }, []);

  if (err) {
    return (
      <div style={{
        padding: 12, marginBottom: 20, background: "#fef2f2",
        border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", fontSize: 12,
      }}>
        ERP 요약 로드 실패: {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 20, marginBottom: 20, color: COLORS.textMuted, fontSize: 12, textAlign: "center" }}>
        ERP 데이터 로딩 중...
      </div>
    );
  }

  const overdueColor = data.tasks.overdue > 0 ? COLORS.danger : null;
  const activeTimerColor = data.activeTimers > 0 ? "#c2410c" : null;
  const unbilledColor = data.unbilled.amountKrw > 0 ? "#0891b2" : null;

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
        ERP 한눈 보기
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <Card
          label="진행 중 타이머"
          value={`${data.activeTimers}개`}
          sub={data.activeTimers > 0 ? "지금 측정 중인 변호사" : "아무도 측정 중이 아님"}
          href="/admin/time-entries"
          accent={activeTimerColor}
        />
        <Card
          label="미청구 금액"
          value={formatKrw(data.unbilled.amountKrw)}
          sub={`${data.unbilled.entryCount}건 · ${formatHours(data.unbilled.minutes)}`}
          href="/admin/time-entries"
          accent={unbilledColor}
        />
        <Card
          label="이번 주 청구가능"
          value={formatHours(data.thisWeekBillableMinutes)}
          sub="최근 7일 누계"
          href="/admin/time-entries"
        />
        <Card
          label="미완료 업무"
          value={`${data.tasks.open + data.tasks.inProgress + data.tasks.blocked}개`}
          sub={data.tasks.overdue > 0 ? `⚠ 기한 초과 ${data.tasks.overdue}개` : "기한 초과 없음"}
          href="/admin/tasks"
          accent={overdueColor}
        />
        <Card
          label="다가올 법정 일정"
          value={`${data.upcomingCourtDates.length}건`}
          sub={data.upcomingCourtDates[0] ? `다음: ${data.upcomingCourtDates[0].title.slice(0, 14)}…` : "7일 내 일정 없음"}
          href="/admin/court-dates"
        />
        <Card
          label="의뢰인 총 예치금"
          value={formatKrw(data.trustAccount.totalKrw)}
          sub={`활성 ${data.trustAccount.activeClients}명`}
          href="/admin/trust-accounts"
        />
      </div>

      {/* 기한 초과 업무 + 다가올 법정 일정 미니 리스트 */}
      {(data.overdueTasks.length > 0 || data.upcomingCourtDates.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          {data.overdueTasks.length > 0 && (
            <div style={{ padding: 12, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.danger, marginBottom: 8 }}>
                ⚠ 기한 초과 업무 (상위 5)
              </div>
              {data.overdueTasks.map((t) => (
                <div key={t.id} style={{ fontSize: 12, padding: "4px 0", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.text, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </span>
                  <span style={{ color: COLORS.danger, fontSize: 11 }}>{t.dueDate}</span>
                </div>
              ))}
            </div>
          )}
          {data.upcomingCourtDates.length > 0 && (
            <div style={{ padding: 12, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, marginBottom: 8 }}>
                📅 7일 내 법정 일정
              </div>
              {data.upcomingCourtDates.slice(0, 5).map((d) => (
                <div key={d.id} style={{ fontSize: 12, padding: "4px 0", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.text, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.title}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: 11 }}>{d.startsAt?.slice(5, 16)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
