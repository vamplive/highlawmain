import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { 
  Plus, Search, Star, MessageSquare, Eye, Calendar, 
  Trash2, Edit, AlertCircle, FileText, ChevronLeft, ChevronRight, CheckSquare, Square
} from "lucide-react";

export default function PortalBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL 상태 추출
  const activeCategory = searchParams.get("category") || "";
  const activeFilter = searchParams.get("filter") || "";
  const urlSearch = searchParams.get("search") || "";
  const shouldOpenWrite = searchParams.get("write") === "true";

  // 데이터 상태
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);

  // 게시판 추가 모달
  const [showCatModal, setShowCatModal] = useState(false);
  const [catKey, setCatKey] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [catColor, setCatColor] = useState("#64748b");

  // 모달 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 글쓰기/수정 폼 폼상태
  const [formCategory, setFormCategory] = useState("free");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [editPostId, setEditPostId] = useState(null);

  // 로컬 검색어
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  // 1. 초기 정보 및 어드민 여부 확인
  useEffect(() => {
    portalApi.get("/me").then((res) => {
      setCurrentUser(res.data?.user || null);
    });
    portalApi.get("/lawyers/admin/check").then((res) => {
      setIsAdmin(res.data?.isAdmin || false);
    });
    portalApi.get("/board-categories").then((res) => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  // 2. 게시글 목록 불러오기 (URL 파라미터 변경 시 트리거)
  useEffect(() => {
    fetchPosts();
  }, [activeCategory, activeFilter, urlSearch, page]);

  // 3. URL에 write=true가 오면 글쓰기 모달 열기
  useEffect(() => {
    if (shouldOpenWrite) {
      openCreateForm();
    }
  }, [shouldOpenWrite]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (activeCategory) params.category = activeCategory;
      if (urlSearch) params.search = urlSearch;
      
      // 사이드바 필터 쿼리 설정
      if (activeFilter === "pinned") params.pinnedOnly = "true";
      
      const res = await portalApi.get("/posts", { params });
      
      // 프론트엔드 레벨 필터링 (필요 시)
      let list = res.data?.data || [];
      if (activeFilter === "important") {
        list = list.filter(p => p.isImportant === 1);
      } else if (activeFilter === "mine" && currentUser) {
        list = list.filter(p => p.portalUserId === currentUser.id);
      }
      
      setPosts(list);
      setMeta(res.data?.meta || { page: 1, limit: 10, totalPages: 1 });
    } catch (e) {
      console.error("[PortalBoard] 게시글 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetail = async (id) => {
    try {
      const res = await portalApi.get(`/posts/${id}`);
      setSelectedPost(res.data?.data);
      setShowDetailModal(true);
      
      // 조회수 즉시 반영
      setPosts(prev => prev.map(p => p.id === id ? { ...p, viewCount: p.viewCount + 1 } : p));
    } catch (e) {
      alert("게시글을 불러올 수 없습니다.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      search: searchQuery.trim(),
      page: 1
    });
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setEditPostId(null);
    setFormCategory(activeCategory || "free");
    setFormTitle("");
    setFormContent("");
    setFormIsPinned(false);
    setFormIsImportant(false);
    setShowWriteModal(true);
    
    // URL에서 write 파라미터 제거
    if (searchParams.get("write")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("write");
      setSearchParams(nextParams);
    }
  };

  const openEditForm = (post) => {
    setIsEditing(true);
    setEditPostId(post.id);
    setFormCategory(post.category);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormIsPinned(post.isPinned === 1);
    setFormIsImportant(post.isImportant === 1);
    setShowDetailModal(false);
    setShowWriteModal(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return alert("제목을 입력해주세요.");
    if (!formContent.trim()) return alert("내용을 입력해주세요.");

    const payload = {
      category: formCategory,
      title: formTitle,
      content: formContent,
      isPinned: formIsPinned,
      isImportant: formIsImportant
    };

    try {
      if (isEditing) {
        await portalApi.put(`/posts/${editPostId}`, payload);
        alert("게시글이 수정되었습니다.");
      } else {
        await portalApi.post("/posts", payload);
        alert("게시글이 생성되었습니다.");
      }
      setShowWriteModal(false);
      fetchPosts();
    } catch (e) {
      alert(e.response?.data?.error || "게시글 저장에 실패했습니다.");
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/posts/${id}`);
      alert("게시글이 삭제되었습니다.");
      setShowDetailModal(false);
      fetchPosts();
    } catch (e) {
      alert("삭제 권한이 없거나 삭제에 실패했습니다.");
    }
  };

  const getCategoryLabel = (key) => {
    const cat = categories.find((c) => c.key === key);
    return cat?.label || key || "게시판";
  };

  const getCategoryColor = (key) => {
    const cat = categories.find((c) => c.key === key);
    return cat?.color || "#64748b";
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catKey.trim()) return alert("카테고리 키를 입력하세요");
    if (!catLabel.trim()) return alert("카테고리 이름을 입력하세요");
    try {
      await portalApi.post("/board-categories", { key: catKey.trim(), label: catLabel.trim(), color: catColor });
      const res = await portalApi.get("/board-categories");
      setCategories(res.data || []);
      setShowCatModal(false);
      setCatKey(""); setCatLabel(""); setCatColor("#64748b");
    } catch (err) {
      alert(err.message || "게시판 추가에 실패했습니다.");
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px 32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      {/* ==================== 1. 게시판 제목 및 상단 액션바 ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={22} style={{ color: "#8b5cf6" }} />
            {activeCategory ? getCategoryLabel(activeCategory) : "전체 게시글"}
            {activeFilter === "pinned" && " (필독)"}
            {activeFilter === "important" && " (중요)"}
            {activeFilter === "mine" && " (내 게시글)"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
            법무법인 하이로 임직원 및 의뢰인을 위한 인트라넷 내부 소통 공간입니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <button
              onClick={() => setShowCatModal(true)}
              style={{
                background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8,
                padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <Plus size={14} />
              게시판 추가
            </button>
          )}
          <button
            onClick={openCreateForm}
            style={{
              background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 4px rgba(139,92,246,0.2)",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#7c3aed"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#8b5cf6"}
          >
            <Plus size={16} />
            글쓰기
          </button>
        </div>
      </div>

      {/* ==================== 2. 상세 필터 및 검색바 ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#64748b" }}>
          <span>전체 <strong>{posts.length}</strong>건</span>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="이 게시판에서 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px", fontSize: 12.5, border: "1px solid #cbd5e1", borderRadius: 6,
              outline: "none", width: 220
            }}
          />
          <button
            type="submit"
            style={{
              background: "#475569", color: "#fff", border: "none", borderRadius: 6,
              padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer"
            }}
          >
            검색
          </button>
        </form>
      </div>

      {/* ==================== 3. 게시글 리스트 테이블 ==================== */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
              <th style={{ padding: "12px 8px", width: 80 }}>카테고리</th>
              <th style={{ padding: "12px 8px" }}>제목</th>
              <th style={{ padding: "12px 8px", width: 120 }}>작성자</th>
              <th style={{ padding: "12px 8px", width: 100 }}>등록일</th>
              <th style={{ padding: "12px 8px", width: 80, textAlign: "center" }}>조회수</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                  불러오는 중...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <AlertCircle size={36} style={{ color: "#cbd5e1" }} />
                    <span>등록된 게시글이 없습니다. 게시판에 공유할 글을 남겨보세요.</span>
                    <button
                      onClick={openCreateForm}
                      style={{
                        background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6,
                        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8
                      }}
                    >
                      글쓰기
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr 
                  key={post.id} 
                  style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                  onClick={() => fetchPostDetail(post.id)}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* 카테고리 */}
                  <td style={{ padding: "14px 8px" }}>
                    <span style={{ 
                      fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                      background: `${getCategoryColor(post.category)}15`, color: getCategoryColor(post.category)
                    }}>
                      {getCategoryLabel(post.category)}
                    </span>
                  </td>
                  {/* 제목 */}
                  <td style={{ padding: "14px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                    {post.isPinned === 1 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" }}>
                        필독
                      </span>
                    )}
                    {post.isImportant === 1 && (
                      <Star size={14} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                    )}
                    <span style={{ fontWeight: post.isPinned === 1 ? 600 : 500, color: "#1e293b" }}>
                      {post.title}
                    </span>
                  </td>
                  {/* 작성자 */}
                  <td style={{ padding: "14px 8px", color: "#64748b" }}>
                    {post.authorName || post.authorEmail?.split("@")[0] || "익명"}
                  </td>
                  {/* 등록일 */}
                  <td style={{ padding: "14px 8px", color: "#64748b" }}>
                    {post.createdAt ? post.createdAt.split(" ")[0] : "-"}
                  </td>
                  {/* 조회수 */}
                  <td style={{ padding: "14px 8px", color: "#94a3b8", textAlign: "center" }}>
                    {post.viewCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== 4. 페이지네이션 ==================== */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: "#475569" }}>
            {page} / {meta.totalPages}
          </span>
          <button
            disabled={page === meta.totalPages}
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", cursor: page === meta.totalPages ? "not-allowed" : "pointer", opacity: page === meta.totalPages ? 0.5 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ==================== 5. 상세 보기 모달 ==================== */}
      {showDetailModal && selectedPost && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 640,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto", position: "relative"
          }}>
            {/* 카테고리 표시 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ 
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                background: `${getCategoryColor(selectedPost.category)}15`, color: getCategoryColor(selectedPost.category)
              }}>
                {getCategoryLabel(selectedPost.category)}
              </span>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {/* 제목 */}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              {selectedPost.isPinned === 1 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2" }}>
                  필독
                </span>
              )}
              {selectedPost.title}
            </h3>

            {/* 작성자 메타 정보 */}
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
              <span>작성자: <strong>{selectedPost.authorName || "익명"}</strong> ({selectedPost.authorEmail})</span>
              <div style={{ width: 1, background: "#cbd5e1" }} />
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} /> {selectedPost.createdAt}</span>
              <div style={{ width: 1, background: "#cbd5e1" }} />
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /> {selectedPost.viewCount}</span>
            </div>

            {/* 내용 본문 */}
            <div style={{ 
              fontSize: 14.5, color: "#334155", lineHeight: 1.6, minHeight: 180,
              whiteSpace: "pre-wrap", background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 24 
            }}>
              {selectedPost.content}
            </div>

            {/* 컨트롤 버튼 */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                {(selectedPost.portalUserId === currentUser?.id || isAdmin) && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEditForm(selectedPost)}
                      style={{
                        background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6,
                        padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6
                      }}
                    >
                      <Edit size={14} />
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      style={{
                        background: "#fff", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 6,
                        padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6
                      }}
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: "#475569", color: "#fff", border: "none", borderRadius: 6,
                  padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer"
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. 게시판 추가 모달 (어드민 전용) ==================== */}
      {showCatModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1100, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleCreateCategory} style={{
            background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 400,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
              게시판 추가
            </h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>카테고리 키 (영문, 예: faq)</label>
              <input
                type="text"
                placeholder="영문 소문자와 하이픈만 사용"
                value={catKey}
                onChange={(e) => setCatKey(e.target.value.replace(/[^a-z0-9-_]/g, ""))}
                style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, boxSizing: "border-box" }}
                required
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>게시판 이름</label>
              <input
                type="text"
                placeholder="예: FAQ, 공지사항"
                value={catLabel}
                onChange={(e) => setCatLabel(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, boxSizing: "border-box" }}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>태그 색상</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  style={{ width: 40, height: 36, border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", padding: 2 }}
                />
                <span style={{ fontSize: 13, color: "#64748b" }}>{catColor}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${catColor}20`, color: catColor }}>미리보기</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => { setShowCatModal(false); setCatKey(""); setCatLabel(""); setCatColor("#64748b"); }}
                style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                추가
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 7. 글쓰기 및 수정 모달 ==================== */}
      {showWriteModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleSavePost} style={{
            background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 640,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
              {isEditing ? "게시글 수정" : "새 게시글 작성"}
            </h3>

            {/* 카테고리 선택 */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>게시판 카테고리</label>
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

            {/* 제목 입력 */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>제목</label>
              <input
                type="text"
                placeholder="제목을 입력하세요"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            {/* 중요 / 필독 체크박스 (어드민 또는 특정 권한 소유자만 필독 설정 허용) */}
            <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
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
                  <span>상단 필독 고정</span>
                </label>
              )}
            </div>

            {/* 내용 본문 */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>본문 내용</label>
              <textarea
                placeholder="내용을 작성해 주세요..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                style={{ ...fieldStyle, height: 240, resize: "vertical" }}
                required
              />
            </div>

            {/* 버튼들 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowWriteModal(false)}
                style={{
                  background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6,
                  padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer"
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(139,92,246,0.15)"
                }}
              >
                {isEditing ? "수정 완료" : "등록"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
