/**
 * MobileFindReplace — 모바일 친화 찾기·바꾸기 시트
 *
 * 데스크톱 FindReplaceBar는 작은 화면에서 입력칸/버튼이 너무 좁고 키보드와 겹친다.
 * 이 컴포넌트는 키보드 위 sticky 패널로 큰 입력 + 큰 버튼을 제공.
 *
 * 동작은 ProseMirror selection을 직접 이동시키는 단순 구현.
 * (편집기 본문 텍스트에서 needle 위치들을 찾아 다음/이전 매치로 점프)
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Replace, X, Search } from "lucide-react";
import { findMatchesInText } from "./findMatcher";

function findMatches(editor, needle, caseSensitive) {
  if (!editor || !needle) return [];
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\0");
  return findMatchesInText(text, needle, caseSensitive);
}

export const MobileFindReplace = memo(function MobileFindReplace({ editor, open, onClose }) {
  const [needle, setNeedle] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => findMatches(editor, needle, caseSensitive), [editor, needle, caseSensitive]);

  useEffect(() => {
    if (!open) { setNeedle(""); setReplace(""); setActiveIndex(0); }
  }, [open]);

  const jump = useCallback((idx) => {
    if (matches.length === 0 || !editor) return;
    const safe = ((idx % matches.length) + matches.length) % matches.length;
    const m = matches[safe];
    setActiveIndex(safe);
    try {
      editor.chain().focus().setTextSelection({ from: m.from, to: m.to }).scrollIntoView().run();
    } catch { /* ignore */ }
  }, [matches, editor]);

  const next = () => jump(activeIndex + 1);
  const prev = () => jump(activeIndex - 1);

  const replaceOne = () => {
    if (matches.length === 0 || !editor) return;
    const m = matches[activeIndex] || matches[0];
    editor.chain().focus().setTextSelection({ from: m.from, to: m.to }).insertContent(replace).run();
  };

  const replaceAll = () => {
    if (matches.length === 0 || !editor) return;
    if (!window.confirm(`"${needle}"을(를) ${matches.length}곳에서 모두 바꿀까요?`)) return;
    // 뒤에서부터 처리 (앞쪽 위치가 변하지 않도록)
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    editor.commands.focus();
    for (const m of sorted) {
      editor.chain().setTextSelection({ from: m.from, to: m.to }).insertContent(replace).run();
    }
  };

  if (!open) return null;
  return (
    <div className="editor-mfind editor-mobile-only" role="dialog" aria-label="찾기/바꾸기">
      <div className="mfind-row">
        <Search size={16} />
        <input
          autoFocus
          type="text"
          className="mfind-input"
          value={needle}
          placeholder="찾을 텍스트"
          onChange={(e) => { setNeedle(e.target.value); setActiveIndex(0); }}
        />
        <span className="mfind-count">
          {matches.length === 0 ? "없음" : `${activeIndex + 1}/${matches.length}`}
        </span>
        <button type="button" onClick={prev} aria-label="이전"><ChevronUp size={18} /></button>
        <button type="button" onClick={next} aria-label="다음"><ChevronDown size={18} /></button>
        <button type="button" onClick={() => setShowReplace((v) => !v)} className={showReplace ? "active" : ""} aria-label="바꾸기 토글">
          <Replace size={18} />
        </button>
        <button type="button" onClick={onClose} aria-label="닫기"><X size={18} /></button>
      </div>
      {showReplace && (
        <div className="mfind-row">
          <input
            type="text"
            className="mfind-input"
            value={replace}
            placeholder="바꿀 텍스트"
            onChange={(e) => setReplace(e.target.value)}
          />
          <button type="button" onClick={replaceOne}>한 번</button>
          <button type="button" onClick={replaceAll}>모두</button>
        </div>
      )}
      <div className="mfind-options">
        <label>
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          <span>대/소문자 구분</span>
        </label>
      </div>
    </div>
  );
});

export default MobileFindReplace;
