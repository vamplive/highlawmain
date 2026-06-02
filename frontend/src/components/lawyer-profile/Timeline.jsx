/** 학력/경력 공용 타임라인.
 *  기간(period)이 있으면 좌측에 표시하고, 없으면 제목이 전체 폭을 차지한다. */
export default function Timeline({ items }) {
  if (!items || items.length === 0) {
    return <p className="lp-empty">등록된 항목이 없습니다.</p>;
  }
  return (
    <ul className="lp-timeline">
      {items.map((it, i) => (
        <li key={i} className="lp-timeline-item">
          {it.period && <div className="lp-timeline-period">{it.period}</div>}
          <div className="lp-timeline-content">
            <div className="lp-timeline-title">{it.title}</div>
            {it.detail && <div className="lp-timeline-detail">{it.detail}</div>}
          </div>
        </li>
      ))}
      <style>{`
        .lp-timeline { list-style: none; padding: 0; margin: 0; }
        .lp-timeline-item {
          padding: 14px 0;
          border-bottom: 1px solid var(--lp-line);
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 16px;
        }
        .lp-timeline-item:first-child { padding-top: 4px; }
        .lp-timeline-item:last-child { border-bottom: 0; padding-bottom: 4px; }
        .lp-timeline-period {
          flex: 0 0 auto;
          min-width: 90px;
          font-family: var(--font-mono); font-size: 12px; color: var(--lp-muted);
          letter-spacing: 0.02em;
        }
        .lp-timeline-content {
          flex: 1 1 0;
          min-width: 0;
        }
        .lp-timeline-title {
          font-size: 15.5px; color: var(--lp-ink); line-height: 1.5;
          word-break: keep-all; overflow-wrap: anywhere;
        }
        .lp-timeline-detail { font-size: 13.5px; color: var(--lp-muted); margin-top: 4px; line-height: 1.55; }
        @media (min-width: 640px) {
          .lp-timeline-item { padding: 16px 0; gap: 4px 24px; }
          .lp-timeline-period { min-width: 110px; font-size: 13px; }
          .lp-timeline-title { font-size: 16px; }
        }
        @media (min-width: 1024px) {
          .lp-timeline-item { gap: 4px 32px; }
          .lp-timeline-period { min-width: 130px; }
          .lp-timeline-title { font-size: 17px; }
        }
      `}</style>
    </ul>
  );
}
