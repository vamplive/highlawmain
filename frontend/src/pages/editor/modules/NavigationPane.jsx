/**
 * Navigation Pane - 문서 구조 탐색 창
 * 제목 탭: 문서의 제목(heading)을 계층적으로 보여준다.
 * 페이지 탭: 문서를 페이지 단위로 미리보기/탐색한다.
 * 검색 결과 탭: 검색 결과를 문맥과 함께 보여준다.
 */
import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * @param {{ editor: import("@tiptap/react").Editor, onClose: Function }} props
 */
export function NavigationPane({ editor, onClose }) {
  const [activeTab, setActiveTab] = useState("headings"); // "headings" | "pages" | "results"
  const [headings, setHeadings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    updateHeadings();
    editor.on("update", updateHeadings);
    return () => editor.off("update", updateHeadings);
  }, [editor]);

  const filteredHeadings = useMemo(() => {
    if (!searchText) return headings;
    return headings.filter(h => h.text.toLowerCase().includes(searchText.toLowerCase()));
  }, [headings, searchText]);

  /* 검색어로 문서 내 텍스트 검색 */
  const handleSearch = useCallback((text) => {
    setSearchText(text);
    if (!text || !editor) { setSearchResults([]); return; }
    const results = [];
    const searchStr = text.toLowerCase();
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return;
      const nodeText = node.text;
      const lowerText = nodeText.toLowerCase();
      let idx = lowerText.indexOf(searchStr);
      while (idx !== -1) {
        // 문맥: 매칭 주변 30자
        const contextStart = Math.max(0, idx - 20);
        const contextEnd = Math.min(nodeText.length, idx + text.length + 20);
        const before = nodeText.substring(contextStart, idx);
        const match = nodeText.substring(idx, idx + text.length);
        const after = nodeText.substring(idx + text.length, contextEnd);
        results.push({
          from: pos + idx,
          to: pos + idx + text.length,
          before: (contextStart > 0 ? "..." : "") + before,
          match,
          after: after + (contextEnd < nodeText.length ? "..." : ""),
        });
        idx = lowerText.indexOf(searchStr, idx + 1);
      }
    });
    setSearchResults(results);
    if (results.length > 0 && text.length >= 2) {
      setActiveTab("results");
    }
  }, [editor]);

  const scrollToPos = (pos) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    const domPos = editor.view.domAtPos(pos);
    if (domPos?.node) {
      const el = domPos.node.nodeType === Node.TEXT_NODE ? domPos.node.parentElement : domPos.node;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const scrollToRange = (from, to) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from, to }).run();
    editor.commands.scrollIntoView();
  };

  /* 페이지 단위 정보 수집 (문단 수, 텍스트 미리보기 등) */
  const pageBlocks = useMemo(() => {
    if (!editor) return [];
    const blocks = [];
    let currentText = "";
    let blockCount = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph" || node.type.name === "heading") {
        blockCount++;
        const text = node.textContent;
        if (currentText.length < 200) {
          currentText += text + " ";
        }
        // 대략 페이지별로 30개 블록을 한 그룹으로
        if (blockCount % 30 === 0) {
          blocks.push({ preview: currentText.trim().substring(0, 120), startPos: pos, blockCount });
          currentText = "";
        }
      }
    });
    // 남은 블록
    if (currentText.trim()) {
      blocks.push({ preview: currentText.trim().substring(0, 120), startPos: 0, blockCount });
    }
    return blocks.length > 0 ? blocks : [{ preview: "(빈 문서)", startPos: 0, blockCount: 0 }];
    // headings는 직접 사용하지 않지만 문서 변경을 감지하기 위한 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, headings]);

  const tabStyle = (isActive) => ({
    flex: 1, padding: "6px 0", fontSize: 10, border: "none",
    borderBottom: isActive ? "2px solid #0078d4" : "2px solid transparent",
    background: "transparent",
    color: isActive ? "#0078d4" : "#888",
    cursor: "pointer",
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <div style={{
      width: 220, flexShrink: 0, background: "#f8f9fa", borderRight: "1px solid #e0e0e0",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'맑은 고딕', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 10px", borderBottom: "1px solid #e0e0e0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>탐색</span>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#999", padding: "0 2px" }}>
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid #e0e0e0" }}>
        <input
          type="text"
          placeholder="문서 검색..."
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && searchResults.length > 0) scrollToRange(searchResults[0].from, searchResults[0].to); }}
          style={{
            width: "100%", padding: "4px 8px", fontSize: 11,
            border: "1px solid #d5d5d5", borderRadius: 3, outline: "none",
            boxSizing: "border-box",
          }}
        />
        {searchText && (
          <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
            {searchResults.length}개 결과
          </div>
        )}
      </div>

      {/* Tab buttons */}
      <div style={{
        display: "flex", borderBottom: "1px solid #e0e0e0", background: "#fff",
      }}>
        <button onClick={() => setActiveTab("headings")} style={tabStyle(activeTab === "headings")}>
          제목
        </button>
        <button onClick={() => setActiveTab("pages")} style={tabStyle(activeTab === "pages")}>
          페이지
        </button>
        {searchResults.length > 0 && (
          <button onClick={() => setActiveTab("results")} style={tabStyle(activeTab === "results")}>
            결과
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {/* 제목 탭 */}
        {activeTab === "headings" && (
          <>
            {filteredHeadings.length === 0 && (
              <div style={{ padding: "16px 12px", fontSize: 11, color: "#999", textAlign: "center" }}>
                {searchText ? "검색 결과 없음" : "문서에 제목이 없습니다.\n제목 스타일을 적용하세요."}
              </div>
            )}
            {filteredHeadings.map((h, i) => (
              <button key={i} type="button" onClick={() => scrollToPos(h.pos)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: `4px 10px 4px ${10 + (h.level - 1) * 14}px`,
                  border: "none", background: "transparent",
                  fontSize: h.level === 1 ? 12 : h.level === 2 ? 11 : 10,
                  fontWeight: h.level <= 2 ? 600 : 400,
                  color: h.level === 1 ? "#1e3a5f" : h.level === 2 ? "#333" : "#555",
                  cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", fontFamily: "'맑은 고딕', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {h.text || "(빈 제목)"}
              </button>
            ))}
          </>
        )}

        {/* 페이지 탭 */}
        {activeTab === "pages" && (
          <div style={{ padding: "4px 0" }}>
            {pageBlocks.map((page, i) => (
              <button key={i} type="button" onClick={() => scrollToPos(page.startPos)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 10px", border: "none", background: "transparent",
                  cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* 미니 페이지 아이콘 */}
                  <div style={{
                    width: 32, height: 42, border: "1px solid #ccc", borderRadius: 2,
                    background: "#fff", flexShrink: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#185ABD" }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>
                      페이지 {i + 1}
                    </div>
                    <div style={{
                      fontSize: 9, color: "#888", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: 130,
                    }}>
                      {page.preview || "(빈 페이지)"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 검색 결과 탭 */}
        {activeTab === "results" && (
          <div style={{ padding: "4px 0" }}>
            {searchResults.length === 0 && (
              <div style={{ padding: "16px 12px", fontSize: 11, color: "#999", textAlign: "center" }}>
                검색 결과 없음
              </div>
            )}
            {searchResults.map((r, i) => (
              <button key={i} type="button" onClick={() => scrollToRange(r.from, r.to)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "6px 10px", border: "none", background: "transparent",
                  cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                  fontSize: 11, color: "#333",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ color: "#888" }}>{r.before}</span>
                <span style={{ background: "#fff3cd", fontWeight: 600 }}>{r.match}</span>
                <span style={{ color: "#888" }}>{r.after}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "6px 10px", borderTop: "1px solid #e0e0e0",
        fontSize: 10, color: "#999",
      }}>
        {activeTab === "headings" && `${headings.length}개 제목`}
        {activeTab === "pages" && `${pageBlocks.length}개 페이지`}
        {activeTab === "results" && `${searchResults.length}개 결과`}
      </div>
    </div>
  );
}
