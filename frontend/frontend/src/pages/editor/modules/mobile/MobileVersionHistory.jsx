/**
 * MobileVersionHistory — localStorage 기반 자동 스냅샷·복원 패널
 *
 * 자동 저장 매 분당 한 번씩 본문 HTML을 짧은 메타와 함께 localStorage에 적재하고,
 * 사용자는 시간순 타임라인에서 원하는 시점으로 복원할 수 있다.
 *
 * 큰 글을 모바일에서 작성하다 실수로 지웠을 때 복구 안전망.
 */
import { memo, useEffect, useState } from "react";
import { Clock, RotateCcw, Trash2, X } from "lucide-react";
import { loadVersions, pushVersion, clearVersions } from "./versionStore";

function formatTs(ts) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.round((now - ts) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.round(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.round(diff / 3600)}시간 전`;
  return d.toLocaleString();
}

export const MobileVersionHistory = memo(function MobileVersionHistory({ editor, open, onClose, docId }) {
  const [list, setList] = useState(() => loadVersions(docId));

  useEffect(() => {
    if (!open) return;
    // 시트가 열릴 때 한 번만 새로 읽음 — 외부 변경(자동 스냅샷)을 반영
    setList(loadVersions(docId));
  }, [open, docId]);

  if (!open) return null;

  const restore = (v) => {
    if (!editor) return;
    if (!window.confirm("이 시점의 본문으로 복원할까요? 현재 본문은 새 스냅샷으로 저장됩니다.")) return;
    try {
      // 현재 상태 먼저 스냅샷
      pushVersion(docId, { html: editor.getHTML(), label: "복원 직전" });
      editor.commands.setContent(v.html, false);
    } catch { /* ignore */ }
    onClose?.();
  };

  const removeAll = () => {
    if (!window.confirm("모든 버전 기록을 삭제할까요?")) return;
    clearVersions(docId);
    setList([]);
  };

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={onClose} />
      <div className="editor-mversion editor-mobile-only" role="dialog" aria-label="버전 히스토리">
        <div className="editor-msheet-handle" />
        <div className="editor-msheet-header">
          <div className="editor-msheet-title">버전 히스토리</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ width: 36, height: 36, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>
        <div className="editor-msheet-body">
          {list.length === 0 && (
            <div className="mversion-empty">
              아직 저장된 버전이 없습니다.<br />본문을 작성하면 자동으로 분당 한 번씩 스냅샷이 추가됩니다.
            </div>
          )}
          {list.map((v) => (
            <div key={v.ts} className="mversion-row">
              <div className="mversion-info">
                <div className="mversion-time"><Clock size={14} /> {formatTs(v.ts)}</div>
                <div className="mversion-label">{v.label || "자동 저장"}</div>
                <div className="mversion-preview">{(v.html || "").replace(/<[^>]+>/g, " ").slice(0, 90)}…</div>
              </div>
              <button type="button" className="mversion-restore" onClick={() => restore(v)} aria-label="복원">
                <RotateCcw size={16} /> 복원
              </button>
            </div>
          ))}
          {list.length > 0 && (
            <button type="button" className="mversion-clear" onClick={removeAll}>
              <Trash2 size={14} /> 모두 삭제
            </button>
          )}
        </div>
      </div>
    </>
  );
});

export default MobileVersionHistory;
