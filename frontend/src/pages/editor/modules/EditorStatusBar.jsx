/**
 * EditorStatusBar — MS Word 365 스타일 하단 상태 표시줄
 * 페이지/단어/문자 수, 언어, 보기 모드 아이콘, 확대/축소 슬라이더
 * (EditorPage의 인라인 상태 바를 별도 컴포넌트로 분리)
 */
import { memo } from "react";
import { ZoomIn, ZoomOut, FileText, BookOpen, Globe } from "lucide-react";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from "./editorConstants";

/**
 * @param {object} props
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {number} props.dynamicPageCount - 현재 페이지 수
 * @param {number} props.wordCount - 단어 수
 * @param {number} props.charCount - 문자 수
 * @param {string} props.viewMode - 보기 모드 (edit/preview/web)
 * @param {function} props.setViewMode - 보기 모드 변경 핸들러
 * @param {number} props.zoom - 줌 비율 (%)
 * @param {function} props.setZoom - 줌 변경 핸들러
 */
export const EditorStatusBar = memo(function EditorStatusBar({
  darkMode,
  dynamicPageCount,
  wordCount,
  charCount,
  viewMode,
  setViewMode,
  zoom,
  setZoom,
}) {
  const statusItems = [
    { label: `페이지: ${dynamicPageCount}/${dynamicPageCount}`, title: "페이지 수" },
    { label: `단어 수: ${wordCount.toLocaleString()}`, title: "단어 수" },
    { label: `${charCount.toLocaleString()}자`, title: "문자 수" },
    { label: "한국어", title: "언어" },
  ];

  const viewModes = [
    { mode: "edit", icon: <FileText size={13} />, title: "인쇄 모양" },
    { mode: "preview", icon: <BookOpen size={13} />, title: "읽기 모드" },
    { mode: "web", icon: <Globe size={13} />, title: "웹 레이아웃" },
  ];

  return (
    <div style={{
      height: 24, background: darkMode ? "#1e1e1e" : "#1a2332", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 10px", flexShrink: 0,
      color: "#fff", fontSize: 11,
      fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", userSelect: "none",
    }}>
      {/* 왼쪽: 페이지/단어/문자/언어 */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {statusItems.map((item, i) => (
          <span key={i} style={{
            padding: "2px 10px", cursor: "default", fontSize: 11, lineHeight: 1,
            borderRight: "1px solid rgba(255,255,255,0.15)",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            title={item.title}
          >{item.label}</span>
        ))}
      </div>

      {/* 오른쪽: 보기 모드 + 확대/축소 */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* 보기 모드 아이콘 */}
        {viewModes.map(v => (
          <button key={v.mode} type="button" onClick={() => setViewMode(v.mode)} title={v.title}
            style={{
              background: viewMode === v.mode ? "rgba(255,255,255,0.2)" : "none",
              border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer",
              padding: "3px 5px", borderRadius: 2, display: "flex", alignItems: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = viewMode === v.mode ? "rgba(255,255,255,0.2)" : "none"; }}>
            {v.icon}
          </button>
        ))}

        {/* 구분선 */}
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", margin: "0 6px" }} />

        {/* 줌 컨트롤 */}
        <button type="button" onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))} title="축소"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "2px 3px", display: "flex", borderRadius: 2 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
          <ZoomOut size={13} />
        </button>
        <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} value={zoom}
          onChange={e => setZoom(+e.target.value)}
          style={{
            width: 100, height: 4, cursor: "pointer",
            accentColor: "#fff",
            WebkitAppearance: "none", appearance: "none",
            background: "rgba(255,255,255,0.3)", borderRadius: 2,
          }} />
        <button type="button" onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))} title="확대"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "2px 3px", display: "flex", borderRadius: 2 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
          <ZoomIn size={13} />
        </button>
        <span style={{ width: 36, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{zoom}%</span>
      </div>
    </div>
  );
});
