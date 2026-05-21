/**
 * 별점 표시 컴포넌트
 * - 문서 중요도 등 1~5 범위의 등급을 별(★)로 시각화
 */

/**
 * @param {{ rating: number, size?: number }} props
 * @param {number} props.rating - 1~5 사이의 등급 값
 * @param {number} [props.size=12] - 별 아이콘의 폰트 크기(px)
 */
export function Stars({ rating, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, letterSpacing: 2 }}>
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          style={{
            color: level <= rating ? "var(--accent-gold, #6366f1)" : "#ddd",
            fontSize: size,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
