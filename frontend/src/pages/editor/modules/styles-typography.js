/**
 * 에디터 타이포그래피 스타일 — ProseMirror 본문, 제목, 텍스트 서식,
 * 각주/미주, 변경 추적 텍스트, 드롭캡, 북마크, 필드 노드 등
 *
 * 색상은 frontend/src/index.css의 :root 에서 정의된
 * --editor-* 디자인 토큰을 var() 로 참조한다.
 */
export const typographyStyles = `
/* ──── ProseMirror Core ──── */
.ProseMirror {
  outline: none;
  min-height: 200px;
  position: relative;
  font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  font-size: 11pt;
  line-height: 1.75;
  color: #1a1a1a;
  caret-color: #000;
}
.ProseMirror h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.ProseMirror h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
.ProseMirror h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
.ProseMirror h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
.ProseMirror p { margin: 6px 0; }
.ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
.ProseMirror li { margin: 3px 0; }
.ProseMirror blockquote { border-left: 3px solid var(--editor-blue-500); margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; font-style: italic; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.ProseMirror th, .ProseMirror td { border: 1px solid #ccc; padding: 6px 10px; font-size: 10pt; min-width: 80px; }
.ProseMirror th { background: var(--editor-blue-f1f5f9); font-weight: 600; }
.ProseMirror .selectedCell { background: rgba(59,130,246,0.1); }
.ProseMirror code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; font-size: 0.9em; font-family: 'Courier New', monospace; }
.ProseMirror pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; font-size: 10pt; overflow-x: auto; margin: 12px 0; }
.ProseMirror pre code { background: none; padding: 0; }
.ProseMirror hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
.ProseMirror a { color: var(--editor-blue-500); text-decoration: underline; }
.ProseMirror img { max-width: 100%; cursor: pointer; }
.ProseMirror img.ProseMirror-selectednode { outline: 2px solid var(--editor-blue-500); }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #ccc;
  float: left;
  pointer-events: none;
  height: 0;
}
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: baseline; gap: 6px; }
.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] { margin: 0; cursor: pointer; }
.ProseMirror .tableWrapper { overflow-x: auto; margin: 12px 0; }
.ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: var(--editor-blue-500); cursor: col-resize; z-index: 20; }

/* ──── Selection Highlighting ──── */
.ProseMirror ::selection { background: var(--editor-accent-selection); }
.ProseMirror .ProseMirror-gapcursor { display: none; pointer-events: none; position: relative; }

/* ──── Image resize handles ──── */
.ProseMirror img { cursor: pointer; transition: outline 0.1s; border-radius: 2px; }
.ProseMirror img:hover { outline: 2px solid rgba(59,130,246,0.3); }
.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid var(--editor-blue-500);
  box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
}

/* ──── ResizableImage NodeView ──── */
.ProseMirror figure.yj-image-nodeview {
  position: relative;
  display: block;
  margin: 12px 0;
  max-width: 100%;
}
.ProseMirror figure.yj-image-nodeview img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 2px;
  user-select: none;
}
.ProseMirror figure.yj-image-nodeview.is-selected {
  outline: 2px solid var(--editor-blue-500);
  outline-offset: 2px;
}
.ProseMirror figure.yj-image-nodeview.is-resizing {
  outline: 2px dashed var(--editor-blue-500);
  outline-offset: 2px;
  user-select: none;
}

/* 정렬 (편집 시 미리보기) */
.ProseMirror figure.yj-image-left { float: left; margin: 6px 16px 6px 0; max-width: 60%; }
.ProseMirror figure.yj-image-right { float: right; margin: 6px 0 6px 16px; max-width: 60%; }
.ProseMirror figure.yj-image-center { margin-left: auto; margin-right: auto; text-align: center; }
.ProseMirror figure.yj-image-full { width: 100% !important; }
.ProseMirror figure.yj-image-full img { width: 100%; }
.ProseMirror figure.yj-image-rounded img { border-radius: 14px; }
.ProseMirror figure.yj-image-bordered img { border: 2px solid #d6c8a4; padding: 4px; background: #fff; }

/* 코너 리사이즈 핸들 — 선택 상태에서만 보임 */
.ProseMirror figure.yj-image-nodeview .yj-image-handle {
  position: absolute;
  width: 12px; height: 12px;
  background: #fff;
  border: 2px solid var(--editor-blue-500);
  border-radius: 2px;
  z-index: 10;
  display: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.ProseMirror figure.yj-image-nodeview.is-selected .yj-image-handle,
.ProseMirror figure.yj-image-nodeview.is-resizing .yj-image-handle {
  display: block;
}
.ProseMirror figure.yj-image-nodeview .yj-image-handle-nw { top: -7px; left: -7px; cursor: nwse-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-ne { top: -7px; right: -7px; cursor: nesw-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-sw { bottom: -7px; left: -7px; cursor: nesw-resize; }
.ProseMirror figure.yj-image-nodeview .yj-image-handle-se { bottom: -7px; right: -7px; cursor: nwse-resize; }

/* 캡션 (편집 가능) */
.ProseMirror figure.yj-image-nodeview figcaption {
  margin-top: 8px;
  font-size: 0.88em;
  color: #6b7280;
  text-align: center;
  outline: none;
  min-height: 1em;
  padding: 2px 4px;
  border-radius: 2px;
}
.ProseMirror figure.yj-image-nodeview figcaption:empty::before {
  content: attr(data-placeholder);
  color: #c8c8c8;
  font-style: italic;
}
.ProseMirror figure.yj-image-nodeview.is-caption-editing figcaption {
  background: rgba(59,130,246,0.06);
  outline: 1px dashed var(--editor-blue-500);
}

/* float 해제 — 다음 블록이 이미지 옆으로 흘러내리지 않도록 */
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3,
.ProseMirror blockquote, .ProseMirror hr,
.ProseMirror table { clear: both; }

/* ──── 향상된 테이블 스타일 ──── */
.ProseMirror table.resize-cursor {
  cursor: col-resize;
}
.ProseMirror .selectedCell::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.08);
  pointer-events: none;
  z-index: 2;
}

/* ══════════════════════════════════════════════════
   Footnote / Endnote System (MS Word 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 각주 참조 (위첨자) */
.ProseMirror .footnote-ref {
  color: var(--editor-link);
  cursor: pointer;
  font-size: 0.75em;
  vertical-align: super;
  font-weight: 600;
  padding: 0 1px;
  transition: background 0.15s, color 0.15s;
  border-radius: 2px;
  text-decoration: none;
}
.ProseMirror .footnote-ref:hover,
.ProseMirror .footnote-ref.footnote-ref-hover {
  background: var(--editor-link-bg-hover);
  color: var(--editor-link-hover);
}
@keyframes footnoteFlash {
  0%, 100% { background: transparent; }
  25%, 75% { background: #fef3c7; }
}
.ProseMirror .footnote-ref.footnote-ref-flash {
  animation: footnoteFlash 1.5s ease;
}

/* 각주 툴팁 */
.footnote-tooltip {
  position: fixed;
  z-index: 9999;
  background: #1f2937;
  color: #f3f4f6;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  max-width: 320px;
  line-height: 1.5;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}

/* 페이지 하단 각주 영역 */
.footnote-area {
  position: relative;
  margin-top: 20px;
  padding-top: 8px;
}
.paged-footnote-area {
  position: static;
  margin: 0;
  padding: 0;
}
.footnote-separator {
  width: 33%;
  height: 0;
  border-top: 1px solid #999;
  margin-bottom: 8px;
}
.footnote-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.footnote-area-label,
.footnote-page-label {
  font-size: 9px;
  color: #777;
  margin: 2px 0 3px;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
.footnote-page-group + .footnote-page-group {
  margin-top: 8px;
}
.paged-footnote-area .footnote-page-group {
  background: inherit;
  z-index: 3;
}
.paged-footnote-area .footnote-page-group + .footnote-page-group {
  margin-top: 0;
}
.blog-editor-footnote-area {
  margin-top: 28px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}
.footnote-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 2px 0;
  font-size: 9pt;
  line-height: 1.4;
  position: relative;
  transition: background 0.3s;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
@keyframes footnoteItemFlash {
  0%, 100% { background: transparent; }
  20%, 80% { background: #fff3cd; }
}
.footnote-item.footnote-item-flash {
  animation: footnoteItemFlash 2s ease;
}
.footnote-item:hover {
  background: #f8fafc;
}
.footnote-item-editing {
  background: #fffef5 !important;
}
.footnote-item-number {
  color: var(--editor-link);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8em;
  vertical-align: super;
  min-width: 18px;
  flex-shrink: 0;
  user-select: none;
  text-align: right;
  padding-right: 2px;
  line-height: 1.2;
}
.footnote-item-number:hover {
  text-decoration: underline;
  color: var(--editor-link-hover);
}
.footnote-item-content {
  flex: 1;
  color: #333;
  min-height: 16px;
}
.footnote-item-text {
  cursor: text;
  display: inline-block;
  min-height: 14px;
  min-width: 40px;
  white-space: pre-wrap;
}
.footnote-item-text:hover {
  background: #f0f7ff;
  border-radius: 2px;
}
.footnote-edit-input {
  width: 100%;
  min-height: 42px;
  resize: vertical;
  border: none;
  border-bottom: 1.5px solid var(--editor-link);
  outline: none;
  font-size: 9pt;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
  padding: 1px 2px;
  background: transparent;
  color: #333;
  line-height: 1.4;
}
.footnote-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 10px;
  padding: 0 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  line-height: 1;
  margin-top: 1px;
}
.footnote-item:hover .footnote-delete-btn {
  opacity: 0.5;
}
.footnote-delete-btn:hover {
  opacity: 1 !important;
  color: var(--editor-track-delete) !important;
}

/* 미주 영역 */
.endnote-area {
  margin-top: 32px;
  padding-top: 8px;
}
.endnote-separator {
  width: 100%;
  height: 0;
  border-top: 2px solid #999;
  margin-bottom: 8px;
}
.endnote-header {
  font-size: 11pt;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
.endnote-number {
  color: var(--editor-endnote-purple);
}

/* ══════════════════════════════════════════════════
   변경 내용 추적 (Track Changes) — 인라인 텍스트
   ══════════════════════════════════════════════════ */

/* 삽입된 텍스트 */
.ProseMirror span.track-insert {
  color: var(--editor-track-insert);
  text-decoration: underline;
  text-decoration-color: var(--editor-track-insert);
  text-decoration-style: solid;
  background: rgba(22, 163, 74, 0.06);
  border-bottom: none;
  position: relative;
  cursor: pointer;
}
.ProseMirror span.track-insert:hover {
  background: rgba(22, 163, 74, 0.12);
}
.ProseMirror span.track-insert::after {
  content: attr(data-author);
  position: absolute;
  bottom: calc(100% + 2px);
  left: 0;
  background: var(--editor-track-insert);
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 50;
}
.ProseMirror span.track-insert:hover::after {
  opacity: 1;
}

/* 삭제된 텍스트 */
.ProseMirror span.track-delete {
  color: var(--editor-track-delete);
  text-decoration: line-through;
  text-decoration-color: var(--editor-track-delete);
  background: rgba(220, 38, 38, 0.06);
  opacity: 0.7;
  cursor: pointer;
}
.ProseMirror span.track-delete:hover {
  background: rgba(220, 38, 38, 0.12);
  opacity: 1;
}

/* 서식 변경 */
.ProseMirror span.track-format {
  text-decoration: underline;
  text-decoration-color: var(--editor-blue-600);
  text-decoration-style: double;
  cursor: pointer;
}
.ProseMirror span.track-format:hover {
  background: rgba(37, 99, 235, 0.08);
}

/* ══════════════════════════════════════════════════
   페이지 번호 / 날짜 필드 노드
   ══════════════════════════════════════════════════ */
.ProseMirror .page-number-field,
.ProseMirror .date-field {
  background: var(--editor-accent-row-bg);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: inherit;
  color: #444;
  cursor: default;
  user-select: none;
  display: inline;
}
.ProseMirror .page-number-field:hover,
.ProseMirror .date-field:hover {
  background: var(--editor-accent-row-bg-hover);
}

/* 책갈피 표시 */
.ProseMirror span.bookmark-anchor {
  display: inline;
  width: 0;
  height: 0;
  position: relative;
}
.ProseMirror span.bookmark-anchor::before {
  content: "⚑";
  font-size: 10px;
  color: #888;
  position: relative;
  top: -2px;
}

/* ══════════════════════════════════════════════════
   Bookmark Anchor
   ══════════════════════════════════════════════════ */

.ProseMirror .bookmark-anchor {
  display: inline;
  position: relative;
  border-left: 2px solid var(--editor-bookmark);
  margin: 0 1px;
}
.ProseMirror .bookmark-anchor::before {
  content: "⚑";
  font-size: 8px;
  color: var(--editor-bookmark);
  position: absolute;
  top: -8px;
  left: -4px;
}

/* ══════════════════════════════════════════════════
   Drop Cap (첫 글자 장식)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-drop-cap="dropped"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  font-weight: 700;
  color: var(--editor-deep-navy);
}
.ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  margin-left: -40px;
  font-weight: 700;
  color: var(--editor-deep-navy);
}

/* ══════════════════════════════════════════════════
   Track Changes — 블록 레벨 스타일 + 말풍선
   ══════════════════════════════════════════════════ */

.ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.15);
  border-bottom: 2px solid var(--editor-track-insert-strong);
  text-decoration: none;
}
.ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.15);
  text-decoration: line-through;
  color: var(--editor-track-delete-strong);
}
.ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.1);
  border-bottom: 2px dotted var(--editor-blue-500);
}
.track-change-balloon {
  position: absolute;
  right: -240px;
  width: 220px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.track-change-balloon.insert { border-left: 3px solid var(--editor-track-insert-strong); }
.track-change-balloon.delete { border-left: 3px solid var(--editor-track-delete-strong); }
.track-change-balloon.format { border-left: 3px solid var(--editor-blue-500); }

/* ══════════════════════════════════════════════════
   단락 테두리/음영 (Paragraph Borders / Shading)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-border], .ProseMirror p[data-shading] {
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 2px;
}

/* ══════════════════════════════════════════════════
   표 스타일 변형 (Table Style Variants)
   ══════════════════════════════════════════════════ */

.ProseMirror table.table-style-elegant th { background: var(--editor-deep-navy); color: #fff; }
.ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #f8fafc; }
.ProseMirror table.table-style-grid-blue th { background: var(--editor-blue-600); color: #fff; }
.ProseMirror table.table-style-grid-blue td { border-color: var(--editor-blue-93c5fd); }
.ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: var(--editor-blue-eff6ff); }

/* ══════════════════════════════════════════════════
   Dark Mode — 타이포그래피
   ══════════════════════════════════════════════════ */
.word-editor-root.dark-mode .ProseMirror {
  color: #e0e0e0;
  caret-color: #fff;
}
.word-editor-root.dark-mode .ProseMirror h1,
.word-editor-root.dark-mode .ProseMirror h2,
.word-editor-root.dark-mode .ProseMirror h3,
.word-editor-root.dark-mode .ProseMirror h4 { color: #f0f0f0; }
.word-editor-root.dark-mode .ProseMirror a { color: var(--editor-dark-link); }
.word-editor-root.dark-mode .ProseMirror blockquote { background: #333; border-left-color: var(--editor-dark-accent); color: #ccc; }
.word-editor-root.dark-mode .ProseMirror th { background: #383838; }
.word-editor-root.dark-mode .ProseMirror td, .word-editor-root.dark-mode .ProseMirror th { border-color: #555; }
.word-editor-root.dark-mode .ProseMirror code { background: #383838; }
.word-editor-root.dark-mode .ProseMirror hr { border-top-color: #555; }
.word-editor-root.dark-mode .ProseMirror ::selection { background: #3a5280; }

/* 다크 모드 Track Changes — 인라인 */
.word-editor-root.dark-mode .ProseMirror span.track-insert {
  color: var(--editor-track-insert-dark);
  text-decoration-color: var(--editor-track-insert-dark);
  background: rgba(74, 222, 128, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-delete {
  color: var(--editor-track-delete-dark);
  text-decoration-color: var(--editor-track-delete-dark);
  background: rgba(248, 113, 113, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-format {
  text-decoration-color: var(--editor-track-format-dark);
}

/* 각주 다크 모드 */
.word-editor-root.dark-mode .footnote-area { border-color: #555; }
.word-editor-root.dark-mode .footnote-separator { border-color: #555; }
.word-editor-root.dark-mode .footnote-item { color: #ccc; }
.word-editor-root.dark-mode .footnote-item:hover { background: #333; }
.word-editor-root.dark-mode .footnote-item-content { color: #ccc; }
.word-editor-root.dark-mode .footnote-edit-input { color: #e0e0e0; border-bottom-color: var(--editor-dark-accent); }
.word-editor-root.dark-mode .endnote-header { color: #ddd; }
.word-editor-root.dark-mode .endnote-separator { border-color: #555; }

/* 북마크 다크모드 */
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor {
  border-left-color: var(--editor-bookmark-dark);
}
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor::before {
  color: var(--editor-bookmark-dark);
}

/* 드롭캡 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="dropped"]::first-letter,
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  color: var(--editor-dark-link);
}

/* 다크 모드 Track Changes — 블록 */
.word-editor-root.dark-mode .ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.2);
  border-bottom-color: var(--editor-track-insert-dark);
}
.word-editor-root.dark-mode .ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--editor-track-delete-dark);
}
.word-editor-root.dark-mode .ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.15);
  border-bottom-color: var(--editor-track-format-dark);
}
.word-editor-root.dark-mode .track-change-balloon {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

/* 표 스타일 다크모드 */
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant th { background: var(--editor-deep-navy-dark); }
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #2a2a2a; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue th { background: var(--editor-link-hover); }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue td { border-color: #3b5998; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: #1e2a3a; }

/* 단락 테두리/음영 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-border],
.word-editor-root.dark-mode .ProseMirror p[data-shading] {
  border-color: #555;
}
`;
