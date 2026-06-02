/** Textarea — 다줄 텍스트 입력 컴포넌트 */
export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)] ${className}`}
      {...props}
    />
  );
}
