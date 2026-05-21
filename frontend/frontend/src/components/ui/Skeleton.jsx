/** 스켈레톤 로더 — 콘텐츠 로딩 중 표시할 플레이스홀더 블록 */

/**
 * 기본 스켈레톤 블록. 인라인 스타일로 크기/모양을 자유롭게 지정.
 * @param {{ width?: number|string, height?: number|string, radius?: number, style?: object, className?: string }} props
 */
export function Skeleton({ width = "100%", height = 16, radius = 4, style, className }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #eceae5 0%, #f5f3ee 50%, #eceae5 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/**
 * 카드형 스켈레톤 (썸네일 + 제목 + 요약) — 블로그/사례 리스트용.
 */
export function SkeletonCard({ thumbnailHeight = 180 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 4,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Skeleton height={thumbnailHeight} radius={0} />
      <div style={{ padding: 20 }}>
        <Skeleton height={18} style={{ marginBottom: 10 }} />
        <Skeleton height={14} width="85%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="60%" style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={12} width={60} />
        </div>
      </div>
    </div>
  );
}

/**
 * 그리드 스켈레톤 — 여러 개의 SkeletonCard를 그리드로 렌더.
 * @param {{ count?: number, minColumnWidth?: number, thumbnailHeight?: number }} props
 */
export function SkeletonGrid({ count = 6, minColumnWidth = 300, thumbnailHeight = 180 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
        gap: 24,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">콘텐츠를 불러오는 중입니다</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} thumbnailHeight={thumbnailHeight} />
      ))}
    </div>
  );
}

/**
 * 리뷰 카드 스켈레톤 — 별점, 본문, 작성자 라인.
 */
export function SkeletonReviewCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "#fff",
        border: "1px solid var(--gray-100)",
        borderRadius: 10,
        padding: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <Skeleton width={100} height={16} />
        <Skeleton width={48} height={16} radius={10} />
      </div>
      <Skeleton height={14} style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="92%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="70%" style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton height={12} width={60} />
        <Skeleton height={12} width={80} />
      </div>
    </div>
  );
}

/**
 * 변호사 카드 스켈레톤 — 사진(aspect 3:4) + 이름 + 직책.
 */
export function SkeletonLawyerCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "#fff",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      <div style={{ aspectRatio: "3/4", background: "#e8e6e3" }} />
      <div style={{ padding: "24px 28px 28px" }}>
        <Skeleton height={22} width="50%" style={{ marginBottom: 12 }} />
        <Skeleton height={14} width="35%" style={{ marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <Skeleton height={20} width={60} radius={2} />
          <Skeleton height={20} width={70} radius={2} />
        </div>
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" style={{ marginTop: 6 }} />
      </div>
    </div>
  );
}
