const fs = require("fs");
const path = require("path");

async function extractText(filePath, mimeType, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  try {
    if (mimeType === "application/pdf" || ext === ".pdf") {
      return await extractPdf(filePath);
    }
    if (ext === ".hwpx") {
      return await extractHwpx(filePath);
    }
    if (ext === ".txt" || mimeType === "text/plain") {
      return fs.readFileSync(filePath, "utf-8").substring(0, 50000);
    }
    if (mimeType && mimeType.startsWith("image/")) {
      return await extractImage(filePath);
    }
    return "";
  } catch (e) {
    console.error("[extract-text] error:", e.message);
    return "";
  }
}

async function extractPdf(filePath) {
  const pdfParse = require("pdf-parse");
  const buf = fs.readFileSync(filePath);
  const result = await pdfParse(buf);
  return (result.text || "").substring(0, 100000);
}

async function extractHwpx(filePath) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(filePath);
  const texts = [];
  for (const entry of zip.getEntries()) {
    if (!entry.isDirectory && /section\d*\.xml$/i.test(entry.entryName)) {
      const xml = entry.getData().toString("utf-8");
      const matches = xml.match(/<hp:t[^>]*>([^<]*)<\/hp:t>/g) || [];
      for (const m of matches) {
        const t = m.replace(/<[^>]+>/g, "").trim();
        if (t) texts.push(t);
      }
    }
  }
  return texts.join("\n").substring(0, 100000);
}

async function extractImage(filePath) {
  const { createWorker } = require("tesseract.js");
  const worker = await createWorker(["kor", "eng"]);
  try {
    const { data: { text } } = await worker.recognize(filePath);
    return (text || "").substring(0, 50000);
  } finally {
    await worker.terminate();
  }
}

module.exports = { extractText };