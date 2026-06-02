/** 로딩 스피너 — 크기 변형 제공, 접근성 라벨 내장 */

/**
 * @param {{ size?: number, label?: string, inline?: boolean }} props
 *   - size: 지름(px)
 *   - label: 스크린리더용 레이블
 *   - inline: true면 버튼 내부 등 인라인 배치용
 */
export default function Spinner({ size = 28, label = "로딩 중", inline = false }) {
  const el = (
    <span
      className="spinner"
      role="status"
      aria-live="polite"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 10)) }}
    >
      <span className="sr-only">{label}</span>
    </span>
  );

  if (inline) return el;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 0",
        gap: 12,
        color: "var(--text-muted)",
      }}
    >
      {el}
      <p style={{ fontSize: 13 }}>{label}</p>
    </div>
  );
}
