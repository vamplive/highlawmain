import { useEffect, useRef, useState } from "react";

/** SNS 공유 드롭다운 — Web Share API가 가능하면 그것을 우선 사용,
 *  아니면 카카오톡/링크복사 폴백을 보여준다. */
export default function ShareMenu({ name }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleClick() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${name} 변호사 — 법무법인 하이로`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }
    setOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <button type="button" className="lp-btn lp-btn-secondary" aria-haspopup="menu" aria-expanded={open} onClick={handleClick}>
        공유하기
      </button>
      {open && (
        <div role="menu" className="lp-share-menu">
          <button role="menuitem" type="button" onClick={copyLink} className="lp-share-item">
            {copied ? "✓ 복사됨" : "링크 복사"}
          </button>
          <a role="menuitem" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer" className="lp-share-item">
            X (Twitter)
          </a>
          <a role="menuitem" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="lp-share-item">
            Facebook
          </a>
        </div>
      )}
      <style>{`
        .lp-share-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: #fff; border: 1px solid var(--lp-line); border-radius: 6px;
          min-width: 180px; padding: 4px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          z-index: 50;
        }
        .lp-share-item {
          display: block; width: 100%; text-align: left;
          padding: 10px 16px; font-size: 14px; color: var(--lp-ink);
          background: transparent; border: 0; cursor: pointer; text-decoration: none;
        }
        .lp-share-item:hover { background: var(--lp-accent-soft); color: var(--lp-accent); }
        @media (min-width: 1024px) {
          .lp-share-menu { right: auto; left: 0; }
        }
      `}</style>
    </div>
  );
}
