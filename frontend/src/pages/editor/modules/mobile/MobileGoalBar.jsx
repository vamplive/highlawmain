/**
 * MobileGoalBar — 글자 수 목표 진행률 바
 *
 * 사용자가 모바일에서 글의 길이 목표(예: 1500자, 800자)를 설정하면 상단/하단에
 * 가는 진행률 바가 노출되어 동기 부여. 100% 도달 시 가벼운 햅틱 피드백.
 */
import { memo, useEffect, useRef, useState } from "react";
import { Target, X } from "lucide-react";
import { useHapticFeedback } from "./mobileHooks";

const STORAGE_KEY = "yj-editor-mobile-goal";
const PRESETS = [400, 800, 1500, 3000];

function loadGoal() {
  if (typeof localStorage === "undefined") return 800;
  try {
    const v = parseInt(localStorage.getItem(STORAGE_KEY) || "800", 10);
    return Number.isFinite(v) && v > 0 ? v : 800;
  } catch { return 800; }
}

function saveGoal(g) {
  try { localStorage.setItem(STORAGE_KEY, String(g)); } catch { /* ignore */ }
}

export const MobileGoalBar = memo(function MobileGoalBar({ editor, hidden }) {
  const [goal, setGoal] = useState(loadGoal);
  const [chars, setChars] = useState(0);
  const [editing, setEditing] = useState(false);
  const reachedRef = useRef(false);
  const haptic = useHapticFeedback();

  useEffect(() => {
    if (!editor) return undefined;
    const sync = () => {
      const next = (editor.getText() || "").length;
      setChars(next);
      // 목표 도달 순간 한 번만 햅틱 (state 토글 없이 ref로 추적해 cascading render 방지)
      if (!reachedRef.current && next >= goal && goal > 0) {
        reachedRef.current = true;
        haptic(20);
      } else if (next < goal) {
        reachedRef.current = false;
      }
    };
    sync();
    editor.on("update", sync);
    return () => editor.off("update", sync);
  }, [editor, goal, haptic]);

  if (hidden) return null;

  const ratio = Math.min(1.2, chars / Math.max(1, goal));
  const pct = Math.min(100, Math.round(ratio * 100));

  return (
    <div className="editor-mgoal editor-mobile-only" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={chars}>
      <button
        type="button"
        className="mgoal-toggle"
        onClick={() => setEditing((v) => !v)}
        aria-label="목표 설정"
      >
        <Target size={14} />
        <span>{chars}/{goal}자 ({pct}%)</span>
      </button>
      <div className="mgoal-track" data-state={ratio >= 1 ? "done" : ratio >= 0.7 ? "near" : "go"}>
        <div className="mgoal-fill" style={{ width: `${pct}%` }} />
      </div>
      {editing && (
        <div className="mgoal-popover">
          <div className="mgoal-presets">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={n === goal ? "active" : ""}
                onClick={() => { setGoal(n); saveGoal(n); }}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min="50"
              step="50"
              value={goal}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v > 0) { setGoal(v); saveGoal(v); }
              }}
              style={{ width: 90 }}
            />
            <button type="button" onClick={() => setEditing(false)} aria-label="닫기"><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
});

export default MobileGoalBar;
