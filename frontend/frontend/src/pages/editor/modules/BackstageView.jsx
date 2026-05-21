/**
 * Backstage View - lucide-react icons
 */
import { useState } from "react";
import {
  ArrowLeft, FilePlus, FolderOpen, Save, SaveAll,
  FileOutput, Printer, Info, FileText,
} from "lucide-react";
import { DOC_TYPES } from "./constants";

export function BackstageView({ doc, setDoc, onClose, onNew, onSave, onExportDocx, onExportPdf, onExportHtml, onExportMarkdown, onExportHwpx, onImportDocx, onPrint }) {
  const [activeMenu, setActiveMenu] = useState("info");

  const menuItems = [
    { id: "new", label: "새로 만들기", icon: <FilePlus size={18} /> },
    { id: "open", label: "열기", icon: <FolderOpen size={18} /> },
    { id: "save", label: "저장", icon: <Save size={18} /> },
    { id: "saveas", label: "다른 이름으로 저장", icon: <SaveAll size={18} /> },
    { id: "export", label: "내보내기", icon: <FileOutput size={18} /> },
    { id: "print", label: "인쇄", icon: <Printer size={18} /> },
    { id: "info", label: "정보", icon: <Info size={18} /> },
  ];

  return (
    <div className="backstage-overlay">
      <div className="backstage-sidebar">
        <button onClick={onClose} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "16px 24px",
          border: "none", background: "rgba(255,255,255,0.08)", color: "#fff",
          fontSize: 14, cursor: "pointer", width: "100%", textAlign: "left",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <ArrowLeft size={16} /> 돌아가기
        </button>

        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#2b5797", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={22} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: 1 }}>Word</span>
        </div>

        <div style={{ flex: 1, paddingTop: 8 }}>
          {menuItems.map(item => (
            <button key={item.id} className={`backstage-menu-item${activeMenu === item.id ? " active" : ""}`}
              onClick={() => {
                setActiveMenu(item.id);
                // Direct action for some items
                if (item.id === "save") { onSave?.(); onClose(); }
                if (item.id === "print") { onPrint?.(); }
              }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="backstage-content">
        {activeMenu === "info" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>정보</h2>
            <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, padding: 24, maxWidth: 520 }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>문서 제목</span>
                <span style={{ fontSize: 18, fontWeight: 500 }}>{doc.title || "제목 없음"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                <div><span style={{ color: "#888" }}>유형:</span> {DOC_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}</div>
                <div><span style={{ color: "#888" }}>상태:</span> {doc.status === "draft" ? "초안" : doc.status === "published" ? "발행" : "보관"}</div>
                <div><span style={{ color: "#888" }}>저자:</span> {doc.author || "미지정"}</div>
                <div><span style={{ color: "#888" }}>중요도:</span> {"★".repeat(doc.importance || 3)}{"☆".repeat(5 - (doc.importance || 3))}</div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === "new" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>새로 만들기</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => { onNew?.(); onClose(); }}
                style={{
                  width: 150, height: 200, border: "2px solid #0078d4", borderRadius: 6,
                  background: "#fff", cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 14, transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,120,212,0.2)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ width: 70, height: 90, border: "1px solid #ccc", borderRadius: 3, background: "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FilePlus size={24} color="#aaa" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>빈 문서</span>
              </button>
            </div>
          </div>
        )}

        {activeMenu === "open" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>열기</h2>
            <button onClick={() => onImportDocx?.()}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                border: "1px solid #ddd", borderRadius: 6, background: "#fff",
                cursor: "pointer", width: 400, fontSize: 13, transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <FolderOpen size={24} color="#555" />
              <div>
                <div style={{ fontWeight: 500 }}>파일에서 열기 (.docx)</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>컴퓨터에서 .docx 파일을 선택합니다</div>
              </div>
            </button>
          </div>
        )}

        {activeMenu === "save" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>저장</h2>
            <button onClick={() => { onSave?.(); onClose(); }}
              style={{
                padding: "12px 28px", fontSize: 14, border: "none", borderRadius: 6,
                background: "#0078d4", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}>
              <Save size={16} /> 지금 저장
            </button>
          </div>
        )}

        {activeMenu === "saveas" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>다른 이름으로 저장</h2>
            <div style={{ maxWidth: 400 }}>
              <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 6 }}>파일 이름:</label>
              <input type="text" value={doc.title || "문서"} onChange={e => setDoc(d => ({ ...d, title: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ccc", borderRadius: 4, fontSize: 14, marginBottom: 12 }} />
              <button onClick={() => { onSave?.(); onClose(); }}
                style={{ padding: "10px 24px", fontSize: 13, border: "none", borderRadius: 6, background: "#0078d4", color: "#fff", cursor: "pointer" }}>저장</button>
            </div>
          </div>
        )}

        {activeMenu === "export" && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>내보내기</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
              {[
                { label: "Word 문서 (.docx)", desc: "서식이 보존된 Microsoft Word 형식", icon: <FileText size={28} color="#2b5797" />, handler: onExportDocx },
                { label: "PDF 문서 (.pdf)", desc: "인쇄용 PDF 형식 (에디터 그대로)", icon: <FileText size={28} color="#c00" />, handler: onExportPdf },
                { label: "한글 문서 (.hwpx)", desc: "한컴오피스 한글 호환 형식", icon: <FileText size={28} color="#00a5e5" />, handler: onExportHwpx },
                { label: "마크다운 (.md)", desc: "텍스트 기반 경량 마크업 형식", icon: <FileText size={28} color="#333" />, handler: onExportMarkdown },
                { label: "HTML 파일 (.html)", desc: "웹 페이지 형식", icon: <FileText size={28} color="#e67e22" />, handler: onExportHtml },
              ].map(item => (
                <button key={item.label} onClick={() => item.handler?.()}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                    border: "1px solid #ddd", borderRadius: 6, background: "#fff",
                    cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  {item.icon}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeMenu === "print" && (
          <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
            {/* 왼쪽: 인쇄 설정 */}
            <div style={{ minWidth: 280 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#333", marginBottom: 28 }}>인쇄</h2>
              <button onClick={() => window.print()}
                style={{ padding: "12px 28px", fontSize: 14, border: "none", borderRadius: 6, background: "#0078d4", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 24, width: "100%" }}>
                <Printer size={16} /> 인쇄
              </button>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>복사본 수</label>
                <input type="number" defaultValue={1} min={1} max={99}
                  style={{ width: 80, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13 }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>프린터</label>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff" }}>
                  <option>기본 프린터</option>
                  <option>Microsoft Print to PDF</option>
                  <option>OneNote로 보내기</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>설정</label>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff", marginBottom: 6 }}>
                  <option>모든 페이지 인쇄</option>
                  <option>현재 페이지 인쇄</option>
                  <option>사용자 지정 범위</option>
                </select>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff", marginBottom: 6 }}>
                  <option>단면 인쇄</option>
                  <option>양면 인쇄 (긴 쪽 넘김)</option>
                  <option>양면 인쇄 (짧은 쪽 넘김)</option>
                </select>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff", marginBottom: 6 }}>
                  <option>한 부씩 인쇄</option>
                  <option>한 부씩 인쇄 안 함</option>
                </select>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff", marginBottom: 6 }}>
                  <option>세로 방향</option>
                  <option>가로 방향</option>
                </select>
                <select style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 13, background: "#fff" }}>
                  <option>A4 (210 × 297mm)</option>
                  <option>Letter (215.9 × 279.4mm)</option>
                  <option>Legal (215.9 × 355.6mm)</option>
                  <option>B5 (176 × 250mm)</option>
                </select>
              </div>
            </div>

            {/* 오른쪽: 인쇄 미리보기 */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 400, height: 566, background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                border: "1px solid #e0e0e0",
                padding: 40,
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{ fontSize: 8, lineHeight: 1.6, color: "#333", fontFamily: "'맑은 고딕', sans-serif" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
                    {doc.title || "문서 제목"}
                  </div>
                  {doc.subtitle && (
                    <div style={{ fontSize: 9, color: "#777", marginBottom: 12 }}>{doc.subtitle}</div>
                  )}
                  <div style={{ fontSize: 7, color: "#555", lineHeight: 1.8 }}>
                    인쇄 미리보기 - 실제 문서 내용이 여기에 표시됩니다.
                    인쇄 버튼을 클릭하면 브라우저의 인쇄 대화상자가 열립니다.
                  </div>
                </div>
                <div style={{
                  position: "absolute", bottom: 20, left: 0, right: 0,
                  textAlign: "center", fontSize: 7, color: "#aaa",
                }}>- 1 -</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: "#888" }}>1 / 1 페이지</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
