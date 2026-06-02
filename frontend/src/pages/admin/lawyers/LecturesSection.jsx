/** 변호사 편집 패널 안에서 그 변호사의 강의를 인라인으로 관리하는 섹션.
 *  /api/lectures GET/POST/PATCH/DELETE 사용. lawyerId 가 있을 때만 동작한다. */
import { useEffect, useState } from "react";
import { api } from "../../../utils/api";
import { FormField, COLORS, btnStyle, outlineBtnStyle } from "../../../components/admin";

const EMPTY = {
  title: "", organizer: "", venue: "", date: "",
  description: "", thumbnailUrl: "", isPublished: 1, sortOrder: 0,
};

export default function LecturesSection({ lawyerId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // "new" | lecture id | null
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((n) => n + 1);

  // 강의 목록 조회 — lawyerId 또는 reloadKey 가 바뀔 때 재조회
  useEffect(() => {
    if (!lawyerId) return;
    let cancelled = false;
    api.get(`/lectures?lawyerId=${lawyerId}&all=true`)
      .then((res) => { if (!cancelled) setItems(res?.data || []); })
      .catch((err) => { if (!cancelled) setError("강의 조회 실패: " + err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lawyerId, reloadKey]);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditingId("new");
    setForm({ ...EMPTY, sortOrder: items.length });
    setError("");
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    const next = { ...EMPTY };
    for (const key of Object.keys(EMPTY)) {
      next[key] = item[key] ?? EMPTY[key];
    }
    setForm(next);
    setError("");
  };

  const cancel = () => { setEditingId(null); setError(""); };

  const save = async () => {
    if (!form.title.trim()) { setError("강의 제목을 입력해주세요"); return; }
    try {
      if (editingId === "new") {
        await api.post("/lectures", { ...form, lawyerId });
      } else {
        await api.patch(`/lectures/${editingId}`, form);
      }
      setEditingId(null);
      reload();
    } catch (err) {
      setError("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("이 강의를 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/lectures/${id}`);
      reload();
    } catch (err) {
      setError("삭제 실패: " + err.message);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {error && (
        <div style={{
          padding: "8px 12px", marginBottom: 10, borderRadius: 4,
          background: "#fdecea", color: COLORS.danger, fontSize: 13,
        }}>{error}</div>
      )}

      {/* 인라인 편집 폼 */}
      {editingId !== null && (
        <div style={{
          padding: 16, marginBottom: 16,
          background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6,
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="제목" value={form.title} onChange={setField("title")} required placeholder="예: 민사법 기록형 특강" />
            <FormField label="주최/기관" value={form.organizer} onChange={setField("organizer")} placeholder="예: 동아대학교 법학전문대학원" />
            <FormField label="장소" value={form.venue} onChange={setField("venue")} placeholder="예: 본관 102호" />
            <FormField label="일자" value={form.date} onChange={setField("date")} placeholder="2026-03-15" />
            <FormField label="썸네일 URL" value={form.thumbnailUrl} onChange={setField("thumbnailUrl")} placeholder="/uploads/..." />
            <FormField label="정렬 순서" value={form.sortOrder} onChange={setField("sortOrder")} type="number" />
          </div>
          <div style={{ marginTop: 8 }}>
            <FormField label="설명" value={form.description} onChange={setField("description")} type="textarea" placeholder="선택" />
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, marginTop: 8 }}>
            <input type="checkbox" checked={form.isPublished === 1}
              onChange={(e) => setField("isPublished")(e.target.checked ? 1 : 0)} />
            공개 (사이트에 노출)
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="button" onClick={save} style={btnStyle(COLORS.primary)}>저장</button>
            <button type="button" onClick={cancel} style={outlineBtnStyle()}>취소</button>
          </div>
        </div>
      )}

      {/* 목록 + 추가 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: COLORS.textMuted }}>
          {loading ? "불러오는 중…" : `총 ${items.length}건`}
        </span>
        {editingId === null && (
          <button type="button" onClick={openNew} style={outlineBtnStyle(COLORS.accent)}>+ 강의 추가</button>
        )}
      </div>

      {!loading && items.length === 0 && editingId === null && (
        <p style={{ fontSize: 13, color: COLORS.muted, padding: "12px 0" }}>등록된 강의가 없습니다.</p>
      )}

      {items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li key={item.id} style={{
              padding: "10px 12px", marginBottom: 6,
              border: `1px solid ${COLORS.borderLight}`, borderRadius: 4,
              background: item.isPublished ? "#fff" : COLORS.bgInactive,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginBottom: 2 }}>
                  {item.title}
                  {!item.isPublished && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.muted }}>(비공개)</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {[item.date, item.organizer, item.venue].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => openEdit(item)} style={outlineBtnStyle()}>수정</button>
                <button type="button" onClick={() => remove(item.id)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
