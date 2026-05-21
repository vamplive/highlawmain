/** Input — 텍스트 입력 필드 컴포넌트 */
export function Input({ className = "", ...props }) {
  return (
    <input
      className={`flex h-9 w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)] ${className}`}
      {...props}
    />
  );
}
