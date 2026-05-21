/**
 * 현재 활성 영상 프리뷰 — 상단 배너 영역
 */
import { COLORS } from "../../../components/admin";
import { CATEGORIES } from "./constants";

export default function ActiveVideoPreview({ video, totalCount, categoryCount }) {
  return (
    <div
      style={{
        marginBottom: 28,
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", minHeight: 180 }}>
        <div style={{ flex: "0 0 320px", position: "relative", background: "#000" }}>
          <video
            key={video.url}
            src={video.url}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            flex: 1, padding: "24px 32px",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: COLORS.textMuted, marginBottom: 10 }}>
            CURRENTLY ACTIVE
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            {video.title}
          </h2>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>
            {CATEGORIES[video.category]} · {video.url}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 20, fontSize: 11, color: COLORS.textMuted }}>
            <span>
              <b style={{ color: COLORS.text, fontSize: 16, fontWeight: 300 }}>{totalCount}</b> 전체
            </span>
            <span>
              <b style={{ color: COLORS.text, fontSize: 16, fontWeight: 300 }}>{categoryCount}</b> 카테고리
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
