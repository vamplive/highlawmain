/**
 * MobileSelectionBar — 텍스트 선택 시 표시되는 모바일 친화 액션바
 * 데스크톱 FloatingToolbar는 12~14px 아이콘으로 너무 작아 모바일에서 누르기 어려움.
 * 이 컴포넌트는 44px 터치 타깃 + 큰 아이콘으로 자르기/복사/붙여넣기/굵게/형광펜/링크/댓글을 제공.
 *
 * 위치: selection rect의 위쪽으로 띄움. 화면 위로 잘리면 아래로 표시.
 */
import { memo, useMemo } from "react";
import {
  Bold, Italic, Underline, Highlighter, Link2, MessageSquarePlus,
  Scissors, Copy, ClipboardPaste, Sparkles, Trash2,
} from "lucide-react";
import { useEditorSelectionRect, useHapticFeedback } from "./mobileHooks";

const ICON = 18;

export const MobileSelectionBar = memo(function MobileSelectionBar({
  editor,
  onInsertComment,
  onOpenLink,
  onOpenAi,
}) {
  const { rect } = useEditorSelectionRect(editor);
  const haptic = useHapticFeedback();
  // 스크롤 컨테이너는 selection rect가 갱신될 때마다 DOM에서 직접 조회
  // (effect + setState 대신 파생값으로 처리해 cascading render를 피한다)
  const scrollContainer = useMemo(() => {
    if (!rect || !editor?.view?.dom) return null;
    let parent = editor.view.dom.parentElement;
    while (parent && !parent.classList?.contains("editor-canvas-scroll")) parent = parent.parentElement;
    return parent;
  }, [editor, rect]);

  if (!rect || !scrollContainer) return null;

  const containerRect = scrollContainer.getBoundingClientRect();
  const barHeight = 48;
  const barWidth = 360;
  const margin = 8;

  // selection 위에 띄움. 위 공간 부족하면 아래로.
  let top = rect.top - containerRect.top + scrollContainer.scrollTop - barHeight - margin;
  let placeBelow = false;
  if (top < scrollContainer.scrollTop + 8) {
    top = rect.bottom - containerRect.top + scrollContainer.scrollTop + margin;
    placeBelow = true;
  }
  const centerX = (rect.left + rect.right) / 2 - containerRect.left;
  let left = centerX - barWidth / 2;
  left = Math.max(8, Math.min(left, containerRect.width - barWidth - 8));

  const run = (fn) => () => {
    haptic(8);
    fn(editor.chain().focus()).run();
  };

  const copy = async () => {
    try {
      const slice = editor.state.doc.cut(editor.state.selection.from, editor.state.selection.to);
      const text = slice.textContent;
      if (text) await navigator.clipboard?.writeText(text);
      haptic(10);
    } catch { /* ignore */ }
  };

  const cut = async () => {
    await copy();
    editor.chain().focus().deleteSelection().run();
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) editor.chain().focus().insertContent(text).run();
    } catch { /* ignore */ }
  };

  const remove = () => {
    haptic(15);
    editor.chain().focus().deleteSelection().run();
  };

  const isActive = (name) => { try { return editor.isActive(name); } catch { return false; } };

  return (
    <div
      className="editor-mselection-bar"
      style={{
        position: "absolute",
        top,
        left,
        width: barWidth,
        height: barHeight,
      }}
      role="toolbar"
      aria-label="선택 액션"
      data-place={placeBelow ? "below" : "above"}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" onClick={cut} title="잘라내기"><Scissors size={ICON} /></button>
      <button type="button" onClick={copy} title="복사"><Copy size={ICON} /></button>
      <button type="button" onClick={paste} title="붙여넣기"><ClipboardPaste size={ICON} /></button>
      <span className="mselection-sep" />
      <button type="button" className={isActive("bold") ? "active" : ""} onClick={run((c) => c.toggleBold())} title="굵게"><Bold size={ICON} /></button>
      <button type="button" className={isActive("italic") ? "active" : ""} onClick={run((c) => c.toggleItalic())} title="기울임"><Italic size={ICON} /></button>
      <button type="button" className={isActive("underline") ? "active" : ""} onClick={run((c) => c.toggleUnderline())} title="밑줄"><Underline size={ICON} /></button>
      <button type="button" className={isActive("highlight") ? "active" : ""} onClick={run((c) => c.toggleHighlight())} title="형광펜"><Highlighter size={ICON} /></button>
      <span className="mselection-sep" />
      <button type="button" className={isActive("link") ? "active" : ""} onClick={() => onOpenLink?.()} title="링크"><Link2 size={ICON} /></button>
      <button type="button" onClick={() => onInsertComment?.()} title="댓글"><MessageSquarePlus size={ICON} /></button>
      {onOpenAi && (
        <button type="button" onClick={() => onOpenAi?.()} title="AI 도우미"><Sparkles size={ICON} /></button>
      )}
      <button type="button" className="danger" onClick={remove} title="삭제"><Trash2 size={ICON} /></button>
    </div>
  );
});

export default MobileSelectionBar;
