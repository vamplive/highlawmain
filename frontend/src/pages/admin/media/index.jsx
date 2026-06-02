/** 관리자 미디어 관리 — 파일 업로드, 폴더 관리, 검색, 미리보기 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../../utils/api";
import { PageHeader, EmptyState, Pagination } from "../../../components/admin";
import { COLORS, fieldStyle } from "../../../components/admin/styles";
import { showToast } from "../../../utils/showToast";
import { COPY_FEEDBACK_MS } from "../../../utils/timing";
import MediaGrid from "./MediaGrid";
import MediaDetailModal from "./MediaDetailModal";
import MediaUpload from "./MediaUpload";

/* ── 도메인 상수 ── */
const PAGE_LIMIT = 20;
const TYPE_FILTERS = [
  { key: "", label: "전체" },
  { key: "image", label: "이미지" },
  { key: "video", label: "영상" },
  { key: "document", label: "문서" },
];

/** 폴더 사이드바 버튼 */
function FolderItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
        fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
        background: active ? COLORS.accent + "18" : "transparent",
        color: active ? COLORS.accent : COLORS.text,
        fontWeight: active ? 600 : 400,
        borderLeft: active ? `3px solid ${COLORS.accent}` : "3px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

export default function AdminMedia() {
  /* ── 상태 ── */
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedFolder, setSelectedFolder] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailAlt, setDetailAlt] = useState("");
  const [detailFolder, setDetailFolder] = useState("");
  const [copied, setCopied] = useState(false);

  const dragCounter = useRef(0);

  /* ── 데이터 로드 ── */
  const loadFiles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
    if (selectedFolder) params.set("folder", selectedFolder);
    if (typeFilter) params.set("type", typeFilter);
    if (search.trim()) params.set("search", search.trim());

    api.get(`/media?${params}`)
      .then((json) => {
        setFiles(json.data ?? []);
        setTotalPages(json.meta?.totalPages ?? 1);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [page, selectedFolder, typeFilter, search]);

  const loadFolders = () => {
    api.get("/media/folders")
      .then((json) => setFolders(json.data ?? []))
      .catch(() => setFolders([]));
  };

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  const changeFolder = (f) => { setSelectedFolder(f); setPage(1); };
  const changeType = (t) => { setTypeFilter(t); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  /* ── 파일 업로드 ── */
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedFolder) formData.append("folder", selectedFolder);
      // 인증은 HttpOnly 쿠키로 자동 전송, CSRF만 헤더로 추가
      const headers = {};
      const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
      if (csrfMatch) headers["x-csrf-token"] = decodeURIComponent(csrfMatch[1]);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드 실패");
      loadFiles();
      loadFolders();
    } catch (err) {
      showToast("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  /* ── 드래그 앤 드롭 ── */
  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current <= 0) { setDragging(false); dragCounter.current = 0; } };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  /* ── 상세 모달 ── */
  const openDetail = (file) => {
    setDetail(file);
    setDetailAlt(file.alt || "");
    setDetailFolder(file.folder || "");
    setCopied(false);
  };

  const saveDetail = async () => {
    if (!detail) return;
    try {
      await api.patch(`/media/${detail.id}`, { alt: detailAlt, folder: detailFolder });
      loadFiles();
      loadFolders();
      setDetail((prev) => ({ ...prev, alt: detailAlt, folder: detailFolder }));
    } catch (err) {
      showToast("수정 실패: " + err.message);
    }
  };

  const deleteFile = async () => {
    if (!detail) return;
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/media/${detail.id}`);
      setDetail(null);
      loadFiles();
      loadFolders();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  const copyUrl = () => {
    if (!detail?.url) return;
    navigator.clipboard.writeText(detail.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
  };

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 64px)" }}>
      {/* 폴더 사이드바 */}
      <aside style={{
        width: 200, minWidth: 200, background: COLORS.bgForm, borderRight: `1px solid ${COLORS.border}`,
        padding: "20px 0", display: "flex", flexDirection: "column",
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, padding: "0 16px", margin: "0 0 12px", letterSpacing: 1, textTransform: "uppercase" }}>
          폴더
        </h3>
        <FolderItem label="전체" active={selectedFolder === ""} onClick={() => changeFolder("")} />
        {folders.map((f) => (
          <FolderItem key={f} label={f} active={selectedFolder === f} onClick={() => changeFolder(f)} />
        ))}
      </aside>

      {/* 메인 영역 */}
      <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <PageHeader title="미디어 관리" />

        <MediaUpload
          dragging={dragging}
          uploading={uploading}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onFilePick={handleFilePick}
        />

        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {TYPE_FILTERS.map((tf) => (
              <button
                key={tf.key}
                onClick={() => changeType(tf.key)}
                style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: 500, borderRadius: 4,
                  border: `1px solid ${typeFilter === tf.key ? COLORS.accent : COLORS.border}`,
                  background: typeFilter === tf.key ? COLORS.accent : "#fff",
                  color: typeFilter === tf.key ? "#fff" : COLORS.textSecondary,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="파일명 검색..."
            value={search}
            onChange={handleSearch}
            style={{ ...fieldStyle, width: 240, fontSize: 13 }}
          />
        </div>

        {/* 파일 그리드 */}
        {loading ? (
          <p style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>불러오는 중...</p>
        ) : files.length === 0 ? (
          <EmptyState icon="\u{1F4C2}" message="파일이 없습니다" />
        ) : (
          <MediaGrid files={files} onSelect={openDetail} />
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      {/* 상세 모달 */}
      {detail && (
        <MediaDetailModal
          detail={detail}
          detailAlt={detailAlt}
          detailFolder={detailFolder}
          copied={copied}
          onAltChange={setDetailAlt}
          onFolderChange={setDetailFolder}
          onSave={saveDetail}
          onDelete={deleteFile}
          onCopy={copyUrl}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
