/**
 * 감사 로그 조회 API — 파일 기반 일별 JSONL을 화면에서 검색/필터하기 위한 read-only 엔드포인트.
 *
 * 보안 고려:
 *  - admin 전용. manager/staff는 자기 자신을 포함한 다른 운영자의 행적을 볼 수 없다.
 *  - 응답에는 IP/userAgent가 포함되므로 외부 노출 금지 — 무조건 adminAuth + requireRole("admin").
 *  - 파일명은 화이트리스트(YYYY-MM-DD)로 제한해 path traversal을 막는다.
 *
 * 본 라우트는 기존 lib/audit-log.js의 JSONL 구조를 가정한다:
 *  { timestamp, action, resource, resourceId, userId, userName, ip, details }
 */
const { Router } = require("express");
const path = require("path");
const fsp = require("fs").promises;
const { adminAuth, requireRole } = require("../lib/auth");
const { handleError } = require("../lib/route-handler");

const router = Router();

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const AUDIT_DIR = path.join(STORAGE_PATH, "audit");

/** YYYY-MM-DD 화이트리스트 — path traversal 방지 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** 모든 라우트는 admin 전용 */
router.use(adminAuth, requireRole("admin"));

/**
 * GET /api/audit-logs/dates — 로그가 존재하는 날짜 목록 (최신 30일)
 * 화면에서 날짜 셀렉터 채우는 용도.
 */
router.get("/dates", async (req, res) => {
  try {
    let files;
    try {
      files = await fsp.readdir(AUDIT_DIR);
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.json({ data: [], error: null, meta: { total: 0 } });
      }
      throw err;
    }
    const dates = files
      .map((f) => {
        const m = f.match(/^audit-(\d{4}-\d{2}-\d{2})\.jsonl$/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
      .sort()
      .reverse()
      .slice(0, 30);
    res.json({ data: dates, error: null, meta: { total: dates.length } });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/audit-logs?date=YYYY-MM-DD&resource=&action=&userName=&q=&limit=200
 *
 * 단일 일자의 JSONL을 읽어 필터 후 최신순 반환. limit은 1000 상한.
 * 일자 미지정 시 오늘. 현 운영 규모(일 수십~수백 줄)에서 메모리 적재로 충분하다.
 */
router.get("/", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!DATE_REGEX.test(date)) {
      return res.status(400).json({ data: null, error: "올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)", meta: null });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const resource = (req.query.resource || "").trim();
    const action = (req.query.action || "").trim();
    const userName = (req.query.userName || "").trim();
    const q = (req.query.q || "").trim().toLowerCase();

    const filePath = path.join(AUDIT_DIR, `audit-${date}.jsonl`);
    let raw;
    try {
      raw = await fsp.readFile(filePath, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.json({ data: [], error: null, meta: { total: 0, date } });
      }
      throw err;
    }

    const entries = [];
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        const e = JSON.parse(line);
        if (resource && e.resource !== resource) continue;
        if (action && e.action !== action) continue;
        if (userName && (e.userName || "").indexOf(userName) === -1) continue;
        if (q) {
          const hay = `${e.action} ${e.resource} ${e.userName || ""} ${e.ip || ""} ${JSON.stringify(e.details || {})}`.toLowerCase();
          if (hay.indexOf(q) === -1) continue;
        }
        entries.push(e);
      } catch {
        // 손상된 라인은 무시
      }
    }

    // 최신순(같은 일자라면 timestamp 내림차순)
    entries.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    const sliced = entries.slice(0, limit);

    res.json({
      data: sliced,
      error: null,
      meta: { total: entries.length, returned: sliced.length, date, limit },
    });
  } catch (e) {
    handleError(res, e);
  }
});

/**
 * GET /api/audit-logs/summary?date=YYYY-MM-DD — 일자별 요약 통계
 * action별·resource별 카운트로 대시보드용 카드를 그릴 수 있게 한다.
 */
router.get("/summary", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!DATE_REGEX.test(date)) {
      return res.status(400).json({ data: null, error: "올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)", meta: null });
    }

    const filePath = path.join(AUDIT_DIR, `audit-${date}.jsonl`);
    let raw;
    try {
      raw = await fsp.readFile(filePath, "utf-8");
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.json({
          data: { total: 0, byAction: {}, byResource: {}, byUser: {} },
          error: null, meta: { date },
        });
      }
      throw err;
    }

    const byAction = {};
    const byResource = {};
    const byUser = {};
    let total = 0;

    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        const e = JSON.parse(line);
        total += 1;
        byAction[e.action] = (byAction[e.action] || 0) + 1;
        byResource[e.resource] = (byResource[e.resource] || 0) + 1;
        const u = e.userName || e.userId || "unknown";
        byUser[u] = (byUser[u] || 0) + 1;
      } catch {
        // skip
      }
    }

    res.json({
      data: { total, byAction, byResource, byUser },
      error: null,
      meta: { date },
    });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
