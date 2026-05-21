/**
 * 공개 서명 라우트 (토큰 기반, 로그인 불필요)
 * - 외부 상대방·의뢰인이 /sign/:token 으로 진입
 * - OTP 인증 → 문서 열람 → 서명 제출 → 완료
 *
 * 단계별 엔드포인트:
 *   GET  /:token                   → 초대+계약서 메타(본문 미포함)
 *   POST /:token/verify/request-otp → SMS OTP 발송
 *   POST /:token/verify/submit-otp  → OTP 확인 → 단기 인증 쿠키 발급
 *   POST /:token/verify/security-code → L2 방식
 *   GET  /:token/document          → 인증 통과 후 본문 반환
 *   POST /:token/sign              → 서명 제출
 *   POST /:token/decline           → 서명 거부
 *   GET  /:token/download-pdf      → 완료 후 PDF 다운로드
 */
const { Router } = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { sqlite } = require("../db");
const { requestOtp, verifyOtp, getLast4 } = require("../lib/sms-otp");
const { logEvent } = require("../lib/audit-log");
const { saveSignatureImage } = require("../lib/signature-storage");
const { computeSignatureHash } = require("../lib/signature-hash");
const { maybeCompleteContract } = require("./contracts");

const router = Router();
const SIGN_SESSION_COOKIE = "sign_session";
const SIGN_SESSION_TTL_MS = 30 * 60 * 1000; // 30분
const SMS_OTP_CONFIGURED = Boolean(process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER);

/** 간이 세션 저장소 (메모리) — 토큰 당 verified flag */
const signSessions = new Map();

function createSignSession(token, partyId, verificationId) {
  const sessionId = crypto.randomBytes(24).toString("base64url");
  signSessions.set(sessionId, {
    token,
    partyId,
    verificationId,
    createdAt: Date.now(),
  });
  return sessionId;
}

function getSignSession(req) {
  const cookie = req.get("Cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SIGN_SESSION_COOKIE}=([^;]*)`));
  if (!m) return null;
  const sess = signSessions.get(decodeURIComponent(m[1]));
  if (!sess) return null;
  if (Date.now() - sess.createdAt > SIGN_SESSION_TTL_MS) {
    signSessions.delete(m[1]);
    return null;
  }
  return sess;
}

function setSignSessionCookie(res, sessionId) {
  res.cookie(SIGN_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIGN_SESSION_TTL_MS,
  });
}

/** 토큰으로 초대 + 파티 + 계약서 조회 */
function resolveByToken(token) {
  const invitation = sqlite.prepare("SELECT * FROM invitations WHERE token = ?").get(token);
  if (!invitation) return null;
  const party = invitation.target_ref
    ? sqlite.prepare("SELECT * FROM contract_parties WHERE id = ?").get(invitation.target_ref)
    : null;
  const contract = party
    ? sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(party.contract_id)
    : null;
  return { invitation, party, contract };
}

function isExpired(invitation) {
  if (!invitation?.expires_at) return false;
  const expiresAt = new Date(invitation.expires_at.replace(" ", "T"));
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

function validateSignAccess(resolved, options = {}) {
  const { requireParty = false, requireContract = false, allowSigned = true, allowCompleted = true } = options;
  if (!resolved?.invitation) return { status: 404, error: "not found" };
  const { invitation, party, contract } = resolved;
  if (invitation.status === "cancelled") return { status: 410, error: "취소된 링크입니다" };
  if (isExpired(invitation)) return { status: 410, error: "만료된 링크입니다" };
  if (requireParty && !party) return { status: 404, error: "not found" };
  if (requireContract && !contract) return { status: 404, error: "not found" };
  if (contract?.status === "cancelled") return { status: 410, error: "취소된 계약서입니다" };
  if (!allowCompleted && contract?.status === "completed") return { status: 409, error: "이미 완료된 계약서입니다" };
  if (!allowSigned && party?.status === "signed") return { status: 409, error: "이미 서명 완료된 링크입니다" };
  return null;
}

function sendAccessError(res, accessError) {
  return res.status(accessError.status).json({ data: null, error: accessError.error, meta: null });
}

/** GET /:token — 초대 메타 + 계약서 타이틀만 */
router.get("/:token", (req, res) => {
  const resolved = resolveByToken(req.params.token);
  const accessError = validateSignAccess(resolved);
  if (accessError) return sendAccessError(res, accessError);
  const { invitation, party, contract } = resolved;

  res.json({
    data: {
      invitationType: invitation.type,
      displayName: party?.display_name || invitation.prefilled_name,
      contractTitle: contract?.title,
      contractType: contract?.type,
      phoneLast4: party?.phone_last4 || getLast4(invitation.prefilled_phone || ""),
      verificationLevel: party?.verification_level || 3,
      requireNameBirth: (party?.verification_level || 3) >= 4,
      alreadySigned: party?.status === "signed",
    },
    error: null,
    meta: null,
  });
});

/** POST /:token/verify/request-otp — OTP 발송 */
router.post("/:token/verify/request-otp", async (req, res) => {
  try {
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, {
      requireParty: true,
      requireContract: true,
      allowSigned: false,
      allowCompleted: false,
    });
    if (accessError) return sendAccessError(res, accessError);
    const { invitation, party } = resolved;

    const phone = party.phone_number || invitation.prefilled_phone;
    if (!phone) return res.status(400).json({ data: null, error: "등록된 전화번호가 없습니다", meta: null });

    const result = await requestOtp({
      contextType: "contract_party",
      contextId: party.id,
      phoneNumber: phone,
      req,
      dryRun: !SMS_OTP_CONFIGURED,
    });

    logEvent({
      contractId: party.contract_id,
      partyId: party.id,
      invitationId: invitation.id,
      actorType: "party",
      action: "otp_requested",
      details: { phoneLast4: getLast4(phone) },
      req,
    });

    res.json({
      data: {
        verificationId: result.verificationId,
        sentTo: result.sentTo,
        devCode: result.devCode,  // COOLSMS 미설정 시에만 반환
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(e.status || 500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:token/verify/submit-otp — OTP 확인 */
router.post("/:token/verify/submit-otp", (req, res) => {
  try {
    const { verificationId, code, name, birthdate } = req.body || {};
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, {
      requireParty: true,
      requireContract: true,
      allowSigned: false,
      allowCompleted: false,
    });
    if (accessError) return sendAccessError(res, accessError);
    const { invitation, party } = resolved;

    const result = verifyOtp(verificationId, code, { verifiedName: name });
    if (!result.ok) {
      logEvent({
        contractId: party.contract_id, partyId: party.id, invitationId: invitation.id,
        actorType: "party", action: "otp_failed", details: { reason: result.reason }, req,
      });
      return res.status(400).json({ data: null, error: result.reason, meta: null });
    }

    // L4 이름+생일 매칭
    if ((party.verification_level || 3) >= 4) {
      if (!name || !birthdate) return res.status(400).json({ data: null, error: "이름과 생년월일이 필요합니다", meta: null });
      const nameMatch = party.legal_name ? normalize(party.legal_name) === normalize(name) : true;
      const birthMatch = party.birthdate ? party.birthdate === birthdate : true;
      if (!nameMatch || !birthMatch) {
        return res.status(403).json({ data: null, error: "이름 또는 생년월일이 일치하지 않습니다", meta: null });
      }
    }

    sqlite.prepare(`
      UPDATE contract_parties SET status = 'verified', verified_at = datetime('now'), verification_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(verificationId, party.id);

    const sessionId = createSignSession(req.params.token, party.id, verificationId);
    setSignSessionCookie(res, sessionId);

    logEvent({
      contractId: party.contract_id, partyId: party.id, invitationId: invitation.id,
      actorType: "party", action: "otp_verified",
      details: { verificationLevel: party.verification_level }, req,
    });

    res.json({ data: { verified: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

function normalize(s) { return String(s || "").replace(/\s+/g, "").toLowerCase(); }

/** 미들웨어: 서명 세션 검증 */
function requireSignSession(req, res, next) {
  const sess = getSignSession(req);
  if (!sess || sess.token !== req.params.token) {
    return res.status(401).json({ data: null, error: "본인 확인이 필요합니다", meta: null });
  }
  req.signSession = sess;
  next();
}

/** GET /:token/document — 본문 반환 (인증 후) */
router.get("/:token/document", requireSignSession, (req, res) => {
  try {
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, { requireParty: true, requireContract: true });
    if (accessError) return sendAccessError(res, accessError);
    const { contract, party } = resolved;
    const fields = sqlite.prepare("SELECT * FROM contract_signature_fields WHERE contract_id = ? ORDER BY order_index").all(contract.id);
    const mySignFields = fields.filter((f) => f.role === party.role);
    const signatures = sqlite.prepare(`
      SELECT s.*, csf.field_key, csf.role FROM signatures s
      JOIN contract_signature_fields csf ON csf.signature_id = s.id
      WHERE csf.contract_id = ?
    `).all(contract.id);

    logEvent({
      contractId: contract.id, partyId: party.id, invitationId: null,
      actorType: "party", action: "document_viewed", req,
    });

    res.json({
      data: {
        contract: {
          id: contract.id,
          title: contract.title,
          type: contract.type,
          status: contract.status,
          contentJson: contract.content_json,
          contentHtml: contract.content_html,
        },
        fields,
        mySignFields,
        signatures,
        party: { id: party.id, role: party.role, displayName: party.display_name, status: party.status },
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:token/sign — 서명 제출 */
router.post("/:token/sign", requireSignSession, (req, res) => {
  try {
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, {
      requireParty: true,
      requireContract: true,
      allowSigned: false,
      allowCompleted: false,
    });
    if (accessError) return sendAccessError(res, accessError);
    const { contract, party } = resolved;
    const { fieldKey, signature = {} } = req.body || {};
    if (!fieldKey) return res.status(400).json({ data: null, error: "fieldKey 필수", meta: null });
    if (!signature.imageData) return res.status(400).json({ data: null, error: "서명 이미지 필요", meta: null });

    const field = sqlite.prepare(`
      SELECT * FROM contract_signature_fields WHERE contract_id = ? AND field_key = ? AND role = ?
    `).get(contract.id, fieldKey, party.role);
    if (!field) return res.status(400).json({ data: null, error: "해당 서명 필드에 서명할 권한이 없습니다", meta: null });
    if (field.signature_id) return res.status(400).json({ data: null, error: "이미 서명된 필드입니다", meta: null });

    const saved = saveSignatureImage(signature.imageData);
    const sigId = crypto.randomUUID();
    const signedAt = new Date().toISOString();
    const hash = computeSignatureHash({
      imageDataUri: signature.imageData,
      strokesJson: signature.strokes,
      signedAt,
    });
    sqlite.prepare(`
      INSERT INTO signatures (
        id, signer_type, signer_id, signer_name, image_url, image_data_uri,
        strokes_json, width_px, height_px, pointer_type,
        ip_address, user_agent, hash,
        avg_pressure, max_pressure, stroke_count, total_duration_ms,
        avg_velocity, screen_dpi, orientation,
        signed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      sigId,
      party.role === "our_client" ? "client" : "external",
      party.id,
      party.display_name,
      saved?.url || null,
      saved ? null : signature.imageData,
      signature.strokes || null,
      signature.widthPx || null,
      signature.heightPx || null,
      signature.pointerType || "mouse",
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
      req.get("user-agent") || null,
      hash,
      signature.avgPressure ?? null,
      signature.maxPressure ?? null,
      signature.strokeCount ?? null,
      signature.totalDurationMs ?? null,
      signature.avgVelocity ?? null,
      signature.screenDpi ?? null,
      signature.orientation ?? null,
    );
    sqlite.prepare("UPDATE contract_signature_fields SET signature_id = ? WHERE id = ?").run(sigId, field.id);

    logEvent({
      contractId: contract.id, partyId: party.id,
      actorType: "party", action: "field_signed",
      details: { fieldKey, role: party.role }, req,
    });

    // 파티의 필수 필드가 모두 완료되었는지
    // 위 UPDATE 이후 signature_id가 반영된 상태에서 다시 조회하여 정확히 남은 필드 수를 계산
    const remainingAfter = sqlite.prepare(`
      SELECT COUNT(*) AS c FROM contract_signature_fields WHERE contract_id = ? AND role = ? AND required = 1 AND signature_id IS NULL
    `).get(contract.id, party.role).c;

    if (remainingAfter === 0) {
      sqlite.prepare(`
        UPDATE contract_parties SET status = 'signed', signed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
      `).run(party.id);
      logEvent({
        contractId: contract.id, partyId: party.id,
        actorType: "party", action: "party_completed", req,
      });
    }
    maybeCompleteContract(contract.id, req);

    res.json({
      data: {
        fieldKey,
        signatureId: sigId,
        partyRemaining: remainingAfter,
      },
      error: null, meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:token/decline — 서명 거부 */
router.post("/:token/decline", requireSignSession, (req, res) => {
  try {
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, {
      requireParty: true,
      requireContract: true,
      allowSigned: false,
      allowCompleted: false,
    });
    if (accessError) return sendAccessError(res, accessError);
    const { party } = resolved;
    const { reason } = req.body || {};
    sqlite.prepare(`
      UPDATE contract_parties SET status = 'declined', declined_reason = ?, updated_at = datetime('now') WHERE id = ?
    `).run(reason || null, party.id);
    logEvent({
      contractId: party.contract_id, partyId: party.id,
      actorType: "party", action: "declined",
      details: { reason }, req,
    });
    res.json({ data: { declined: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /:token/download-pdf — 완료된 계약서 PDF */
router.get("/:token/download-pdf", (req, res) => {
  try {
    const resolved = resolveByToken(req.params.token);
    const accessError = validateSignAccess(resolved, { requireContract: true });
    if (accessError) return res.status(accessError.status).send(accessError.error);
    const { contract } = resolved;
    if (contract.status !== "completed") return res.status(409).send("완료된 계약서만 다운로드할 수 있습니다");
    if (!contract.final_pdf_url) return res.status(404).send("PDF가 아직 생성되지 않았습니다");

    // 다운로드 경로는 항상 STORAGE_PATH 안쪽으로 한정한다.
    // 현재 final_pdf_url 은 서버에서 UUID로만 생성되지만(`/uploads/contracts/<uuid>.pdf`),
    // 향후 누군가 다른 경로로 이 컬럼을 채우더라도 path traversal 로 STORAGE_PATH 바깥
    // 파일(.env, /etc/passwd 등)이 노출되지 않도록 정규화 후 prefix 검증을 강제한다.
    const STORAGE_PATH = path.resolve(process.env.STORAGE_PATH || path.join(__dirname, "..", "data"));
    const requestedRel = String(contract.final_pdf_url || "").replace(/^\/+/, "");
    const filePath = path.resolve(STORAGE_PATH, requestedRel);
    const insideStorage = filePath === STORAGE_PATH || filePath.startsWith(STORAGE_PATH + path.sep);
    if (!insideStorage) return res.status(400).send("invalid file path");
    if (!fs.existsSync(filePath)) return res.status(404).send("file missing");

    logEvent({ contractId: contract.id, actorType: "party", action: "pdf_downloaded", req });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(contract.title)}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (_e) {
    res.status(500).send("error");
  }
});

module.exports = router;
