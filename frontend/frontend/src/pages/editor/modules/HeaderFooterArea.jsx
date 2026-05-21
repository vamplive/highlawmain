/**
 * HeaderFooterArea — WYSIWYG 머리글/바닥글 편집 영역
 * Word처럼 페이지 상단/하단에 직접 편집 가능한 영역 제공
 */
import { useState, useRef, useCallback } from "react";
import { HEADER_FOOTER_PRESETS } from "./constants";

/**
 * 머리글 영역 컴포넌트
 * @param {{ value: string, onChange: (v: string) => void, differentFirst: boolean, oddEvenDifferent: boolean, isFirstPage: boolean, isOdd: boolean }} props
 */
export function HeaderArea({ value, onChange, differentFirst, oddEvenDifferent, isFirstPage, isOdd }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  // 첫 페이지/홀짝 페이지 구분
  const label = differentFirst && isFirstPage
    ? "첫 페이지 머리글"
    : oddEvenDifferent
      ? (isOdd ? "홀수 페이지 머리글" : "짝수 페이지 머리글")
      : "머리글";

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (ref.current) {
      onChange(ref.current.innerText || "");
    }
  }, [onChange]);

  const handleStartEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  }, []);

  return (
    <div className={`header-footer-edit-area header${editing ? " editing" : ""}`}
      style={{ position: "relative", minHeight: 32 }}>
      {!editing && !value && (
        <span className="header-footer-label" style={{ top: 10 }}>{label}</span>
      )}
      <div
        ref={ref}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={handleStartEditing}
        onFocus={handleStartEditing}
        onBlur={handleBlur}
        style={{
          minHeight: 20,
          fontSize: "9pt",
          color: editing ? "#333" : "#999",
          textAlign: "center",
          outline: "none",
          cursor: editing ? "text" : "pointer",
          padding: "4px 8px",
        }}
        title="클릭하여 편집"
      >
        {value || ""}
      </div>
    </div>
  );
}

/**
 * 바닥글 영역 컴포넌트
 * @param {{ value: string, onChange: (v: string) => void, differentFirst: boolean, oddEvenDifferent: boolean, isFirstPage: boolean, isOdd: boolean, pageNumber: number }} props
 */
export function FooterArea({ value, onChange, differentFirst, oddEvenDifferent, isFirstPage, isOdd, pageNumber }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  const label = differentFirst && isFirstPage
    ? "첫 페이지 바닥글"
    : oddEvenDifferent
      ? (isOdd ? "홀수 페이지 바닥글" : "짝수 페이지 바닥글")
      : "바닥글";

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (ref.current) {
      onChange(ref.current.innerText || "");
    }
  }, [onChange]);

  const handleStartEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  }, []);

  // 페이지 번호 자동 치환: {PAGE}는 현재 페이지 번호로
  const displayValue = (value || "").replace(/\{PAGE\}/g, String(pageNumber || 1));

  return (
    <div className={`header-footer-edit-area footer${editing ? " editing" : ""}`}
      style={{ position: "relative", minHeight: 32 }}>
      {!editing && !value && (
        <span className="header-footer-label" style={{ bottom: 10 }}>{label}</span>
      )}
      <div
        ref={ref}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={handleStartEditing}
        onFocus={handleStartEditing}
        onBlur={handleBlur}
        style={{
          minHeight: 20,
          fontSize: "9pt",
          color: editing ? "#333" : "#999",
          textAlign: "center",
          outline: "none",
          cursor: editing ? "text" : "pointer",
          padding: "4px 8px",
        }}
        title="클릭하여 편집"
      >
        {editing ? value || "" : displayValue}
      </div>
    </div>
  );
}

/**
 * 머리글/바닥글 설정 도구 모음
 * 머리글/바닥글 편집 모드에서 표시되는 리본 컨텍스트 탭
 */
export function HeaderFooterToolbar({
  headerText, setHeaderText, footerText, setFooterText,
  differentFirst, setDifferentFirst,
  oddEvenDifferent, setOddEvenDifferent,
  showPageNumbers, setShowPageNumbers,
  onClose,
}) {
  const [activePresetType, setActivePresetType] = useState("header");

  const applyPreset = (presetId) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    const setter = activePresetType === "header" ? setHeaderText : setFooterText;

    switch (presetId) {
      case "blank": setter(""); break;
      case "title-only": setter("문서 제목"); break;
      case "title-date": setter(`문서 제목    ${dateStr}`); break;
      case "title-page": setter("문서 제목    {PAGE}"); break;
      case "page-center": setter("{PAGE}"); break;
      case "page-right": setter(`${"                              "}{PAGE}`); break;
      default: break;
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "#e8f0fe", borderBottom: "1px solid #b8cfe8",
      padding: "6px 16px", fontSize: 11, flexShrink: 0,
    }}>
      <span style={{ fontWeight: 600, color: "#1e3a5f", marginRight: 8 }}>머리글/바닥글 도구</span>

      {/* 프리셋 */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <select value={activePresetType} onChange={e => setActivePresetType(e.target.value)}
          style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #b8cfe8", borderRadius: 3 }}>
          <option value="header">머리글</option>
          <option value="footer">바닥글</option>
        </select>
        <select onChange={e => { if (e.target.value) applyPreset(e.target.value); e.target.value = ""; }}
          style={{ padding: "2px 6px", fontSize: 11, border: "1px solid #b8cfe8", borderRadius: 3 }}>
          <option value="">프리셋 선택...</option>
          {HEADER_FOOTER_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* 옵션 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", borderLeft: "1px solid #b8cfe8", paddingLeft: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <input type="checkbox" checked={differentFirst} onChange={e => setDifferentFirst(e.target.checked)} />
          첫 페이지 다르게
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <input type="checkbox" checked={oddEvenDifferent} onChange={e => setOddEvenDifferent(e.target.checked)} />
          홀짝 페이지 다르게
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
          <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} />
          페이지 번호 표시
        </label>
      </div>

      {/* 삽입 필드 */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", borderLeft: "1px solid #b8cfe8", paddingLeft: 12 }}>
        <button type="button" onClick={() => {
          const setter = activePresetType === "header" ? setHeaderText : setFooterText;
          const getter = activePresetType === "header" ? headerText : footerText;
          setter((getter || "") + " {PAGE}");
        }} style={{
          padding: "2px 8px", fontSize: 10, border: "1px solid #b8cfe8",
          borderRadius: 3, background: "#fff", cursor: "pointer",
        }}>
          페이지 번호
        </button>
        <button type="button" onClick={() => {
          const setter = activePresetType === "header" ? setHeaderText : setFooterText;
          const getter = activePresetType === "header" ? headerText : footerText;
          const now = new Date();
          setter((getter || "") + ` ${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`);
        }} style={{
          padding: "2px 8px", fontSize: 10, border: "1px solid #b8cfe8",
          borderRadius: 3, background: "#fff", cursor: "pointer",
        }}>
          날짜
        </button>
      </div>

      {/* 닫기 */}
      <button type="button" onClick={onClose}
        style={{
          marginLeft: "auto", padding: "4px 16px", fontSize: 11,
          border: "1px solid #b8cfe8", borderRadius: 3,
          background: "#1e3a5f", color: "#fff", cursor: "pointer",
        }}>
        머리글/바닥글 닫기
      </button>
    </div>
  );
}
