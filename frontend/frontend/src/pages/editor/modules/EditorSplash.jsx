/**
 * EditorSplash — 에디터 초기 로딩 시 표시되는 스플래시 화면
 * (Word 365 부팅 화면 모방)
 */
import { memo } from "react";

export const EditorSplash = memo(function EditorSplash() {
  return (
    <div className="editor-splash">
      <div className="logo">
        <span style={{ fontWeight: 700, fontSize: 42, letterSpacing: -2 }}>W</span>
      </div>
      <div className="subtitle" style={{ fontSize: 14, marginTop: 8, letterSpacing: 1 }}>Word</div>
      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>법무법인 하이로</div>
      <div className="loading-bar" />
    </div>
  );
});
