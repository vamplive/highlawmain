import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Save } from "lucide-react";
import { portalApi } from "../../utils/api";
import BoardRichEditor from "../../components/BoardRichEditor";

const fieldStyle = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: "#0f172a",
};

export default function PortalBoardWriter() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const isEditing = Boolean(postId);

  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formCategory, setFormCategory] = useState("free");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAttachments, setFormAttachments] = useState([]);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsImportant, setFormIsImportant] = useState(false);

  useEffect(() => {
    portalApi.get("/lawyers/admin/check").then((res) => {
      setIsAdmin(res.data?.isAdmin || false);
    }).catch(() => {});

    portalApi.get("/board-categories").then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});

    if (isEditing) {
      portalApi.get(`/posts/${postId}`).then((res) => {
        const post = res.data?.data;
        if (!post) return;
        setFormCategory(post.category || "free");
        setFormTitle(post.title || "");
        setFormContent(post.content || "");
        setFormAttachments(post.attachments
          ? (typeof post.attachments === "string" ? JSON.parse(post.attachments) : post.attachments)
          : []);
        setFormIsPinned(post.isPinned === 1);
        setFormIsImportant(post.isImportant === 1);
      }).catch(() => alert("게시글을 불러올 수 없습니다."));
    }
  }, [isEditing, postId]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formTitle.trim()) return alert("제목을 입력해주세요.");
    const textOnly = formContent.replace(/<[^>]*>/g, "").trim();
    if (!textOnly && !formContent.includes("<img")) return alert("내용을 입력해주세요.");

    const payload = {
      category: formCategory,
      title: formTitle,
      content: formContent,
      attachments: JSON.stringify(formAttachments),
      isPinned: formIsPinned,
      isImportant: formIsImportant,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await portalApi.put(`/posts/${postId}`, payload);
        alert("게시글이 수정되었습니다.");
      } else {
        await portalApi.post("/posts", payload);
        alert("게시글이 등록되었습니다.");
      }
      navigate("/portal/board");
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* 상단 바 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          type="button"
          onClick={() => navigate("/portal/board")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, color: "#64748b", padding: "6px 0",
          }}
        >
          <ArrowLeft size={16} /> 게시판으로
        </button>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {isEditing ? "게시글 수정" : "새 게시글 작성"}
        </h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate("/portal/board")}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 500,
              background: "#fff", color: "#475569", border: "1px solid #cbd5e1",
              borderRadius: 6, cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 22px", fontSize: 13, fontWeight: 700,
              background: saving ? "#a78bfa" : "#8b5cf6", color: "#fff",
              border: "none", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Save size={14} />
            {saving ? "저장 중..." : (isEditing ? "수정 완료" : "등록")}
          </button>
        </div>
      </div>

      {/* 본문 영역 */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {/* 제목 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>제목</label>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            style={{ ...fieldStyle, fontSize: 18, fontWeight: 600, padding: "12px 14px" }}
          />
        </div>

        {/* 카테고리 + 옵션 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>게시판</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={fieldStyle}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, paddingBottom: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formIsImportant}
                onChange={(e) => setFormIsImportant(e.target.checked)}
              />
              <Star size={14} style={{ color: "#f59e0b", fill: formIsImportant ? "#f59e0b" : "transparent" }} />
              중요 표시
            </label>
            {isAdmin && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                />
                상단 필독 고정
              </label>
            )}
          </div>
        </div>

        {/* 리치 에디터 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>본문</label>
          <BoardRichEditor
            value={formContent}
            onChange={setFormContent}
            placeholder="내용을 작성해 주세요..."
            attachments={formAttachments}
            onAttachmentsChange={setFormAttachments}
          />
        </div>
      </div>
    </div>
  );
}
