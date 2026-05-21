/**
 * 리본 버튼 컴포넌트
 * RibbonBtn (기본), RibbonBtnLarge (대형/분할) 버튼을 정의한다.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RIBBON_FONT, BTN_COLORS } from "./ribbonConstants";

/* ── 기본 리본 버튼 (Word 365 스타일) ── */
export function RibbonBtn({
  children,
  active,
  onClick,
  title,
  "aria-label": ariaLabel,
  style,
  small,
  disabled,
  className,
  onKeyDown,
  ...buttonProps
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  /** 배경색 결정: active > pressed > hovered > transparent */
  const getBg = () => {
    if (active) return BTN_COLORS.active;
    if (pressed) return BTN_COLORS.pressed;
    if (hovered && !disabled) return BTN_COLORS.hover;
    return "transparent";
  };

  /** 테두리 결정: active 상태일 때만 실선 */
  const getBorder = () => {
    if (active) return `1px solid ${BTN_COLORS.activeBorder}`;
    if (pressed) return `1px solid ${BTN_COLORS.activeBorder}`;
    return "1px solid transparent";
  };

  return (
    <button
      type="button"
      className={`word-ribbon-btn${active ? " active" : ""}${className ? " " + className : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) {
          setPressed(true);
          onClick?.();
        }
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) onClick?.(e);
        }
      }}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      title={title || ""}
      aria-label={ariaLabel || title}
      disabled={disabled}
      {...buttonProps}
      style={{
        height: small ? 28 : 32,
        minWidth: small ? 28 : 32,
        padding: small ? "0 6px" : "0 8px",
        background: getBg(),
        color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
        border: getBorder(),
        borderRadius: 4,
        fontSize: small ? 13 : 14,
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        fontFamily: RIBBON_FONT,
        lineHeight: 1,
        position: "relative",
        opacity: disabled ? 0.45 : 1,
        transition: "background 0.06s, border-color 0.06s",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── 대형 리본 버튼 (붙여넣기 등, 분할 버튼 지원) ── */
export function RibbonBtnLarge({
  icon,
  label,
  onClick,
  title,
  "aria-label": ariaLabel,
  active,
  split,
  onDropdown,
  disabled,
}) {
  const [hoveredTop, setHoveredTop] = useState(false);
  const [hoveredBottom, setHoveredBottom] = useState(false);
  const [hoveredWhole, setHoveredWhole] = useState(false);

  /** 분할 모드가 아닐 때는 전체를 하나의 버튼으로 취급 */
  const isSplit = !!split;

  /* 상단 영역 배경 */
  const getTopBg = () => {
    if (active) return BTN_COLORS.active;
    if (isSplit && hoveredTop) return BTN_COLORS.hover;
    if (!isSplit && hoveredWhole) return BTN_COLORS.hover;
    return "transparent";
  };

  /* 하단 드롭다운 배경 */
  const getBottomBg = () => {
    if (active) return BTN_COLORS.active;
    if (hoveredBottom) return BTN_COLORS.hover;
    return "transparent";
  };

  /* 전체 컨테이너 테두리 */
  const getContainerBorder = () => {
    if (active) return `1px solid ${BTN_COLORS.activeBorder}`;
    if (isSplit && (hoveredTop || hoveredBottom)) return `1px solid ${BTN_COLORS.activeBorder}`;
    if (!isSplit && hoveredWhole) return `1px solid ${BTN_COLORS.activeBorder}`;
    return "1px solid transparent";
  };

  /* 분할 모드: 상단/하단 사이 구분선 */
  const getSplitBorder = () => {
    if (hoveredTop || hoveredBottom || active) return `1px solid ${BTN_COLORS.activeBorder}`;
    return "1px solid transparent";
  };

  if (!isSplit) {
    /* 비분할 모드 - 단일 버튼 */
    return (
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) onClick?.(e);
          }
        }}
        onMouseEnter={() => setHoveredWhole(true)}
        onMouseLeave={() => setHoveredWhole(false)}
        title={title || label}
        aria-label={ariaLabel || title || label}
        disabled={disabled}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 78,
          minWidth: 60,
          padding: "6px 8px 4px",
          background: getTopBg(),
          border: getContainerBorder(),
          borderRadius: 2,
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
          opacity: disabled ? 0.45 : 1,
          fontFamily: RIBBON_FONT,
          outline: "none",
          transition: "background 0.06s, border-color 0.06s",
        }}
      >
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 12, marginTop: 5, lineHeight: 1.2,
          whiteSpace: "nowrap", textAlign: "center", fontWeight: 500,
        }}>
          {label}
        </span>
      </button>
    );
  }

  /* 분할 모드 - 상단 액션 + 하단 드롭다운 */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: getContainerBorder(),
        borderRadius: 2,
        overflow: "hidden",
        transition: "border-color 0.06s",
      }}
    >
      {/* 상단: 메인 액션 */}
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) onClick?.(e);
          }
        }}
        onMouseEnter={() => setHoveredTop(true)}
        onMouseLeave={() => setHoveredTop(false)}
        title={title || label}
        aria-label={ariaLabel || title || label}
        disabled={disabled}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 54,
          minWidth: 60,
          padding: "6px 8px 4px",
          background: getTopBg(),
          border: "none",
          borderBottom: getSplitBorder(),
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
          opacity: disabled ? 0.45 : 1,
          fontFamily: RIBBON_FONT,
          outline: "none",
          transition: "background 0.06s",
        }}
      >
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 24, height: 24, flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 12, marginTop: 4, lineHeight: 1.2,
          whiteSpace: "nowrap", textAlign: "center", fontWeight: 500,
        }}>
          {label}
        </span>
      </button>

      {/* 하단: 드롭다운 화살표 */}
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onDropdown?.(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) onDropdown?.(e);
          }
        }}
        onMouseEnter={() => setHoveredBottom(true)}
        onMouseLeave={() => setHoveredBottom(false)}
        title={`${label} 옵션`}
        aria-label={`${label} 옵션`}
        disabled={disabled}
        style={{
          height: 24,
          minWidth: 60,
          border: "none",
          background: getBottomBg(),
          cursor: disabled ? "default" : "pointer",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ribbon-fg, #555)",
          outline: "none",
          transition: "background 0.06s",
          padding: 0,
        }}
      >
        <ChevronDown size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
