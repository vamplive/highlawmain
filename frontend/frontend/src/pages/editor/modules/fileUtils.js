/**
 * 파일 가져오기/내보내기 유틸리티 — 배럴 모듈
 * 각 내보내기/가져오기 기능을 개별 모듈에서 재내보내기한다.
 * 기존 import 경로와의 호환성을 유지한다.
 */
import { formatFootnoteNumber } from "./footnote-extension";

/* 내보내기 */
export { exportDocx } from "./docxExport";
export { exportPdf } from "./pdfExport";
export { exportHtml, exportMarkdown, exportHwpx } from "./otherExports";

/* 가져오기 */
export { importDocx } from "./docxImport";

/* 공통 헬퍼 */
export { isMarkdown, htmlToMarkdown } from "./fileHelpers";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(text) {
  return typeof text === "string" ? text.trim() : "";
}

function buildNoteExportHtml(notes = [], numberFormat = "decimal", label = "각주") {
  const usable = notes.filter((fn) => fn?.id);
  if (!usable.length) return "";
  const items = usable.map((fn, index) =>
    `<li><sup>${escapeHtml(formatFootnoteNumber(fn.number || index + 1, numberFormat))}</sup> ${escapeHtml(fn.content || "").replace(/\n/g, "<br>")}</li>`
  ).join("");
  return `<section data-export-notes="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2><ol>${items}</ol></section>`;
}

function buildPathData(points = []) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildDrawingExportHtml(drawings = [], width = 794, height = 1123) {
  const usable = drawings.filter((stroke) => Array.isArray(stroke?.points) && stroke.points.length > 0);
  if (!usable.length) return "";
  const paths = usable.map((stroke) => (
    `<path d="${escapeHtml(buildPathData(stroke.points))}" stroke="${escapeHtml(stroke.color || "#000")}" stroke-width="${escapeHtml(stroke.width || 1)}" fill="none" opacity="${escapeHtml(stroke.opacity ?? 1)}" stroke-linecap="round" stroke-linejoin="round"/>`
  )).join("");
  return `<section data-export-drawings="true"><h2>그리기</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${escapeHtml(width)} ${escapeHtml(height)}" width="100%" height="auto">${paths}</svg></section>`;
}

export function buildFullDocumentHtml(bodyHtml, doc = {}, options = {}) {
  const body = bodyHtml || "";
  const title = normalizeText(doc.title);
  const subtitle = normalizeText(doc.subtitle);
  const metadataHtml = [
    title
      ? `<h1 data-export-metadata="title" style="font-size:22pt;font-weight:700;margin:0 0 8px;font-family:'Noto Serif KR',Georgia,serif;">${escapeHtml(title)}</h1>`
      : "",
    subtitle
      ? `<p data-export-metadata="subtitle" style="font-size:14pt;color:#777;margin:0 0 20px;font-family:'맑은 고딕',sans-serif;">${escapeHtml(subtitle)}</p>`
      : "",
  ].filter(Boolean).join("");

  const footnotesHtml = buildNoteExportHtml(options.footnotes || [], options.footnoteNumberFormat || "decimal", "각주");
  const endnotesHtml = buildNoteExportHtml(options.endnotes || [], options.endnoteNumberFormat || "lowerRoman", "미주");
  const drawingsHtml = buildDrawingExportHtml(options.drawings || [], options.pageW, options.pageH);
  return `${metadataHtml}${body}${drawingsHtml}${footnotesHtml}${endnotesHtml}`;
}

/* ══════════════════════════════════════════════
   자동저장 (localStorage)
   ══════════════════════════════════════════════ */
const AUTOSAVE_KEY = "word-editor-autosave";

export function autoSaveToLocal(html, doc, extra = {}) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      html,
      doc,
      ...extra,
      timestamp: Date.now(),
    }));
  } catch {
    // QuotaExceededError 발생 시 조용히 실패 (자동저장이므로 사용자 방해 불필요)
  }
}

export function loadAutoSave() {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch { /* 무시 */ }
}
