/** Button — 다용도 버튼 컴포넌트 (variant, size props) */
import { cloneElement, isValidElement } from "react";

export function Button({ asChild = false, className = "", variant = "default", size = "default", children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-gold-hover)]",
    outline: "border border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]",
    ghost: "bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-11 px-6 text-base",
    icon: "h-9 w-9",
  };
  const mergedClassName = `${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`;
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: `${mergedClassName} ${children.props.className || ""}`.trim(),
      ...props,
    });
  }
  return <button className={mergedClassName} {...props}>{children}</button>;
}
