/**
 * 서명 이미지 저장 유틸
 * - base64 data URI (PNG)를 파일시스템에 저장
 * - 반환 경로는 브라우저에서 접근 가능한 /uploads/signatures/... 상대 URL
 * - 저장 실패 시 호출자가 imageDataUri 필드를 폴백으로 DB에 직접 저장
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const SIGNATURES_DIR = path.join(STORAGE_PATH, "uploads", "signatures");

if (!fs.existsSync(SIGNATURES_DIR)) {
  fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
}

/**
 * base64 data URI를 파일로 저장한다.
 * @param {string} dataUri - "data:image/png;base64,iVBORw0..." 형태
 * @returns {{ url: string, absolutePath: string, size: number } | null}
 */
function saveSignatureImage(dataUri) {
  if (!dataUri || typeof dataUri !== "string") return null;
  const match = dataUri.match(/^data:(image\/(png|jpeg|webp));base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  const buffer = Buffer.from(match[3], "base64");
  if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) return null;  // 2MB 상한

  const filename = `${crypto.randomUUID()}.${ext}`;
  const absolutePath = path.join(SIGNATURES_DIR, filename);
  fs.writeFileSync(absolutePath, buffer);

  return {
    url: `/uploads/signatures/${filename}`,
    absolutePath,
    size: buffer.length,
  };
}

/** 삭제 유틸 (계약서 취소/삭제 시) */
function deleteSignatureFile(urlOrPath) {
  if (!urlOrPath) return;
  let absolute;
  if (urlOrPath.startsWith("/uploads/signatures/")) {
    absolute = path.join(STORAGE_PATH, urlOrPath);
  } else {
    absolute = urlOrPath;
  }
  try {
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
  } catch {
    // 실패해도 조용히 무시
  }
}

module.exports = { saveSignatureImage, deleteSignatureFile, SIGNATURES_DIR };
