/**
 * MobileFormatBar — 화면 하단 고정 서식 바
 * 키보드가 떠 있을 때도 활성 영역에 가까운 위치에서 자주 쓰는 서식 버튼을 제공.
 * 횡 스크롤 가능. 좁은 폰에서도 핵심(굵게/기울임/리스트/링크/이미지) 즉시 접근.
 */
import { memo, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Heading1, Heading2,
  List, ListOrdered, Quote, Link2, Image as ImageIcon,
  Code2, Sparkles,
} from "lucide-react";

/**
 * @param {object} props
 * @param {object} props.editor - TipTap editor 인스턴스
 * @param {boolean} props.darkMode
 * @param {function} props.onOpenSheet - 더보기 시트 트리거
 * @param {function} props.onOpenLinkDialog
 * @param {function} props.onOpenImageDialog
 */
export const MobileFormatBar = memo(function MobileFormatBar({
  editor,
  darkMode,
  onOpenSheet,
  onOpenLinkDialog,
  onOpenImageDialog,
}) {
  const [, force] = useState(0);

  // editor의 활성 마크 변화에 따라 버튼 active 상태 갱신
  useEffect(() => {
    if (!editor) return undefined;
    const tick = () => force((v) => v + 1);
    editor.on("selectionUpdate", tick);
    editor.on("transaction", tick);
    return () => {
      editor.off("selectionUpdate", tick);
      editor.off("transaction", tick);
    };
  }, [editor]);

  const isActive = useCallback(
    (name, attrs) => {
      try {
        return editor?.isActive(name, attrs) ?? false;
      } catch {
        return false;
      }
    },
    [editor],
  );

  if (!editor) return null;

  const run = (fn) => () => fn(editor.chain().focus()).run();

  const toggleHeading = (level) => () => {
    if (editor.isActive("heading", { level })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level }).run();
    }
  };

  const handleImage = () => {
    if (onOpenImageDialog) onOpenImageDialog();
  };
  const handleLink = () => {
    if (onOpenLinkDialog) onOpenLinkDialog();
  };

  return (
    <div
      className={`editor-mformatbar editor-mobile-only${darkMode ? " dark" : ""}`}
      role="toolbar"
      aria-label="서식 도구"
    >
      <button
        type="button"
        className={isActive("bold") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleBold())}
        aria-label="굵게"
        title="굵게"
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        className={isActive("italic") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleItalic())}
        aria-label="기울임"
        title="기울임"
      >
        <Italic size={18} />
      </button>
      <button
        type="button"
        className={isActive("underline") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleUnderline())}
        aria-label="밑줄"
        title="밑줄"
      >
        <Underline size={18} />
      </button>

      <span className="mformatbar-sep" aria-hidden="true" />

      <button
        type="button"
        className={isActive("heading", { level: 1 }) ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleHeading(1)}
        aria-label="제목 1"
        title="제목 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        type="button"
        className={isActive("heading", { level: 2 }) ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleHeading(2)}
        aria-label="제목 2"
        title="제목 2"
      >
        <Heading2 size={18} />
      </button>

      <span className="mformatbar-sep" aria-hidden="true" />

      <button
        type="button"
        className={isActive("bulletList") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleBulletList())}
        aria-label="글머리 기호"
        title="글머리 기호"
      >
        <List size={18} />
      </button>
      <button
        type="button"
        className={isActive("orderedList") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleOrderedList())}
        aria-label="번호 매기기"
        title="번호 매기기"
      >
        <ListOrdered size={18} />
      </button>
      <button
        type="button"
        className={isActive("blockquote") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleBlockquote())}
        aria-label="인용"
        title="인용"
      >
        <Quote size={18} />
      </button>

      <span className="mformatbar-sep" aria-hidden="true" />

      <button
        type="button"
        className={isActive("link") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleLink}
        aria-label="링크"
        title="링크 삽입"
      >
        <Link2 size={18} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleImage}
        aria-label="이미지"
        title="이미지 삽입"
      >
        <ImageIcon size={18} />
      </button>
      <button
        type="button"
        className={isActive("code") ? "active" : ""}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run((c) => c.toggleCode())}
        aria-label="인라인 코드"
        title="인라인 코드"
      >
        <Code2 size={18} />
      </button>

      <span className="mformatbar-sep" aria-hidden="true" />

      <button
        type="button"
        onClick={onOpenSheet}
        aria-label="더보기"
        title="더보기"
      >
        <Sparkles size={18} />
      </button>
    </div>
  );
});

export default MobileFormatBar;
