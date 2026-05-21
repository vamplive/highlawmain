/**
 * 모바일 자동 버전 스냅샷 — localStorage 기반 저장소.
 *
 * 컴포넌트(`MobileVersionHistory`)와 분리해 react-refresh의 only-export-components
 * 규칙을 만족시키고, 외부에서 자동 스냅샷을 push할 때도 부담 없이 import 가능하게 함.
 */
const KEY_PREFIX = "yj-editor-mobile-versions:";
const MAX_SNAPSHOTS = 30;

function getStorageKey(docId) {
  return `${KEY_PREFIX}${docId || "draft"}`;
}

export function loadVersions(docId) {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(docId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch { return []; }
}

export function pushVersion(docId, snapshot) {
  if (typeof localStorage === "undefined") return [];
  const list = loadVersions(docId);
  const last = list[0];
  if (last && last.html === snapshot.html) return list;
  const next = [{ ...snapshot, ts: Date.now() }, ...list].slice(0, MAX_SNAPSHOTS);
  try {
    localStorage.setItem(getStorageKey(docId), JSON.stringify(next));
  } catch { /* quota */ }
  return next;
}

export function clearVersions(docId) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.removeItem(getStorageKey(docId)); } catch { /* ignore */ }
}
