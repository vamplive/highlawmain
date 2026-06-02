/**
 * 비디오 카드 — 썸네일 프리뷰 + 호버 재생 + 액션 버튼
 */
import { useState, useEffect, useRef } from "react";
import { COLORS } from "../../../components/admin";
import { CATEGORIES, D, cardActionBtn } from "./constants";

export default function VideoCard({ video, onActivate, onEdit, onDelete, onEditor }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (hovered && videoRef.current) {
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovered]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: video.isActive
          ? `2px solid ${COLORS.primary}`
          : `1px solid ${COLORS.border}`,
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      {/* 썸네일 / 프리뷰 영역 */}
      <div
        style={{ position: "relative", height: 155, background: "#000", cursor: "pointer" }}
        onClick={() => onEditor()}
      >
        <video
          ref={videoRef}
          src={video.url}
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: hovered ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.2)",
            transition: "background 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!hovered && (
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <span style={{ fontSize: 14, color: "#fff", marginLeft: 2 }}>▶</span>
            </div>
          )}
        </div>
        {video.isActive && (
          <div
            style={{
              position: "absolute", top: 8, right: 8,
              background: COLORS.primary, color: "#fff",
              fontSize: 8, fontWeight: 700, padding: "3px 8px",
              letterSpacing: "0.15em",
            }}
          >
            ACTIVE
          </div>
        )}
        <div
          style={{
            position: "absolute", bottom: 8, left: 8,
            background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)",
            fontSize: 9, fontWeight: 500, padding: "2px 8px",
            backdropFilter: "blur(4px)",
          }}
        >
          {CATEGORIES[video.category] || video.category}
        </div>
      </div>

      {/* 카드 하단 정보 */}
      <div style={{ padding: "10px 14px" }}>
        <div
          style={{
            fontSize: 13, fontWeight: 500, color: COLORS.text,
            marginBottom: 10, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {video.title}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!video.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onActivate(video.id); }}
              style={cardActionBtn(COLORS.primary)}
            >
              활성화
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEditor(); }}
            style={cardActionBtn(D.accent)}
          >
            편집
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={cardActionBtn(COLORS.textSecondary)}
          >
            수정
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={cardActionBtn(COLORS.danger)}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
