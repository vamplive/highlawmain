export const PRIVACY_ANALYTICS_CONSENT_KEY = "privacy_analytics_consent";
export const PRIVACY_ANALYTICS_CONSENT_EVENT = "privacy-consent:open";

export function getAnalyticsConsent() {
  try {
    return localStorage.getItem(PRIVACY_ANALYTICS_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(granted) {
  const value = granted ? "granted" : "denied";
  try {
    localStorage.setItem(PRIVACY_ANALYTICS_CONSENT_KEY, value);
  } catch {}
  document.cookie = `${PRIVACY_ANALYTICS_CONSENT_KEY}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function openPrivacyConsentSettings() {
  window.dispatchEvent(new Event(PRIVACY_ANALYTICS_CONSENT_EVENT));
}
