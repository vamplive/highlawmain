/** 포털 블로그 목록 — 카테고리 탭 + 공개 API 사용 (포털 세션만으로 작동) */
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { portalApi } from "../../utils/api";
import { Plus, Edit, Eye, Tag, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { key: "",                    label: "전체 블로그" },
  { key: "construction_realestate", label: "하이로 뉴스" },
  { key: "case_analysis",       label: "판례 분석" },
  { key: "law_guide",           label: "법률 가이드" },
];

const PAGE_SIZE = 20;

function formatDate(val) {
  if (!val) return "-";
  const d = new Date(String(val).replace(" ", "T"));
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ post }) {
  if (post.isPublished) {
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 700 }}>발행</span>;
  }
  const isScheduled = post.scheduledPublishAt && new Date(String(post.scheduledPublishAt).replace(" ", "T")) > new Date();
  if (isScheduled) {
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd", fontWeight: 700 }}>예약</span>;
  }
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontWeight: 700 }}>초안</span>;
}

export default function PortalBlog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    portalApi.get("/lawyers/admin/check")
      .then((res) => setIsAdmin(res.data?.isAdmin || false))
      .catch(() => {});
  }, []);

  const handleDelete = async (post) => {
    if (!window.confirm(`"${post.title || '이 게시글'}"을(를) 삭제하시겠습니까?\n\n삭제된 게시글은 복구할 수 없습니다.`)) return;
    setDeletingId(post.id);
    try {
      await portalApi.delete(`/blog/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      window.alert('삭제 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setDeletingId(null);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: PAGE_SIZE });
      if (activeCategory) params.set("category", activeCategory);

      // 항상 공개 API 사용 (portal_session으로는 admin API 호출 불가)
      const res = await fetch(`/api/blog?${params}`).then((r) => r.json());
      setPosts(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, currentPage]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const setCategory = (key) => {
    setSearchParams(key ? { category: key } : {}, { replace: true });
  };

  const setPage = (p) => {
    const next = { page: p };
    if (activeCategory) next.category = activeCategory;
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>블로그 관리</h2>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              to="/portal/editor"
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#475569", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 6, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              에디터 열기
            </Link>
            <Link
              to="/portal/editor?mode=blog"
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#fff", background: "#1a3a6b", border: "none", borderRadius: 6, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} /> 새 블로그 작성
            </Link>
          </div>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e2e8f0", marginBottom: 20, overflowX: "auto" }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: active ? 700 : 400,
                color: active ? "#1a3a6b" : "#64748b",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: active ? "2px solid #1a3a6b" : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>불러오는 중...</p>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
          <p style={{ fontSize: 14 }}>게시글이 없습니다.</p>
          {isAdmin && (
            <Link to="/portal/editor?mode=blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13, color: "#1a3a6b", textDecoration: "none", fontWeight: 600 }}>
              <Plus size={14} /> 첫 글 작성하기
            </Link>
          )}
        </div>
      ) : (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569" }}>분류</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569" }}>제목</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569" }}>상태</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569" }}>발행일</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#475569" }}>조회</th>
                {isAdmin && <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#475569" }}>관리</th>}
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => {
                const catLabel = CATEGORIES.find((c) => c.key === post.category)?.label || "기타";
                return (
                  <tr key={post.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                        {catLabel}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 360 }}>
                      {isAdmin ? (
                        <Link to={`/portal/editor/blog:${post.id}`} style={{ fontWeight: 600, color: "#1a1a1a", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.title || "제목 없음"}
                        </Link>
                      ) : (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "#1a1a1a", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.title || "제목 없음"}
                        </a>
                      )}
                      {post.excerpt && (
                        <div style={{ marginTop: 3, color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <StatusBadge post={post} />
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {formatDate(post.scheduledPublishAt || post.publishedAt || post.createdAt)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569" }}>
                      {post.viewCount ?? 0}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Link to={`/portal/editor/blog:${post.id}`} style={{ padding: "3px 10px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 4, color: "#475569", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, background: "#fff" }}>
                            <Edit size={12} /> 편집
                          </Link>
                          {post.slug && post.isPublished && (
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={{ padding: "3px 10px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 4, color: "#475569", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, background: "#fff" }}>
                              <Eye size={12} /> 보기
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(post)}
                            disabled={deletingId === post.id}
                            style={{ padding: "3px 10px", fontSize: 12, border: "1px solid #fca5a5", borderRadius: 4, color: "#ef4444", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, opacity: deletingId === post.id ? 0.5 : 1 }}
                          >
                            {deletingId === post.id ? "삭제 중..." : "삭제"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 4,
                background: p === currentPage ? "#1a3a6b" : "#fff",
                color: p === currentPage ? "#fff" : "#475569",
                cursor: "pointer", fontWeight: p === currentPage ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
