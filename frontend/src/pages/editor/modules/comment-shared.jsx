/**
 * comment-shared — 댓글 관련 공유 UI 컴포넌트
 *
 * AuthorAvatar, MoreMenu 등 여러 댓글 컴포넌트에서 공통으로 사용하는 프리미티브.
 */
import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   Author Avatar
   ───────────────────────────────────────────── */
export function AuthorAvatar({ author, size = 28 }) {
  return (
    <div className="comment-author-avatar" style={{
      width: size, height: size, backgroundColor: author.color,
      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.43, fontWeight: 600, flexShrink: 0,
      letterSpacing: -0.5,
    }}>
      {author.initials}
    </div>
  );
}

/* ─────────────────────────────────────────────
   More Menu (... 드롭다운)
   ───────────────────────────────────────────── */
export function MoreMenu({ items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="comment-more-menu">
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} className="comment-more-divider" />
        ) : (
          <button key={i} type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); item.onClick?.(); onClose(); }}
            disabled={item.disabled}
            className={`comment-more-item${item.danger ? " danger" : ""}${item.disabled ? " disabled" : ""}`}>
            {item.icon && <span className="comment-more-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
}

