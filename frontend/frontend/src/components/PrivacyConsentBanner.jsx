import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PRIVACY_ANALYTICS_CONSENT_EVENT,
  PRIVACY_ANALYTICS_CONSENT_KEY,
  setAnalyticsConsent,
} from "../utils/privacy-consent";

function getStoredConsent() {
  try {
    return localStorage.getItem(PRIVACY_ANALYTICS_CONSENT_KEY);
  } catch {
    return null;
  }
}

export default function PrivacyConsentBanner() {
  const [open, setOpen] = useState(() => !getStoredConsent());

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(PRIVACY_ANALYTICS_CONSENT_EVENT, handleOpen);
    return () => window.removeEventListener(PRIVACY_ANALYTICS_CONSENT_EVENT, handleOpen);
  }, []);

  function choose(granted) {
    setAnalyticsConsent(granted);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="privacy-consent-title"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        zIndex: 10000,
        maxWidth: 760,
        margin: "0 auto",
        padding: 18,
        background: "#fff",
        border: "1px solid var(--border-color)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ minWidth: 240, flex: "1 1 360px" }}>
          <p id="privacy-consent-title" style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            개인정보 및 이용 분석 설정
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            사이트 개선과 챗봇 응대를 위해 방문 경로, IP, User-Agent, 챗봇 세션 식별값을 처리할 수 있습니다.
            자세한 내용은 <Link to="/privacy" style={{ color: "var(--accent-gold)" }}>개인정보처리방침</Link>에서 확인할 수 있습니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => choose(false)}
            style={{
              minWidth: 96,
              minHeight: 44,
              padding: "10px 16px",
              border: "1px solid var(--border-color)",
              background: "#fff",
              color: "var(--text-secondary)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            거부
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            style={{
              minWidth: 120,
              minHeight: 44,
              padding: "10px 18px",
              border: "1px solid var(--accent-gold)",
              background: "var(--accent-gold)",
              color: "#fff",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
