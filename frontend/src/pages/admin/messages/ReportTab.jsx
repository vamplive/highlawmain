/**
 * 발송 리포트 탭 — 기간별 발송/열람 통계
 * - 기본 최근 30일, 사용자 지정 범위 가능
 * - 요약 카드 + 채널별 세부 + 일별 스파크라인
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { COLORS, fieldStyle, badgeStyle } from "../../../components/admin";

/** 오늘 기준 N일 전 YYYY-MM-DD 반환 */
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

export default function ReportTab() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(daysAgo(0));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(`/messages/stats?from=${from}&to=${to}`)
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message || "통계를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, [load]);

  const applyPreset = (days) => {
    setFrom(daysAgo(days - 1));
    setTo(daysAgo(0));
  };

  return (
    <div>
      {/* 기간 선택 */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        padding: 14, background: "#f9f7f2", borderRadius: 6, marginBottom: 20,
      }}>
        <label style={{ fontSize: 13 }}>
          시작{" "}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...fieldStyle, width: 160 }} />
        </label>
        <label style={{ fontSize: 13 }}>
          종료{" "}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...fieldStyle, width: 160 }} />
        </label>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <PresetBtn days={7} apply={applyPreset}>7일</PresetBtn>
          <PresetBtn days={30} apply={applyPreset}>30일</PresetBtn>
          <PresetBtn days={90} apply={applyPreset}>90일</PresetBtn>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fdecea", color: COLORS.danger, borderRadius: 6, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.muted }}>불러오는 중...</div>
      ) : data ? (
        <>
          {/* 요약 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
            <StatCard label="전체 발송" value={data.sent + data.failed} icon="📤" />
            <StatCard label="성공" value={data.sent} color={COLORS.success} icon="✓" />
            <StatCard label="실패" value={data.failed} color={COLORS.danger} icon="⚠" />
            <StatCard label="이메일 열람" value={data.opened} color="#9b59b6" icon="👁" />
            <StatCard label="열람률" value={`${data.openRate}%`} color="#3498db" icon="📈"
              sub={`${data.emailSent}건 중`} />
          </div>

          {/* 채널별 */}
          <h3 style={h3}>채널별 세부</h3>
          <table style={tbl}>
            <thead>
              <tr style={{ background: "#f9f7f2" }}>
                <th style={thRep}>채널</th>
                <th style={thRep}>발송</th>
                <th style={thRep}>성공</th>
                <th style={thRep}>실패</th>
                <th style={thRep}>열람</th>
                <th style={thRep}>열람률</th>
              </tr>
            </thead>
            <tbody>
              {data.byChannel.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: COLORS.muted }}>
                  선택 기간에 발송 내역이 없습니다
                </td></tr>
              ) : data.byChannel.map((r) => {
                const total = r.sent + r.failed;
                const openRate = r.channel === "email" && r.sent > 0
                  ? Math.round((r.opened / r.sent) * 1000) / 10 : null;
                return (
                  <tr key={r.channel} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={tdRep}>
                      <span style={badgeStyle(r.channel === "sms" ? "#3498db" : "#9b59b6")}>
                        {r.channel === "sms" ? "SMS" : "이메일"}
                      </span>
                    </td>
                    <td style={tdRep}>{total.toLocaleString()}</td>
                    <td style={{ ...tdRep, color: COLORS.success, fontWeight: 600 }}>{r.sent.toLocaleString()}</td>
                    <td style={{ ...tdRep, color: COLORS.danger }}>{r.failed.toLocaleString()}</td>
                    <td style={tdRep}>{r.channel === "email" ? r.opened.toLocaleString() : "–"}</td>
                    <td style={tdRep}>{openRate !== null ? `${openRate}%` : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 일별 추이 */}
          <h3 style={{ ...h3, marginTop: 28 }}>일별 추이</h3>
          <DailyChart daily={data.daily} from={from} to={to} />
        </>
      ) : null}
    </div>
  );
}

function PresetBtn({ days, apply, children }) {
  return (
    <button onClick={() => apply(days)} style={{
      padding: "4px 12px", fontSize: 12, background: "#fff",
      border: "1px solid #ddd", borderRadius: 4, cursor: "pointer",
    }}>{children}</button>
  );
}

function StatCard({ label, value, icon, color = COLORS.textSecondary, sub }) {
  return (
    <div style={{
      padding: 16, background: "#fff", borderRadius: 8,
      border: `1px solid ${COLORS.borderLight}`, textAlign: "center",
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/** 막대 차트 — SVG로 일별 발송량 표시 */
function DailyChart({ daily }) {
  if (!daily || daily.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 30, color: COLORS.muted, fontSize: 13 }}>
        일별 데이터가 없습니다
      </div>
    );
  }

  // day별로 SMS/이메일 합산
  const byDay = {};
  daily.forEach((r) => {
    if (!byDay[r.day]) byDay[r.day] = { sms: 0, email: 0, opened: 0 };
    if (r.channel === "sms") byDay[r.day].sms += r.sent;
    else if (r.channel === "email") {
      byDay[r.day].email += r.sent;
      byDay[r.day].opened += r.opened;
    }
  });
  const days = Object.keys(byDay).sort();
  const maxSent = Math.max(1, ...days.map((d) => byDay[d].sms + byDay[d].email));

  const BAR_W = 24;
  const GAP = 6;
  const CHART_H = 140;
  const width = days.length * (BAR_W + GAP) + GAP;

  return (
    <div style={{ overflowX: "auto", padding: 12, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
      <svg width={width} height={CHART_H + 40}>
        {days.map((d, i) => {
          const { sms, email, opened } = byDay[d];
          const smsH = (sms / maxSent) * CHART_H;
          const emailH = (email / maxSent) * CHART_H;
          const openedH = email > 0 ? (opened / maxSent) * CHART_H : 0;
          const x = GAP + i * (BAR_W + GAP);
          const smsY = CHART_H - smsH;
          const emailY = smsY - emailH;
          return (
            <g key={d}>
              {/* SMS 막대 */}
              {sms > 0 && <rect x={x} y={smsY} width={BAR_W} height={smsH} fill="#3498db" />}
              {/* 이메일 막대 */}
              {email > 0 && <rect x={x} y={emailY} width={BAR_W} height={emailH} fill="#9b59b6" />}
              {/* 열람 마커 (이메일 중 열람된 비율) */}
              {opened > 0 && (
                <rect x={x} y={emailY} width={BAR_W} height={openedH} fill="#e67e22" opacity={0.8} />
              )}
              {/* 날짜 라벨 */}
              <text x={x + BAR_W / 2} y={CHART_H + 14} fontSize="9" fill="#888" textAnchor="middle">
                {d.slice(5)}
              </text>
              {/* 합계 */}
              {(sms + email) > 0 && (
                <text x={x + BAR_W / 2} y={CHART_H + 28} fontSize="9" fill="#666" textAnchor="middle">
                  {sms + email}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: 10, fontSize: 11, color: COLORS.muted, display: "flex", gap: 16 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#3498db", marginRight: 4 }} />SMS</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#9b59b6", marginRight: 4 }} />이메일</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#e67e22", marginRight: 4 }} />이메일 열람</span>
      </div>
    </div>
  );
}

const h3 = { fontSize: 14, fontWeight: 600, marginBottom: 10, color: COLORS.textSecondary };
const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 };
const thRep = { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12, color: COLORS.textSecondary };
const tdRep = { padding: "10px 12px", fontSize: 13 };
