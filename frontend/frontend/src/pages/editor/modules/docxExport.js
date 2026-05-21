/**
 * DOCX 내보내기 - 서식 완전 보존
 * HTML을 파싱하여 docx.js로 .docx 파일을 생성한다.
 */
import { downloadBlob } from "./fileHelpers";
import { showEditorAlert } from "./editorToast";

/** pt 단위를 twip(1/20pt)으로 변환 */
function ptToTwip(pt) { return Math.round(pt * 20); }

/** CSS 색상 문자열을 6자리 hex로 변환 */
function colorToHex(color) {
  if (!color) return undefined;
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    if (hex.length === 3) return hex.split("").map(c => c + c).join("");
    return hex.substring(0, 6);
  }
  if (color.startsWith("rgb")) {
    const m = color.match(/(\d+)/g);
    if (m && m.length >= 3) {
      return m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
    }
  }
  return undefined;
}

/** fontSize 문자열에서 pt 숫자 추출 */
function parseFontSizePt(fontSize) {
  if (!fontSize) return 11;
  if (fontSize.endsWith("pt")) return parseFloat(fontSize);
  if (fontSize.endsWith("px")) return parseFloat(fontSize) * 0.75;
  return parseFloat(fontSize) || 11;
}

export async function exportDocx(html, title = "문서") {
  try {
    const docx = await import("docx");
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, TabStopType, TabStopPosition,
      Table: DocxTable, TableRow: DocxTableRow, TableCell: DocxTableCell,
      WidthType, BorderStyle, ImageRun, LevelFormat,
      convertInchesToTwip, ExternalHyperlink,
      NumberFormat, PageNumber, ShadingType,
    } = docx;

    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, "text/html");
    const children = [];

    /* 인라인 서식을 보존하며 TextRun 배열 생성 */
    function buildRuns(element) {
      const runs = [];

      function walk(node, inheritedStyle = {}) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text) return;

          const parent = node.parentElement;
          const inlineStyle = parent?.style || {};

          /* 상위 태그에서 서식 상속 확인 */
          const isBold = inheritedStyle.bold || parent?.closest("strong, b") !== null;
          const isItalic = inheritedStyle.italic || parent?.closest("em, i") !== null;
          const isUnderline = inheritedStyle.underline || parent?.closest("u") !== null;
          const isStrike = inheritedStyle.strike || parent?.closest("s, del, strike") !== null;
          const isSub = parent?.closest("sub") !== null;
          const isSup = parent?.closest("sup") !== null;

          /* 인라인 스타일에서 폰트 정보 추출 */
          const fontFamily = inlineStyle.fontFamily || inheritedStyle.fontFamily;
          const fontSize = inlineStyle.fontSize || inheritedStyle.fontSize;
          const color = inlineStyle.color || inheritedStyle.color;
          const bgColor = inlineStyle.backgroundColor || inheritedStyle.backgroundColor;

          const runOpts = {
            text,
            bold: isBold || undefined,
            italics: isItalic || undefined,
            underline: isUnderline ? {} : undefined,
            strike: isStrike || undefined,
            subScript: isSub || undefined,
            superScript: isSup || undefined,
          };

          if (fontFamily) {
            const clean = fontFamily.replace(/['"]/g, "").split(",")[0].trim();
            runOpts.font = clean;
          }
          if (fontSize) {
            runOpts.size = ptToTwip(parseFontSizePt(fontSize));
          }
          const hex = colorToHex(color);
          if (hex && hex !== "000000" && hex !== "1a1a1a") {
            runOpts.color = hex;
          }
          if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
            const bgHex = colorToHex(bgColor);
            if (bgHex) {
              runOpts.shading = { type: ShadingType.SOLID, color: bgHex, fill: bgHex };
            }
          }

          runs.push(new TextRun(runOpts));
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node;
        const tag = el.tagName;

        /* BR → 줄바꿈 */
        if (tag === "BR") {
          runs.push(new TextRun({ break: 1 }));
          return;
        }

        /* 이미지 건너뛰기 (별도 처리) */
        if (tag === "IMG") return;

        /* 자식 노드 재귀 처리 */
        const style = { ...inheritedStyle };
        if (tag === "STRONG" || tag === "B") style.bold = true;
        if (tag === "EM" || tag === "I") style.italic = true;
        if (tag === "U") style.underline = true;
        if (tag === "S" || tag === "DEL" || tag === "STRIKE") style.strike = true;

        /* span 등의 인라인 스타일 상속 */
        if (el.style.fontFamily) style.fontFamily = el.style.fontFamily;
        if (el.style.fontSize) style.fontSize = el.style.fontSize;
        if (el.style.color) style.color = el.style.color;
        if (el.style.backgroundColor) style.backgroundColor = el.style.backgroundColor;

        for (const child of el.childNodes) {
          walk(child, style);
        }
      }

      walk(element);
      if (runs.length === 0) {
        runs.push(new TextRun({ text: element.textContent || "" }));
      }
      return runs;
    }

    /* 텍스트 정렬 추출 */
    function getAlignment(el) {
      const ta = el.style?.textAlign || el.getAttribute("align");
      if (ta === "center") return AlignmentType.CENTER;
      if (ta === "right") return AlignmentType.RIGHT;
      if (ta === "justify") return AlignmentType.JUSTIFIED;
      return undefined;
    }

    /* 줄간격 추출 */
    function getSpacing(el) {
      const spacing = {};
      const ls = el.getAttribute("data-line-spacing") || el.style?.lineHeight;
      if (ls) {
        const num = parseFloat(ls);
        if (!isNaN(num) && num > 0) {
          /* 줄간격을 240 twip 기준으로 계산 (1.0 = 240) */
          spacing.line = Math.round(num * 240);
        }
      }
      const mb = el.style?.marginBottom;
      if (mb) {
        const px = parseFloat(mb);
        if (!isNaN(px)) spacing.after = ptToTwip(px * 0.75);
      }
      const mt = el.style?.marginTop;
      if (mt) {
        const px = parseFloat(mt);
        if (!isNaN(px)) spacing.before = ptToTwip(px * 0.75);
      }
      return Object.keys(spacing).length > 0 ? spacing : undefined;
    }

    /* 들여쓰기 추출 */
    function getIndent(el) {
      const indent = {};
      const pl = el.style?.paddingLeft || el.style?.marginLeft;
      if (pl) {
        const px = parseFloat(pl);
        if (!isNaN(px) && px > 0) indent.left = ptToTwip(px * 0.75);
      }
      const ti = el.style?.textIndent;
      if (ti) {
        const px = parseFloat(ti);
        if (!isNaN(px) && px !== 0) indent.firstLine = ptToTwip(Math.abs(px) * 0.75);
      }
      return Object.keys(indent).length > 0 ? indent : undefined;
    }

    /* 테이블 변환 */
    function convertTable(tableEl) {
      const rows = [];
      for (const trEl of tableEl.querySelectorAll("tr")) {
        const cells = [];
        for (const tdEl of trEl.querySelectorAll("td, th")) {
          const cellParagraphs = [];
          /* 셀 내부의 블록요소를 각각 Paragraph로 변환 */
          if (tdEl.children.length > 0) {
            for (const child of tdEl.children) {
              cellParagraphs.push(new Paragraph({
                children: buildRuns(child),
                alignment: getAlignment(child),
              }));
            }
          }
          if (cellParagraphs.length === 0) {
            cellParagraphs.push(new Paragraph({
              children: buildRuns(tdEl),
            }));
          }
          const isHeader = tdEl.tagName === "TH";
          cells.push(new DocxTableCell({
            children: cellParagraphs,
            shading: isHeader ? { type: ShadingType.SOLID, color: "f1f5f9", fill: "f1f5f9" } : undefined,
          }));
        }
        if (cells.length > 0) {
          rows.push(new DocxTableRow({ children: cells }));
        }
      }
      if (rows.length > 0) {
        return new DocxTable({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        });
      }
      return null;
    }

    /* 리스트 변환 */
    function convertList(listEl, level = 0) {
      const isOrdered = listEl.tagName === "OL";
      for (const li of listEl.children) {
        if (li.tagName !== "LI") continue;
        /* li 내부에 중첩 리스트가 있는 경우 처리 */
        const nestedList = li.querySelector("ul, ol");
        const textContent = [];
        for (const node of li.childNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === "UL" || node.tagName === "OL")) continue;
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) textContent.push(new TextRun({ text }));
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            textContent.push(...buildRuns(node));
          }
        }
        if (textContent.length > 0) {
          const bullet = isOrdered ? `${Array.from(listEl.children).indexOf(li) + 1}. ` : "• ";
          children.push(new Paragraph({
            children: [new TextRun({ text: bullet }), ...textContent],
            indent: { left: ptToTwip((level + 1) * 18) },
          }));
        }
        if (nestedList) {
          convertList(nestedList, level + 1);
        }
      }
    }

    /* 최상위 요소 순회 */
    for (const el of parsedDoc.body.children) {
      const tag = el.tagName;

      /* 페이지 구분선 */
      if (el.getAttribute("data-type") === "page-break") {
        children.push(new Paragraph({ children: [], pageBreakBefore: true }));
        continue;
      }

      /* 제목 */
      if (/^H[1-4]$/.test(tag)) {
        const level = parseInt(tag[1]);
        const headingMap = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
        };
        children.push(new Paragraph({
          children: buildRuns(el),
          heading: headingMap[level],
          alignment: getAlignment(el),
          spacing: getSpacing(el),
        }));
        continue;
      }

      /* 테이블 */
      if (tag === "TABLE") {
        const table = convertTable(el);
        if (table) children.push(table);
        continue;
      }

      /* 리스트 */
      if (tag === "UL" || tag === "OL") {
        convertList(el);
        continue;
      }

      /* 인용 */
      if (tag === "BLOCKQUOTE") {
        children.push(new Paragraph({
          children: buildRuns(el),
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 6, color: "3b82f6" },
          },
        }));
        continue;
      }

      /* 수평선 */
      if (tag === "HR") {
        children.push(new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
        }));
        continue;
      }

      /* 코드블록 */
      if (tag === "PRE") {
        const codeText = el.textContent || "";
        const lines = codeText.split("\n");
        for (const line of lines) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line, font: "Consolas", size: ptToTwip(9) })],
            shading: { type: ShadingType.SOLID, color: "f5f5f5", fill: "f5f5f5" },
          }));
        }
        continue;
      }

      /* 빈 요소 → 빈 줄 */
      if (!el.textContent?.trim() && !el.querySelector("img")) {
        children.push(new Paragraph({ children: [] }));
        continue;
      }

      /* 일반 단락 (p, div 등) */
      children.push(new Paragraph({
        children: buildRuns(el),
        alignment: getAlignment(el),
        spacing: getSpacing(el),
        indent: getIndent(el),
      }));
    }

    /* 빈 문서 방지 */
    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    const docxDoc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "맑은 고딕",
              size: ptToTwip(11),
            },
            paragraph: {
              spacing: { line: 360 },
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(docxDoc);
    downloadBlob(blob, `${title}.docx`);
  } catch (err) {
    showEditorAlert("DOCX 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}
