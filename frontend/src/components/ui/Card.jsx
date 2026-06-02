/** Card — 카드 레이아웃 컴포넌트 (Card, CardContent) */
export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-lg border border-[var(--border-subtle)] bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`p-5 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`text-base font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
