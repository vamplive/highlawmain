/**
 * PrintPreviewDialog — 인쇄 미리보기 전체화면 오버레이
 * Word 365 스타일로 문서를 페이지별로 분할하여 미리보기를 제공한다.
 */
import { useState, useEffect, useRef } from "react";
import {
  X, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import DOMPurify from "dompurify";
import { buildFullDocumentHtml } from "./fileUtils";

/**
 * @param {Object} props.editor - TipTap 에디터 인스턴스
 * @param {function} props.onClose - 닫기 핸들러
 * @param {function} props.onPrint - 인쇄 핸들러
 */
export function PrintPreviewDialog({
  editor,
  onClose,
  onPrint,
  pageW = 794,
  pageH = 1123,
  marginTop = 96,
  marginBottom = 96,
  marginLeft = 120,
  marginRight = 120,
  footnotes = [],
  footnoteNumberFormat = "decimal",
  endnotes = [],
  endnoteNumberFormat = "lowerRoman",
  drawings = [],
}) {
  const [previewZoom, setPreviewZoom] = useState(70);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const [printer, setPrinter] = useState("default");
  const previewRef = useRef(null);
  const contentRef = useRef(null);

  /* Esc 키로 닫기 */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* 콘텐츠 높이 기반 페이지 수 계산 */
  useEffect(() => {
    if (!contentRef.current) return;
    const contentH = pageH - marginTop - marginBottom;
    const measure = () => {
      const el = contentRef.current;
      if (!el) return;
      const scrollH = el.scrollHeight;
      setTotalPages(Math.max(1, Math.ceil(scrollH / contentH)));
    };
    const timer = setTimeout(measure, 100);
    return () => clearTimeout(timer);
  }, [editor, pageH, marginTop, marginBottom]);

  const contentAreaH = pageH - marginTop - marginBottom;
  const contentAreaW = pageW - marginLeft - marginRight;
  const previewHtml = buildFullDocumentHtml(editor?.getHTML() || "", {}, {
    footnotes,
    footnoteNumberFormat,
    endnotes,
    endnoteNumberFormat,
    drawings,
    pageW,
    pageH,
  });

  return (
    <div className="print-preview-overlay">
      {/* 상단 툴바 */}
      <div className="print-preview-toolbar">
        <button onClick={onClose} className="word-dialog-btn" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={14} /> 돌아가기
        </button>

        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 8px" }} />

        <button onClick={() => { onPrint?.(); }} className="word-dialog-btn primary"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 20px" }}>
          <Printer size={14} /> 인쇄
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
          <label style={{ fontSize: 11, color: "#555" }}>복사본:</label>
          <input type="number" value={copies} onChange={(e) => setCopies(Math.max(1, +e.target.value))}
            min={1} max={99}
            style={{ width: 48, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
          <label style={{ fontSize: 11, color: "#555" }}>프린터:</label>
          <select value={printer} onChange={(e) => setPrinter(e.target.value)}
            style={{ padding: "3px 6px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11 }}>
            <option value="default">기본 프린터</option>
            <option value="pdf">PDF로 저장</option>
          </select>
        </div>

        <div style={{ flex: 1 }} />

        {/* 페이지 네비게이션 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 6px", cursor: "pointer" }}>
            <ChevronLeft size={12} />
          </button>
          <span style={{ fontSize: 11, color: "#555", minWidth: 60, textAlign: "center" }}>
            {currentPage} / {totalPages} 페이지
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 6px", cursor: "pointer" }}>
            <ChevronRight size={12} />
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 8px" }} />

        {/* 줌 컨트롤 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setPreviewZoom(z => Math.max(25, z - 10))}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: 11, minWidth: 36, textAlign: "center" }}>{previewZoom}%</span>
          <button onClick={() => setPreviewZoom(z => Math.min(200, z + 10))}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>
            <ZoomIn size={12} />
          </button>
        </div>

        <button onClick={onClose} style={{ marginLeft: 8, border: "none", background: "none", cursor: "pointer", padding: 4 }}>
          <X size={16} color="#666" />
        </button>
      </div>

      {/* 미리보기 영역 — 실제 문서 콘텐츠를 페이지별로 분할 */}
      <div className="print-preview-content" ref={previewRef}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "20px 0" }}>
        {Array.from({ length: totalPages }, (_, pageIdx) => {
          const scale = previewZoom / 100;
          const clipTop = pageIdx * contentAreaH;
          return (
            <div key={pageIdx} style={{
              width: pageW * scale,
              height: pageH * scale,
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              border: currentPage === pageIdx + 1 ? "2px solid #185ABD" : "1px solid #ddd",
              cursor: "pointer",
            }}
            onClick={() => setCurrentPage(pageIdx + 1)}>
              {/* 콘텐츠 영역: 각 페이지가 문서의 해당 부분을 보여준다 */}
              <div style={{
                position: "absolute",
                top: marginTop * scale,
                left: marginLeft * scale,
                width: contentAreaW * scale,
                height: contentAreaH * scale,
                overflow: "hidden",
              }}>
                <div ref={pageIdx === 0 ? contentRef : undefined}
                  className="ProseMirror"
                  style={{
                    fontSize: `${11}pt`,
                    fontFamily: "'맑은 고딕', 'Malgun Gothic', sans-serif",
                    lineHeight: 1.75,
                    color: "#1a1a1a",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: `${contentAreaW}px`,
                    marginTop: `-${clipTop}px`,
                    pointerEvents: "none",
                  }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
                />
              </div>
              {/* 페이지 번호 */}
              <div style={{
                position: "absolute", bottom: 8 * scale,
                left: 0, right: 0, textAlign: "center",
                fontSize: `${9 * scale}pt`, color: "#aaa",
              }}>- {pageIdx + 1} -</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
