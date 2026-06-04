/**
 * 관리자 — 포털 게시판 관리
 * 게시판 카테고리 관리 + 게시글 관리 (편집/삭제)
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const S = {
  accent: "#c9a84c", text: "#0b1f3a", textSec: "#4a5568",
  textMuted: "#8a97a8", border: "rgba(11,31,58,0.10)", card: "#fff",
};

const BOARD_CATEGORIES = [
  { key: "notice",   label: "공지사항" },
  { key: "manual",   label: "업무 매뉴얼" },
  { key: "free",     label: "자유게시판" },
  { key: "template", label: "양식" },
];

export default function AdminPortalBoardAdmin() {
  const [tab, setTab] = useState("notice");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => { loadPosts(); }, [tab]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/portal/admin/board?category=${tab}&limit=50`);
      setPosts(res.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/portal/admin/board/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const pinPost = async (id, isPinned) => {
    try {
      await api.patch(`/portal/admin/board/${id}`, { isPinned: !isPinned });
      await loadPosts();
    } catch {
      alert("변경에 실패했습니다.");
    }
  };

  const tabStyle = (active) => ({
    padding: "8px 18px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? S.accent : S.textSec,
    background: active ? "rgba(201,168,76,0.08)" : "transparent",
    border: "none", borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 4 }}>게시판 관리</h1>
        <p style={{ fontSize: 13, color: S.textSec }}>포털 인트라넷 게시판의 게시글을 관리합니다.</p>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, marginBottom: 24 }}>
        {BOARD_CATEGORIES.map(c => (
          <button key={c.key} style={tabStyle(tab === c.key)} onClick={() => setTab(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: S.textMuted, padding: 40, textAlign: "center" }}>로딩 중...</p>
      ) : (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f8f8" }}>
                {["제목", "작성자", "작성일", "필독", "관리"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: S.textSec, borderBottom: `1px solid ${S.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: S.textMuted }}>게시글이 없습니다</td>
                </tr>
              ) : posts.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < posts.length - 1 ? `1px solid ${S.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: S.textSec }}>{p.authorName || p.authorEmail || "-"}</td>
                  <td style={{ padding: "12px 16px", color: S.textMuted }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString("ko-KR") : "-"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => pinPost(p.id, p.isPinned)}
                      style={{
                        padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 4,
                        border: `1px solid ${p.isPinned ? S.accent : S.border}`,
                        background: p.isPinned ? "rgba(201,168,76,0.10)" : "transparent",
                        color: p.isPinned ? S.accent : S.textMuted, cursor: "pointer",
                      }}
                    >
                      {p.isPinned ? "✓ 필독" : "일반"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setEditingPost(p)}
                        style={{ padding: "4px 10px", fontSize: 11, border: `1px solid ${S.border}`, borderRadius: 4, background: "transparent", cursor: "pointer", color: S.textSec }}
                      >편집</button>
                      <button
                        onClick={() => deletePost(p.id)}
                        style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #ffcdd2", borderRadius: 4, background: "transparent", cursor: "pointer", color: "#c62828" }}
                      >삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 편집 모달 */}
      {editingPost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 560, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text }}>게시글 편집</h3>
              <button onClick={() => setEditingPost(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: S.textMuted }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: S.textSec, display: "block", marginBottom: 6 }}>제목</label>
              <input
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                value={editingPost.title}
                onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: S.textSec, display: "block", marginBottom: 6 }}>내용</label>
              <textarea
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${S.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box", minHeight: 180, resize: "vertical" }}
                value={editingPost.content || ""}
                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingPost(null)} style={{ padding: "9px 20px", fontSize: 13, border: `1px solid ${S.border}`, borderRadius: 6, background: "transparent", cursor: "pointer", color: S.textSec }}>취소</button>
              <button
                onClick={async () => {
                  try {
                    await api.patch(`/portal/admin/board/${editingPost.id}`, { title: editingPost.title, content: editingPost.content });
                    setEditingPost(null);
                    loadPosts();
                  } catch { alert("저장에 실패했습니다."); }
                }}
                style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 6, background: S.accent, color: "#fff", cursor: "pointer" }}
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
