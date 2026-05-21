/**
 * 공지/배너/팝업 — 공개 페이지에 표시되는 활성 공지사항
 * - 배너: 페이지 상단 컬러 바
 * - 팝업: 세션당 1회 표시 모달
 * - Layout.jsx에서 렌더링
 */
import { useState, useEffect } from "react";
import { api } from "../utils/api";
import { isSafeHttpUrl } from "../utils/safeUrl";

export default function Announcements() {
  const [banners, setBanners] = useState([]);
  const [popup, setPopup] = useState(null);
  const [dismissedBanners, setDismissedBanners] = useState(new Set());

  useEffect(() => {
    api.get("/announcements/active")
      .then((json) => {
        const items = json.data || [];
        setBanners(items.filter((a) => a.type === "banner"));
        // 팝업: 세션당 1회만 표시
        const popupItem = items.find((a) => a.type === "popup");
        if (popupItem && !sessionStorage.getItem(`popup_dismissed_${popupItem.id}`)) {
          setPopup(popupItem);
        }
      })
      .catch(() => {});
  }, []);

  const dismissBanner = (id) => {
    setDismissedBanners((prev) => new Set([...prev, id]));
  };

  const dismissPopup = () => {
    if (popup) {
      sessionStorage.setItem(`popup_dismissed_${popup.id}`, "1");
      setPopup(null);
    }
  };

  return (
    <>
      {/* 배너 (상단 바) */}
      {banners.filter((b) => !dismissedBanners.has(b.id)).map((b) => (
        <div key={b.id} style={{
          background: b.bgColor || "var(--accent-gold)",
          color: b.textColor || "#fff",
          padding: "10px 20px",
          fontSize: 13,
          textAlign: "center",
          position: "relative",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <span style={{ fontWeight: 500 }}>{b.title}</span>
          {b.content && <span style={{ opacity: 0.9 }}>{b.content}</span>}
          {b.linkUrl && isSafeHttpUrl(b.linkUrl) && (
            <a href={b.linkUrl} style={{
              color: b.textColor || "#fff",
              textDecoration: "underline",
              fontWeight: 600,
            }}>
              자세히 보기
            </a>
          )}
          <button onClick={() => dismissBanner(b.id)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: b.textColor || "#fff",
            cursor: "pointer", fontSize: 16, opacity: 0.7, padding: 4,
          }}>
            ✕
          </button>
        </div>
      ))}

      {/* 팝업 모달 */}
      {popup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={dismissPopup}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 12, maxWidth: 480, width: "90%",
            padding: 32, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <button onClick={dismissPopup} style={{
              position: "absolute", right: 16, top: 16,
              background: "none", border: "none", fontSize: 20,
              cursor: "pointer", color: "var(--text-muted)", padding: 4,
            }}>
              ✕
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              {popup.title}
            </h3>
            {popup.content && (
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 16 }}>
                {popup.content}
              </p>
            )}
            {popup.linkUrl && isSafeHttpUrl(popup.linkUrl) && (
              <a href={popup.linkUrl} style={{
                display: "inline-block", padding: "10px 24px",
                background: popup.bgColor || "var(--accent-gold)", color: popup.textColor || "#fff",
                borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 500,
              }}>
                자세히 보기
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
