/** 상담안내 페이지 지도 섹션 — 카카오/네이버/구글 지도 탭 + 약도 이미지 */
import { useState } from "react";
import { MAP_TABS, OFFICE_LAT, OFFICE_LNG, getMapExternalUrl } from "./consultationConstants";

/** 지도 iframe 높이 (px) */
const MAP_HEIGHT = 400;

export default function ConsultationMap() {
  const [activeMap, setActiveMap] = useState("kakao");

  return (
    <>
      {/* 지도 탭 섹션 */}
      <section style={{ background: "#f7f8fa", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 960 }}>
          {/* 섹션 제목 */}
          <div className="text-center reveal" style={{ marginBottom: 32 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              MAP
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)" }}>
              지도로 보기
            </h2>
          </div>

          {/* 지도 서비스 탭 */}
          <div className="flex justify-center gap-2 reveal" style={{ marginBottom: 20 }}>
            {MAP_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMap(tab.id)}
                style={{
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: activeMap === tab.id ? 500 : 300,
                  color: activeMap === tab.id ? "#fff" : "var(--gray-500)",
                  background: activeMap === tab.id ? "var(--bg-dark)" : "#fff",
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 지도 본문 */}
          <div className="reveal" style={{ border: "1px solid var(--border-color)", background: "#fff", overflow: "hidden" }}>
            {activeMap === "google" ? (
              <iframe
                title="구글지도"
                src={`https://www.google.com/maps?q=${OFFICE_LAT},${OFFICE_LNG}&z=17&output=embed`}
                style={{ width: "100%", height: MAP_HEIGHT, border: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div style={{
                width: "100%", height: MAP_HEIGHT,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 16, background: "#f7f8fa",
              }}>
                <p style={{ fontSize: 14, color: "var(--gray-500)" }}>
                  {activeMap === "kakao" ? "카카오맵" : "네이버지도"}에서 위치를 확인하세요
                </p>
                <a
                  href={getMapExternalUrl(activeMap)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                  style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                    color: "var(--text-primary)",
                    padding: "12px 32px",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                  }}
                >
                  {activeMap === "kakao" ? "카카오맵에서 열기" : "네이버지도에서 열기"} →
                </a>
              </div>
            )}
          </div>

          {/* 외부 링크 바 */}
          <div className="flex justify-center gap-4 flex-wrap reveal" style={{ marginTop: 16 }}>
            {MAP_TABS.map((tab) => (
              <a
                key={tab.id}
                href={getMapExternalUrl(tab.id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  padding: "8px 16px",
                  border: "1px solid var(--border-subtle)",
                  transition: "all 0.2s",
                }}
                className="hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]"
              >
                {tab.label}에서 열기 ↗
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 약도 섹션 */}
      <section style={{ background: "#fff", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 960 }}>
          <div className="text-center reveal" style={{ marginBottom: 40 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              DIRECTIONS
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 8 }}>
              오시는 길
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 300 }}>서울특별시 강남구 테헤란로 141, 15층</p>
          </div>
          <div className="reveal" style={{ maxWidth: 700, margin: "0 auto" }}>
            <img
              src="/directions-map.png"
              alt="법무법인 하이로 오시는 길 약도"
              loading="lazy" decoding="async"
              style={{ width: "100%", height: "auto", border: "1px solid var(--border-subtle)" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
