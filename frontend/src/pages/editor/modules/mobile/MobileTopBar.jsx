/**
 * MobileTopBar — 모바일 전용 상단 앱바
 * - 좌: 햄버거(사이드바 드로어 토글)
 * - 가운데: 제목 입력
 * - 우: 저장 상태 점 + 실행취소/다시실행 + 더보기(⋯) 메뉴 트리거
 *
 * 데스크톱의 TitleBar(빠른 실행 도구 + 새문서/블로그/발행 버튼)는 모바일에서는
 * 작은 화면을 점유하므로 ToolSheet 안으로 옮기고, 여기서는 핵심 동선만 노출한다.
 */
import { memo } from "react";
import { Menu, MoreVertical, Undo2, Redo2, ListTree, Tag, Focus, Share2 } from "lucide-react";
import { useHapticFeedback } from "./mobileHooks";

const STATUS_COLOR = {
  "저장됨": "#22c55e",
  "발행됨": "#3b82f6",
  "예약됨": "#0ea5e9",
  "삭제됨": "#ef4444",
  "수정됨": "#f59e0b",
  "저장 중...": "#facc15",
  "발행 중...": "#facc15",
  "예약 중...": "#facc15",
  "오류": "#ef4444",
};

function statusToColor(saveStatus) {
  const raw = typeof saveStatus === "object" && saveStatus !== null
    ? saveStatus.status || saveStatus.message || ""
    : saveStatus || "";
  if (!raw) return "rgba(255,255,255,0.4)";
  const key = String(raw);
  if (STATUS_COLOR[key]) return STATUS_COLOR[key];
  if (key.toLowerCase().includes("error") || key.startsWith("오류")) return STATUS_COLOR.오류;
  return "rgba(255,255,255,0.55)";
}

export const MobileTopBar = memo(function MobileTopBar({
  editor,
  doc,
  setDoc,
  saveStatus,
  darkMode,
  onOpenSidebar,
  onOpenSheet,
  onOpenOutline,
  onOpenMeta,
  onToggleFocus,
  focusMode,
  onShare,
  isBlog,
}) {
  const statusColor = statusToColor(saveStatus);
  const statusTitle = typeof saveStatus === "object" && saveStatus !== null
    ? saveStatus.message || saveStatus.status || ""
    : saveStatus || "";
  const haptic = useHapticFeedback();

  const tap = (fn) => () => { haptic(8); fn?.(); };

  return (
    <div className={`editor-mtopbar editor-mobile-only${darkMode ? " dark" : ""}`}>
      <button type="button" onClick={tap(onOpenSidebar)} aria-label="문서 목록 열기" title="문서 목록">
        <Menu size={22} />
      </button>

      <input
        type="text"
        className="mtopbar-title"
        value={doc?.title || ""}
        onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
        placeholder="제목을 입력하세요"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor?.commands.focus();
          }
        }}
      />

      <span
        className="mtopbar-status"
        title={statusTitle}
        style={{ background: statusColor }}
      />

      <button
        type="button"
        onClick={tap(() => editor?.chain().focus().undo().run())}
        aria-label="실행 취소"
        title="실행 취소"
      >
        <Undo2 size={20} />
      </button>
      <button
        type="button"
        onClick={tap(() => editor?.chain().focus().redo().run())}
        aria-label="다시 실행"
        title="다시 실행"
      >
        <Redo2 size={20} />
      </button>
      <button
        type="button"
        onClick={tap(onOpenOutline)}
        aria-label="개요"
        title="문서 개요"
      >
        <ListTree size={20} />
      </button>
      {isBlog && (
        <button
          type="button"
          onClick={tap(onOpenMeta)}
          aria-label="블로그 메타"
          title="카테고리·태그·썸네일"
        >
          <Tag size={20} />
        </button>
      )}
      <button
        type="button"
        onClick={tap(onToggleFocus)}
        aria-label={focusMode ? "집중 모드 끄기" : "집중 모드"}
        title="집중 모드"
        className={focusMode ? "active" : ""}
      >
        <Focus size={20} />
      </button>
      {onShare && (
        <button
          type="button"
          onClick={tap(onShare)}
          aria-label="공유"
          title="공유"
        >
          <Share2 size={20} />
        </button>
      )}
      <button
        type="button"
        onClick={tap(onOpenSheet)}
        aria-label="더보기 메뉴"
        title="더보기"
      >
        <MoreVertical size={22} />
      </button>
    </div>
  );
});

export default MobileTopBar;
