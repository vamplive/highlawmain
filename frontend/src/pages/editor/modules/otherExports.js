/**
 * HTML, 마크다운, HWPX 내보내기
 */
import { downloadBlob } from "./fileHelpers";
import { showEditorAlert } from "./editorToast";

/* ══════════════════════════════════════════════
   HTML 내보내기
   ══════════════════════════════════════════════ */
export function exportHtml(html, title = "문서") {
  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body {
    font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1a1a1a;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 60px;
  }
  h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
  h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
  h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
  p { margin: 6px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  blockquote { border-left: 3px solid #3b82f6; margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; }
  pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; overflow-x: auto; }
  a { color: #3b82f6; }
  img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${title}.html`);
}

/* ══════════════════════════════════════════════
   마크다운 내보내기 (turndown 사용)
   ══════════════════════════════════════════════ */
export async function exportMarkdown(html, title = "문서") {
  try {
    const TurndownService = (await import("turndown")).default;
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
      strongDelimiter: "**",
    });

    /* 취소선 지원 */
    td.addRule("strikethrough", {
      filter: ["del", "s", "strike"],
      replacement: (content) => `~~${content}~~`,
    });

    /* 밑줄 → HTML 유지 (마크다운에 밑줄 문법 없음) */
    td.addRule("underline", {
      filter: ["u"],
      replacement: (content) => `<u>${content}</u>`,
    });

    /* 하이라이트 */
    td.addRule("highlight", {
      filter: (node) => node.nodeName === "MARK",
      replacement: (content) => `==${content}==`,
    });

    /* 작업 목록 */
    td.addRule("taskList", {
      filter: (node) => {
        return node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem";
      },
      replacement: (content, node) => {
        const checked = node.getAttribute("data-checked") === "true";
        return `${checked ? "- [x]" : "- [ ]"} ${content.trim()}\n`;
      },
    });

    /* 페이지 구분선 → --- */
    td.addRule("pageBreak", {
      filter: (node) => node.getAttribute?.("data-type") === "page-break",
      replacement: () => "\n---\n\n",
    });

    const markdown = td.turndown(html);

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${title}.md`);
  } catch (err) {
    showEditorAlert("마크다운 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/* ══════════════════════════════════════════════
   HWPX 내보내기 (한글 호환 OWPML 형식)
   ══════════════════════════════════════════════ */

/** XML 특수문자 이스케이프 */
function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** HTML body → HWPX section XML 생성 */
function buildHwpxSection(body) {
  const paragraphs = [];

  function getCharPrId(el) {
    const tag = el?.tagName;
    if (tag === "H1") return "1";
    if (tag === "H2") return "2";
    if (tag === "H3" || tag === "H4") return "3";
    return "0";
  }

  function extractText(node) {
    let texts = [];
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent;
        if (t) texts.push(escapeXml(t));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === "BR") {
          texts.push("\n");
        } else {
          texts.push(...extractText(child));
        }
      }
    }
    return texts;
  }

  for (const el of body.children) {
    const tag = el.tagName;

    /* 페이지 구분 */
    if (el.getAttribute("data-type") === "page-break") {
      paragraphs.push(`    <hp:p><hp:run><hp:ctrl><hp:colPr type="SECTION" breakType="PAGE"/></hp:ctrl></hp:run></hp:p>`);
      continue;
    }

    const charPrId = getCharPrId(el);
    const texts = extractText(el);
    const textStr = texts.join("");

    if (!textStr.trim() && tag !== "HR") {
      paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${charPrId}"><hp:t></hp:t></hp:run></hp:p>`);
      continue;
    }

    /* 리스트 처리 */
    if (tag === "UL" || tag === "OL") {
      const items = el.querySelectorAll("li");
      items.forEach((li, idx) => {
        const prefix = tag === "OL" ? `${idx + 1}. ` : "• ";
        const liText = escapeXml(li.textContent || "");
        paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${prefix}${liText}</hp:t></hp:run></hp:p>`);
      });
      continue;
    }

    /* 테이블은 단순 텍스트로 변환 (HWPX 테이블은 매우 복잡) */
    if (tag === "TABLE") {
      const rows = el.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td, th");
        const cellTexts = Array.from(cells).map(c => escapeXml(c.textContent || "")).join("\t");
        paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${cellTexts}</hp:t></hp:run></hp:p>`);
      }
      continue;
    }

    paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${charPrId}"><hp:t>${escapeXml(textStr)}</hp:t></hp:run></hp:p>`);
  }

  if (paragraphs.length === 0) {
    paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
  xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:subList>
${paragraphs.join("\n")}
  </hp:subList>
</hp:sec>`;
}

export async function exportHwpx(html, title = "문서") {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    /* HTML 파싱 */
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, "text/html");

    /* mimetype (압축하지 않음) */
    zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });

    /* META-INF/manifest.xml */
    zip.file("META-INF/manifest.xml", `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:media-type="application/hwp+zip" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/content.hpf"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/header.xml"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/section0.xml"/>
</manifest:manifest>`);

    /* Contents/content.hpf (패키지 파일) */
    zip.file("Contents/content.hpf", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>${escapeXml(title)}</opf:title>
    <opf:language>ko</opf:language>
    <opf:meta name="creator" content="법무법인 하이로 에디터"/>
    <opf:meta name="date" content="${new Date().toISOString()}"/>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`);

    /* Contents/header.xml (문서 설정) */
    zip.file("Contents/header.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ha:HWPDocumentHeaderType xmlns:ha="http://www.hancom.co.kr/hwpml/2011/head"
  version="1.1" secCnt="1">
  <ha:beginNum page="1" footnote="1" endnote="1"/>
  <ha:refList>
    <ha:fontfaces>
      <ha:fontface lang="HANGUL">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
      <ha:fontface lang="LATIN">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
    </ha:fontfaces>
    <ha:charProperties>
      <ha:charPr id="0" height="1100" bold="false" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="1" height="1600" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="2" height="1400" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="3" height="1200" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
    </ha:charProperties>
    <ha:paraProperties>
      <ha:paraPr id="0" align="JUSTIFY">
        <ha:spacing line="160" lineType="PERCENT"/>
        <ha:margin indent="0" left="0" right="0"/>
      </ha:paraPr>
    </ha:paraProperties>
  </ha:refList>
  <ha:compatibleDocument targetProgram="HWP201X"/>
</ha:HWPDocumentHeaderType>`);

    /* Contents/section0.xml (본문) */
    const sectionXml = buildHwpxSection(parsedDoc.body);
    zip.file("Contents/section0.xml", sectionXml);

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/hwp+zip",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    downloadBlob(blob, `${title}.hwpx`);
  } catch (err) {
    showEditorAlert("한글(HWPX) 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}
