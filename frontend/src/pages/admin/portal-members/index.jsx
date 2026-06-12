/**
 * 관리자 — 포털 구성원 관리
 * 탭: 관리자 | 대표 | 변호사 | 직원 | 미지정
 * 승인된 포털 사용자를 역할별로 분류, 역할·직함·입사일 인라인 편집
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const ROLE_OPTIONS = [
  { value: "",     label: "— 역할 선택 —" },
  { value: "관리자", label: "관리자" },
  { value: "대표",   label: "대표" },
  { value: "변호사", label: "변호사" },
  { value: "전문위원",label: "전문위원" },
  { value: "직원",   label: "직원" },
  { value: "인턴",   label: "인턴" },
];

const ALL_TABS = [
  { key: "관리자",    label: "관리자",  desc: "시스템 전체 권한을 가진 관리자" },
  { key: "대표",      label: "대표",    desc: "법무법인 대표 변호사" },
  { key: "변호사",    label: "변호사",  desc: "소속 변호사 및 파트너 변호사" },
  { key: "전문위원",  label: "전문위원",desc: "전문위원" },
  { key: "직원",      label: "직원",    desc: "일반 직원 및 사무국 구성원" },
  { key: "__unset__", label: "미지정",  desc: "아직 역할이 지정되지 않은 구성원" },
];

const ROLE_BADGE = {
  "관리자":  { bg: "#ede9fe", color: "#5b21b6" },
  "대표":    { bg: "#fef3c7", color: "#92400e" },
  "변호사":  { bg: "#dbeafe", color: "#1d4ed8" },
  "전문위원":{ bg: "#e0f2fe", color: "#0369a1" },
  "직원":    { bg: "#dcfce7", color: "#166534" },
  "인턴":    { bg: "#f3f4f6", color: "#374151" },
};

const S = {
  accent: "#c9a84c",
  text: "#0b1f3a",
  textSec: "#4a5568",
  textMuted: "#8a97a8",
  border: "rgba(11,31,58,0.10)",
  card: "#fff",
};

/** 한 구성원의 인라인 편집 폼 */
function EditRow({ member, onSave, onCancel }) {
  const [role, setRole]         = useState(member.role     || "");
  const [position, setPosition] = useState(member.position || "");
  const [hireDate, setHireDate] = useState(member.hireDate || "");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/portal/admin/users/${member.id}`, { role, position, hireDate });
      onSave({ role, position, hireDate });
    } catch (err) {
      alert("저장에 실패했습니다: " + (err?.message || "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    border: `1px solid ${S.border}`, borderRadius: 5,
    padding: "5px 8px", fontSize: 12, color: S.text,
    background: "#fafafa", width: "100%",
  };

  return (
    <tr style={{ background: "#fffdf4" }}>
      <td colSpan={5} style={{ padding: "14px 16px", borderBottom: `1px solid ${S.border}` }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* 역할 */}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: S.textSec }}>역할</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {/* 직함 */}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: S.textSec }}>직함 (선택)</span>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="예: 선임 변호사"
              style={inputStyle}
            />
          </label>

          {/* 입사일 */}
          <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: S.textSec }}>입사일</span>
            <input
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          {/* 저장/취소 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 1 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "6px 16px", fontSize: 12, fontWeight: 600,
                background: S.accent, color: "#fff", border: "none",
                borderRadius: 5, cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={onCancel}
              disabled={saving}
              style={{
                padding: "6px 12px", fontSize: 12, fontWeight: 500,
                background: "#fff", color: S.textSec,
                border: `1px solid ${S.border}`, borderRadius: 5, cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminPortalMembers() {
  const [tab, setTab]             = useState("__unset__");
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);

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

  const visibleMembers = tab === "__unset__"
    ? allMembers.filter((m) => !m.role)
    : allMembers.filter((m) => m.role === tab);

  const countFor = (key) =>
    key === "__unset__"
      ? allMembers.filter((m) => !m.role).length
      : allMembers.filter((m) => m.role === key).length;

  const handleEditSave = (userId, updates) => {
    setAllMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, ...updates } : m))
    );
    setEditingId(null);
  };

  const currentTabDef = ALL_TABS.find((t) => t.key === tab);

  const tabStyle = (active) => ({
    padding: "8px 18px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? S.accent : S.textSec,
    background: "transparent", border: "none",
    borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 4 }}>구성원 관리</h1>
        <p style={{ fontSize: 13, color: S.textSec }}>
          포털에 승인된 구성원을 역할별로 분류하고 기본 정보를 설정합니다.
        </p>
      </div>

      {/* 역할 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, marginBottom: 24, overflowX: "auto" }}>
        {ALL_TABS.map((t) => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
            <span style={{ fontSize: 11, fontWeight: 600, color: tab === t.key ? S.accent : S.textMuted }}>
              {countFor(t.key)}
            </span>
          </button>
        ))}
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
                {["이름", "이메일", "역할 / 입사일", "직함", "액션"].map((h) => (
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
                    {tab === "__unset__" ? "역할이 미지정된 구성원이 없습니다" : `"${currentTabDef?.label}" 역할의 구성원이 없습니다`}
                  </td>
                </tr>
              ) : visibleMembers.map((m, i) => {
                const badge = ROLE_BADGE[m.role] || { bg: "#f0f4ff", color: "#3b4db8" };
                const isEditing = editingId === m.id;
                const isLast = i === visibleMembers.length - 1;

                return [
                  <tr key={m.id} style={{ borderBottom: (isEditing || !isLast) ? `1px solid ${S.border}` : "none" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.clientName || m.email.split("@")[0]}</td>
                    <td style={{ padding: "12px 16px", color: S.textSec, fontSize: 12 }}>{m.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>
                        {m.role || "미지정"}
                      </span>
                      {m.hireDate && (
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}>입사 {m.hireDate}</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: S.textSec, fontSize: 12 }}>
                      {m.position || <span style={{ color: S.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setEditingId(isEditing ? null : m.id)}
                        style={{
                          padding: "5px 12px", fontSize: 12, fontWeight: 500,
                          border: `1px solid ${isEditing ? S.accent : S.border}`,
                          background: isEditing ? "rgba(201,168,76,0.08)" : "#fff",
                          color: isEditing ? S.accent : S.textSec,
                          borderRadius: 5, cursor: "pointer",
                        }}
                      >
                        {isEditing ? "닫기" : "편집"}
                      </button>
                    </td>
                  </tr>,
                  isEditing && (
                    <EditRow
                      key={`edit-${m.id}`}
                      member={m}
                      onSave={(updates) => handleEditSave(m.id, updates)}
                      onCancel={() => setEditingId(null)}
                    />
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
