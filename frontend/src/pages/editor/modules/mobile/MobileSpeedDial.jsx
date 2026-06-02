/**
 * MobileSpeedDial — 우하단 플로팅 액션 버튼(FAB)
 *
 * 펼치면 자주 쓰는 빠른 추가 버튼들이 부채꼴로 펼쳐진다:
 * - 음성 받아쓰기
 * - 카메라/이미지 추가
 * - 표 삽입
 * - 슬래시 메뉴 트리거 (자동으로 "/" 입력)
 *
 * 본문 위에 떠 있어 키보드가 닫혀 있을 때도 한 손으로 빠르게 콘텐츠 추가 가능.
 */
import { memo, useState } from "react";
import { Plus, Mic, Camera, Table2, Slash, Sparkles, Search, Wand2 } from "lucide-react";
import { useHapticFeedback } from "./mobileHooks";

const ACTIONS = [
  { id: "palette", label: "검색", icon: <Search size={20} />, color: "#0f172a" },
  { id: "ai", label: "AI", icon: <Wand2 size={20} />, color: "#7c3aed" },
  { id: "voice", label: "음성", icon: <Mic size={20} />, color: "#ef4444" },
  { id: "image", label: "사진", icon: <Camera size={20} />, color: "#10b981" },
  { id: "table", label: "표", icon: <Table2 size={20} />, color: "#6366f1" },
  { id: "slash", label: "명령", icon: <Slash size={20} />, color: "#f59e0b" },
  { id: "focus", label: "집중", icon: <Sparkles size={20} />, color: "#0ea5e9" },
];

export const MobileSpeedDial = memo(function MobileSpeedDial({
  editor,
  onVoice,
  onImage,
  onTable,
  onFocus,
  onPalette,
  onAi,
}) {
  const [open, setOpen] = useState(false);
  const haptic = useHapticFeedback();

  const handle = (id) => {
    haptic(10);
    setOpen(false);
    if (id === "voice") onVoice?.();
    else if (id === "image") onImage?.();
    else if (id === "table") onTable?.();
    else if (id === "focus") onFocus?.();
    else if (id === "palette") onPalette?.();
    else if (id === "ai") onAi?.();
    else if (id === "slash") {
      try { editor?.chain().focus().insertContent("/").run(); } catch { /* ignore */ }
    }
  };

  return (
    <div className={`editor-mfab editor-mobile-only${open ? " open" : ""}`}>
      {open && (
        <div className="mfab-actions">
          {ACTIONS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className="mfab-action"
              style={{ "--mfab-i": i, "--mfab-color": a.color }}
              onClick={() => handle(a.id)}
              aria-label={a.label}
            >
              <span className="mfab-icon">{a.icon}</span>
              <span className="mfab-label">{a.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="mfab-trigger"
        onClick={() => { haptic(8); setOpen((v) => !v); }}
        aria-label={open ? "닫기" : "빠른 추가"}
      >
        <Plus size={24} style={{ transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
      </button>
    </div>
  );
});

export default MobileSpeedDial;
