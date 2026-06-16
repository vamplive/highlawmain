/** 멀티파트 폼에서 업로드된 파일명 인코딩 복원
 *
 * busboy(Multer 내부)가 Content-Disposition 헤더의 파일명을 latin1로 읽어
 * UTF-8 한글 파일명이 깨지는 문제를 수정한다.
 * latin1 바이트열을 utf-8 문자열로 재해석한다.
 */

/**
 * @param {string} raw - multer가 제공하는 file.originalname (latin1로 잘못 해석된 상태)
 * @returns {string} 올바르게 복원된 파일명 (UTF-8)
 */
function decodeMultipartFilename(raw) {
  try {
    return Buffer.from(raw, "latin1").toString("utf8");
  } catch {
    return raw;
  }
}

module.exports = { decodeMultipartFilename };
