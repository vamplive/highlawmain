/**
 * MobileSidebarDrawer — DocListSidebar(좌측 문서 목록)를 모바일에서 드로어로 감싼다.
 * 백드롭 클릭 또는 ESC로 닫힘. body 스크롤 잠금.
 */
import { memo, useEffect } from "react";
import { DocListSidebar } from "../DocListSidebar";

export const MobileSidebarDrawer = memo(function MobileSidebarDrawer({
  open,
  onClose,
  documents,
  currentId,
  onSelect,
  onNew,
  onNewBlog,
  onDelete,
  search,
  setSearch,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  // 드로어가 열린 동안 사이드바는 항상 펼친 상태로 유지
  const noopSetCollapsed = () => {};

  return (
    <>
      <div
        className="editor-msidebar-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="editor-msidebar-drawer"
        role="dialog"
        aria-label="문서 목록"
      >
        <DocListSidebar
          documents={documents}
          currentId={currentId}
          onSelect={(id) => { onSelect?.(id); onClose?.(); }}
          onNew={() => { onNew?.(); onClose?.(); }}
          onNewBlog={() => { onNewBlog?.(); onClose?.(); }}
          onDelete={onDelete}
          search={search}
          setSearch={setSearch}
          collapsed={false}
          setCollapsed={noopSetCollapsed}
        />
      </div>
    </>
  );
});

export default MobileSidebarDrawer;
