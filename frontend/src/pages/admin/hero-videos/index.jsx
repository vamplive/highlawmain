/**
 * AdminHeroVideos — 프리미엄 히어로 영상 관리 + 인라인 비디오 에디터
 * 메인 구성 컴포넌트: 상태 관리 + 하위 컴포넌트 조합
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  PageHeader, EmptyState, Pagination, COLORS,
} from "../../../components/admin";
import { PER_PAGE } from "./constants";
import ActiveVideoPreview from "./ActiveVideoPreview";
import FilterBar from "./FilterBar";
import VideoCard from "./VideoCard";
import VideoEditor from "./VideoEditor";
import VideoFormModal from "./VideoFormModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { showToast } from "../../../utils/showToast";

export default function AdminHeroVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", category: "manhattan" });
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editorVideo, setEditorVideo] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?category=${filter}` : "";
      const res = await api.get(`/hero-videos${q}`);
      setVideos(res.data || []);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) fetchVideos();
    });
    return () => { cancelled = true; };
  }, [fetchVideos]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setPage(1);
    });
    return () => { cancelled = true; };
  }, [filter, search]);

  // 검색 필터
  const filtered = search
    ? videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
    : videos;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeVideo = videos.find((v) => v.isActive);

  /* ── 핸들러 ── */
  const handleActivate = async (id) => {
    try {
      const res = await api.patch(`/hero-videos/${id}/activate`, {});
      if (res.data?.url) localStorage.setItem("activeHeroVideo", res.data.url);
      fetchVideos();
    } catch (err) {
      showToast("활성화 실패: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hero-videos/${id}`);
      setDeleteConfirm(null);
      fetchVideos();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm({ title: "", url: "", category: "manhattan" });
    setUploadMode(false);
    setShowForm(true);
  };

  const openEditForm = (v) => {
    setEditingId(v.id);
    setForm({ title: v.title, url: v.url, category: v.category });
    setUploadMode(false);
    setShowForm(true);
  };

  const handleSubmit = async (e, fileRef) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (uploadMode && fileRef?.current?.files[0]) {
        const fd = new FormData();
        fd.append("file", fileRef.current.files[0]);
        fd.append("title", form.title);
        fd.append("category", form.category);
        // 인증은 HttpOnly 쿠키로 자동 전송, CSRF만 헤더로 추가
        const headers = {};
        const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
        if (csrfMatch) headers["x-csrf-token"] = decodeURIComponent(csrfMatch[1]);
        await fetch("/api/hero-videos/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
          headers,
        });
      } else if (editingId) {
        await api.patch(`/hero-videos/${editingId}`, form);
      } else {
        await api.post("/hero-videos", form);
      }
      setShowForm(false);
      fetchVideos();
    } catch (err) {
      showToast("저장 실패: " + err.message);
    }
    setSaving(false);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <PageHeader title="히어로 영상" subtitle="MEDIA MANAGEMENT" onAdd={openNewForm} addLabel="+ 새 영상" />

      {activeVideo && (
        <ActiveVideoPreview
          video={activeVideo}
          totalCount={videos.length}
          categoryCount={[...new Set(videos.map((v) => v.category))].length}
        />
      )}

      <FilterBar filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>불러오는 중...</div>
      ) : paged.length === 0 ? (
        <EmptyState icon="🎬" message="영상이 없습니다" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {paged.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onActivate={handleActivate}
              onEdit={() => openEditForm(v)}
              onDelete={() => setDeleteConfirm(v.id)}
              onEditor={() => setEditorVideo(v)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {editorVideo && (
        <VideoEditor
          video={editorVideo}
          onClose={() => { setEditorVideo(null); fetchVideos(); }}
          onActivate={handleActivate}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {showForm && (
        <VideoFormModal
          editingId={editingId}
          form={form}
          setField={setField}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
