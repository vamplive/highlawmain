/**
 * 관리자 — 포털 업무시간 현황
 * 일자별 캘린더 뷰 + 직원별 필터
 * API: GET /api/portal/admin/time-entries?from=&to=&portalUserId=
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const S = {
  accent: "#c9a84c", text: "#0b1f3a", textSec: "#4a5568",
  textMuted: "#8a97a8", border: "rgba(11,31,58,0.10)", card: "#fff",
};

function formatDuration(min) {
  if (!min || min === 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return { days, firstDayOfWeek: first.getDay() };
}

export default function AdminPortalTimeOverview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [entries, setEntries] = useState([]);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/portal/admin/users?status=active&limit=100")
      .then(r => setUsers(r.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadEntries(); }, [year, month, selectedUser]);

  const loadEntries = async () => {
    setLoading(true);
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = `${year}-${String(month + 1).padStart(2, "0")}-31`;
    try {
      const params = new URLSearchParams({ from, to, limit: 500 });
      if (selectedUser) params.set("portalUserId", selectedUser);
      const res = await api.get(`/portal/admin/time-entries?${params}`);
      setEntries(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  // 일자별, 사용자별 분 합산
  const summaryByDay = {};
  for (const e of entries) {
    if (!e.endedAt || !e.durationMinutes) continue;
    const day = e.startedAt.slice(0, 10);
    if (!summaryByDay[day]) summaryByDay[day] = { total: 0, users: {} };
    summaryByDay[day].total += e.durationMinutes;
    const key = e.clientName || e.userEmail || e.portalUserId;
    summaryByDay[day].users[key] = (summaryByDay[day].users[key] || 0) + e.durationMinutes;
  }

  // 이번 달 전체 합계
  const totalMinutes = Object.values(summaryByDay).reduce((s, d) => s + d.total, 0);

  const { days, firstDayOfWeek } = getMonthDays(year, month);
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const DOW = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 4 }}>업무시간 현황</h1>
        <p style={{ fontSize: 13, color: S.textSec }}>구성원별 일자별 업무 기록 시간을 캘린더로 확인합니다.</p>
      </div>

      {/* 컨트롤 바 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={{ padding: "6px 12px", border: `1px solid ${S.border}`, borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 16 }}>‹</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: S.text, minWidth: 100, textAlign: "center" }}>
            {year}년 {month + 1}월
          </span>
          <button onClick={nextMonth} style={{ padding: "6px 12px", border: `1px solid ${S.border}`, borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 16 }}>›</button>
        </div>

        <select
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          style={{ padding: "8px 12px", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 13, minWidth: 160 }}
        >
          <option value="">전체 구성원</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.clientName || u.email}</option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: S.accent }}>
          {month + 1}월 총: {formatDuration(totalMinutes) || "0h"}
        </div>
      </div>

      {/* 캘린더 */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8f8f8", borderBottom: `1px solid ${S.border}` }}>
          {DOW.map((d, i) => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : S.textSec }}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {/* 첫째 날 이전 빈 칸 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`blank-${i}`} style={{ minHeight: 80, borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }} />
          ))}

          {days.map((day, idx) => {
            const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const dayData = summaryByDay[dayKey];
            const isToday = dayKey === new Date().toISOString().slice(0, 10);
            const dow = day.getDay();
            const totalIdx = firstDayOfWeek + idx;
            const isLastRow = totalIdx >= (Math.ceil((firstDayOfWeek + days.length) / 7) - 1) * 7;

            return (
              <div
                key={dayKey}
                style={{
                  minHeight: 80, padding: "8px",
                  borderRight: (totalIdx + 1) % 7 === 0 ? "none" : "1px solid #f0f0f0",
                  borderBottom: isLastRow ? "none" : "1px solid #f0f0f0",
                  background: isToday ? "#fffbf0" : "#fff",
                }}
              >
                {/* 날짜 번호 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", fontSize: 12, fontWeight: 700,
                    background: isToday ? S.accent : "transparent",
                    color: isToday ? "#fff" : (dow === 0 ? "#ef4444" : dow === 6 ? "#3b82f6" : S.text),
                  }}>
                    {day.getDate()}
                  </span>
                  {dayData && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 6px", borderRadius: 8 }}>
                      {formatDuration(dayData.total)}
                    </span>
                  )}
                </div>

                {/* 사용자별 breakdown */}
                {dayData && !selectedUser && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {Object.entries(dayData.users).slice(0, 3).map(([name, min]) => (
                      <div key={name} style={{ fontSize: 9, color: S.textSec, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{name}</span>
                        <span style={{ color: "#059669", fontWeight: 600 }}>{formatDuration(min)}</span>
                      </div>
                    ))}
                    {Object.keys(dayData.users).length > 3 && (
                      <div style={{ fontSize: 9, color: S.textMuted }}>+{Object.keys(dayData.users).length - 3}명 더</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 상세 목록 */}
      {entries.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, marginBottom: 14 }}>상세 기록 ({entries.length}건)</h3>
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f8f8" }}>
                  {["날짜", "구성원", "사건", "작업 내용", "시간"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: S.textSec, borderBottom: `1px solid ${S.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.filter(e => e.endedAt).map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? `1px solid #f5f5f5` : "none" }}>
                    <td style={{ padding: "10px 14px", color: S.textMuted }}>{e.startedAt?.slice(0, 10)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 500 }}>{e.clientName || e.userEmail?.split("@")[0]}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: S.textSec }}>{e.caseTitle || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>{e.description}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: S.accent }}>{formatDuration(e.durationMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
