/**
 * 에디터 키보드 단축키 훅
 * — EditorPage에서 분리된 Ctrl+S/F/H/K/D/P 등 글로벌 단축키 처리
 */
import { useEffect, useRef, useCallback } from "react";

/** 글꼴 크기 단계표 (Word 호환) */
const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

/**
 * @param {object} editor - TipTap 에디터 인스턴스
 * @param {object} handlers - 단축키별 핸들러
 * @param {function} handlers.onSave - Ctrl+S
 * @param {function} handlers.onFind - Ctrl+F
 * @param {function} handlers.onReplace - Ctrl+H
 * @param {function} handlers.onHyperlink - Ctrl+K
 * @param {function} handlers.onFont - Ctrl+D
 * @param {function} handlers.onPrint - Ctrl+P
 * @param {function} handlers.onComment - Ctrl+Alt+M
 * @param {function} handlers.onFullscreen - F11
 */
export default function useEditorShortcuts(editor, handlers) {
  // ref로 최신 핸들러 참조 (effect 재등록 방지, latest-callback 패턴)
  const handlersRef = useRef(handlers);
  // eslint-disable-next-line react-hooks/refs
  handlersRef.current = handlers;

  const changeFontSize = useCallback((direction) => {
    if (!editor) return;
    const current = parseFloat(editor.getAttributes("textStyle").fontSize || "11");
    const next = direction === "up"
      ? FONT_SIZES.find(x => x > current) || 72
      : [...FONT_SIZES].reverse().find(x => x < current) || 8;
    editor.chain().focus().setFontSize(next + "pt").run();
  }, [editor]);

  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const h = handlersRef.current;

      if (ctrl && e.key === "s") { e.preventDefault(); h.onSave?.(); }
      if (ctrl && e.key === "f") { e.preventDefault(); h.onFind?.(); }
      if (ctrl && e.key === "h") { e.preventDefault(); h.onReplace?.(); }
      if (ctrl && e.key === "k") { e.preventDefault(); h.onHyperlink?.(); }
      if (ctrl && e.key === "d") { e.preventDefault(); h.onFont?.(); }
      if (ctrl && e.key === "p") { e.preventDefault(); h.onPrint?.(); }
      if (ctrl && e.altKey && e.key === "m") { e.preventDefault(); h.onComment?.(); }
      if (e.key === "F11") { e.preventDefault(); h.onFullscreen?.(); }
      if (ctrl && e.shiftKey && e.key === ">") { e.preventDefault(); changeFontSize("up"); }
      if (ctrl && e.shiftKey && e.key === "<") { e.preventDefault(); changeFontSize("down"); }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [changeFontSize]);
}
