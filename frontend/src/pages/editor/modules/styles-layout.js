/**
 * 에디터 레이아웃 스타일 — 페이지 컨테이너, 여백, 페이지네이션,
 * 페이지/구역/단 나누기, 스크롤바, 인쇄, 스플래시, 읽기/개요 모드,
 * 그리기 캔버스, 인쇄 미리보기, 머리글/바닥글 편집 영역 등
 *
 * 색상은 frontend/src/index.css의 :root 에서 정의된
 * --editor-* 디자인 토큰을 var() 로 참조한다.
 */
export const layoutStyles = `
/* ──── Backstage View (Word 365) ──── */
.backstage-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000;
  display: flex; animation: backstageFadeIn 0.15s ease-out;
}
@keyframes backstageFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.backstage-sidebar {
  width: 280px; background: var(--editor-accent); color: #fff; display: flex; flex-direction: column;
  padding: 0; flex-shrink: 0;
}
.backstage-content {
  flex: 1; background: #f3f3f3; padding: 40px 60px; overflow-y: auto;
}
.backstage-menu-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  border: none; background: transparent; color: rgba(255,255,255,0.9);
  font-size: 13px; cursor: pointer; width: 100%; text-align: left;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif; transition: background 0.1s;
}
.backstage-menu-item:hover { background: rgba(255,255,255,0.12); }
.backstage-menu-item.active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600; }

/* ──── Pagination (워드 스타일 페이지 전환) ──── */
.editor-page-area { position: relative; }
.editor-page-area .ProseMirror { min-height: auto !important; }
/* 페이지 전환 시 부드러운 margin 애니메이션 */
.editor-page-area .ProseMirror [data-page-gap] {
  box-sizing: border-box;
}
.editor-page-area .ProseMirror .page-break,
.editor-page-area .ProseMirror .section-break[data-section-type="next-page"] {
  display: none;
}
.editor-page-gap {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  user-select: none;
  pointer-events: auto;
  z-index: 2;
}
.editor-page-gap-surface {
  position: relative;
  flex-shrink: 0;
  background: var(--page-gap-page-bg);
}
.editor-page-gap-surface.footer {
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.04);
}
.editor-page-gap-surface.header {
  box-shadow: inset 0 1px 0 rgba(0,0,0,0.04);
}
.editor-page-gap-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--page-gap-canvas-bg);
  color: var(--page-gap-label);
  font-size: 9px;
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 0.2px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.05);
}
.editor-page-gap-running-text {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9pt;
  color: #b3b3b3;
  font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.editor-page-gap-running-text.footer-text {
  bottom: 4px;
}
.editor-page-gap-running-text.header-text {
  top: 4px;
}
.editor-page-gap-guide {
  position: absolute;
  display: block;
  pointer-events: none;
}
.editor-page-gap-guide.top,
.editor-page-gap-guide.bottom {
  width: 12px;
  height: 1px;
  background: var(--page-gap-guide);
}
.editor-page-gap-guide.left::after,
.editor-page-gap-guide.right::after {
  content: "";
  position: absolute;
  width: 1px;
  height: 12px;
  background: var(--page-gap-guide);
}
.editor-page-gap-guide.top.left::after,
.editor-page-gap-guide.top.right::after {
  top: 0;
}
.editor-page-gap-guide.bottom.left::after,
.editor-page-gap-guide.bottom.right::after {
  bottom: 0;
}
.editor-page-gap-guide.left::after {
  left: 0;
}
.editor-page-gap-guide.right::after {
  right: 0;
}
/* 스크롤 컨테이너 부드러운 스크롤 */
.editor-canvas-scroll {
  scroll-behavior: auto;
}

/* ──── Drag & Drop ──── */
.ProseMirror.drag-over { outline: 2px dashed var(--editor-blue-500) !important; outline-offset: -4px; }

/* 이미지 드롭 오버레이 — 외부 파일 드래그 시 본문 위에 안내 표시 (.ProseMirror는 typography에서 position:relative) */
.ProseMirror .yj-image-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.08);
  border: 3px dashed var(--editor-blue-500);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
  animation: yjDropFade 0.15s ease-out;
}
.ProseMirror .yj-image-drop-overlay-inner {
  background: #fff;
  color: var(--editor-blue-500);
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  font-family: '맑은 고딕', 'Segoe UI', sans-serif;
}
@keyframes yjDropFade {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

/* 플로팅 툴바 — 이미지 모드 (가독성 + 그림자 강조) */
.floating-toolbar.floating-toolbar-image {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  padding: 4px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* ──── Dark Mode — 레이아웃 CSS 변수 ──── */
.word-editor-root.dark-mode {
  --ribbon-bg: #2d2d2d;
  --ribbon-fg: #e0e0e0;
  --ribbon-label: #888;
  --ribbon-sep: #444;
  --ribbon-active-bg: #3a3a5c;
  --ribbon-active-border: var(--editor-dark-accent);
  --ribbon-disabled: #555;
  --ribbon-input-bg: #383838;
  --ribbon-input-border: #555;
}

/* ──── Print styles ──── */
@media print {
  /* Hide all UI elements */
  .word-editor-root > *:not(.editor-canvas-scroll):not([class*="editor-page"]) { display: none !important; }
  .word-editor-root { display: block !important; height: auto !important; overflow: visible !important; }

  /* Hide sidebar, ribbon, tabs, status bar, nav pane, meta drawer */
  .word-tab-btn, .word-ribbon-btn, .ribbon-collapse-btn { display: none !important; }
  .floating-toolbar { display: none !important; }
  .page-header-area input, .page-footer-area input { border: none !important; }

  /* Page area */
  .editor-page-area {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    min-height: auto !important;
    page-break-after: always;
  }
  .editor-canvas-scroll {
    background: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Handle page breaks */
  .ProseMirror hr { page-break-after: always; border: none !important; }
  .ProseMirror { min-height: auto !important; }

  /* Avoid breaking inside certain elements */
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { page-break-after: avoid; }
  .ProseMirror table { page-break-inside: avoid; }
  .ProseMirror img { page-break-inside: avoid; }
  .ProseMirror blockquote { page-break-inside: avoid; }
}

/* ──── Splash / Loading screen (Word 365) ──── */
.editor-splash {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--editor-accent);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 10000; color: #fff;
  animation: splashFadeIn 0.3s ease-out;
}
.editor-splash .logo { font-size: 42px; font-weight: 700; letter-spacing: -2px; margin-bottom: 8px; }
.editor-splash .subtitle { font-size: 14px; opacity: 0.85; letter-spacing: 1px; }
.editor-splash .loading-bar {
  width: 200px; height: 2px; background: rgba(255,255,255,0.2);
  margin-top: 24px; border-radius: 1px; overflow: hidden;
}
.editor-splash .loading-bar::after {
  content: ""; display: block; width: 40%; height: 100%;
  background: rgba(255,255,255,0.8); border-radius: 1px;
  animation: splashLoad 1.2s ease-in-out infinite;
}
@keyframes splashFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes splashLoad {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(350%); }
}

/* ══════════════════════════════════════════════════
   Page Break / Section Break / Column Break
   ══════════════════════════════════════════════════ */

/* 페이지 나누기 */
.ProseMirror .page-break {
  page-break-after: always;
  break-after: page;
  display: block;
  height: 0;
  border: none;
  border-top: 2px dashed #c0c0c0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .page-break::after {
  content: "페이지 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #999;
  letter-spacing: 1px;
}

/* 구역 나누기 */
.ProseMirror .section-break {
  display: block;
  border: none;
  border-top: 2px dashed #a0a0a0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .section-break::after {
  content: "구역 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #888;
  letter-spacing: 1px;
}

/* 단 나누기 */
.ProseMirror .column-break {
  break-after: column;
  display: block;
  border-top: 1px dashed #ccc;
  margin: 12px 0;
  position: relative;
}
.ProseMirror .column-break::after {
  content: "단 나누기";
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: #fff; padding: 0 8px; font-size: 9px; color: #aaa;
}

/* ══════════════════════════════════════════════════
   그리기 캔버스 오버레이
   ══════════════════════════════════════════════════ */
.drawing-canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  cursor: crosshair;
}
.drawing-canvas-overlay svg {
  width: 100%;
  height: 100%;
}

/* ══════════════════════════════════════════════════
   커스텀 스크롤바 (Word 365 스타일)
   ══════════════════════════════════════════════════ */
.editor-canvas-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.editor-canvas-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 3px solid #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-track {
  background: #2d2d2d;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-color: #2d2d2d;
}

/* ══════════════════════════════════════════════════
   인쇄 미리보기 오버레이
   ══════════════════════════════════════════════════ */
.print-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #f3f3f3;
  z-index: 5000;
  display: flex;
  flex-direction: column;
}
.print-preview-toolbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}
.print-preview-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #e8e8e8;
}

/* ══════════════════════════════════════════════════
   Header / Footer Editing Area (머리글/바닥글)
   ══════════════════════════════════════════════════ */

.header-footer-edit-area {
  width: 100%;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px dashed transparent;
  font-size: 9pt;
  color: #888;
  cursor: text;
  transition: border-color 0.2s;
}
.header-footer-edit-area:hover {
  border-color: #c0c0c0;
}
.header-footer-edit-area:focus-within {
  border-color: var(--editor-blue-500);
  outline: none;
}
.header-footer-edit-area.header {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 8px;
}
.header-footer-edit-area.footer {
  border-top: 1px solid #e5e5e5;
  margin-top: 8px;
}
.header-footer-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #bbb;
  background: #fff;
  padding: 0 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ══════════════════════════════════════════════════
   Reading Mode (읽기 모드)
   ══════════════════════════════════════════════════ */

.editor-reading-mode .ProseMirror {
  max-width: 700px;
  margin: 0 auto;
  font-size: 12pt;
  line-height: 2;
}
.editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* ══════════════════════════════════════════════════
   Outline View (개요 보기)
   ══════════════════════════════════════════════════ */

.editor-outline-mode .ProseMirror p:not(h1):not(h2):not(h3):not(h4) {
  display: none;
}
.editor-outline-mode .ProseMirror h1,
.editor-outline-mode .ProseMirror h2,
.editor-outline-mode .ProseMirror h3,
.editor-outline-mode .ProseMirror h4 {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
}
.editor-outline-mode .ProseMirror h1:hover,
.editor-outline-mode .ProseMirror h2:hover,
.editor-outline-mode .ProseMirror h3:hover,
.editor-outline-mode .ProseMirror h4:hover {
  background: var(--editor-blue-eff6ff);
}

/* ══════════════════════════════════════════════════
   Dark Mode — 레이아웃 오버라이드
   ══════════════════════════════════════════════════ */

/* 페이지/구역/단 나누기 다크모드 */
.word-editor-root.dark-mode .ProseMirror .page-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .page-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .section-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .section-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .column-break {
  border-top-color: #444;
}
.word-editor-root.dark-mode .ProseMirror .column-break::after {
  background: #2d2d2d;
  color: #666;
}

/* 머리글/바닥글 다크모드 */
.word-editor-root.dark-mode .header-footer-edit-area {
  color: #999;
}
.word-editor-root.dark-mode .header-footer-edit-area:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .header-footer-edit-area:focus-within {
  border-color: var(--editor-dark-accent);
}
.word-editor-root.dark-mode .header-footer-edit-area.header {
  border-bottom-color: #444;
}
.word-editor-root.dark-mode .header-footer-edit-area.footer {
  border-top-color: #444;
}
.word-editor-root.dark-mode .header-footer-label {
  background: #2d2d2d;
  color: #666;
}

/* 읽기 모드 다크모드 */
.word-editor-root.dark-mode .editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* 개요 보기 다크모드 */
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h1:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h2:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h3:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h4:hover {
  background: #2a2a3a;
}

/* ── Print: 새 요소 인쇄 처리 ── */
@media print {
  .ProseMirror .page-break { border-top: none !important; }
  .ProseMirror .page-break::after { display: none; }
  .ProseMirror .section-break { border-top: none !important; }
  .ProseMirror .section-break::after { display: none; }
  .ProseMirror .column-break { border-top: none !important; }
  .ProseMirror .column-break::after { display: none; }
  .ProseMirror .bookmark-anchor { border-left: none !important; }
  .ProseMirror .bookmark-anchor::before { display: none; }
  .track-change-balloon { display: none !important; }
  .editor-status-bar { display: none !important; }
  .header-footer-label { display: none !important; }
}
`;
