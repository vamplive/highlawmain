/** 공지/배너 CRUD 탭 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { TOAST_DURATION_MS } from "../../../utils/timing";
import { FormField } from "../../../components/admin";
import { COLORS, btnStyle, outlineBtnStyle, badgeStyle, labelStyle } from "../../../components/admin/styles";
import { formatDate } from "../../../utils/formatters";
import { SectionCard, FieldRow, ColorPickerField, ToggleSwitch } from "./shared";
import {
  ANNOUNCEMENT_TYPES, ANNOUNCEMENT_POSITIONS,
  ANNOUNCEMENT_TYPE_STYLES, ANNOUNCEMENT_TYPE_LABELS,
  EMPTY_ANNOUNCEMENT,
} from "./constants";
import { showToast } from "../../../utils/showToast";

export default function AnnouncementsSection({ setToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/announcements").then((j) => setAnnouncements(j.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateForm = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const saveForm = async () => {
    if (!form) return;
    setSaving(true);
    try {
      form.id ? await api.patch(`/announcements/${form.id}`, form) : await api.post("/announcements", form);
      setForm(null); load();
      setToast("공지가 저장되었습니다"); setTimeout(() => setToast(""), TOAST_DURATION_MS);
    } catch (err) { showToast("저장 실패: " + err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try { await api.delete(`/announcements/${id}`); load(); setToast("삭제되었습니다"); setTimeout(() => setToast(""), TOAST_DURATION_MS); }
    catch (err) { showToast("삭제 실패: " + err.message); }
  };

  const toggleActive = async (ann) => {
    try { await api.patch(`/announcements/${ann.id}`, { isActive: !ann.isActive }); load(); }
    catch (err) { showToast("변경 실패: " + err.message); }
  };

  if (form) {
    return <EditForm form={form} updateForm={updateForm} onSave={saveForm} onCancel={() => setForm(null)} saving={saving} />;
  }

  return <List announcements={announcements} onNew={() => setForm({ ...EMPTY_ANNOUNCEMENT })} onEdit={(a) => setForm({ ...a })} onDelete={remove} onToggleActive={toggleActive} />;
}

/* ─── 편집 폼 ─── */
function EditForm({ form, updateForm, onSave, onCancel, saving }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{form.id ? "공지 수정" : "새 공지 작성"}</h3>
        <button onClick={onCancel} style={btnStyle(COLORS.muted)}>목록으로</button>
      </div>
      <SectionCard title="기본 정보">
        <FieldRow>
          <FormField label="유형" type="select" value={form.type} onChange={(v) => updateForm("type", v)} options={ANNOUNCEMENT_TYPES} />
          <FormField label="위치" type="select" value={form.position} onChange={(v) => updateForm("position", v)} options={ANNOUNCEMENT_POSITIONS} />
        </FieldRow>
        <FormField label="제목" value={form.title} onChange={(v) => updateForm("title", v)} />
        <div style={{ marginTop: 12 }}><FormField label="내용" type="textarea" minHeight={96} value={form.content} onChange={(v) => updateForm("content", v)} /></div>
        <div style={{ marginTop: 12 }}><FormField label="링크 URL" value={form.linkUrl} onChange={(v) => updateForm("linkUrl", v)} placeholder="https://" /></div>
      </SectionCard>
      <SectionCard title="스타일">
        <FieldRow>
          <ColorPickerField label="배경색" value={form.bgColor} onChange={(v) => updateForm("bgColor", v)} />
          <ColorPickerField label="텍스트 색상" value={form.textColor} onChange={(v) => updateForm("textColor", v)} />
        </FieldRow>
        <div style={{ marginTop: 12, padding: "12px 20px", borderRadius: 6, background: form.bgColor, color: form.textColor, fontSize: 14, fontWeight: 500 }}>
          {form.title || "미리보기 텍스트"}
        </div>
      </SectionCard>
      <SectionCard title="일정 및 상태">
        <FieldRow>
          <FormField label="시작일시" type="datetime-local" value={form.startDate} onChange={(v) => updateForm("startDate", v)} />
          <FormField label="종료일시" type="datetime-local" value={form.endDate} onChange={(v) => updateForm("endDate", v)} />
        </FieldRow>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>활성화</label>
          <ToggleSwitch isOn={form.isActive} onToggle={() => updateForm("isActive", !form.isActive)} label={form.isActive ? "활성" : "비활성"} />
        </div>
      </SectionCard>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <button onClick={onCancel} style={btnStyle(COLORS.muted)}>취소</button>
        <button onClick={onSave} disabled={saving} style={btnStyle(COLORS.accent)}>{saving ? "저장 중..." : "저장"}</button>
      </div>
    </>
  );
}

/* ─── 목록 ─── */
function List({ announcements, onNew, onEdit, onDelete, onToggleActive }) {
  const th = { padding: "10px 14px", fontWeight: 600, color: COLORS.textSecondary, fontSize: 11 };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>공지/배너 목록</h3>
        <button onClick={onNew} style={btnStyle(COLORS.accent)}>+ 새 공지</button>
      </div>
      {announcements.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, fontSize: 14 }}>등록된 공지가 없습니다.</div>
      ) : (
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.bgForm }}>
                <th style={{ ...th, textAlign: "left" }}>유형</th>
                <th style={{ ...th, textAlign: "left" }}>제목</th>
                <th style={{ ...th, textAlign: "center" }}>상태</th>
                <th style={{ ...th, textAlign: "left" }}>기간</th>
                <th style={{ ...th, textAlign: "center" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((ann) => (
                <tr key={ann.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={badgeStyle((ANNOUNCEMENT_TYPE_STYLES[ann.type] || {}).bg || "#f1f5f9", (ANNOUNCEMENT_TYPE_STYLES[ann.type] || {}).color || "#475569")}>
                      {ANNOUNCEMENT_TYPE_LABELS[ann.type] || ann.type}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.text }}>{ann.title}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}><ToggleSwitch isOn={ann.isActive} onToggle={() => onToggleActive(ann)} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: COLORS.textMuted }}>{ann.startDate ? formatDate(ann.startDate) : "-"} ~ {ann.endDate ? formatDate(ann.endDate) : "-"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => onEdit(ann)} style={outlineBtnStyle()}>수정</button>
                      <button onClick={() => onDelete(ann.id)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
