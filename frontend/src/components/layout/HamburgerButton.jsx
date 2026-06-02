/** 헤더의 햄버거 버튼 — 메뉴 열림/닫힘 상태에 따라 X 아이콘으로 변형 */

export default function HamburgerButton({ menuOpen, onToggle, heroTop }) {
  return (
    <button
      onClick={onToggle}
      className="relative z-50 flex-shrink-0"
      style={{
        width: 44,
        height: 44,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
      aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
      aria-expanded={menuOpen}
      aria-controls="primary-navigation"
    >
      <span aria-hidden="true" style={{ position: "relative", width: 26, height: 18, display: "inline-block" }}>
        {[0, 8, 16].map((top, i) => (
          <span key={i} style={{
            position: "absolute", left: 0, width: i === 1 ? 18 : 26, height: 1.5,
            background: (heroTop || menuOpen) ? "#fff" : "var(--text-primary)",
            top: menuOpen ? 8 : top,
            transition: "all 0.3s",
            transform: menuOpen ? (i === 0 ? "rotate(45deg)" : i === 2 ? "rotate(-45deg)" : "none") : "none",
            opacity: menuOpen && i === 1 ? 0 : 1,
          }} />
        ))}
      </span>
    </button>
  );
}
