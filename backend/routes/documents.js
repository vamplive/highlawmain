/**
 * 문서 API 라우트
 * - CRUD, FTS5 검색, 파일 업로드 (PDF/MD/TXT/HTML), 마크다운 자동 분석
 * - 비즈니스 로직은 services/document-service.js에 위임
 */
const { Router } = require("express");
const logger = require("../lib/logger");
const { handleError } = require("../lib/route-handler");
const multer = require("multer");
const path = require("path");
const fsp = require("fs").promises;
const crypto = require("crypto");
const { sqlite } = require("../db");
const { analyzeMarkdown } = require("../lib/markdown-analyzer");
const documentService = require("../services/document-service");
const { adminAuth } = require("../lib/auth");

const router = Router();

/** 파일 저장 루트 경로 — STORAGE_PATH 환경변수 또는 backend/data */
const STORAGE_ROOT = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/documents — list with pagination & filters
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await documentService.listDocuments(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/documents/search — FTS5 search
router.get("/search", adminAuth, async (req, res) => {
  try {
    const results = documentService.searchDocuments(req.query.q, req.query.limit);
    res.json({ data: results, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/documents — create
router.post("/", adminAuth, async (req, res) => {
  try {
    const inserted = await documentService.createDocument(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/documents/upload — file upload
router.post("/upload", adminAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 제공되지 않았습니다", meta: null });
    }

    const buffer = req.file.buffer;
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");

    // 허용된 파일 확장자만 처리
    const ALLOWED_EXTENSIONS = ["pdf", "md", "markdown", "txt", "html", "htm"];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        data: null,
        error: `지원하지 않는 파일 형식입니다: .${ext} (허용: ${ALLOWED_EXTENSIONS.join(", ")})`,
        meta: null,
      });
    }

    // MIME 타입 검증
    const ALLOWED_MIMES = {
      pdf: ["application/pdf"],
      md: ["text/markdown", "text/plain", "application/octet-stream"],
      markdown: ["text/markdown", "text/plain", "application/octet-stream"],
      txt: ["text/plain", "application/octet-stream"],
      html: ["text/html", "application/octet-stream"],
      htm: ["text/html", "application/octet-stream"],
    };
    const allowedMimes = ALLOWED_MIMES[ext];
    if (allowedMimes && !allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        data: null,
        error: `잘못된 파일 형식입니다. .${ext} 파일의 MIME 타입이 올바르지 않습니다.`,
        meta: null,
      });
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;

    const relativeDir = path.join("files", year, month);
    const absoluteDir = path.join(STORAGE_ROOT, relativeDir);
    await fsp.mkdir(absoluteDir, { recursive: true });

    const filePath = path.join("data", relativeDir, fileName);
    const absolutePath = path.join(absoluteDir, fileName);
    await fsp.writeFile(absolutePath, buffer);

    let contentPlain = null;
    let fileType = ext;

    if (ext === "pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        contentPlain = parsed.text;
        fileType = "pdf";
      } catch (e) {
        logger.error({ err: e }, "[PDF Parse Error]");
        contentPlain = null;
      }
    } else if (ext === "md" || ext === "markdown") {
      contentPlain = buffer.toString("utf-8");
      fileType = "markdown";
    } else if (ext === "txt") {
      contentPlain = buffer.toString("utf-8");
      fileType = "text";
    } else if (ext === "html" || ext === "htm") {
      contentPlain = buffer.toString("utf-8");
      fileType = "html";
    }

    res.json({
      data: {
        filePath: filePath.replace(/\\/g, "/"),
        contentPlain,
        fileType,
        fileSize: buffer.length,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/documents/upload-markdown — upload markdown file with auto-analysis & document creation
router.post("/upload-markdown", adminAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 제공되지 않았습니다", meta: null });
    }

    const buffer = req.file.buffer;
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const originalName = req.file.originalname;

    if (!["md", "markdown", "txt"].includes(ext)) {
      return res.status(400).json({ data: null, error: "마크다운 및 텍스트 파일만 지원됩니다", meta: null });
    }

    const rawContent = buffer.toString("utf-8");
    const analysis = analyzeMarkdown(rawContent, originalName);

    // 파일 저장
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;
    const relativeDir = path.join("files", year, month);
    const absoluteDir = path.join(STORAGE_ROOT, relativeDir);
    await fsp.mkdir(absoluteDir, { recursive: true });
    const filePath = path.join("data", relativeDir, fileName);
    const absolutePath = path.join(absoluteDir, fileName);
    await fsp.writeFile(absolutePath, buffer);

    // 메타데이터 구성
    const metadataObj = {
      ...analysis.extraMetadata,
      keywords: analysis.keywords,
      structure: analysis.structure,
      analyzedAt: new Date().toISOString(),
      originalFilename: originalName,
    };

    // 문서 생성 + 카테고리 연결을 트랜잭션으로 원자적 처리
    const inserted = sqlite.transaction(() => {
      const insertStmt = sqlite.prepare(`
        INSERT INTO documents (title, document_type, subtitle, author, source, published_date,
          content_markdown, content_plain, summary, status, importance, file_path, file_type, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(
        analysis.title, analysis.documentType, analysis.subtitle,
        analysis.author, analysis.source, analysis.publishedDate,
        analysis.contentMarkdown, analysis.contentPlain, analysis.summary,
        "unread", analysis.importance, filePath.replace(/\\/g, "/"),
        "markdown", JSON.stringify(metadataObj),
      );
      const docId = result.lastInsertRowid;

      // 카테고리 자동 연결
      if (analysis.suggestedCategories && analysis.suggestedCategories.length > 0) {
        const findCatStmt = sqlite.prepare("SELECT id FROM categories WHERE name = ?");
        const linkStmt = sqlite.prepare("INSERT OR IGNORE INTO document_categories (document_id, category_id) VALUES (?, ?)");
        for (const catName of analysis.suggestedCategories) {
          const cat = findCatStmt.get(catName);
          if (cat) linkStmt.run(docId, cat.id);
        }
      }

      // 삽입된 문서 조회하여 반환
      return sqlite.prepare("SELECT * FROM documents WHERE rowid = ?").get(docId);
    })();

    res.json({
      data: {
        document: inserted,
        analysis: {
          documentType: analysis.documentType,
          keywords: analysis.keywords,
          suggestedCategories: analysis.suggestedCategories,
          structure: analysis.structure,
          frontmatter: analysis.frontmatter,
        },
      },
      error: null,
      meta: { message: "Markdown analyzed and document created successfully" },
    });
  } catch (e) {
    handleError(res, e);
  }
});

// POST /api/documents/analyze-markdown — analyze without creating (preview)
router.post("/analyze-markdown", adminAuth, upload.single("file"), async (req, res) => {
  try {
    let rawContent;
    let filename = "";

    if (req.file) {
      rawContent = req.file.buffer.toString("utf-8");
      filename = req.file.originalname;
    } else if (req.body.content) {
      rawContent = req.body.content;
      filename = req.body.filename || "";
    } else {
      return res.status(400).json({ data: null, error: "파일 또는 콘텐츠가 제공되지 않았습니다", meta: null });
    }

    const analysis = analyzeMarkdown(rawContent, filename);
    res.json({ data: analysis, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// GET /api/documents/:id — detail
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const doc = await documentService.getDocument(req.params.id);
    res.json({ data: doc, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// PATCH /api/documents/:id — update
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await documentService.updateDocument(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// DELETE /api/documents/:id — soft then hard delete
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await documentService.deleteDocument(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
