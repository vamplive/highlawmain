/**
 * 범용 토스트 알림 — alert() 대체 (에디터 외부용)
 * 화면 상단에 표시 후 자동 제거
 *
 * @param {string} message - 표시할 메시지
 * @param {"info"|"error"|"success"} [type="error"] - 토스트 유형
 */
import { TOAST_DURATION_MS, TOAST_FADEOUT_MS } from "./timing";

export function showToast(message, type = "error") {
  const BG_MAP = { info: "#333", error: "#dc2626", success: "#16a34a" };
  const bg = BG_MAP[type] || BG_MAP.error;

  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText =
    `position:fixed;top:20px;left:50%;transform:translateX(-50%);` +
    `background:${bg};color:#fff;padding:10px 24px;border-radius:6px;` +
    `z-index:99999;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.2);` +
    `transition:opacity 0.3s;`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), TOAST_FADEOUT_MS);
  }, TOAST_DURATION_MS);
}
