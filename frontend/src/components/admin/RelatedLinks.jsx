/**
 * 관련 페이지 빠른 이동 칩 — 의뢰인/사건 등 detail 페이지에서 다른 관련 페이지로
 * 한 번의 탭으로 이동할 수 있도록 한다. 모바일에서 햄버거를 열지 않고도
 * 같은 의뢰인의 시간기록·예치금·송장 등으로 직접 가능.
 *
 * 사용 예:
 *   <RelatedLinks links={[
 *     { to: `/admin/time-entries?clientId=${id}`, label: "시간 기록", icon: "🕒" },
 *     { to: `/admin/trust-accounts?clientId=${id}`, label: "예치금", icon: "🏦" },
 *   ]} />
 */
import { Link } from "react-router-dom";
import { COLORS } from "./styles";

export default function RelatedLinks({ links = [], label = "관련 페이지" }) {
  if (!links.length) return null;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
      padding: "10px 0",
      marginBottom: 14,
    }}>
      {label && (
        <span style={{
          fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
          letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 4,
        }}>
          {label}
        </span>
      )}
      {links.map((l) => (
        <Link
          key={l.to + l.label}
          to={l.to}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 999,
            fontSize: 12,
            color: COLORS.text,
            textDecoration: "none",
            fontWeight: 500,
            transition: "all 120ms ease",
            minHeight: 36,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0f4ff";
            e.currentTarget.style.borderColor = "#818cf8";
            e.currentTarget.style.color = "#4f46e5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = COLORS.border;
            e.currentTarget.style.color = COLORS.text;
          }}
        >
          {l.icon && <span style={{ fontSize: 14 }}>{l.icon}</span>}
          <span>{l.label}</span>
          {typeof l.count === "number" && (
            <span style={{
              padding: "1px 7px",
              background: "rgba(79,70,229,0.12)",
              color: "#4f46e5",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 700,
            }}>{l.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
