/**
 * 관리자 — 포털 구성원 관리
 * 탭: 변호사 | 직원 | 전문위원
 * 승인된 포털 사용자를 역할별로 관리
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const ROLES = [
  { key: "관리자", label: "관리자", desc: "시스템 전체 권한을 가진 관리자" },
  { key: "대표",   label: "대표",   desc: "법무법인 대표 변호사" },
  { key: "변호사", label: "변호사", desc: "소속 변호사 및 파트너 변호사" },
  { key: "직원",   label: "직원",   desc: "일반 직원 및 사무국 구성원" },
];

const S = {
  accent: "#c9a84c",
  text: "#0b1f3a",
  textSec: "#4a5568",
  textMuted: "#8a97a8",
  border: "rgba(11,31,58,0.10)",
  card: "#fff",
};

export default function AdminPortalMembers() {
  const [tab, setTab] = useState("관리자");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadMembers(); }, [tab]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/portal/admin/users?status=active&limit=100`);
      // role 필드로 필터 (portal_users 테이블에 role 컬럼 없으면 전체 표시)
      const all = res.data ?? [];
      setMembers(all);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => !m.role || m.role === tab);
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aUnassigned = !a.role ? 1 : 0;
    const bUnassigned = !b.role ? 1 : 0;
    return bUnassigned - aUnassigned;
  });

  const setRole = async (userId, role) => {
    setSaving(userId);
    try {
      await api.patch(`/portal/admin/users/${userId}`, { role });
      await loadMembers();
    } catch {
      alert("역할 변경에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  const tabStyle = (active) => ({
    padding: "8px 20px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? S.accent : S.textSec,
    background: active ? "rgba(201,168,76,0.08)" : "transparent",
    border: "none", borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
    cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 4 }}>구성원 관리</h1>
        <p style={{ fontSize: 13, color: S.textSec }}>
          포털에 승인된 구성원을 역할별로 분류하고 관리합니다.
        </p>
      </div>

      {/* 역할 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, marginBottom: 24 }}>
        {ROLES.map((r) => (
          <button key={r.key} style={tabStyle(tab === r.key)} onClick={() => setTab(r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* 현재 탭 설명 */}
      <div style={{ padding: "12px 16px", background: "#f8f8f8", borderRadius: 8, marginBottom: 20, fontSize: 13, color: S.textSec }}>
        {ROLES.find(r => r.key === tab)?.desc}
      </div>

      {loading ? (
        <p style={{ color: S.textMuted, padding: 40, textAlign: "center" }}>로딩 중...</p>
      ) : (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["이름", "이메일", "연락처", "현재 역할", "역할 변경"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: S.textSec, borderBottom: `1px solid ${S.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: S.textMuted }}>
                    구성원이 없습니다
                  </td>
                </tr>
              ) : sortedMembers.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < sortedMembers.length - 1 ? `1px solid ${S.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.clientName || "-"}</td>
                  <td style={{ padding: "12px 16px", color: S.textSec }}>{m.email}</td>
                  <td style={{ padding: "12px 16px", color: S.textSec }}>{m.clientPhone || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: m.role ? "#f0f4ff" : "#fffbeb", color: m.role ? "#3b4db8" : "#d97706" }}>
                      {m.role || "미지정"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {ROLES.map(r => (
                        <button
                          key={r.key}
                          onClick={() => setRole(m.id, r.key)}
                          disabled={saving === m.id || m.role === r.key}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            border: `1px solid ${m.role === r.key ? S.accent : S.border}`,
                            background: m.role === r.key ? "rgba(201,168,76,0.10)" : "transparent",
                            color: m.role === r.key ? S.accent : S.textSec,
                            borderRadius: 4, cursor: m.role === r.key ? "default" : "pointer",
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                      {m.role && (
                        <button
                          onClick={() => setRole(m.id, null)}
                          disabled={saving === m.id}
                          style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            border: "1px solid #fee2e2",
                            background: "transparent",
                            color: "#ef4444",
                            borderRadius: 4, cursor: "pointer",
                          }}
                        >
                          지정 해제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
