/** Badge — 라벨/태그 표시용 인라인 뱃지 컴포넌트 */
export function Badge({ className = "", variant = "default", style, children, ...props }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";
  const variants = {
    default: "bg-[var(--accent-gold)] text-white",
    secondary: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
    outline: "border border-[var(--border-color)] text-[var(--text-secondary)]",
  };
  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`} style={style} {...props}>
      {children}
    </span>
  );
}
