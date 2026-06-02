/** 미디어 관리 공용 유틸 — 파일 아이콘/크기 포맷/이미지 여부 판별 */

export const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];

/** 파일 확장자로 아이콘 문자 반환 */
export function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "\u{1F5BC}";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "\u{1F3AC}";
  if (["pdf"].includes(ext)) return "\u{1F4C4}";
  if (["doc", "docx"].includes(ext)) return "\u{1F4DD}";
  if (["xls", "xlsx"].includes(ext)) return "\u{1F4CA}";
  if (["ppt", "pptx"].includes(ext)) return "\u{1F4CE}";
  return "\u{1F4C1}";
}

/** 파일 크기 포맷 */
export function formatSize(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** 이미지 파일 여부 */
export function isImage(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
}
