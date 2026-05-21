/**
 * RibbonBar — MS Word 365 스타일 리본 탭 네비게이션 + 활성 탭 콘텐츠 렌더링
 * EditorPage에서 분리된 리본 메뉴 영역 (탭 버튼 + 탭별 콘텐츠 패널)
 * 비활성 탭은 lazy load하여 초기 번들 크기를 줄인다.
 */
import { memo, lazy, Suspense, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { HomeTab } from "./HomeTab";
import { BlogPreviewButton, BlogReadyBadge } from "./BlogPublishingTools";

/* 자주 사용하지 않는 탭은 lazy load */
const InsertTab = lazy(() => import("./InsertTab").then(m => ({ default: m.InsertTab })));
const DrawTab = lazy(() => import("./DrawTab").then(m => ({ default: m.DrawTab })));
const DesignTab = lazy(() => import("./DesignTab").then(m => ({ default: m.DesignTab })));
const LayoutTab = lazy(() => import("./LayoutTab").then(m => ({ default: m.LayoutTab })));
const ReferencesTab = lazy(() => import("./ReferencesTab").then(m => ({ default: m.ReferencesTab })));
const ReviewTab = lazy(() => import("./ReviewTab").then(m => ({ default: m.ReviewTab })));
const ViewTab = lazy(() => import("./ViewTab").then(m => ({ default: m.ViewTab })));
const FindReplaceBar = lazy(() => import("./FindReplaceBar").then(m => ({ default: m.FindReplaceBar })));

/** 리본 탭 정의 */
const RIBBON_TABS = [
  { id: "file", label: "파일", isFile: true },
  { id: "home", label: "홈" },
  { id: "insert", label: "삽입" },
  { id: "draw", label: "그리기" },
  { id: "design", label: "디자인" },
  { id: "layout", label: "레이아웃" },
  { id: "references", label: "참조" },
  { id: "review", label: "검토" },
  { id: "view", label: "보기" },
];

/** lazy 컴포넌트 로딩 중 빈 공간 표시 */
const TabFallback = () => (
  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }} />
);

/**
 * @param {object} props
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {object} props.doc - 현재 문서
 * @param {string} props.activeTab - 현재 활성 탭 ID
 * @param {function} props.setActiveTab - 탭 변경 핸들러
 * @param {boolean} props.ribbonCollapsed - 리본 접힘 상태
 * @param {function} props.setRibbonCollapsed - 리본 접힘 토글
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {string} props.viewMode - 보기 모드 (edit/preview/web)
 * @param {function} props.setShowBackstage - 파일 탭 클릭 시 백스테이지 열기
 * @param {string|null} props.findBarMode - 찾기/바꾸기 바 모드
 * @param {function} props.setFindBarMode - 찾기/바꾸기 모드 설정
 * @param {function} props.setDialogOpen - 다이얼로그 열기 핸들러
 * @param {object} props.layoutProps - 레이아웃 탭에 전달할 속성들
 * @param {object} props.designProps - 디자인 탭에 전달할 속성들
 * @param {object} props.referencesProps - 참조 탭에 전달할 속성들
 * @param {object} props.reviewProps - 검토 탭에 전달할 속성들
 * @param {object} props.viewProps - 보기 탭에 전달할 속성들
 * @param {object} props.drawProps - 그리기 탭/캔버스 공유 상태
 */
export const RibbonBar = memo(function RibbonBar({
  editor,
  doc,
  activeTab, setActiveTab,
  ribbonCollapsed, setRibbonCollapsed,
  darkMode,
  viewMode,
  setShowBackstage,
  findBarMode, setFindBarMode,
  setDialogOpen,
  onNew,
  onNewBlog,
  onPublishBlog,
  isPublishing,
  layoutProps,
  designProps,
  referencesProps,
  reviewProps,
  viewProps,
  drawProps,
  blogPublishStatus,
  onOpenBlogPreview,
  onOpenMeta,
  onSwitchToSimpleBlog,
}) {
  const isBlogMode = doc?.documentType === "blog";
  const tabs = useMemo(() => {
    if (!isBlogMode) return RIBBON_TABS;
    return RIBBON_TABS.filter((tab) => ["file", "home", "insert", "view"].includes(tab.id));
  }, [isBlogMode]);

  useEffect(() => {
    if (tabs.some((tab) => tab.id === activeTab)) return;
    setActiveTab("home");
    setRibbonCollapsed(false);
  }, [activeTab, setActiveTab, setRibbonCollapsed, tabs]);

  return (
    <>
      {/* ═══ Ribbon Tabs (MS Word 365 스타일) ═══ */}
      <div style={{
        height: 44, background: darkMode ? "#2d2d2d" : "#f3f3f3",
        borderBottom: "none",
        display: "flex", alignItems: "stretch", padding: "0 4px 0 0", flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id} className="word-tab-btn"
            onClick={() => {
              if (tab.id === "file") return setShowBackstage(true);
              if (activeTab === tab.id) return setRibbonCollapsed(!ribbonCollapsed);
              setActiveTab(tab.id);
              setRibbonCollapsed(false);
            }}
            style={{
              padding: "0 18px", border: "none", borderBottom: "none",
              background: tab.isFile
                ? (darkMode ? "#0078D4" : "#1a2332")
                : activeTab === tab.id && !ribbonCollapsed
                  ? (darkMode ? "#3a3a3a" : "#ffffff")
                  : "transparent",
              color: tab.isFile
                ? "#fff"
                : activeTab === tab.id && !ribbonCollapsed
                  ? (darkMode ? "#fff" : "#1a2332")
                  : (darkMode ? "#ccc" : "#444"),
              fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: "pointer",
              fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
              display: "flex", alignItems: "center",
              borderTop: activeTab === tab.id && !ribbonCollapsed && !tab.isFile
                ? `2px solid ${darkMode ? "#0078D4" : "#1a2332"}`
                : "2px solid transparent",
              marginTop: 2,
              borderRadius: 0,
              letterSpacing: 0.3,
              transition: "color 0.1s, background 0.1s",
            }}
          >{tab.label}</button>
        ))}
        {isBlogMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
            <span
              title="블로그 작성 모드"
              style={{
                padding: "2px 6px",
                border: "1px solid #bfdbfe",
                borderRadius: 3,
                background: darkMode ? "rgba(37,99,235,0.18)" : "#dbeafe",
                color: darkMode ? "#bfdbfe" : "#1d4ed8",
                fontSize: 10,
                lineHeight: "14px",
                whiteSpace: "nowrap",
              }}
            >
              Blog
            </span>
            {blogPublishStatus && <BlogReadyBadge status={blogPublishStatus} darkMode={darkMode} />}
            <BlogPreviewButton onClick={onOpenBlogPreview} />
            <button
              type="button"
              onClick={onOpenMeta}
              title="블로그 메타데이터 및 SEO"
              style={{
                height: 28,
                width: 30,
                border: "1px solid #cbd5e1",
                borderRadius: 3,
                background: darkMode ? "#3a3a3a" : "#fff",
                color: darkMode ? "#e5e7eb" : "#1f2937",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings2 size={14} />
            </button>
            {onSwitchToSimpleBlog && (
              <button
                type="button"
                onClick={onSwitchToSimpleBlog}
                title="네이버 블로그 스타일 단순 에디터로 전환"
                style={{
                  height: 28,
                  padding: "0 10px",
                  border: "1px solid #1a3a6b",
                  borderRadius: 3,
                  background: darkMode ? "rgba(26,58,107,0.18)" : "#eef2ff",
                  color: darkMode ? "#bfdbfe" : "#1a3a6b",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                단순 모드
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {/* 리본 접기/펼치기 버튼 */}
        <button type="button" onClick={() => setRibbonCollapsed(!ribbonCollapsed)}
          title={ribbonCollapsed ? "리본 표시 (Ctrl+F1)" : "리본 최소화 (Ctrl+F1)"}
          style={{
            padding: "0 8px", border: "none", background: "transparent",
            color: darkMode ? "#888" : "#666", cursor: "pointer",
            display: "flex", alignItems: "center", fontSize: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#e5f1fb"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          {ribbonCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* ═══ Ribbon Content ═══ */}
      <Suspense fallback={<TabFallback />}>
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "home" && (
          <HomeTab editor={editor}
            onNew={onNew}
            onNewBlog={onNewBlog}
            onPublishBlog={onPublishBlog}
            isPublishing={isPublishing}
            onOpenBlogPreview={onOpenBlogPreview}
            onShowFind={() => setFindBarMode("find")}
            onShowReplace={() => setFindBarMode("replace")}
            onOpenFontDialog={() => setDialogOpen("font")}
            onOpenParagraphDialog={() => setDialogOpen("paragraph")}
            onOpenBorderDialog={() => setDialogOpen("border")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "insert" && (
          <InsertTab editor={editor}
            onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
            onOpenImageDialog={() => setDialogOpen("image")}
            onOpenBookmarkDialog={() => setDialogOpen("bookmark")}
            onOpenCrossRefDialog={() => setDialogOpen("crossref")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "draw" && (
          <DrawTab editor={editor} {...drawProps} />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "design" && (
          <DesignTab {...designProps}
            onOpenPageBorderDialog={() => setDialogOpen("pageborder")}
            onOpenWatermarkDialog={() => setDialogOpen("watermark")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "layout" && (
          <LayoutTab {...layoutProps}
            onOpenPageSetupDialog={() => setDialogOpen("pagesetup")} editor={editor}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "references" && (
          <ReferencesTab editor={editor} {...referencesProps}
            onOpenFootnoteDialog={() => setDialogOpen("footnoteendnote")} />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "review" && (
          <ReviewTab editor={editor} {...reviewProps} />
        )}
        {!ribbonCollapsed && activeTab === "view" && (
          <ViewTab {...viewProps} />
        )}

        {findBarMode && <FindReplaceBar editor={editor} showReplace={findBarMode === "replace"} onClose={() => setFindBarMode(null)} />}
      </Suspense>
    </>
  );
});
