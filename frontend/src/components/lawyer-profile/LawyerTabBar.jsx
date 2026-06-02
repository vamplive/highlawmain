import { useEffect, useRef } from "react";

/** sticky 탭바 — 모바일 가로 스크롤, 키보드 좌우 화살표 지원. */
export default function LawyerTabBar({ tabs, active, onChange }) {
  const refs = useRef({});

  useEffect(() => {
    const el = refs.current[active];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  function handleKey(e) {
    const idx = tabs.findIndex((t) => t.id === active);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    const target = tabs[next];
    onChange(target.id);
    setTimeout(() => refs.current[target.id]?.focus(), 0);
  }

  return (
    <div className="lp-tabbar-wrap">
      <div className="lp-tabbar-inner">
        <div role="tablist" aria-label="변호사 프로필 탭" className="lp-tab-scroll" onKeyDown={handleKey}>
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                ref={(el) => (refs.current[tab.id] = el)}
                role="tab"
                type="button"
                id={`lp-tab-${tab.id}`}
                aria-controls={`lp-panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`lp-tab ${isActive ? "is-active" : ""}`}
                onClick={() => onChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        .lp-tabbar-wrap {
          position: sticky; top: 0; z-index: 30;
          background: rgba(255,255,255,0.96);
          backdrop-filter: saturate(140%) blur(8px);
          -webkit-backdrop-filter: saturate(140%) blur(8px);
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-tabbar-inner {
          max-width: 72rem; margin: 0 auto; padding: 0 20px;
        }
        .lp-tab-scroll {
          display: flex; gap: 2px;
          overflow-x: auto; white-space: nowrap;
          margin: 0 -20px; padding: 0 20px;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .lp-tab-scroll::-webkit-scrollbar { display: none; }
        .lp-tab {
          flex: 0 0 auto;
          background: transparent; border: 0; cursor: pointer;
          padding: 14px 12px; font-size: 14.5px; color: var(--lp-ink-soft);
          font-weight: 500; letter-spacing: -0.01em;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .lp-tab:hover { color: var(--lp-ink); }
        .lp-tab.is-active {
          color: var(--lp-accent); font-weight: 700;
          border-bottom-color: var(--lp-accent);
        }
        .lp-tab:focus-visible {
          outline: 2px solid var(--lp-accent); outline-offset: -2px; border-radius: 2px;
        }
        @media (min-width: 640px) {
          .lp-tabbar-inner { padding: 0 24px; }
          .lp-tab-scroll { margin: 0 -24px; padding: 0 24px; gap: 4px; }
          .lp-tab { padding: 16px 14px; font-size: 15px; }
        }
        @media (min-width: 1024px) {
          .lp-tab { padding: 20px 18px; font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
