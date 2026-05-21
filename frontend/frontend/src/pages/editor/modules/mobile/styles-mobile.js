/**
 * 모바일 전용 에디터 CSS
 * — 768px 이하 뷰포트에서 데스크톱 UI를 가리고 모바일 전용 컴포넌트를 보이게 한다.
 * — iOS Safari `safe-area-inset` / 키보드 대응 / 16px 입력 폰트 보정 포함.
 *
 * 기존 `styles-layout.js` / `styles-components.js`에는 모바일 분기가 전혀 없었기 때문에
 * 모든 모바일 보정을 한 곳에 모았다. 미디어 쿼리는 `(max-width: 767.98px)` 기준.
 */
export const mobileStyles = `
/* ──── 모바일 보조 가시성 (기본은 숨김) ──── */
.editor-mobile-only { display: none; }

@media (max-width: 767.98px) {
  /* 모바일에서만 노출 / 숨김 */
  .editor-mobile-only { display: flex; }
  .editor-desktop-only { display: none !important; }

  /* iOS 입력 자동 확대 방지(16px 미만이면 확대됨) */
  .word-editor-root .ProseMirror,
  .word-editor-root input[type="text"],
  .word-editor-root textarea {
    font-size: 16px;
  }

  /* 캔버스 스크롤 영역 — 모바일에서는 흰 배경 + 좌우 패딩 0 */
  .word-editor-root .editor-canvas-scroll {
    padding: 0 !important;
    background: #fff !important;
    -webkit-overflow-scrolling: touch;
  }

  /* 본문 흐름 뷰 컨테이너 */
  .editor-mobile-flow {
    width: 100%;
    max-width: 100%;
    padding: 14px 16px 80px;
    box-sizing: border-box;
    background: #fff;
    min-height: 100%;
  }
  .editor-mobile-flow .ProseMirror {
    padding: 0;
    min-height: 60vh;
    line-height: 1.7;
    font-size: 16px;
    color: #1f2937;
    outline: none;
  }
  .editor-mobile-flow .ProseMirror:focus { outline: none; }
  .editor-mobile-flow .ProseMirror p { margin: 0 0 12px; }
  .editor-mobile-flow .ProseMirror h1 { font-size: 22px; margin: 16px 0 10px; }
  .editor-mobile-flow .ProseMirror h2 { font-size: 19px; margin: 14px 0 8px; }
  .editor-mobile-flow .ProseMirror h3 { font-size: 17px; margin: 12px 0 6px; }
  .editor-mobile-flow .doc-title-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    padding: 4px 0 8px;
    background: transparent;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 14px;
    box-sizing: border-box;
  }

  /* 이미지/표 스크롤 보정 */
  .editor-mobile-flow .ProseMirror img { max-width: 100%; height: auto; }
  .editor-mobile-flow .ProseMirror table {
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }

  /* ──── Mobile Top Bar ──── */
  .editor-mtopbar {
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    padding-top: env(safe-area-inset-top, 0);
    background: #1a2332;
    color: #fff;
    border-bottom: 1px solid #0f1923;
    z-index: 30;
  }
  .editor-mtopbar.dark { background: #0f1923; }
  .editor-mtopbar button {
    background: transparent;
    border: none;
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .editor-mtopbar button:active { background: rgba(255,255,255,0.18); }
  .editor-mtopbar .mtopbar-title {
    flex: 1;
    min-width: 0;
    height: 36px;
    font-size: 15px;
    font-weight: 500;
    background: transparent;
    color: #fff;
    border: none;
    outline: none;
    padding: 0 6px;
  }
  .editor-mtopbar .mtopbar-title::placeholder { color: rgba(255,255,255,0.55); }
  .editor-mtopbar .mtopbar-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin: 0 4px;
  }

  /* ──── Mobile Format Bar (sticky bottom) ──── */
  .editor-mformatbar {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    height: 52px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    padding-bottom: calc(4px + env(safe-area-inset-bottom, 0));
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    overflow-x: auto;
    overflow-y: hidden;
    z-index: 25;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .editor-mformatbar::-webkit-scrollbar { display: none; }
  .editor-mformatbar.dark {
    background: #1e1e1e;
    border-top-color: #333;
  }
  .editor-mformatbar button {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #334155;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .editor-mformatbar button.active {
    background: #dbeafe;
    color: #1d4ed8;
  }
  .editor-mformatbar.dark button { color: #e5e7eb; }
  .editor-mformatbar.dark button.active { background: #1e3a8a; color: #fff; }
  .editor-mformatbar button:active { background: #e2e8f0; }
  .editor-mformatbar .mformatbar-sep {
    width: 1px;
    height: 24px;
    background: #cbd5e1;
    margin: 0 4px;
    flex-shrink: 0;
  }

  /* ──── Mobile Sidebar Drawer ──── */
  .editor-msidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 90;
    animation: editor-mfade 0.18s ease-out;
  }
  .editor-msidebar-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(86vw, 340px);
    background: #eae6e1;
    z-index: 91;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 18px rgba(0,0,0,0.18);
    animation: editor-mslide-left 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-top: env(safe-area-inset-top, 0);
  }
  .editor-msidebar-drawer > div { width: 100% !important; }

  /* 모바일에서는 사이드바를 항상 펼친 상태로 (collapsed prop 무시) */
  .editor-msidebar-drawer .editor-desktop-sidebar {
    width: 100% !important;
    flex-shrink: 0;
  }

  /* ──── Mobile Tool Sheet (bottom sheet) ──── */
  .editor-msheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 92;
    animation: editor-mfade 0.18s ease-out;
  }
  .editor-msheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 78vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    z-index: 93;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.22);
    animation: editor-mslide-up 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .editor-msheet.dark { background: #1e1e1e; color: #e5e7eb; }
  .editor-msheet-handle {
    width: 40px;
    height: 4px;
    background: #cbd5e1;
    border-radius: 2px;
    margin: 8px auto 4px;
    flex-shrink: 0;
  }
  .editor-msheet-header {
    padding: 8px 16px 12px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .editor-msheet.dark .editor-msheet-header { border-bottom-color: #333; }
  .editor-msheet-title { font-size: 15px; font-weight: 600; color: #0f172a; }
  .editor-msheet.dark .editor-msheet-title { color: #f1f5f9; }
  .editor-msheet-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 12px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-msheet-section { margin-bottom: 16px; }
  .editor-msheet-section-title {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 6px 8px;
  }
  .editor-msheet.dark .editor-msheet-section-title { color: #94a3b8; }
  .editor-msheet-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .editor-msheet-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    color: #0f172a;
    cursor: pointer;
    text-align: center;
    font-size: 12px;
  }
  .editor-msheet-item:active { background: #f1f5f9; }
  .editor-msheet-item .editor-msheet-item-label {
    font-size: 11px;
    line-height: 1.25;
    word-break: keep-all;
  }
  .editor-msheet.dark .editor-msheet-item {
    background: #2a2a2a;
    border-color: #3a3a3a;
    color: #e5e7eb;
  }
  .editor-msheet.dark .editor-msheet-item:active { background: #333; }

  .editor-msheet-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    flex-wrap: wrap;
  }
  .editor-msheet-row > button.editor-msheet-chip,
  .editor-msheet-row > .editor-msheet-chip {
    flex: 0 0 auto;
    height: 36px;
    min-width: 44px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    color: #0f172a;
    font-size: 13px;
    cursor: pointer;
  }
  .editor-msheet-row > .editor-msheet-chip.active {
    background: #dbeafe;
    border-color: #93c5fd;
    color: #1d4ed8;
  }
  .editor-msheet.dark .editor-msheet-row > .editor-msheet-chip {
    background: #2a2a2a;
    border-color: #444;
    color: #e5e7eb;
  }

  @keyframes editor-mslide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes editor-mslide-left {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @keyframes editor-mfade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

/* iPad 가로 등 좁은 태블릿: 사이드바 드로어 + 바텀 바 사용, 리본은 유지 가능
   현재는 단순 모바일/데스크톱 분기만 적용 */

@media (max-width: 767.98px) {
  /* ──── Mobile Selection Bar ──── */
  .editor-mselection-bar {
    background: #1a2332;
    color: #fff;
    border-radius: 22px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.32);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    z-index: 60;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    animation: editor-mselect-pop 0.16s ease-out;
  }
  .editor-mselection-bar::-webkit-scrollbar { display: none; }
  .editor-mselection-bar button {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    color: #fff;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .editor-mselection-bar button:active { background: rgba(255,255,255,0.18); }
  .editor-mselection-bar button.active { background: rgba(59,130,246,0.55); }
  .editor-mselection-bar button.danger { color: #fca5a5; }
  .editor-mselection-bar .mselection-sep {
    width: 1px;
    height: 22px;
    background: rgba(255,255,255,0.2);
    margin: 0 2px;
    flex-shrink: 0;
  }
  @keyframes editor-mselect-pop {
    from { opacity: 0; transform: translateY(4px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ──── Mobile Slash Menu ──── */
  .editor-mslash {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    max-height: 60vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.22);
    z-index: 95;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom, 0);
    animation: editor-mslide-up 0.18s ease-out;
  }
  .editor-mslash .mslash-handle {
    width: 36px; height: 4px;
    background: #cbd5e1; border-radius: 2px;
    margin: 8px auto 4px;
    flex-shrink: 0;
  }
  .editor-mslash .mslash-header {
    padding: 6px 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #6b7280;
    font-size: 13px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
  }
  .editor-mslash .mslash-header span { font-family: monospace; color: #1f2937; }
  .editor-mslash .mslash-header button {
    width: 28px; height: 28px;
    background: transparent; border: none;
    font-size: 22px; color: #6b7280; cursor: pointer;
  }
  .editor-mslash .mslash-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-mslash .mslash-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 10px;
  }
  .editor-mslash .mslash-item:active { background: #eff6ff; }
  .editor-mslash .mslash-item.active { background: #eff6ff; }
  .editor-mslash .mslash-icon {
    width: 36px; height: 36px;
    flex-shrink: 0;
    background: #f1f5f9;
    border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #1d4ed8;
  }
  .editor-mslash .mslash-text { display: flex; flex-direction: column; min-width: 0; }
  .editor-mslash .mslash-label { font-size: 14px; font-weight: 500; color: #0f172a; }
  .editor-mslash .mslash-desc { font-size: 11px; color: #94a3b8; margin-top: 1px; }

  /* ──── Mobile Voice Input ──── */
  .editor-mvoice-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 98;
  }
  .editor-mvoice {
    position: fixed; inset: auto 16px 16px 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0));
    background: #0f172a;
    color: #f1f5f9;
    border-radius: 18px;
    padding: 14px 16px 18px;
    z-index: 99;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mvoice .mvoice-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .editor-mvoice .mvoice-title { font-size: 14px; font-weight: 600; }
  .editor-mvoice .mvoice-header button {
    width: 32px; height: 32px;
    background: transparent; border: none; color: #cbd5e1;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mvoice .mvoice-orb {
    width: 88px; height: 88px;
    margin: 6px auto 4px;
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  .editor-mvoice .mvoice-orb span {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, #3b82f6 0%, rgba(59,130,246,0) 70%);
    opacity: 0.5;
    transform: scale(0.6);
  }
  .editor-mvoice .mvoice-orb.listening span:nth-child(1) { animation: editor-mpulse 1.2s ease-out infinite; }
  .editor-mvoice .mvoice-orb.listening span:nth-child(2) { animation: editor-mpulse 1.2s 0.4s ease-out infinite; }
  .editor-mvoice .mvoice-orb.listening span:nth-child(3) { animation: editor-mpulse 1.2s 0.8s ease-out infinite; }
  @keyframes editor-mpulse {
    0%   { transform: scale(0.6); opacity: 0.7; }
    100% { transform: scale(1.2); opacity: 0; }
  }
  .editor-mvoice .mvoice-status {
    text-align: center; font-size: 12px; color: #94a3b8; margin-top: 2px;
  }
  .editor-mvoice .mvoice-transcript {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 10px 12px;
    border-radius: 10px;
    margin-top: 12px;
    min-height: 64px;
    max-height: 28vh;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.55;
  }
  .editor-mvoice .mvoice-transcript .interim { color: #94a3b8; }
  .editor-mvoice .mvoice-actions {
    display: flex; gap: 8px;
    margin-top: 12px;
  }
  .editor-mvoice .mvoice-actions button {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mvoice .mvoice-toggle {
    background: rgba(255,255,255,0.08);
    color: #f1f5f9;
  }
  .editor-mvoice .mvoice-toggle.on { background: #ef4444; color: #fff; }
  .editor-mvoice .mvoice-done { background: #2563eb; color: #fff; }
  .editor-mvoice .mvoice-tip {
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }

  /* ──── Mobile Image Quick Add ──── */
  .editor-mimage {
    position: fixed; inset: auto 16px 16px 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0));
    background: #fff;
    border-radius: 18px;
    z-index: 99;
    padding: 14px 16px 18px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.32);
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mimage .mvoice-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .editor-mimage .mvoice-title { font-size: 14px; font-weight: 600; color: #0f172a; }
  .editor-mimage .mvoice-header button {
    width: 32px; height: 32px;
    background: transparent; border: none; color: #6b7280;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mimage .mimage-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-top: 6px;
  }
  .editor-mimage .mimage-card {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 14px;
    padding: 18px 10px 14px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    cursor: pointer;
    color: #0f172a;
  }
  .editor-mimage .mimage-card:active { background: #eff6ff; }
  .editor-mimage .mimage-card span { font-size: 13px; font-weight: 500; }
  .editor-mimage .mimage-card small { font-size: 11px; color: #6b7280; }
  .editor-mimage .mimage-progress {
    margin-top: 10px;
    text-align: center;
    font-size: 12px;
    color: #475569;
  }
  .editor-mimage .mimage-progress .failed { color: #dc2626; }

  /* ──── Mobile Outline ──── */
  .editor-moutline {
    position: fixed;
    top: 0; bottom: 0; right: 0;
    width: min(86vw, 320px);
    background: #fff;
    z-index: 96;
    box-shadow: -2px 0 18px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    animation: editor-mslide-right 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    padding-top: env(safe-area-inset-top, 0);
  }
  .editor-moutline .moutline-header {
    height: 48px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px; font-weight: 600; color: #0f172a;
  }
  .editor-moutline .moutline-header button {
    width: 36px; height: 36px;
    background: transparent; border: none; color: #6b7280;
    border-radius: 50%; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-moutline .moutline-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .editor-moutline .moutline-empty {
    padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
  }
  .editor-moutline .moutline-item {
    width: 100%;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border: none; background: transparent;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    color: #0f172a;
  }
  .editor-moutline .moutline-item:active { background: #eff6ff; }
  .editor-moutline .moutline-item.lvl-2 { padding-left: 20px; }
  .editor-moutline .moutline-item.lvl-3 { padding-left: 32px; font-size: 13px; color: #334155; }
  .editor-moutline .moutline-bullet {
    width: 26px; height: 22px;
    flex-shrink: 0;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 4px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600;
  }
  .editor-moutline .moutline-bullet[data-level="2"] { background: #f1f5f9; color: #475569; }
  .editor-moutline .moutline-bullet[data-level="3"] { background: #f8fafc; color: #94a3b8; }
  .editor-moutline .moutline-text {
    flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  @keyframes editor-mslide-right {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }

  /* ──── Mobile Meta Sheet ──── */
  .editor-mmeta .mmeta-section {
    margin-bottom: 16px;
    padding: 0 4px;
  }
  .editor-mmeta .mmeta-section label {
    display: block;
    font-size: 12px; font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .editor-mmeta .mmeta-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    font-size: 16px;
    color: #0f172a;
    box-sizing: border-box;
    font-family: inherit;
    line-height: 1.5;
  }
  .editor-mmeta .mmeta-input:focus { outline: 2px solid #93c5fd; outline-offset: -1px; }
  .editor-mmeta .mmeta-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .editor-mmeta .mmeta-chip {
    height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    font-size: 13px;
    cursor: pointer;
  }
  .editor-mmeta .mmeta-chip.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .editor-mmeta .mmeta-thumb { position: relative; }
  .editor-mmeta .mmeta-thumb img {
    width: 100%; max-height: 200px; object-fit: cover;
    border-radius: 12px; border: 1px solid #e2e8f0;
  }
  .editor-mmeta .mmeta-thumb-clear {
    position: absolute; top: 8px; right: 8px;
    background: rgba(0,0,0,0.6); color: #fff;
    border: none; padding: 6px 10px; border-radius: 6px;
    font-size: 11px; cursor: pointer;
  }
  .editor-mmeta .mmeta-thumb-upload {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 16px;
    border: 1px dashed #94a3b8;
    border-radius: 12px;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    font-size: 14px;
  }
  .editor-mmeta .mmeta-thumb-upload.uploading { opacity: 0.6; }
  .editor-mmeta .mmeta-actions {
    display: flex; gap: 8px;
    padding: 8px 4px 12px;
    position: sticky; bottom: 0;
    background: linear-gradient(to top, #fff 70%, rgba(255,255,255,0));
  }
  .editor-mmeta .mmeta-actions button {
    flex: 1; height: 48px;
    border-radius: 12px;
    border: none;
    font-size: 15px; font-weight: 600;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mmeta .mmeta-secondary {
    background: #f1f5f9; color: #1f2937;
  }
  .editor-mmeta .mmeta-primary {
    background: #2563eb; color: #fff;
  }
  .editor-mmeta .mmeta-primary:disabled { background: #93c5fd; }

  /* ──── Mobile Writing HUD ──── */
  .editor-mhud {
    position: fixed;
    bottom: calc(60px + env(safe-area-inset-bottom, 0));
    right: 14px;
    border: none;
    background: rgba(15, 23, 42, 0.85);
    color: #f8fafc;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    z-index: 22;
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.2s;
  }
  .editor-mhud.expanded {
    border-radius: 14px;
    padding: 10px 14px;
    bottom: calc(110px + env(safe-area-inset-bottom, 0));
  }
  .editor-mhud .mhud-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    text-align: center;
  }
  .editor-mhud .mhud-grid > div {
    display: flex; flex-direction: column; gap: 2px;
    min-width: 38px;
  }
  .editor-mhud .mhud-grid strong { font-size: 13px; font-weight: 700; }
  .editor-mhud .mhud-grid span { font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; }
  .editor-mhud .mhud-compact { white-space: nowrap; }

  /* ──── Mobile Speed Dial (FAB) ──── */
  .editor-mfab {
    position: fixed;
    bottom: calc(64px + env(safe-area-inset-bottom, 0));
    right: 14px;
    z-index: 24;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 10px;
  }
  .editor-mfab .mfab-trigger {
    width: 56px; height: 56px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(29, 78, 216, 0.45);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mfab .mfab-actions {
    display: flex; flex-direction: column-reverse; gap: 8px;
    align-items: flex-end;
  }
  .editor-mfab .mfab-action {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 12px 8px 8px;
    background: var(--mfab-color, #1d4ed8);
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    animation: editor-mfab-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
    animation-delay: calc(var(--mfab-i, 0) * 28ms);
  }
  .editor-mfab .mfab-icon {
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  @keyframes editor-mfab-in {
    from { opacity: 0; transform: translateY(10px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ──── Top bar 활성 버튼 강조 ──── */
  .editor-mtopbar button.active {
    background: rgba(59,130,246,0.55);
  }

  /* ──── Focus mode ──── */
  .word-editor-root.mobile-focus-mode .editor-mformatbar,
  .word-editor-root.mobile-focus-mode .editor-mhud,
  .word-editor-root.mobile-focus-mode .editor-mfab {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mtopbar {
    background: transparent;
    border-bottom-color: transparent;
  }
  .word-editor-root.mobile-focus-mode .editor-mtopbar > button:not(:last-child),
  .word-editor-root.mobile-focus-mode .editor-mtopbar > .mtopbar-status {
    opacity: 0.25;
    transition: opacity 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow {
    padding: 28px 22px 100px;
    max-width: 720px;
    margin: 0 auto;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror {
    font-size: 17px;
    line-height: 1.85;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p:not(.is-editor-empty) {
    color: #94a3b8;
    transition: color 0.25s;
  }
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror p:focus-within,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h1.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h2.has-focus,
  .word-editor-root.mobile-focus-mode .editor-mobile-flow .ProseMirror h3.has-focus {
    color: #0f172a !important;
  }
  /* 키보드 위 정확 위치 (visual viewport bottom) */
  .word-editor-root[data-keyboard-open="true"] .editor-mformatbar {
    bottom: var(--editor-keyboard-h, 0px);
    transition: bottom 0.15s ease-out;
  }
  .word-editor-root[data-keyboard-open="true"] .editor-mhud,
  .word-editor-root[data-keyboard-open="true"] .editor-mfab {
    bottom: calc(var(--editor-keyboard-h, 0px) + 60px);
  }

  /* ──── Performance hints ──── */
  .editor-mobile-flow .ProseMirror > * { content-visibility: auto; contain-intrinsic-size: 1px 80px; }
  .editor-mselection-bar, .editor-mformatbar, .editor-mfab, .editor-mhud { will-change: transform, opacity; }

  /* ──── Command Palette ──── */
  .editor-mpalette {
    position: fixed; left: 0; right: 0; bottom: 0;
    max-height: 86vh;
    background: #fff;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -10px 32px rgba(0,0,0,0.25);
    z-index: 96;
    display: flex; flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0);
    animation: editor-mslide-up 0.18s ease-out;
  }
  .mpalette-header {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #e5e7eb;
    color: #475569;
    flex-shrink: 0;
  }
  .mpalette-input {
    flex: 1;
    border: none; outline: none;
    font-size: 16px; padding: 6px 4px;
    color: #0f172a;
    background: transparent;
  }
  .mpalette-header > button {
    width: 36px; height: 36px;
    background: transparent; border: none;
    color: #64748b; cursor: pointer;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mpalette-tabs {
    display: flex; gap: 4px;
    padding: 8px 10px 4px;
    overflow-x: auto;
    flex-shrink: 0;
    scrollbar-width: none;
  }
  .mpalette-tabs::-webkit-scrollbar { display: none; }
  .mpalette-tab {
    flex-shrink: 0;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .mpalette-tab.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .mpalette-body {
    flex: 1; overflow-y: auto;
    padding: 8px 8px 16px;
    -webkit-overflow-scrolling: touch;
  }
  .mpalette-section { margin-bottom: 12px; }
  .mpalette-section-title {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 8px 6px;
    font-size: 11px; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .mpalette-add-snip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px;
    border: 1px solid #cbd5e1; background: #fff;
    color: #1d4ed8; border-radius: 999px;
    font-size: 11px; cursor: pointer;
  }
  .mpalette-list { display: flex; flex-direction: column; }
  .mpalette-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border: none; background: transparent;
    text-align: left; cursor: pointer;
    border-radius: 10px;
    width: 100%;
  }
  .mpalette-row:active { background: #eff6ff; }
  .mpalette-icon {
    width: 36px; height: 36px;
    flex-shrink: 0;
    background: #f1f5f9;
    border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #1d4ed8;
  }
  .mpalette-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .mpalette-text > span { font-size: 14px; color: #0f172a; font-weight: 500; }
  .mpalette-text > small { font-size: 11px; color: #94a3b8; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mpalette-emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 4px;
    padding: 4px 8px;
  }
  .mpalette-emoji {
    height: 40px;
    border: none; background: #f8fafc;
    border-radius: 8px;
    font-size: 20px;
    cursor: pointer;
  }
  .mpalette-emoji:active { background: #dbeafe; }
  .mpalette-empty {
    padding: 24px 12px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }
  .mpalette-snip-edit {
    padding: 8px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .mpalette-snip-actions { display: flex; gap: 8px; }
  .mpalette-snip-actions button { flex: 1; height: 44px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }

  /* ──── AI Assistant ──── */
  .editor-mai {
    position: fixed; left: 0; right: 0; bottom: 0;
    max-height: 80vh;
    background: linear-gradient(180deg, #0f172a 0%, #111c30 100%);
    color: #f8fafc;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -10px 32px rgba(0,0,0,0.32);
    z-index: 97;
    display: flex; flex-direction: column;
    padding: 6px 14px 18px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0));
    animation: editor-mslide-up 0.2s ease-out;
  }
  .editor-mai .mai-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .editor-mai .mai-title { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
  .editor-mai .mai-header > button {
    width: 36px; height: 36px;
    background: transparent; border: none;
    color: #cbd5e1; cursor: pointer;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mai .mai-grid {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px; padding: 12px 0;
  }
  .editor-mai .mai-action {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 4px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #f1f5f9;
    border-radius: 10px;
    cursor: pointer;
    font-size: 11px;
  }
  .editor-mai .mai-action:disabled { opacity: 0.5; cursor: not-allowed; }
  .editor-mai .mai-action.loading { background: rgba(59,130,246,0.25); }
  .editor-mai .mai-loading {
    display: flex; align-items: center; gap: 8px;
    color: #93c5fd; font-size: 13px;
    padding: 4px 0;
  }
  .editor-mai .mai-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #93c5fd;
    border-radius: 50%;
    animation: editor-spin 0.8s linear infinite;
  }
  @keyframes editor-spin { to { transform: rotate(360deg); } }
  .editor-mai .mai-result {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 12px;
    overflow-y: auto;
    max-height: 38vh;
  }
  .editor-mai .mai-result-label {
    font-size: 11px; color: #93c5fd;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .editor-mai .mai-result p { margin: 0; line-height: 1.6; font-size: 14px; color: #f1f5f9; }
  .editor-mai .mai-result ol { padding-left: 18px; margin: 0; }
  .editor-mai .mai-result ol li { margin: 4px 0; }
  .editor-mai .mai-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .editor-mai .mai-tags span {
    padding: 4px 10px;
    background: rgba(59,130,246,0.2);
    color: #bfdbfe;
    border-radius: 999px;
    font-size: 12px;
  }
  .editor-mai .mai-result-actions {
    display: flex; gap: 8px; margin-top: 10px;
  }
  .editor-mai .mai-result-actions button {
    flex: 1; height: 40px; border: none; cursor: pointer;
    border-radius: 8px; font-size: 13px; font-weight: 600;
  }
  .editor-mai .mai-result-actions .mmeta-secondary {
    background: rgba(255,255,255,0.08); color: #f1f5f9;
  }
  .editor-mai .mai-result-actions .mmeta-primary {
    background: #2563eb; color: #fff;
  }
  .editor-mai .mai-tip {
    margin-top: 10px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }
  .editor-mai .mai-tip code {
    background: rgba(255,255,255,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
  }

  /* ──── Publish Sheet ──── */
  .editor-mpublish .mpublish-summary {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #f8fafc;
    border-radius: 10px;
  }
  .editor-mpublish .mpublish-score {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    color: #fff;
  }
  .editor-mpublish .mpublish-score[data-status="ok"] { background: #16a34a; }
  .editor-mpublish .mpublish-score[data-status="warn"] { background: #f59e0b; }
  .editor-mpublish .mpublish-score[data-status="error"] { background: #dc2626; }
  .editor-mpublish .mpublish-counts {
    display: flex; flex-direction: column; gap: 4px;
    text-align: right; font-size: 13px;
  }
  .editor-mpublish .mpublish-counts span { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
  .editor-mpublish .mpublish-counts .ok { color: #16a34a; }
  .editor-mpublish .mpublish-counts .warn { color: #f59e0b; }
  .editor-mpublish .mpublish-counts .error { color: #dc2626; }
  .editor-mpublish .mpublish-checks {
    list-style: none;
    padding: 0; margin: 0 0 16px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .editor-mpublish .mpublish-check {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 13px;
    color: #334155;
  }
  .editor-mpublish .mpublish-check.ok { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
  .editor-mpublish .mpublish-check.warn { border-color: #fde68a; background: #fffbeb; color: #92400e; }
  .editor-mpublish .mpublish-check.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
  .editor-mpublish .mpublish-mode {
    display: flex; gap: 8px;
    margin: 0 0 12px;
  }
  .editor-mpublish .mpublish-mode button {
    flex: 1; height: 44px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    border-radius: 10px;
    cursor: pointer;
    font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .editor-mpublish .mpublish-mode button.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
  .editor-mpublish .mpublish-schedule label {
    display: block; font-size: 12px; color: #475569; margin-bottom: 6px; font-weight: 600;
  }
  .editor-mpublish .mpublish-tip {
    font-size: 12px; color: #6b7280; margin-top: 6px;
  }
  .editor-mpublish .mpublish-actions {
    display: flex; gap: 8px;
    margin-top: 16px;
    position: sticky; bottom: 0;
    padding: 8px 0;
    background: linear-gradient(to top, #fff 70%, rgba(255,255,255,0));
  }
  .editor-mpublish .mpublish-actions button { flex: 1; height: 48px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }

  /* ──── Find / Replace ──── */
  .editor-mfind {
    position: fixed;
    left: 8px; right: 8px;
    bottom: calc(8px + var(--editor-keyboard-h, 0px));
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 10px 32px rgba(0,0,0,0.18);
    z-index: 28;
    padding: 8px 8px 4px;
    transition: bottom 0.15s;
  }
  .editor-mfind .mfind-row {
    display: flex; align-items: center; gap: 4px;
    margin-bottom: 4px;
  }
  .editor-mfind .mfind-input {
    flex: 1;
    height: 38px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 15px;
    padding: 0 10px;
    outline: none;
  }
  .editor-mfind .mfind-input:focus { border-color: #93c5fd; }
  .editor-mfind .mfind-count {
    font-size: 11px; color: #475569; padding: 0 4px;
    min-width: 44px; text-align: center;
  }
  .editor-mfind button {
    width: 38px; height: 38px;
    border: none; background: transparent; cursor: pointer;
    border-radius: 8px;
    color: #475569;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .editor-mfind button:active { background: #f1f5f9; }
  .editor-mfind button.active { background: #dbeafe; color: #1d4ed8; }
  .editor-mfind .mfind-options {
    display: flex; align-items: center; gap: 8px;
    padding: 0 4px 4px;
    font-size: 12px; color: #64748b;
  }
  .editor-mfind .mfind-options label {
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* ──── Version History ──── */
  .editor-mversion .mversion-empty {
    padding: 28px 16px; text-align: center; color: #94a3b8; font-size: 13px;
  }
  .editor-mversion .mversion-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid #eef2f7;
  }
  .editor-mversion .mversion-info { flex: 1; min-width: 0; }
  .editor-mversion .mversion-time {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; color: #475569;
  }
  .editor-mversion .mversion-label { font-size: 13px; font-weight: 500; color: #0f172a; margin-top: 2px; }
  .editor-mversion .mversion-preview {
    font-size: 11px; color: #94a3b8;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    margin-top: 2px;
  }
  .editor-mversion .mversion-restore {
    display: inline-flex; align-items: center; gap: 4px;
    height: 36px; padding: 0 12px;
    border: 1px solid #cbd5e1; background: #fff;
    border-radius: 8px; cursor: pointer; font-size: 12px; color: #1d4ed8;
  }
  .editor-mversion .mversion-clear {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 12px;
    padding: 8px 12px;
    border: none; background: transparent;
    color: #dc2626; cursor: pointer; font-size: 12px;
  }

  /* ──── Goal Bar ──── */
  .editor-mgoal {
    position: fixed;
    left: 14px; right: 14px;
    top: calc(54px + env(safe-area-inset-top, 0));
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(10px);
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 8px 4px 12px;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
    z-index: 23;
    font-size: 11px;
  }
  .editor-mgoal .mgoal-toggle {
    display: inline-flex; align-items: center; gap: 4px;
    background: transparent; border: none; cursor: pointer;
    color: #334155;
    flex-shrink: 0;
  }
  .editor-mgoal .mgoal-track {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }
  .editor-mgoal .mgoal-fill {
    height: 100%;
    background: #94a3b8;
    transition: width 0.25s ease-out;
  }
  .editor-mgoal .mgoal-track[data-state="go"] .mgoal-fill { background: #94a3b8; }
  .editor-mgoal .mgoal-track[data-state="near"] .mgoal-fill { background: #f59e0b; }
  .editor-mgoal .mgoal-track[data-state="done"] .mgoal-fill { background: #16a34a; }
  .editor-mgoal .mgoal-popover {
    position: absolute;
    top: 38px; left: 0; right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  .editor-mgoal .mgoal-presets {
    display: flex; flex-wrap: wrap; gap: 6px;
    align-items: center;
  }
  .editor-mgoal .mgoal-presets button {
    height: 32px; padding: 0 12px;
    border: 1px solid #cbd5e1; background: #fff;
    color: #334155;
    border-radius: 999px;
    font-size: 12px; cursor: pointer;
  }
  .editor-mgoal .mgoal-presets button.active {
    background: #1d4ed8; color: #fff; border-color: #1d4ed8;
  }
}
`;
