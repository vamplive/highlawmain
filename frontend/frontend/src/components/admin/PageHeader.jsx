/**
 * 관리자 페이지 헤더 — 홈페이지 디자인 토큰 기반
 */
import { COLORS } from "./styles";

export default function PageHeader({ title, subtitle, onAdd, addLabel = "+ 등록", children }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 32,
      paddingBottom: 20,
      borderBottom: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        {subtitle && (
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
            color: COLORS.accent, textTransform: "uppercase",
            margin: "0 0 6px",
          }}>
            {subtitle}
          </p>
        )}
        <h1 style={{
          fontSize: 22, fontWeight: 600, color: COLORS.text,
          margin: 0, lineHeight: 1.3,
          fontFamily: "'Georgia', 'Cormorant Garamond', serif",
        }}>
          {title}
        </h1>
      </div>
      <div className="admin-page-actions flex flex-wrap justify-end gap-2" style={{ flexShrink: 0 }}>
        {children}
        {onAdd && (
          <button
            onClick={() => onAdd()}
            style={{
              padding: "9px 20px", fontSize: 13, fontWeight: 600,
              color: "#fff", background: COLORS.primary,
              border: "none", borderRadius: 6, cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
