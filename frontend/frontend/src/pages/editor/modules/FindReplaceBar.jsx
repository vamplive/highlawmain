/**
 * 찾기/바꾸기 바 컴포넌트
 * ProseMirror 문서 모델 기반으로 에디터 내부 텍스트를 직접 탐색하여 정확한 매칭을 수행한다.
 * 검색 로직은 useFindReplace 훅으로 분리하고, 이 파일은 UI 렌더링만 담당한다.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { showEditorAlert } from "./editorToast";
import { createFindReplaceHighlightPlugin, findReplaceHighlightKey } from "./findReplaceHighlights";

const ACTIVE_MATCH_COLOR = "#185ABD";
const NO_MATCH_COLOR = "#888";

/** 교체 후 재검색까지 대기 시간 (ms) */
const REPLACE_RECHECK_DELAY = 50;

/** 모두 바꾸기 후 알림 대기 시간 (ms) */
const REPLACE_ALL_ALERT_DELAY = 100;

/* ── 스타일 ── */
const BAR_STYLE = {
  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
  background: "#f8f9fa", borderBottom: "1px solid #d1d5db", flexShrink: 0,
  fontFamily: "'맑은 고딕', sans-serif",
};

const INPUT_STYLE = {
  padding: "3px 8px", border: "1px solid #c0c0c0", borderRadius: 3,
  fontSize: 11, outline: "none", width: 180,
};

const BUTTON_STYLE = {
  padding: "3px 8px", border: "1px solid #c0c0c0", borderRadius: 3,
  fontSize: 10, background: "#fff", cursor: "pointer",
};

/* ══════════════════════════════ useFindReplace 훅 ══════════════════════════════ */

/**
 * 찾기/바꾸기 상태와 로직을 관리하는 커스텀 훅
 * @param {object} editor - TipTap 에디터 인스턴스
 * @returns {object} 검색 상태 및 액션 함수들
 */
function useFindReplace(editor) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matches, setMatches] = useState([]); // [{ from, to }]
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  /** 에디터 문서에서 모든 매칭 위치를 검색 */
  const findAllMatches = useCallback((text) => {
    if (!text || !editor) {
      setMatches([]);
      setCurrentMatchIdx(-1);
      return [];
    }

    const results = [];
    const doc = editor.state.doc;
    const searchStr = caseSensitive ? text : text.toLowerCase();
    const escapedSearch = searchStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = wholeWord ? `\\b${escapedSearch}\\b` : escapedSearch;
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(pattern, flags);

    doc.descendants((node, pos) => {
      if (!node.isText) return;
      const nodeText = node.text;
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(nodeText)) !== null) {
        results.push({ from: pos + match.index, to: pos + match.index + match[0].length });
      }
    });

    setMatches(results);
    return results;
  }, [editor, caseSensitive, wholeWord]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined;
    editor.unregisterPlugin(findReplaceHighlightKey);
    editor.registerPlugin(createFindReplaceHighlightPlugin());

    return () => {
      if (!editor.isDestroyed) {
        editor.unregisterPlugin(findReplaceHighlightKey);
      }
    };
  }, [editor]);

  /** 하이라이트 데코레이션 적용 (및 정리) */
  const applyHighlights = useCallback((matchList, activeIdx) => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(
      editor.state.tr.setMeta(findReplaceHighlightKey, {
        matches: matchList,
        activeIdx,
      }),
    );
  }, [editor]);

  /** 특정 매치 위치로 스크롤 및 선택 */
  const scrollToMatch = useCallback((match) => {
    if (!editor || !match) return;
    editor.chain().focus().setTextSelection({ from: match.from, to: match.to }).run();
    editor.commands.scrollIntoView();
  }, [editor]);

  /** 텍스트 변경 시 자동 검색 */
  const handleSearchChange = useCallback((text) => {
    setFindText(text);
    const results = findAllMatches(text);
    if (results.length > 0) {
      setCurrentMatchIdx(0);
      scrollToMatch(results[0]);
    } else {
      setCurrentMatchIdx(-1);
    }
  }, [findAllMatches, scrollToMatch]);

  /** 다음 매치로 이동 */
  const handleFindNext = useCallback(() => {
    if (!findText) return;
    const results = findAllMatches(findText);
    if (results.length === 0) return;
    const nextIdx = currentMatchIdx < results.length - 1 ? currentMatchIdx + 1 : 0;
    setCurrentMatchIdx(nextIdx);
    scrollToMatch(results[nextIdx]);
  }, [findText, currentMatchIdx, findAllMatches, scrollToMatch]);

  /** 이전 매치로 이동 */
  const handleFindPrev = useCallback(() => {
    if (!findText) return;
    const results = findAllMatches(findText);
    if (results.length === 0) return;
    const prevIdx = currentMatchIdx > 0 ? currentMatchIdx - 1 : results.length - 1;
    setCurrentMatchIdx(prevIdx);
    scrollToMatch(results[prevIdx]);
  }, [findText, currentMatchIdx, findAllMatches, scrollToMatch]);

  /** 현재 선택된 매치를 교체 */
  const handleReplace = useCallback(() => {
    if (!findText || !editor) return;
    const currentMatches = findAllMatches(findText);
    if (currentMatches.length === 0 || currentMatchIdx < 0) {
      handleFindNext();
      return;
    }
    const match = currentMatches[currentMatchIdx];
    if (!match) return;

    editor.chain().focus()
      .insertContentAt({ from: match.from, to: match.to }, replaceText)
      .run();

    // 교체 후 재검색
    setTimeout(() => {
      const newResults = findAllMatches(findText);
      if (newResults.length > 0) {
        const newIdx = Math.min(currentMatchIdx, newResults.length - 1);
        setCurrentMatchIdx(newIdx);
        scrollToMatch(newResults[newIdx]);
      }
    }, REPLACE_RECHECK_DELAY);
  }, [findText, replaceText, editor, currentMatchIdx, findAllMatches, handleFindNext, scrollToMatch]);

  /** 모든 매치를 한번에 교체 (역순으로 처리하여 위치 변동 방지) */
  const handleReplaceAll = useCallback(() => {
    if (!findText || !editor) return;
    const allMatches = findAllMatches(findText);
    if (allMatches.length === 0) return;

    const replacedCount = allMatches.length;
    // 역순으로 교체하여 위치 오프셋 문제 방지
    const reversedMatches = [...allMatches].reverse();
    let chain = editor.chain().focus();
    for (const match of reversedMatches) {
      chain = chain.insertContentAt({ from: match.from, to: match.to }, replaceText);
    }
    chain.run();

    setMatches([]);
    setCurrentMatchIdx(-1);

    setTimeout(() => {
      showEditorAlert(`${replacedCount}개 항목이 교체되었습니다.`);
    }, REPLACE_ALL_ALERT_DELAY);
  }, [findText, replaceText, editor, findAllMatches]);

  /* 옵션(대소문자, 단어 단위) 변경 시 재검색 — findText 등은 의도적으로 deps에서 제외 */
  useEffect(() => {
    if (findText) {
      const results = findAllMatches(findText);
      if (results.length > 0) {
        const idx = Math.min(currentMatchIdx, results.length - 1);
        setCurrentMatchIdx(Math.max(0, idx));
        scrollToMatch(results[Math.max(0, idx)]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseSensitive, wholeWord]);

  /* 컴포넌트 언마운트 시 하이라이트 정리 */
  useEffect(() => {
    return () => applyHighlights([], -1);
  }, [applyHighlights]);

  useEffect(() => {
    applyHighlights(matches, currentMatchIdx);
  }, [matches, currentMatchIdx, applyHighlights]);

  return {
    findText,
    replaceText,
    setReplaceText,
    matches,
    currentMatchIdx,
    caseSensitive,
    setCaseSensitive,
    wholeWord,
    setWholeWord,
    handleSearchChange,
    handleFindNext,
    handleFindPrev,
    handleReplace,
    handleReplaceAll,
  };
}

/* ══════════════════════════════ FindReplaceBar 컴포넌트 ══════════════════════════════ */

/**
 * 찾기/바꾸기 UI 바
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {boolean} props.showReplace - 바꾸기 영역 표시 여부
 * @param {function} props.onClose - 닫기 콜백
 */
export function FindReplaceBar({ editor, showReplace, onClose }) {
  const inputRef = useRef(null);

  const {
    findText,
    replaceText,
    setReplaceText,
    matches,
    currentMatchIdx,
    caseSensitive,
    setCaseSensitive,
    wholeWord,
    setWholeWord,
    handleSearchChange,
    handleFindNext,
    handleFindPrev,
    handleReplace,
    handleReplaceAll,
  } = useFindReplace(editor);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matchCount = matches.length;
  const matchStatusColor = matchCount > 0 ? ACTIVE_MATCH_COLOR : NO_MATCH_COLOR;
  const matchStatusWeight = matchCount > 0 ? 600 : 400;

  return (
    <div>
      {/* 찾기 바 */}
      <div style={BAR_STYLE}>
        <span style={{ fontSize: 11, color: "#555", minWidth: 30 }}>찾기:</span>
        <input
          ref={inputRef}
          type="text" value={findText}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); handleFindPrev(); }
            else if (e.key === "Enter") { e.preventDefault(); handleFindNext(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="검색어 입력..."
          style={INPUT_STYLE}
        />
        <button type="button" onClick={handleFindPrev} style={BUTTON_STYLE} title="이전 (Shift+Enter)">&#9650;</button>
        <button type="button" onClick={handleFindNext} style={BUTTON_STYLE} title="다음 (Enter)">&#9660;</button>
        <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "#666" }}>
          <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} style={{ width: 12, height: 12 }} />
          대소문자
        </label>
        <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "#666" }}>
          <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} style={{ width: 12, height: 12 }} />
          단어 단위
        </label>
        <span style={{ fontSize: 10, color: matchStatusColor, fontWeight: matchStatusWeight }}>
          {matchCount > 0 ? `${currentMatchIdx + 1}/${matchCount}개 일치` : findText ? "일치 없음" : ""}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose} style={{ ...BUTTON_STYLE, border: "none", fontSize: 14, color: "#999" }}>&#10005;</button>
      </div>

      {/* 바꾸기 바 (조건부 렌더링) */}
      {showReplace && (
        <div style={BAR_STYLE}>
          <span style={{ fontSize: 11, color: "#555", minWidth: 30 }}>바꾸기:</span>
          <input
            type="text" value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); handleReplace(); }
              if (e.key === "Escape") onClose();
            }}
            placeholder="바꿀 텍스트..."
            style={INPUT_STYLE}
          />
          <button type="button" onClick={handleReplace} style={BUTTON_STYLE}>바꾸기</button>
          <button type="button" onClick={handleReplaceAll} style={BUTTON_STYLE}>모두 바꾸기</button>
        </div>
      )}
    </div>
  );
}
