/**
 * 계약서(contracts) CRUD 및 서명 관리 — 관리자 + 포털 권한 분기
 * - 관리자: 목록/상세/생성/수정/파티관리/발송/취소/완료
 * - 포털 의뢰인: 본인 계약서만 조회
 */
const { Router } = require("express");
const crypto = require("crypto");
const { sqlite } = require("../db");
const { adminAuth, portalAuth, requireRole, requireMinRole } = require("../lib/auth");
const { createAndSendInvitation } = require("../lib/invite-sender");
const { logEvent, listByContract, auditMiddleware } = require("../lib/audit-log");
const { saveSignatureImage } = require("../lib/signature-storage");
const { computeSignatureHash, computeContractHash } = require("../lib/signature-hash");

const router = Router();

// 모든 쓰기 작업을 일별 JSONL 감사 로그에 자동 기록 (B안 패턴 확장).
// 계약서는 contract_audit_logs 테이블(logEvent)에도 별도 기록되지만, 그쪽은
// 계약 단위 타임라인용이고 이쪽은 운영자 행위 추적용이라 두 채널 모두 운영한다.
router.use(auditMiddleware("contracts"));

/** 계약서 하나를 파티/필드/감사로그 포함하여 조회 */
function loadContractFull(contractId) {
  const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId);
  if (!contract) return null;
  const parties = sqlite.prepare("SELECT * FROM contract_parties WHERE contract_id = ? ORDER BY order_index").all(contractId);
  const fields = sqlite.prepare("SELECT * FROM contract_signature_fields WHERE contract_id = ? ORDER BY order_index").all(contractId);
  const signatures = sqlite.prepare(`
    SELECT s.*, csf.field_key AS field_key FROM signatures s
    JOIN contract_signature_fields csf ON csf.signature_id = s.id
    WHERE csf.contract_id = ?
  `).all(contractId);
  const auditLogs = listByContract(contractId, 200);
  return { contract, parties, fields, signatures, auditLogs };
}

function toPortalContractListItem(contract) {
  return {
    id: contract.id,
    type: contract.type,
    title: contract.title,
    status: contract.status,
    completed_at: contract.completed_at,
    final_pdf_url: contract.final_pdf_url,
    updated_at: contract.updated_at,
  };
}

function toPortalContractDetail(full) {
  if (!full) return null;
  const { contract, parties, fields, signatures } = full;
  return {
    contract: {
      id: contract.id,
      type: contract.type,
      title: contract.title,
      status: contract.status,
      content_html: contract.content_html,
      completed_at: contract.completed_at,
      final_pdf_url: contract.final_pdf_url,
      updated_at: contract.updated_at,
    },
    parties: parties.map((party) => ({
      id: party.id,
      role: party.role,
      display_name: party.display_name,
      status: party.status,
      signed_at: party.signed_at,
    })),
    fields: fields.map((field) => ({
      id: field.id,
      field_key: field.field_key,
      role: field.role,
      label: field.label,
      required: field.required,
      order_index: field.order_index,
    })),
    signatures: signatures.map((signature) => ({
      id: signature.id,
      field_key: signature.field_key,
      image_url: signature.image_url,
      image_data_uri: signature.image_data_uri,
      signed_at: signature.signed_at,
    })),
  };
}

/** GET / — 계약서 목록 (관리자) */
router.get("/", adminAuth, (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;
    const parts = ["SELECT * FROM contracts WHERE 1=1"];
    const args = [];
    if (type) { parts.push("AND type = ?"); args.push(type); }
    if (status) { parts.push("AND status = ?"); args.push(status); }
    parts.push("ORDER BY updated_at DESC LIMIT ?");
    args.push(Math.min(Number(limit) || 100, 500));
    const rows = sqlite.prepare(parts.join(" ")).all(...args);
    res.json({ data: rows, error: null, meta: { count: rows.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /:id — 계약서 상세 (관리자) */
router.get("/:id", adminAuth, (req, res) => {
  try {
    const full = loadContractFull(req.params.id);
    if (!full) return res.status(404).json({ data: null, error: "not found", meta: null });
    res.json({ data: full, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST / — 계약서 수동 생성 (manager 이상) */
router.post("/", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const {
      type = "engagement", title, clientId, caseFileId,
      contentJson, contentHtml, templateId,
    } = req.body || {};
    if (!title || !contentJson) {
      return res.status(400).json({ data: null, error: "title, contentJson 필수", meta: null });
    }
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO contracts (
        id, template_id, type, title, client_id, case_file_id,
        content_json, content_html, status, created_by_admin_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
    `).run(
      id, templateId || null, type, title,
      clientId || null, caseFileId || null,
      typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson),
      contentHtml || null,
      req.adminUser?.userId || null,
    );

    logEvent({ contractId: id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "contract_created", req });

    const full = loadContractFull(id);
    res.json({ data: full, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** PATCH /:id — 계약서 본문/제목 수정 (draft 상태만, manager 이상) */
router.patch("/:id", adminAuth, requireMinRole("manager"), (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    if (row.status !== "draft") {
      return res.status(400).json({ data: null, error: "draft 상태의 계약서만 수정할 수 있습니다", meta: null });
    }
    const { title, contentJson, contentHtml, clientId, caseFileId } = req.body || {};
    sqlite.prepare(`
      UPDATE contracts SET
        title = COALESCE(?, title),
        content_json = COALESCE(?, content_json),
        content_html = COALESCE(?, content_html),
        client_id = COALESCE(?, client_id),
        case_file_id = COALESCE(?, case_file_id),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title ?? null,
      contentJson == null ? null : (typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson)),
      contentHtml ?? null,
      clientId ?? null,
      caseFileId ?? null,
      req.params.id,
    );
    logEvent({ contractId: req.params.id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "contract_edited", req });
    res.json({ data: loadContractFull(req.params.id), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/signature-fields — 서명 필드 추가 */
router.post("/:id/signature-fields", adminAuth, (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });
    const { fieldKey, role, label, required = true, orderIndex = 0 } = req.body || {};
    if (!fieldKey || !role) return res.status(400).json({ data: null, error: "fieldKey, role 필수", meta: null });
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO contract_signature_fields (
        id, contract_id, field_key, role, label, required, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, contract.id, fieldKey, role, label || null, required ? 1 : 0, orderIndex);
    res.json({ data: { id }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/parties — 파티 추가 */
router.post("/:id/parties", adminAuth, (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });

    const {
      role = "counterparty", displayName, legalName, birthdate,
      phoneNumber, email, verificationLevel = 3, orderIndex = 0,
    } = req.body || {};
    if (!displayName) return res.status(400).json({ data: null, error: "displayName 필수", meta: null });
    const id = crypto.randomUUID();
    const phoneLast4 = (phoneNumber || "").replace(/\D/g, "").slice(-4);
    sqlite.prepare(`
      INSERT INTO contract_parties (
        id, contract_id, role, display_name, legal_name, birthdate,
        phone_number, phone_last4, email, verification_level, status,
        order_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    `).run(
      id, req.params.id, role, displayName, legalName || null, birthdate || null,
      phoneNumber || null, phoneLast4 || null, email || null, verificationLevel, orderIndex,
    );
    logEvent({ contractId: req.params.id, partyId: id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "party_added", details: { role, displayName }, req });
    res.json({ data: sqlite.prepare("SELECT * FROM contract_parties WHERE id = ?").get(id), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** PATCH /:id/parties/:partyId — 파티 수정 */
router.patch("/:id/parties/:partyId", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM contract_parties WHERE id = ? AND contract_id = ?").get(req.params.partyId, req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });

    const {
      role, displayName, legalName, birthdate, phoneNumber, email, verificationLevel, orderIndex,
    } = req.body || {};
    const phoneLast4 = phoneNumber != null ? (phoneNumber || "").replace(/\D/g, "").slice(-4) : null;

    sqlite.prepare(`
      UPDATE contract_parties SET
        role = COALESCE(?, role),
        display_name = COALESCE(?, display_name),
        legal_name = COALESCE(?, legal_name),
        birthdate = COALESCE(?, birthdate),
        phone_number = COALESCE(?, phone_number),
        phone_last4 = COALESCE(?, phone_last4),
        email = COALESCE(?, email),
        verification_level = COALESCE(?, verification_level),
        order_index = COALESCE(?, order_index),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      role ?? null, displayName ?? null, legalName ?? null, birthdate ?? null,
      phoneNumber ?? null, phoneLast4, email ?? null,
      verificationLevel ?? null, orderIndex ?? null, req.params.partyId,
    );
    res.json({ data: sqlite.prepare("SELECT * FROM contract_parties WHERE id = ?").get(req.params.partyId), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** DELETE /:id/parties/:partyId — 파티 삭제 */
router.delete("/:id/parties/:partyId", adminAuth, (req, res) => {
  try {
    sqlite.prepare("DELETE FROM contract_parties WHERE id = ? AND contract_id = ?").run(req.params.partyId, req.params.id);
    logEvent({ contractId: req.params.id, partyId: req.params.partyId, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "party_removed", req });
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/parties/:partyId/send — 특정 파티에게 서명 링크 발송
 *  body: { channels?: ("sms"|"email")[] } — 미지정 시 등록된 모든 채널 사용
 */
router.post("/:id/parties/:partyId/send", adminAuth, async (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "contract not found", meta: null });
    const party = sqlite.prepare("SELECT * FROM contract_parties WHERE id = ?").get(req.params.partyId);
    if (!party) return res.status(404).json({ data: null, error: "party not found", meta: null });
    if (!party.phone_number && !party.email) {
      return res.status(400).json({ data: null, error: "전화번호 또는 이메일이 필요합니다", meta: null });
    }

    const type = contract.type === "settlement" ? "settlement" : "engagement";
    const requested = Array.isArray(req.body?.channels) ? req.body.channels : null;
    const channels = [];
    if ((!requested || requested.includes("sms")) && party.phone_number) channels.push("sms");
    if ((!requested || requested.includes("email")) && party.email) channels.push("email");
    if (channels.length === 0) {
      return res.status(400).json({ data: null, error: "선택한 채널로 발송할 연락처가 없습니다", meta: null });
    }

    const result = await createAndSendInvitation({
      type,
      targetRef: party.id,
      name: party.display_name,
      phone: party.phone_number,
      email: party.email,
      channels,
      adminUserId: req.adminUser?.userId,
      contractId: contract.id,
      partyId: party.id,
      title: contract.title,
    });

    // 계약서 상태 업데이트: draft → sent (이미 sent면 유지)
    if (contract.status === "draft") {
      sqlite.prepare("UPDATE contracts SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(contract.id);
    }
    sqlite.prepare("UPDATE contract_parties SET sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(party.id);

    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/send-all — 전체 파티에게 발송 */
router.post("/:id/send-all", adminAuth, async (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });
    const parties = sqlite.prepare("SELECT * FROM contract_parties WHERE contract_id = ? AND role != 'lawyer'").all(contract.id);

    const results = [];
    for (const party of parties) {
      if (!party.phone_number && !party.email) {
        results.push({ partyId: party.id, skipped: true, reason: "연락처 없음" });
        continue;
      }
      const type = contract.type === "settlement" ? "settlement" : "engagement";
      const channels = [];
      if (party.phone_number) channels.push("sms");
      if (party.email) channels.push("email");
      try {
        const r = await createAndSendInvitation({
          type, targetRef: party.id, name: party.display_name,
          phone: party.phone_number, email: party.email,
          channels, adminUserId: req.adminUser?.userId,
          contractId: contract.id, partyId: party.id, title: contract.title,
        });
        sqlite.prepare("UPDATE contract_parties SET sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(party.id);
        results.push({ partyId: party.id, ok: true, invitation: r.invitation });
      } catch (e) {
        results.push({ partyId: party.id, ok: false, error: e.message });
      }
    }
    if (contract.status === "draft") {
      sqlite.prepare("UPDATE contracts SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(contract.id);
    }

    res.json({ data: { results }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/lawyer-sign — 변호사(관리자)가 직접 서명 추가 */
router.post("/:id/lawyer-sign", adminAuth, (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });
    const { fieldKey, signature = {} } = req.body || {};
    if (!signature.imageData) return res.status(400).json({ data: null, error: "서명 이미지가 필요합니다", meta: null });

    // 대상 필드 찾기
    let field;
    if (fieldKey) {
      field = sqlite.prepare("SELECT * FROM contract_signature_fields WHERE contract_id = ? AND field_key = ?").get(contract.id, fieldKey);
    } else {
      field = sqlite.prepare("SELECT * FROM contract_signature_fields WHERE contract_id = ? AND role = 'lawyer' AND signature_id IS NULL LIMIT 1").get(contract.id);
    }
    if (!field) return res.status(400).json({ data: null, error: "대상 서명 필드를 찾을 수 없습니다", meta: null });

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
      ) VALUES (?, 'lawyer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      sigId, req.adminUser?.userId, req.adminUser?.userId || "변호사",
      saved?.url || null, saved ? null : signature.imageData,
      signature.strokes || null, signature.widthPx || null, signature.heightPx || null,
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

    // 변호사 파티 signed 처리
    sqlite.prepare(`
      UPDATE contract_parties SET status = 'signed', signed_at = datetime('now'), updated_at = datetime('now')
      WHERE contract_id = ? AND role = 'lawyer'
    `).run(contract.id);

    logEvent({ contractId: contract.id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "field_signed", details: { fieldKey: field.field_key, role: "lawyer" }, req });

    // 전체 완료 검사 & PDF 생성 트리거
    maybeCompleteContract(contract.id, req);

    res.json({ data: loadContractFull(contract.id), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/cancel — 계약서 취소 (admin 전용 — 발행 후 무효화는 위험) */
router.post("/:id/cancel", adminAuth, requireRole("admin"), (req, res) => {
  try {
    const { reason } = req.body || {};
    sqlite.prepare(`
      UPDATE contracts SET status = 'cancelled', cancelled_at = datetime('now'), cancel_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(reason || null, req.params.id);
    logEvent({ contractId: req.params.id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "contract_cancelled", details: { reason }, req });
    res.json({ data: { cancelled: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /:id/finalize-pdf — 프론트에서 생성한 PDF를 업로드해 저장 */
router.post("/:id/finalize-pdf", adminAuth, (req, res) => {
  try {
    const { pdfDataUri } = req.body || {};
    if (!pdfDataUri) return res.status(400).json({ data: null, error: "pdfDataUri 필수", meta: null });
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });

    const fs = require("fs");
    const path = require("path");
    const m = pdfDataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!m) return res.status(400).json({ data: null, error: "invalid PDF data URI", meta: null });
    const buffer = Buffer.from(m[1], "base64");
    const dir = path.join(process.env.STORAGE_PATH || path.join(__dirname, "..", "data"), "uploads", "contracts");
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${contract.id}.pdf`;
    fs.writeFileSync(path.join(dir, filename), buffer);
    const url = `/uploads/contracts/${filename}`;
    sqlite.prepare("UPDATE contracts SET final_pdf_url = ?, updated_at = datetime('now') WHERE id = ?").run(url, contract.id);

    logEvent({ contractId: contract.id, actorType: "admin", actorIdentifier: req.adminUser?.userId, action: "pdf_generated", details: { url }, req });
    res.json({ data: { url }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** 전체 파티가 signed 되었는지 검사하고 완료 처리 + 이메일 자동 배포 */
function maybeCompleteContract(contractId, _req) {
  const parties = sqlite.prepare("SELECT * FROM contract_parties WHERE contract_id = ?").all(contractId);
  if (parties.length === 0) return;
  const allSigned = parties.every(p => p.status === "signed");
  if (!allSigned) {
    // partially_signed 상태로 마킹
    sqlite.prepare("UPDATE contracts SET status = 'partially_signed', updated_at = datetime('now') WHERE id = ? AND status = 'sent'").run(contractId);
    return;
  }
  // 최종 해시 계산
  const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId);
  if (contract.status === "completed") return;
  const sigs = sqlite.prepare(`
    SELECT s.* FROM signatures s
    JOIN contract_signature_fields csf ON csf.signature_id = s.id
    WHERE csf.contract_id = ?
  `).all(contractId);
  const finalHash = computeContractHash({
    id: contract.id, contentJson: contract.content_json, completedAt: new Date().toISOString(),
  }, sigs);
  sqlite.prepare(`
    UPDATE contracts SET status = 'completed', completed_at = datetime('now'), final_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(finalHash, contractId);
  logEvent({ contractId, actorType: "system", action: "contract_completed", details: { finalHash } });

  // 완성 후 각 파티에게 이메일로 완성본 안내 (비동기, 실패 무시)
  notifyPartiesOnComplete(contractId).catch((e) => {
    console.warn("[contract-complete-notify]", e.message);
  });
}

/** 완료 시 각 파티에게 이메일 + SMS로 알림 */
async function notifyPartiesOnComplete(contractId) {
  const { sendEmail } = require("../lib/email-service");
  const { sendSMS } = require("../lib/sms-service");
  const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId);
  const parties = sqlite.prepare("SELECT * FROM contract_parties WHERE contract_id = ?").all(contractId);
  const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
  for (const p of parties) {
    // 각 파티의 최신 초대 토큰 찾기 (상대방용 다운로드 링크 생성)
    const inv = sqlite.prepare("SELECT token FROM invitations WHERE target_ref = ? ORDER BY created_at DESC LIMIT 1").get(p.id);
    const downloadUrl = inv ? `${PUBLIC_BASE_URL}/api/public/sign/${inv.token}/download-pdf` : null;
    const subject = `[법무법인 하이로] ${contract.title} 서명 완료 안내`;
    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:28px 22px;color:#222">
        <h2 style="color:#b08d57">${contract.title}</h2>
        <p>${p.display_name}님,</p>
        <p>모든 당사자의 전자서명이 완료되었습니다. 아래 링크에서 최종본을 다운로드하실 수 있습니다.</p>
        ${downloadUrl ? `<p style="text-align:center;margin:24px 0"><a href="${downloadUrl}" style="display:inline-block;padding:10px 22px;background:#b08d57;color:#fff;text-decoration:none;border-radius:4px">PDF 다운로드</a></p>` : ""}
        <p style="font-size:11px;color:#999">문서 해시(SHA-256): ${contract.final_hash?.slice(0, 24)}…</p>
      </div>
    `;
    if (p.email) {
      await sendEmail(p.email, subject, html).catch(() => {});
    }
    if (p.phone_number) {
      await sendSMS(p.phone_number, `[법무법인 하이로] ${contract.title} 전자서명이 완료되었습니다.${downloadUrl ? " " + downloadUrl : ""}`).catch(() => {});
    }
  }
}

/** 포털(의뢰인)이 본인 계약서 조회 */
router.get("/portal/mine", portalAuth, (req, res) => {
  try {
    const clientId = req.portalUser?.clientId;
    if (!clientId) return res.json({ data: [], error: null, meta: null });
    const rows = sqlite.prepare(`
      SELECT id, type, title, status, completed_at, final_pdf_url, updated_at
      FROM contracts
      WHERE client_id = ?
      ORDER BY updated_at DESC
    `).all(clientId);
    res.json({ data: rows.map(toPortalContractListItem), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

router.get("/portal/:id", portalAuth, (req, res) => {
  try {
    const contract = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id);
    if (!contract) return res.status(404).json({ data: null, error: "not found", meta: null });
    if (contract.client_id !== req.portalUser?.clientId) {
      return res.status(403).json({ data: null, error: "접근 권한이 없습니다", meta: null });
    }
    const full = loadContractFull(contract.id);
    res.json({ data: toPortalContractDetail(full), error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = {
  router,
  loadContractFull,
  maybeCompleteContract,
};

// Express 호환: router만 바로 use() 할 수 있도록 default export도 router로
module.exports = router;
module.exports.loadContractFull = loadContractFull;
module.exports.maybeCompleteContract = maybeCompleteContract;
