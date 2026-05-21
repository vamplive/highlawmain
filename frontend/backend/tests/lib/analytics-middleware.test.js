/**
 * analytics-middleware.js — 페이지 방문 로깅 미들웨어 테스트
 * 경로 스킵(API/admin/정적/업로드)과 INSERT 기록(IP/UA/리퍼러/세션)을 검증한다.
 *
 * CJS require("../db")는 vi.mock으로 가로챌 수 없으므로, 임시 STORAGE_PATH에
 * 실제 SQLite 파일을 두고 검증한다. 테스트 종료 후 파일은 삭제한다.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import fs from "fs";

// STORAGE_PATH는 db 모듈 로드 전에 설정되어야 한다.
// vi.hoisted는 import보다 먼저 실행되므로 path/os를 직접 require한다.
vi.hoisted(() => {
  const nodePath = require("path");
  const nodeOs = require("os");
  const tmpBase = nodePath.join(nodeOs.tmpdir(), `yjlaw-analytics-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  process.env.STORAGE_PATH = tmpBase;
  process.env.__ANALYTICS_TEST_DB_BASE = tmpBase;
});

const analyticsMiddleware = (await import("../../lib/analytics-middleware.js")).default;
const { sqlite } = await import("../../db");

const countStmt = sqlite.prepare("SELECT COUNT(*) as c FROM page_views");
const lastStmt = sqlite.prepare("SELECT * FROM page_views ORDER BY rowid DESC LIMIT 1");
const allStmt = sqlite.prepare("SELECT * FROM page_views ORDER BY rowid ASC");

function mockReq(path, { ua = "Mozilla/5.0", ip = "1.2.3.4", referrer = "", consent = true } = {}) {
  return {
    path,
    ip,
    connection: { remoteAddress: ip },
    get: (name) => {
      const n = name.toLowerCase();
      if (n === "user-agent") return ua;
      if (n === "referrer") return referrer;
      if (n === "cookie") return consent ? "privacy_analytics_consent=granted" : "";
      return "";
    },
  };
}

function clearViews() {
  sqlite.exec("DELETE FROM page_views");
}

afterAll(() => {
  try { sqlite.close(); } catch { /* ignore */ }
  // Windows는 WAL 핸들이 잠깐 잠겨있을 수 있으므로 삭제 실패를 무시한다
  const base = process.env.__ANALYTICS_TEST_DB_BASE;
  if (base && fs.existsSync(base)) {
    try { fs.rmSync(base, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

describe("analyticsMiddleware — 경로 스킵", () => {
  beforeEach(clearViews);

  it("/api/... 요청은 기록하지 않는다", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/api/documents"), {}, next);
    expect(countStmt.get().c).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("/admin... 요청은 기록하지 않는다", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/admin/dashboard"), {}, next);
    expect(countStmt.get().c).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("점(.)이 포함된 경로(정적 자산)는 기록하지 않는다", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/favicon.ico"), {}, next);
    expect(countStmt.get().c).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("/uploads 경로는 기록하지 않는다", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/uploads/2025/image"), {}, next);
    expect(countStmt.get().c).toBe(0);
    expect(next).toHaveBeenCalled();
  });
});

describe("analyticsMiddleware — 기록 동작", () => {
  beforeEach(clearViews);

  it("분석 동의 쿠키가 없으면 공개 페이지도 기록하지 않는다", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/about", { consent: false }), {}, next);
    expect(countStmt.get().c).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("공개 페이지 요청은 page_views에 1행 삽입 + next 통과", () => {
    const next = vi.fn();
    analyticsMiddleware(mockReq("/about"), {}, next);
    expect(countStmt.get().c).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  it("/ 루트는 page='home'으로 기록한다", () => {
    analyticsMiddleware(mockReq("/"), {}, vi.fn());
    const row = lastStmt.get();
    expect(row.page).toBe("home");
    expect(row.path).toBe("/");
  });

  it("하위 경로는 첫 세그먼트를 page로 사용한다", () => {
    analyticsMiddleware(mockReq("/blog/post-1"), {}, vi.fn());
    expect(lastStmt.get().page).toBe("blog");
  });

  it("IP는 마스킹되어 저장되고, UA / referrer는 원본 그대로 저장된다", () => {
    analyticsMiddleware(
      mockReq("/contact", { ua: "TestAgent/9", ip: "10.0.0.1", referrer: "https://search.example" }),
      {},
      vi.fn(),
    );
    const row = lastStmt.get();
    // 평문 IP 저장 금지 — 마지막 옥텟이 0으로 마스킹되어야 한다
    expect(row.ip).toBe("10.0.0.0");
    expect(row.user_agent).toBe("TestAgent/9");
    expect(row.referrer).toBe("https://search.example");
  });

  it("session_id는 16자 hex", () => {
    analyticsMiddleware(mockReq("/services"), {}, vi.fn());
    expect(lastStmt.get().session_id).toMatch(/^[a-f0-9]{16}$/);
  });

  it("같은 IP+UA+날짜는 동일한 session_id", () => {
    const req = mockReq("/a", { ua: "UA-X", ip: "9.9.9.9" });
    analyticsMiddleware(req, {}, vi.fn());
    analyticsMiddleware(req, {}, vi.fn());
    const rows = allStmt.all();
    expect(rows[0].session_id).toBe(rows[1].session_id);
  });

  it("UA가 다르면 session_id도 다르다", () => {
    analyticsMiddleware(mockReq("/a", { ua: "UA-A", ip: "1.1.1.1" }), {}, vi.fn());
    analyticsMiddleware(mockReq("/a", { ua: "UA-B", ip: "1.1.1.1" }), {}, vi.fn());
    const rows = allStmt.all();
    expect(rows[0].session_id).not.toBe(rows[1].session_id);
  });

  it("INSERT 실패가 나도 next는 호출된다 (try/catch 안전망)", () => {
    // id PRIMARY KEY 충돌을 강제하기 위해 randomUUID를 덮어쓴다
    const realUUID = globalThis.crypto?.randomUUID;
    if (globalThis.crypto) globalThis.crypto.randomUUID = () => "fixed-duplicate-id";

    const next = vi.fn();
    analyticsMiddleware(mockReq("/ok-1"), {}, next);
    analyticsMiddleware(mockReq("/ok-2"), {}, next);
    expect(next).toHaveBeenCalledTimes(2);

    if (globalThis.crypto && realUUID) globalThis.crypto.randomUUID = realUUID;
  });
});
