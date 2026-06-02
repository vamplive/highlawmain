/**
 * StatusBar — MS Word 하단 상태 표시줄
 * 페이지/단어/문자 수, 언어, 줄/열 위치, 확대/축소 슬라이더
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, BookOpen, FileText, Monitor } from "lucide-react";

/**
 * 에디터 텍스트에서 통계 정보를 계산
 * @param {string} text - 에디터 일반 텍스트
 * @returns {{ chars: number, charsNoSpace: number, words: number, paragraphs: number, lines: number }}
 */
function computeStats(text) {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length || 1;
  const lines = text.split(/\n/).length;
  return { chars, charsNoSpace, words, paragraphs, lines };
}

export function StatusBar({ editor, zoom, setZoom, viewMode, setViewMode, pageCount }) {
  const [stats, setStats] = useState({ chars: 0, charsNoSpace: 0, words: 0, paragraphs: 0, lines: 0 });
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showWordCount, setShowWordCount] = useState(false);

  // 에디터 변경 시 통계 업데이트
  useEffect(() => {
    if (!editor) return;
    const updateStats = () => {
      const text = editor.getText() || "";
      setStats(computeStats(text));
    };
    updateStats();
    editor.on("update", updateStats);
    return () => editor.off("update", updateStats);
  }, [editor]);

  // 커서 위치 업데이트
  useEffect(() => {
    if (!editor) return;
    const updateCursor = () => {
      const { from } = editor.state.selection;
      // 대략적인 줄/열 계산
      const textBefore = editor.state.doc.textBetween(0, from, "\n");
      const lines = textBefore.split("\n");
      setCursorPos({ line: lines.length, col: (lines[lines.length - 1]?.length || 0) + 1 });
    };
    updateCursor();
    editor.on("selectionUpdate", updateCursor);
    return () => editor.off("selectionUpdate", updateCursor);
  }, [editor]);

  const handleZoomChange = useCallback((e) => {
    setZoom(parseInt(e.target.value));
  }, [setZoom]);

  const estimatedPages = useMemo(() => {
    if (pageCount) return pageCount;
    // 대략적 페이지 수 추정 (A4 기준 약 3000자/페이지)
    return Math.max(1, Math.ceil(stats.chars / 3000));
  }, [stats.chars, pageCount]);

  return (
    <div className="editor-status-bar">
      {/* 페이지 정보 */}
      <div className="status-item">
        페이지 {estimatedPages}
      </div>

      <div className="status-sep" />

      {/* 단어 수 (클릭하면 상세 통계 팝업) */}
      <div className="status-item clickable" style={{ position: "relative" }}
        onClick={() => setShowWordCount(v => !v)}>
        단어 수: {stats.words.toLocaleString()}
        {showWordCount && (
          <div style={{
            position: "absolute", bottom: "100%", left: 0, marginBottom: 4,
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: "14px 18px",
            minWidth: 250, zIndex: 100,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 6 }}>
              단어 수 통계
            </div>
            <table style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["문자 (공백 포함)", stats.chars],
                  ["문자 (공백 제외)", stats.charsNoSpace],
                  ["단어 수", stats.words],
                  ["단락 수", stats.paragraphs],
                  ["줄 수", stats.lines],
                  ["예상 페이지", estimatedPages],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: "4px 8px 4px 0", color: "#555" }}>{label}</td>
                    <td style={{ fontWeight: 600, textAlign: "right" }}>{value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowWordCount(false); }}
              style={{ marginTop: 10, padding: "4px 16px", fontSize: 11, border: "1px solid #ccc", borderRadius: 3, background: "#f8f9fa", cursor: "pointer", width: "100%" }}>
              닫기
            </button>
          </div>
        )}
      </div>

      <div className="status-sep" />

      {/* 언어 */}
      <div className="status-item">한국어</div>

      <div className="status-sep" />

      {/* 줄:열 위치 */}
      <div className="status-item">
        줄 {cursorPos.line}, 열 {cursorPos.col}
      </div>

      {/* 오른쪽 영역: 뷰 모드 + 확대/축소 */}
      <div className="zoom-slider">
        {/* 뷰 모드 토글 */}
        <div style={{ display: "flex", gap: 1, marginRight: 8 }}>
          {[
            { id: "edit", icon: <FileText size={12} />, title: "인쇄 모양" },
            { id: "preview", icon: <BookOpen size={12} />, title: "읽기 모드" },
            { id: "web", icon: <Monitor size={12} />, title: "웹 레이아웃" },
          ].map(v => (
            <button key={v.id} type="button" onClick={() => setViewMode(v.id)} title={v.title}
              style={{
                width: 22, height: 18, border: "none", borderRadius: 2, cursor: "pointer",
                background: viewMode === v.id ? "#c8daf0" : "transparent",
                color: viewMode === v.id ? "#1e3a5f" : "#888",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {v.icon}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setZoom(z => Math.max(25, (typeof z === "function" ? z : z) - 10))}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 2px", color: "inherit" }}>
          <ZoomOut size={12} />
        </button>
        <input type="range" min={25} max={500} step={5} value={zoom}
          onChange={handleZoomChange} title={`${zoom}%`} />
        <button type="button" onClick={() => setZoom(z => Math.min(500, (typeof z === "function" ? z : z) + 10))}
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 2px", color: "inherit" }}>
          <ZoomIn size={12} />
        </button>
        <span style={{ fontSize: 10, minWidth: 35, textAlign: "center" }}>{zoom}%</span>
      </div>
    </div>
  );
}
