/**
 * 계약서 PDF 생성 유틸 (프론트 기반)
 * - html2canvas + jsPDF 조합 (기존 프로젝트에 이미 설치됨)
 * - 계약서 본문 + 감사증명서 페이지를 하나의 PDF로 합성
 * - 완료 후 /contracts/:id/finalize-pdf 로 base64 PDF 업로드
 *
 * 사용:
 *   import { generateContractPdf } from "../utils/contract-pdf";
 *   const dataUri = await generateContractPdf(contract, fields, signatures, parties, auditLogs);
 *   await api.post(`/contracts/${contract.id}/finalize-pdf`, { pdfDataUri: dataUri });
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** PDF 페이지 설정 (A4) */
const PAGE_W = 210; // mm
const PAGE_H = 297;
const MARGIN = 15;

/**
 * 계약서 DOM 요소와 감사증명서를 합쳐 PDF Data URI 반환
 * @param {HTMLElement} bodyElement - 렌더링된 계약서 본문 DOM
 * @param {object} contract
 * @param {Array} parties
 * @param {Array} auditLogs
 * @returns {Promise<string>} data:application/pdf;base64,...
 */
export async function generateContractPdf(bodyElement, contract, parties, auditLogs) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // 본문 캔버스 렌더
  const bodyCanvas = await html2canvas(bodyElement, { scale: 2, backgroundColor: "#ffffff" });
  const bodyImg = bodyCanvas.toDataURL("image/png");
  const bodyWmm = PAGE_W - 2 * MARGIN;
  const bodyHmm = (bodyCanvas.height * bodyWmm) / bodyCanvas.width;

  // 첫 페이지에 본문을 넣되, 높이 초과 시 여러 페이지 분할
  if (bodyHmm <= PAGE_H - 2 * MARGIN) {
    pdf.addImage(bodyImg, "PNG", MARGIN, MARGIN, bodyWmm, bodyHmm);
  } else {
    // 큰 이미지는 페이지 단위로 잘라 붙임
    const pageContentHmm = PAGE_H - 2 * MARGIN;
    const totalHpx = bodyCanvas.height;
    const sliceHpx = Math.floor((pageContentHmm / bodyWmm) * bodyCanvas.width);
    let y = 0;
    let first = true;
    while (y < totalHpx) {
      if (!first) pdf.addPage();
      first = false;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = bodyCanvas.width;
      sliceCanvas.height = Math.min(sliceHpx, totalHpx - y);
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(bodyCanvas, 0, y, bodyCanvas.width, sliceCanvas.height, 0, 0, bodyCanvas.width, sliceCanvas.height);
      const sliceImg = sliceCanvas.toDataURL("image/png");
      const sliceHmm = (sliceCanvas.height * bodyWmm) / bodyCanvas.width;
      pdf.addImage(sliceImg, "PNG", MARGIN, MARGIN, bodyWmm, sliceHmm);
      y += sliceHpx;
    }
  }

  // 감사증명서 페이지
  pdf.addPage();
  renderCertificatePage(pdf, contract, parties, auditLogs);

  return pdf.output("datauristring");
}

function renderCertificatePage(pdf, contract, parties, auditLogs) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Certificate of Electronic Signing", PAGE_W / 2, 30, { align: "center" });
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("전자서명 완료 증명서 — 법무법인 하이로", PAGE_W / 2, 38, { align: "center" });

  pdf.setFontSize(10);
  let y = 55;
  pdf.text(`문서 제목: ${contract.title || ""}`, MARGIN, y); y += 6;
  pdf.text(`완료 시각: ${contract.completed_at || "-"}`, MARGIN, y); y += 6;
  pdf.text(`문서 해시(SHA-256):`, MARGIN, y); y += 5;
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.text(contract.final_hash || "-", MARGIN + 2, y); y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  pdf.text("서명 당사자 및 인증 내역:", MARGIN, y); y += 6;
  (parties || []).forEach((p, i) => {
    if (y > PAGE_H - 30) { pdf.addPage(); y = MARGIN; }
    pdf.setFont("helvetica", "bold");
    pdf.text(`${i + 1}. ${p.display_name || ""} (${roleLabel(p.role)})`, MARGIN + 2, y); y += 5;
    pdf.setFont("helvetica", "normal");
    if (p.phone_last4) { pdf.text(`- 휴대폰: 010-****-${p.phone_last4}`, MARGIN + 6, y); y += 5; }
    if (p.verified_at) { pdf.text(`- 본인 확인: ${p.verified_at} (L${p.verification_level})`, MARGIN + 6, y); y += 5; }
    if (p.signed_at) { pdf.text(`- 서명 시각: ${p.signed_at}`, MARGIN + 6, y); y += 5; }
    y += 2;
  });

  y += 4;
  if (y > PAGE_H - 30) { pdf.addPage(); y = MARGIN; }
  pdf.setFontSize(8);
  pdf.setTextColor(100);
  const footer = "본 증명서는 법무법인 하이로의 전자서명 시스템이 자동 생성한 것이며, 원본의 무결성은 위 해시로 검증 가능합니다.";
  pdf.text(pdf.splitTextToSize(footer, PAGE_W - 2 * MARGIN), MARGIN, y);

  y = PAGE_H - 20;
  pdf.setFontSize(7);
  pdf.text(`감사로그 ${auditLogs?.length || 0}건 기록됨`, MARGIN, y);
}

function roleLabel(role) {
  const m = {
    our_client: "의뢰인", lawyer: "변호사",
    counterparty: "상대방", counterparty_rep: "상대방 대리인", witness: "증인",
  };
  return m[role] || role || "";
}
