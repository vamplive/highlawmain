/**
 * 관리자 — 포털 구성원 관리
 * 탭: 관리자 | 대표 | 변호사 | 직원 | 미지정
 * 승인된 포털 사용자를 역할별로 분류하고 관리
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const ROLES = [
  { key: "관리자", label: "관리자", desc: "시스템 전체 권한을 가진 관리자" },
  { key: "대표",   label: "대표",   desc: "법무법인 대표 변호사" },
  { key: "변호사", label: "변호사", desc: "소속 변호사 및 파트너 변호사" },
  { key: "직원",   label: "직원",   desc: "일반 직원 및 사무국 구성원" },
];

const ALL_TABS = [
  ...ROLES,
  { key: "__unset__", label: "미지정", desc: "아직 역할이 지정되지 않은 구성원" },
];

const ROLE_BADGE = {
  "관리자": { bg: "#ede9fe", color: "#5b21b6" },
  "대표":   { bg: "#fef3c7", color: "#92400e" },
  "변호사": { bg: "#dbeafe", color: "#1d4ed8" },
  "직원":   { bg: "#dcfce7", color: "#166534" },
};

const S = {
  accent: "#c9a84c",
  text: "#0b1f3a",
  textSec: "#4a5568",
  textMuted: "#8a97a8",
  border: "rgba(11,31,58,0.10)",
  card: "#fff",
};

export default function AdminPortalMembers() {
  const [tab, setTab] = useState("__unset__");
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/portal/admin/users?status=active&limit=200");
      setAllMembers(res.data ?? []);
    } catch {
      setAllMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // 현재 탭에 맞게 필터링
  const visibleMembers = tab === "__unset__"
    ? allMembers.filter((m) => !m.role)
    : allMembers.filter((m) => m.role === tab);

  // 탭별 인원수
  const countFor = (key) =>
    key === "__unset__"
      ? allMembers.filter((m) => !m.role).length
      : allMembers.filter((m) => m.role === key).length;

  const setRole = async (userId, role) => {
    setSaving(userId);
    try {
      await api.patch(`/portal/admin/users/${userId}`, { role });
      // 서버 재조회 대신 로컬 상태만 업데이트 (빠른 피드백)
      setAllMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role } : m))
      );
    } catch (err) {
      alert("역할 변경에 실패했습니다: " + (err?.message || "알 수 없는 오류"));
    } finally {
      setSaving(null);
    }
  };

  const tabStyle = (active) => ({
    padding: "8px 20px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? S.accent : S.textSec,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
    cursor: "pointer", transition: "color 0.15s",
    display: "flex", alignItems: "center", gap: 6,
  });

  const currentTabDef = ALL_TABS.find((t) => t.key === tab);

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
        {ALL_TABS.map((t) => {
          const cnt = countFor(t.key);
          return (
            <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: tab === t.key ? S.accent : S.textMuted,
              }}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* 탭 설명 */}
      <div style={{ padding: "10px 14px", background: "#f8f8f8", borderRadius: 8, marginBottom: 20, fontSize: 13, color: S.textSec }}>
        {currentTabDef?.desc}
      </div>

      {loading ? (
        <p style={{ color: S.textMuted, padding: 40, textAlign: "center" }}>로딩 중...</p>
      ) : (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["이름", "이메일", "연락처", "현재 역할", "역할 변경"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: S.textSec, borderBottom: `1px solid ${S.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: S.textMuted }}>
                    {tab === "__unset__" ? "역할이 미지정된 구성원이 없습니다" : `역할이 "${currentTabDef?.label}"인 구성원이 없습니다`}
                  </td>
                </tr>
              ) : visibleMembers.map((m, i) => {
                const badge = ROLE_BADGE[m.role] || { bg: "#f0f4ff", color: "#3b4db8" };
                const isSaving = saving === m.id;
                return (
                  <tr key={m.id} style={{ borderBottom: i < visibleMembers.length - 1 ? `1px solid ${S.border}` : "none" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.clientName || "-"}</td>
                    <td style={{ padding: "12px 16px", color: S.textSec }}>{m.email}</td>
                    <td style={{ padding: "12px 16px", color: S.textSec }}>{m.clientPhone || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {m.role || "미지정"}
                      </span>
                      {m.hireDate && (
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}>입사 {m.hireDate}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {ROLES.map((r) => {
                          const isCurrentRole = m.role === r.key;
                          return (
                            <button
                              key={r.key}
                              onClick={() => !isCurrentRole && !isSaving && setRole(m.id, r.key)}
                              disabled={isCurrentRole || isSaving}
                              title={isCurrentRole ? "현재 역할" : `${r.label}(으)로 변경`}
                              style={{
                                padding: "4px 10px", fontSize: 11, fontWeight: isCurrentRole ? 700 : 500,
                                border: `1px solid ${isCurrentRole ? S.accent : S.border}`,
                                background: isCurrentRole ? "rgba(201,168,76,0.12)" : "#fff",
                                color: isCurrentRole ? S.accent : isSaving ? "#bbb" : S.textSec,
                                borderRadius: 4,
                                cursor: isCurrentRole || isSaving ? "default" : "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {isSaving && m.role !== r.key ? r.label : r.label}
                            </button>
                          );
                        })}
                        {m.role && (
                          <button
                            onClick={() => !isSaving && setRole(m.id, null)}
                            disabled={isSaving}
                            title="역할 해제"
                            style={{
                              padding: "4px 8px", fontSize: 11,
                              border: `1px solid ${S.border}`,
                              background: "#fff", color: "#e53e3e",
                              borderRadius: 4, cursor: isSaving ? "default" : "pointer",
                            }}
                          >
                            해제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
