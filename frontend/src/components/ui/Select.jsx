/** Select — 드롭다운 선택 컴포넌트 */
export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`flex h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
