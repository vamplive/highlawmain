/**
 * MobileWritingHud — 본문 작성 진행도 미니 위젯
 *
 * 단어 수, 글자 수, 예상 읽기 시간(분, 200wpm)을 우측 하단에 작게 표시.
 * 탭하면 펼쳐져서 단락 수, 평균 단어 길이, 가독성 힌트도 함께 보임.
 */
import { memo, useEffect, useState } from "react";

function computeStats(editor) {
  if (!editor) return { words: 0, chars: 0, paragraphs: 0, readMin: 0 };
  const text = editor.getText() || "";
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const paragraphs = (editor.getJSON()?.content || []).filter((n) => n.type === "paragraph" || n.type?.startsWith?.("heading")).length;
  const readMin = Math.max(1, Math.round(words / 200));
  return { words, chars, paragraphs, readMin };
}

export const MobileWritingHud = memo(function MobileWritingHud({ editor, hidden }) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(() => computeStats(editor));

  useEffect(() => {
    if (!editor) return undefined;
    const sync = () => setStats(computeStats(editor));
    sync();
    editor.on("update", sync);
    return () => editor.off("update", sync);
  }, [editor]);

  if (hidden) return null;

  return (
    <button
      type="button"
      className={`editor-mhud editor-mobile-only${expanded ? " expanded" : ""}`}
      onClick={() => setExpanded((v) => !v)}
      aria-label="작성 통계"
    >
      {expanded ? (
        <div className="mhud-grid">
          <div><strong>{stats.words.toLocaleString()}</strong><span>단어</span></div>
          <div><strong>{stats.chars.toLocaleString()}</strong><span>글자</span></div>
          <div><strong>{stats.paragraphs}</strong><span>문단</span></div>
          <div><strong>{stats.readMin}분</strong><span>읽기</span></div>
        </div>
      ) : (
        <span className="mhud-compact">
          {stats.words.toLocaleString()}단어 · {stats.readMin}분
        </span>
      )}
    </button>
  );
});

export default MobileWritingHud;
