/**
 * 개인정보 동의 (서명 포함) API 라우트
 * - 상담 신청 직전에 호출되어 동의+서명 레코드를 먼저 생성
 * - 생성된 consentId를 반환 → ConsultationForm이 consultations POST에 함께 전달
 */
const { Router } = require("express");
const crypto = require("crypto");
const { sqlite } = require("../db");
const { adminAuth } = require("../lib/auth");
const { saveSignatureImage, deleteSignatureFile } = require("../lib/signature-storage");
const { computeSignatureHash } = require("../lib/signature-hash");
const logger = require("../lib/logger");

const router = Router();

const MAX_POLICY_VERSION_LENGTH = 80;
const MAX_POLICY_TEXT_LENGTH = 20_000;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_SIGNATURE_DATA_URI_LENGTH = 350_000;
const MAX_SIGNATURE_STROKES_LENGTH = 200_000;

function byteLength(value) {
  return Buffer.byteLength(String(value || ""), "utf8");
}

function isValidSignatureDataUri(value) {
  return typeof value === "string" && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value);
}

const insertSignatureStmt = sqlite.prepare(`
  INSERT INTO signatures (
    id, signer_type, signer_name, image_url, image_data_uri,
    strokes_json, width_px, height_px, pointer_type,
    ip_address, user_agent, hash, signed_at, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertConsentStmt = sqlite.prepare(`
  INSERT INTO privacy_consents (
    id, consultation_id, client_id, policy_version, policy_text_snapshot,
    signature_id, agreed_name, agreed_phone, ip_address, user_agent, consented_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

/**
 * POST /api/privacy-consents — 개인정보 동의 서명 저장 (공개)
 * body: {
 *   policyVersion, policyText, name, phone?,
 *   signature: { imageData, strokes, pointerType, widthPx, heightPx }
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      policyVersion, policyText, name, phone, signature = {},
    } = req.body || {};

    if (!policyVersion || !policyText) {
      return res.status(400).json({ data: null, error: "정책 버전 및 본문이 필요합니다", meta: null });
    }
    if (!signature.imageData || !signature.strokes) {
      return res.status(400).json({ data: null, error: "서명 데이터가 필요합니다", meta: null });
    }
    if (byteLength(policyVersion) > MAX_POLICY_VERSION_LENGTH || byteLength(policyText) > MAX_POLICY_TEXT_LENGTH) {
      return res.status(400).json({ data: null, error: "정책 정보가 허용 범위를 초과했습니다", meta: null });
    }
    if (name && byteLength(name) > MAX_NAME_LENGTH) {
      return res.status(400).json({ data: null, error: "이름은 100자 이내로 입력해주세요", meta: null });
    }
    if (phone && byteLength(phone) > MAX_PHONE_LENGTH) {
      return res.status(400).json({ data: null, error: "연락처가 너무 깁니다", meta: null });
    }
    if (!isValidSignatureDataUri(signature.imageData) || byteLength(signature.imageData) > MAX_SIGNATURE_DATA_URI_LENGTH) {
      return res.status(400).json({ data: null, error: "서명 이미지 형식 또는 크기가 올바르지 않습니다", meta: null });
    }
    const strokesJson = typeof signature.strokes === "string"
      ? signature.strokes
      : JSON.stringify(signature.strokes);
    if (byteLength(strokesJson) > MAX_SIGNATURE_STROKES_LENGTH) {
      return res.status(400).json({ data: null, error: "서명 좌표 데이터가 너무 큽니다", meta: null });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.get("user-agent") || "";

    // 서명 이미지 파일 저장 (폴백: data URI 직접 저장)
    const saved = saveSignatureImage(signature.imageData);
    const signatureId = crypto.randomUUID();
    const signedAt = new Date().toISOString();
    const hash = computeSignatureHash({
      imageDataUri: signature.imageData,
      strokesJson,
      signedAt,
    });

    insertSignatureStmt.run(
      signatureId,
      "external",
      name || null,
      saved?.url || null,
      saved ? null : signature.imageData,
      strokesJson,
      signature.widthPx || null,
      signature.heightPx || null,
      signature.pointerType || null,
      ip,
      userAgent,
      hash,
    );

    const consentId = crypto.randomUUID();
    insertConsentStmt.run(
      consentId,
      null,
      null,
      policyVersion,
      policyText,
      signatureId,
      name || null,
      phone || null,
      ip,
      userAgent,
    );

    res.json({
      data: { consentId, signatureId, hash },
      error: null,
      meta: null,
    });
  } catch (e) {
    logger.error({ err: e }, "privacy-consents create failed");
    res.status(500).json({ data: null, error: e.message || "동의 저장에 실패했습니다", meta: null });
  }
});

/**
 * DELETE /api/privacy-consents/:id — 상담 저장 실패 시 미연결 공개 동의 레코드 정리
 * - CSRF 보호 대상이며, consultation_id가 아직 없는 레코드만 삭제한다.
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }
    const row = sqlite.prepare(`
      SELECT pc.id, pc.signature_id, s.image_url
      FROM privacy_consents pc
      LEFT JOIN signatures s ON s.id = pc.signature_id
      WHERE pc.id = ? AND pc.consultation_id IS NULL
    `).get(id);
    if (!row) return res.status(404).json({ data: null, error: "정리할 동의 내역을 찾을 수 없습니다", meta: null });

    sqlite.transaction(() => {
      sqlite.prepare("DELETE FROM privacy_consents WHERE id = ? AND consultation_id IS NULL").run(id);
      sqlite.prepare("DELETE FROM signatures WHERE id = ?").run(row.signature_id);
    })();
    deleteSignatureFile(row.image_url);

    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e }, "privacy-consents cleanup failed");
    res.status(500).json({ data: null, error: "동의 내역 정리에 실패했습니다", meta: null });
  }
});

/**
 * GET /api/privacy-consents/:id — 동의 상세 조회 (관리자)
 */
router.get("/:id", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare(`
      SELECT pc.*, s.image_url AS signature_image_url, s.image_data_uri AS signature_image_data,
             s.signed_at AS signed_at, s.hash AS signature_hash, s.pointer_type AS pointer_type,
             s.ip_address AS signature_ip, s.user_agent AS signature_ua
      FROM privacy_consents pc
      LEFT JOIN signatures s ON s.id = pc.signature_id
      WHERE pc.id = ?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    logger.error({ err: e }, "privacy-consents get failed");
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /api/privacy-consents — 목록 (관리자)
 */
router.get("/", adminAuth, (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT pc.id, pc.consultation_id, pc.agreed_name, pc.agreed_phone,
             pc.policy_version, pc.consented_at, s.image_url AS signature_image_url
      FROM privacy_consents pc
      LEFT JOIN signatures s ON s.id = pc.signature_id
      ORDER BY pc.consented_at DESC
      LIMIT 200
    `).all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
