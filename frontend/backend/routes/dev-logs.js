/**
 * 개발 이력 API — dev-logs 디렉토리의 마크다운 파일 목록 조회
 * - 관리자 페이지에서 홈페이지 개발 역사를 확인할 수 있도록 제공
 */
const { Router } = require("express");
const { handleError } = require("../lib/route-handler");
const fsp = require("fs").promises;
const path = require("path");

const router = Router();

const DEV_LOGS_DIR = path.join(__dirname, "..", "..", "dev-logs");

/** GET /api/dev-logs — 개발 이력 목록 */
router.get("/", async (req, res) => {
  try {
    let files;
    try {
      files = (await fsp.readdir(DEV_LOGS_DIR))
        .filter((f) => f.endsWith(".md"))
        .sort()
        .reverse();
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.json({ data: [], error: null, meta: { total: 0 } });
      }
      throw err;
    }

    // 파일 본문은 첫 줄만 필요하므로 병렬로 읽는다
    const logs = await Promise.all(files.map(async (filename) => {
      const content = await fsp.readFile(path.join(DEV_LOGS_DIR, filename), "utf-8");
      const firstLine = content.split("\n").find((l) => l.startsWith("# ")) || "";
      const title = firstLine.replace(/^#\s*/, "").trim();

      // 파일명에서 날짜/번호 추출: 2026-04-05_001_제목.md
      const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{3})_(.+)\.md$/);
      const date = match ? match[1] : "";
      const number = match ? match[2] : "";
      const slug = match ? match[3] : filename;

      return { filename, date, number, slug, title };
    }));

    res.json({ data: logs, error: null, meta: { total: logs.length } });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * 파일명 화이트리스트 — dev-logs 명명 규칙(YYYY-MM-DD_NNN_slug.md)만 허용한다.
 * 블랙리스트(`..`, `/`)는 URL 인코딩이나 NUL 바이트로 우회 가능하므로 사용하지 않는다.
 */
const DEV_LOG_FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}_\d{3}_[A-Za-z0-9가-힣_-]+\.md$/;

/** GET /api/dev-logs/:filename — 개발 이력 상세 (마크다운 원문) */
router.get("/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // 1차 방어: 화이트리스트 패턴 매칭
    if (!DEV_LOG_FILENAME_REGEX.test(filename)) {
      return res.status(400).json({ data: null, error: "잘못된 파일명입니다", meta: null });
    }

    // 2차 방어: resolve 후 디렉토리 prefix 검증 (심볼릭 링크/정규화 우회 방지)
    const filePath = path.resolve(DEV_LOGS_DIR, filename);
    const safeRoot = path.resolve(DEV_LOGS_DIR) + path.sep;
    if (!filePath.startsWith(safeRoot)) {
      return res.status(400).json({ data: null, error: "잘못된 파일명입니다", meta: null });
    }

    try {
      const content = await fsp.readFile(filePath, "utf-8");
      res.json({ data: { filename, content }, error: null, meta: null });
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
      }
      throw err;
    }
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
