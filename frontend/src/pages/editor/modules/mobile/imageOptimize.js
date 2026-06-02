/**
 * 모바일 업로드 전 클라이언트 사이드 이미지 압축
 *
 * - 휴대폰 사진은 보통 4000px 이상이라 업로드/렌더가 느림. 1600px 이하로 리사이즈
 *   하고 JPEG 품질 0.82로 재인코딩하면 90% 이상 절감되면서도 모바일 화면에는 충분.
 * - HEIC 등 일부 포맷은 캔버스가 디코드하지 못할 수 있으므로 실패 시 원본 fallback.
 *
 * @param {File} file
 * @param {{ maxEdge?: number, quality?: number, mimeType?: string }} [opts]
 * @returns {Promise<File>}
 */
export async function optimizeImage(file, opts = {}) {
  const maxEdge = opts.maxEdge || 1600;
  const quality = opts.quality ?? 0.82;
  const mimeType = opts.mimeType || (file.type === "image/png" ? "image/png" : "image/jpeg");

  if (!file || !/^image\//.test(file.type) || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= maxEdge && file.size < 2 * 1024 * 1024) {
    bitmap.close?.();
    return file;
  }

  const ratio = Math.min(1, maxEdge / longest);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}_opt.${ext}`, { type: mimeType });
}
