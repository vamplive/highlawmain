/**
 * 에디터 컴포넌트 스타일 — 리본 버튼/탭, 툴팁, 드롭다운, 대화상자,
 * 플로팅 툴바, 표 격자 선택기, 댓글/메모 시스템, 검토 패널,
 * 컨텍스트 메뉴, 리본 접기, 상태 표시줄 등
 *
 * 색상은 frontend/src/index.css의 :root 에서 정의된
 * --editor-* 디자인 토큰을 var() 로 참조한다.
 */
export const componentStyles = `
/* ──── Word 365 ribbon buttons ──── */
.word-ribbon-btn { transition: background 0.08s, border-color 0.08s; }
.word-ribbon-btn:hover { background: var(--editor-accent-bg-light) !important; }
.word-ribbon-btn:active { background: var(--editor-accent-bg-active) !important; }
.word-ribbon-btn.active { background: var(--editor-accent-bg-active) !important; border: 1px solid var(--editor-accent-border-soft) !important; }
.word-tab-btn { transition: background 0.08s, color 0.08s; }
.word-tab-btn:hover { background: transparent !important; color: var(--editor-accent) !important; }
.word-tab-btn.active { color: var(--editor-accent) !important; border-bottom: 2px solid var(--editor-accent); font-weight: 600; }
.word-style-card { transition: border-color 0.1s, box-shadow 0.1s; }
.word-style-card:hover { border-color: var(--editor-accent) !important; box-shadow: 0 1px 4px rgba(24,90,189,0.15); }

/* ──── Tooltip (Word 365 스타일) ──── */
.word-tooltip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #fff; color: #333; padding: 6px 10px; border-radius: 4px;
  font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 1000;
  opacity: 0; transition: opacity 0.15s;
  border: 1px solid #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.word-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #fff;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.08));
}
*:hover > .word-tooltip { opacity: 1; }

/* ──── Dropdown menu (Word 365) ──── */
.word-dropdown-menu {
  position: absolute; top: 100%; left: 0; z-index: 200;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.14); min-width: 160px;
  padding: 4px 0; max-height: 360px; overflow-y: auto;
  animation: ribbonDropdownIn 0.12s ease-out;
}
@keyframes ribbonDropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.word-dropdown-item {
  display: flex; align-items: center; width: 100%; padding: 6px 12px; border: none; background: transparent;
  font-size: 12px; text-align: left; cursor: pointer; font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.08s; white-space: nowrap; gap: 8px;
}
.word-dropdown-item:hover { background: var(--editor-accent-bg-light); }
.word-dropdown-item.active { background: var(--editor-accent-bg-active); font-weight: 600; }
.word-dropdown-sep { height: 1px; background: #e5e5e5; margin: 4px 0; }

/* ──── Dialog / Modal ──── */
.word-dialog-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.word-dialog {
  background: #f3f3f3; border: 1px solid #b0b0b0; border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25); min-width: 420px; max-width: 640px;
  font-family: '맑은 고딕', 'Segoe UI', sans-serif; font-size: 12px;
}
.word-dialog-title {
  padding: 10px 16px; font-size: 12px; font-weight: 400; color: #333;
  border-bottom: 1px solid #d5d5d5; background: #f3f3f3;
  display: flex; justify-content: space-between; align-items: center;
  cursor: default; user-select: none;
}
.word-dialog-body {
  padding: 16px; background: #fff;
}
.word-dialog-footer {
  padding: 10px 16px; display: flex; justify-content: flex-end; gap: 6px;
  border-top: 1px solid #d5d5d5;
}
.word-dialog-btn {
  padding: 5px 20px; font-size: 12px; border: 1px solid #adadad;
  border-radius: 2px; cursor: pointer; font-family: '맑은 고딕', sans-serif;
  background: #e5e5e5; color: #333;
}
.word-dialog-btn:hover { background: #d5d5d5; }
.word-dialog-btn.primary {
  background: var(--editor-accent); color: #fff; border-color: var(--editor-accent-border);
}
.word-dialog-btn.primary:hover { background: var(--editor-accent-hover-strong); }
.word-dialog-label {
  display: block; font-size: 12px; color: #444; margin-bottom: 4px; font-weight: 400;
}
.word-dialog-input {
  width: 100%; padding: 4px 8px; border: 1px solid #adadad; border-radius: 2px;
  font-size: 12px; outline: none; box-sizing: border-box; font-family: '맑은 고딕', sans-serif;
}
.word-dialog-input:focus { border-color: var(--editor-accent); box-shadow: 0 0 0 1px var(--editor-accent); }
.word-dialog-tabs {
  display: flex; border-bottom: 1px solid #d5d5d5; padding: 0 16px; background: #f3f3f3;
}
.word-dialog-tab {
  padding: 8px 16px; font-size: 12px; border: none; background: transparent;
  cursor: pointer; border-bottom: 2px solid transparent; color: #555;
  font-family: '맑은 고딕', sans-serif;
}
.word-dialog-tab:hover { color: #333; }
.word-dialog-tab.active { color: var(--editor-accent); border-bottom-color: var(--editor-accent); font-weight: 600; }

/* ──── Floating Toolbar ──── */
.floating-toolbar {
  position: absolute; z-index: 100;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px 6px;
  display: flex; align-items: center; gap: 1px;
  animation: floatIn 0.15s ease-out;
}
@keyframes floatIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ──── Table grid selector ──── */
.table-grid-cell {
  width: 18px; height: 18px; border: 1px solid #d1d5db; cursor: pointer;
  transition: background 0.05s, border-color 0.05s;
}
.table-grid-cell.active {
  background: var(--editor-link-bg-hover); border-color: var(--editor-blue-500);
}

/* ──── Comment / Annotation ──── */
.word-comment {
  position: absolute; right: -220px; width: 200px;
  background: #fff; border: 1px solid #d1d5db; border-left: 3px solid var(--editor-blue-500);
  border-radius: 4px; padding: 8px 10px; font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* ──── Context Menu ──── */
@keyframes ctxIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ctx-menu-item:hover { background: var(--editor-blue-eff6ff) !important; }

/* ──── Ribbon collapse toggle ──── */
.ribbon-collapse-btn {
  position: absolute; right: 8px; top: 8px; z-index: 10;
  width: 20px; height: 20px; border: 1px solid #d5d5d5;
  background: var(--ribbon-bg, #f8f8f8); border-radius: 3px;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 10px; color: #888;
  transition: background 0.1s;
}
.ribbon-collapse-btn:hover { background: var(--editor-link-bg-hover); }

/* ══════════════════════════════════════════════════
   향상된 리본 그룹 라벨
   ══════════════════════════════════════════════════ */
.ribbon-group-label {
  font-size: 9px;
  color: var(--ribbon-label, #888);
  text-align: center;
  padding-top: 2px;
  user-select: none;
  white-space: nowrap;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}

/* ══════════════════════════════════════════════════
   Comment / Memo System (MS Word 365 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 메모 하이라이트 */
.ProseMirror span.comment-highlight {
  background-color: rgba(255, 213, 79, 0.25);
  border-bottom: 2px solid var(--editor-comment-yellow);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  border-radius: 1px;
}
.ProseMirror span.comment-highlight:hover {
  background-color: rgba(255, 213, 79, 0.4);
}
.ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255, 224, 130, 0.5);
  border-bottom-color: var(--editor-comment-yellow-active);
}
.ProseMirror span.comment-highlight.comment-resolved {
  background-color: transparent;
  border-bottom: 1px dashed #CCC;
}

/* 마크업 모드별 하이라이트 숨김 */
.comment-markup-none .ProseMirror span.comment-highlight,
.comment-markup-original .ProseMirror span.comment-highlight,
.comment-markup-simple .ProseMirror span.comment-highlight {
  background-color: transparent !important;
  border-bottom: none !important;
}

/* 간단한 태그 모드 — 여백 아이콘 */
.comment-margin-indicator {
  position: absolute;
  right: -30px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  opacity: 0.5;
  z-index: 10;
  transition: opacity 0.15s, transform 0.1s;
}
.comment-margin-indicator:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* ── 메모 패널 (오른쪽) ── */
.comments-panel {
  width: 280px;
  min-width: 220px;
  max-width: 360px;
  background: #F8F9FA;
  border-left: 1px solid #E0E0E0;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.comments-panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #fff;
}
.comments-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}
.comments-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}
.comments-panel-close:hover {
  background: #f0f0f0;
  color: #666;
}
.comments-balloon-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* ── 메모 말풍선 카드 ── */
.comment-balloon {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  padding: 0;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.comment-balloon:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-color: #D0D0D0;
}
.comment-balloon.active {
  border-color: var(--author-color, var(--editor-blue-500));
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* 왼쪽 색상 바 (활성 시 표시) */
.comment-color-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 6px 0 0 6px;
  transition: background-color 0.2s;
}

.comment-balloon-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
}
.comment-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.comment-author-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: block;
  line-height: 1.3;
}
.comment-timestamp {
  font-size: 11px;
  color: #999;
}
.comment-edited-badge {
  font-size: 10px;
  color: #aaa;
}
.comment-content {
  font-size: 13px;
  color: #444;
  padding: 0 12px 8px;
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;
}

/* 더보기 메뉴 버튼 */
.comment-more-btn {
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 3px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
}
.comment-balloon:hover .comment-more-btn {
  opacity: 0.5;
}
.comment-more-btn:hover {
  opacity: 1 !important;
  background: #F0F0F0;
}

/* 더보기 드롭다운 메뉴 */
.comment-more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 300;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 170px;
  padding: 4px 0;
  animation: ctxIn 0.12s ease;
}
.comment-more-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 3px 0;
}
.comment-more-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  color: #333;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.1s;
}
.comment-more-item:hover {
  background: var(--editor-blue-eff6ff);
}
.comment-more-item.danger {
  color: var(--editor-track-delete);
}
.comment-more-item.danger:hover {
  background: #fef2f2;
}
.comment-more-item.disabled {
  color: #bbb;
  cursor: default;
  opacity: 0.5;
}
.comment-more-icon {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 답글 */
.comment-replies {
  border-top: 1px solid #F0F0F0;
}
.comment-reply-item {
  padding: 8px 12px 6px;
  border-top: 1px solid #F5F5F5;
}
.comment-reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

/* 편집 영역 */
.comment-edit-area {
  padding: 0 12px 8px;
}
.comment-edit-textarea {
  width: 100%;
  border: 1.5px solid var(--editor-comment-textarea-border);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  min-height: 50px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.2s;
}
.comment-edit-textarea:focus {
  border-color: var(--editor-blue-600);
  box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
}
.comment-edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}

/* 액션 버튼 */
.comment-action-btn {
  padding: 4px 14px;
  font-size: 11px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  color: #555;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s, border-color 0.1s;
}
.comment-action-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}
.comment-action-btn.primary {
  background: var(--editor-accent);
  color: #fff;
  border-color: var(--editor-accent);
}
.comment-action-btn.primary:hover {
  background: var(--editor-accent-hover);
}
.comment-action-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* 답글 입력 필드 */
.comment-reply-input {
  width: 100%;
  border: 1.5px solid #E0E0E0;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  resize: none;
  min-height: 36px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.comment-reply-input:focus {
  border-color: var(--editor-comment-textarea-border);
  box-shadow: 0 0 0 2px rgba(74,134,200,0.1);
}

/* 하단 액션 바 */
.comment-actions-bar {
  padding: 6px 12px 10px;
  border-top: 1px solid #F0F0F0;
}
.comment-reply-area {
  display: flex;
  flex-direction: column;
}
.comment-bottom-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.comment-reply-trigger {
  flex: 1;
  text-align: left;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.comment-reply-trigger:hover {
  border-color: #ccc;
  background: #f5f5f5;
}
.comment-resolve-btn {
  border: 1px solid var(--editor-resolve-green);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 11px;
  color: var(--editor-resolve-green);
  cursor: pointer;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.comment-resolve-btn:hover {
  background: var(--editor-resolve-green);
  color: #fff;
}

/* 해결된 메모 */
.comment-balloon.resolved {
  opacity: 0.65;
  padding: 0;
}
.comment-resolved-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
.comment-resolved-text {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.comment-reopen-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s;
}
.comment-reopen-btn:hover {
  background: #f0f0f0;
}

/* ── 검토 창 (세로/가로) ── */
.reviewing-pane {
  background: #F8F9FA;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.reviewing-pane-vertical {
  width: 300px;
  border-right: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-horizontal {
  height: 200px;
  border-top: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-header {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: #fff;
}
.reviewing-pane-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.reviewing-pane-count {
  font-size: 11px;
  color: #888;
  margin-left: 10px;
}
.reviewing-pane-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  border-radius: 3px;
}
.reviewing-pane-close:hover {
  background: #f0f0f0;
}
.reviewing-pane-list {
  flex: 1;
  overflow-y: auto;
}
.reviewing-pane-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
}
.reviewing-pane-item:hover {
  background: #f5f5f5;
}
.reviewing-pane-item.active {
  background: var(--editor-accent-row-bg);
}
.reviewing-pane-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.reviewing-pane-item-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
.reviewing-pane-item-date {
  font-size: 10px;
  color: #888;
}
.reviewing-pane-item-content {
  font-size: 12px;
  color: #555;
  margin-left: 26px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reviewing-pane-item-replies {
  font-size: 11px;
  color: #999;
  margin-left: 26px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.reviewing-pane-empty {
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* ══════════════════════════════════════════════════
   Status Bar (상태 표시줄)
   ══════════════════════════════════════════════════ */

.editor-status-bar {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  background: var(--ribbon-bg, #f3f3f3);
  border-top: 1px solid var(--ribbon-sep, #d1d5db);
  font-size: 11px;
  color: var(--ribbon-fg, #666);
  gap: 16px;
  flex-shrink: 0;
  user-select: none;
}
.editor-status-bar .status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
.editor-status-bar .status-item.clickable {
  cursor: pointer;
}
.editor-status-bar .status-item.clickable:hover {
  color: var(--editor-accent);
}
.editor-status-bar .status-sep {
  width: 1px;
  height: 14px;
  background: var(--ribbon-sep, #d1d5db);
}
.editor-status-bar .zoom-slider {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.editor-status-bar .zoom-slider input[type="range"] {
  width: 100px;
  height: 4px;
  accent-color: var(--editor-accent);
  cursor: pointer;
}

/* ══════════════════════════════════════════════════
   Dark Mode — 컴포넌트 오버라이드
   ══════════════════════════════════════════════════ */
.word-editor-root.dark-mode .word-ribbon-btn:hover { background: #3a3a50 !important; }
.word-editor-root.dark-mode .word-ribbon-btn.active { background: #3a3a50 !important; border: 1px solid var(--editor-dark-accent) !important; }
.word-editor-root.dark-mode .word-tab-btn:hover { background: transparent !important; color: var(--editor-dark-accent-soft) !important; }
.word-editor-root.dark-mode .word-tab-btn.active { color: var(--editor-dark-accent-soft) !important; border-bottom-color: var(--editor-dark-accent-soft); }
.word-editor-root.dark-mode .word-style-card:hover { border-color: var(--editor-dark-accent) !important; }
.word-editor-root.dark-mode .word-dropdown-menu { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-dropdown-item { color: #e0e0e0; }
.word-editor-root.dark-mode .word-dropdown-item:hover { background: #3a3a5c; }
.word-editor-root.dark-mode .floating-toolbar { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-tooltip { background: #333; color: #e0e0e0; border-color: #555; }
.word-editor-root.dark-mode .word-tooltip::after { border-top-color: #333; }

/* 댓글 다크모드 */
.word-editor-root.dark-mode .comment-balloon {
  background: #2d2d2d;
  border-color: #444;
}
.word-editor-root.dark-mode .comment-balloon.active {
  border-color: var(--author-color, var(--editor-dark-accent));
}
.word-editor-root.dark-mode .comment-balloon:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .comment-author-name { color: #e0e0e0; }
.word-editor-root.dark-mode .comment-content { color: #ccc; }
.word-editor-root.dark-mode .comment-timestamp { color: #777; }
.word-editor-root.dark-mode .comments-panel { background: #1e1e1e; border-left-color: #444; }
.word-editor-root.dark-mode .comments-panel-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .comments-panel-title { color: #bbb; }
.word-editor-root.dark-mode .reviewing-pane { background: #1e1e1e; }
.word-editor-root.dark-mode .reviewing-pane-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-vertical { border-right-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-horizontal { border-top-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-item { border-bottom-color: #333; }
.word-editor-root.dark-mode .reviewing-pane-item:hover { background: #333; }
.word-editor-root.dark-mode .reviewing-pane-item.active { background: #2a3a5c; }
.word-editor-root.dark-mode .ProseMirror span.comment-highlight {
  background-color: rgba(255,243,196,0.2);
  border-bottom-color: rgba(255,213,79,0.4);
}
.word-editor-root.dark-mode .ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255,224,130,0.3);
}
.word-editor-root.dark-mode .comment-edit-textarea {
  background: #333;
  color: #e0e0e0;
  border-color: var(--editor-dark-accent);
}
.word-editor-root.dark-mode .comment-reply-input {
  background: #333;
  color: #e0e0e0;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-reply-trigger {
  background: #333;
  border-color: #555;
  color: #888;
}
.word-editor-root.dark-mode .comment-more-menu {
  background: #2d2d2d;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-more-item { color: #ddd; }
.word-editor-root.dark-mode .comment-more-item:hover { background: #3a3a3a; }

/* 상태 표시줄 다크모드 */
.word-editor-root.dark-mode .editor-status-bar .status-item.clickable:hover {
  color: var(--editor-dark-link);
}

/* ── 인쇄 시 숨김 ── */
@media print {
  .comments-panel { display: none !important; }
  .reviewing-pane, .reviewing-pane-vertical, .reviewing-pane-horizontal { display: none !important; }
  .comment-margin-indicator { display: none !important; }
  .ProseMirror span.comment-highlight { background-color: transparent !important; border-bottom: none !important; }
  .footnote-delete-btn { display: none !important; }
}
`;
