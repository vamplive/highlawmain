/** 한 줄 항목 공용 리스트 — 논문/저서/미디어/칼럼/강연 등에 사용.
 *  각 항목은 { lead, title, meta, url } 형태로 변환되어 들어온다. */
export default function ItemList({ items, emptyMessage = "등록된 항목이 없습니다." }) {
  if (!items || items.length === 0) {
    return <p className="lp-empty">{emptyMessage}</p>;
  }
  return (
    <ul className="lp-itemlist">
      {items.map((it, i) => {
        const inner = (
          <>
            {it.lead && <span className="lp-itemlist-lead">{it.lead}</span>}
            <span className="lp-itemlist-title">{it.title}</span>
            {it.meta && <span className="lp-itemlist-meta">{it.meta}</span>}
          </>
        );
        return (
          <li key={i} className="lp-itemlist-item">
            {it.url ? (
              <a href={it.url} target={it.external ? "_blank" : undefined} rel={it.external ? "noopener noreferrer" : undefined}>
                {inner}
              </a>
            ) : (
              <span>{inner}</span>
            )}
          </li>
        );
      })}
      <style>{`
        .lp-itemlist { list-style: none; padding: 0; margin: 0; }
        .lp-itemlist-item {
          padding: 14px 0; border-bottom: 1px solid var(--lp-line);
          font-size: 15.5px; line-height: 1.65;
        }
        .lp-itemlist-item:first-child { padding-top: 4px; }
        .lp-itemlist-item:last-child { border-bottom: 0; padding-bottom: 4px; }
        .lp-itemlist-item a {
          color: inherit; text-decoration: none;
          display: block;
        }
        .lp-itemlist-item a:hover .lp-itemlist-title {
          color: var(--lp-accent); text-decoration: underline;
        }
        .lp-itemlist-lead {
          font-family: var(--font-mono); font-size: 12.5px; color: var(--lp-muted);
          margin-right: 12px; letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .lp-itemlist-title { color: var(--lp-ink); word-break: keep-all; }
        .lp-itemlist-meta {
          display: block; color: var(--lp-muted); font-size: 13.5px;
          margin-top: 4px;
        }
        @media (min-width: 640px) {
          .lp-itemlist-item { font-size: 16px; }
          .lp-itemlist-meta { display: inline; margin-left: 8px; margin-top: 0; font-size: 14px; }
        }
      `}</style>
    </ul>
  );
}
