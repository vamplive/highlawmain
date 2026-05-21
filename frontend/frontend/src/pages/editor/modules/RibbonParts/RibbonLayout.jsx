/**
 * 리본 레이아웃 컴포넌트
 * GroupSep (구분선), RibbonGroup (그룹 컨테이너), DropdownButton (드롭다운)을 정의한다.
 */
import { cloneElement, isValidElement, useState, useRef, useEffect } from "react";
import { RIBBON_FONT, BTN_COLORS } from "./ribbonConstants";

/* ── 그룹 구분선 (세로 1px 라인) ── */
export function GroupSep() {
  return (
    <div
      style={{
        width: 1,
        alignSelf: "stretch",
        background: "var(--ribbon-sep, #d1d5db)",
        margin: "2px 4px",
        flexShrink: 0,
      }}
    />
  );
}

/* ── 리본 그룹 (콘텐츠 + 하단 라벨 + 대화상자 런처) ── */
export function RibbonGroup({ label, children, dialogLauncher }) {
  const [launcherHovered, setLauncherHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        padding: "3px 6px 0",
      }}
    >
      {/* 콘텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        {children}
      </div>

      {/* 하단 라벨 + 대화상자 런처 버튼 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ribbon-label, #555)",
          marginTop: 4,
          paddingBottom: 4,
          fontFamily: RIBBON_FONT,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 4,
          lineHeight: 1,
          fontWeight: 500,
        }}
      >
        {label}
        {dialogLauncher && (
          <button
            type="button"
            onClick={dialogLauncher}
            title={`${label} 대화 상자`}
            aria-label={`${label} 대화 상자 열기`}
            onMouseEnter={() => setLauncherHovered(true)}
            onMouseLeave={() => setLauncherHovered(false)}
            style={{
              width: 11,
              height: 11,
              border: "1px solid transparent",
              background: launcherHovered ? BTN_COLORS.hover : "transparent",
              borderColor: launcherHovered ? BTN_COLORS.activeBorder : "transparent",
              cursor: "pointer",
              fontSize: 7,
              color: "var(--ribbon-label, #777)",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              transition: "background 0.06s, border-color 0.06s",
              outline: "none",
              lineHeight: 1,
            }}
          >
            ↘
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 드롭다운 버튼 (클릭으로 토글, 외부 클릭으로 닫기) ── */
export function DropdownButton({
  trigger,
  children,
  align = "left",
  width,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toggleOpen = (e) => {
    e?.preventDefault?.();
    setOpen((v) => !v);
  };

  /* 외부 클릭 및 Escape 감지 */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
        ...(trigger.type === "div" ? { role: "button", tabIndex: trigger.props.tabIndex ?? 0 } : {}),
        onClick: (e) => {
          trigger.props.onClick?.(e);
          if (!e?.defaultPrevented) toggleOpen(e);
        },
        onKeyDown: (e) => {
          trigger.props.onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Enter" || e.key === " ") {
            trigger.props.onClick?.(e);
            if (!e.defaultPrevented) toggleOpen(e);
          }
          if (e.key === "Escape") setOpen(false);
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-label": trigger.props["aria-label"] || trigger.props.title || "옵션 메뉴",
      })
    : trigger;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div style={{ display: "inline-flex", cursor: "pointer" }}>
        {triggerNode}
      </div>
      {open && (
        <div
          className="word-dropdown-menu"
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 200,
            marginTop: 2,
            opacity: 1,
            transform: "translateY(0)",
            animation: "ribbonDropdownIn 0.1s ease-out",
            ...(width ? { width, minWidth: width } : {}),
          }}
          onClick={(e) => {
            /* 드롭다운 아이템 클릭 시에만 닫기 */
            if (e.target.closest(".word-dropdown-item")) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              return;
            }
            if (e.key !== "Enter" && e.key !== " ") return;
            const item = e.target.closest(".word-dropdown-item");
            if (!item) return;
            e.preventDefault();
            item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
            item.click();
            setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
