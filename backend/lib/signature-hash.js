/**
 * 전자서명 / 계약서 해시 유틸
 * - 서명 개별 해시: 이미지 + 벡터 궤적 + 서명시각
 * - 계약서 최종 해시: 본문 스냅샷 + 모든 서명 해시 + 완료 시각
 * - SHA-256 기반 (Node crypto 내장)
 */
const crypto = require("crypto");

/**
 * 개별 서명 해시 계산
 * @param {object} input - { imageDataUri?, imageUrl?, strokesJson?, signedAt? }
 * @returns {string} SHA-256 hex digest
 */
function computeSignatureHash(input = {}) {
  const hash = crypto.createHash("sha256");
  hash.update(String(input.imageDataUri || input.imageUrl || ""));
  hash.update("|");
  hash.update(String(input.strokesJson || ""));
  hash.update("|");
  hash.update(String(input.signedAt || ""));
  return hash.digest("hex");
}

/**
 * 계약서 최종 해시 계산 — 본문 + 모든 서명 해시를 결합
 * @param {object} contract - { id, contentJson, completedAt }
 * @param {Array<{ hash: string, signerName?: string, signedAt?: string }>} signatures
 * @returns {string} SHA-256 hex digest
 */
function computeContractHash(contract, signatures = []) {
  const hash = crypto.createHash("sha256");
  hash.update(String(contract.id || ""));
  hash.update("|");
  hash.update(String(contract.contentJson || ""));
  hash.update("|");
  hash.update(String(contract.completedAt || ""));
  for (const sig of signatures) {
    hash.update("|");
    hash.update(String(sig.hash || ""));
    hash.update(":");
    hash.update(String(sig.signerName || ""));
    hash.update(":");
    hash.update(String(sig.signedAt || ""));
  }
  return hash.digest("hex");
}

/**
 * 짧은 해시 표시용 (앞 16자리 + 끝 4자리)
 */
function shortHash(full) {
  if (!full || typeof full !== "string") return "";
  if (full.length <= 20) return full;
  return `${full.slice(0, 16)}…${full.slice(-4)}`;
}

module.exports = {
  computeSignatureHash,
  computeContractHash,
  shortHash,
};
