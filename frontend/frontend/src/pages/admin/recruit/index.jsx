/** 관리자 채용 공고 관리 페이지 — 목록, 등록, 수정, 삭제 */
import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader, EmptyState, COLORS, fieldStyle, outlineBtnStyle, thStyle, tdStyle, badgeStyle } from "../../../components/admin";
import { api } from "../../../utils/api";
import { formatDate } from "../../../utils/formatters";
import { showToast } from "../../../utils/showToast";

const CATEGORY_META = {
  new_lawyer: { label: "신입변호사", color: "#1a3a6b" },
  experienced_lawyer: { label: "경력변호사", color: "#2e7d32" },
  military_lawyer: { label: "군법무관", color: "#7b1fa2" },
  staff: { label: "직원", color: "#e65100" },
};

const STATUS_META = {
  open: { label: "모집 중", color: "#1b5e20", bg: "#e8f5e9", border: "#a5d6a7" },
  closed: { label: "마감", color: "#b71c1c", bg: "#ffebee", border: "#ef9a9a" },
};

const CATEGORY_OPTIONS = [
  { value: "new_lawyer", label: "신입변호사" },
  { value: "experienced_lawyer", label: "경력변호사" },
  { value: "military_lawyer", label: "군법무관" },
  { value: "staff", label: "직원" },
];

const INITIAL_FORM = {
  category: "new_lawyer",
  title: "",
  description: "",
  requirements: "",
  benefits: "",
  applicationDeadline: "",
  applicationFileUrl: "",
  applicationFileName: "",
  status: "open",
  isPublished: false,
  sortOrder: 0,
};

function PostModal({ post, onClose, onSaved }) {
  const isEdit = Boolean(post?.id);
  const [form, setForm] = useState(isEdit ? {
    ...INITIAL_FORM,
    ...post,
    isPublished: Boolean(post.isPublished),
  } : INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const uploadFile = async (file) => {
    if (!file) return;
    const ALLOWED = ["pdf", "jpg", "jpeg", "png", "webp", "gif", "hwp", "doc", "docx"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      showToast(`지원하지 않는 형식입니다: .${ext}`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/recruit/upload", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "업로드 실패");
      set("applicationFileUrl", json.data.url);
      set("applicationFileName", json.data.filename);
      showToast("파일 업로드 완료", "success");
    } catch (err) {
      showToast("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("공고 제목을 입력해 주세요."); return; }
    setSaving(true);
    try {
      const payload = { ...form, isPublished: form.isPublished ? 1 : 0 };
      if (isEdit) {
        await api.put(`/recruit/${post.id}`, payload);
        showToast("채용 공고가 수정되었습니다.", "success");
      } else {
        await api.post("/recruit", payload);
        showToast("채용 공고가 등록되었습니다.", "success");
      }
      onSaved();
    } catch (err) {
      showToast("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4, display: "block" };
  const groupStyle = { marginBottom: 16 };
  const textareaStyle = { ...fieldStyle, minHeight: 100, resize: "vertical" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "min(680px, 100%)", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 8, boxShadow: "0 24px 80px rgba(15,23,42,0.22)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>{isEdit ? "채용 공고 수정" : "채용 공고 등록"}</h2>
          <button onClick={onClose} style={outlineBtnStyle()}>닫기</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={groupStyle}>
              <label style={labelStyle}>분류 *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={fieldStyle}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>모집 상태</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} style={fieldStyle}>
                <option value="open">모집 중</option>
                <option value="closed">마감</option>
              </select>
            </div>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>공고 제목 *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 2025년 상반기 신입변호사 채용" style={fieldStyle} />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>공고 내용</label>
            <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="업무 내용, 채용 개요 등을 입력하세요" style={textareaStyle} />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>지원 자격 및 우대사항</label>
            <textarea value={form.requirements || ""} onChange={(e) => set("requirements", e.target.value)} placeholder="학력, 경력, 자격 요건 등을 입력하세요" style={textareaStyle} />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>복리후생 및 처우</label>
            <textarea value={form.benefits || ""} onChange={(e) => set("benefits", e.target.value)} placeholder="급여, 복리후생 등을 입력하세요" style={{ ...textareaStyle, minHeight: 80 }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={groupStyle}>
              <label style={labelStyle}>지원 마감일</label>
              <input type="date" value={form.applicationDeadline || ""} onChange={(e) => set("applicationDeadline", e.target.value)} style={fieldStyle} />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>정렬 순서</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} style={fieldStyle} min={0} />
            </div>
          </div>

          {/* 첨부파일 업로드 */}
          <div style={groupStyle}>
            <label style={labelStyle}>첨부파일 (지원서, 공고문 등)</label>

            {/* 현재 파일이 있을 때 */}
            {form.applicationFileUrl ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
                background: "#f8f9fb",
              }}>
                <span style={{ fontSize: 18 }}>
                  {/\.(jpg|jpeg|png|webp|gif)$/i.test(form.applicationFileUrl) ? "🖼️" : "📄"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {form.applicationFileName || form.applicationFileUrl.split("/").pop()}
                  </div>
                  <a href={form.applicationFileUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#1a3a6b", textDecoration: "none" }}>
                    미리보기 / 다운로드 ↗
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => { set("applicationFileUrl", ""); set("applicationFileName", ""); }}
                  style={{ ...outlineBtnStyle(COLORS.danger), fontSize: 12, padding: "4px 10px" }}
                >
                  삭제
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ ...outlineBtnStyle(), fontSize: 12, padding: "4px 10px" }}
                >
                  교체
                </button>
              </div>
            ) : (
              /* 드래그 앤 드롭 + 클릭 업로드 영역 */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#1a3a6b" : COLORS.border}`,
                  borderRadius: 8,
                  padding: "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "rgba(26,58,107,0.04)" : "#fafafa",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {uploading ? "⏳" : "📎"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                  {uploading ? "업로드 중..." : "파일을 드래그하거나 클릭해서 선택"}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  PDF, JPG, PNG, HWP, DOCX · 최대 20MB
                </div>
              </div>
            )}

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.hwp,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
            />
          </div>

          {/* 수동 URL 입력 (선택) */}
          <div style={{ ...groupStyle, marginTop: -8 }}>
            <label style={{ ...labelStyle, color: COLORS.textMuted, fontWeight: 400 }}>
              또는 외부 URL 직접 입력 (선택)
            </label>
            <input
              value={form.applicationFileUrl || ""}
              onChange={(e) => set("applicationFileUrl", e.target.value)}
              placeholder="https://..."
              style={{ ...fieldStyle, fontSize: 12 }}
            />
            {form.applicationFileUrl && (
              <input
                value={form.applicationFileName || ""}
                onChange={(e) => set("applicationFileName", e.target.value)}
                placeholder="파일명 표시 (예: 하이로_지원서.pdf)"
                style={{ ...fieldStyle, fontSize: 12, marginTop: 6 }}
              />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="isPublished" style={{ fontSize: 13, color: COLORS.text, cursor: "pointer" }}>공개 (채용 페이지에 노출)</label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} style={outlineBtnStyle()}>취소</button>
            <button type="submit" disabled={saving} style={{ ...outlineBtnStyle("#1a3a6b"), background: "#1a3a6b", color: "#fff" }}>
              {saving ? "저장 중..." : (isEdit ? "수정 완료" : "공고 등록")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRecruit() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalPost, setModalPost] = useState(null); // null=닫힘, {}=새공고, {...}=수정
  const [modalOpen, setModalOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruit?all=true");
      setPosts(res.data || []);
    } catch (err) {
      showToast("채용 공고 로드 실패: " + err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleNew = () => { setModalPost({}); setModalOpen(true); };
  const handleEdit = (post) => { setModalPost(post); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setModalPost(null); };
  const handleSaved = () => { handleClose(); loadPosts(); };

  const handleDelete = async (post) => {
    if (!window.confirm(`"${post.title}" 공고를 삭제할까요?`)) return;
    try {
      await api.delete(`/recruit/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      showToast("삭제되었습니다.", "success");
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  const filtered = posts.filter((p) => {
    if (filterCat && p.category !== filterCat) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const stats = CATEGORY_OPTIONS.reduce((acc, o) => {
    acc[o.value] = posts.filter((p) => p.category === o.value).length;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="채용 공고 관리" subtitle={`전체 ${posts.length}개`}>
        <button onClick={handleNew} style={{ ...outlineBtnStyle("#1a3a6b"), background: "#1a3a6b", color: "#fff" }}>
          + 새 공고 등록
        </button>
      </PageHeader>

      {/* 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 12, marginBottom: 18 }}>
        {CATEGORY_OPTIONS.map((o) => (
          <div key={o.value} style={{ padding: "14px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: "#fff" }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>{o.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>{stats[o.value] || 0}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 8, background: "#fff" }}>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...fieldStyle, flex: 1 }}>
          <option value="">전체 분류</option>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...fieldStyle, flex: 1 }}>
          <option value="">전체 상태</option>
          <option value="open">모집 중</option>
          <option value="closed">마감</option>
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <p style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>채용 공고 조회 중...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" message="등록된 채용 공고가 없습니다." />
      ) : (
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.bgForm, borderBottom: `1px solid ${COLORS.border}` }}>
                {["분류", "공고 제목", "마감일", "상태", "공개", "등록일", "관리"].map((h, i) => (
                  <th key={h} style={{ ...thStyle, textAlign: i === 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((post, idx) => {
                const catMeta = CATEGORY_META[post.category] || {};
                const statusMeta = STATUS_META[post.status] || {};
                return (
                  <tr key={post.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}`, background: idx % 2 === 0 ? "transparent" : COLORS.bgInactive }}>
                    <td style={tdStyle}>
                      <span style={badgeStyle(catMeta.color || "#1a3a6b")}>{catMeta.label || post.category}</span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 320 }}>
                      <div style={{ fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                      {post.applicationFileName && (
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>📎 {post.applicationFileName}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 12 }}>
                      {post.applicationDeadline || "-"}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.border}` }}>
                        {statusMeta.label || post.status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ fontSize: 16 }}>{post.isPublished ? "✅" : "⬜"}</span>
                    </td>
                    <td style={{ ...tdStyle, color: COLORS.textMuted, fontSize: 11 }}>{formatDate(post.createdAt)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <button onClick={() => handleEdit(post)} style={outlineBtnStyle()}>편집</button>
                        <button onClick={() => handleDelete(post)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PostModal post={modalPost} onClose={handleClose} onSaved={handleSaved} />
      )}
    </div>
  );
}
