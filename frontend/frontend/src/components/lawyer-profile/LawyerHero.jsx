import { Link } from "react-router-dom";
import ShareMenu from "./ShareMenu";

/** 변호사 헤더 카드 — 데스크톱은 좌사진/우텍스트, 모바일은 중앙 정렬 세로형. */
export default function LawyerHero({ lawyer }) {
  const photoAlt = lawyer.photoAlt || `${lawyer.name} 변호사 프로필 사진`;
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">
        <div className="lp-hero-photo-wrap">
          {lawyer.photo ? (
            <img src={lawyer.photo} alt={photoAlt} className="lp-hero-photo" loading="eager" />
          ) : (
            <div className="lp-hero-photo lp-hero-photo--placeholder" aria-hidden="true">
              {lawyer.name?.[0] || "?"}
            </div>
          )}
        </div>

        <div className="lp-hero-text">
          {(lawyer.affiliation || lawyer.team) && (
            <p className="lp-eyebrow">
              {lawyer.affiliation}
              {lawyer.team ? ` · ${lawyer.team}` : ""}
            </p>
          )}

          <h1 className="lp-name">
            <span>{lawyer.name}</span>
            {lawyer.nameHanja && <span className="lp-name-hanja"> {lawyer.nameHanja}</span>}
          </h1>

          <p className="lp-subtitle">
            {lawyer.title}
            {lawyer.nameEn ? ` · ${lawyer.nameEn}` : ""}
          </p>

          {lawyer.tagline && <p className="lp-tagline">{lawyer.tagline}</p>}

          {lawyer.practiceAreas?.length > 0 && (
            <ul className="lp-chips" aria-label="주요 업무분야">
              {lawyer.practiceAreas.map((area) => (
                <li key={area} className="lp-chip">{area}</li>
              ))}
            </ul>
          )}

          <div className="lp-cta-row">
            <Link to={lawyer.consultUrl || "/consultation"} className="lp-btn lp-btn-primary">
              상담 예약
            </Link>
            <ShareMenu name={lawyer.name} />
          </div>
        </div>
      </div>

      <style>{`
        .lp-hero { background: var(--lp-bg); }
        .lp-hero-inner {
          max-width: 72rem; margin: 0 auto;
          padding: 28px 20px 36px;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px;
        }
        .lp-hero-photo-wrap { width: 168px; }
        .lp-hero-photo {
          width: 100%; aspect-ratio: 3 / 4; object-fit: cover;
          border-radius: 8px; background: #ddd;
          border: 1px solid var(--lp-line);
          box-shadow: 0 4px 16px -8px rgba(26,26,26,0.18);
        }
        .lp-hero-photo--placeholder {
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-size: 64px; color: var(--lp-muted);
        }
        .lp-hero-text { width: 100%; max-width: 36rem; }
        .lp-eyebrow {
          font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--lp-muted); margin: 0 0 10px;
        }
        .lp-name {
          font-family: var(--font-serif-kr);
          font-size: 30px; line-height: 1.15; letter-spacing: -0.015em;
          color: var(--lp-ink); margin: 0; font-weight: 700;
        }
        .lp-name-hanja {
          font-size: 0.55em; color: var(--lp-muted); margin-left: 8px; font-weight: 400;
        }
        .lp-subtitle {
          font-size: 14.5px; color: var(--lp-ink-soft); margin: 8px 0 0;
        }
        .lp-tagline {
          font-family: var(--font-serif-kr);
          font-size: 16px; line-height: 1.65; color: var(--lp-ink-soft);
          margin: 18px 0 0; white-space: pre-line;
        }
        .lp-chips {
          list-style: none; padding: 0; margin: 22px 0 0;
          display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
        }
        .lp-chip {
          background: var(--lp-accent-soft); color: var(--lp-accent);
          padding: 5px 12px; border-radius: 9999px; font-size: 12.5px; font-weight: 500;
          letter-spacing: -0.01em;
        }
        .lp-cta-row {
          margin-top: 24px; display: flex; flex-direction: column; gap: 10px; width: 100%;
        }
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          height: 46px; padding: 0 22px; border-radius: 6px;
          font-size: 14.5px; font-weight: 600; cursor: pointer; text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          width: 100%; letter-spacing: -0.01em;
        }
        .lp-btn-primary { background: var(--lp-accent); color: #fff; border: 1px solid var(--lp-accent); }
        .lp-btn-primary:hover { background: var(--lp-accent-hover); border-color: var(--lp-accent-hover); }
        .lp-btn-secondary {
          background: transparent; color: var(--lp-ink); border: 1px solid var(--lp-ink);
        }
        .lp-btn-secondary:hover { background: var(--lp-ink); color: #fff; }

        @media (min-width: 640px) {
          .lp-hero-inner { padding: 36px 24px 44px; gap: 28px; }
          .lp-hero-photo-wrap { width: 200px; }
          .lp-name { font-size: 34px; }
        }

        @media (min-width: 1024px) {
          .lp-hero-inner {
            flex-direction: row; align-items: flex-start; text-align: left;
            gap: 56px; padding: 64px 24px 72px;
          }
          .lp-hero-photo-wrap { width: 260px; flex-shrink: 0; }
          .lp-hero-text { max-width: none; flex: 1; }
          .lp-name { font-size: 44px; }
          .lp-subtitle { font-size: 17px; }
          .lp-tagline { font-size: 19px; }
          .lp-chips { justify-content: flex-start; }
          .lp-cta-row { flex-direction: row; width: auto; }
          .lp-btn { width: auto; min-width: 160px; }
        }
      `}</style>
    </section>
  );
}
