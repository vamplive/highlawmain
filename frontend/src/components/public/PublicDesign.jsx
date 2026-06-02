/** 공개 페이지 공통 디자인 프리미티브 — 히어로, 섹션 제목, 표면 카드 */
import { Link } from "react-router-dom";

export function PublicHero({
  eyebrow,
  title,
  description,
  image = "/construction-hero3.jpg",
  imagePosition = "center 30%",
  primaryAction,
  secondaryAction,
}) {
  return (
    <section className="public-hero relative flex items-center justify-center overflow-hidden">
      {image ? (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: imagePosition }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a1628 0%, #12233a 52%, #0a1628 100%)" }} />
      )}
      <div className="absolute inset-0 public-hero-overlay" />
      <div className="absolute bottom-0 left-0 right-0 public-hero-fade" />

      <div className="relative text-center" style={{ maxWidth: 760, padding: "0 24px", zIndex: 2 }}>
        {eyebrow && (
          <div className="reveal" style={{ marginBottom: 24 }}>
            <span className="public-hero-eyebrow font-en">{eyebrow}</span>
          </div>
        )}
        <h1 className="font-serif-kr reveal public-hero-title">
          {String(title).split("\n").map((line, index) => (
            <span key={line}>{index > 0 && <br />}{line}</span>
          ))}
        </h1>
        {description && (
          <p className="reveal public-hero-description">
            {description.split("\n").map((line, index) => (
              <span key={line}>{index > 0 && <br />}{line}</span>
            ))}
          </p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="reveal flex flex-wrap justify-center gap-3" style={{ marginTop: 34 }}>
            {primaryAction && <HeroAction action={primaryAction} variant="primary" />}
            {secondaryAction && <HeroAction action={secondaryAction} variant="secondary" />}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroAction({ action, variant }) {
  const className = `public-hero-action public-hero-action-${variant}`;
  if (action.to) {
    return <Link to={action.to} className={className}>{action.icon}{action.label}</Link>;
  }
  return (
    <a href={action.href} target={action.target} rel={action.target ? "noopener noreferrer" : undefined} className={className}>
      {action.icon}{action.label}
    </a>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "center", className = "" }) {
  return (
    <div className={`public-section-heading reveal ${className}`} style={{ textAlign: align }}>
      {eyebrow && <p className="public-section-eyebrow font-en">{eyebrow}</p>}
      <h2 className="public-section-title font-serif-kr">
        {String(title).split("\n").map((line, index) => (
          <span key={line}>{index > 0 && <br />}{line}</span>
        ))}
      </h2>
      {description && <p className="public-section-description">{description}</p>}
    </div>
  );
}

export function SurfaceCard({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={`public-surface-card ${className}`} {...props}>
      {children}
    </Component>
  );
}
