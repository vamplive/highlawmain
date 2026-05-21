/**
 * 리본 입력 컴포넌트
 * RibbonSelect (드롭다운), RibbonComboBox (편집 가능 콤보박스)를 정의한다.
 */
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { RIBBON_FONT, BTN_COLORS } from "./ribbonConstants";

/* ── 리본 셀렉트 (Word 365 스타일 드롭다운) ── */
export function RibbonSelect({ value, options, onChange, title, style }) {
  const [focused, setFocused] = useState(false);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      title={title}
      style={{
        height: 24,
        padding: "0 18px 0 6px",
        background: "var(--ribbon-input-bg, #fff)",
        border: focused
          ? `1px solid #0078D4`
          : "1px solid var(--ribbon-input-border, #c0c0c0)",
        borderRadius: 2,
        fontSize: 12,
        cursor: "pointer",
        color: "var(--ribbon-fg, #333)",
        fontFamily: RIBBON_FONT,
        outline: focused ? "1px solid #0078D4" : "none",
        outlineOffset: -1,
        WebkitAppearance: "none",
        MozAppearance: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 4px center",
        backgroundSize: "10px 6px",
        ...style,
      }}
    >
      {options.map((o) => (
        <option
          key={o.value}
          value={o.value}
          style={{ fontFamily: o.style?.fontFamily || "inherit", fontSize: 13, ...o.style }}
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── 리본 콤보박스 (편집 가능, 글꼴/크기 선택용) ── */
export function RibbonComboBox({
  value,
  options,
  onChange,
  title,
  style,
  fontPreview,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* value prop이 변경되면 입력값도 동기화 */
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setInputValue(value || "");
    });
    return () => { cancelled = true; };
  }, [value]);

  /* 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  /* 입력값에 따라 옵션 필터링 */
  const filteredOptions = options.filter((o) => {
    if (!inputValue) return true;
    const search = inputValue.toLowerCase();
    return (
      o.label.toLowerCase().includes(search) ||
      (o.value && o.value.toString().toLowerCase().includes(search))
    );
  });

  /* 스크롤하여 선택된 항목 표시 */
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open]);

  const handleSelect = (opt) => {
    setInputValue(opt.label);
    onChange(opt.value);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      /* 정확히 일치하는 옵션이 있으면 선택, 아니면 현재값 그대로 전달 */
      const match = options.find(
        (o) => o.label.toLowerCase() === inputValue.toLowerCase()
      );
      if (match) {
        handleSelect(match);
      } else if (inputValue) {
        onChange(inputValue);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputValue(value || "");
    } else if (e.key === "ArrowDown" && !open) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    /* 잠시 대기 후 닫기 (클릭 이벤트가 먼저 발생하도록) */
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        /* 유효하지 않은 입력값이면 이전 값으로 복원 */
        const match = options.find(
          (o) =>
            o.label.toLowerCase() === inputValue.toLowerCase() ||
            o.value.toString() === inputValue
        );
        if (!match && value) {
          const current = options.find((o) => o.value.toString() === value.toString());
          setInputValue(current?.label || value);
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex" }}>
      {/* 입력 필드 + 드롭다운 토글 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 24,
          border: focused
            ? "1px solid #0078D4"
            : "1px solid var(--ribbon-input-border, #c0c0c0)",
          borderRadius: 2,
          background: "var(--ribbon-input-bg, #fff)",
          outline: focused ? "1px solid #0078D4" : "none",
          outlineOffset: -1,
          overflow: "hidden",
          ...style,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          title={title}
          placeholder={placeholder}
          style={{
            border: "none",
            outline: "none",
            height: "100%",
            padding: "0 4px",
            fontSize: 12,
            fontFamily: fontPreview
              ? options.find((o) => o.label === inputValue)?.style?.fontFamily || RIBBON_FONT
              : RIBBON_FONT,
            color: "var(--ribbon-fg, #333)",
            background: "transparent",
            width: "100%",
            minWidth: 0,
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(!open);
            inputRef.current?.focus();
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "0 3px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            color: "#666",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={10} />
        </button>
      </div>

      {/* 드롭다운 목록 */}
      {open && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 300,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: 260,
            overflowY: "auto",
            marginTop: 1,
          }}
        >
          {filteredOptions.map((o) => {
            const isActive =
              o.value.toString() === value?.toString() ||
              o.label === inputValue;
            return (
              <div
                key={o.value}
                data-active={isActive ? "true" : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(o);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: fontPreview && o.style?.fontFamily
                    ? o.style.fontFamily
                    : RIBBON_FONT,
                  background: isActive ? "#CCE8FF" : "transparent",
                  color: "#333",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "background 0.06s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = BTN_COLORS.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive ? "#CCE8FF" : "transparent";
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
