/** 7개 탭 컨텐츠 — 같은 패턴이 반복되어 한 파일에 모음. */
import Timeline from "./Timeline";
import ItemList from "./ItemList";

function SectionH2({ children }) {
  return <h2 className="lp-section-h2">{children}</h2>;
}

export function ProfileTab({ lawyer }) {
  return (
    <div className="lp-section-stack">
      {lawyer.intro && (
        <section>
          <SectionH2>소개</SectionH2>
          <p className="lp-intro-body">{lawyer.intro}</p>
        </section>
      )}
      <section>
        <SectionH2>학력</SectionH2>
        <Timeline items={lawyer.education} />
      </section>
      <section>
        <SectionH2>경력</SectionH2>
        <Timeline items={lawyer.career} />
      </section>
      <section>
        <SectionH2>자격</SectionH2>
        <ItemList items={(lawyer.qualifications || []).map((q) => ({ title: q }))} />
      </section>
      {(lawyer.memberships?.length > 0) && (
        <section>
          <SectionH2>소속 위원회 · 학회</SectionH2>
          <ItemList items={lawyer.memberships.map((m) => ({ title: m }))} />
        </section>
      )}
      {(lawyer.consultHours || lawyer.email || lawyer.phone || lawyer.blogUrl) && (
        <section>
          <SectionH2>연락 · 상담</SectionH2>
          <dl className="lp-meta-list">
            {lawyer.consultHours && (<><dt>상담시간</dt><dd>{lawyer.consultHours}</dd></>)}
            {lawyer.email && (<><dt>이메일</dt><dd><a href={`mailto:${lawyer.email}`}>{lawyer.email}</a></dd></>)}
            {lawyer.phone && (<><dt>전화</dt><dd>{lawyer.phone}</dd></>)}
            {lawyer.blogUrl && (
              <>
                <dt>블로그</dt>
                <dd>
                  <a href={lawyer.blogUrl} target="_blank" rel="noopener noreferrer">
                    {lawyer.blogUrl}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}
      <SharedStyles />
    </div>
  );
}

export function PracticeAreasTab({ lawyer }) {
  if (!lawyer.practiceAreas?.length) {
    return <p className="lp-empty">등록된 업무분야가 없습니다.</p>;
  }
  return (
    <div>
      <SectionH2>주요 업무분야</SectionH2>
      <ul className="lp-practice-grid">
        {lawyer.practiceAreas.map((area) => (
          <li key={area} className="lp-practice-card">{area}</li>
        ))}
      </ul>
      <style>{`
        .lp-practice-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        .lp-practice-card {
          padding: 20px 12px; text-align: center;
          border: 1px solid var(--lp-line); border-radius: 6px;
          font-size: 14.5px; color: var(--lp-ink); background: var(--lp-surface);
          font-weight: 500; letter-spacing: -0.01em;
          transition: border-color 0.15s, color 0.15s, transform 0.15s;
        }
        .lp-practice-card:hover {
          border-color: var(--lp-accent); color: var(--lp-accent);
          transform: translateY(-1px);
        }
        @media (min-width: 640px) {
          .lp-practice-grid { gap: 12px; }
          .lp-practice-card { padding: 24px 16px; font-size: 16px; }
        }
        @media (min-width: 768px) {
          .lp-practice-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .lp-practice-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
      <SharedStyles />
    </div>
  );
}

export function PublicationsTab({ lawyer }) {
  const pubs = (lawyer.publications || [])
    .slice()
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .map((p) => ({
      lead: String(p.year || ""),
      title: `「${p.title}」`,
      meta: [p.journal, (p.coAuthors || []).join(", ")].filter(Boolean).join(" · "),
      url: p.url, external: !!p.url,
    }));
  const books = (lawyer.books || [])
    .slice()
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .map((b) => ({
      lead: String(b.year || ""),
      title: b.title,
      meta: [b.publisher, b.role].filter(Boolean).join(" · "),
      url: b.url, external: !!b.url,
    }));
  return (
    <div className="lp-section-stack">
      <section>
        <SectionH2>논문</SectionH2>
        <ItemList items={pubs} emptyMessage="등록된 논문이 없습니다." />
      </section>
      <section>
        <SectionH2>저서</SectionH2>
        <ItemList items={books} emptyMessage="등록된 저서가 없습니다." />
      </section>
      <SharedStyles />
    </div>
  );
}

export function MediaTab({ lawyer }) {
  const items = (lawyer.media || [])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map((m) => ({
      lead: m.date || "",
      title: m.title,
      meta: m.outlet,
      url: m.url, external: !!m.url,
    }));
  return (
    <div>
      <SectionH2>언론활동 · 미디어</SectionH2>
      <ItemList items={items} emptyMessage="등록된 미디어 항목이 없습니다." />
      <SharedStyles />
    </div>
  );
}

export function ColumnsTab({ lawyer }) {
  const items = (lawyer.columns || [])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .map((c) => ({
      lead: c.date || "",
      title: c.title,
      meta: c.excerpt,
      url: c.url, external: c.url && c.url.startsWith("http"),
    }));
  return (
    <div>
      <SectionH2>블로그</SectionH2>
      <ItemList items={items} emptyMessage="등록된 글이 없습니다." />
      <SharedStyles />
    </div>
  );
}

// AI 키워드가 제목/기관/설명 어디에라도 들어 있으면 "법률 AI 강의" 그룹으로 묶는다.
function isAiLecture(lecture) {
  const haystack = `${lecture.title || ""} ${lecture.host || ""} ${lecture.description || ""}`;
  return /\bAI\b|법률\s*AI|인공지능/i.test(haystack);
}

function LectureCard({ lecture }) {
  return (
    <li className="lp-lecture-card">
      {lecture.thumbnailUrl && (
        <div className="lp-lecture-thumb">
          <img src={lecture.thumbnailUrl} alt="" loading="lazy"
            onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }} />
        </div>
      )}
      <div className="lp-lecture-body">
        {lecture.date && <div className="lp-lecture-date">{lecture.date}</div>}
        <h3 className="lp-lecture-title">{lecture.title}</h3>
        {(lecture.host || lecture.venue) && (
          <div className="lp-lecture-meta">
            {lecture.host && <span className="lp-lecture-host">{lecture.host}</span>}
            {lecture.host && lecture.venue && <span aria-hidden="true"> · </span>}
            {lecture.venue && <span>{lecture.venue}</span>}
          </div>
        )}
        {lecture.description && <p className="lp-lecture-desc">{lecture.description}</p>}
        {lecture.materialUrl && (
          <a className="lp-lecture-material" href={lecture.materialUrl}
            target="_blank" rel="noopener noreferrer">
            강의안 {lecture.materialName ? `(${lecture.materialName})` : "보기"} →
          </a>
        )}
      </div>
    </li>
  );
}

export function LecturesTab({ lawyer }) {
  const lectures = (lawyer.lectures || [])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (lectures.length === 0) {
    return (
      <div>
        <SectionH2>강연 · 세미나</SectionH2>
        <p className="lp-empty">등록된 강연이 없습니다.</p>
        <SharedStyles />
      </div>
    );
  }

  const aiLectures = lectures.filter(isAiLecture);
  const otherLectures = lectures.filter((l) => !isAiLecture(l));
  // 두 그룹 모두 있을 때만 그룹 헤더를 노출. 한쪽만 있으면 단일 섹션 유지.
  const useGrouping = aiLectures.length > 0 && otherLectures.length > 0;

  return (
    <div>
      <SectionH2>강연 · 세미나</SectionH2>
      {useGrouping ? (
        <>
          <h3 className="lp-lecture-group-h">법률 AI 강의 · 특강 ({aiLectures.length})</h3>
          <ul className="lp-lecture-grid">
            {aiLectures.map((l, i) => <LectureCard key={l.id || `ai-${i}`} lecture={l} />)}
          </ul>
          <h3 className="lp-lecture-group-h" style={{ marginTop: 36 }}>그 외 강의 ({otherLectures.length})</h3>
          <ul className="lp-lecture-grid">
            {otherLectures.map((l, i) => <LectureCard key={l.id || `etc-${i}`} lecture={l} />)}
          </ul>
        </>
      ) : (
        <ul className="lp-lecture-grid">
          {lectures.map((l, i) => <LectureCard key={l.id || i} lecture={l} />)}
        </ul>
      )}
      <style>{`
        .lp-lecture-group-h {
          font-size: 14px; font-weight: 600;
          color: var(--lp-muted);
          letter-spacing: 0.02em;
          margin: 4px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-lecture-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 720px) {
          .lp-lecture-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
        .lp-lecture-card {
          display: flex; flex-direction: column;
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .lp-lecture-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
          border-color: var(--lp-accent);
        }
        .lp-lecture-thumb {
          width: 100%; aspect-ratio: 16 / 9;
          background: #f1f3f7;
          overflow: hidden;
        }
        .lp-lecture-thumb img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .lp-lecture-body {
          padding: 16px 18px 18px;
          display: flex; flex-direction: column; gap: 6px;
          flex: 1;
        }
        .lp-lecture-date {
          font-family: var(--font-mono);
          font-size: 12px; color: var(--lp-muted);
          letter-spacing: 0.04em;
        }
        .lp-lecture-title {
          font-size: 16px; font-weight: 600;
          color: var(--lp-ink);
          line-height: 1.4;
          margin: 0;
          word-break: keep-all;
        }
        .lp-lecture-meta {
          font-size: 13px; color: var(--lp-muted);
          line-height: 1.5;
        }
        .lp-lecture-host { color: var(--lp-ink); font-weight: 500; }
        .lp-lecture-desc {
          font-size: 13.5px; color: var(--lp-ink);
          line-height: 1.6;
          margin: 4px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .lp-lecture-material {
          margin-top: auto;
          padding-top: 8px;
          font-size: 13px;
          color: var(--lp-accent);
          text-decoration: none;
          font-weight: 500;
        }
        .lp-lecture-material:hover { text-decoration: underline; }
        @media (min-width: 1024px) {
          .lp-lecture-title { font-size: 17px; }
        }
      `}</style>
      <SharedStyles />
    </div>
  );
}

export function CasesTab({ lawyer }) {
  const cases = (lawyer.cases || [])
    .slice()
    .sort((a, b) => (b.year || 0) - (a.year || 0));
  if (cases.length === 0) {
    return (
      <div>
        <SectionH2>주요 수행사례</SectionH2>
        <p className="lp-empty">등록된 사례가 없습니다.</p>
        <SharedStyles />
      </div>
    );
  }
  return (
    <div>
      <SectionH2>주요 수행사례</SectionH2>
      <p className="lp-cases-disclaimer">
        변호사법 및 광고규정에 따라 의뢰인의 동의 없이 구체적 인적사항을 공개하지 않으며, 사건번호와 결과만 익명·일반화하여 표기합니다.
      </p>
      <ul className="lp-cases">
        {cases.map((c, i) => (
          <li key={i} className="lp-case">
            <div className="lp-case-head">
              {c.category && <span className="lp-case-chip">{c.category}</span>}
              <span className="lp-case-year">{c.year}</span>
              {c.outcome && <span className="lp-case-outcome">{c.outcome}</span>}
            </div>
            {c.caseNumber && <div className="lp-case-num">{c.caseNumber}</div>}
            <div className="lp-case-desc">{c.description}</div>
          </li>
        ))}
      </ul>
      <style>{`
        .lp-cases-disclaimer {
          font-size: 12.5px; color: var(--lp-muted); line-height: 1.6;
          background: var(--lp-bg); padding: 10px 14px;
          border-left: 3px solid var(--lp-accent); border-radius: 2px;
          margin: 0 0 20px;
        }
        @media (min-width: 640px) {
          .lp-cases-disclaimer { font-size: 13px; padding: 12px 16px; margin-bottom: 24px; }
        }
        .lp-cases { list-style: none; padding: 0; margin: 0; }
        .lp-case {
          padding: 18px 0; border-bottom: 1px solid var(--lp-line);
        }
        .lp-case:first-child { padding-top: 4px; }
        .lp-case:last-child { border-bottom: 0; }
        .lp-case-head {
          display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
          margin-bottom: 6px;
        }
        .lp-case-chip {
          background: var(--lp-accent-soft); color: var(--lp-accent);
          padding: 3px 9px; border-radius: 9999px; font-size: 11.5px; font-weight: 600;
        }
        .lp-case-year {
          font-family: var(--font-mono); color: var(--lp-muted); font-size: 12.5px;
        }
        .lp-case-outcome {
          margin-left: auto;
          background: var(--lp-ink); color: #fff;
          padding: 3px 9px; border-radius: 4px; font-size: 11.5px; font-weight: 600;
        }
        .lp-case-num {
          font-family: var(--font-mono); font-size: 12.5px; color: var(--lp-ink-soft);
          margin-bottom: 4px; word-break: break-all;
        }
        .lp-case-desc { font-size: 15px; color: var(--lp-ink); line-height: 1.65; word-break: keep-all; }
        @media (min-width: 640px) {
          .lp-case { padding: 20px 0; }
          .lp-case-desc { font-size: 16px; }
        }
      `}</style>
      <SharedStyles />
    </div>
  );
}

function SharedStyles() {
  return (
    <style>{`
      .lp-section-stack > section + section { margin-top: 36px; }
      .lp-section-h2 {
        font-family: var(--font-serif-kr);
        font-size: 19px; color: var(--lp-ink); letter-spacing: -0.015em;
        margin: 0 0 16px; padding-bottom: 10px;
        border-bottom: 1px solid var(--lp-line);
        font-weight: 700;
      }
      @media (min-width: 640px) {
        .lp-section-h2 { font-size: 22px; margin: 0 0 20px; padding-bottom: 12px; }
        .lp-section-stack > section + section { margin-top: 48px; }
      }
      @media (min-width: 1024px) {
        .lp-section-h2 { font-size: 26px; }
        .lp-section-stack > section + section { margin-top: 64px; }
      }
      .lp-intro-body {
        font-size: 15px; line-height: 1.85; color: var(--lp-ink-soft); margin: 0;
        white-space: pre-line; word-break: keep-all;
      }
      @media (min-width: 640px) { .lp-intro-body { font-size: 16px; } }
      .lp-empty {
        font-size: 14px; color: var(--lp-muted);
        padding: 32px 0; text-align: center;
        background: var(--lp-bg);
        border-radius: 6px;
      }
      .lp-meta-list {
        display: grid; grid-template-columns: 84px 1fr; gap: 10px 14px;
        margin: 0; font-size: 14.5px;
      }
      @media (min-width: 640px) {
        .lp-meta-list { grid-template-columns: 100px 1fr; font-size: 15px; }
      }
      .lp-meta-list dt { color: var(--lp-muted); }
      .lp-meta-list dd { margin: 0; color: var(--lp-ink); word-break: break-all; }
      .lp-meta-list a { color: var(--lp-accent); text-decoration: none; }
      .lp-meta-list a:hover { text-decoration: underline; }
    `}</style>
  );
}
