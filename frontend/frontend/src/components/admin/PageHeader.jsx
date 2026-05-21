/**
 * 관리자 페이지 헤더 — "제목 + 등록 버튼" 패턴 통합
 */
import { btnStyle, COLORS } from "./styles";

/**
 * @param {{ title: string, subtitle?: string, onAdd?: Function, addLabel?: string, children?: React.ReactNode }} props
 */
export default function PageHeader({ title, subtitle, onAdd, addLabel = "+ 등록", children }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 24,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, marginBottom: subtitle ? 4 : 0 }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{subtitle}</p>}
      </div>
      <div className="admin-page-actions flex flex-wrap justify-end gap-2">
        {children}
        {onAdd && <button onClick={() => onAdd()} style={btnStyle()}>{addLabel}</button>}
      </div>
    </div>
  );
}
