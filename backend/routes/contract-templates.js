/**
 * 계약서 템플릿 API — 관리자 전용
 * - 템플릿 CRUD
 * - 의뢰인용 계약서 인스턴스로 복제 (clone-for-client)
 * - HWP/PDF 원본 양식 파일 첨부
 */
const { Router } = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { sqlite } = require("../db");
const { adminAuth } = require("../lib/auth");
const { logEvent } = require("../lib/audit-log");

const router = Router();

// ─── 계약서 파일 업로드 multer 설정 ──────────────────────────────────────
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const CONTRACT_FILE_DIR = path.join(STORAGE_PATH, "uploads", "contract-templates");

const contractFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(CONTRACT_FILE_DIR, { recursive: true });
    cb(null, CONTRACT_FILE_DIR);
  },
  filename: (_req, file, cb) => {
    // 원본 파일명 유지 (중복 방지용 타임스탬프 prefix)
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^\w가-힣().-]/g, "_");
    cb(null, `${base}${ext}`);
  },
});

const contractFileUpload = multer({
  storage: contractFileStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".hwp", ".hwpx", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("HWP, PDF, DOC 파일만 업로드 가능합니다"), false);
  },
});

router.get("/", adminAuth, (req, res) => {
  try {
    const rows = sqlite.prepare(`
      SELECT id, title, description, category, is_default, variables_schema,
             file_url_hwp, file_url_pdf, created_at, updated_at
      FROM contract_templates
      ORDER BY is_default DESC, updated_at DESC
    `).all();
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

router.get("/:id", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM contract_templates WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    res.json({ data: row, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

router.post("/", adminAuth, (req, res) => {
  try {
    const { title, description, category, contentJson, contentHtml, isDefault, variablesSchema } = req.body || {};
    if (!title || !contentJson) {
      return res.status(400).json({ data: null, error: "title, contentJson 필수", meta: null });
    }
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO contract_templates (
        id, title, description, category, content_json, content_html,
        variables_schema, is_default, created_by_admin_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id, title, description || null, category || "engagement",
      typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson),
      contentHtml || null,
      serializeSchema(variablesSchema),
      isDefault ? 1 : 0,
      req.adminUser?.userId || null,
    );
    const created = sqlite.prepare("SELECT * FROM contract_templates WHERE id = ?").get(id);
    res.json({ data: created, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

router.patch("/:id", adminAuth, (req, res) => {
  try {
    const row = sqlite.prepare("SELECT * FROM contract_templates WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });

    const { title, description, category, contentJson, contentHtml, isDefault, variablesSchema, fileUrlHwp, fileUrlPdf } = req.body || {};
    sqlite.prepare(`
      UPDATE contract_templates SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        content_json = COALESCE(?, content_json),
        content_html = COALESCE(?, content_html),
        variables_schema = COALESCE(?, variables_schema),
        is_default = COALESCE(?, is_default),
        file_url_hwp = COALESCE(?, file_url_hwp),
        file_url_pdf = COALESCE(?, file_url_pdf),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      category ?? null,
      contentJson == null ? null : (typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson)),
      contentHtml ?? null,
      variablesSchema === undefined ? null : serializeSchema(variablesSchema),
      isDefault == null ? null : (isDefault ? 1 : 0),
      fileUrlHwp ?? null,
      fileUrlPdf ?? null,
      req.params.id,
    );
    const updated = sqlite.prepare("SELECT * FROM contract_templates WHERE id = ?").get(req.params.id);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// ─── HWP/PDF 원본 파일 업로드 ────────────────────────────────────────────
router.post("/:id/upload-file", adminAuth, contractFileUpload.single("file"), (req, res) => {
  try {
    const row = sqlite.prepare("SELECT id FROM contract_templates WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });
    if (!req.file) return res.status(400).json({ data: null, error: "파일이 없습니다", meta: null });

    const ext = path.extname(req.file.filename).toLowerCase();
    const fileUrl = `/uploads/contract-templates/${req.file.filename}`;
    const colName = ext === ".pdf" ? "file_url_pdf" : "file_url_hwp";

    sqlite.prepare(`UPDATE contract_templates SET ${colName} = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(fileUrl, req.params.id);

    const updated = sqlite.prepare(`SELECT id, title, file_url_hwp, file_url_pdf FROM contract_templates WHERE id = ?`).get(req.params.id);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// ─── 특정 파일 삭제 (HWP or PDF) ─────────────────────────────────────────
router.delete("/:id/file/:type", adminAuth, (req, res) => {
  try {
    const { id, type } = req.params;
    if (!["hwp", "pdf"].includes(type)) return res.status(400).json({ data: null, error: "type은 hwp 또는 pdf", meta: null });
    const colName = type === "pdf" ? "file_url_pdf" : "file_url_hwp";
    const row = sqlite.prepare(`SELECT ${colName} FROM contract_templates WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ data: null, error: "not found", meta: null });

    const fileUrl = row[colName];
    if (fileUrl) {
      const absPath = path.join(STORAGE_PATH, fileUrl.replace(/^\//, ""));
      try { fs.unlinkSync(absPath); } catch (_) { /* 파일이 이미 없으면 무시 */ }
    }
    sqlite.prepare(`UPDATE contract_templates SET ${colName} = NULL, updated_at = datetime('now') WHERE id = ?`).run(id);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

function serializeSchema(s) {
  if (s == null) return null;
  if (typeof s === "string") return s;
  if (!Array.isArray(s)) return null;
  return JSON.stringify(s);
}

router.delete("/:id", adminAuth, (req, res) => {
  try {
    sqlite.prepare("DELETE FROM contract_templates WHERE id = ?").run(req.params.id);
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * POST /:id/clone-for-client — 템플릿 → 의뢰인 맞춤 계약서 인스턴스 생성
 * body: { clientId?, caseFileId?, title?, partyName?, partyPhone?, partyEmail?, variables? }
 *
 * variables: { "client.name": "박성재", "fee.retainerAmount": 2000000, ... }
 *  → 본문 내 {{var:key}} 자리에 치환 (number/date 자동 포맷)
 */
router.post("/:id/clone-for-client", adminAuth, (req, res) => {
  try {
    const tpl = sqlite.prepare("SELECT * FROM contract_templates WHERE id = ?").get(req.params.id);
    if (!tpl) return res.status(404).json({ data: null, error: "template not found", meta: null });

    const { clientId, caseFileId, title, partyName, partyPhone, partyEmail, variables } = req.body || {};
    const schema = parseSchema(tpl.variables_schema);
    const formatted = formatVariables(variables || {}, schema);

    // 본문/타이틀 치환
    const finalTitle = substitute(title || tpl.title, formatted);
    const finalJson = substituteJson(tpl.content_json, formatted);
    const finalHtml = substitute(tpl.content_html || "", formatted);

    // 의뢰인 정보가 비어있으면 변수에서 자동 보완
    const autoName = partyName || formatted["client.name"] || null;
    const autoPhone = partyPhone || formatted["client.phone"] || null;
    const autoEmail = partyEmail || formatted["client.email"] || null;

    const contractId = crypto.randomUUID();

    sqlite.prepare(`
      INSERT INTO contracts (
        id, template_id, type, title, client_id, case_file_id,
        content_json, content_html, status, created_by_admin_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'), datetime('now'))
    `).run(
      contractId,
      tpl.id,
      tpl.category === "settlement" ? "settlement" : "engagement",
      finalTitle,
      clientId || null,
      caseFileId || null,
      finalJson,
      finalHtml,
      req.adminUser?.userId || null,
    );

    // 템플릿의 서명 필드를 계약서 인스턴스로 복제
    const tplFields = sqlite.prepare("SELECT * FROM contract_signature_fields WHERE template_id = ?").all(tpl.id);
    const fieldInsert = sqlite.prepare(`
      INSERT INTO contract_signature_fields (
        id, contract_id, template_id, field_key, role, label, required, order_index, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, datetime('now'))
    `);
    for (const f of tplFields) {
      fieldInsert.run(crypto.randomUUID(), contractId, f.field_key, f.role, f.label, f.required, f.order_index);
    }

    // 기본 파티 생성: 의뢰인 + 변호사
    const partiesInsert = sqlite.prepare(`
      INSERT INTO contract_parties (
        id, contract_id, role, display_name, phone_number, phone_last4, email,
        verification_level, status, order_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    `);
    const phoneLast4 = (autoPhone || "").replace(/\D/g, "").slice(-4);
    partiesInsert.run(
      crypto.randomUUID(), contractId, "our_client",
      autoName || "의뢰인",
      autoPhone || null, phoneLast4 || null, autoEmail || null,
      3, 0,
    );
    partiesInsert.run(
      crypto.randomUUID(), contractId, "lawyer",
      "담당 변호사", null, null, null,
      1, 1,
    );

    logEvent({
      contractId,
      actorType: "admin",
      actorIdentifier: req.adminUser?.userId,
      action: "contract_created",
      details: { fromTemplateId: tpl.id, title: title || tpl.title },
      req,
    });

    const created = sqlite.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId);
    res.json({ data: { contract: created }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/* ───────── 변수 치환 helpers ───────── */

function parseSchema(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

/**
 * 입력값을 schema의 type에 맞게 표시 문자열로 포맷한다.
 *  - number: 1000 → "1,000" (한국 천단위 콤마)
 *  - date: "2026-04-10" → "2026년 4월 10일"
 *  - 그 외: trim된 문자열
 */
function formatVariables(input, schema) {
  const out = {};
  for (const def of schema) {
    const raw = input[def.key];
    if (raw == null || raw === "") {
      // 미입력 시 placeholder를 그대로 두면 본문이 흉해지므로 빈 문자열로 치환
      out[def.key] = "";
      continue;
    }
    if (def.type === "number") {
      const n = Number(String(raw).replace(/[^\d.-]/g, ""));
      out[def.key] = Number.isFinite(n) ? n.toLocaleString("ko-KR") : String(raw);
    } else if (def.type === "date") {
      const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        out[def.key] = `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
      } else {
        out[def.key] = String(raw);
      }
    } else {
      out[def.key] = String(raw).trim();
    }
  }
  // schema에 없지만 들어온 키도 그대로 보존
  for (const k of Object.keys(input)) {
    if (!(k in out)) out[k] = String(input[k] ?? "");
  }
  return out;
}

/** 문자열 내 {{var:key}} 치환 */
function substitute(str, vars) {
  if (!str) return str;
  return String(str).replace(/\{\{var:([^}]+)\}\}/g, (_, key) => {
    return key in vars ? vars[key] : `{{var:${key}}}`;
  });
}

/** TipTap content_json (JSON 문자열) 내 텍스트 노드 치환 */
function substituteJson(json, vars) {
  if (!json) return json;
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    walkAndSubstitute(parsed, vars);
    return JSON.stringify(parsed);
  } catch {
    // 파싱 실패 시 원시 치환만 수행
    return substitute(json, vars);
  }
}

function walkAndSubstitute(node, vars) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((n) => walkAndSubstitute(n, vars)); return; }
  if (node.type === "text" && typeof node.text === "string") {
    node.text = substitute(node.text, vars);
  }
  if (Array.isArray(node.content)) walkAndSubstitute(node.content, vars);
}

module.exports = router;
