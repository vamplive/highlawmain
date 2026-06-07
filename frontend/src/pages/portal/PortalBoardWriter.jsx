/**
 * PortalBoardWriter — 게시판 글쓰기/수정 전체화면 에디터
 * /portal/board/write      → 신규 게시글
 * /portal/board/write/:id  → 기존 게시글 수정
 *
 * BlogSimpleShell과 동일한 전체화면 편집 경험을 게시판에 제공한다.
 * 좌측 메인: 제목 + 리치 텍스트 에디터  /  우측 패널: 카테고리·중요·필독 설정
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { portalApi, api } from "../../utils/api";
import PortalRichTextEditor from "./PortalRichTextEditor";
import useMediaQuery from "../../hooks/useMediaQuery";
import { ChevronLeft, Save, AlertCircle, Sparkles } from "lucide-react";

const AI_TONES = [
  { value: "professional", label: "전문적" },
  { value: "friendly", label: "친근한" },
  { value: "formal", label: "격식체" },
];

export default function PortalBoardWriter() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isEditing = Boolean(postId);

  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const urlCategory = searchParams.get("category") || "";

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState(urlCategory || "free");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsImportant, setFormIsImportant] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLoading, setAiLoading] = useState(false);

  // 카테고리 목록 + 관리자 여부 조회
  useEffect(() => {
    portalApi.get("/board-categories").then((res) => {
      const list = res.data || [];
      setCategories(list);
      // 신규 작성 시 "free" 카테고리가 없으면 첫 번째 카테고리로 초기화
      if (!isEditing && list.length > 0) {
        const hasFree = list.find((c) => c.key === "free");
        if (!hasFree) setFormCategory((prev) => (prev === "free" ? list[0].key : prev));
      }
    }).catch(() => {});

    portalApi.get("/lawyers/admin/check").then((res) => {
      setIsAdmin(res.data?.isAdmin || false);
    }).catch(() => {});
  }, [isEditing]);

  // 수정 모드: location.state로 전달된 데이터 또는 API 조회
  useEffect(() => {
    if (!isEditing) return;

    const statePost = location.state?.post;
    if (statePost) {
      setFormTitle(statePost.title || "");
      setFormContent(statePost.content || "");
      setFormCategory(statePost.category || "free");
      setFormIsPinned(statePost.isPinned === 1);
      setFormIsImportant(statePost.isImportant === 1);
      return;
    }

    // location.state가 없으면 API로 조회
    portalApi.get(`/posts/${postId}`).then((res) => {
      const post = res.data?.data;
      if (!post) { setLoadError("게시글을 찾을 수 없습니다."); return; }
      setFormTitle(post.title || "");
      setFormContent(post.content || "");
      setFormCategory(post.category || "free");
      setFormIsPinned(post.isPinned === 1);
      setFormIsImportant(post.isImportant === 1);
    }).catch(() => setLoadError("게시글을 불러오지 못했습니다."));
  }, [isEditing, postId, location.state]);

  const handleAiWrite = async () => {
    if (!formTitle.trim()) { alert("AI 글쓰기에 사용할 제목을 먼저 입력해주세요."); return; }
    setAiLoading(true);
    try {
      const res = await api.post("/media/generate-blog-text", { topic: formTitle, tone: aiTone });
      const { body } = res.data || {};
      if (body) setFormContent(body);
    } catch (e) {
      alert(e.message || "AI 글쓰기에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { alert("제목을 입력해주세요."); return; }
    if (!formContent.trim()) { alert("내용을 입력해주세요."); return; }

    const payload = {
      category: formCategory,
      title: formTitle,
      content: formContent,
      isPinned: formIsPinned,
      isImportant: formIsImportant,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await portalApi.put(`/posts/${postId}`, payload);
      } else {
        await portalApi.post("/posts", payload);
      }
      navigate("/portal/board");
    } catch (e) {
      alert(e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (key) => {
    return categories.find((c) => c.key === key)?.label || key || "자유게시판";
  };

  if (loadError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
        <AlertCircle size={40} style={{ color: "#ef4444" }} />
        <p style={{ color: "#475569", fontSize: 15 }}>{loadError}</p>
        <button onClick={() => navigate("/portal/board")} style={backBtnStyle}>
          게시판으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "calc(100vh - 120px)", background: "#f8fafc" }}>
      {/* 상단 바 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56, background: "#ffffff",
        borderBottom: "1px solid #e2e8f0", flexShrink: 0,
      }}>
        <button onClick={() => navigate("/portal/board")} style={backBtnStyle}>
          <ChevronLeft size={18} />
          {isMobile ? "게시판" : "게시판으로 돌아가기"}
        </button>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {isEditing ? "게시글 수정" : "새 게시글 작성"}
        </h2>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: saving ? "#a78bfa" : "#8b5cf6",
            color: "#ffffff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 13, fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(139,92,246,0.2)",
          }}
        >
          <Save size={15} />
          {saving ? "저장 중..." : (isEditing ? "수정 완료" : "게시하기")}
        </button>
      </div>

      {/* 본문 영역 */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 240px",
        gap: 0,
        overflow: "hidden",
      }}>
        {/* 좌측: 제목 + 에디터 */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "#ffffff",
          borderRight: isMobile ? "none" : "1px solid #e2e8f0",
          overflow: "auto",
          padding: isMobile ? "20px 16px" : "28px 40px",
        }}>
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            style={{
              width: "100%", fontSize: 22, fontWeight: 700,
              color: "#0f172a", border: "none", outline: "none",
              padding: "0 0 16px", borderBottom: "2px solid #e2e8f0",
              marginBottom: 20, background: "transparent",
              fontFamily: "inherit",
            }}
          />

          <div style={{ flex: 1, minHeight: isMobile ? 320 : 480 }}>
            <PortalRichTextEditor
              value={formContent}
              onChange={setFormContent}
              placeholder="내용을 작성해 주세요..."
              minHeight={isMobile ? 320 : 480}
            />
          </div>
        </div>

        {/* 우측: 메타데이터 설정 패널 */}
        <div style={{
          background: "#f8fafc",
          padding: "24px 20px",
          borderTop: isMobile ? "1px solid #e2e8f0" : "none",
          overflowY: "auto",
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
            게시글 설정
          </p>

          {/* AI 글쓰기 */}
          <div style={{ marginBottom: 24, padding: "14px", background: "#faf5ff", borderRadius: 8, border: "1px solid #e9d5ff" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={13} /> AI 글쓰기
            </p>
            <label style={metaLabelStyle}>문체</label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              style={{ ...metaSelectStyle, marginBottom: 10 }}
            >
              {AI_TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button
              onClick={handleAiWrite}
              disabled={aiLoading}
              style={{
                width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: aiLoading ? "#a78bfa" : "#7c3aed",
                color: "#fff", border: "none", borderRadius: 7,
                cursor: aiLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Sparkles size={14} />
              {aiLoading ? "생성 중..." : "AI로 본문 생성"}
            </button>
            <p style={{ fontSize: 10, color: "#a78bfa", margin: "6px 0 0", lineHeight: 1.5 }}>
              제목을 주제로 AI가 본문을 작성합니다. 기존 본문은 대체됩니다.
            </p>
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom: 20 }}>
            <label style={metaLabelStyle}>게시판</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              style={metaSelectStyle}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
            {formCategory && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#8b5cf6", fontWeight: 500 }}>
                {getCategoryLabel(formCategory)}에 게시됩니다
              </div>
            )}
          </div>

          {/* 중요 표시 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...metaLabelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formIsImportant}
                onChange={(e) => setFormIsImportant(e.target.checked)}
                style={{ accentColor: "#f59e0b", width: 15, height: 15 }}
              />
              <span>⭐ 중요 표시</span>
            </label>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 23px" }}>
              목록에서 중요 표시로 강조됩니다
            </p>
          </div>

          {/* 필독 고정 (관리자 전용) */}
          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...metaLabelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  style={{ accentColor: "#ef4444", width: 15, height: 15 }}
                />
                <span>📌 상단 필독 고정</span>
              </label>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 23px" }}>
                목록 최상단에 고정됩니다 (관리자)
              </p>
            </div>
          )}

          <div style={{ marginTop: 32, padding: "14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <p style={{ fontSize: 11, color: "#1d4ed8", margin: 0, lineHeight: 1.6 }}>
              ✏️ 작성한 게시글은 포털 구성원 모두에게 공개됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 4,
  background: "transparent", border: "1px solid #e2e8f0",
  borderRadius: 6, padding: "6px 12px", fontSize: 13,
  color: "#475569", cursor: "pointer", fontWeight: 500,
};

const metaLabelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#475569", marginBottom: 6,
};

const metaSelectStyle = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "1px solid #cbd5e1", borderRadius: 6,
  background: "#ffffff", color: "#0f172a", outline: "none",
};
