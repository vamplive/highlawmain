/**
 * TitleBar — MS Word 365 스타일 상단 제목 표시줄
 * QAT(빠른 실행 도구), 문서 제목, 저장 상태, 문서 속성 버튼
 */
import { memo } from "react";
import { Eye, FilePlus2, Newspaper, Save, Send, Undo2, Redo2, Settings, Moon, Sun } from "lucide-react";

/**
 * @param {object} props
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {object} props.doc - 문서 객체
 * @param {function} props.setDoc - 문서 업데이트 핸들러
 * @param {React.RefObject} props.titleRef - 제목 입력 필드 ref
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {function} props.setDarkMode - 다크 모드 토글
 * @param {string|object} props.saveStatus - 저장 상태 텍스트 또는 상세 상태
 * @param {function} props.handleSave - 저장 핸들러
 * @param {function} props.setMetaOpen - 문서 속성 드로어 열기
 */
export const TitleBar = memo(function TitleBar({
  editor,
  doc,
  setDoc,
  titleRef,
  darkMode,
  setDarkMode,
  saveStatus,
  handleSave,
  handleNew,
  handleNewBlog,
  handlePublishBlog,
  isPublishing,
  onOpenBlogPreview,
  setMetaOpen,
}) {
  const qatBtnStyle = {
    background: "none", border: "none", color: "rgba(255,255,255,0.85)",
    cursor: "pointer", padding: "8px 10px", borderRadius: 4,
    display: "flex", alignItems: "center", lineHeight: 1,
  };

  const handleHover = (e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.18)";
    e.currentTarget.style.color = "#fff";
  };
  const handleLeave = (e) => {
    e.currentTarget.style.background = "none";
    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
  };

  const qatButtons = [
    { icon: <Save size={16} />, title: "저장 (Ctrl+S)", fn: () => handleSave(false) },
    { icon: <Undo2 size={16} />, title: "실행 취소 (Ctrl+Z)", fn: () => editor?.chain().focus().undo().run() },
    { icon: <Redo2 size={16} />, title: "다시 실행 (Ctrl+Y)", fn: () => editor?.chain().focus().redo().run() },
  ];

  const statusMessage = typeof saveStatus === "object" && saveStatus !== null
    ? saveStatus.message || saveStatus.detail || saveStatus.status || ""
    : saveStatus || "";
  const rawStatus = String(statusMessage);
  const statusKey = String(typeof saveStatus === "object" && saveStatus !== null
    ? saveStatus.status || rawStatus
    : rawStatus);

  /** 저장 상태에 따른 표시 텍스트 */
  const statusText = {
    "저장 중...": "⟳ 저장 중...",
    "저장됨": "✓ 저장됨",
    "로컬 저장됨": "↓ 로컬 저장",
    "수정됨": "● 수정됨",
    "오류": "✕ 오류",
    "복원됨": "↺ 복원됨",
    "불러옴": "✓ 불러옴",
    "발행 중...": "⟳ 발행 중...",
    "발행됨": "✓ 발행됨",
    "예약 중...": "⟳ 예약 중...",
    "예약됨": "✓ 예약됨",
    "삭제 중...": "⟳ 삭제 중...",
    "삭제됨": "✓ 삭제됨",
  };
  const isError = statusKey === "오류" || rawStatus.startsWith("오류") || rawStatus.toLowerCase?.().includes("error");
  const displayStatus = statusText[rawStatus]
    || (isError ? `✕ ${rawStatus}` : statusText[statusKey] || rawStatus);

  /** 저장 상태에 따른 색상 */
  const statusColor = isError ? "#ff8888"
    : statusKey === "저장됨" ? "#90EE90"
    : statusKey === "발행됨" ? "#93c5fd"
    : statusKey === "예약됨" ? "#7dd3fc"
    : statusKey === "삭제됨" ? "#fca5a5"
    : statusKey === "수정됨" ? "#ffdd57"
    : "rgba(255,255,255,0.7)";

  const primaryActionStyle = {
    height: 36,
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
    whiteSpace: "nowrap",
    letterSpacing: 0,
  };

  return (
    <div style={{
      minHeight: 48, background: darkMode ? "#1e1e1e" : "#1a2332", display: "flex", alignItems: "center",
      padding: "8px 14px", flexShrink: 0, color: "#fff",
      fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", userSelect: "none",
    }}>
      {/* Quick Access Toolbar (QAT) */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, marginRight: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0 }}>W</span>
        </div>
        {qatButtons.map((btn, i) => (
          <button key={i} type="button" onClick={btn.fn} title={btn.title}
            style={qatBtnStyle}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}>{btn.icon}</button>
        ))}
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 6px" }} />
        <button type="button" onClick={() => setDarkMode(!darkMode)} title="다크 모드"
          style={qatBtnStyle}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />
        <button
          type="button"
          onClick={handleNew}
          title="새 문서 만들기"
          style={{ ...primaryActionStyle, background: "rgba(255,255,255,0.12)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
        >
          <FilePlus2 size={16} />
          새 문서
        </button>
        <button
          type="button"
          onClick={onOpenBlogPreview}
          title="실제 블로그 발행 화면 미리보기"
          style={{ ...primaryActionStyle, background: "rgba(255,255,255,0.12)", marginLeft: 4 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
        >
          <Eye size={16} />
          미리보기
        </button>
        <button
          type="button"
          onClick={handleNewBlog}
          title="블로그 작성 전용 문서 만들기"
          style={{ ...primaryActionStyle, background: "rgba(37,99,235,0.38)", borderColor: "rgba(147,197,253,0.65)", marginLeft: 4 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,0.55)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(37,99,235,0.38)"; }}
        >
          <Newspaper size={16} />
          블로그 글쓰기
        </button>
        <button
          type="button"
          onClick={handlePublishBlog}
          disabled={isPublishing}
          title={doc.documentType === "blog" ? "블로그 게시글 발행 상태로 저장" : "현재 문서를 블로그 게시글로 발행"}
          style={{ ...primaryActionStyle, background: isPublishing ? "#93c5fd" : "#2563eb", borderColor: "#60a5fa", marginLeft: 4, cursor: isPublishing ? "default" : "pointer" }}
          onMouseEnter={e => { if (!isPublishing) e.currentTarget.style.background = "#1d4ed8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = isPublishing ? "#93c5fd" : "#2563eb"; }}
        >
          {doc.documentType === "blog" ? <Send size={16} /> : <Newspaper size={16} />}
          {isPublishing ? "처리 중" : doc.documentType === "blog" ? "발행 저장" : "게시글 발행"}
        </button>
      </div>

      {/* Document Title */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 0 }}>
        <input
          ref={titleRef} type="text"
          value={doc.title ? doc.title + " - Word" : "문서 - Word"}
          onChange={e => {
            const val = e.target.value.replace(/ - Word$/, "");
            setDoc(d => ({ ...d, title: val }));
          }}
          onFocus={e => {
            const end = e.target.value.lastIndexOf(" - Word");
            if (end > 0) e.target.setSelectionRange(0, end);
          }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          style={{
            maxWidth: 480, textAlign: "center", fontSize: 14, fontWeight: 500,
            border: "none", outline: "none", background: "transparent", color: "#fff",
            fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", width: "100%",
            letterSpacing: 0,
          }}
        />
      </div>

      {/* 저장 상태 + 문서 속성 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, minWidth: 0, maxWidth: "38%" }}>
        <span
          title={rawStatus}
          style={{
            minWidth: 0,
            maxWidth: 280,
            fontSize: 13,
            marginRight: 6,
            color: statusColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayStatus}
        </span>
        <button type="button" onClick={() => setMetaOpen(true)} title="문서 속성"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "4px 6px", borderRadius: 2, display: "flex", alignItems: "center" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
});
