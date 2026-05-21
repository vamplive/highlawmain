/** 관리자 강의 관리 — 변호사별 강의 CRUD + 강의안 업로드 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { PageHeader, EditPanel, FormField, EmptyState, ErrorBanner, outlineBtnStyle, COLORS } from "../../../components/admin";

const EMPTY_FORM = {
  lawyerId: "", title: "", description: "", date: "",
  venue: "", organizer: "", thumbnailUrl: "", isPublished: 1, sortOrder: 0,
};

export default function AdminLectures() {
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(null);

  // 변호사 목록 로드
  useEffect(() => {
    api.get("/lawyers?all=true")
      .then((json) => {
        setLawyers(json.data ?? []);
        if (json.data?.length > 0) setSelectedLawyer(json.data[0].id);
      })
      .catch(() => {});
  }, []);

  // 강의 목록 로드
  const load = useCallback(() => {
    if (!selectedLawyer) return;
    setLoading(true);
    api.get(`/lectures?lawyerId=${selectedLawyer}&all=true`)
      .then((json) => setItems(json.data ?? []))
      .catch((err) => setError("목록 조회 실패: " + err.message))
      .finally(() => setLoading(false));
  }, [selectedLawyer]);

  useEffect(load, [load]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setEditing("new");
    setForm({ ...EMPTY_FORM, lawyerId: selectedLawyer, sortOrder: items.length });
    setError(null);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    const mapped = {};
    for (const key of Object.keys(EMPTY_FORM)) {
      mapped[key] = item[key] ?? EMPTY_FORM[key];
    }
    setForm(mapped);
    setError(null);
  };

  const cancelEdit = () => { setEditing(null); setError(null); };

  const save = async () => {
    if (!form.title.trim()) { setError("강의 제목을 입력해주세요"); return; }
    if (!form.lawyerId) { setError("변호사를 선택해주세요"); return; }
    try {
      if (editing === "new") {
        await api.post("/lectures", form);
      } else {
        await api.patch(`/lectures/${editing}`, form);
      }
      setEditing(null);
      setError(null);
      load();
    } catch (err) {
      setError("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/lectures/${id}`);
      load();
    } catch (err) {
      setError("삭제 실패: " + err.message);
    }
  };

  const togglePublished = async (item) => {
    try {
      await api.patch(`/lectures/${item.id}`, { isPublished: item.isPublished ? 0 : 1 });
      load();
    } catch (err) {
      setError("변경 실패: " + err.message);
    }
  };

  /** 강의안 파일 업로드 */
  const handleFileUpload = async (lectureId, file) => {
    setUploading(lectureId);
    try {
      await api.upload(`/lectures/${lectureId}/upload-material`, file);
      load();
    } catch (err) {
      setError("파일 업로드 실패: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const lawyerOptions = lawyers.map((l) => ({ value: l.id, label: `${l.name} (${l.position})` }));
  const selectedLawyerName = lawyers.find((l) => l.id === selectedLawyer)?.name || "";

  return (
    <div>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <PageHeader
        title="강의 관리"
        onAdd={openNew}
        addLabel="+ 강의 등록"
      />

      {/* 변호사 선택 필터 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginRight: 8 }}>변호사 선택:</label>
        <select
          value={selectedLawyer}
          onChange={(e) => { setSelectedLawyer(e.target.value); setEditing(null); }}
          style={{
            fontSize: 14, padding: "6px 12px", border: `1px solid ${COLORS.borderLight}`,
            borderRadius: 4, background: "#fff", color: COLORS.text,
          }}
        >
          {lawyers.map((l) => (
            <option key={l.id} value={l.id}>{l.name} ({l.position})</option>
          ))}
        </select>
      </div>

      {/* 편집 폼 */}
      {editing !== null && (
        <EditPanel isNew={editing === "new"} entityName="강의" onSave={save} onCancel={cancelEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <FormField
              label="변호사" value={form.lawyerId}
              onChange={(v) => setField("lawyerId", v)}
              type="select" options={lawyerOptions} required
            />
            <FormField label="강의 제목" value={form.title} onChange={(v) => setField("title", v)} required placeholder="건설분쟁 실무 강의" />
            <FormField label="강의 날짜" value={form.date} onChange={(v) => setField("date", v)} placeholder="2026-03-15" />
            <FormField label="장소" value={form.venue} onChange={(v) => setField("venue", v)} placeholder="서울 강남구 역삼동" />
            <FormField label="주최 기관" value={form.organizer} onChange={(v) => setField("organizer", v)} placeholder="대한변호사협회" />
            <FormField label="정렬 순서" value={form.sortOrder} onChange={(v) => setField("sortOrder", v)} type="number" />
          </div>
          <FormField label="썸네일 이미지 URL" value={form.thumbnailUrl} onChange={(v) => setField("thumbnailUrl", v)} placeholder="https://images.unsplash.com/..." />
          {form.thumbnailUrl && (
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <img src={form.thumbnailUrl} alt="썸네일 미리보기" style={{ width: 200, height: 120, objectFit: "cover", border: "1px solid #ddd", borderRadius: 4 }}
                onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}
          <FormField
            label="강의 설명" value={form.description}
            onChange={(v) => setField("description", v)}
            type="textarea" placeholder="강의 내용, 대상, 주요 주제 등을 자세히 기술해주세요"
          />
          <div style={{ marginTop: 12 }}>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
              <input type="checkbox" checked={form.isPublished === 1} onChange={(e) => setField("isPublished", e.target.checked ? 1 : 0)} />
              공개
            </label>
          </div>
        </EditPanel>
      )}

      {/* 강의 목록 */}
      {loading ? (
        <p style={{ color: COLORS.muted, fontSize: 14 }}>로딩 중...</p>
      ) : items.length === 0 ? (
        <EmptyState icon="📚" message={`${selectedLawyerName || "선택된 변호사"}의 등록된 강의가 없습니다`} />
      ) : (
        <div className="space-y-3">
          {items.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onEdit={() => openEdit(lecture)}
              onRemove={() => remove(lecture.id)}
              onToggle={() => togglePublished(lecture)}
              onUpload={handleFileUpload}
              uploading={uploading === lecture.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 강의 목록 카드 — 단일 항목 렌더링 */
function LectureCard({ lecture, onEdit, onRemove, onToggle, onUpload, uploading }) {
  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.jpg,.jpeg,.png,.zip";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) onUpload(lecture.id, file);
    };
    input.click();
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        background: lecture.isPublished ? "#fff" : COLORS.bgInactive,
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 6,
        opacity: lecture.isPublished ? 1 : 0.6,
      }}
    >
      <div className="flex items-start gap-4">
        {/* 아이콘 */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: "rgba(26,58,107,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          📚
        </div>

        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-baseline gap-2" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{lecture.title}</span>
            {!lecture.isPublished && <span style={{ fontSize: 10, color: "#c00" }}>(비공개)</span>}
          </div>
          <div className="flex flex-wrap gap-3" style={{ fontSize: 12, color: COLORS.textLight }}>
            {lecture.date && <span>📅 {lecture.date}</span>}
            {lecture.organizer && <span>🏛️ {lecture.organizer}</span>}
            {lecture.venue && <span>📍 {lecture.venue}</span>}
          </div>
          {lecture.description && (
            <p style={{ fontSize: 13, color: COLORS.textLight, marginTop: 6, lineHeight: 1.5 }}>
              {lecture.description.length > 100 ? lecture.description.slice(0, 100) + "..." : lecture.description}
            </p>
          )}
          {/* 강의안 상태 */}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            {lecture.materialUrl ? (
              <a
                href={lecture.materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: COLORS.accent, textDecoration: "none" }}
              >
                📎 {lecture.materialName || "강의안 다운로드"}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#aaa" }}>강의안 미등록</span>
            )}
            <button
              onClick={handleFileSelect}
              disabled={uploading}
              style={{
                ...outlineBtnStyle(),
                fontSize: 11, padding: "3px 10px",
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? "업로드 중..." : lecture.materialUrl ? "교체" : "업로드"}
            </button>
          </div>
        </div>

        {/* 순서 */}
        <span style={{ fontSize: 11, color: "#ccc", minWidth: 40, textAlign: "center" }}>#{lecture.sortOrder}</span>

        {/* 액션 */}
        <div className="flex gap-2">
          <button onClick={onToggle} title={lecture.isPublished ? "비공개" : "공개"} style={outlineBtnStyle()}>
            {lecture.isPublished ? "👁️" : "🔒"}
          </button>
          <button onClick={onEdit} style={outlineBtnStyle()}>✏️</button>
          <button onClick={onRemove} style={outlineBtnStyle("#c00")}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
