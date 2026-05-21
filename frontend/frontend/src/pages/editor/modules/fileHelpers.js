/**
 * 파일 다운로드 및 마크다운 변환 헬퍼
 */

/** Blob을 파일로 다운로드 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 텍스트가 마크다운 형식인지 판별 */
export function isMarkdown(text) {
  if (!text) return false;
  return /^#{1,6}\s/.test(text) || /\*\*/.test(text) || /^[-*]\s/.test(text.split("\n").find((l) => l.trim()) || "");
}

/** HTML 문자열을 간이 마크다운으로 변환 */
export function htmlToMarkdown(html) {
  if (!html) return "";
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  return md.trim();
}
