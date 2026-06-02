/**
 * PDF 내보내기 - jsPDF + html2canvas로 페이지별 캡처
 */
import { showEditorAlert } from "./editorToast";

function getPdfCaptureElement(editorElement) {
  const pageArea = editorElement.closest?.(".editor-page-area") ||
    editorElement.querySelector?.(".editor-page-area");
  const candidate = pageArea || editorElement;

  if (candidate.scrollWidth > 0 && candidate.scrollHeight > 0) {
    return candidate;
  }

  const proseMirror = editorElement.querySelector?.(".ProseMirror");
  if (proseMirror?.scrollWidth > 0 && proseMirror?.scrollHeight > 0) {
    return proseMirror;
  }

  return candidate;
}

export async function exportPdf(editorElement, title = "문서", pageInfo = {}) {
  if (!editorElement) {
    showEditorAlert("PDF 내보내기: 에디터 요소를 찾을 수 없습니다.");
    return;
  }
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    await new Promise(r => setTimeout(r, 200));

    /* 페이지 영역 전체를 우선 캡처하고, 없는 보기 모드에서는 전달된 요소로 폴백 */
    const pageArea = getPdfCaptureElement(editorElement);

    const canvas = await html2canvas(pageArea, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: pageArea.scrollWidth || pageArea.clientWidth || window.innerWidth,
      windowHeight: pageArea.scrollHeight || pageArea.clientHeight || window.innerHeight,
      /* 페이지 갭 오버레이 등 UI 요소 제거 */
      ignoreElements: (el) => {
        return el.hasAttribute?.("data-page-overlay") ||
               el.classList?.contains("page-break-overlay");
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfOrientation = (pageInfo.orientation === "landscape") ? "l" : "p";
    const pdfSize = pageInfo.pageSize || "a4";
    const pdf = new jsPDF(pdfOrientation, "mm", pdfSize);

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgW = pdfW;
    const imgH = (canvas.height * pdfW) / canvas.width;

    let yOffset = 0;
    let page = 0;

    while (yOffset < imgH) {
      if (page > 0) pdf.addPage();

      /* 현재 페이지에 해당하는 영역만 그리기 */
      pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);

      yOffset += pdfH;
      page++;

      /* 안전장치: 최대 100페이지 */
      if (page > 100) break;
    }

    pdf.save(`${title}.pdf`);
  } catch (err) {
    showEditorAlert("PDF 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}
